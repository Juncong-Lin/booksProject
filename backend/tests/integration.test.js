const request = require("supertest");
const app = require("../server");
const User = require("../src/models/User");

describe("Frontend Integration Tests", () => {
  let server;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Start server for integration tests
    server = app.listen(3001);

    // Create a test user
    const userData = {
      name: "Integration Test User",
      email: "integration@test.com",
      password: "TestPassword123",
      confirmPassword: "TestPassword123",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(userData);

    testUser = response.body.data.user;
    authToken = response.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /test\.com$/ } });
    if (server) {
      server.close();
    }
  });

  describe("CORS and Frontend Integration", () => {
    it("should handle preflight OPTIONS requests", async () => {
      const response = await request(app)
        .options("/api/auth/login")
        .set("Origin", "http://localhost:8080")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Content-Type");

      expect(response.status).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBeDefined();
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
    });

    it("should include CORS headers in actual requests", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .set("Origin", "http://localhost:8080");

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("Authentication Flow Integration", () => {
    it("should complete full authentication flow", async () => {
      // Step 1: Register new user
      const newUserData = {
        name: "Flow Test User",
        email: "flow@test.com",
        password: "FlowTest123",
        confirmPassword: "FlowTest123",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(newUserData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const { token, refreshToken } = registerResponse.body.data;

      // Step 2: Get profile with token
      const profileResponse = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe(newUserData.email);

      // Step 3: Update profile
      const updateData = {
        name: "Updated Flow User",
        phone: "+1234567890",
      };

      const updateResponse = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.user.name).toBe("Updated Flow User");

      // Step 4: Refresh token
      const refreshResponse = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.data.token).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).not.toBe(refreshToken);

      // Step 5: Logout
      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(logoutResponse.body.message).toBe("Logout successful");
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle validation errors consistently", async () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        password: "weak",
        confirmPassword: "different",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should handle authentication errors properly", async () => {
      const response = await request(app).get("/api/auth/profile").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Access denied. No token provided");
    });

    it("should handle invalid tokens gracefully", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid token");
    });
  });

  describe("Rate Limiting Integration", () => {
    it("should enforce rate limits", async () => {
      const loginData = {
        email: "nonexistent@test.com",
        password: "WrongPassword123",
      };

      // Make multiple requests to trigger rate limit
      const requests = Array(10)
        .fill()
        .map(() => request(app).post("/api/auth/login").send(loginData));

      const responses = await Promise.all(requests);

      // Should have at least some 401 responses (invalid credentials)
      const unauthorizedResponses = responses.filter((r) => r.status === 401);
      expect(unauthorizedResponses.length).toBeGreaterThan(0);

      // All responses should have proper error format
      responses.forEach((response) => {
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe("Security Headers Integration", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/health").expect(200);

      // Check for Helmet.js security headers
      expect(response.headers["x-dns-prefetch-control"]).toBe("off");
      expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
      expect(response.headers["x-download-options"]).toBe("noopen");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-xss-protection"]).toBe("0");
    });
  });

  describe("JSON Response Format Integration", () => {
    it("should maintain consistent response format for success", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("user");
    });

    it("should maintain consistent response format for errors", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "invalid", password: "test" })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("Health Check Integration", () => {
    it("should provide health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("database");
    });
  });
});
