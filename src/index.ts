#!/usr/bin/env deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Jenkins MCP Server - Main Entry Point
 *
 * This is the main entry point for the Jenkins Model Context Protocol server.
 * It initializes the server and connects to the appropriate transport.
 */

import { Server } from "npm:@modelcontextprotocol/sdk@0.4.0/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./utils/config.ts";
import { logger } from "./utils/logger.ts";
import {
  setupJenkinsPrompts,
  setupJenkinsResources,
  setupJenkinsTools,
} from "./setup.ts";

/**
 * Main server instance
 */
const server = new Server({
  name: "jenkins-mcp-server",
  version: "1.0.0",
});

/**
 * Setup server with Jenkins integration
 */
function setupServer() {
  try {
    logger.info("Initializing Jenkins MCP Server...");

    // Setup Jenkins tools
    setupJenkinsTools(server);
    logger.info("Jenkins tools registered");

    // Setup Jenkins resources
    setupJenkinsResources(server);
    logger.info("Jenkins resources registered");

    // Setup Jenkins prompts
    setupJenkinsPrompts(server);
    logger.info("Jenkins prompts registered");

    logger.info("Jenkins MCP Server setup completed");
  } catch (error) {
    logger.error("Failed to setup Jenkins MCP Server:", error);
    throw error;
  }
}

/**
 * Main function to start the server
 */
async function main() {
  try {
    // Setup server components
    setupServer();

    // Create transport (stdio for local development)
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    logger.info(`Jenkins MCP Server running on stdio transport`);
    logger.info(`Connected to Jenkins: ${config.jenkinsUrl}`);

    // Handle graceful shutdown
    const handleShutdown = () => {
      logger.info("Shutting down Jenkins MCP Server...");
      server.close().then(() => {
        logger.info("Server closed successfully");
        Deno.exit(0);
      }).catch((error: Error) => {
        logger.error("Error during shutdown:", error);
        Deno.exit(1);
      });
    };

    // Register signal handlers
    Deno.addSignalListener("SIGINT", handleShutdown);
    Deno.addSignalListener("SIGTERM", handleShutdown);
  } catch (error) {
    logger.error("Fatal error in main():", error);
    Deno.exit(1);
  }
}

// Handle unhandled promise rejections
globalThis.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

// Handle uncaught exceptions
globalThis.addEventListener("error", (event) => {
  logger.error("Uncaught exception:", event.error);
  event.preventDefault();
});

// Start the server
if (import.meta.main) {
  main();
}
