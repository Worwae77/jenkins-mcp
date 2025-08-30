#!/bin/bash

# Jenkins MCP Server Startup Script
# This script starts the Jenkins MCP Server with proper environment configuration

set -euo pipefail

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if executable exists
if [[ ! -f "./jenkins-mcp-server" ]]; then
    echo "Error: jenkins-mcp-server executable not found. Please run 'deno task build' first."
    exit 1
fi

# Check if environment configuration exists
if [[ ! -f ".env.local" ]]; then
    echo "Error: .env.local file not found. Please copy .env.example to .env.local and configure."
    exit 1
fi

# Load environment variables
echo "Loading environment configuration..."
export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)

# Validate required environment variables
if [[ -z "${JENKINS_URL:-}" ]]; then
    echo "Error: JENKINS_URL environment variable is required"
    exit 1
fi

if [[ -z "${JENKINS_USERNAME:-}" ]]; then
    echo "Error: JENKINS_USERNAME environment variable is required"
    exit 1
fi

if [[ -z "${JENKINS_API_TOKEN:-}" ]] && [[ -z "${JENKINS_API_PASSWORD:-}" ]]; then
    echo "Error: Either JENKINS_API_TOKEN or JENKINS_API_PASSWORD must be provided"
    exit 1
fi

echo "Starting Jenkins MCP Server..."
echo "Jenkins URL: $JENKINS_URL"
echo "Jenkins User: $JENKINS_USERNAME"
echo "Authentication: $(if [[ -n "${JENKINS_API_TOKEN:-}" ]]; then echo "API Token"; else echo "Password"; fi)"
echo ""

# Start the server
exec ./jenkins-mcp-server
