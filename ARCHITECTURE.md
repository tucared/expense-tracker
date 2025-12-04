# Development Environment Architecture

## Network Layers

This development container has **two layers** of network security:

### Layer 1: HTTPS Proxy (Primary Control)
- **Location**: Set via environment variables (`HTTPS_PROXY`, `GLOBAL_AGENT_HTTP_PROXY`)
- **How it works**: ALL outbound HTTPS traffic is routed through a JWT-authenticated proxy
- **Allowed hosts**: Controlled by the JWT's `allowed_hosts` field (infrastructure level)
- **Current status**: ✅ Allows `registry.npmjs.org`, ❌ Blocks `esm.sh`, `cdn.jsdelivr.net`

### Layer 2: Local Firewall (Secondary Control)
- **Location**: `.devcontainer/init-firewall.sh`
- **How it works**: Uses iptables + ipset to restrict direct IP access
- **Allowed hosts**: Configured in the firewall script
- **Current status**: ✅ Includes all necessary CDNs

## Current Issue

Observable Framework needs to fetch ESM modules from CDNs during the build process:
- `esm.sh` - Primary ESM CDN
- `cdn.jsdelivr.net` - Fallback CDN

These domains are:
- ✅ Allowed in the local firewall script
- ❌ **Blocked by the proxy layer** (403 Forbidden)

Since ALL traffic routes through the proxy first, the local firewall allowlist doesn't matter.

## Proper Setup Checklist

### ✅ Application Layer (This Repository)
- [x] `package.json` with correct dependencies (no ARM64 package)
- [x] `devcontainer.json` with `postCreateCommand: "npm install"`
- [x] `setup-proxy.cjs` to configure undici/fetch to use proxy
- [x] `.devcontainer/init-firewall.sh` includes Observable CDNs

### ❌ Infrastructure Layer (External)
- [ ] **Proxy JWT must include in `allowed_hosts`:**
  - `esm.sh`
  - `cdn.jsdelivr.net`
  - `*.esm.sh` (for subdomains)
  - `*.jsdelivr.net` (for subdomains)

## Current Workarounds

Since the infrastructure proxy cannot be modified from this repository, options include:

### Option 1: Pre-build Observable Assets (Recommended)
Build the Observable Framework in a CI/CD environment where CDN access is available, then commit the built assets:

```bash
# In CI/CD with CDN access:
npm install
npm run build
# Commit dist/ or .observablehq/cache/
```

### Option 2: Vendor Dependencies
Manually download and vendor the required ESM modules in the repository

### Option 3: Simplify Build Requirements
Remove Observable Framework's npm imports and use only static assets or local JavaScript

### Option 4: Request Infrastructure Change
Request that the proxy configuration be updated to include Observable Framework's CDNs in the allowed hosts list

## Testing the Setup

```bash
# Test if CDNs are accessible:
curl -I https://esm.sh/d3@7.9.0
curl -I https://cdn.jsdelivr.net/npm/d3@7

# Expected: 200 OK (currently: 403 Forbidden)

# Test build:
npm run build

# Expected: Successful build (currently: fails on CDN fetch)
```

## Resolution Path

The **proper fix** requires coordination between layers:

1. **Short term** (Repository level):
   - ✅ All done - dependencies fixed, proxy configured, dev container automated

2. **Medium term** (Infrastructure level):
   - Request proxy allowlist update to include Observable CDNs
   - OR implement one of the workarounds above

3. **Long term** (Architecture level):
   - Consider if Observable Framework is the right choice for this restricted environment
   - OR establish a pattern for pre-building framework assets in unrestricted environments
