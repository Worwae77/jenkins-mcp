#!/bin/bash

# Test Docker deployment of Jenkins MCP Server
set -e

echo "🐳 Testing Jenkins MCP Server Docker Deployment"
echo "================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is available"

# Check if environment variables are set
if [ -z "$JENKINS_URL" ] || [ -z "$JENKINS_USERNAME" ] || [ -z "$JENKINS_API_TOKEN" ]; then
    echo "❌ Required environment variables not set."
    echo "Please set: JENKINS_URL, JENKINS_USERNAME, JENKINS_API_TOKEN"
    echo ""
    echo "Example:"
    echo "export JENKINS_URL=https://your-jenkins.com"
    echo "export JENKINS_USERNAME=your-username"  
    echo "export JENKINS_API_TOKEN=your-api-token"
    exit 1
fi

echo "✅ Environment variables configured"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t jenkins-mcp-server:test .

echo "✅ Docker image built successfully"

# Test the MCP server
echo "🧪 Testing MCP server..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
docker run -i --rm \
    -e JENKINS_URL="$JENKINS_URL" \
    -e JENKINS_USERNAME="$JENKINS_USERNAME" \
    -e JENKINS_API_TOKEN="$JENKINS_API_TOKEN" \
    -e LOG_LEVEL=info \
    jenkins-mcp-server:test | \
jq '.result.tools | length' > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ MCP server responded successfully"
    
    # Show available tools
    echo ""
    echo "📋 Available tools:"
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
    docker run -i --rm \
        -e JENKINS_URL="$JENKINS_URL" \
        -e JENKINS_USERNAME="$JENKINS_USERNAME" \
        -e JENKINS_API_TOKEN="$JENKINS_API_TOKEN" \
        -e LOG_LEVEL=info \
        jenkins-mcp-server:test | \
    jq -r '.result.tools[] | "- " + .name + ": " + .description'
    
    echo ""
    echo "🎉 Docker deployment test successful!"
    echo ""
    echo "To use with Claude Desktop, add this to your configuration:"
    echo '{
  "mcpServers": {
    "jenkins-mcp-server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "JENKINS_URL='"$JENKINS_URL"'",
        "-e", "JENKINS_USERNAME='"$JENKINS_USERNAME"'",
        "-e", "JENKINS_API_TOKEN='"$JENKINS_API_TOKEN"'",
        "-e", "LOG_LEVEL=info",
        "jenkins-mcp-server:test"
      ]
    }
  }
}'
else
    echo "❌ MCP server test failed"
    exit 1
fi
