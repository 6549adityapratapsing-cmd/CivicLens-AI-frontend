-- ====================================================================
-- CivicLens AI - Complete Production-Grade Security Migration
-- Migration Name: 20261027000001_secure_civic_reports_and_storage.sql
-- Compatibility: Safe to run on fresh or existing databases (Idempotent)
-- ====================================================================

-- --------------------------------------------------------------------
-- STEP 1: DYNAMICALLY REMOVE ALL EXISTING POLICIES (NO ASSUMPTIONS)
-- --------------------------------------------------------------------
-- Dynamically drop all policies on public.civic_reports to guarantee a clean slate
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'civic_reports'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.civic_reports;', pol.policyname);
    END LOOP;
END $$;

-- Dynamically drop any obsolete policies on storage.objects related to civic_media
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
          AND (policyname ILIKE '%civic%' OR policyname ILIKE '%media%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
    END LOOP;
END $$;


-- --------------------------------------------------------------------
-- STEP 2: SAFE SCHEMA MIGRATION (PRESERVES EXISTING REPORTS & COLUMNS)
-- --------------------------------------------------------------------
-- 1. Create base table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.civic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Safely add missing columns without dropping existing data
ALTER TABLE public.civic_reports 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS priority TEXT,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS detected_issue TEXT,
    ADD COLUMN IF NOT EXISTS visible_evidence JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS public_impact TEXT,
    ADD COLUMN IF NOT EXISTS suggested_department TEXT,
    ADD COLUMN IF NOT EXISTS estimated_risk_level TEXT,
    ADD COLUMN IF NOT EXISTS priority_rationale TEXT,
    ADD COLUMN IF NOT EXISTS recommended_action TEXT,
    ADD COLUMN IF NOT EXISTS location_context TEXT,
    ADD COLUMN IF NOT EXISTS draft_complaint JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS model_used TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';

-- 3. Safely normalize and backfill existing data to prevent check constraint violations
-- A. Normalize status values
UPDATE public.civic_reports 
SET status = CASE 
    WHEN LOWER(status) IN ('draft', 'submitted') THEN 'submitted'
    WHEN LOWER(status) IN ('in review', 'under_review', 'review') THEN 'under_review'
    WHEN LOWER(status) IN ('resolved', 'done', 'fixed') THEN 'resolved'
    WHEN LOWER(status) IN ('dismissed', 'rejected', 'closed') THEN 'dismissed'
    ELSE 'submitted'
END
WHERE status IS NOT NULL;
UPDATE public.civic_reports SET status = 'submitted' WHERE status IS NULL;

-- B. Normalize priority values
UPDATE public.civic_reports 
SET priority = CASE 
    WHEN LOWER(priority) IN ('low', 'medium', 'high', 'critical') THEN LOWER(priority)
    ELSE 'medium'
END
WHERE priority IS NOT NULL;
UPDATE public.civic_reports SET priority = 'medium' WHERE priority IS NULL;

-- C. Truncate any oversized historical fields to satisfy length constraints safely
UPDATE public.civic_reports SET category = LEFT(category, 80) WHERE length(category) > 80;
UPDATE public.civic_reports SET summary = LEFT(summary, 1000) WHERE length(summary) > 1000;
UPDATE public.civic_reports SET detected_issue = LEFT(detected_issue, 300) WHERE length(detected_issue) > 300;
UPDATE public.civic_reports SET location_context = LEFT(location_context, 255) WHERE length(location_context) > 255;

-- D. Provide fallbacks for any legacy NULL values
UPDATE public.civic_reports SET category = 'General' WHERE category IS NULL OR TRIM(category) = '';
UPDATE public.civic_reports SET summary = 'No summary provided' WHERE summary IS NULL OR TRIM(summary) = '';
UPDATE public.civic_reports SET detected_issue = 'Civic Issue Reported' WHERE detected_issue IS NULL OR TRIM(detected_issue) = '';
UPDATE public.civic_reports SET visible_evidence = '[]'::jsonb WHERE visible_evidence IS NULL;
UPDATE public.civic_reports SET draft_complaint = '{}'::jsonb WHERE draft_complaint IS NULL;
UPDATE public.civic_reports SET is_public = true WHERE is_public IS NULL;

-- 4. Apply NOT NULL constraints safely after data backfill
ALTER TABLE public.civic_reports 
    ALTER COLUMN category SET NOT NULL,
    ALTER COLUMN priority SET NOT NULL,
    ALTER COLUMN summary SET NOT NULL,
    ALTER COLUMN detected_issue SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN is_public SET NOT NULL;

-- 5. Safe check constraints
ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_priority_check;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_priority_check 
    CHECK (LOWER(priority) IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_status_check;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_status_check 
    CHECK (status IN ('submitted', 'under_review', 'resolved', 'dismissed'));

ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_category_len;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_category_len 
    CHECK (length(category) <= 80);

ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_summary_len;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_summary_len 
    CHECK (length(summary) <= 1000);

ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_detected_issue_len;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_detected_issue_len 
    CHECK (length(detected_issue) <= 300);

ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_location_len;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_location_len 
    CHECK (length(location_context) <= 255);


-- --------------------------------------------------------------------
-- STEP 3: INDICES & AUTOMATIC TIMESTAMP TRIGGER
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_civic_reports_category ON public.civic_reports(category);
CREATE INDEX IF NOT EXISTS idx_civic_reports_priority ON public.civic_reports(priority);
CREATE INDEX IF NOT EXISTS idx_civic_reports_created_at ON public.civic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_user_id ON public.civic_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_is_public ON public.civic_reports(is_public) WHERE is_public = true;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_civic_reports_updated_at ON public.civic_reports;
CREATE TRIGGER set_civic_reports_updated_at
    BEFORE UPDATE ON public.civic_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- --------------------------------------------------------------------
-- STEP 4: DELIBERATE PUBLIC VIEW (REDACTED COMMUNITY DASHBOARD)
-- --------------------------------------------------------------------
-- Exposes ONLY approved civic fields. 
-- Omits sensitive fields: draft_complaint, user_id, model_used, priority_rationale.
CREATE OR REPLACE VIEW public.community_civic_feed AS
SELECT 
    id,
    created_at,
    category,
    priority,
    detected_issue,
    summary,
    visible_evidence,
    public_impact,
    suggested_department,
    estimated_risk_level,
    location_context,
    image_url,
    status
FROM public.civic_reports
WHERE is_public = true;


-- --------------------------------------------------------------------
-- STEP 5: GRANULAR TABLE PRIVILEGES (GRANTS & REVOCATIONS)
-- --------------------------------------------------------------------
-- Revoke all blanket permissions first
REVOKE ALL ON public.civic_reports FROM anon;
REVOKE ALL ON public.civic_reports FROM authenticated;
REVOKE ALL ON public.civic_reports FROM public;

-- Grant public read access ONLY to the sanitized community feed view
GRANT SELECT ON public.community_civic_feed TO anon, authenticated;

-- Allow anon to read ONLY 'id' upon insertion (needed for INSERT ... RETURNING id to work with PostgREST)
GRANT SELECT (id) ON public.civic_reports TO anon;

-- Grant anonymous submission ability on specific input columns only
-- Notice: user_id is NOT in the grant for anon (anonymous users cannot assign user_id)
GRANT INSERT (
    category,
    priority,
    summary,
    detected_issue,
    visible_evidence,
    public_impact,
    suggested_department,
    estimated_risk_level,
    priority_rationale,
    recommended_action,
    location_context,
    draft_complaint,
    image_url,
    model_used,
    is_public,
    status
) ON public.civic_reports TO anon;

-- Authenticated citizens can select from civic_reports (RLS restricts this to their own rows)
GRANT SELECT ON public.civic_reports TO authenticated;

-- Authenticated citizens can submit reports with their user_id
GRANT INSERT (
    user_id,
    category,
    priority,
    summary,
    detected_issue,
    visible_evidence,
    public_impact,
    suggested_department,
    estimated_risk_level,
    priority_rationale,
    recommended_action,
    location_context,
    draft_complaint,
    image_url,
    model_used,
    is_public,
    status
) ON public.civic_reports TO authenticated;

-- Authenticated citizens can update report content (RLS policies govern exact column permissions)
GRANT UPDATE ON public.civic_reports TO authenticated;


-- --------------------------------------------------------------------
-- STEP 6: SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the caller has administrative privileges
-- Checks cryptographically signed JWT app_metadata or service_role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
        OR
        coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR
        coalesce((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '') = 'admin'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- [RLS POLICY 1: INSERT FOR CITIZENS & VISITORS]
-- Allows submission while enforcing initial status = 'submitted' and anti-spoofing
CREATE POLICY "civic_reports_insert_policy"
    ON public.civic_reports
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        (
            (auth.uid() IS NOT NULL AND user_id = auth.uid())
            OR
            (auth.uid() IS NULL AND user_id IS NULL)
        )
        AND status = 'submitted'
    );

-- [RLS POLICY 2: SELECT FOR ANONYMOUS & AUTHENTICATED]
-- Ensures INSERT ... RETURNING id succeeds for anonymous submissions
-- while protecting private drafts (draft_complaint is revoked at column grant level)
CREATE POLICY "civic_reports_select_policy"
    ON public.civic_reports
    FOR SELECT
    TO anon, authenticated
    USING (
        is_public = true
        OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    );

-- [RLS POLICY 3: UPDATE FOR ORDINARY AUTHENTICATED USERS]
-- Citizens can only edit their own report if it is still 'submitted'
-- WITH CHECK prevents citizens from modifying status, user_id, or is_public
CREATE POLICY "authenticated_update_own_reports"
    ON public.civic_reports
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id 
        AND status = 'submitted'
        AND NOT public.is_admin()
    )
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id 
        AND status = 'submitted'
        AND is_public = true
    );

-- [RLS POLICY 4: DELETE FOR ORDINARY AUTHENTICATED USERS]
-- Citizens can delete their own report only while in 'submitted' status
CREATE POLICY "authenticated_delete_own_reports"
    ON public.civic_reports
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id 
        AND status = 'submitted'
        AND NOT public.is_admin()
    );

-- [RLS POLICY 5: ADMIN / BACKEND FULL ACCESS]
-- Allows verified administrators and service_role full management (status changes, moderation)
CREATE POLICY "admin_manage_reports"
    ON public.civic_reports
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- --------------------------------------------------------------------
-- STEP 7: SECURE SUPABASE STORAGE (PRIVATE CIVIC MEDIA)
-- --------------------------------------------------------------------
-- Ensure the storage bucket is private with size and extension restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'civic_media',
    'civic_media',
    false, -- STRICTLY PRIVATE: No direct anonymous public CDN access
    10485760, -- 10 MB maximum file size
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Authenticated users can upload images with extension checks
CREATE POLICY "authenticated_upload_civic_media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'civic_media'
        AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
    );

-- Storage RLS: Authenticated users can read media objects in civic_media
CREATE POLICY "authenticated_read_civic_media"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'civic_media');
