const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../src/models/User");

// Test database connection
const connectTestDatabase = async () => {
  const mongoURI =
    process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/bookstore-test";
  await mongoose.connect(mongoURI);
};

// Clean up database after tests
const cleanupDatabase = async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
};

describe("Authentication API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should fail to register with invalid email", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: "email",
          message: "Please provide a valid email address",
        })
      );
    });

    it("should fail to register with weak password", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "weak",
        confirmPassword: "weak",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: "password",
          message: expect.stringContaining("Password must contain"),
        })
      );
    });

    it("should fail to register with mismatched passwords", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: "confirmPassword",
          message: "Password confirmation does not match password",
        })
      );
    });

    it("should fail to register with duplicate email", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      // Register first user
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Try to register with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...userData, name: "Jane Doe" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User already exists with this email");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      await request(app).post("/api/auth/register").send(userData);
    });

    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "john@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should fail to login with invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should fail to login with invalid password", async () => {
      const loginData = {
        email: "john@example.com",
        password: "WrongPassword123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should fail to login with invalid email format", async () => {
      const loginData = {
        email: "invalid-email",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("GET /api/auth/profile", () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login to get auth token
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(userData);

      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user._id;
    });

    it("should get user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(userId);
      expect(response.body.data.user.email).toBe("john@example.com");
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should fail to get profile without token", async () => {
      const response = await request(app).get("/api/auth/profile").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Access denied. No token provided");
    });

    it("should fail to get profile with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid token");
    });
  });

  describe("PUT /api/auth/profile", () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get auth token
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(userData);

      authToken = registerResponse.body.data.token;
    });

    it("should update profile successfully", async () => {
      const updateData = {
        name: "John Updated",
        phone: "+1234567890",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
      };

      const response = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Profile updated successfully");
      expect(response.body.data.user.name).toBe("John Updated");
      expect(response.body.data.user.phone).toBe("+1234567890");
      expect(response.body.data.user.address.street).toBe("123 Main St");
    });

    it("should fail to update profile with invalid phone", async () => {
      const updateData = {
        phone: "invalid-phone",
      };

      const response = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    let refreshToken;

    beforeEach(async () => {
      // Register to get refresh token
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(userData);

      refreshToken = registerResponse.body.data.refreshToken;
    });

    it("should refresh token successfully", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it("should fail with invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid refresh token");
    });
  });
});
