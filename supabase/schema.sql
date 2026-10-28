-- ==============================================================================
-- CivicLens AI — Canonical Supabase Schema (Matches 20261028000001)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SEQUENCE IF NOT EXISTS public.civic_complaint_seq START WITH 100001;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
    department_id TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);

-- Civic Reports
CREATE TABLE IF NOT EXISTS public.civic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (LOWER(priority) IN ('low', 'medium', 'high', 'critical')),
    summary TEXT NOT NULL,
    detected_issue TEXT NOT NULL,
    visible_evidence JSONB DEFAULT '[]'::jsonb,
    public_impact TEXT,
    suggested_department TEXT,
    department_id TEXT,
    estimated_risk_level TEXT,
    priority_rationale TEXT,
    recommended_action TEXT,
    location_context TEXT,
    draft_complaint JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    model_used TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'action_planned', 'resolved', 'dismissed', 'escalated')),
    expected_completion_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_civic_reports_category ON public.civic_reports(category);
CREATE INDEX IF NOT EXISTS idx_civic_reports_priority ON public.civic_reports(priority);
CREATE INDEX IF NOT EXISTS idx_civic_reports_status ON public.civic_reports(status);
CREATE INDEX IF NOT EXISTS idx_civic_reports_created_at ON public.civic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_user_id ON public.civic_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_civic_reports_department ON public.civic_reports(department_id);

-- Complaint Updates & Timeline
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

-- Public Community View (with security_invoker = true)
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
