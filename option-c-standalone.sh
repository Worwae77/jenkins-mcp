#!/bin/bash
# option-c-standalone.sh - Option C: Standalone binary deployment

set -e

echo "🎯 Option C: Standalone Binary Deployment"
echo "=========================================="

# Check if we have pre-built binaries
if [ -f "jenkins-mcp-server-macos-arm64" ]; then
    echo "✅ Found macOS ARM64 binary"
    BINARY="./jenkins-mcp-server-macos-arm64"
elif [ -f "jenkins-mcp-server-linux-x64" ]; then
    echo "✅ Found Linux x64 binary"
    BINARY="./jenkins-mcp-server-linux-x64"
elif [ -f "jenkins-mcp-server" ]; then
    echo "✅ Found default binary"
    BINARY="./jenkins-mcp-server"
else
    echo "📦 No pre-built binary found. Building for current platform..."
    deno task build
    BINARY="./jenkins-mcp-server"
fi

# Make sure binary is executable
chmod +x "$BINARY"

echo "🚀 Starting Jenkins MCP Server using standalone binary..."
echo "📍 Binary: $BINARY"
echo "🔧 Loading environment from .env.local..."

# Load environment and start server
if [ -f ".env.local" ]; then
    source .env.local
    echo "✅ Environment loaded"
else
    echo "⚠️  Warning: .env.local not found. Using environment variables."
fi

echo "🎯 Starting server with SSL bypass..."
echo "📡 Press Ctrl+C to stop"
echo ""

# Start the server
exec "$BINARY"
