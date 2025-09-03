/**
 * Configuration management for Jenkins MCP Server
 */

import type { SSLConfig } from "./ssl.ts";
import { getSSLConfig } from "./ssl.ts";
import { getVersion } from "./version.ts";

interface Config {
  // Server configuration
  serverName: string;
  serverVersion: string;

  // Jenkins configuration
  jenkinsUrl: string;
  jenkinsUsername?: string;
  jenkinsApiToken?: string;
  jenkinsPassword?: string;

  // SSL/TLS configuration
  ssl: SSLConfig;

  // Security configuration
  allowedDomains?: string[];
  rateLimitPerMinute: number;

  // Logging configuration
  logLevel: string;
  enableAuditLog: boolean;
}

/**
 * Get environment variable with fallback - non-throwing version for lazy validation
 */
function getEnv(key: string, fallback?: string): string {
  const value = Deno.env.get(key);
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    return ""; // Return empty string instead of throwing
  }
  return value;
}

/**
 * Get required environment variable - throws only when accessed
 */
function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (value === undefined || value.trim() === "") {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

/**
 * Safe integer parsing with validation
 */
function parseIntEnv(key: string, fallback: number): number {
  const value = Deno.env.get(key);
  if (!value) return fallback;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(
      `Warning: Invalid integer value for ${key}: "${value}", using fallback: ${fallback}`,
    );
    return fallback;
  }
  return parsed;
}

/**
 * Safe boolean parsing with validation
 */
function parseBooleanEnv(key: string, fallback: boolean): boolean {
  const value = Deno.env.get(key)?.toLowerCase();
  if (!value) return fallback;

  if (["true", "1", "yes", "on"].includes(value)) return true;
  if (["false", "0", "no", "off"].includes(value)) return false;

  console.warn(
    `Warning: Invalid boolean value for ${key}: "${value}", using fallback: ${fallback}`,
  );
  return fallback;
}

/**
 * Parse comma-separated string to array
 */
function parseArrayEnv(key: string, fallback: string[] = []): string[] {
  const value = Deno.env.get(key);
  if (!value) return fallback;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

/**
 * Application configuration
 */
export const config: Config = {
  // Server configuration
  serverName: getEnv("MCP_SERVER_NAME", "jenkins-mcp-server"),
  serverVersion: getEnv("MCP_SERVER_VERSION", "2.3.1"),

  // Jenkins configuration - use lazy validation for required fields
  jenkinsUrl: getEnv("JENKINS_URL"), // Will be validated when accessed
  jenkinsUsername: Deno.env.get("JENKINS_USERNAME"),
  jenkinsApiToken: Deno.env.get("JENKINS_API_TOKEN"),
  jenkinsPassword: Deno.env.get("JENKINS_PASSWORD"),

  // SSL/TLS configuration
  ssl: getSSLConfig(),

  // Security configuration
  allowedDomains: parseArrayEnv("ALLOWED_DOMAINS"),
  rateLimitPerMinute: parseIntEnv("RATE_LIMIT_PER_MINUTE", 60),

  // Logging configuration
  logLevel: getEnv("LOG_LEVEL", "INFO"),
  enableAuditLog: parseBooleanEnv("ENABLE_AUDIT_LOG", true),
};

/**
 * Initialize config with actual version from deno.json
 */
export async function initializeConfig(): Promise<void> {
  try {
    const actualVersion = await getVersion();
    // Update the config object in place
    Object.assign(config, { serverVersion: actualVersion });
  } catch (error) {
    console.error("Failed to initialize version:", error);
  }
}

/**
 * Validate configuration - improved validation with better error messages
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Validate required Jenkins URL
  if (!config.jenkinsUrl || config.jenkinsUrl.trim() === "") {
    errors.push(
      "JENKINS_URL environment variable is required and cannot be empty",
    );
  } else {
    try {
      new URL(config.jenkinsUrl);
    } catch {
      errors.push(
        `JENKINS_URL must be a valid URL, got: "${config.jenkinsUrl}"`,
      );
    }
  }

  // Validate authentication
  if (!config.jenkinsApiToken && !config.jenkinsPassword) {
    errors.push(
      "Authentication required: Either JENKINS_API_TOKEN or JENKINS_PASSWORD must be provided",
    );
  }

  if (config.jenkinsPassword && !config.jenkinsUsername) {
    errors.push(
      "JENKINS_USERNAME is required when using JENKINS_PASSWORD authentication",
    );
  }

  // Provide helpful error message with all issues
  if (errors.length > 0) {
    const errorMessage = [
      "❌ Jenkins MCP Server Configuration Errors:",
      "",
      ...errors.map((err) => `  • ${err}`),
      "",
      "💡 Tips:",
      "  • Copy .env.example to .env.local and configure your Jenkins settings",
      "  • For Docker: ensure environment variables are provided via docker-compose.yml or -e flags",
      "  • For binary: run 'make start' to automatically load .env.local",
      "",
    ].join("\n");

    throw new Error(errorMessage);
  }
}
