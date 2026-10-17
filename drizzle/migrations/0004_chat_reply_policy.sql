CREATE FUNCTION public.can_reply_chat(_owner uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM public.chat_messages WHERE owner_id = _owner); $$;
REVOKE ALL ON FUNCTION public.can_reply_chat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_reply_chat(uuid) TO authenticated, service_role;
ALTER POLICY chat_send ON public.chat_messages WITH CHECK (public.has_chat_consent(auth.uid()) AND sender_id = auth.uid() AND (owner_id = auth.uid() OR public.can_reply_chat(owner_id)));