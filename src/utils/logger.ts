/**
 * Logging utilities for Jenkins MCP Server
 */

import { config } from "./config.ts";

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: unknown;
}

class Logger {
  private logLevel: LogLevel;
  private auditLogs: LogEntry[] = [];

  constructor() {
    this.logLevel = this.parseLogLevel(config.logLevel);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case "DEBUG":
        return LogLevel.DEBUG;
      case "INFO":
        return LogLevel.INFO;
      case "WARN":
        return LogLevel.WARN;
      case "ERROR":
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    data?: unknown,
  ): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] ${message}`;

    if (data !== undefined) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }

    return baseMessage;
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    data?: unknown,
  ): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(levelName, message, data);

    // Output to console
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // Store audit log if enabled
    if (config.enableAuditLog) {
      this.auditLogs.push({
        timestamp: new Date().toISOString(),
        level: levelName,
        message,
        data,
      });

      // Keep only last 1000 entries to prevent memory leaks
      if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-1000);
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, "DEBUG", message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, "INFO", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, "WARN", message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, "ERROR", message, data);
  }

  /**
   * Log Jenkins-specific operations for audit trail
   */
  audit(action: string, details: Record<string, unknown>): void {
    this.info(`[AUDIT] ${action}`, details);
  }

  /**
   * Get audit logs (for debugging/monitoring)
   */
  getAuditLogs(): LogEntry[] {
    return [...this.auditLogs];
  }

  /**
   * Clear audit logs
   */
  clearAuditLogs(): void {
    this.auditLogs = [];
  }
}

// Export singleton logger instance
export const logger = new Logger();
