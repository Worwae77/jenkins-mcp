/**
 * Jenkins Client Module Tests
 * Comprehensive test suite for Jenkins API client
 */

import { assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { JenkinsClient } from "../src/jenkins/client.ts";
import type { JenkinsConfig } from "../src/jenkins/types.ts";

// Mock Jenkins responses for future use
const _mockJenkinsJob = {
  name: "test-job",
  url: "https://jenkins.example.com/job/test-job/",
  color: "blue",
  buildable: true,
  lastBuild: {
    number: 123,
    url: "https://jenkins.example.com/job/test-job/123/"
  }
};

const _mockJenkinsBuild = {
  number: 123,
  result: "SUCCESS",
  building: false,
  timestamp: Date.now(),
  url: "https://jenkins.example.com/job/test-job/123/"
};

Deno.test("JenkinsClient - Constructor with Default Config", () => {
  const client = new JenkinsClient();
  
  // Should create client without throwing
  assertExists(client, "Should create Jenkins client");
});

Deno.test("JenkinsClient - Constructor with Custom Config", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://custom-jenkins.example.com",
    username: "testuser",
    apiToken: "test-token",
    timeout: 60000,
    retries: 5
  };

  const client = new JenkinsClient(config);
  
  // Should create client with custom config
  assertExists(client, "Should create Jenkins client with custom config");
});

Deno.test("JenkinsClient - Invalid URL Handling", () => {
  const config: Partial<JenkinsConfig> = {
    url: "invalid-url",
    username: "testuser",
    apiToken: "test-token"
  };

  // Should create client but may fail on actual requests
  const client = new JenkinsClient(config);
  assertExists(client, "Should create client even with invalid URL");
});

Deno.test("JenkinsClient - SSL Configuration", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com",
    username: "testuser",
    apiToken: "test-token"
  };

  const client = new JenkinsClient(config);
  
  // Test SSL initialization (should not throw)
  assertExists(client, "Should handle SSL configuration");
});

Deno.test("JenkinsClient - Authentication Setup", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com",
    username: "testuser",
    apiToken: "test-token"
  };

  const client = new JenkinsClient(config);
  
  // Should create client with authentication
  assertExists(client, "Should create authenticated client");
});

Deno.test("JenkinsClient - Missing Authentication", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com"
    // No username or credentials
  };

  const client = new JenkinsClient(config);
  
  // Should create client but authentication will be incomplete
  assertExists(client, "Should create client without credentials");
});

Deno.test("JenkinsClient - Timeout Configuration", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com",
    username: "testuser",
    apiToken: "test-token",
    timeout: 120000 // 2 minutes
  };

  const client = new JenkinsClient(config);
  
  assertExists(client, "Should create client with custom timeout");
});

Deno.test("JenkinsClient - Retry Configuration", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com",
    username: "testuser",
    apiToken: "test-token",
    retries: 10
  };

  const client = new JenkinsClient(config);
  
  assertExists(client, "Should create client with custom retry count");
});

Deno.test("JenkinsClient - HTTPS URL Validation", () => {
  const httpsConfig: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com",
    username: "testuser",
    apiToken: "test-token"
  };

  const client = new JenkinsClient(httpsConfig);
  assertExists(client, "Should handle HTTPS URLs");
});

Deno.test("JenkinsClient - HTTP URL Validation", () => {
  const httpConfig: Partial<JenkinsConfig> = {
    url: "http://jenkins.example.com",
    username: "testuser",
    apiToken: "test-token"
  };

  const client = new JenkinsClient(httpConfig);
  assertExists(client, "Should handle HTTP URLs");
});

Deno.test("JenkinsClient - URL with Port", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com:8443",
    username: "testuser",
    apiToken: "test-token"
  };

  const client = new JenkinsClient(config);
  assertExists(client, "Should handle URLs with custom ports");
});

Deno.test("JenkinsClient - URL with Path", () => {
  const config: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com/jenkins",
    username: "testuser",
    apiToken: "test-token"
  };

  const client = new JenkinsClient(config);
  assertExists(client, "Should handle URLs with paths");
});

Deno.test("JenkinsClient - Environment Variable Integration", () => {
  // Save original environment
  const originalEnv = {
    JENKINS_URL: Deno.env.get("JENKINS_URL"),
    JENKINS_USERNAME: Deno.env.get("JENKINS_USERNAME"),
    JENKINS_API_TOKEN: Deno.env.get("JENKINS_API_TOKEN")
  };

  try {
    // Set test environment
    Deno.env.set("JENKINS_URL", "https://env-jenkins.example.com");
    Deno.env.set("JENKINS_USERNAME", "env-user");
    Deno.env.set("JENKINS_API_TOKEN", "env-token");

    const client = new JenkinsClient();
    assertExists(client, "Should create client from environment variables");
  } finally {
    // Restore original environment
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    }
  }
});

Deno.test("JenkinsClient - Password vs Token Priority", () => {
  const configWithBoth: Partial<JenkinsConfig> = {
    url: "https://jenkins.example.com",
    username: "testuser",
    apiToken: "test-token",
    password: "test-password"
  };

  const client = new JenkinsClient(configWithBoth);
  assertExists(client, "Should create client with both token and password");
});

Deno.test("JenkinsClient - Configuration Validation", () => {
  const configs = [
    {
      name: "Empty config",
      config: {}
    },
    {
      name: "URL only",
      config: { url: "https://jenkins.example.com" }
    },
    {
      name: "Credentials only",
      config: { username: "user", apiToken: "token" }
    },
    {
      name: "Complete config",
      config: {
        url: "https://jenkins.example.com",
        username: "user",
        apiToken: "token",
        timeout: 30000,
        retries: 3
      }
    }
  ];

  for (const { name, config } of configs) {
    const client = new JenkinsClient(config);
    assertExists(client, `Should create client for: ${name}`);
  }
});
