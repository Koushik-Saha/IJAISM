# C5K Platform Security Audit & Bug Report

This report summarizes the security vulnerabilities identified and remediated during the Bug Bounty audit.

## Executive Summary

A total of **10 vulnerabilities** were discovered, including **4 High/Critical** risks. All identified issues have been successfully remediated to harden the platform against modern attack vectors.

---

| Severity | Vulnerability | Location | Status |
| :--- | :--- | :--- | :--- |
| **🛑 Critical** | **Arbitrary File Write (Path Traversal)** | `/api/upload` | ✅ Fixed |
| **🔴 High** | **Stored XSS in Article Body** | `/articles/[id]/html` | ✅ Fixed |
| **🔴 High** | **Server-Side Request Forgery (SSRF)** | `/api/secure-file` | ✅ Fixed |
| **🔴 High** | **Sensitive Token Exposure** | `/api/auth/register` | ✅ Fixed |
| **🟡 Medium** | **Insecure Auth Config (Weak Secret)** | `lib/auth.ts` | ✅ Fixed |
| **🟡 Medium** | **User/Email Enumeration** | `/api/auth/register` | ✅ Fixed |
| **🟡 Medium** | **Missing Rate Limiting** | `/api/auth/reset-password`| ✅ Fixed |
| **🟡 Medium** | **Verbose Error Responses** | Global API Utility | ✅ Fixed |
| **🔵 Low** | **Insecure Token Signing (Alg)** | `lib/auth.ts` | ✅ Fixed |
| **🔵 Low** | **Unprotected Virus Scanning Mock**| `lib/security/virus.ts` | ✅ Warning Added |

---

## Detailed Vulnerability Analysis

### 1. Arbitrary File Write (Path Traversal)
- **Problem:** The `fileType` parameter was used directly in directory construction, allowing attackers to write files anywhere on the server using `../` patterns.
- **Remediation:** Implemented a strict allowlist for `fileType` and added path sanitization to strip traversal characters.

### 2. Stored Cross-Site Scripting (XSS)
- **Problem:** Article content (HTML) was rendered using `dangerouslySetInnerHTML` without sanitization, allowing malicious scripts to execute in other users' browsers.
- **Remediation:** Integrated `sanitize-html` to clean all article bodies before rendering, ensuring dangerous tags and attributes are removed.

### 3. Server-Side Request Forgery (SSRF)
- **Problem:** The server would fetch any URL provided in a signed token, allowing it to be used as a proxy to probe internal networks or cloud metadata.
- **Remediation:** Implemented a strict domain allowlist (`s3.amazonaws.com`, `vercel-storage.com`) for all remote file requests.

### 4. Registration Token Leakage
- **Problem:** The `verificationToken` was returned in the registration API response, allowing anyone to verify an account without email access.
- **Remediation:** Removed the token from the API response payload.

### 5. Authentication Hardening
- **JWT Secret:** Removed the hardcoded 'your-secret-key' fallback. The server now crashes on startup if `JWT_SECRET` is missing, preventing an insecure state.
- **JWT Algorithm:** Explicitly specified `HS256` for signing and verification to prevent algorithm confusion attacks.
- **Rate Limiting:** Added brute-force protection to the password reset endpoint.

## Future Recommendations
- Implement a comprehensive **Content Security Policy (CSP)**.
- Move from Bearer tokens in `localStorage` to **HttpOnly, Secure Cookies**.
- Integrate a real-time malware scanner (ClamAV) for all uploaded documents.
