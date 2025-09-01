#!/usr/bin/env -S deno run --allow-env --allow-run
/**
 * Simple test runner that sets up the proper environment for Jenkins MCP tests
 */

const testEnv = {
  JENKINS_URL: "http://localhost:8080",
  JENKINS_USERNAME: "test",
  JENKINS_API_TOKEN: "test",
  MCP_SERVER_NAME: "jenkins-mcp-test",
  JENKINS_SSL_VERIFY: "true",
};

// Set environment variables
for (const [key, value] of Object.entries(testEnv)) {
  Deno.env.set(key, value);
}

console.log("🧪 Running Jenkins MCP Server tests with test environment...");
console.log("📝 Environment variables set:");
for (const [key, value] of Object.entries(testEnv)) {
  console.log(`   ${key}=${value}`);
}
console.log("");

// Run the tests
const cmd = new Deno.Command("deno", {
  args: [
    "test",
    "--allow-net",
    "--allow-env",
    "--allow-read",
    "--allow-write",
    "tests/",
  ],
});

const { code } = await cmd.output();

if (code === 0) {
  console.log("✅ All tests passed!");
} else {
  console.log("❌ Some tests failed.");
  Deno.exit(code);
}
