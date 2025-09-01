#!/bin/bash
# build-multiarch.sh - Build and publish multi-architecture Docker images

set -e

# Configuration
IMAGE_NAME="jenkins-mcp-server"
REGISTRY="ghcr.io/worwae77"  # Change to your registry
VERSION="2.1.0"
PLATFORMS="linux/amd64,linux/arm64"

echo "🚀 Building multi-architecture Jenkins MCP Server Docker image..."
echo "📦 Image: ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
echo "🏗️  Platforms: ${PLATFORMS}"

# Create buildx builder if it doesn't exist
if ! docker buildx ls | grep -q multiarch-builder; then
    echo "📋 Creating buildx builder..."
    docker buildx create --name multiarch-builder --driver docker-container --bootstrap
fi

# Use the multiarch builder
docker buildx use multiarch-builder

# Build and push multi-architecture image
echo "🔨 Building multi-architecture image..."
docker buildx build \
    --file Dockerfile.multiarch \
    --platform ${PLATFORMS} \
    --tag ${REGISTRY}/${IMAGE_NAME}:${VERSION} \
    --tag ${REGISTRY}/${IMAGE_NAME}:latest \
    --push \
    .

echo "✅ Multi-architecture build complete!"
echo "📤 Published to: ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
echo "📤 Published to: ${REGISTRY}/${IMAGE_NAME}:latest"

# Test the image locally
echo "🧪 Testing local image..."
docker run --rm \
    -e JENKINS_URL="https://demo.jenkins.io" \
    -e JENKINS_USERNAME="demo" \
    -e JENKINS_API_TOKEN="demo" \
    -e JENKINS_SSL_VERIFY="false" \
    ${REGISTRY}/${IMAGE_NAME}:${VERSION} \
    echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -5

echo "🎉 Multi-architecture Jenkins MCP Server ready for deployment!"
