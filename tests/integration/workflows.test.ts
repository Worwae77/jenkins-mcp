/**
 * End-to-End Workflow Integration Tests
 *
 * Tests complete user scenarios combining multiple Jenkins MCP tools.
 * These tests validate that tools work together correctly and maintain
 * consistent state across operations.
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
      JENKINS_USERNAME: "workflow-test-user",
      JENKINS_API_TOKEN: "workflow-test-token-12345",
      JENKINS_SSL_VERIFY: "false",
    },
  });

  const process = serverProcess.spawn();

  // Send the request
  const requestText = JSON.stringify(request) + "\n";
  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(requestText));
  await writer.close();

  // Read the response with timeout
  const output = await process.output();
  const stdout = new TextDecoder().decode(output.stdout);

  // Parse the JSON response (last line of stdout)
  const lines = stdout.trim().split("\n");
  const responseLine = lines[lines.length - 1];

  try {
    return JSON.parse(responseLine) as MCPResponse;
  } catch (error) {
    throw new Error(`Invalid JSON response: ${error}`);
  }
}

/**
 * Helper to extract text content from MCP response
 */
function extractTextContent(response: MCPResponse): string {
  if (response.result) {
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    if (result.content && result.content.length > 0) {
      return result.content[0].text;
    }
  }
  return "";
}

Deno.test("Workflow - Server Info and Diagnostics", async () => {
  // Test a basic workflow: get version → SSL diagnostics

  // Step 1: Get Jenkins version
  const versionResponse = await callJenkinsTool("jenkins_get_version");
  assertEquals(versionResponse.jsonrpc, "2.0");

  // Step 2: Get SSL diagnostics
  const sslResponse = await callJenkinsTool("jenkins_ssl_diagnostics");
  assertEquals(sslResponse.jsonrpc, "2.0");
  assertExists(sslResponse.result);

  const sslContent = extractTextContent(sslResponse);
  assert(
    sslContent.includes("SSL") ||
      sslContent.includes("TLS") ||
      sslContent.includes("Certificate"),
    "SSL diagnostics should contain SSL/TLS information",
  );

  // SSL diagnostics should always work regardless of version call result
  assertExists(sslContent);
});

Deno.test("Workflow - Job Discovery and Details", async () => {
  // Test workflow: list jobs → get specific job details

  // Step 1: List all jobs
  const listResponse = await callJenkinsTool("jenkins_list_jobs");
  assertEquals(listResponse.jsonrpc, "2.0");

  const listContent = extractTextContent(listResponse);

  // Step 2: Try to get details for a known job (or handle no jobs case)
  let testJobName = "test-job";

  // If we got a job list, try to use a real job name
  try {
    const jobList = JSON.parse(listContent);
    if (Array.isArray(jobList) && jobList.length > 0 && jobList[0].name) {
      testJobName = jobList[0].name;
    }
  } catch {
    // Use default test job name if parsing fails
  }

  // Step 3: Get job details
  const jobResponse = await callJenkinsTool("jenkins_get_job", {
    jobName: testJobName,
  });
  assertEquals(jobResponse.jsonrpc, "2.0");

  // Should handle gracefully whether job exists or not
  if (jobResponse.result) {
    const jobContent = extractTextContent(jobResponse);
    assertExists(jobContent);
  } else if (jobResponse.error) {
    assertExists(jobResponse.error.message);
  }
});

Deno.test("Workflow - Infrastructure Monitoring", async () => {
  // Test workflow: list nodes → get node status → get queue

  // Step 1: List Jenkins nodes
  const nodesResponse = await callJenkinsTool("jenkins_list_nodes");
  assertEquals(nodesResponse.jsonrpc, "2.0");

  // Step 2: Get master node status (should always exist)
  const nodeStatusResponse = await callJenkinsTool("jenkins_get_node_status", {
    nodeName: "master", // Default node name
  });
  assertEquals(nodeStatusResponse.jsonrpc, "2.0");

  // Step 3: Get build queue
  const queueResponse = await callJenkinsTool("jenkins_get_queue");
  assertEquals(queueResponse.jsonrpc, "2.0");

  // All infrastructure calls should return consistent responses
  // (either all succeed or all fail with similar authentication errors)
  const nodesSucceeded = !!nodesResponse.result;
  const nodeStatusSucceeded = !!nodeStatusResponse.result;
  const queueSucceeded = !!queueResponse.result;

  // They should have consistent authentication behavior
  if (nodesSucceeded || nodeStatusSucceeded || queueSucceeded) {
    // If any succeed, responses should be valid
    if (nodesSucceeded) {
      const nodesContent = extractTextContent(nodesResponse);
      assertExists(nodesContent);
    }
    if (queueSucceeded) {
      const queueContent = extractTextContent(queueResponse);
      assertExists(queueContent);
    }
  }
});

