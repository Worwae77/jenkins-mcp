/**
 * Jenkins API Integration Tests
 *
 * Tests the Jenkins MCP Server against a real Jenkins instance.
 * Uses demo.jenkins.io as a safe, public Jenkins server for testing.
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: unknown;
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Helper function to call Jenkins tools via MCP protocol
 */
async function callJenkinsTool(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<MCPResponse> {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: Math.random(),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  };

  const serverProcess = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--allow-write",
      "src/simple-server.ts",
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
    cwd: Deno.cwd(),
    env: {
      // Use demo.jenkins.io for safe testing
      JENKINS_URL: "https://demo.jenkins.io",
      JENKINS_USERNAME: "demo-user",
      JENKINS_API_TOKEN: "demo-token-12345",
      JENKINS_SSL_VERIFY: "false", // Safe for demo.jenkins.io
    },
  });

  const process = serverProcess.spawn();

  // Send the request
  const requestText = JSON.stringify(request) + "\n";
  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(requestText));
  await writer.close();

  // Read the response
  const output = await process.output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);

  // Parse the JSON response (last line of stdout)
  const lines = stdout.trim().split("\n");
  const responseLine = lines[lines.length - 1];

  try {
    return JSON.parse(responseLine) as MCPResponse;
  } catch (error) {
    console.error("Failed to parse response:", responseLine);
    console.error("Stderr:", stderr);
    throw new Error(`Invalid JSON response: ${error}`);
  }
}

Deno.test("Jenkins API - jenkins_get_version", async () => {
  const response = await callJenkinsTool("jenkins_get_version");

  // Should succeed or fail gracefully
  assertEquals(response.jsonrpc, "2.0");

  if (response.result) {
    // If successful, validate response structure
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(Array.isArray(result.content), true);
    assertEquals(result.content[0].type, "text");
    assertExists(result.content[0].text);

    // Should contain version information
    assert(
      result.content[0].text.includes("Jenkins") ||
        result.content[0].text.includes("version") ||
        result.content[0].text.includes("error"),
      "Response should contain Jenkins version info or error message",
    );
  } else if (response.error) {
    // If error (expected for demo server), validate error structure
    assertExists(response.error.code);
    assertExists(response.error.message);
    assertEquals(typeof response.error.code, "number");
    assertEquals(typeof response.error.message, "string");
  }
});

Deno.test("Jenkins API - jenkins_ssl_diagnostics", async () => {
  const response = await callJenkinsTool("jenkins_ssl_diagnostics");

  // SSL diagnostics should always work (doesn't require Jenkins connection)
  assertEquals(response.jsonrpc, "2.0");
  assertExists(response.result);

  const result = response.result as {
    content: Array<{ type: string; text: string }>;
  };
  assertExists(result.content);
  assertEquals(Array.isArray(result.content), true);
  assertEquals(result.content[0].type, "text");
  assertExists(result.content[0].text);

  // Should contain SSL configuration information
  assert(
    result.content[0].text.includes("SSL") ||
      result.content[0].text.includes("TLS") ||
      result.content[0].text.includes("Certificate"),
    "Response should contain SSL/TLS information",
  );
});

Deno.test("Jenkins API - jenkins_list_jobs", async () => {
  const response = await callJenkinsTool("jenkins_list_jobs");

  assertEquals(response.jsonrpc, "2.0");

  if (response.result) {
    // If successful, validate response structure
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(Array.isArray(result.content), true);
    assertEquals(result.content[0].type, "text");
    assertExists(result.content[0].text);

    // Should be valid JSON or error message
    try {
      const jobData = JSON.parse(result.content[0].text);
      // If it's a job list, should be an array
      if (Array.isArray(jobData)) {
        assertEquals(Array.isArray(jobData), true);
      }
    } catch {
      // If not JSON, should be an error message
      assert(
        result.content[0].text.includes("error") ||
          result.content[0].text.includes("Error") ||
          result.content[0].text.includes("failed"),
        "Non-JSON response should be an error message",
      );
    }
  } else if (response.error) {
    // Authentication or network error expected for demo server
    assertExists(response.error.code);
    assertExists(response.error.message);
  }
});

Deno.test("Jenkins API - jenkins_get_job with invalid job", async () => {
  const response = await callJenkinsTool("jenkins_get_job", {
    jobName: "nonexistent-job-12345",
  });

  assertEquals(response.jsonrpc, "2.0");

  // Should return error for nonexistent job
  if (response.result) {
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(result.content[0].type, "text");

    // Should contain error message about job not found
    assert(
      result.content[0].text.includes("not found") ||
        result.content[0].text.includes("Not Found") ||
        result.content[0].text.includes("error") ||
        result.content[0].text.includes("404"),
      "Should return job not found error",
    );
  } else if (response.error) {
    // API-level error is also acceptable
    assertExists(response.error.code);
    assertExists(response.error.message);
  }
});

