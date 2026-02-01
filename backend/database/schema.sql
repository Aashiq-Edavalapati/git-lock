-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action character varying,
  details jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.lock_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  requester_id uuid,
  request_type text NOT NULL,
  status text DEFAULT 'PENDING'::text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lock_requests_pkey PRIMARY KEY (id),
  CONSTRAINT lock_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT lock_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.project_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  encrypted_blob bytea NOT NULL,
  zip_hash character varying NOT NULL,
  commit_sha character varying,
  github_repo_url character varying,
  staging_url character varying,
  created_at timestamp with time zone DEFAULT now(),
  readme_preview text,
  repo_url text,
  CONSTRAINT project_versions_pkey PRIMARY KEY (id),
  CONSTRAINT project_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  budget numeric,
  client_id uuid,
  developer_email character varying,
  developer_id uuid,
  status character varying DEFAULT 'INVITE_SENT'::character varying CHECK (status::text = ANY (ARRAY['OPEN'::character varying, 'INVITE_SENT'::character varying, 'IN_PROGRESS'::character varying, 'LOCKED_REVIEW'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'REJECTED'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  pending_budget numeric DEFAULT NULL::numeric,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id),
  CONSTRAINT projects_developer_id_fkey FOREIGN KEY (developer_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  password_hash character varying,
  auth_provider character varying DEFAULT 'email'::character varying,
  role character varying CHECK (role::text = ANY (ARRAY['DEVELOPER'::character varying, 'CLIENT'::character varying, 'ADMIN'::character varying]::text[])),
  mfa_secret character varying,
  created_at timestamp with time zone DEFAULT now(),
  github_access_token text,
  google_id character varying,
  github_id character varying,
  avatar_url text,
  google_access_token text,
  bio text,
  payout_methods jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);