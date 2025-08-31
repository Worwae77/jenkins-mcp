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
✅ **Build System**: Deno tasks for build, check, lint, format
✅ **AI Integration**: Claude Desktop and VS Code MCP configurations tested
✅ **Authentication**: Jenkins API token and username/password support

## Key Files & Structure

```
jenkins-mcp/
├── README.md                    # 📖 PRIMARY documentation (start here)
├── src/simple-server.ts         # 🚀 Production MCP server v1.0
├── src/jenkins/                 # Jenkins API client & authentication
├── src/utils/                   # Configuration, logging, validation
├── experimental/                # 🧪 v1.1 experimental features
├── ansible/                     # 🏗️ Infrastructure automation
├── .vscode/mcp.json            # VS Code MCP configuration
├── .env.local                  # Environment configuration
└── docs/                       # Technical reference documentation
```

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

## Documentation Philosophy

- **README.md is primary**: All essential information in main README
- **Consolidated approach**: No scattered documentation
- **Tested examples**: All configuration examples verified working
- **Clear navigation**: Logical flow from basic to advanced topics

## Common Tasks

### Development Workflow
```bash
# Setup
cp .env.example .env.local  # Configure environment
deno task check             # Verify TypeScript
deno task build             # Build executable

# Testing
./start-server.sh           # Start with env variables
deno task fmt && deno task lint  # Code quality
```

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

When working on this project, prioritize the production v1.0 codebase in `src/` and refer to README.md as the primary documentation source.
