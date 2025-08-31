/**
 * Configuration management tests
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { config } from "../src/utils/config.ts";

Deno.test("Config - Environment Variables", () => {
  // Test that config loading works
  
  // These should always exist (with defaults if not set)
  assertExists(config.serverName);
  assertExists(config.serverVersion);
  assertExists(config.logLevel);
  
  // Default values should be set
  assertEquals(config.serverName, "jenkins-mcp-server");
  assertEquals(config.serverVersion, "1.0.0");
  assertEquals(config.logLevel, "INFO");
});

Deno.test("Config - Jenkins Configuration", () => {
  // Test Jenkins URL is required (should exist from environment or throw during validation)
  assertExists(config.jenkinsUrl);
  
  // Check that timeout and retries have defaults (if implemented)
  assertExists(config.rateLimitPerMinute);
  assertEquals(typeof config.rateLimitPerMinute, "number");
});
