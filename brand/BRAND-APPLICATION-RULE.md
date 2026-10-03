# BELANAR CANONICAL BRAND RETRIEVAL & APPLICATION RULE V1.0

STATUS: USER-APPROVED
DATE: 2026-10-03

PURPOSE
Make the approved Belanar identity the deterministic default for every future Belanar build, channel, app, landing page, agent-facing surface, and vertical.

CANONICAL PRODUCTION SOURCE
Repository: belanar-hq/plenra-core
Path: brand/identity/v1.0/

OPERATIONAL RETRIEVAL FALLBACK
ChatGPT Library: /Belanar/Brand Identity/V1.0/

DISASTER RECOVERY
Google Drive account: plenra.services@gmail.com
Path: Belanar/Brand Identity/V1.0/

MANDATORY BUILD FLOW
NEW BELANAR BUILD
→ FETCH CANONICAL BRAND FROM GITHUB
→ APPLY BRAND GUIDELINES
→ USE APPROVED ASSETS
→ VERIFY IMPLEMENTATION
→ DEPLOY

RULES
1. Do not regenerate, reinterpret, or locally redesign the Belanar logo, wordmark, favicon, core palette, or canonical identity during a build.
2. Use the canonical assets from GitHub. Use Library as operational fallback and Drive only as disaster-recovery source.
3. Current favicon glyph is uppercase B from the canonical wordmark system. Do not substitute lowercase b or a new symbol.
4. The pomegranate meaning remains internal and is not part of the public identity.
5. Water is a capability/wedge, not the master-brand identity. Future verticals inherit the master identity unless a separately governed brand decision explicitly changes this.
6. Any identity change must be intentional, approved, versioned, persisted, and verified. Use V1.1/V2.0 or another explicit version. Never silently overwrite V1.0.
7. A build is not brand-complete until implementation is visually verified against the canonical identity.

VERIFICATION GATE
Before deployment verify:
- canonical asset source used
- wordmark proportions unchanged
- approved favicon used
- approved core colors used
- no unauthorized symbol or vertical-specific master logo introduced
- dark/light treatment is legible
- implementation works at relevant production sizes

AUTHORITY
Local builders, agents, sites, verticals, and campaigns may APPLY the canonical identity.
They may not CHANGE the canonical identity without explicit governed approval.

STATE
BRAND_PATH_KNOWN = TRUE
BRAND_SOURCE_VERSIONED = TRUE
BRAND_APPLICATION_DEFAULT = CANONICAL
LOCAL_REDESIGN_AUTHORITY = FALSE
