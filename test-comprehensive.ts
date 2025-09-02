#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors
/**
 * Comprehensive Test Suite for Jenkins MCP Server
 * Tests authentication, job access, and error handling with real Jenkins instance
 */

const JENKINS_URL = Deno.env.get("JENKINS_URL") || "";
const JENKINS_USERNAME = Deno.env.get("JENKINS_USERNAME") || "";
const JENKINS_API_TOKEN = Deno.env.get("JENKINS_API_TOKEN") || "";

console.log("🧪 Jenkins MCP Server Comprehensive Test Suite");
console.log("===============================================");
console.log(`📍 Testing against: ${JENKINS_URL}`);
console.log(`👤 User: ${JENKINS_USERNAME}`);
console.log(`🔑 Token: ${JENKINS_API_TOKEN.substring(0, 10)}...`);
console.log("");

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<void>,
): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, message: "✅ PASSED", duration });
    console.log(`✅ ${name} - PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      passed: false,
      message: `❌ FAILED: ${message}`,
      duration,
    });
    console.log(`❌ ${name} - FAILED: ${message} (${duration}ms)`);
  }
}

interface MCPResult {
  content?: Array<{ text: string }>;
  messages?: Array<{ role: string; content: { type: string; text: string } }>;
  description?: string;
}

interface PromptMCPResult {
  error?: string;
  result?: {
    messages: Array<{ role: string; content: { type: string; text: string } }>;
    description?: string;
  };
}

interface JenkinsJob {
  name: string;
  _class: string;
  url: string;
  color?: string;
}

async function callMCPTool(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<MCPResult> {
  const request = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1000),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  };

  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--allow-write",
      "--unsafely-ignore-certificate-errors",
      "src/simple-server.ts",
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = proc.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(JSON.stringify(request)));
  await writer.close();

  const { stdout, stderr } = await child.output();
  const output = new TextDecoder().decode(stdout);
  const errors = new TextDecoder().decode(stderr);

  if (
    errors && !errors.includes("[SSL WARN]") && !errors.includes("DANGER: TLS")
  ) {
    throw new Error(`MCP Server Error: ${errors}`);
  }

  // Extract JSON response from output
  const lines = output.split("\n");
  const jsonLine = lines.find((line) => line.startsWith('{"jsonrpc":'));

  if (!jsonLine) {
    throw new Error(`No JSON response found in output: ${output}`);
  }

  const response = JSON.parse(jsonLine);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.result;
}

async function callMCPPrompt(
  promptName: string,
  args: Record<string, unknown> = {},
): Promise<PromptMCPResult> {
  const request = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1000),
    method: "prompts/get",
    params: {
      name: promptName,
      arguments: args,
    },
  };

  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--allow-write",
      "--unsafely-ignore-certificate-errors",
      "src/simple-server.ts",
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = proc.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(JSON.stringify(request)));
  await writer.close();

  const { stdout, stderr } = await child.output();
  const output = new TextDecoder().decode(stdout);
  const errors = new TextDecoder().decode(stderr);

  if (
    errors && !errors.includes("[SSL WARN]") && !errors.includes("DANGER: TLS")
  ) {
    return { error: `MCP Server Error: ${errors}` };
  }

  // Extract JSON response from output
  const lines = output.split("\n");
  const jsonLine = lines.find((line) => line.startsWith('{"jsonrpc":'));

  if (!jsonLine) {
    return { error: `No JSON response found in output: ${output}` };
  }

  try {
    const response = JSON.parse(jsonLine);

    if (response.error) {
      return { error: response.error.message };
    }

    return { result: response.result };
  } catch (e) {
    return { error: `JSON parse error: ${(e as Error).message}` };
  }
}

// Test 1: Basic MCP Server Connection
await runTest("MCP Server Startup", async () => {
  const result = await callMCPTool("jenkins_get_version");
  if (!result.content?.[0]?.text.includes("Jenkins Server Information")) {
    throw new Error("Invalid version response");
  }
});

// Test 2: Authentication Validation
await runTest("Jenkins Authentication", async () => {
  const result = await callMCPTool("jenkins_get_version");
  const content = result.content?.[0]?.text;
  if (!content || !content.includes('"authMethod": "API Token"')) {
    throw new Error("API Token authentication not working");
  }
});

// Test 3: Job Listing
await runTest("Job Listing", async () => {
  const result = await callMCPTool("jenkins_list_jobs");
  const jobsText = result.content?.[0]?.text;
  if (!jobsText) {
    throw new Error("No job data received");
  }
  const jobs = JSON.parse(jobsText);

  if (!Array.isArray(jobs) || jobs.length === 0) {
    throw new Error("No jobs found");
  }

  const devOpsFolder = jobs.find((job: JenkinsJob) =>
    job.name === "698.01_DevOps"
  );
  if (!devOpsFolder) {
    throw new Error("698.01_DevOps folder not found");
  }
});

// Test 4: Folder Access
await runTest("698.01_DevOps Folder Access", async () => {
  const result = await callMCPTool("jenkins_get_job", {
    jobName: "698.01_DevOps",
  });
  const content = JSON.parse(result.content?.[0]?.text || "{}");

  if (content._class !== "com.cloudbees.hudson.plugins.folder.Folder") {
    throw new Error("Not a folder");
  }

  if (!content.jobs || content.jobs.length === 0) {
    throw new Error("No jobs in 698.01_DevOps folder");
  }

  const personalFolder = content.jobs.find((job: JenkinsJob) =>
    job.name === "worawut.ju"
  );
  if (!personalFolder) {
    throw new Error("Personal folder worawut.ju not found");
  }
});

// Test 5: Personal Folder Access
await runTest("Personal Folder (worawut.ju) Access", async () => {
  const result = await callMCPTool("jenkins_get_job", {
    jobName: "698.01_DevOps/worawut.ju",
  });
  const content = JSON.parse(result.content?.[0]?.text || "{}");

  if (!content.jobs || content.jobs.length === 0) {
    throw new Error("No subfolders in personal folder");
  }

  const testFolder = content.jobs.find((job: JenkinsJob) =>
    job.name === "TEST"
  );
  if (!testFolder) {
    throw new Error("TEST subfolder not found");
  }
});

// Test 6: SSH Agents Folder Access
await runTest("SSH Agents Folder Access", async () => {
  const result = await callMCPTool("jenkins_get_job", {
    jobName: "698.01_DevOps/0_cicddev_ssh_agents",
  });
  const content = JSON.parse(result.content?.[0]?.text || "{}");

  if (!content.jobs || content.jobs.length === 0) {
    throw new Error("No jobs in SSH agents folder");
  }

  const tasksFolder = content.jobs.find((job: JenkinsJob) =>
    job.name === "tasks"
  );
  if (!tasksFolder) {
    throw new Error("tasks folder not found in SSH agents");
  }
});

// Test 7: Error Handling - Non-existent Job
await runTest("Error Handling - Non-existent Job", async () => {
  try {
    await callMCPTool("jenkins_get_job", { jobName: "nonexistent-job-12345" });
    throw new Error("Should have failed for non-existent job");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (!errorMsg.includes("404") && !errorMsg.includes("Not Found")) {
      throw new Error(`Unexpected error type: ${errorMsg}`);
    }
    // Error handling working correctly
  }
});

// Test 8: Prompts List
await runTest("Prompts List", async () => {
  const request = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1000),
    method: "prompts/list",
    params: {},
  };

  const proc = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--allow-write",
      "--unsafely-ignore-certificate-errors",
      "src/simple-server.ts",
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = proc.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(JSON.stringify(request)));
  await writer.close();

  const { stdout } = await child.output();
  const output = new TextDecoder().decode(stdout);
  const lines = output.split("\n");
  const jsonLine = lines.find((line) => line.startsWith('{"jsonrpc":'));

  if (!jsonLine) {
    throw new Error(`No JSON response found in output: ${output}`);
  }

  const response = JSON.parse(jsonLine);

  if (response.error) {
    throw new Error(response.error.message);
  }

  const prompts = response.result.prompts;
  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error("No prompts found");
  }

  const troubleshootPrompt = prompts.find((p: { name: string }) =>
    p.name === "jenkins_troubleshoot_build_failure"
  );
  if (!troubleshootPrompt) {
    throw new Error("jenkins_troubleshoot_build_failure prompt not found");
  }
});

// Test 11: Prompts Error Handling
console.log("🔧 Testing prompts error handling...");
const promptErrorResult = await callMCPPrompt(
  "jenkins_troubleshoot_build_failure",
  {
    jobName: "nonexistent-job",
    buildNumber: 999,
  },
);

console.log(
  "Prompt error response:",
  JSON.stringify(promptErrorResult, null, 2),
);

results.push({
  name: "Prompts Error Handling",
  passed: Boolean(
    !promptErrorResult.error &&
      promptErrorResult.result &&
      promptErrorResult.result.messages &&
      promptErrorResult.result.messages.length > 0 &&
      promptErrorResult.result.messages[0].content &&
      promptErrorResult.result.messages[0].content.text &&
      promptErrorResult.result.messages[0].content.text.includes(
        "Job or Build Not Found",
      ),
  ),
  message: !promptErrorResult.error &&
      promptErrorResult.result &&
      promptErrorResult.result.messages &&
      promptErrorResult.result.messages.length > 0 &&
      promptErrorResult.result.messages[0].content
    ? `Prompts error handling working: ${
      promptErrorResult.result.messages[0].content.text.substring(0, 100)
    }...`
    : `Failed: ${promptErrorResult.error || "Invalid response structure"}`,
  duration: 0,
});

// Test 10: SSL Configuration
await runTest("SSL Configuration", async () => {
  // This test passes if we can connect at all with HTTPS
  if (!JENKINS_URL.startsWith("https://")) {
    throw new Error("Expected HTTPS URL for SSL test");
  }

  const result = await callMCPTool("jenkins_get_version");
  if (
    !result.content?.[0]?.text.includes("https://jenkins-ops.kasikornbank.com")
  ) {
    throw new Error("SSL connection not working with corporate certificate");
  }
});

// Test 10: Performance Test
await runTest("Performance Test - Multiple Requests", async () => {
  const start = Date.now();

  // Make 3 concurrent requests
  const promises = [
    callMCPTool("jenkins_get_version"),
    callMCPTool("jenkins_list_jobs"),
    callMCPTool("jenkins_get_job", { jobName: "698.01_DevOps" }),
  ];

  await Promise.all(promises);
  const duration = Date.now() - start;

  if (duration > 10000) { // 10 seconds
    throw new Error(`Too slow: ${duration}ms`);
  }
});

console.log("\n" + "=".repeat(50));
console.log("📊 TEST RESULTS SUMMARY");
console.log("=".repeat(50));

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏱️  Total Duration: ${totalDuration}ms`);
console.log(
  `📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`,
);

if (failed > 0) {
  console.log("\n❌ FAILED TESTS:");
  results.filter((r) => !r.passed).forEach((r) => {
    console.log(`   • ${r.name}: ${r.message}`);
  });
}

console.log(
  "\n🎯 JENKINS MCP SERVER STATUS:",
  failed === 0 ? "✅ FULLY OPERATIONAL" : "❌ ISSUES DETECTED",
);

// Exit with appropriate code
Deno.exit(failed === 0 ? 0 : 1);
