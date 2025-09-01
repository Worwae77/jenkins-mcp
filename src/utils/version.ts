/**
 * Version utilities for Jenkins MCP Server
 *
 * ✅ CI/CD APPROACH: Version is determined by git tags, not hardcoded values
 * - In development: Shows "0.0.0-dev"
 * - In releases: GitHub Actions injects actual version from git tag
 * - Compiled binaries: Use embedded version from CI/CD build process
 */

// Development fallback version - actual version comes from git tags in CI/CD
export const VERSION = "0.0.0-dev";
export const NAME = "jenkins-mcp-server";
export const DESCRIPTION =
  "Model Context Protocol server for Jenkins automation and management";

interface DenoConfig {
  name?: string;
  version?: string;
  description?: string;
  [key: string]: unknown;
}

let cachedVersion: string | null = null;

/**
 * Get the version from deno.json (fallback to embedded version for compiled binaries)
 */
export async function getVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const denoConfigPath = new URL("../../deno.json", import.meta.url);
    const denoConfigText = await Deno.readTextFile(denoConfigPath);
    const denoConfig: DenoConfig = JSON.parse(denoConfigText);

    cachedVersion = denoConfig.version || VERSION;
    return cachedVersion;
  } catch (_error) {
    // Use embedded version for compiled binaries or when deno.json is not accessible
    cachedVersion = VERSION;
    return cachedVersion;
  }
}

/**
 * Get version info with additional details
 */
export async function getVersionInfo(): Promise<{
  version: string;
  name: string;
  description: string;
}> {
  try {
    const denoConfigPath = new URL("../../deno.json", import.meta.url);
    const denoConfigText = await Deno.readTextFile(denoConfigPath);
    const denoConfig: DenoConfig = JSON.parse(denoConfigText);

    return {
      version: denoConfig.version || VERSION,
      name: denoConfig.name || NAME,
      description: denoConfig.description || DESCRIPTION,
    };
  } catch (_error) {
    // Use embedded values for compiled binaries or when deno.json is not accessible
    return {
      version: VERSION,
      name: NAME,
      description: DESCRIPTION,
    };
  }
}

/**
 * Display version information
 */
export async function displayVersion(): Promise<void> {
  const versionInfo = await getVersionInfo();
  console.log(`${versionInfo.name} v${versionInfo.version}`);
  console.log(versionInfo.description);
}
