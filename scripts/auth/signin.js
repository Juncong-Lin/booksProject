// Sign in page functionality

document.addEventListener("DOMContentLoaded", async function () {
  // Redirect if already authenticated
  if ((await authService.requireGuest()) === false) return;

  const signinForm = document.getElementById("signin-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");
  const eyeIcon = document.getElementById("eye-icon");

  // Password visibility toggle
  if (togglePassword && eyeIcon) {
    togglePassword.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      // Toggle eye icon
      eyeIcon.setAttribute(
        "data-feather",
        type === "password" ? "eye" : "eye-off"
      );
      feather.replace();
    });
  }

  // Real-time validation
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
    passwordInput.addEventListener("input", function () {
      UIHelpers.clearFieldError("password");
    });
  }

  // Form submission
  if (signinForm) {
    signinForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Clear previous messages
      UIHelpers.clearMessage("auth-message");
      UIHelpers.clearAllErrors(signinForm);

      // Get form data
      const formData = new FormData(signinForm);
      const email = formData.get("email").trim();
      const password = formData.get("password");
      const rememberMe = formData.get("rememberMe") === "on";

      // Validate form
      let hasErrors = false;

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
      }

      if (hasErrors) return;

      // Show loading state
      UIHelpers.setLoading("signin-btn", true);

      try {
        // Attempt sign in
        const response = await authService.signin({
          email,
          password,
          rememberMe,
        });

        if (response.success) {
          UIHelpers.showMessage(
            "auth-message",
            "Successfully signed in! Redirecting...",
            "success"
          );

          // Redirect after short delay
          setTimeout(() => {
            const returnUrl = new URLSearchParams(window.location.search).get(
              "returnUrl"
            );
            window.location.href = returnUrl || "profile.html";
          }, 1500);
        }
      } catch (error) {
        console.error("Sign in error:", error);

        // Show appropriate error message
        let errorMessage =
          "An error occurred while signing in. Please try again.";

        if (error.message.includes("Invalid email or password")) {
          errorMessage =
            "Invalid email or password. Please check your credentials and try again.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        }

        UIHelpers.showMessage("auth-message", errorMessage, "error");
      } finally {
        UIHelpers.setLoading("signin-btn", false);
      }
    });
  }

  // Focus first input
  if (emailInput) {
    emailInput.focus();
  }

  // Handle demo/quick signin (for development)
  if (window.location.search.includes("demo=true")) {
    emailInput.value = "demo@example.com";
    passwordInput.value = "Demo123!";
    UIHelpers.showMessage(
      "auth-message",
      "Demo credentials filled in. You can modify them or click Sign In.",
      "info"
    );
  }
});
