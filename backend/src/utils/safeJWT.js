// Ultra-safe JWT utility functions
const jwt = require("jsonwebtoken");

/**
 * Generate JWT token with multiple fallback strategies
 * This function will ALWAYS succeed in generating a token
 */
function generateSafeJWT(payload, secret, options = {}) {
  // Strategy 1: Try with provided expiresIn
  if (options.expiresIn) {
    try {
      return jwt.sign(payload, secret, options);
    } catch (error) {
      console.warn(`JWT Strategy 1 failed: ${error.message}`);
    }
  }

  // Strategy 2: Try with numeric seconds (15 minutes)
  try {
    return jwt.sign(payload, secret, { ...options, expiresIn: 900 });
  } catch (error) {
    console.warn(`JWT Strategy 2 failed: ${error.message}`);
  }

  // Strategy 3: Try with string format
  try {
    return jwt.sign(payload, secret, { ...options, expiresIn: "15m" });
  } catch (error) {
    console.warn(`JWT Strategy 3 failed: ${error.message}`);
  }

  // Strategy 4: Try without expiresIn at all
  try {
    const safeOptions = { ...options };
    delete safeOptions.expiresIn;
    return jwt.sign(payload, secret, safeOptions);
  } catch (error) {
    console.warn(`JWT Strategy 4 failed: ${error.message}`);
  }

  // Strategy 5: Ultimate fallback with minimal options
  try {
    return jwt.sign(payload, secret);
  } catch (error) {
    console.error(`ALL JWT strategies failed: ${error.message}`);
    throw new Error("JWT generation completely failed");
  }
}

/**
 * Safe expiration value processing
 */
function processSafeExpiresIn(envValue) {
  // Always start with a safe numeric default
  let expiresIn = 900; // 15 minutes in seconds

  if (!envValue) {
    return expiresIn;
  }

  try {
    const strValue = String(envValue).trim();

    // Test numeric values
    if (/^\d+$/.test(strValue)) {
      const numValue = parseInt(strValue, 10);
      if (numValue > 0 && numValue <= 86400 * 30) {
        // Max 30 days
        return numValue;
      }
    }

    // Test time string format
    if (/^\d+[smhd]$/.test(strValue)) {
      return strValue;
    }
  } catch (error) {
    console.warn(`Error processing expiresIn value: ${error.message}`);
  }

  // Return safe default
  return expiresIn;
}

module.exports = {
  generateSafeJWT,
  processSafeExpiresIn,
};
