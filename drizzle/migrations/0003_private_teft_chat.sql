CREATE TABLE public.chat_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX chat_messages_owner_created ON public.chat_messages(owner_id, created_at);
CREATE FUNCTION public.has_chat_consent(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND popia_accepted_at IS NOT NULL AND popia_version = '2026-10-17');
$$;
REVOKE ALL ON FUNCTION public.has_chat_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_chat_consent(uuid) TO authenticated, service_role;
CREATE POLICY chat_read ON public.chat_messages FOR SELECT TO authenticated USING (
 public.has_chat_consent(auth.uid()) AND (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
);
CREATE POLICY chat_send ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
 public.has_chat_consent(auth.uid()) AND sender_id = auth.uid() AND (
 owner_id = auth.uid() OR (public.has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM public.chat_messages existing WHERE existing.owner_id = chat_messages.owner_id))
 )
);
COMMENT ON TABLE public.chat_messages IS 'Private clergy-to-TEFT conversations. No client update/delete grants; reviewer access is checked against current roles on every request.';