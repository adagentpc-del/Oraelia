-- Row-Level Security policies for Oralia (defense-in-depth beneath the
-- application's per-user query scoping).
--
-- Apply with: psql "$DATABASE_URL" -f lib/db/rls.sql
--
-- How it works: the API wraps queries in a transaction that sets the
-- `app.user_id` GUC via lib/db `runAsUser(userId, fn)`. These policies make
-- Postgres itself refuse to return or mutate rows belonging to other users,
-- even if an application bug drops a WHERE clause.
--
-- FORCE ROW LEVEL SECURITY is required because the application connects as
-- the table owner, and owners bypass plain RLS.
--
-- Note: queries issued OUTSIDE runAsUser (no app.user_id set) will see no
-- rows in these tables once this is applied. Migrations and admin work
-- should use a superuser role or `SET row_security = off` where permitted.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'goals', 'daily_checkins', 'generated_guidance',
    'generated_content', 'chakra_assessments', 'relationship_profiles',
    'location_profiles', 'life_events', 'auth_tokens'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS user_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY user_isolation ON %I FOR ALL
         USING (user_id = NULLIF(current_setting(''app.user_id'', true), '''')::int)
         WITH CHECK (user_id = NULLIF(current_setting(''app.user_id'', true), '''')::int)',
      t
    );
  END LOOP;
END $$;

-- users: a user may see and update only their own row. (Auth lookups by
-- email during login run through runAsSystem — see lib/db.)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS self_row ON users;
CREATE POLICY self_row ON users FOR ALL
  USING (id = NULLIF(current_setting('app.user_id', true), '')::int)
  WITH CHECK (id = NULLIF(current_setting('app.user_id', true), '')::int);
DROP POLICY IF EXISTS system_access ON users;
CREATE POLICY system_access ON users FOR ALL
  USING (current_setting('app.system', true) = 'on')
  WITH CHECK (current_setting('app.system', true) = 'on');
