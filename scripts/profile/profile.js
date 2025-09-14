// Profile page functionality

document.addEventListener("DOMContentLoaded", async function () {
  // Wait for auth service to be ready
  if (!window.authService) {
    console.log("⏳ Waiting for authService to be ready...");
    await new Promise((resolve) => {
      if (window.authService) {
        resolve();
      } else {
        window.addEventListener("authServiceReady", resolve, { once: true });
      }
    });
  }

  // Require authentication
  if (!(await authService.requireAuth())) return;

  // Initialize profile page
  initializeProfile();
  setupNavigation();
  setupForms();
  setupPasswordToggles();
  loadUserData();
});

function initializeProfile() {
  const user = authService.getCurrentUser();

  if (user) {
    // Update profile header
    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("avatar-initials").textContent =
      authService.getUserInitials();

    // Update member since
    const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    document.getElementById("member-since").textContent = memberSince;
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".profile-section");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      const sectionId = item.getAttribute("data-section");

      // Update active nav item
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      // Show corresponding section
      sections.forEach((section) => section.classList.remove("active"));
      const targetSection = document.getElementById(`${sectionId}-section`);
      if (targetSection) {
        targetSection.classList.add("active");
      }

      // Update URL hash
      window.location.hash = sectionId;
    });
  });

  // Handle initial hash
  const hash = window.location.hash.substring(1);
  if (hash) {
    const navItem = document.querySelector(`[data-section="${hash}"]`);
    if (navItem) {
      navItem.click();
    }
  }
}

function setupForms() {
  // Personal Information Form
  const personalForm = document.getElementById("personal-info-form");
  if (personalForm) {
    personalForm.addEventListener("submit", handlePersonalInfoSubmit);
  }

  // Password Form
  const passwordForm = document.getElementById("password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordSubmit);
    setupPasswordStrength();
  }

  // Address Form
  const addressForm = document.getElementById("address-form");
  if (addressForm) {
    addressForm.addEventListener("submit", handleAddressSubmit);
  }

  // Preferences Form
  const preferencesForm = document.getElementById("preferences-form");
  if (preferencesForm) {
    preferencesForm.addEventListener("submit", handlePreferencesSubmit);
  }
}

function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll(".toggle-password");

  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.setAttribute("data-feather", "eye-off");
      } else {
        input.type = "password";
        icon.setAttribute("data-feather", "eye");
      }

      feather.replace();
    });
  });
}

