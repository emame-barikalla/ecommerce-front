-- ÉTAPE 2/2 : à exécuter APRÈS avoir créé qa-test-admin@example.com dans Authentication > Users (Auto Confirm coché).

-- Promote a user to admin.
--
-- WHY THIS FILE EXISTS
-- `p0_security.sql` installs a BEFORE UPDATE trigger,
-- `prevent_role_change()`, which rejects any role change unless
-- `public.is_admin()` returns true. `is_admin()` reads `auth.uid()`,
-- and the Supabase SQL editor runs with no JWT, so `auth.uid()` is
-- NULL there and `is_admin()` is false. A plain
--
--     update public.profiles set role = 'admin' where ...
--
-- therefore always fails with:
--
--     ERROR: P0001: Only admins can change roles
--
-- That makes the FIRST admin impossible to create through the
-- trigger. This script suspends the trigger for the length of one
-- transaction, promotes the user, and switches it straight back on.
--
-- HOW TO RUN
--   1. Create the user first: Supabase dashboard →
--      Authentication → Users → Add user. Tick "Auto Confirm User".
--   2. Edit the email on the marked line below.
--   3. Paste the whole file into the SQL editor and run it.


BEGIN;

-- Fails loudly if the profile row is missing, rather than silently
-- updating zero rows and looking like it worked.
DO $$
DECLARE
  target_email text := 'qa-test-admin@example.com';
  found_id uuid;
BEGIN
  SELECT id INTO found_id FROM public.profiles WHERE email = target_email;

  IF found_id IS NULL THEN
    RAISE EXCEPTION
      'No profile found for %. Create the user in Authentication → Users first; the handle_new_user trigger then creates the profile row.',
      target_email;
  END IF;

  -- Suspend the escalation guard for this transaction only.
  ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_role_change;

  UPDATE public.profiles SET role = 'admin' WHERE id = found_id;

  ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_role_change;

  RAISE NOTICE 'Promoted % to admin.', target_email;
END $$;

COMMIT;

-- Verify. Expect exactly one row, role = 'admin'.
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
