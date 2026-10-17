CREATE TABLE public.chat_notification_preferences (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 muted boolean NOT NULL DEFAULT false,
 PRIMARY KEY (user_id, owner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_notification_preferences TO authenticated;
GRANT ALL ON public.chat_notification_preferences TO service_role;
ALTER TABLE public.chat_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_chat_preferences ON public.chat_notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid() AND public.has_chat_consent(auth.uid()) AND (owner_id = auth.uid() OR public.can_reply_chat(owner_id))) WITH CHECK (user_id = auth.uid() AND public.has_chat_consent(auth.uid()) AND (owner_id = auth.uid() OR public.can_reply_chat(owner_id)));