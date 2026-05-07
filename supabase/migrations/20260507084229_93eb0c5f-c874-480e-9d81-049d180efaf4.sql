ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS working_hours text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER TABLE public.jobs REPLICA IDENTITY FULL;