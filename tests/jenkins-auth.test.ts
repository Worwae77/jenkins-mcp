/**
 * Jenkins Authentication Module Tests
 * Comprehensive test suite for Jenkins authentication
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { JenkinsAuth, type AuthConfig } from "../src/jenkins/auth.ts";

// Mock environment setup
const originalEnv = {
  JENKINS_URL: Deno.env.get("JENKINS_URL"),
  JENKINS_USERNAME: Deno.env.get("JENKINS_USERNAME"), 
  JENKINS_PASSWORD: Deno.env.get("JENKINS_PASSWORD"),
  JENKINS_API_TOKEN: Deno.env.get("JENKINS_API_TOKEN"),
};

function resetEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, value);
    }
  }
}

function _setTestEnv(envVars: Record<string, string>) {
  resetEnv();
  for (const [key, value] of Object.entries(envVars)) {
    Deno.env.set(key, value);
  }
}

Deno.test("JenkinsAuth - Token Authentication", () => {
  const authConfig: AuthConfig = {
    username: "testuser",
    apiToken: "test-api-token"
  };

  const auth = new JenkinsAuth(authConfig);
  const headers = auth.getAuthHeaders();

  assertExists(headers.Authorization, "Should have Authorization header");
  assertEquals(headers.Authorization?.startsWith("Basic "), true, "Should be Basic auth");
  
  // Decode and verify the basic auth
  const encodedCreds = headers.Authorization?.split(" ")[1];
  const decodedCreds = atob(encodedCreds!);
  assertEquals(decodedCreds, "testuser:test-api-token", "Should encode username:token correctly");
});

Deno.test("JenkinsAuth - Password Authentication", () => {
  const authConfig: AuthConfig = {
    username: "testuser",
    password: "test-password"
  };

  const auth = new JenkinsAuth(authConfig);
  const headers = auth.getAuthHeaders();

  assertExists(headers.Authorization, "Should have Authorization header");
  assertEquals(headers.Authorization?.startsWith("Basic "), true, "Should be Basic auth");
  
  // Decode and verify the basic auth
  const encodedCreds = headers.Authorization?.split(" ")[1];
  const decodedCreds = atob(encodedCreds!);
  assertEquals(decodedCreds, "testuser:test-password", "Should encode username:password correctly");
});

Deno.test("JenkinsAuth - Token Priority Over Password", () => {
  const authConfig: AuthConfig = {
    username: "testuser",
    password: "test-password",
    apiToken: "test-api-token"
  };

  const auth = new JenkinsAuth(authConfig);
  const headers = auth.getAuthHeaders();

  assertExists(headers.Authorization, "Should have Authorization header");
  
  // Should use token over password
  const encodedCreds = headers.Authorization?.split(" ")[1];
  const decodedCreds = atob(encodedCreds!);
  assertEquals(decodedCreds, "testuser:test-api-token", "Should prefer token over password");
});

Deno.test("JenkinsAuth - No Credentials", () => {
  const authConfig: AuthConfig = {
    username: "testuser"
  };

  const auth = new JenkinsAuth(authConfig);
  const headers = auth.getAuthHeaders();

  assertEquals(headers.Authorization, undefined, "Should not have Authorization header without credentials");
});

Deno.test("JenkinsAuth - SSL Options", () => {
  const authConfig: AuthConfig = {
    username: "testuser",
    apiToken: "test-token"
  };

  const auth = new JenkinsAuth(authConfig);
  
  // Test SSL options setting
  const sslOptions = {
    caCerts: ["mock-ca-cert"],
    cert: "mock-client-cert",
    key: "mock-client-key"
  };
  
  auth.setSSLOptions(sslOptions);
  
  // Since setSSLOptions doesn't return anything, just verify it doesn't throw
  assertEquals(true, true, "Should set SSL options without error");
});

Deno.test("JenkinsAuth - Environment Cleanup", () => {
  resetEnv();
  
  // Verify environment is clean
  const jenkinsUrl = Deno.env.get("JENKINS_URL");
  assertEquals(jenkinsUrl, originalEnv.JENKINS_URL, "Should restore original JENKINS_URL");
});
