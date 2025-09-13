// Authentication utility functions and API calls

class AuthService {
  constructor() {
    this.baseURL = "http://localhost:5000/api/v1";
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Check if user is already authenticated
    await this.checkAuthStatus();
    this.updateUI();
  }

  // API call helper
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  }

  // Sign up user
  async signup(userData) {
    try {
      const response = await this.apiCall("/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (response.success) {
        this.currentUser = response.data.user;
        this.updateUI();
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  // Sign in user
  async signin(credentials) {
    try {
      const response = await this.apiCall("/auth/signin", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      if (response.success) {
        this.currentUser = response.data.user;
        this.updateUI();
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  // Sign out user
  async signout() {
    try {
      await this.apiCall("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user data regardless of API response
      this.currentUser = null;
      this.updateUI();
    }
  }

  // Check authentication status
  async checkAuthStatus() {
    try {
      const response = await this.apiCall("/auth/me");
      if (response.success) {
        this.currentUser = response.data.user;
        return true;
      }
    } catch (error) {
      console.log("Not authenticated:", error.message);
      this.currentUser = null;
      return false;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await this.apiCall("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      if (response.success) {
        this.currentUser = response.data.user;
        this.updateUI();
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await this.apiCall("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify(passwordData),
      });

      if (response.success) {
        // Password change requires re-authentication
        this.currentUser = null;
        this.updateUI();
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  // Update UI based on authentication status
  updateUI() {
    const headerPlaceholder = document.getElementById(
      "shared-header-placeholder"
    );

    if (headerPlaceholder) {
      // Update header with authentication state
      this.updateHeader();
    }

    // Update page-specific elements
    this.updatePageElements();
  }

  // Update header authentication state
  updateHeader() {
    const authContainer = document.querySelector(".qili-header-right-section");

    if (!authContainer) return;

    if (this.isAuthenticated()) {
      // Show user menu
      authContainer.innerHTML = `
        <div class="user-menu">
          <div class="user-avatar" id="user-avatar">
            ${this.getUserInitials()}
          </div>
          <div class="user-dropdown" id="user-dropdown">
            <div class="dropdown-header">
              <div class="dropdown-name">${this.currentUser.name}</div>
              <div class="dropdown-email">${this.currentUser.email}</div>
            </div>
            <ul class="dropdown-menu">
              <li class="dropdown-item">
                <a href="profile.html" class="dropdown-link">
                  <i data-feather="user"></i>
                  Profile
                </a>
              </li>
              <li class="dropdown-item">
                <a href="orders.html" class="dropdown-link">
                  <i data-feather="package"></i>
                  My Orders
                </a>
              </li>
              <li class="dropdown-item">
                <a href="dashboard.html" class="dropdown-link">
                  <i data-feather="bar-chart-2"></i>
                  Dashboard
                </a>
              </li>
              <div class="dropdown-divider"></div>
              <li class="dropdown-item">
                <a href="#" class="dropdown-link" id="signout-btn">
                  <i data-feather="log-out"></i>
                  Sign Out
                </a>
              </li>
            </ul>
          </div>
        </div>
      `;

      // Add event listeners
      this.setupUserMenu();
    } else {
      // Show auth buttons
      authContainer.innerHTML = `
        <div class="auth-buttons">
          <a href="signin.html" class="header-auth-btn signin">
            <i data-feather="log-in"></i>
            Sign In
          </a>
          <a href="signup.html" class="header-auth-btn signup">
            <i data-feather="user-plus"></i>
            Sign Up
          </a>
        </div>
      `;
    }

    // Reinitialize feather icons
    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  // Get user initials for avatar
  getUserInitials() {
    if (!this.currentUser || !this.currentUser.name) return "U";

    const names = this.currentUser.name.split(" ");
    const initials = names.map((name) => name.charAt(0).toUpperCase()).join("");
    return initials.substring(0, 2);
  }

  // Setup user menu functionality
  setupUserMenu() {
    const userAvatar = document.getElementById("user-avatar");
    const userDropdown = document.getElementById("user-dropdown");
    const signoutBtn = document.getElementById("signout-btn");

    if (userAvatar && userDropdown) {
      // Toggle dropdown
      userAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("show");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", () => {
        userDropdown.classList.remove("show");
      });

      // Prevent dropdown from closing when clicking inside
      userDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    if (signoutBtn) {
      signoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.signout();
        window.location.href = "index.html";
      });
    }
  }

  // Update page-specific elements based on auth status
  updatePageElements() {
    // This can be extended for page-specific authentication updates
    const protectedElements = document.querySelectorAll("[data-auth-required]");
    const guestElements = document.querySelectorAll("[data-guest-only]");

    protectedElements.forEach((element) => {
      element.style.display = this.isAuthenticated() ? "" : "none";
    });

    guestElements.forEach((element) => {
      element.style.display = this.isAuthenticated() ? "none" : "";
    });
  }

  // Redirect to login if not authenticated
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "signin.html";
      return false;
    }
    return true;
  }

  // Redirect to home if already authenticated
  requireGuest() {
    if (this.isAuthenticated()) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }
}

// Utility functions for form validation
const ValidationUtils = {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password) {
    const minLength = password.length >= 6;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
      minLength,
      hasLowerCase,
      hasUpperCase,
      hasNumbers,
      isValid: minLength && hasLowerCase && hasUpperCase && hasNumbers,
    };
  },

  getPasswordStrength(password) {
    const validation = this.validatePassword(password);
    const criteria = [
      validation.minLength,
      validation.hasLowerCase,
      validation.hasUpperCase,
      validation.hasNumbers,
    ];

    const score = criteria.filter(Boolean).length;

    if (score <= 1) return { strength: "weak", score };
    if (score === 2) return { strength: "fair", score };
    if (score === 3) return { strength: "good", score };
    return { strength: "strong", score };
  },

  validateName(name) {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
  },
};

// UI Helper functions
const UIHelpers = {
  showMessage(messageId, text, type = "info") {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `auth-message ${type}`;
      messageElement.style.display = "block";

      // Auto-hide success messages
      if (type === "success") {
        setTimeout(() => {
          messageElement.style.display = "none";
        }, 5000);
      }
    }
  },

  clearMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      messageElement.style.display = "none";
    }
  },

  showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const fieldElement = document.getElementById(fieldId);

    if (errorElement) {
      errorElement.textContent = message;
    }

    if (fieldElement) {
      fieldElement.style.borderColor = "#e53e3e";
    }
  },

  clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const fieldElement = document.getElementById(fieldId);

    if (errorElement) {
      errorElement.textContent = "";
    }

    if (fieldElement) {
      fieldElement.style.borderColor = "#e2e8f0";
    }
  },

  clearAllErrors(form) {
    const errorElements = form.querySelectorAll(".error-message");
    const inputElements = form.querySelectorAll("input");

    errorElements.forEach((element) => {
      element.textContent = "";
    });

    inputElements.forEach((element) => {
      element.style.borderColor = "#e2e8f0";
    });
  },

  setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
      const btnText = button.querySelector(".btn-text");
      const btnLoading = button.querySelector(".btn-loading");

      if (isLoading) {
        btnText.style.display = "none";
        btnLoading.style.display = "flex";
        button.disabled = true;
      } else {
        btnText.style.display = "block";
        btnLoading.style.display = "none";
        button.disabled = false;
      }
    }
  },
};

// Initialize auth service when script loads
const authService = new AuthService();

// Make it available globally
window.authService = authService;
window.ValidationUtils = ValidationUtils;
window.UIHelpers = UIHelpers;
