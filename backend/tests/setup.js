// Setup file for Jest tests
require("dotenv").config({ path: ".env.test" });

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test setup
beforeAll(async () => {
  // Any global setup code
});

afterAll(async () => {
  // Any global cleanup code
});
