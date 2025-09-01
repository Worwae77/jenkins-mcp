# Jenkins MCP Server v2.4.0 - Version Display Release

## 🎯 New Features

### Version Display & Help System

- **CLI Version Display**: Added `--version` and `-v` flags for quick version
  identification
- **Comprehensive Help System**: Added `--help` and `-h` flags with detailed
  usage information
- **Cross-Platform Support**: Works in both development mode and compiled
  binaries
- **Environment Documentation**: Help system includes all environment variables
  and examples

### Technical Improvements

- **Centralized Version Control**: Version information managed through
  `deno.json`
- **Fallback Mechanism**: Embedded version constants for compiled binary
  compatibility
- **Dynamic Loading**: Configuration system supports runtime version
  initialization
- **Argument Parsing**: Robust command-line argument processing
- **Early Exit**: Version/help display before server initialization
- **Deferred Validation**: Configuration validation only when needed for server
  startup

## 📦 Available Downloads

### Production Binaries (v2.4.0)

- **macOS Intel (x86_64)**: `jenkins-mcp-server-macos-x64`
- **macOS Apple Silicon (ARM64)**: `jenkins-mcp-server-macos-arm64`
- **Linux x86_64**: `jenkins-mcp-server-linux-x64`
- **Default Binary**: `jenkins-mcp-server` (current platform)

### Platform Compatibility

- ✅ **macOS**: Both Intel and Apple Silicon fully supported
- ✅ **Linux**: x86_64 architecture supported
- ⚠️ **Windows**: Source available (compile with Deno)

## 🧪 Quality Assurance

- **69 Tests Passing**: Complete test suite validation
- **Cross-Platform Testing**: Version display verified on all compiled binaries
- **Environment Validation**: Robust configuration handling with proper
  fallbacks

### Verification Commands

```bash
# Check version (development)
deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts --version

# Check version (compiled binary)
./jenkins-mcp-server --version
# Output: jenkins-mcp-server v2.4.0

# Get help
./jenkins-mcp-server --help
```

## 🔐 Security & Checksums

All binaries verified with SHA256 checksums:

```
b6c4f3ea33ae8c865307ce87653e1fe0b695da139afad56336f348caf415fc8c  jenkins-mcp-server
3f65ba4fb0ac5f4ba00c9df4c12721dd99acc6cbe4cf1eb996eeae571ac9de0e  jenkins-mcp-server-linux-x64
81bb20e2344644df83685a1528c8e37955c59b34e98a0928c92d7d302c3efb10  jenkins-mcp-server-macos-arm64
7d6cf0dfe3f4478ab0caa8cce6eb2899906b39c77c01dcede9298a7402e4d14f  jenkins-mcp-server-macos-x64
```

## 📋 Quick Start

```bash
# Download appropriate binary for your platform
chmod +x jenkins-mcp-server-*

# Check version
./jenkins-mcp-server-macos-arm64 --version

# Get help
./jenkins-mcp-server-macos-arm64 --help

# Run with Jenkins
JENKINS_URL=http://localhost:8080 \
JENKINS_API_TOKEN=your-token \
./jenkins-mcp-server-macos-arm64
```

## 🚀 Migration Notes

### From Previous Versions

- **No Breaking Changes**: Existing configurations remain compatible
- **Enhanced CLI**: New version/help flags provide better user experience
- **Improved Documentation**: Help system includes comprehensive usage guide

### Environment Variables

All existing environment variables remain unchanged:

- `JENKINS_URL` - Jenkins server URL (required)
- `JENKINS_USERNAME` - Jenkins username
- `JENKINS_API_TOKEN` - Jenkins API token (recommended)
- `JENKINS_API_PASSWORD` - Jenkins password (alternative)
- `MCP_SERVER_NAME` - Server name (default: jenkins-mcp-server)

---

**Full Changelog**:
[v2.3.1...v2.4.0](https://github.com/Worwae77/jenkins-mcp/compare/v2.3.1...v2.4.0)
