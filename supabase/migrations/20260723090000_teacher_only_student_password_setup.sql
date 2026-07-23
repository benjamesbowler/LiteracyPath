-- Make symbol-password creation and reset teacher-only.
--
-- The child login still shows the code-gated class roster, but a pupil whose
-- pictures are not configured must ask a teacher for help. Teachers manage the
-- symbol_password column through the authenticated dashboard under RLS.
--
-- PostgreSQL functions are executable by PUBLIC by default, so revoke both the
-- old two-argument helper and the later class-code-gated overload explicitly.

revoke execute on function public.student_set_password(uuid, text)
  from public, anon, authenticated;

revoke execute on function public.student_set_password(uuid, text, text)
  from public, anon, authenticated;
