# Jenkins MCP Server v2.3.1 - Release Notes

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

## 🔧 Technical Improvements

### Version Management

- **Centralized Version Control**: Version information managed through
  `deno.json`
- **Fallback Mechanism**: Embedded version constants for compiled binary
  compatibility
- **Dynamic Loading**: Configuration system supports runtime version
  initialization

### CLI Enhancement

- **Argument Parsing**: Robust command-line argument processing
- **Early Exit**: Version/help display before server initialization
- **Deferred Validation**: Configuration validation only when needed for server
  startup

## 📦 Available Downloads

### Compiled Binaries (Ready for Production)

- **macOS Intel (x86_64)**: `jenkins-mcp-server-macos-x64` (78.6 MB)
- **macOS Apple Silicon (ARM64)**: `jenkins-mcp-server-macos-arm64` (73.7 MB)
- **Linux x86_64**: `jenkins-mcp-server-linux-x64` (86.0 MB)
- **Default Binary**: `jenkins-mcp-server` (73.7 MB) - Current platform binary

### Platform Compatibility

- ✅ **macOS**: Both Intel and Apple Silicon fully supported
- ✅ **Linux**: x86_64 architecture supported
- ⚠️ **Windows**: Binary compilation blocked by corporate firewall (source
  available)

## 🧪 Quality Assurance

### Test Coverage

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
# Output: jenkins-mcp-server v2.3.1

# Get help
./jenkins-mcp-server --help
```

## 🔐 Security & Checksums

All binaries have been verified with SHA256 checksums (see `CHECKSUMS.txt`):

```
978e9ac002683eccfbe15a5382b387a5cc66ffee963437201e5a72dd30d8e7bb  jenkins-mcp-server
cb6f035cad09d699845e887ee009afa47225dde3d292a13e9682ed4c0c7e398b  jenkins-mcp-server-linux-x64
5677c4b20406fbf814bcd15b2621d7be3bbb472970f8f952b660bfffa23c0f02  jenkins-mcp-server-macos-arm64
adfb65ad264058d1468788288a4a11778a78c7c048fceef06e952294b88d89d5  jenkins-mcp-server-macos-x64
```

## 📋 Usage Examples

### Quick Start

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

### Development Mode

```bash
# Clone repository
git clone https://github.com/Worwae77/jenkins-mcp.git
cd jenkins-mcp

# Check version
deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts --version

# Run server
deno task start
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

## 🔄 Installation Methods

### 1. Binary Download (Recommended)

- Download appropriate binary from release assets
- Make executable: `chmod +x jenkins-mcp-server-*`
- Run directly with environment variables

### 2. Source Installation

- Requires Deno v1.37+
- Clone repository and run with `deno task start`
- Full development environment available

### 3. Docker Container

- Available via Docker Hub (see main README.md)
- Supports all environment configurations

## 📞 Support & Documentation

- **Main Documentation**: [README.md](README.md)
- **SSL Configuration**: [docs/SSL_CONFIGURATION.md](docs/SSL_CONFIGURATION.md)
- **API Reference**: [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md)
- **Issue Reporting**: GitHub Issues
- **Feature Requests**: GitHub Discussions

---

**Full Changelog**:
[v2.3.0...v2.3.1](https://github.com/Worwae77/jenkins-mcp/compare/v2.3.0...v2.3.1)
