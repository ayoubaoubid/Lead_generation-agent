# Repositories

Repository contracts expose domain-oriented persistence operations. Concrete adapters
will live under provider-specific subdirectories such as `supabase/`, remain
server-only, map database rows explicitly and require a verified `RepositoryContext`.
Generic CRUD repositories and implicit tenant filters are forbidden.