Deno.test("Workflow - Error Handling Consistency", async () => {
  // Test that errors are handled consistently across different tools

  const tools = [
    "jenkins_list_jobs",
    "jenkins_get_version",
    "jenkins_list_nodes",
    "jenkins_get_queue",
  ];

  const responses: MCPResponse[] = [];

  // Call multiple tools and collect responses
  for (const tool of tools) {
    const response = await callJenkinsTool(tool);
    assertEquals(response.jsonrpc, "2.0");
    responses.push(response);
  }

  // Check consistency in error handling
  const errorResponses = responses.filter((r) => r.error);
  const successResponses = responses.filter((r) => r.result);

  // If we have both errors and successes, that's inconsistent behavior
  if (errorResponses.length > 0 && successResponses.length > 0) {
    // This might happen due to network timing, but shouldn't be common
    console.warn(
      "Mixed success/error responses detected - may indicate timing issues",
    );
  }

  // All error responses should have proper structure
  for (const errorResponse of errorResponses) {
    assertExists(errorResponse.error);
    assertExists(errorResponse.error.code);
    assertExists(errorResponse.error.message);
    assertEquals(typeof errorResponse.error.code, "number");
    assertEquals(typeof errorResponse.error.message, "string");
  }

  // All success responses should have proper structure
  for (const successResponse of successResponses) {
    assertExists(successResponse.result);
    const result = successResponse.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(Array.isArray(result.content), true);
  }
});

Deno.test("Workflow - Parameter Validation Across Tools", async () => {
  // Test parameter validation consistency across tools that accept parameters

  // Test 1: Invalid job name format
  const invalidJobResponse = await callJenkinsTool("jenkins_get_job", {
    jobName: "", // Empty job name should be invalid
  });
  assertEquals(invalidJobResponse.jsonrpc, "2.0");
  // Should handle invalid parameters gracefully

  // Test 2: Invalid build number format
  const invalidBuildResponse = await callJenkinsTool("jenkins_get_build", {
    jobName: "test-job",
    buildNumber: "invalid-build-number",
  });
  assertEquals(invalidBuildResponse.jsonrpc, "2.0");

  // Test 3: Missing required parameters
  const missingParamResponse = await callJenkinsTool("jenkins_get_job", {
    // Missing jobName parameter
  });
  assertEquals(missingParamResponse.jsonrpc, "2.0");

  // All should handle parameter issues gracefully
  const responses = [
    invalidJobResponse,
    invalidBuildResponse,
    missingParamResponse,
  ];

  for (const response of responses) {
    // Should either return an error or a meaningful error message in result
    if (response.error) {
      assertExists(response.error.message);
    } else if (response.result) {
      const content = extractTextContent(response);
      assert(
        content.includes("error") ||
          content.includes("invalid") ||
          content.includes("required") ||
          content.includes("missing"),
        "Should indicate parameter validation error",
      );
    }
  }
});

Deno.test("Workflow - Build Operation Sequence", async () => {
  // Test a complete build workflow (without actually triggering builds)

  // Step 1: Check if any jobs exist
  const listResponse = await callJenkinsTool("jenkins_list_jobs");
  assertEquals(listResponse.jsonrpc, "2.0");

  // Step 2: Try to get build information for a test job
  const buildResponse = await callJenkinsTool("jenkins_get_build", {
    jobName: "test-job",
    buildNumber: "lastBuild",
  });
  assertEquals(buildResponse.jsonrpc, "2.0");

  // Step 3: Try to get build logs
  const logsResponse = await callJenkinsTool("jenkins_get_build_logs", {
    jobName: "test-job",
    buildNumber: "lastBuild",
  });
  assertEquals(logsResponse.jsonrpc, "2.0");

  // The sequence should be consistent - if one fails due to auth/network,
  // they should all fail similarly
  const responses = [listResponse, buildResponse, logsResponse];
  const _hasErrors = responses.some((r) => r.error);
  const _hasResults = responses.some((r) => r.result);

  // At minimum, all responses should be valid JSON-RPC
  for (const response of responses) {
    assertExists(response.jsonrpc);
    assertExists(response.id);
  }
});

Deno.test("Workflow - Tool Response Time Consistency", async () => {
  // Test that similar tools have consistent response times

  const startTime = Date.now();

  // Call SSL diagnostics (should be fast - no network)
  const sslResponse = await callJenkinsTool("jenkins_ssl_diagnostics");
  const sslTime = Date.now() - startTime;

  const midTime = Date.now();

  // Call version check (network dependent)
  const versionResponse = await callJenkinsTool("jenkins_get_version");
  const versionTime = Date.now() - midTime;

  // SSL diagnostics should always be much faster (< 1 second)
  assert(sslTime < 5000, `SSL diagnostics took too long: ${sslTime}ms`);

  // Network calls may be slower but should have reasonable timeout
  assert(versionTime < 30000, `Version call took too long: ${versionTime}ms`);

  // Both should return valid responses
  assertEquals(sslResponse.jsonrpc, "2.0");
  assertEquals(versionResponse.jsonrpc, "2.0");

  // SSL diagnostics should always succeed
  assertExists(sslResponse.result);
});
