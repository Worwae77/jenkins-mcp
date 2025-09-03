/**
 * MCP Protocol Integration Tests
 *
 * Tests the Jenkins MCP Server end-to-end via the Model Context Protocol.
 * These tests validate JSON-RPC 2.0 compliance and actual tool functionality
 * by communicating with the server as a subprocess.
 */

import {
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

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Helper function to start the MCP server and send a request
 */
async function sendMCPRequest(request: MCPRequest): Promise<MCPResponse> {
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
      // Use safe test environment
      JENKINS_URL: "https://demo.jenkins.io",
      JENKINS_USERNAME: "integration-test-user",
      JENKINS_API_TOKEN: "integration-test-token-12345",
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

Deno.test("MCP Protocol - tools/list compliance", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  };

  const response = await sendMCPRequest(request);

  // Validate JSON-RPC 2.0 compliance
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 1);
  assertExists(response.result);

  // Validate tools structure
  const result = response.result as { tools: MCPTool[] };
  assertExists(result.tools);
  assertEquals(Array.isArray(result.tools), true);

  // Should have exactly 13 tools as documented
  assertEquals(result.tools.length, 13);

  // Validate tool structure
  for (const tool of result.tools) {
    assertExists(tool.name);
    assertExists(tool.description);
    assertExists(tool.inputSchema);
    assertEquals(typeof tool.name, "string");
    assertEquals(typeof tool.description, "string");
    assertEquals(typeof tool.inputSchema, "object");
  }

  // Validate specific expected tools exist
  const toolNames = result.tools.map((t) => t.name);
  const expectedTools = [
    "jenkins_list_jobs",
    "jenkins_get_job",
    "jenkins_trigger_build",
    "jenkins_get_version",
    "jenkins_get_build_logs",
    "jenkins_create_job",
    "jenkins_get_build",
    "jenkins_stop_build",
    "jenkins_list_nodes",
    "jenkins_get_node_status",
    "jenkins_get_queue",
    "jenkins_cancel_queue_item",
    "jenkins_ssl_diagnostics",
  ];

  for (const expectedTool of expectedTools) {
    assertEquals(
      toolNames.includes(expectedTool),
      true,
      `Expected tool ${expectedTool} not found in: ${toolNames.join(", ")}`,
    );
  }
});

Deno.test("MCP Protocol - prompts/list compliance", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "prompts/list",
  };

  const response = await sendMCPRequest(request);

  // Validate JSON-RPC 2.0 compliance
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 2);
  assertExists(response.result);

  // Validate prompts structure
  const result = response.result as {
    prompts: Array<{ name: string; description: string }>;
  };
  assertExists(result.prompts);
  assertEquals(Array.isArray(result.prompts), true);

  // Should have exactly 2 prompts as documented
  assertEquals(result.prompts.length, 2);

  // Validate expected prompts
  const promptNames = result.prompts.map((p) => p.name);
  assertEquals(
    promptNames.includes("jenkins_troubleshoot_build_failure"),
    true,
  );
  assertEquals(promptNames.includes("jenkins_pipeline_best_practices"), true);
});

Deno.test("MCP Protocol - resources/list compliance", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "resources/list",
  };

  const response = await sendMCPRequest(request);

  // Validate JSON-RPC 2.0 compliance
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 3);
  assertExists(response.result);

  // Validate resources structure
  const result = response.result as {
    resources: Array<{ uri: string; name: string }>;
  };
  assertExists(result.resources);
  assertEquals(Array.isArray(result.resources), true);

  // Should have exactly 1 resource as documented
  assertEquals(result.resources.length, 1);

  // Validate expected resource
  const resource = result.resources[0];
  assertEquals(resource.uri, "jenkins://jobs");
  assertEquals(resource.name, "Jenkins Jobs");
});

Deno.test("MCP Protocol - tools/call jenkins_get_version", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "jenkins_get_version",
      arguments: {},
    },
  };

  const response = await sendMCPRequest(request);

  // Validate JSON-RPC 2.0 compliance
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 4);

  // This may succeed or fail depending on Jenkins availability
  // We're testing the protocol structure, not necessarily the Jenkins response
  if (response.result) {
    // If successful, validate structure
    const result = response.result as {
      content: Array<{ type: string; text: string }>;
    };
    assertExists(result.content);
    assertEquals(Array.isArray(result.content), true);
    if (result.content.length > 0) {
      assertEquals(result.content[0].type, "text");
      assertExists(result.content[0].text);
    }
  } else if (response.error) {
    // If error, validate error structure
    assertExists(response.error.code);
    assertExists(response.error.message);
    assertEquals(typeof response.error.code, "number");
    assertEquals(typeof response.error.message, "string");
  }
});

Deno.test("MCP Protocol - tools/call with invalid tool", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "nonexistent_tool",
      arguments: {},
    },
  };

  const response = await sendMCPRequest(request);

  // Should return an error for invalid tool
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 5);
  assertExists(response.error);
  assertEquals(typeof response.error.code, "number");
  assertEquals(typeof response.error.message, "string");
});

Deno.test("MCP Protocol - malformed JSON-RPC request", async () => {
  const request = {
    // Missing jsonrpc field - invalid JSON-RPC 2.0
    id: 6,
    method: "tools/list",
  };

  try {
    const response = await sendMCPRequest(request as MCPRequest);

    // Should handle gracefully with error response
    if (response.error) {
      assertExists(response.error.code);
      assertExists(response.error.message);
    }
  } catch (error) {
    // May throw if server rejects completely malformed requests
    assertEquals(error instanceof Error, true);
  }
});

Deno.test("MCP Protocol - tools/call jenkins_ssl_diagnostics", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: {
      name: "jenkins_ssl_diagnostics",
      arguments: {},
    },
  };

  const response = await sendMCPRequest(request);

  // Validate JSON-RPC 2.0 compliance
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 7);

  // SSL diagnostics should always work (doesn't require Jenkins connection)
  assertExists(response.result);
  const result = response.result as {
    content: Array<{ type: string; text: string }>;
  };
  assertExists(result.content);
  assertEquals(Array.isArray(result.content), true);
  assertEquals(result.content[0].type, "text");
  assertExists(result.content[0].text);

  // Should contain SSL configuration information
  assertEquals(result.content[0].text.includes("SSL"), true);
});

Deno.test("MCP Protocol - invalid method", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    id: 8,
    method: "invalid/method",
  };

  const response = await sendMCPRequest(request);

  // Should return method not found error
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 8);
  assertExists(response.error);

  // Typically -32601 for method not found in JSON-RPC 2.0
  assertEquals(typeof response.error.code, "number");
  assertEquals(typeof response.error.message, "string");
});
