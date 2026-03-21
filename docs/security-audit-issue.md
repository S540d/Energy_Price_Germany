# Security Audit Report — Ready-to-File Issue

**Summary:** Repository-level security audit covering dependencies, tooling, and exposed edge endpoints. No secrets found. Baseline Jest run currently blocked by a peer-version mismatch (`react-test-renderer` 19.1.0 installed vs. 19.2.0 expected).

## Findings

### 1) High — Prototype pollution in `flatted@3.4.1` (transitive via ESLint)
- **Evidence:** `npm audit` flags GHSA-rf6f-7fwh-wjgh; dependency path: `eslint -> file-entry-cache -> flat-cache -> flatted@3.4.1`.
- **Impact:** Prototype pollution in tooling dependency. While scope is mostly local/CI, leaving it unpatched keeps the supply chain non-compliant.
- **Remediation:** Bump to `flatted@>=3.4.2` (e.g., `npm audit fix` or manual lockfile update) and re-run `npm audit` to confirm clearance.
- **Acceptance Criteria:**
  - [ ] Lockfile updated to `flatted >=3.4.2`.
  - [ ] `npm audit` no longer reports GHSA-rf6f-7fwh-wjgh.
  - [ ] Lint/test pipelines still pass.

### 2) Low — Transitive vuln chain via `jest-environment-jsdom` (`@tootallnate/once` / `http-proxy-agent` / `jsdom`)
- **Evidence:** `npm audit` flags GHSA-vpq2-c234-7xj6 through the Jest jsdom stack (`jest-environment-jsdom@29.x`).
- **Impact:** Low-severity control-flow issue in dev/test tooling, but worth fixing to harden CI surfaces.
- **Remediation:** Upgrade Jest stack to `30.3.x` (including `jest-environment-jsdom`), which pulls patched transitive deps. Align peers accordingly (`jest`, `@types/jest`, `@testing-library/react-native`, `react-test-renderer` 19.2.0, etc.).
- **Acceptance Criteria:**
  - [ ] Jest ecosystem upgraded to 30.3.x (or newer) with compatible peers.
  - [ ] `npm audit` no longer reports the `@tootallnate/once` chain.
  - [ ] Full Jest suite passes after version alignment.

### 3) Medium — Cloudflare worker exposed as unauthenticated public proxy
- **Evidence:** `cloudflare-worker.js` sets `Access-Control-Allow-Origin: *`, forwards user-supplied `plz` directly to `https://api.energy-charts.info/signal`, no auth/rate limiting, minimal input validation.
- **Impact:** Potential abuse/DoS of upstream API and cache/bandwidth usage by third parties; unrestricted CORS allows any origin to leverage the proxy.
- **Remediation:** Add allowlist or API key, validate `plz` format (e.g., numeric length), consider rate limiting and tighter cache controls, return 4xx on invalid input.
- **Acceptance Criteria:**
  - [ ] Origin/API-key guardrails enforced.
  - [ ] `plz` validation added (numeric + length).
  - [ ] Basic rate limiting or stricter caching for untrusted traffic.
  - [ ] CORS behavior revalidated for intended clients only.

## Supporting Data
- `npm audit` (post-install) → 5 vulns: 1 high (`flatted`), 4 low (Jest/jsdom chain).
- Test status: `npm test` currently fails early due to `react-test-renderer` 19.1.0 vs. expected 19.2.0 (environmental; unrelated to above findings). Align version before rerunning suites.

## Suggested Issue Title
`Security audit: dependency fixes (flatted, Jest/jsdom) and Cloudflare worker hardening`
