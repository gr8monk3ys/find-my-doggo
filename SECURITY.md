# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to security@lscaturchio.xyz. All security vulnerabilities will be promptly addressed.

Please include the following information in your report:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Measures

- Dependencies are updated weekly via Dependabot.
- Every pull request runs lint, typecheck, unit tests, a production build, and an
  end-to-end browser suite.
- Reporter contact details are never included in any public page or API response.
- Report submission and messaging are rate limited per client, and all input is
  validated server-side.
- Security headers, including a Content-Security-Policy, are set in
  `website/next.config.ts`.

## Disclosure Policy

When we receive a security bug report, we will:
1. Confirm the problem and determine the affected versions
2. Audit code to find any potential similar problems
3. Prepare fixes for all releases still under maintenance
4. Release new security fix versions as soon as possible
