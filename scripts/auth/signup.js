// Sign up page functionality

document.addEventListener("DOMContentLoaded", async function () {
  // Redirect if already authenticated
  if ((await authService.requireGuest()) === false) return;

  const signupForm = document.getElementById("signup-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const togglePassword = document.getElementById("toggle-password");
  const toggleConfirmPassword = document.getElementById(
    "toggle-confirm-password"
  );
  const eyeIcon = document.getElementById("eye-icon");
  const confirmEyeIcon = document.getElementById("confirm-eye-icon");
  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");
  const termsCheckbox = document.getElementById("terms");

  // Password visibility toggles
  if (togglePassword && eyeIcon) {
    togglePassword.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      eyeIcon.setAttribute(
        "data-feather",
        type === "password" ? "eye" : "eye-off"
      );
      feather.replace();
    });
  }

  if (toggleConfirmPassword && confirmEyeIcon) {
    toggleConfirmPassword.addEventListener("click", function () {
      const type =
        confirmPasswordInput.getAttribute("type") === "password"
          ? "text"
          : "password";
      confirmPasswordInput.setAttribute("type", type);

      confirmEyeIcon.setAttribute(
        "data-feather",
        type === "password" ? "eye" : "eye-off"
      );
      feather.replace();
    });
  }

  // Password strength indicator
  if (passwordInput && strengthFill && strengthText) {
    passwordInput.addEventListener("input", function () {
      const password = this.value;
      UIHelpers.clearFieldError("password");

      if (password.length === 0) {
        strengthFill.className = "strength-fill";
        strengthText.textContent = "Password strength";
        return;
      }

      const { strength } = ValidationUtils.getPasswordStrength(password);
      strengthFill.className = `strength-fill ${strength}`;

      const strengthMessages = {
        weak: "Weak password",
        fair: "Fair password",
        good: "Good password",
        strong: "Strong password",
      };

      strengthText.textContent = strengthMessages[strength];
    });
  }

  // Real-time validation
  if (nameInput) {
    nameInput.addEventListener("blur", function () {
      const name = this.value.trim();
      if (name && !ValidationUtils.validateName(name)) {
        UIHelpers.showFieldError(
          "name",
          "Please enter a valid name (letters and spaces only)"
        );
      } else {
        UIHelpers.clearFieldError("name");
      }
    });

    nameInput.addEventListener("input", function () {
      UIHelpers.clearFieldError("name");
    });
  }

  if (emailInput) {
    emailInput.addEventListener("blur", function () {
      const email = this.value.trim();
      if (email && !ValidationUtils.validateEmail(email)) {
        UIHelpers.showFieldError("email", "Please enter a valid email address");
      } else {
        UIHelpers.clearFieldError("email");
      }
    });

    emailInput.addEventListener("input", function () {
      UIHelpers.clearFieldError("email");
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("blur", function () {
      const password = this.value;
      if (password && !ValidationUtils.validatePassword(password).isValid) {
        UIHelpers.showFieldError(
          "password",
          "Password must be at least 6 characters with uppercase, lowercase, and number"
        );
      } else {
        UIHelpers.clearFieldError("password");
      }
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("blur", function () {
      const password = passwordInput.value;
      const confirmPassword = this.value;

      if (confirmPassword && password !== confirmPassword) {
        UIHelpers.showFieldError("confirm-password", "Passwords do not match");
      } else {
        UIHelpers.clearFieldError("confirm-password");
      }
    });

    confirmPasswordInput.addEventListener("input", function () {
      UIHelpers.clearFieldError("confirm-password");
    });
  }

  // Form submission
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Clear previous messages
      UIHelpers.clearMessage("auth-message");
      UIHelpers.clearAllErrors(signupForm);

      // Get form data
      const formData = new FormData(signupForm);
      const name = formData.get("name").trim();
      const email = formData.get("email").trim();
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");
      const terms = formData.get("terms") === "on";

      // Validate form
      let hasErrors = false;

      if (!name) {
        UIHelpers.showFieldError("name", "Name is required");
        hasErrors = true;
      } else if (!ValidationUtils.validateName(name)) {
        UIHelpers.showFieldError(
          "name",
          "Please enter a valid name (letters and spaces only)"
        );
        hasErrors = true;
      }

      if (!email) {
        UIHelpers.showFieldError("email", "Email is required");
        hasErrors = true;
      } else if (!ValidationUtils.validateEmail(email)) {
        UIHelpers.showFieldError("email", "Please enter a valid email address");
        hasErrors = true;
      }

      if (!password) {
        UIHelpers.showFieldError("password", "Password is required");
        hasErrors = true;
      } else if (!ValidationUtils.validatePassword(password).isValid) {
        UIHelpers.showFieldError(
          "password",
          "Password must be at least 6 characters with uppercase, lowercase, and number"
        );
        hasErrors = true;
      }

      if (!confirmPassword) {
        UIHelpers.showFieldError(
          "confirm-password",
          "Please confirm your password"
        );
        hasErrors = true;
      } else if (password !== confirmPassword) {
        UIHelpers.showFieldError("confirm-password", "Passwords do not match");
        hasErrors = true;
      }

      if (!terms) {
        UIHelpers.showMessage(
          "auth-message",
          "Please accept the Terms of Service and Privacy Policy",
          "error"
        );
        hasErrors = true;
      }

      if (hasErrors) return;

      // Show loading state
      UIHelpers.setLoading("signup-btn", true);

      try {
        // Attempt sign up
        const response = await authService.signup({
          name,
          email,
          password,
          confirmPassword,
        });

        if (response.success) {
          UIHelpers.showMessage(
            "auth-message",
            "Account created successfully! Redirecting...",
            "success"
          );

          // Redirect after short delay
          setTimeout(() => {
            window.location.href = "profile.html";
          }, 2000);
        }
      } catch (error) {
        console.error("Sign up error:", error);

        // Show appropriate error message
        let errorMessage =
          "An error occurred while creating your account. Please try again.";

        if (error.message.includes("already exists")) {
          errorMessage =
            "An account with this email address already exists. Please sign in instead.";
          UIHelpers.showFieldError("email", "Email address is already in use");
        } else if (
          error.message.includes("validation") ||
          error.message.includes("Validation")
        ) {
          errorMessage = "Please check your information and try again.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        }

        UIHelpers.showMessage("auth-message", errorMessage, "error");
      } finally {
        UIHelpers.setLoading("signup-btn", false);
      }
    });
  }

  // Focus first input
  if (nameInput) {
    nameInput.focus();
  }

  // Handle demo/quick signup (for development)
  if (window.location.search.includes("demo=true")) {
    nameInput.value = "Demo User";
    emailInput.value = "demo@example.com";
    passwordInput.value = "Demo123!";
    confirmPasswordInput.value = "Demo123!";
    termsCheckbox.checked = true;
    UIHelpers.showMessage(
      "auth-message",
      "Demo data filled in. You can modify them or click Create Account.",
      "info"
    );
  }
});
