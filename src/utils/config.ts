/**
 * Configuration management for Jenkins MCP Server
 */

interface Config {
  // Server configuration
  serverName: string;
  serverVersion: string;

  // Jenkins configuration
  jenkinsUrl: string;
  jenkinsUsername?: string;
  jenkinsApiToken?: string;
  jenkinsPassword?: string;

  // Security configuration
  allowedDomains?: string[];
  rateLimitPerMinute: number;

  // Logging configuration
  logLevel: string;
  enableAuditLog: boolean;
}

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, fallback?: string): string {
  const value = Deno.env.get(key);
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
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
  serverVersion: getEnv("MCP_SERVER_VERSION", "1.0.0"),

  // Jenkins configuration
  jenkinsUrl: getEnv("JENKINS_URL"),
  jenkinsUsername: Deno.env.get("JENKINS_USERNAME"),
  jenkinsApiToken: Deno.env.get("JENKINS_API_TOKEN"),
  jenkinsPassword: Deno.env.get("JENKINS_API_PASSWORD"),

  // Security configuration
  allowedDomains: parseArrayEnv("ALLOWED_DOMAINS"),
  rateLimitPerMinute: parseInt(getEnv("RATE_LIMIT_PER_MINUTE", "60")),

  // Logging configuration
  logLevel: getEnv("LOG_LEVEL", "INFO"),
  enableAuditLog: getEnv("ENABLE_AUDIT_LOG", "true") === "true",
};

/**
 * Validate configuration
 */
export function validateConfig(): void {
  if (!config.jenkinsUrl) {
    throw new Error("JENKINS_URL environment variable is required");
  }

  if (!config.jenkinsApiToken && !config.jenkinsPassword) {
    throw new Error(
      "Either JENKINS_API_TOKEN or JENKINS_API_PASSWORD must be provided",
    );
  }

  if (config.jenkinsPassword && !config.jenkinsUsername) {
    throw new Error("JENKINS_USERNAME is required when using JENKINS_API_PASSWORD");
  }

  try {
    new URL(config.jenkinsUrl);
  } catch {
    throw new Error("JENKINS_URL must be a valid URL");
  }
}

// Validate configuration on import
validateConfig();
