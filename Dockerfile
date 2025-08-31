# Multi-stage build for Jenkins MCP Server
FROM denoland/deno:2.0.0 AS builder

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Cache dependencies and build standalone executable
RUN deno cache src/simple-server.ts && deno task build

# Production stage - minimal runtime
FROM debian:12-slim AS runtime

# Install ca-certificates for HTTPS connections
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r mcp && useradd -r -g mcp mcp

# Set working directory
WORKDIR /app

# Copy the compiled binary from builder stage
COPY --from=builder /app/jenkins-mcp-server /usr/local/bin/jenkins-mcp-server

# Make binary executable
RUN chmod +x /usr/local/bin/jenkins-mcp-server

# Switch to non-root user
USER mcp

# Environment variables (can be overridden)
ENV LOG_LEVEL=info
ENV JENKINS_TIMEOUT=30000
ENV JENKINS_RETRIES=3

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jenkins-mcp-server || exit 1

# Expose stdio for MCP communication
ENTRYPOINT ["jenkins-mcp-server"]

# Metadata
LABEL org.opencontainers.image.title="Jenkins MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for Jenkins automation"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/your-org/jenkins-mcp-server"
LABEL org.opencontainers.image.licenses="MIT"
