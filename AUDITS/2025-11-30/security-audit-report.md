# Security Audit Report

## Authentication Risks
- 🟡 Ensure robust token refresh handling; handle network suspension gracefully.

## Authorization Gaps
- 🟠 Confirm RLS policies across all tables match `user_id = auth.uid()`.

## Permission Mistakes
- 🟡 Ensure `external_daily_snapshots` upsert always includes correct `user_id`.

## Sensitive Data Exposure
- 🟢 No secrets in client; logs limited in dev.

## API Access Risks
- 🟠 Missing CSRF and rate-limiting.

## Input Validation Weaknesses
- 🟠 CSV file uploads need size/type validation.

## XSS/CSRF/SQL Injection
- 🟢 SQL parameterized via Supabase; add CSRF for POST routes.

## Token/Secret Leakage
- 🟢 Service role key server-only.

## Logging Sensitive Data
- 🟢 Minimal logging; keep production logs clean.

## File Upload Issues
- 🟠 Limit size; validate `text/csv`.

## Misconfigured Routes/Endpoints
- 🟡 Admin routes must remain server-only.