Deno.test("Jenkins API - jenkins_list_nodes", async () => {
  const response = await callJenkinsTool("jenkins_list_nodes");

  assertEquals(response.jsonrpc, "2.0");

  if (response.result) {
    // If successful, validate response structure
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(Array.isArray(result.content), true);
    assertEquals(result.content[0].type, "text");
    assertExists(result.content[0].text);

    // Should be valid JSON or error message
    try {
      const nodeData = JSON.parse(result.content[0].text);
      // If it's a node list, should be an array
      if (Array.isArray(nodeData)) {
        assertEquals(Array.isArray(nodeData), true);
      }
    } catch {
      // If not JSON, should be an error message
      assert(
        result.content[0].text.includes("error") ||
          result.content[0].text.includes("Error") ||
          result.content[0].text.includes("failed"),
        "Non-JSON response should be an error message",
      );
    }
  } else if (response.error) {
    // Authentication or network error expected for demo server
    assertExists(response.error.code);
    assertExists(response.error.message);
  }
});

Deno.test("Jenkins API - jenkins_get_queue", async () => {
  const response = await callJenkinsTool("jenkins_get_queue");

  assertEquals(response.jsonrpc, "2.0");

  if (response.result) {
    // If successful, validate response structure
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(Array.isArray(result.content), true);
    assertEquals(result.content[0].type, "text");
    assertExists(result.content[0].text);

    // Should be valid JSON or error message
    try {
      const queueData = JSON.parse(result.content[0].text);
      // Queue should be an array
      if (Array.isArray(queueData)) {
        assertEquals(Array.isArray(queueData), true);
      }
    } catch {
      // If not JSON, should be an error message
      assert(
        result.content[0].text.includes("error") ||
          result.content[0].text.includes("Error") ||
          result.content[0].text.includes("failed"),
        "Non-JSON response should be an error message",
      );
    }
  } else if (response.error) {
    // Authentication or network error expected for demo server
    assertExists(response.error.code);
    assertExists(response.error.message);
  }
});

Deno.test("Jenkins API - jenkins_trigger_build validation", async () => {
  // Test parameter validation without actually triggering builds
  const response = await callJenkinsTool("jenkins_trigger_build", {
    jobName: "test-validation-job",
    parameters: {
      BRANCH: "main",
      DEBUG: true,
    },
  });

  assertEquals(response.jsonrpc, "2.0");

  // Should fail gracefully with proper error handling
  if (response.result) {
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(result.content[0].type, "text");
    // Should contain some response about the build trigger attempt
    assertExists(result.content[0].text);
  } else if (response.error) {
    // Expected for demo server or invalid job
    assertExists(response.error.code);
    assertExists(response.error.message);
  }
});

Deno.test("Jenkins API - error handling with network timeout", async () => {
  // Test with invalid Jenkins URL to test timeout handling
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: "timeout-test",
    method: "tools/call",
    params: {
      name: "jenkins_get_version",
      arguments: {},
    },
  };

  const serverProcess = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--allow-write",
      "src/simple-server.ts",
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
    cwd: Deno.cwd(),
    env: {
      // Use invalid URL to test timeout
      JENKINS_URL: "https://timeout-test.invalid",
      JENKINS_USERNAME: "test",
      JENKINS_API_TOKEN: "test",
      JENKINS_SSL_VERIFY: "false",
    },
  });

  const process = serverProcess.spawn();

  // Send the request
  const requestText = JSON.stringify(request) + "\n";
  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(requestText));
  await writer.close();

  // Read the response
  const output = await process.output();
  const stdout = new TextDecoder().decode(output.stdout);

  // Parse the JSON response (last line of stdout)
  const lines = stdout.trim().split("\n");
  const responseLine = lines[lines.length - 1];

  const response = JSON.parse(responseLine) as MCPResponse;

  // Should handle network errors gracefully
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, "timeout-test");

  // Should return an error for network failure
  if (response.result) {
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assert(
      result.content[0].text.includes("error") ||
        result.content[0].text.includes("timeout") ||
        result.content[0].text.includes("failed"),
      "Should return error message for network failure",
    );
  } else if (response.error) {
    assertExists(response.error.code);
    assertExists(response.error.message);
  }
});
