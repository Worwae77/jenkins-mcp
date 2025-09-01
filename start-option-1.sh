#!/bin/bash
# Jenkins MCP Server - Option 1: Local Development Script
# SSL Bypass Configuration: WORKING ✅

echo "🚀 Starting Jenkins MCP Server with SSL bypass..."

# Export environment variables
export JENKINS_URL="https://jenkins-ops.kasikornbank.com"
export JENKINS_USERNAME="k0966696" 
export JENKINS_API_TOKEN="11073c86d4e71a195905878fd22c85811c"
export JENKINS_SSL_VERIFY="false"
export JENKINS_SSL_ALLOW_SELF_SIGNED="true"
export JENKINS_SSL_DEBUG="true"

# Start the MCP server
deno run --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors src/simple-server.ts
