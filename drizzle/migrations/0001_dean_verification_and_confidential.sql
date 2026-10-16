ALTER TABLE public.submissions ADD COLUMN confidential boolean NOT NULL DEFAULT false;

DROP POLICY "read own or admin or accepted" ON public.submissions;
CREATE POLICY "read own or admin or shared" ON public.submissions FOR SELECT TO authenticated
USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role) OR (status = 'accepted' AND NOT confidential)) AND public.has_popia_consent(auth.uid()));

DROP POLICY "read own or admin or accepted files" ON storage.objects;
CREATE POLICY "read own or admin or shared files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submissions' AND public.has_popia_consent(auth.uid()) AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.submissions s WHERE s.file_path = objects.name AND s.status = 'accepted' AND NOT s.confidential)));

CREATE TABLE public.reviewer_invites (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_by uuid,
  used_at timestamptz,
  failed_attempts int NOT NULL DEFAULT 0
);
GRANT ALL ON public.reviewer_invites TO service_role;
ALTER TABLE public.reviewer_invites ENABLE ROW LEVEL SECURITY;