# Test Suite Documentation

## Overview

The Jenkins MCP Server now includes a comprehensive test suite to ensure code
quality and reliability.

## Test Structure

```
tests/
├── basic.test.ts       # Basic project structure and environment tests
├── config.test.ts      # Configuration management tests  
└── validation.test.ts  # Input validation schema tests
```

## Test Categories

### 1. **Basic Tests** (`basic.test.ts`)

- **Project Structure**: Verifies essential files exist and are readable
- **Environment Setup**: Tests environment variable access
- **File Permissions**: Ensures all source files are accessible

### 2. **Configuration Tests** (`config.test.ts`)

- **Environment Variables**: Tests config loading and defaults
- **Jenkins Configuration**: Validates Jenkins-specific settings

### 3. **Validation Tests** (`validation.test.ts`)

- **Job Names**: Tests Zod schema validation for Jenkins job names
- **Build Numbers**: Validates build number formats and special values
- **Node Names**: Tests Jenkins node name validation
- **Parameters**: Validates Jenkins parameter schemas

## Running Tests

### Using Makefile (Recommended)

```bash
make test          # Run all tests with test environment
make quality       # Run all quality checks including tests
```

### Using Deno Directly

```bash
# With test environment
export JENKINS_URL="http://localhost:8080"
export JENKINS_USERNAME="test" 
export JENKINS_API_TOKEN="test"
deno test --allow-net --allow-env --allow-read --allow-write tests/

# Individual test files
deno test --allow-net --allow-env --allow-read --allow-write tests/basic.test.ts
```

## Test Environment

The test suite uses a mock Jenkins environment:

- **JENKINS_URL**: `http://localhost:8080`
- **JENKINS_USERNAME**: `test`
- **JENKINS_API_TOKEN**: `test`

This prevents tests from requiring a real Jenkins instance.

## Test Results

Current test coverage:

- ✅ **9 tests passing**
- ✅ **0 tests failing**
- ✅ **Basic functionality verified**
- ✅ **Configuration validation working**
- ✅ **Input validation schemas tested**

## Adding New Tests

### 1. Create Test File

```typescript
// tests/new-feature.test.ts
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("New Feature - Test Name", () => {
  // Test implementation
  assertEquals(actual, expected);
});
```

### 2. Follow Naming Convention

- File: `feature-name.test.ts`
- Tests: `"Feature Name - Specific Test"`

### 3. Use Standard Assertions

```typescript
import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
```

### 4. Handle Environment Variables

```typescript
// For tests that need specific environment
Deno.test("My Test", () => {
  const originalValue = Deno.env.get("MY_VAR");
  Deno.env.set("MY_VAR", "test-value");

  // Test code here

  // Cleanup
  if (originalValue !== undefined) {
    Deno.env.set("MY_VAR", originalValue);
  } else {
    Deno.env.delete("MY_VAR");
  }
});
```

## Best Practices

### ✅ **Do**

- Test both valid and invalid inputs
- Use descriptive test names
- Clean up environment changes
- Test error conditions
- Keep tests focused and fast

### ❌ **Don't**

- Make tests depend on external services
- Hardcode sensitive data
- Create interdependent tests
- Skip cleanup in tests
- Test implementation details

## Integration with CI/CD

The test suite is integrated into:

- **Makefile**: `make quality` runs tests as part of quality checks
- **GitHub Actions**: Tests run on every push and PR
- **Development Workflow**: Pre-commit testing recommended

## Future Enhancements

Planned test improvements:

- [ ] Integration tests with mock Jenkins API
- [ ] Performance benchmarks
- [ ] E2E tests for MCP protocol
- [ ] Test coverage reporting
- [ ] Automated test generation

## Debugging Tests

### Enable Verbose Output

```bash
deno test --allow-all tests/ -- --verbose
```

### Run Specific Tests

```bash
deno test --allow-all tests/validation.test.ts --filter="Job Names"
```

### Debug Mode

```bash
export LOG_LEVEL=debug
make test
```

The test suite ensures the Jenkins MCP Server maintains high quality and
reliability standards! 🧪✅
