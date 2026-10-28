-- ==============================================================================
-- CivicLens AI — Complete Production-Grade Supabase Schema & Security Migration
-- Migration Name: 20261028000001_complete_civic_governance_schema.sql
-- Compatibility: Safe to run on empty databases or existing schemas (Idempotent)
-- NOTICE: Code updated with all security and compatibility review corrections.
--         DO NOT EXECUTE AUTOMATICALLY. User approval required before execution.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & SEQUENCES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS public.civic_complaint_seq START WITH 100001;

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Citizen & Officer Role Segregation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
    department_id TEXT, -- E.g. 'demo-pwd-roads', 'demo-nagar-nigam', etc.
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);

-- Auto-sync new users into public.profiles
-- HARDENED: Client-controlled raw_user_meta_data can NEVER grant officer or admin roles.
-- Elevated roles ('officer', 'admin') may ONLY be assigned via server-side raw_app_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, role, department_id, full_name, phone)
    VALUES (
        NEW.id,
        CASE 
            WHEN NEW.raw_app_meta_data->>'role' IN ('officer', 'admin') THEN NEW.raw_app_meta_data->>'role'
            ELSE 'citizen'
        END,
        CASE 
            WHEN NEW.raw_app_meta_data->>'role' IN ('officer', 'admin') THEN NEW.raw_app_meta_data->>'department_id'
            ELSE NULL
        END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Citizen'),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Helper functions for RLS access control (All with safe search_path)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_current_user_department()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
    RETURN (
        SELECT department_id FROM public.profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
    RETURN (
        COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
        OR
        COALESCE((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR
        COALESCE((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'), '') = 'admin'
        OR
        public.get_current_user_role() = 'admin'
    );
END;
$$ LANGUAGE plpgsql;

-- Trusted Administrative Function to Assign User Roles
CREATE OR REPLACE FUNCTION public.assign_user_role(
    target_user_id UUID,
    new_role TEXT,
    new_department_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can assign roles.';
    END IF;

    IF new_role NOT IN ('citizen', 'officer', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: Must be citizen, officer, or admin.';
    END IF;

    UPDATE public.profiles
    SET role = new_role,
        department_id = CASE WHEN new_role IN ('officer', 'admin') THEN new_department_id ELSE NULL END,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. CIVIC COMPLAINTS TABLE (public.civic_reports)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.civic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.civic_reports 
    ADD COLUMN IF NOT EXISTS reference_number TEXT,
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
    ADD COLUMN IF NOT EXISTS department_id TEXT,
    ADD COLUMN IF NOT EXISTS estimated_risk_level TEXT,
    ADD COLUMN IF NOT EXISTS priority_rationale TEXT,
    ADD COLUMN IF NOT EXISTS recommended_action TEXT,
    ADD COLUMN IF NOT EXISTS location_context TEXT,
    ADD COLUMN IF NOT EXISTS draft_complaint JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS model_used TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted',
    ADD COLUMN IF NOT EXISTS expected_completion_date TIMESTAMPTZ;

-- Backfill reference numbers for existing records safely
UPDATE public.civic_reports
SET reference_number = 'CIVIC-2026-' || LPAD(nextval('public.civic_complaint_seq')::text, 6, '0')
WHERE reference_number IS NULL;

-- Enforce unique index on reference_number safely
CREATE UNIQUE INDEX IF NOT EXISTS idx_civic_reports_ref_number_unique 
    ON public.civic_reports(reference_number);

-- Automatically assign reference numbers on new insert
CREATE OR REPLACE FUNCTION public.handle_civic_report_defaults()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.reference_number IS NULL THEN
        NEW.reference_number := 'CIVIC-' || TO_CHAR(timezone('utc'::text, now()), 'YYYY') || '-' || LPAD(nextval('public.civic_complaint_seq')::text, 6, '0');
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_civic_report_defaults ON public.civic_reports;
CREATE TRIGGER trg_civic_report_defaults
    BEFORE INSERT ON public.civic_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_civic_report_defaults();

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
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

-- Safe Status Normalization of pre-existing records before constraint enforcement
-- Preserves unknown/custom statuses to prevent destructive data loss
UPDATE public.civic_reports
SET status = CASE LOWER(TRIM(status))
    WHEN 'submitted' THEN 'submitted'
    WHEN 'draft' THEN 'submitted'
    WHEN 'in review' THEN 'under_review'
    WHEN 'under_review' THEN 'under_review'
    WHEN 'action planned' THEN 'action_planned'
    WHEN 'action_planned' THEN 'action_planned'
    WHEN 'resolved' THEN 'resolved'
    WHEN 'done' THEN 'resolved'
    WHEN 'fixed' THEN 'resolved'
    WHEN 'rejected' THEN 'dismissed'
    WHEN 'dismissed' THEN 'dismissed'
    WHEN 'closed' THEN 'dismissed'
    ELSE status
END
WHERE status IS NOT NULL;

-- Safe constraints
ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_priority_check;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_priority_check 
    CHECK (LOWER(priority) IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.civic_reports DROP CONSTRAINT IF EXISTS civic_reports_status_check;
ALTER TABLE public.civic_reports ADD CONSTRAINT civic_reports_status_check 
    CHECK (status IN ('submitted', 'under_review', 'action_planned', 'resolved', 'dismissed', 'escalated'));

CREATE INDEX IF NOT EXISTS idx_civic_reports_category ON public.civic_reports(category);
CREATE INDEX IF NOT EXISTS idx_civic_reports_priority ON public.civic_reports(priority);
CREATE INDEX IF NOT EXISTS idx_civic_reports_status ON public.civic_reports(status);
CREATE INDEX IF NOT EXISTS idx_civic_reports_created_at ON public.civic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_user_id ON public.civic_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_department ON public.civic_reports(department_id);

-- ------------------------------------------------------------------------------
-- 4. COMPLAINT UPDATES & TIMELINE (History, Officer Reports & Citizen Replies)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.civic_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    update_type TEXT NOT NULL CHECK (
        update_type IN ('status_change', 'progress_update', 'inspection', 'officer_reply', 'citizen_reply', 'system_event')
    ),
    old_status TEXT,
    new_status TEXT,
    note TEXT NOT NULL,
    work_done TEXT,
    work_planned TEXT,
    inspection_findings TEXT,
    next_steps TEXT,
    expected_completion_date TIMESTAMPTZ,
    media_urls JSONB DEFAULT '[]'::jsonb,
    is_internal_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_complaint_updates_complaint ON public.complaint_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_user ON public.complaint_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_created_at ON public.complaint_updates(created_at ASC);

-- Automatic Audit History & Status Synchronization Trigger
-- When an authorized officer or admin inserts a status_change update,
-- automatically syncs civic_reports.status and records true old_status safely.
CREATE OR REPLACE FUNCTION public.sync_complaint_status_from_update()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_report_status TEXT;
BEGIN
    -- Look up current complaint status
    SELECT status INTO current_report_status
    FROM public.civic_reports
    WHERE id = NEW.complaint_id;

    IF current_report_status IS NULL THEN
        RAISE EXCEPTION 'Target complaint does not exist.';
    END IF;

    -- Automatically populate true previous status in audit record
    IF NEW.old_status IS NULL THEN
        NEW.old_status := current_report_status;
    END IF;

    -- If this is a status change, validate permissions and update parent complaint
    IF NEW.update_type = 'status_change' AND NEW.new_status IS NOT NULL THEN
        IF NEW.new_status NOT IN ('submitted', 'under_review', 'action_planned', 'resolved', 'dismissed', 'escalated') THEN
            RAISE EXCEPTION 'Invalid new_status value: %', NEW.new_status;
        END IF;

        -- Update parent complaint status and SLA expected date if provided
        UPDATE public.civic_reports
        SET status = NEW.new_status,
            expected_completion_date = COALESCE(NEW.expected_completion_date, public.civic_reports.expected_completion_date),
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.complaint_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_complaint_status ON public.complaint_updates;
CREATE TRIGGER trg_sync_complaint_status
    BEFORE INSERT ON public.complaint_updates
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_complaint_status_from_update();

-- ------------------------------------------------------------------------------
-- 5. REDACTED PUBLIC COMMUNITY FEED VIEW
-- ------------------------------------------------------------------------------
-- Uses security_invoker to ensure caller permissions and underlying RLS are respected
CREATE OR REPLACE VIEW public.community_civic_feed
WITH (security_invoker = true)
AS
SELECT 
    id,
    reference_number,
    created_at,
    category,
    priority,
    detected_issue,
    summary,
    visible_evidence,
    public_impact,
    suggested_department,
    department_id,
    estimated_risk_level,
    location_context,
    image_url,
    status,
    expected_completion_date
FROM public.civic_reports
WHERE is_public = true;

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Table: public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id 
        OR public.is_admin()
        OR (public.get_current_user_role() = 'officer' AND department_id = public.get_current_user_department())
    );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        -- Hardened: Prevent role or department modification via client updates
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND (department_id IS NOT DISTINCT FROM (SELECT p.department_id FROM public.profiles p WHERE p.id = auth.uid()))
    );

-- Table: public.civic_reports
ALTER TABLE public.civic_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "civic_reports_insert_policy" ON public.civic_reports;
CREATE POLICY "civic_reports_insert_policy" ON public.civic_reports
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        (
            (auth.uid() IS NOT NULL AND user_id = auth.uid())
            OR
            (auth.uid() IS NULL AND user_id IS NULL)
        )
        AND status = 'submitted'
    );

DROP POLICY IF EXISTS "civic_reports_select_policy" ON public.civic_reports;
CREATE POLICY "civic_reports_select_policy" ON public.civic_reports
    FOR SELECT TO anon, authenticated
    USING (
        is_public = true
        OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        -- Hardened Officer Scoping: Only assigned department or unassigned matching suggested department
        OR (
            public.get_current_user_role() = 'officer' 
            AND (
                department_id = public.get_current_user_department()
                OR (
                    department_id IS NULL 
                    AND suggested_department = public.get_current_user_department()
                )
            )
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "civic_reports_update_policy" ON public.civic_reports;
CREATE POLICY "civic_reports_update_policy" ON public.civic_reports
    FOR UPDATE TO authenticated
    USING (
        -- Citizens can edit their own report while still in submitted state
        (auth.uid() IS NOT NULL AND auth.uid() = user_id AND status = 'submitted')
        -- Hardened Officer Scoping: Only assigned department or unassigned matching suggested department
        OR (
            public.get_current_user_role() = 'officer'
            AND (
                department_id = public.get_current_user_department()
                OR (
                    department_id IS NULL 
                    AND suggested_department = public.get_current_user_department()
                )
            )
        )
        OR public.is_admin()
    );

-- Table: public.complaint_updates
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "complaint_updates_select_policy" ON public.complaint_updates;
CREATE POLICY "complaint_updates_select_policy" ON public.complaint_updates
    FOR SELECT TO anon, authenticated
    USING (
        -- Public updates on public complaints
        (
            NOT is_internal_only 
            AND complaint_id IN (SELECT id FROM public.civic_reports WHERE is_public = true)
        )
        -- Citizens can see non-internal updates on their own reports
        OR (
            auth.uid() IS NOT NULL 
            AND NOT is_internal_only
            AND complaint_id IN (SELECT id FROM public.civic_reports WHERE user_id = auth.uid())
        )
        -- Officers can see all updates (including internal notes) on their department complaints
        OR (
            public.get_current_user_role() = 'officer'
            AND complaint_id IN (
                SELECT id FROM public.civic_reports 
                WHERE department_id = public.get_current_user_department()
                   OR (department_id IS NULL AND suggested_department = public.get_current_user_department())
            )
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "complaint_updates_insert_policy" ON public.complaint_updates;
CREATE POLICY "complaint_updates_insert_policy" ON public.complaint_updates
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Hardened Authorship: Author must match authenticated session
        user_id = auth.uid()
        AND (
            -- Citizen posting reply to their own complaint (never internal, never status change)
            (
                update_type = 'citizen_reply'
                AND is_internal_only = false
                AND new_status IS NULL
                AND complaint_id IN (SELECT id FROM public.civic_reports WHERE user_id = auth.uid())
            )
            -- Officer posting progress update, inspection, or status change to authorized department complaint
            OR (
                public.get_current_user_role() = 'officer'
                AND update_type IN ('status_change', 'progress_update', 'inspection', 'officer_reply')
                AND complaint_id IN (
                    SELECT id FROM public.civic_reports 
                    WHERE department_id = public.get_current_user_department()
                       OR (department_id IS NULL AND suggested_department = public.get_current_user_department())
                )
            )
            OR public.is_admin()
        )
    );

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE (civic_media Private Bucket)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'civic_media',
    'civic_media',
    false, -- Private bucket: access controlled via Signed URLs
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage Upload Policy:
-- - Anon and authenticated citizens can upload evidence to reports/
-- - Officers and admins can upload inspection/progress evidence to progress/ or inspections/
DROP POLICY IF EXISTS "storage_upload_civic_media" ON storage.objects;
CREATE POLICY "storage_upload_civic_media" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        bucket_id = 'civic_media'
        AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
        AND (
            (storage.foldername(name))[1] = 'reports'
            OR (
                (storage.foldername(name))[1] IN ('progress', 'inspections')
                AND auth.uid() IS NOT NULL
                AND (public.get_current_user_role() = 'officer' OR public.is_admin())
            )
        )
    );

-- Storage Read Policy:
-- HARDENED: Anonymous direct bucket reads are REMOVED.
-- Private media access for anonymous citizens is handled via verified temporary Signed URLs.
-- Authenticated users can read their own media or department media.
DROP POLICY IF EXISTS "storage_read_civic_media" ON storage.objects;
CREATE POLICY "storage_read_civic_media" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'civic_media'
        AND (
            owner = auth.uid()
            OR public.get_current_user_role() = 'officer'
            OR public.is_admin()
        )
    );

-- ------------------------------------------------------------------------------
-- 8. TABLE PRIVILEGES & SECURITY HARDENING
-- ------------------------------------------------------------------------------
GRANT SELECT ON public.community_civic_feed TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

GRANT SELECT ON public.civic_reports TO anon, authenticated;
GRANT INSERT (
    category, priority, summary, detected_issue, visible_evidence,
    public_impact, suggested_department, estimated_risk_level,
    priority_rationale, recommended_action, location_context,
    draft_complaint, image_url, model_used, is_public, status
) ON public.civic_reports TO anon;

GRANT INSERT (
    user_id, category, priority, summary, detected_issue, visible_evidence,
    public_impact, suggested_department, department_id, estimated_risk_level,
    priority_rationale, recommended_action, location_context,
    draft_complaint, image_url, model_used, is_public, status
) ON public.civic_reports TO authenticated;

GRANT UPDATE (status, department_id, expected_completion_date, location_context) 
ON public.civic_reports TO authenticated;

GRANT SELECT, INSERT ON public.complaint_updates TO authenticated;

-- Function Execution Privileges
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_department() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT) TO authenticated;
