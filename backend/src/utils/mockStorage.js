// Mock data storage for development when MongoDB is not available
// This provides basic CRUD operations using in-memory storage
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class MockUser {
  constructor(userData) {
    this._id = userData._id || MockUserStorage.generateId();
    this.name = userData.name;
    this.email = userData.email ? userData.email.toLowerCase() : "";
    this.password = userData.password;
    this.avatar = userData.avatar || "";
    this.role = userData.role || "user";
    this.isEmailVerified = userData.isEmailVerified || false;
    this.lastLogin = userData.lastLogin || new Date();
    this.refreshTokens = userData.refreshTokens || [];
    this.preferences = userData.preferences || {
      notifications: { email: true, orderUpdates: true, newsletters: false },
      language: "en",
      currency: "USD",
    };
    this.address = userData.address || {};
    this.phone = userData.phone || "";
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
  }

  // Mock Mongoose methods
  async save() {
    this.updatedAt = new Date();
    MockUserStorage.instance.users.set(this._id, this);
    return this;
  }

  async remove() {
    MockUserStorage.instance.users.delete(this._id);
    return this;
  }

  toObject() {
    return { ...this };
  }

  toSafeObject() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.refreshTokens;
    delete userObject.emailVerificationToken;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    return userObject;
  }

  // Authentication methods
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  getSignedJwtToken() {
    console.log(`🔧 BULLETPROOF Mock JWT Token Generation Starting...`);
    
    // Bulletproof fallback strategy - always works
    const strategies = [
      () => jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: 900 }),
      () => jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: "15m" }),
      () => jwt.sign({ id: this._id }, process.env.JWT_SECRET),
      () => jwt.sign({ id: this._id }, "fallback-secret", { expiresIn: 900 }),
      () => jwt.sign({ id: this._id }, "fallback-secret")
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const token = strategies[i]();
        console.log(`✅ BULLETPROOF Mock JWT Token generated with strategy ${i + 1}`);
        return token;
      } catch (error) {
        console.warn(`🔄 Mock Strategy ${i + 1} failed: ${error.message}`);
        continue;
      }
    }
    
    // This should never happen, but ultimate fallback
    console.error(`❌ ALL mock strategies failed - using emergency token`);
    return "emergency.mock.token.fallback";
  }

  getSignedRefreshToken() {
    console.log(`🔧 BULLETPROOF Mock Refresh Token Generation Starting...`);
    
    // Bulletproof fallback strategy - always works
    const strategies = [
      () => jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: 604800 }),
      () => jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" }),
      () => jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET),
      () => jwt.sign({ id: this._id }, "fallback-refresh-secret", { expiresIn: 604800 }),
      () => jwt.sign({ id: this._id }, "fallback-refresh-secret")
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const token = strategies[i]();
        console.log(`✅ BULLETPROOF Mock Refresh Token generated with strategy ${i + 1}`);
        return token;
      } catch (error) {
        console.warn(`🔄 Mock Refresh Strategy ${i + 1} failed: ${error.message}`);
        continue;
      }
    }
    
    // This should never happen, but ultimate fallback
    console.error(`❌ ALL mock refresh strategies failed - using emergency token`);
    return "emergency.mock.refresh.token.fallback";
  }

  async addRefreshToken(refreshToken) {
    this.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    await this.save();
  }

  async removeRefreshToken(refreshToken) {
    this.refreshTokens = this.refreshTokens.filter(
      (tokenObj) => tokenObj.token !== refreshToken
    );
    await this.save();
  }

  async removeAllRefreshTokens() {
    this.refreshTokens = [];
    await this.save();
  }

  async updateLastLogin() {
    this.lastLogin = new Date();
    await this.save();
  }
}

class MockUserStorage {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  static generateId() {
    return MockUserStorage.instance.nextId++;
  }

  // Create user (mimics User.create())
  async create(userData) {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error("User already exists with this email");
      error.code = 11000; // MongoDB duplicate key error code
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = new MockUser({
      ...userData,
      password: hashedPassword,
      _id: this.nextId.toString(),
    });

    this.users.set(user._id, user);
    this.nextId++;
    return user;
  }

  // Find user by email (mimics User.findByEmail())
  async findByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  // Find user by email with password included
  async findByEmailWithPassword(email) {
    return this.findByEmail(email);
  }

  // Find user by ID (mimics User.findById())
  async findById(id) {
    const userData = this.users.get(id.toString());
    return userData ? new MockUser(userData) : null;
  }

  // Find user with password included
  async findByIdWithPassword(id) {
    return this.findById(id);
  }

  // Find user by refresh token
  async findByRefreshToken(refreshToken) {
    for (const user of this.users.values()) {
      if (
        user.refreshTokens.some((tokenObj) => tokenObj.token === refreshToken)
      ) {
        return new MockUser(user);
      }
    }
    return null;
  }

  // Update user (mimics User.findByIdAndUpdate())
  async findByIdAndUpdate(id, updateData, options = {}) {
    const user = this.users.get(id.toString());
    if (!user) return null;

    const updatedUser = new MockUser({
      ...user,
      ...updateData,
      updatedAt: new Date(),
    });

    this.users.set(id.toString(), updatedUser);
    return options.new !== false ? updatedUser : user;
  }

  // Delete user (mimics User.findByIdAndDelete())
  async findByIdAndDelete(id) {
    const user = this.users.get(id.toString());
    if (user) {
      this.users.delete(id.toString());
      return new MockUser(user);
    }
    return null;
  }

  // Get all users (mimics User.find())
  async find(query = {}) {
    const users = Array.from(this.users.values()).map(
      (userData) => new MockUser(userData)
    );

    // Simple query filtering
    if (Object.keys(query).length === 0) {
      return users;
    }

    return users.filter((user) => {
      return Object.entries(query).every(([key, value]) => {
        return user[key] === value;
      });
    });
  }

  // Clear all users (for testing)
  clear() {
    this.users.clear();
    this.nextId = 1;
  }

  // Get user count
  async countDocuments() {
    return this.users.size;
  }
}

// Export singleton instance
MockUserStorage.instance = new MockUserStorage();
module.exports = MockUserStorage.instance;
