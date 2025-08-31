# Experimental Features - v1.1

⚠️ **These features are NOT included in v1.0 release**

This directory contains experimental code for advanced Jenkins MCP functionality planned for v1.1:

## Contents

- `index.ts` - Alternative MCP server entry point using setup architecture
- `server.ts` - Alternative server implementation 
- `setup.ts` - Tool/resource/prompt setup functions
- `tools/` - Advanced tool implementations including F005 agent management
- `prompts/` - Dynamic prompt generation
- `resources/` - Resource management features

## Status

- **TypeScript Issues**: These files have compilation errors that need resolution
- **Security Model**: Requires enterprise privilege management design
- **Ansible Integration**: Infrastructure dependencies need stabilization

## Development Timeline

See `docs/F005_EXPERIMENTAL_ROADMAP.md` for the v1.1 development plan.

## Usage

These files are not included in the v1.0 build process. The production v1.0 build uses `src/simple-server.ts`.
