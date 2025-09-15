// User model adapter - works with both MongoDB and mock storage
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isConnected } = require("../config/database");
const mockStorage = require("../utils/mockStorage");

// MongoDB User Schema (only used when MongoDB is connected)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800, // 7 days
        },
      },
    ],
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        orderUpdates: {
          type: Boolean,
          default: true,
        },
        newsletters: {
          type: Boolean,
          default: false,
        },
      },
      language: {
        type: String,
        default: "en",
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    phone: {
      type: String,
      match: [/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to get signed JWT token
userSchema.methods.getSignedJwtToken = function () {
  // Always use a safe numeric fallback to avoid any JWT library issues
  let expiresIn = 900; // 15 minutes in seconds (safe fallback)
  const jwtExpire = process.env.JWT_EXPIRE;

  console.log(
    `🔧 JWT Token Generation - Raw JWT_EXPIRE: "${jwtExpire}" (type: ${typeof jwtExpire})`
  );

  // Only use environment value if it's definitely valid
  if (jwtExpire) {
    const strValue = String(jwtExpire).trim();
    
    // Check for pure numeric values (seconds)
    if (/^\d+$/.test(strValue)) {
      const numValue = parseInt(strValue, 10);
      if (numValue > 0 && numValue < 31536000) { // Between 1 second and 1 year
        expiresIn = numValue;
      }
    }
    // Check for time string format (like "15m", "1h", "7d")
    else if (/^\d+[smhd]$/.test(strValue)) {
      expiresIn = strValue;
    }
    // Invalid format - keep safe numeric default
  }

  console.log(
    `🔧 JWT Token Generation - Using expiresIn: "${expiresIn}" (type: ${typeof expiresIn})`
  );

  try {
    const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: expiresIn,
    });
    console.log(`✅ JWT Token generated successfully`);
    return token;
  } catch (error) {
    console.error(`❌ JWT Token generation error:`, error.message);
    // Always use numeric seconds as ultimate fallback
    console.log(`🔄 Using ultimate fallback: 900 seconds (15 minutes)`);
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: 900,
    });
  }
};

// Instance method to get signed refresh token
userSchema.methods.getSignedRefreshToken = function () {
  // Always use a safe numeric fallback to avoid any JWT library issues
  let expiresIn = 604800; // 7 days in seconds (safe fallback)
  const jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE;

  console.log(
    `🔧 Refresh Token Generation - Raw JWT_REFRESH_EXPIRE: "${jwtRefreshExpire}" (type: ${typeof jwtRefreshExpire})`
  );

  // Only use environment value if it's definitely valid
  if (jwtRefreshExpire) {
    const strValue = String(jwtRefreshExpire).trim();
    
    // Check for pure numeric values (seconds)
    if (/^\d+$/.test(strValue)) {
      const numValue = parseInt(strValue, 10);
      if (numValue > 0 && numValue < 31536000) { // Between 1 second and 1 year
        expiresIn = numValue;
      }
    }
    // Check for time string format (like "15m", "1h", "7d")
    else if (/^\d+[smhd]$/.test(strValue)) {
      expiresIn = strValue;
    }
    // Invalid format - keep safe numeric default
  }

  console.log(
    `🔧 Refresh Token Generation - Using expiresIn: "${expiresIn}" (type: ${typeof expiresIn})`
  );

  try {
    const token = jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: expiresIn,
    });
    console.log(`✅ Refresh Token generated successfully`);
    return token;
  } catch (error) {
    console.error(`❌ Refresh Token generation error:`, error.message);
    // Always use numeric seconds as ultimate fallback
    console.log(`🔄 Using ultimate fallback: 604800 seconds (7 days)`);
    return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: 604800,
    });
  }
};

// Instance method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = async function (refreshToken) {
  this.refreshTokens.push({ token: refreshToken });
  await this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = async function (refreshToken) {
  this.refreshTokens = this.refreshTokens.filter(
    (tokenObj) => tokenObj.token !== refreshToken
  );
  await this.save();
};

// Instance method to remove all refresh tokens
userSchema.methods.removeAllRefreshTokens = async function () {
  this.refreshTokens = [];
  await this.save();
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

// Instance method to get safe user object
userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select("+password");
};

// Static method to find user by refresh token
userSchema.statics.findByRefreshToken = function (refreshToken) {
  return this.findOne({ "refreshTokens.token": refreshToken });
};

// Create the MongoDB model
const MongoUser = mongoose.model("User", userSchema);

// User Model Adapter - automatically chooses between MongoDB and Mock Storage
class UserModel {
  static async create(userData) {
    if (isConnected()) {
      return await MongoUser.create(userData);
    }
    return await mockStorage.create(userData);
  }

  static async findByEmail(email) {
    if (isConnected()) {
      return await MongoUser.findByEmail(email);
    }
    return await mockStorage.findByEmail(email);
  }

  static async findByEmailWithPassword(email) {
    if (isConnected()) {
      return await MongoUser.findByEmailWithPassword(email);
    }
    return await mockStorage.findByEmailWithPassword(email);
  }

  static async findById(id) {
    if (isConnected()) {
      return await MongoUser.findById(id);
    }
    return await mockStorage.findById(id);
  }

  static async findByIdWithPassword(id) {
    if (isConnected()) {
      return await MongoUser.findById(id).select("+password");
    }
    return await mockStorage.findByIdWithPassword(id);
  }

  static async findByRefreshToken(refreshToken) {
    if (isConnected()) {
      return await MongoUser.findByRefreshToken(refreshToken);
    }
    return await mockStorage.findByRefreshToken(refreshToken);
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    if (isConnected()) {
      return await MongoUser.findByIdAndUpdate(id, updateData, {
        new: true,
        ...options,
      });
    }
    return await mockStorage.findByIdAndUpdate(id, updateData, options);
  }

  static async findByIdAndDelete(id) {
    if (isConnected()) {
      return await MongoUser.findByIdAndDelete(id);
    }
    return await mockStorage.findByIdAndDelete(id);
  }

  static async find(query = {}) {
    if (isConnected()) {
      return await MongoUser.find(query);
    }
    return await mockStorage.find(query);
  }

  static async countDocuments() {
    if (isConnected()) {
      return await MongoUser.countDocuments();
    }
    return await mockStorage.countDocuments();
  }
}

module.exports = UserModel;
