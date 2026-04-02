# GitHub Secrets — CI/E2E + Checkly

Last updated: 2026-04-01

Use this checklist in repository **Settings -> Secrets and variables -> Actions**.

## Required Secrets (CI/E2E)

- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_PROFESSIONAL_EMAIL`
- `E2E_PROFESSIONAL_PASSWORD`
- `E2E_PROFESSIONAL_ID`
- `E2E_MANUAL_PROFESSIONAL_ID`
- `E2E_BLOCKED_PROFESSIONAL_ID`

## Required Secrets (Checkly)

- `CHECKLY_API_KEY`
- `CHECKLY_ACCOUNT_ID`

## Optional Variables

- `E2E_BASE_URL`
- `CHECKLY_BASE_URL`

## Pipeline Behavior

1. `CI` workflow blocks `main` push when required E2E secrets are missing.
2. `Checkly Validate` runs synthetic tests and deploy only when `CHECKLY_API_KEY` and `CHECKLY_ACCOUNT_ID` exist.
