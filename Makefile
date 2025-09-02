# Jenkins MCP Server Makefile
# Production-ready build system for Jenkins MCP Server

.PHONY: help install clean build build-all build-linux build-macos build-macos-arm build-windows test start dev check fmt lint quality version-info examples info

# Default target
.DEFAULT_GOAL := help

# Variables - Version extracted from git tags
GIT_TAG := $(shell git describe --tags --always 2>/dev/null || echo "v0.0.0-dev")
VERSION := $(patsubst v%,%,$(GIT_TAG))
BINARY_NAME := jenkins-mcp-server
ENV_FILE := .env.local
ENV_EXAMPLE := .env.example

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Jenkins MCP Server Build System$(NC)"
	@echo "================================="
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Environment:$(NC)"
	@echo "  DENO_VERSION: $$(deno --version 2>/dev/null | head -1 || echo 'Not installed')"
	@echo "  PROJECT_VERSION: $(VERSION) (from git tags)"

version-info: ## Show current version information
	@echo "$(BLUE)Version Information$(NC)"
	@echo "==================="
	@echo "Git Tag: $(GIT_TAG)"
	@echo "Version: $(VERSION)"

## Installation & Setup
install: ## Install dependencies and setup environment
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@if ! command -v deno >/dev/null 2>&1; then \
		echo "$(RED)Error: Deno is not installed$(NC)"; \
		echo "$(BLUE)Install from: https://deno.land/$(NC)"; \
		exit 1; \
	fi
	@deno cache src/simple-server.ts
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(YELLOW)Creating $(ENV_FILE) from $(ENV_EXAMPLE)...$(NC)"; \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
		echo "$(YELLOW)Please edit $(ENV_FILE) with your Jenkins configuration$(NC)"; \
	fi
	@echo "$(GREEN)Installation complete!$(NC)"

## Development
dev: check-env ## Start development server
	@echo "$(GREEN)Starting development server...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs) && \
	deno run --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors src/simple-server.ts

start: check-env ## Start the MCP server
	@echo "$(GREEN)Starting Jenkins MCP Server...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs) && \
	if [ -f "./$(BINARY_NAME)" ]; then \
		exec ./$(BINARY_NAME); \
	else \
		echo "$(YELLOW)Binary not found, running from source...$(NC)"; \
		deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts; \
	fi

## Testing & Quality
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	@deno task test

check: ## Check TypeScript compilation
	@echo "$(GREEN)Checking TypeScript compilation...$(NC)"
	@deno task check

fmt: ## Format code
	@echo "$(GREEN)Formatting code...$(NC)"
	@deno task fmt

lint: ## Lint code
	@echo "$(GREEN)Linting code...$(NC)"
	@deno task lint

quality: fmt lint check test ## Run all quality checks

## Build
clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	@rm -f $(BINARY_NAME)
	@rm -f $(BINARY_NAME)-*
	@rm -rf artifacts/

build: clean ## Build standalone executable
	@echo "$(GREEN)Building standalone executable...$(NC)"
	@deno task build
	@echo "$(GREEN)Build complete: $(BINARY_NAME)$(NC)"

build-ci: clean ## Build for CI environments (without SSL certificate flags)
	@echo "$(GREEN)Building for CI environment...$(NC)"
	@deno task build:ci
	@echo "$(GREEN)CI Build complete: $(BINARY_NAME)$(NC)"

build-all: clean ## Build for all platforms
	@echo "$(GREEN)Building for all platforms...$(NC)"
	@deno task build:all
	@echo "$(GREEN)Multi-platform build complete!$(NC)"

build-linux: clean ## Build for Linux x64
	@echo "$(GREEN)Building for Linux x64...$(NC)"
	@deno task build:linux
	@echo "$(GREEN)Linux build complete: jenkins-mcp-server-linux-x64$(NC)"

build-macos: clean ## Build for macOS x64
	@echo "$(GREEN)Building for macOS x64...$(NC)"
	@deno task build:macos
	@echo "$(GREEN)macOS x64 build complete: jenkins-mcp-server-macos-x64$(NC)"

build-macos-arm: clean ## Build for macOS ARM64
	@echo "$(GREEN)Building for macOS ARM64...$(NC)"
	@deno task build:macos-arm
	@echo "$(GREEN)macOS ARM64 build complete: jenkins-mcp-server-macos-arm64$(NC)"

build-windows: clean ## Build for Windows x64
	@echo "$(GREEN)Building for Windows x64...$(NC)"
	@deno task build:windows
	@echo "$(GREEN)Windows build complete: jenkins-mcp-server-windows-x64.exe$(NC)"

## Utilities
check-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(RED)Error: $(ENV_FILE) not found$(NC)"; \
		echo "$(BLUE)Run 'make install' to create from template$(NC)"; \
		exit 1; \
	fi

## Usage Examples
examples: ## Show usage examples
	@echo "$(BLUE)Jenkins MCP Server - Usage Examples$(NC)"
	@echo "===================================="
	@echo ""
	@echo "$(GREEN)1. Initial Setup:$(NC)"
	@echo "   make install"
	@echo "   # Edit .env.local with your Jenkins details"
	@echo ""
	@echo "$(GREEN)2. Development:$(NC)"
	@echo "   make dev                    # Start with environment"
	@echo "   deno task check            # Quick type check"
	@echo "   deno task fmt              # Format code"
	@echo ""
	@echo "$(GREEN)3. Quality Assurance:$(NC)"
	@echo "   make quality               # Run all checks"
	@echo "   deno task test             # Run tests only"
	@echo ""
	@echo "$(GREEN)4. Production Build:$(NC)"
	@echo "   make build                 # Single platform"
	@echo "   make build-all             # All platforms"
	@echo "   ./$(BINARY_NAME)"
	@echo ""
	@echo "$(GREEN)5. Using deno tasks directly:$(NC)"
	@echo "   deno task --help           # See all available tasks"

info: ## Show project information
	@echo "$(BLUE)Project Information$(NC)"
	@echo "==================="
	@echo "Name: jenkins-mcp-server"
	@echo "Version: $(VERSION)"
	@echo "Environment file: $(ENV_FILE)"
	@echo ""
	@echo "$(GREEN)Available deno tasks:$(NC)"
	@deno task --help 2>/dev/null | grep -E "^  [a-z]" || echo "  Run 'deno task' to see available tasks"
