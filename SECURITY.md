# Security notes
- Never commit `.env`; use `.env.example` only.
- Replace all sample passwords and secrets before running.
- PostgreSQL is attached only to the internal backend network; no host port is published.
- Nginx adds baseline security headers and hides `/metrics` externally.
- The Node app uses a single environment-configured login, signed HttpOnly/SameSite session cookie, login rate limiting, Helmet, request-size limits, parameterized SQL, non-root execution, read-only root filesystem and dropped capabilities.
- pgAdmin binds to 127.0.0.1 by default and is enabled only with the `admin` profile.
- The demo login is shared by all users and has no roles or per-user permissions. Replace sample credentials and session secret; do not expose publicly without TLS, backups and proper secret management.
