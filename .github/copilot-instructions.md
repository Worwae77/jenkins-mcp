# Jenkins MCP Server - Copilot Instructions

## Project Overview

**Jenkins MCP Server v1.0** - A production-ready Model Context Protocol server for Jenkins automation, built with Deno and TypeScript.

## Architecture & Technology Stack

- **Runtime**: Deno v1.37+ with TypeScript
- **Protocol**: Model Context Protocol (MCP) with JSON-RPC
- **Primary Server**: `src/simple-server.ts` (production v1.0)
- **Experimental Features**: `experimental/` directory (v1.1 features)
- **Infrastructure**: Ansible playbooks in `ansible/` directory

## Current Project State

✅ **Production Ready**: Core MCP server operational with 12 Jenkins tools
✅ **Documentation Consolidated**: Single README.md as source of truth
✅ **Build System**: Deno tasks for build, check, lint, format, test
✅ **AI Integration**: Claude Desktop and VS Code MCP configurations tested
✅ **Authentication**: Jenkins API token and username/password support
✅ **SSL/TLS Support**: Enterprise-grade SSL configuration for corporate environments
✅ **Security**: Secure credential management and validation
✅ **Testing**: Comprehensive unit test coverage for all components
✅ **Project Cleanup**: Complete removal of sensitive credentials and unnecessary build artifacts (Sep 1, 2025)

## Security Cleanup Status (Sept 1, 2025)

🔒 **Credential Security**: All sensitive data completely removed from project
🧹 **Project Cleaned**: Removed 74MB+ of unnecessary build artifacts and executables
📦 **Size Optimized**: Project reduced from ~74MB to 1.8MB (97% reduction)
🛡️ **Zero Exposure**: No Jenkins credentials, API tokens, or sensitive URLs in any files
✅ **Repository Ready**: Clean codebase prepared for secure repository recreation

## Key Files & Structure

```
jenkins-mcp/
├── README.md                    # 📖 PRIMARY documentation (start here)
├── src/simple-server.ts         # 🚀 Production MCP server v1.0
├── src/jenkins/                 # Jenkins API client & authentication
│   ├── auth.ts                  # Authentication with SSL support
│   ├── client.ts                # Jenkins HTTP client with SSL
│   └── types.ts                 # TypeScript type definitions
├── src/utils/                   # Configuration, logging, validation
│   ├── config.ts                # Environment configuration
│   ├── logger.ts                # Centralized logging
│   ├── ssl.ts                   # SSL/TLS configuration
│   └── validation.ts            # Input validation utilities
├── tests/                       # 🧪 Unit tests for all components
│   ├── basic.test.ts            # Basic functionality tests
│   ├── config.test.ts           # Configuration validation tests
│   ├── ssl.test.ts              # SSL/TLS functionality tests
│   ├── jenkins/                 # Jenkins module tests
│   └── utils/                   # Utility module tests
├── docs/                        # Technical reference documentation
│   ├── SSL_CONFIGURATION.md     # Enterprise SSL setup guide
│   └── api/                     # API reference documentation
├── experimental/                # 🧪 v1.1 experimental features
├── ansible/                     # 🏗️ Infrastructure automation
├── .vscode/mcp.json            # VS Code MCP configuration (examples)
└── .env.example                # Environment variable template (safe examples only)
```

## Cleaned Files & Security Notes

### Removed Files (Security Cleanup - Sept 1, 2025)
The following files were permanently removed to ensure zero credential exposure:
- ❌ `.env.local` - Contained real Jenkins credentials
- ❌ `.envrc` - Environment variables with sensitive data
- ❌ `start-option-1.sh` - Script with hardcoded credentials
- ❌ `.vscode/mcp.json.local` - VS Code config with real credentials
- ❌ `jenkins-mcp-server` - 74MB compiled executable (rebuild with `deno task build`)
- ❌ `artifacts/` - Build artifacts directory
- ❌ Multiple Dockerfiles - Kept only main `Dockerfile`
- ❌ Various release and build documentation files

### Current Safe Files
- ✅ `.env.example` - Contains only placeholder values
- ✅ `.vscode/mcp.json` - Contains only example configurations
- ✅ All source files in `src/` - No hardcoded credentials
- ✅ All documentation - Uses placeholder examples only

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict typing with Deno's built-in type checker
- **Formatting**: Use `deno task fmt` for consistent code style
- **Linting**: Use `deno task lint` for code quality
- **Building**: Use `deno task build` to create standalone executable

### MCP Tool Implementation
- All tools follow Jenkins API patterns with proper error handling
- Tools return structured JSON responses with comprehensive logging
- Authentication handled centrally through `src/jenkins/auth.ts`
- Input validation via `src/utils/validation.ts`

