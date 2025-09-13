const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
} = require("../src/middleware/validation");
const { validationResult } = require("express-validator");

// Mock express request/response objects
const createMockReq = (body = {}) => ({
  body,
  params: {},
  query: {},
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

describe("Validation Middleware", () => {
  describe("Registration Validation", () => {
    it("should pass with valid registration data", async () => {
      const req = createMockReq({
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      // Run validation middleware
      for (const validator of validateRegistration) {
        if (typeof validator === "function" && validator.length === 3) {
          await validator(req, res, next);
        }
      }

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should fail with invalid name", async () => {
      const req = createMockReq({
        name: "A", // Too short
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Run name validation
      const nameValidator = validateRegistration[0];
      await nameValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "name",
          msg: "Name must be between 2 and 50 characters",
        })
      );
    });

    it("should fail with invalid email format", async () => {
      const req = createMockReq({
        name: "John Doe",
        email: "invalid-email",
        password: "Password123",
        confirmPassword: "Password123",
      });

      // Run email validation
      const emailValidator = validateRegistration[1];
      await emailValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "email",
          msg: "Please provide a valid email address",
        })
      );
    });

    it("should fail with weak password", async () => {
      const req = createMockReq({
        name: "John Doe",
        email: "john@example.com",
        password: "weak",
        confirmPassword: "weak",
      });

      // Run password validation
      const passwordValidator = validateRegistration[2];
      await passwordValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "password",
          msg: expect.stringContaining("Password must contain"),
        })
      );
    });

    it("should fail with mismatched passwords", async () => {
      const req = createMockReq({
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      });

      // Run confirm password validation
      const confirmPasswordValidator = validateRegistration[3];
      await confirmPasswordValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "confirmPassword",
          msg: "Password confirmation does not match password",
        })
      );
    });
  });

  describe("Login Validation", () => {
    it("should pass with valid login data", async () => {
      const req = createMockReq({
        email: "john@example.com",
        password: "Password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      // Run validation middleware
      for (const validator of validateLogin) {
        if (typeof validator === "function" && validator.length === 3) {
          await validator(req, res, next);
        }
      }

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should fail with invalid email", async () => {
      const req = createMockReq({
        email: "invalid-email",
        password: "Password123",
      });

      // Run email validation
      const emailValidator = validateLogin[0];
      await emailValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "email",
          msg: "Please provide a valid email address",
        })
      );
    });

    it("should fail with missing password", async () => {
      const req = createMockReq({
        email: "john@example.com",
        password: "",
      });

      // Run password validation
      const passwordValidator = validateLogin[1];
      await passwordValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "password",
          msg: "Password is required",
        })
      );
    });
  });

  describe("Profile Update Validation", () => {
    it("should pass with valid profile data", async () => {
      const req = createMockReq({
        name: "John Updated",
        phone: "+1234567890",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      // Run validation middleware
      for (const validator of validateProfileUpdate) {
        if (typeof validator === "function" && validator.length === 3) {
          await validator(req, res, next);
        }
      }

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should fail with invalid phone number", async () => {
      const req = createMockReq({
        phone: "invalid-phone",
      });

      // Find and run phone validation
      const phoneValidator = validateProfileUpdate.find(
        (v) =>
          v.builder && v.builder.fields && v.builder.fields.includes("phone")
      );

      if (phoneValidator) {
        await phoneValidator(req, {}, () => {});
        const errors = validationResult(req);
        expect(errors.isEmpty()).toBe(false);
      }
    });

    it("should fail with invalid zip code format", async () => {
      const req = createMockReq({
        address: {
          zipCode: "invalid-zip",
        },
      });

      // Find and run zipCode validation
      const zipValidator = validateProfileUpdate.find(
        (v) =>
          v.builder &&
          v.builder.fields &&
          v.builder.fields.includes("address.zipCode")
      );

      if (zipValidator) {
        await zipValidator(req, {}, () => {});
        const errors = validationResult(req);
        expect(errors.isEmpty()).toBe(false);
      }
    });
  });

  describe("Password Change Validation", () => {
    it("should pass with valid password change data", async () => {
      const req = createMockReq({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        confirmNewPassword: "NewPassword123",
      });
      const res = createMockRes();
      const next = createMockNext();

      // Run validation middleware
      for (const validator of validatePasswordChange) {
        if (typeof validator === "function" && validator.length === 3) {
          await validator(req, res, next);
        }
      }

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should fail with missing current password", async () => {
      const req = createMockReq({
        currentPassword: "",
        newPassword: "NewPassword123",
        confirmNewPassword: "NewPassword123",
      });

      // Run current password validation
      const currentPasswordValidator = validatePasswordChange[0];
      await currentPasswordValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "currentPassword",
          msg: "Current password is required",
        })
      );
    });

    it("should fail with weak new password", async () => {
      const req = createMockReq({
        currentPassword: "OldPassword123",
        newPassword: "weak",
        confirmNewPassword: "weak",
      });

      // Run new password validation
      const newPasswordValidator = validatePasswordChange[1];
      await newPasswordValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "newPassword",
          msg: expect.stringContaining("New password must contain"),
        })
      );
    });

    it("should fail with mismatched new passwords", async () => {
      const req = createMockReq({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        confirmNewPassword: "DifferentPassword123",
      });

      // Run confirm new password validation
      const confirmNewPasswordValidator = validatePasswordChange[2];
      await confirmNewPasswordValidator(req, {}, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toContainEqual(
        expect.objectContaining({
          path: "confirmNewPassword",
          msg: "New password confirmation does not match new password",
        })
      );
    });
  });
});
