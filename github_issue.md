# CI/CD Docker Version Injection Issue

## Issue Description

Docker images built in GitHub Actions CI pipeline are using default version
"0.0.0-dev" instead of the actual version from git tags.

## Error Message

```
CI Docker image built: jenkins-mcp-server:0.0.0-dev 
CI Docker build completed successfully
❌ Docker image jenkins-mcp-server:2.5.5 not found
jenkins-mcp-server   0.0.0-dev         6f07edcde9d8   1 second ago   175MB
jenkins-mcp-server   latest            6f07edcde9d8   1 second ago   175MB
Error: Process completed with exit code 1.
```

## Root Cause

The CI workflow extracts version from git tags and injects it into source files
in the `build-binaries` job, but the `build-docker` job runs independently and
doesn't have the same version injection steps. Additionally, the Makefile's
`docker-build-ci` target was trying to extract version from `GITHUB_REF`
environment variable instead of using the version-injected source files.

## Impact

- Docker images are published with incorrect version tags (0.0.0-dev)
- Release process fails when looking for Docker images with correct version tags
- Inconsistency between binary versions and Docker image versions

## Fix Applied

Created branch `fix/docker-version-injection-ci` with the following changes:

1. **Added version injection to build-docker job**:
   - Extract version from git tag using same logic as build-binaries job
   - Inject version into source files before Docker build
   - Use extracted version consistently throughout the job

2. **Fixed Makefile docker-build-ci target**:
   - Changed from extracting version from GITHUB_REF
   - Now reads version from version-injected source files using grep
   - Ensures consistency with the injected version

## Files Modified

- `.github/workflows/build-release.yml` - Added version extraction and injection
  steps to build-docker job
- `Makefile` - Updated docker-build-ci target to use injected version from
  source files

## Testing

- The fix ensures Docker images are built with correct version tags from git
  tags
- Maintains consistency between binary versions and Docker image versions
- Improved error reporting shows all available images if version mismatch occurs

## Related

- This issue was discovered when pushing tag v2.5.5
- Fix is in branch: `fix/docker-version-injection-ci`
- Ready for pull request review and merge
