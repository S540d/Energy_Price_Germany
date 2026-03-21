# Security Audit (2026-03-21)

Scope: npm dependency audit, quick secret scan, and review of exposed edge endpoints. No secrets or keys were found in the repository. Baseline Jest run currently fails due to a pre-existing `react-test-renderer` version mismatch (expected 19.2.0, installed 19.1.0), so tests could not complete successfully.

## Findings
- **High** – Prototype pollution in `flatted@3.4.1` (transitive via `eslint -> file-entry-cache -> flat-cache -> flatted`). `npm audit fix` proposes upgrading to `flatted@3.4.2` without breaking changes. Advisory: GHSA-rf6f-7fwh-wjgh.
- **Low** – `jest-environment-jsdom <=30.0.0` pulls vulnerable `jsdom/http-proxy-agent/@tootallnate/once`. Fix requires upgrading to `jest-environment-jsdom@30.3.0` (breaking) and aligning Jest ecosystem versions. Advisories: GHSA-vpq2-c234-7xj6 (via @tootallnate/once) and related.
- **Medium** – Cloudflare worker (`cloudflare-worker.js`) acts as an unauthenticated public proxy with `Access-Control-Allow-Origin: *`, no rate limiting, and minimal input validation (`plz` forwarded directly). This allows unrestricted third-party use and could enable abuse/DoS against the upstream Energy Charts API.

## Issue drafts (one per finding)

### Issue 1: Upgrade `flatted` dependency to mitigate prototype pollution (High)
- **Context/Evidence:** `npm audit` reports GHSA-rf6f-7fwh-wjgh affecting `flatted <=3.4.1`, pulled via `eslint -> file-entry-cache -> flat-cache -> flatted`. Current lock contains `flatted@3.4.1`.
- **Impact:** Prototype pollution in tooling dependency; risk is primarily in local/CI contexts but should be removed to keep the toolchain compliant.
- **Remediation:** Apply `npm audit fix` (or manually bump `flatted` to `^3.4.2`) and ensure `eslint` resolves to a version that uses the patched flat-cache chain.
- **Acceptance checklist:**
  - [ ] Bump `flatted` to a non-vulnerable version (>=3.4.2) in the lockfile.
  - [ ] Verify `npm audit` no longer reports GHSA-rf6f-7fwh-wjgh.
  - [ ] Run lint/tests to ensure no regressions.

### Issue 2: Update Jest environment to remove transitive vulnerabilities (Low)
- **Context/Evidence:** `npm audit` flags `jest-environment-jsdom` (29.x) via `jsdom -> http-proxy-agent -> @tootallnate/once` (GHSA-vpq2-c234-7xj6). Fix available at `jest-environment-jsdom@30.3.0` (breaking).
- **Impact:** Low-severity vulnerability in dev/test tooling; still recommended to patch to keep CI/test surfaces hardened.
- **Remediation:** Upgrade Jest stack to 30.3.x, including `jest-environment-jsdom`, and align peers (`react-test-renderer` should also be bumped to 19.2.0, which current tests expect).
- **Acceptance checklist:**
  - [ ] Upgrade Jest packages (including `jest-environment-jsdom`) to 30.3.x or newer.
  - [ ] Update related testing peers (`@testing-library/react-native`, `react-test-renderer`, etc.) to satisfy peer requirements.
  - [ ] Verify full Jest suite passes.
  - [ ] Confirm `npm audit` no longer reports the @tootallnate/once chain.

### Issue 3: Harden Cloudflare worker against open proxy abuse (Medium)
- **Context/Evidence:** `cloudflare-worker.js` exposes `Access-Control-Allow-Origin: *`, forwards user-supplied `plz` directly to `https://api.energy-charts.info/signal`, and lacks authentication/rate limiting. This allows any origin to proxy requests through your worker and could overuse the upstream API.
- **Impact:** Potential for abuse/DoS against upstream provider and unexpected bandwidth/cache load on the worker; responses are cacheable and reusable by third parties.
- **Remediation:** Add an origin allowlist or simple API key, validate `plz` format (e.g., numeric length), and consider rate limiting or stricter caching. Return 4xx for invalid/abusive requests.
- **Acceptance checklist:**
  - [ ] Implement origin/API-key guardrail on the worker endpoint.
  - [ ] Validate `plz` input (numeric, length) before forwarding.
  - [ ] Add basic rate limiting or tighter cache TTLs for untrusted traffic.
  - [ ] Retest CORS behavior to ensure only allowed clients can call the worker.
