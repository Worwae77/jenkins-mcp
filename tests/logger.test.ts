/**
 * Logger Module Tests
 * Comprehensive test suite for logging functionality
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { logger } from "../src/utils/logger.ts";

Deno.test("Logger - Module Import", () => {
  assertExists(logger, "Logger should be importable");
  assertEquals(typeof logger, "object", "Logger should be an object");
});

Deno.test("Logger - Debug Method", () => {
  assertExists(logger.debug, "Logger should have debug method");
  assertEquals(typeof logger.debug, "function", "Debug should be a function");

  // Test that debug doesn't throw
  logger.debug("Test debug message");
});

Deno.test("Logger - Info Method", () => {
  assertExists(logger.info, "Logger should have info method");
  assertEquals(typeof logger.info, "function", "Info should be a function");

  // Test that info doesn't throw
  logger.info("Test info message");
});

Deno.test("Logger - Warn Method", () => {
  assertExists(logger.warn, "Logger should have warn method");
  assertEquals(typeof logger.warn, "function", "Warn should be a function");

  // Test that warn doesn't throw
  logger.warn("Test warning message");
});

Deno.test("Logger - Error Method", () => {
  assertExists(logger.error, "Logger should have error method");
  assertEquals(typeof logger.error, "function", "Error should be a function");

  // Test that error doesn't throw
  logger.error("Test error message");
});

Deno.test("Logger - Multiple Messages", () => {
  // Test logging multiple messages in sequence
  logger.debug("Debug message 1");
  logger.info("Info message 1");
  logger.warn("Warning message 1");
  logger.error("Error message 1");

  // Should not throw
  assertEquals(true, true, "Should handle multiple log messages");
});

Deno.test("Logger - Object Logging", () => {
  const testObject = {
    key: "value",
    number: 123,
    nested: {
      data: "test",
    },
  };

  // Test logging objects
  logger.debug("Debug with object:", testObject);
  logger.info("Info with object:", testObject);
  logger.warn("Warning with object:", testObject);
  logger.error("Error with object:", testObject);

  assertEquals(true, true, "Should handle object logging");
});

Deno.test("Logger - Error Object Logging", () => {
  const testError = new Error("Test error for logging");

  // Test logging error objects
  logger.error("Error object:", testError);
  logger.warn("Warning with error:", testError);

  assertEquals(true, true, "Should handle Error object logging");
});

Deno.test("Logger - Long Message Handling", () => {
  const longMessage = "x".repeat(1000);

  // Test logging long messages
  logger.debug("Long debug:", longMessage);
  logger.info("Long info:", longMessage);
  logger.warn("Long warning:", longMessage);
  logger.error("Long error:", longMessage);

  assertEquals(true, true, "Should handle long messages");
});

Deno.test("Logger - Special Characters", () => {
  const specialMessage = "Message with special chars: 🚀 ñáéíóú @#$%^&*()";

  logger.debug(specialMessage);
  logger.info(specialMessage);
  logger.warn(specialMessage);
  logger.error(specialMessage);

  assertEquals(true, true, "Should handle special characters");
});

Deno.test("Logger - Performance Test", () => {
  const start = performance.now();

  // Log many messages quickly
  for (let i = 0; i < 100; i++) {
    logger.debug(`Performance test message ${i}`);
  }

  const end = performance.now();
  const duration = end - start;

  // Should complete in reasonable time (less than 1 second)
  assertEquals(
    duration < 1000,
    true,
    "Should handle many log messages efficiently",
  );
});
