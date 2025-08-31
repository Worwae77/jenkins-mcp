# Migration from Shell Scripts to Makefile

This document outlines the migration from individual shell scripts to a unified Makefile-based build system.

## What Changed

### 🗑️ Deprecated Shell Scripts

The following shell scripts have been **replaced** by Makefile targets:

| Old Script | New Makefile Target | Description |
|------------|--------------------|-----------|
| `start-server.sh` | `make start` | Start the MCP server |
| `test-docker.sh` | `make docker-test` | Test Docker deployment |
| `test-deployment.sh` | `make deploy-test` | Test all deployment methods |

### 🆕 New Makefile Benefits

- **Standardized Commands**: Consistent interface across all operations
- **Dependency Management**: Automatic prerequisite checking
- **Cross-Platform**: Works on macOS, Linux, and Windows (with make)
- **Help System**: Built-in help with `make help`
- **Error Handling**: Better error messages and validation
- **Color Output**: Enhanced visual feedback

## Migration Guide

### Installation and Setup

**Old Way:**
```bash
# Manual setup
cp .env.example .env.local
# Edit .env.local manually
deno cache src/simple-server.ts
```

**New Way:**
```bash
make install  # Does everything automatically
```

### Development

**Old Way:**
```bash
deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts
```

**New Way:**
```bash
make dev    # Development with auto-reload
make start  # Normal start
```

### Building

**Old Way:**
```bash
# Individual deno compile commands
deno compile --allow-net --allow-env --allow-read --allow-write --output jenkins-mcp-server src/simple-server.ts
deno compile --allow-net --allow-env --allow-read --allow-write --target x86_64-unknown-linux-gnu --output jenkins-mcp-server-linux-x64 src/simple-server.ts
# etc...
```

**New Way:**
```bash
make build           # Current platform
make build-linux     # Linux x64
make build-macos     # macOS x64  
make build-macos-arm # macOS ARM64
make build-windows   # Windows x64
make build-all       # All platforms
```

### Docker Operations

**Old Way:**
```bash
docker build -t jenkins-mcp-server:latest .
./test-docker.sh
```

**New Way:**
```bash
make docker-build   # Build image
make docker-test    # Test deployment
make docker-run     # Run interactively
```

### Testing

**Old Way:**
```bash
./test-deployment.sh
deno test --allow-net --allow-env --allow-read --allow-write
```

**New Way:**
```bash
make deploy-test    # Test all deployment methods
make test          # Run unit tests
make quality       # Run all quality checks
```

### Code Quality

**Old Way:**
```bash
deno check src/**/*.ts
deno fmt src/**/*.ts  
deno lint src/**/*.ts
```

**New Way:**
```bash
make check    # TypeScript check
make fmt      # Format code
make lint     # Lint code
make quality  # All quality checks
```

## Complete Command Reference

### Core Development
```bash
make help           # Show all available commands
make install        # Install dependencies and setup
make dev           # Start development server
make start         # Start the MCP server
```

### Building
```bash
make build         # Build for current platform
make build-all     # Build for all platforms
make release       # Quality checks + all builds
```

### Docker
```bash
make docker-build  # Build Docker image
make docker-test   # Test Docker deployment
make docker-run    # Run Docker container
```

### Testing & Quality
```bash
make test          # Run unit tests
make deploy-test   # Test all deployment methods
make check         # TypeScript compilation check
make fmt          # Format code
make lint         # Lint code
make quality      # All quality checks
```

### Utilities
```bash
make clean        # Clean build artifacts
make distclean    # Clean everything including Docker
make info         # Show project information
make check-env    # Verify environment setup
```

## Environment Variables

The Makefile respects the same environment variables as the old scripts:

### Required for Docker Testing
```bash
export JENKINS_URL=https://your-jenkins.com
export JENKINS_USERNAME=your-username
export JENKINS_API_TOKEN=your-api-token
```

### Optional Test Overrides
```bash
export JENKINS_TEST_URL=http://localhost:8080      # Default test URL
export JENKINS_TEST_USERNAME=admin                 # Default test username
export JENKINS_TEST_API_TOKEN=test                 # Default test token
```

## Backward Compatibility

For a transition period, you can still use the old scripts, but they are **deprecated** and will be removed in a future version.

### Immediate Action Required

1. **Update CI/CD pipelines** to use Makefile targets
2. **Update documentation** references
3. **Train team members** on new commands

### Recommended Migration Steps

1. **Week 1**: Start using Makefile alongside shell scripts
2. **Week 2**: Update all documentation and CI/CD
3. **Week 3**: Remove shell script dependencies
4. **Week 4**: Delete deprecated shell scripts

## Advanced Features

### Custom Variables
```bash
make docker-build DOCKER_TAG=v1.0.1
make build BINARY_NAME=my-custom-server
```

### Parallel Building
```bash
make -j4 build-all  # Build all platforms in parallel
```

### Verbose Output
```bash
make build V=1      # Verbose output
```

## Troubleshooting

### Make Not Available
```bash
# macOS
brew install make

# Ubuntu/Debian  
sudo apt-get install make

# Windows
# Use WSL or install via Chocolatey: choco install make
```

### Environment Issues
```bash
make check-env       # Verify .env.local setup
make check-docker-env # Verify Docker environment variables
```

### Clean Build Issues
```bash
make distclean       # Deep clean everything
make install         # Reinstall dependencies
```

## Benefits Summary

✅ **Simplified Commands**: Single `make` command for all operations  
✅ **Built-in Help**: `make help` shows all available targets  
✅ **Dependency Checking**: Automatic prerequisite validation  
✅ **Error Handling**: Better error messages and recovery  
✅ **Cross-Platform**: Consistent across all development environments  
✅ **Extensible**: Easy to add new targets and functionality  
✅ **Professional**: Industry-standard build system approach  

The Makefile-based system provides a more robust, maintainable, and user-friendly development experience while preserving all existing functionality.
