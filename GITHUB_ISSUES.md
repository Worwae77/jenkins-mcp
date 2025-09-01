# 🐛 GitHub Issues for Jenkins MCP Server v2.1.1

## Issue #1: Corporate SSL Certificate Support

**Title:** Add corporate SSL certificate bypass for enterprise environments

**Labels:** `enhancement`, `bug`, `corporate`, `ssl`

**Description:**
```markdown
## Problem
Jenkins MCP Server fails to connect in corporate environments due to SSL certificate validation issues. This affects both runtime connections to Jenkins and build-time Deno compilation.

## Solution Implemented
- Added `--unsafely-ignore-certificate-errors` flag to all Deno operations
- Enhanced SSL configuration with bypass options
- Updated environment variables for SSL control
- Corporate network compatibility improvements

## Changes
- Updated `deno.json` with SSL bypass flags for all tasks
- Enhanced `src/utils/ssl.ts` with corporate SSL handling
- Updated `src/jenkins/auth.ts` with SSL bypass options
- Added environment variables: `JENKINS_SSL_VERIFY`, `JENKINS_SSL_ALLOW_SELF_SIGNED`, `JENKINS_SSL_DEBUG`

## Testing
- [x] Corporate Jenkins connection with SSL bypass
- [x] All 13 MCP tools functional
- [x] Cross-platform SSL compatibility

## Files Changed
- `deno.json`
- `src/utils/ssl.ts`
- `src/jenkins/auth.ts`
- `.env.example`
```

---

## Issue #2: Multi-Architecture Docker Support

**Title:** Implement multi-architecture Docker builds (AMD64/ARM64)

**Labels:** `enhancement`, `docker`, `deployment`, `multiarch`

**Description:**
```markdown
## Problem
Jenkins MCP Server Docker images only supported single architecture, limiting deployment options across different platforms and cloud environments.

## Solution Implemented
- Multi-architecture Docker builds supporting AMD64 and ARM64
- Corporate network-compatible build process
- Automated publishing pipeline
- Platform-specific compilation targets

## Changes
- New `Dockerfile.multiarch` for multi-platform builds
- Added `build-multiarch.sh` publishing automation
- Updated `docker-compose.yml` with multi-arch support
- Enhanced Makefile with multi-architecture targets
- Updated VS Code MCP configuration for Docker

## Features
- ✅ Linux AMD64 support
- ✅ Linux ARM64 support  
- ✅ Corporate SSL bypass during builds
- ✅ Automated registry publishing
- ✅ Health checks and security hardening

## Files Changed
- `Dockerfile.multiarch` (new)
- `build-multiarch.sh` (new)
- `docker-compose.yml`
- `Makefile`
- `.vscode/mcp.json`
```

---

## Issue #3: Build System Enhancements

**Title:** Enhance build system with SSL bypass and cross-platform support

**Labels:** `enhancement`, `build`, `cross-platform`

**Description:**
```markdown
## Problem
Build system lacked SSL bypass capabilities and comprehensive cross-platform support, causing failures in corporate environments.

## Solution Implemented
- Enhanced Deno configuration with SSL bypass
- Cross-platform compilation improvements
- Corporate network build compatibility
- Automated multi-architecture builds

## Changes
- Updated `deno.json` with `--unsafely-ignore-certificate-errors` for all tasks
- Enhanced Makefile with multi-architecture Docker targets
- Added cross-platform binary compilation
- Improved build scripts with SSL handling

## Build Targets Added
- `make docker-multiarch-setup`
- `make docker-multiarch-build`
- `make docker-multiarch-test`
- `make docker-multiarch-publish`

## Files Changed
- `deno.json`
- `Makefile`
- `build-multiarch.sh`
```

---

## Issue #4: Documentation & Configuration Updates

**Title:** Update VS Code MCP configuration and deployment guides

**Labels:** `documentation`, `configuration`, `vscode`

**Description:**
```markdown
## Problem
Documentation and configuration examples were outdated and didn't reflect new Docker multi-architecture and SSL bypass capabilities.

## Solution Implemented
- Updated VS Code MCP configuration with Docker support
- Comprehensive multi-architecture deployment guide
- Corporate environment setup documentation
- SSL bypass configuration examples

## Changes
- Updated `.vscode/mcp.json` with Docker configuration options
- Added `DOCKER_MULTIARCH_GUIDE.md` comprehensive guide
- Enhanced environment variable documentation
- Added deployment option comparisons

## Documentation Added
- Multi-architecture Docker deployment guide
- Corporate SSL bypass setup instructions
- VS Code MCP integration examples
- Build and publishing workflows

## Files Changed
- `.vscode/mcp.json`
- `DOCKER_MULTIARCH_GUIDE.md` (new)
- `README.md` (updates needed)
```