### Testing & Verification
- Use `./start-server.sh` for testing with environment variables
- Test MCP protocol with: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | ./start-server.sh`
- Build verification: `deno task build` should produce working executable
- **Unit Tests**: `deno test` runs comprehensive test suite
- **SSL Testing**: Use SSL diagnostics tool for configuration validation

### Testing Strategy
- **Unit Tests**: All modules have corresponding test files in `tests/`
- **Integration Tests**: End-to-end MCP protocol testing
- **SSL Tests**: Certificate loading, validation, and connection testing
- **Mock Testing**: Jenkins API responses mocked for reliable testing
- **Security Tests**: Credential validation and SSL configuration testing

## Implementation Workflow

### Feature Development Process

1. **Planning & Design**
   - Analyze requirements and identify affected modules
   - Review existing patterns in codebase
   - Design with security and enterprise requirements in mind
   - Consider backward compatibility and migration paths

2. **Implementation Strategy**
   - **Modular Approach**: Create standalone modules (e.g., `src/utils/ssl.ts`)
   - **Avoid Circular Dependencies**: Keep modules independent
   - **Error Handling**: Comprehensive error messages and logging
   - **Type Safety**: Strict TypeScript typing throughout

3. **Security-First Development**
   - Never commit real credentials to repository
   - Use placeholder examples in committed configuration files
   - Implement secure defaults (e.g., SSL verification enabled)
   - Document security implications and best practices

4. **Testing Implementation**
   - Write unit tests for all new functions and modules
   - Test both success and failure scenarios
   - Mock external dependencies (Jenkins API, file system)
   - Validate configuration and input handling

5. **Documentation Standards**
   - Update README.md with new features
   - Create specific documentation files for complex features
   - Include practical examples and troubleshooting guides
   - Document environment variables and configuration options

### SSL/TLS Implementation Pattern (Reference Example)

This is our proven workflow for adding complex enterprise features:

**Phase 1: Core Module Development**
```bash
# Create modular SSL configuration
src/utils/ssl.ts                # Standalone SSL module
src/utils/config.ts             # Integration with main config
tests/ssl.test.ts               # Comprehensive test suite
```

**Phase 2: Integration**
```bash
# Update affected modules
src/jenkins/client.ts           # Add SSL support to HTTP client
src/jenkins/auth.ts             # SSL-aware authentication
src/simple-server.ts            # Add SSL diagnostics tool
```

**Phase 3: Documentation & Security**
```bash
# Complete documentation
docs/SSL_CONFIGURATION.md       # Technical documentation
README.md                       # Update main documentation
.env.example                    # Environment variable examples
.vscode/mcp.json                # Configuration templates (placeholder values)
```

**Phase 4: Testing & Validation**
```bash
# Comprehensive testing
deno test                       # Run all tests
deno task check                 # TypeScript validation
deno task build                 # Build verification
./start-server.sh               # Integration testing
```

**Phase 5: Security Review**
```bash
# Security validation
git log --patch                 # Review all changes
grep -r "sensitive|password|token|key" src/  # Check for hardcoded secrets
test SSL diagnostics tool       # Validate configuration handling
```

### Git Workflow & Security

1. **Branch Strategy**
   ```bash
   git checkout -b feature/your-feature-name
   # Develop and test
   git add . && git commit -m "descriptive message"
   git push origin feature/your-feature-name
   ```

2. **Security Checklist Before Push**
   - ✅ No real credentials in any files
   - ✅ All configuration uses placeholders
   - ✅ Sensitive files added to .gitignore
   - ✅ Documentation includes security notes

3. **Pull Request Process**
   - Create comprehensive PR description
   - Link to related issues
   - Include testing validation
   - Document security considerations

## Documentation Philosophy

- **README.md is primary**: All essential information in main README
- **Consolidated approach**: No scattered documentation
- **Tested examples**: All configuration examples verified working
- **Clear navigation**: Logical flow from basic to advanced topics

## Common Tasks

### Development Workflow
```bash
# Setup
cp .env.example .env.local  # Configure environment with your credentials
deno task check             # Verify TypeScript
deno task build             # Build executable (will recreate jenkins-mcp-server)

# Testing
deno test                   # Run unit tests
deno task fmt && deno task lint  # Code quality

# Note: start-server.sh was removed during cleanup - use deno task start instead
```

### Project Cleanup Guidelines (Added Sept 1, 2025)
1. **Never commit real credentials**: Always use .env.local (gitignored) for real credentials
2. **Keep examples safe**: Only placeholder values in committed files
3. **Regular cleanup**: Remove build artifacts and temporary files periodically
4. **Size awareness**: Monitor project size (should stay under 2MB without executables)
5. **Security validation**: Run `grep -r "your-actual-credentials" .` to check for leaks

### Unit Testing Guidelines
1. **Test Structure**: Each module in `src/` should have corresponding tests in `tests/`
2. **Naming Convention**: `tests/module.test.ts` for `src/module.ts`
3. **Coverage Requirements**: All public functions must have unit tests
4. **Mock Strategy**: Mock external dependencies (Jenkins API, filesystem, network)
5. **Test Categories**:
   - **Unit Tests**: Individual function testing
   - **Integration Tests**: Module interaction testing
   - **Security Tests**: Credential validation and SSL testing
   - **Error Handling**: Testing error scenarios and edge cases

### Adding New MCP Tools
1. Implement in `src/simple-server.ts` following existing patterns
2. Add Jenkins API calls using `src/jenkins/client.ts`
3. Include proper error handling and logging
4. Test with JSON-RPC protocol
5. Update README.md tool list

### MCP Protocol Implementation
- Use `@modelcontextprotocol/sdk` for protocol handling
- Implement `tools/list`, `tools/call` methods
- Return proper JSON-RPC responses with error handling
- Support `resources` and `prompts` for v1.1 features

## AI Integration Context

This project enables AI assistants to interact with Jenkins through:
- **12 production tools**: job management, builds, nodes, queue operations
- **Claude Desktop integration**: Tested configuration in README.md
- **VS Code MCP support**: Automatic detection via `.vscode/mcp.json`
- **Secure authentication**: API tokens with comprehensive error handling

## Version Strategy

- **v1.0 (Production)**: `src/simple-server.ts` with 12 core tools
- **v1.1 (Experimental)**: `experimental/` with advanced features
- **Infrastructure**: `ansible/` for enterprise deployment

## Project Maintenance Notes

When working on this project:
1. **Prioritize production v1.0 codebase** in `src/` directory
2. **Refer to README.md** as the primary documentation source
3. **Use only placeholder credentials** in committed files
4. **Keep project size optimized** - current clean size: 1.8MB
5. **Rebuild executables as needed** with `deno task build`
6. **Maintain security standards** - no real credentials in repository ever