function setupPasswordStrength() {
  const newPasswordInput = document.getElementById("new-password");
  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");

  if (newPasswordInput && strengthFill && strengthText) {
    newPasswordInput.addEventListener("input", function () {
      const password = this.value;

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
}

function loadUserData() {
  const user = authService.getCurrentUser();

  if (user) {
    // Load personal information
    document.getElementById("name").value = user.name || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone || "";

    // Load address information
    if (user.address) {
      document.getElementById("street").value = user.address.street || "";
      document.getElementById("city").value = user.address.city || "";
      document.getElementById("state").value = user.address.state || "";
      document.getElementById("zipCode").value = user.address.zipCode || "";
      document.getElementById("country").value = user.address.country || "";
    }

    // Load preferences
    if (user.preferences) {
      const notifications = user.preferences.notifications || {};
      document.getElementById("email-notifications").checked =
        notifications.email !== false;
      document.getElementById("order-updates").checked =
        notifications.orderUpdates !== false;
      document.getElementById("newsletters").checked =
        notifications.newsletters === true;

      document.getElementById("language").value =
        user.preferences.language || "en";
      document.getElementById("currency").value =
        user.preferences.currency || "USD";
    }
  }
}

async function handlePersonalInfoSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const name = formData.get("name").trim();
  const email = formData.get("email").trim();
  const phone = formData.get("phone").trim();

  // Validation
  let hasErrors = false;

  if (!name || !ValidationUtils.validateName(name)) {
    UIHelpers.showFieldError("name", "Please enter a valid name");
    hasErrors = true;
  }

  if (!email || !ValidationUtils.validateEmail(email)) {
    UIHelpers.showFieldError("email", "Please enter a valid email address");
    hasErrors = true;
  }

  if (hasErrors) return;

  UIHelpers.setLoading("save-personal-btn", true);

  try {
    const response = await authService.updateProfile({
      name,
      email,
      phone: phone || undefined,
    });

    if (response.success) {
      showProfileMessage(
        "Personal information updated successfully!",
        "success"
      );
      // Update header display
      authService.updateUI();
      // Update profile header
      initializeProfile();
    }
  } catch (error) {
    console.error("Profile update error:", error);
    showProfileMessage(
      error.message || "Failed to update profile. Please try again.",
      "error"
    );
  } finally {
    UIHelpers.setLoading("save-personal-btn", false);
  }
}

async function handlePasswordSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmNewPassword = formData.get("confirmNewPassword");

  // Clear previous errors
  const form = e.target;
  UIHelpers.clearAllErrors(form);

  // Validation
  let hasErrors = false;

  if (!currentPassword) {
    UIHelpers.showFieldError(
      "current-password",
      "Current password is required"
    );
    hasErrors = true;
  }

  if (!newPassword) {
    UIHelpers.showFieldError("new-password", "New password is required");
    hasErrors = true;
  } else if (!ValidationUtils.validatePassword(newPassword).isValid) {
    UIHelpers.showFieldError(
      "new-password",
      "Password must be at least 6 characters with uppercase, lowercase, and number"
    );
    hasErrors = true;
  }

  if (!confirmNewPassword) {
    UIHelpers.showFieldError(
      "confirm-new-password",
      "Please confirm your new password"
    );
    hasErrors = true;
  } else if (newPassword !== confirmNewPassword) {
    UIHelpers.showFieldError("confirm-new-password", "Passwords do not match");
    hasErrors = true;
  }

  if (hasErrors) return;

  UIHelpers.setLoading("change-password-btn", true);

  try {
    const response = await authService.changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    if (response.success) {
      showProfileMessage(
        "Password changed successfully! Please sign in again.",
        "success"
      );

      // Clear form
      form.reset();

      // Redirect to signin after delay
      setTimeout(() => {
        window.location.href = "signin.html";
      }, 2000);
    }
  } catch (error) {
    console.error("Password change error:", error);
    let errorMessage = "Failed to change password. Please try again.";

    if (error.message.includes("incorrect")) {
      errorMessage = "Current password is incorrect.";
      UIHelpers.showFieldError(
        "current-password",
        "Current password is incorrect"
      );
    }

    showProfileMessage(errorMessage, "error");
  } finally {
    UIHelpers.setLoading("change-password-btn", false);
  }
}

async function handleAddressSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const address = {
    street: formData.get("street").trim() || undefined,
    city: formData.get("city").trim() || undefined,
    state: formData.get("state").trim() || undefined,
    zipCode: formData.get("zipCode").trim() || undefined,
    country: formData.get("country").trim() || undefined,
  };

  UIHelpers.setLoading("save-address-btn", true);

  try {
    const response = await authService.updateProfile({ address });

    if (response.success) {
      showProfileMessage(
        "Address information updated successfully!",
        "success"
      );
    }
  } catch (error) {
    console.error("Address update error:", error);
    showProfileMessage(
      error.message || "Failed to update address. Please try again.",
      "error"
    );
  } finally {
    UIHelpers.setLoading("save-address-btn", false);
  }
}

async function handlePreferencesSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const preferences = {
    notifications: {
      email: formData.get("emailNotifications") === "on",
      orderUpdates: formData.get("orderUpdates") === "on",
      newsletters: formData.get("newsletters") === "on",
    },
    language: formData.get("language"),
    currency: formData.get("currency"),
  };

  UIHelpers.setLoading("save-preferences-btn", true);

  try {
    const response = await authService.updateProfile({ preferences });

    if (response.success) {
      showProfileMessage("Preferences updated successfully!", "success");
    }
  } catch (error) {
    console.error("Preferences update error:", error);
    showProfileMessage(
      error.message || "Failed to update preferences. Please try again.",
      "error"
    );
  } finally {
    UIHelpers.setLoading("save-preferences-btn", false);
  }
}

function showProfileMessage(message, type) {
  const messageElement = document.getElementById("profile-message");

  if (messageElement) {
    messageElement.textContent = message;
    messageElement.className = `profile-message ${type}`;
    messageElement.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageElement.style.display = "none";
    }, 5000);
  }
}
