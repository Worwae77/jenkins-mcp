/**
 * Basic MCP server structure tests
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Basic - Project Structure", () => {
  // Test that main files exist
  const mainServerFile = "./src/simple-server.ts";
  
  // This test just verifies the file can be imported without throwing
  // (we can't easily test the full server without starting it)
  try {
    // Just check that the file exists and is readable
    const stat = Deno.statSync(mainServerFile);
    assertEquals(stat.isFile, true);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Main server file not found: ${errorMessage}`);
  }
});

Deno.test("Basic - Environment Setup", () => {
  // Test basic environment checks
  // Check if we can read environment variables
  const jenkinsUrl = Deno.env.get("JENKINS_URL");
  
  // In test environment, JENKINS_URL might not be set, so we just check
  // that the env access works (returns string or undefined)
  assertEquals(typeof jenkinsUrl === "string" || typeof jenkinsUrl === "undefined", true);
});

Deno.test("Basic - File Permissions", () => {
  // Test that we can read necessary files
  const testFiles = [
    "./src/simple-server.ts",
    "./src/utils/config.ts", 
    "./src/utils/validation.ts",
    "./src/jenkins/client.ts"
  ];
  
  for (const file of testFiles) {
    try {
      const stat = Deno.statSync(file);
      assertEquals(stat.isFile, true, `${file} should be a readable file`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Cannot access ${file}: ${errorMessage}`);
    }
  }
});
