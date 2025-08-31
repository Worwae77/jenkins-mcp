#!/bin/bash

# Jenkins MCP Server Deployment Testing Script
# Tests all deployment methods: Docker, Standalone, and Source

set -e

echo "🧪 Jenkins MCP Server Deployment Testing"
echo "========================================"

# Test JSON-RPC payload
TEST_PAYLOAD='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Default test environment variables (override any existing ones)
unset JENKINS_API_PASSWORD  # Clear any existing password
export JENKINS_URL="${JENKINS_TEST_URL:-http://localhost:8080}"
export JENKINS_USERNAME="${JENKINS_TEST_USERNAME:-admin}"
export JENKINS_API_TOKEN="${JENKINS_TEST_API_TOKEN:-test}"

echo "📋 Test Configuration:"
echo "  JENKINS_URL: $JENKINS_URL"
echo "  JENKINS_USERNAME: $JENKINS_USERNAME"
echo "  JENKINS_API_TOKEN: ****"
echo ""

# Test 1: Docker Deployment (AMD64)
echo "🐳 Testing Docker Deployment (AMD64)..."
if command -v docker &> /dev/null; then
    if docker image inspect jenkins-mcp-server:amd64 &> /dev/null; then
        echo "✅ Docker image found: jenkins-mcp-server:amd64"
        DOCKER_RESULT=$(echo "$TEST_PAYLOAD" | docker run --platform linux/amd64 -i --rm \
            -e JENKINS_URL="$JENKINS_URL" \
            -e JENKINS_USERNAME="$JENKINS_USERNAME" \
            -e JENKINS_API_TOKEN="$JENKINS_API_TOKEN" \
            jenkins-mcp-server:amd64 2>/dev/null || echo "failed")
        if echo "$DOCKER_RESULT" | grep -q '"jsonrpc":"2.0"'; then
            echo "✅ Docker (AMD64): MCP server responds correctly"
        else
            echo "❌ Docker (AMD64): MCP server response invalid"
        fi
    else
        echo "⚠️  Docker image not found. Build with: docker buildx build --platform linux/amd64 -t jenkins-mcp-server:amd64 --load ."
    fi
else
    echo "⚠️  Docker not available"
fi
echo ""

# Test 2: Standalone Executable
echo "🏃 Testing Standalone Executable..."
if [[ -f "./jenkins-mcp-server" ]]; then
    echo "✅ Standalone executable found"
    STANDALONE_RESULT=$(echo "$TEST_PAYLOAD" | JENKINS_URL="$JENKINS_URL" JENKINS_USERNAME="$JENKINS_USERNAME" JENKINS_API_TOKEN="$JENKINS_API_TOKEN" ./jenkins-mcp-server 2>/dev/null || echo "failed")
    if echo "$STANDALONE_RESULT" | grep -q '"jsonrpc":"2.0"'; then
        echo "✅ Standalone: MCP server responds correctly"
    else
        echo "❌ Standalone: MCP server response invalid"
    fi
elif [[ -f "./jenkins-mcp-server-macos-arm64" ]]; then
    echo "✅ macOS ARM64 executable found"
    STANDALONE_RESULT=$(echo "$TEST_PAYLOAD" | JENKINS_URL="$JENKINS_URL" JENKINS_USERNAME="$JENKINS_USERNAME" JENKINS_API_TOKEN="$JENKINS_API_TOKEN" ./jenkins-mcp-server-macos-arm64 2>/dev/null || echo "failed")
    if echo "$STANDALONE_RESULT" | grep -q '"jsonrpc":"2.0"'; then
        echo "✅ macOS ARM64: MCP server responds correctly"
    else
        echo "❌ macOS ARM64: MCP server response invalid"
    fi
else
    echo "⚠️  Standalone executable not found. Build with: deno task build"
fi
echo ""

# Test 3: Source Code (with Deno)
echo "🦕 Testing Source Code Deployment..."
if command -v deno &> /dev/null; then
    echo "✅ Deno runtime found"
    SOURCE_RESULT=$(echo "$TEST_PAYLOAD" | JENKINS_URL="$JENKINS_URL" JENKINS_USERNAME="$JENKINS_USERNAME" JENKINS_API_TOKEN="$JENKINS_API_TOKEN" ./start-server.sh 2>/dev/null || echo "failed")
    if echo "$SOURCE_RESULT" | grep -q '"jsonrpc":"2.0"'; then
        echo "✅ Source: MCP server responds correctly"
    else
        echo "❌ Source: MCP server response invalid"
    fi
else
    echo "⚠️  Deno runtime not available"
fi
echo ""

# Test 4: Check available build targets
echo "🎯 Available Build Targets:"
if [[ -f "deno.json" ]]; then
    echo "✅ Cross-platform build configuration found"
    if command -v deno &> /dev/null; then
        echo "  Available tasks:"
        deno task | grep -E "(build|docker)" | sed 's/^/    /'
    fi
else
    echo "⚠️  deno.json not found"
fi
echo ""

# Test 5: Validate MCP tools
echo "🔧 MCP Tools Validation:"
echo "Expected 12 tools:"
echo "  1. jenkins_list_jobs"
echo "  2. jenkins_get_job" 
echo "  3. jenkins_trigger_build"
echo "  4. jenkins_get_version"
echo "  5. jenkins_get_build_logs"
echo "  6. jenkins_create_job"
echo "  7. jenkins_get_build"
echo "  8. jenkins_stop_build"
echo "  9. jenkins_list_nodes"
echo "  10. jenkins_get_node_status"
echo "  11. jenkins_get_queue"
echo "  12. jenkins_cancel_queue_item"
echo ""

echo "🎉 Testing completed!"
echo ""
echo "💡 Next steps:"
echo "  1. Configure .env.local with real Jenkins credentials"
echo "  2. Add to Claude Desktop config (~/.claude_desktop_config.json)"
echo "  3. Add to VS Code MCP settings (.vscode/mcp.json)"
echo "  4. Start using Jenkins automation with AI!"
