---
title: "Vercel Production Alias Not Reassigned, Stale Bundle Cache, and Branch Reconciliation"
date: 2026-05-06
category: workflow-issues
module: deployment
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "Deploying widget bundle changes to Vercel that should be immediately visible to embedded widget users"
  - "Promoting a Vercel preview deployment to production with a custom alias"
  - "Branches have diverged and production is running a commit not on the default branch"
tags:
  - vercel
  - deployment
  - cache-control
  - branch-management
  - git
  - production-alias
  - bundle-serving
---

# Vercel Production Alias Not Reassigned, Stale Bundle Cache, and Branch Reconciliation

## Context

After deploying a link visibility fix, the embedded widget continued serving old code despite the Vercel dashboard showing a successful production deployment. Investigation revealed three compounding issues: (1) the Vercel production alias didn't move to the new deployment after promotion, (2) the `/api/embed/bundle.js` route had a 1-year browser cache, and (3) `main` and `master` branches had diverged by 31 commits with production running from an old commit.

## Guidance

### 1. Vercel alias promotion requires explicit verification

After promoting a deployment in the Vercel dashboard or CLI, the named alias (e.g., `chat-interface-r.vercel.app`) does not always automatically reassign. Always verify and explicitly promote:

```bash
# After deploying, verify the alias target
vercel inspect chat-interface-r.vercel.app --scope polingerai

# If alias still points to old deployment, explicitly promote
vercel promote <new-deployment-url> --scope polingerai

# Confirm
vercel ls chat-interface-r --scope polingerai
```

### 2. Mutable JS bundles must not use long cache TTLs

A stable URL like `/api/embed/bundle.js` that changes content on each deploy must not use immutable caching:

```typescript
// Before (1-year cache — stale bundles persist for months)
'Cache-Control': 'public, max-age=31536000, immutable'

// After (1-hour cache with background revalidation)
'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400, no-transform'
```

Long-TTL immutable caching (`max-age=31536000`) is only safe for content-addressed filenames where the hash changes with content (e.g., `bundle.abc123.js`). A stable URL that changes in place needs a short TTL.

### 3. Keep production branch and deployment commit in sync

When branches diverge, reconcile immediately rather than retroactively:

```bash
# 1. Archive the diverged branch (nothing lost)
git push origin origin/main:refs/heads/main-archived

# 2. Reset main to the production commit
git push origin <production-commit-sha>:refs/heads/main --force

# 3. Catalog archived commits for selective cherry-picking
git log --oneline origin/main-archived --not origin/main
```

Use `vercel inspect` with the Vercel API to find the exact commit SHA in production:

```bash
VERCEL_TOKEN=$(cat ~/Library/Application\ Support/com.vercel.cli/auth.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v13/deployments/<deployment-id>" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); m=d.get('meta',{}); print('commitSha:', m.get('githubCommitSha','N/A'))"
```

## Why This Matters

Each of these three issues is independently capable of making a deployment appear to have no effect. Combined, they create a situation where a developer can deploy, promote, and verify in the dashboard — yet end users continue running code that is months old. The 1-year cache is especially dangerous because a bug fix or security patch can take up to a year to reach users who have already loaded the widget.

## When to Apply

- Any time a JS asset is served at a stable, non-content-addressed URL — cap `max-age` at 3600 or less
- After any Vercel deploy where a custom alias is involved — verify alias assignment before assuming it moved
- When `main` and a production branch diverge — reconcile immediately and tag the production commit

## Examples

**Debugging a "deploy didn't work" scenario:**

```
1. Check what the alias resolves to:
   vercel inspect <alias-domain> --scope <team>

2. Compare deployment ID with what you just deployed:
   vercel ls <project> --scope <team>

3. If they differ, promote explicitly:
   vercel promote <correct-deployment-url> --scope <team>

4. If browser still shows old code, check Cache-Control headers:
   curl -sI <bundle-url> | grep cache-control

5. If long TTL, user must hard-refresh (Cmd+Shift+R) or wait for TTL expiry.
   Fix the header for future deploys.
```

**The `/w/` route vs `/api/embed/` route cache comparison:**

| Route | Cache Header | Effect |
|-------|-------------|--------|
| `/w/[widgetKey].js` | `max-age=3600, stale-while-revalidate=86400` | 1-hour browser cache (good) |
| `/api/embed/bundle.js` (before fix) | `max-age=31536000, immutable` | 1-year browser cache (dangerous) |
| `/api/embed/bundle.js` (after fix) | `max-age=3600, stale-while-revalidate=86400` | 1-hour browser cache (good) |

## Related

- Cache header fix: `app/api/embed/bundle.js/route.ts` line 29
- Widget serving headers: `lib/widget/headers.ts` (`createResponseHeaders`)
- Vercel deployment guide (needs refresh): `docs/VERCEL_DEPLOYMENT_GUIDE.md` — Step 7.2 still recommends `max-age=31536000` without caveats
