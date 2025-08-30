/**
 * Input validation utilities for Jenkins MCP Server
 */

import { z } from "zod";

/**
 * Validation schemas for Jenkins operations
 */

// Job name validation - Jenkins has specific naming rules
export const jobNameSchema = z.string()
  .min(1, "Job name cannot be empty")
  .max(255, "Job name too long")
  .regex(
    /^[a-zA-Z0-9_.\/-]+$/,
    "Job name can contain letters, numbers, underscores, hyphens, dots, and forward slashes for folder paths",
  );

// Build number validation
export const buildNumberSchema = z.union([
  z.number().int().positive("Build number must be positive"),
  z.string().regex(/^\d+$/, "Build number must be a positive integer")
    .transform(Number),
  z.literal("lastBuild"),
  z.literal("lastSuccessfulBuild"),
  z.literal("lastFailedBuild"),
]);

// Jenkins parameter validation
export const jenkinsParameterSchema = z.record(
  z.string().min(1, "Parameter name cannot be empty"),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
  ]),
);

// Pipeline name validation
export const pipelineNameSchema = z.string()
  .min(1, "Pipeline name cannot be empty")
  .max(255, "Pipeline name too long")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Invalid pipeline name format");

// Node name validation
export const nodeNameSchema = z.string()
  .min(1, "Node name cannot be empty")
  .max(255, "Node name too long");

// Git branch validation
export const gitBranchSchema = z.string()
  .min(1, "Branch name cannot be empty")
  .max(255, "Branch name too long")
  .regex(/^[a-zA-Z0-9_./\-]+$/, "Invalid branch name format");

/**
 * Validation helper functions
 */

export function validateJobName(name: string): string {
  return jobNameSchema.parse(name);
}

export function validateBuildNumber(
  buildNumber: string | number,
): number | string {
  return buildNumberSchema.parse(buildNumber);
}

export function validateJobParameters(
  params: unknown,
): Record<string, string | number | boolean> {
  return jenkinsParameterSchema.parse(params);
}

export function validatePipelineName(name: string): string {
  return pipelineNameSchema.parse(name);
}

export function validateNodeName(name: string): string {
  return nodeNameSchema.parse(name);
}

export function validateGitBranch(branch: string): string {
  return gitBranchSchema.parse(branch);
}

/**
 * Sanitize and validate user input
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>\"'&]/g, "") // Remove HTML/XML characters
    .replace(/[\r\n]/g, " ") // Replace newlines with spaces
    .trim();
}

/**
 * Validate URL format
 */
export const urlSchema = z.string().url("Invalid URL format");

export function validateUrl(url: string): string {
  return urlSchema.parse(url);
}

/**
 * Validate file path (for artifacts, configs, etc.)
 */
export const filePathSchema = z.string()
  .min(1, "File path cannot be empty")
  .max(1000, "File path too long")
  .regex(/^[a-zA-Z0-9_./\-\s]+$/, "Invalid file path format");

export function validateFilePath(path: string): string {
  return filePathSchema.parse(path);
}

/**
 * Validate time duration (for timeouts, etc.)
 */
export const durationSchema = z.union([
  z.number().int().positive("Duration must be positive"),
  z.string().regex(
    /^\d+[smhd]?$/,
    "Invalid duration format (e.g., '30s', '5m', '1h')",
  ),
]);

export function validateDuration(duration: string | number): string | number {
  return durationSchema.parse(duration);
}
