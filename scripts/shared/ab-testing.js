// Simple A/B Testing Framework
class ABTesting {
  constructor() {
    this.tests = {
      homepage_layout: {
        variants: ["control", "variant-a", "variant-b"],
        weights: [0.4, 0.3, 0.3], // 40% control, 30% each variant
      },
      product_button_color: {
        variants: ["blue", "green", "orange"],
        weights: [0.5, 0.25, 0.25],
      },
    };

    this.initTests();
  }

  initTests() {
    // Assign user to test variants if not already assigned
    Object.keys(this.tests).forEach((testName) => {
      if (!localStorage.getItem(`ab_test_${testName}`)) {
        const variant = this.assignVariant(testName);
        localStorage.setItem(`ab_test_${testName}`, variant);
        this.trackEvent("ab_test_assignment", {
          test: testName,
          variant: variant,
        });
      }
    });
  }

  assignVariant(testName) {
    const test = this.tests[testName];
    if (!test) return "control";

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < test.variants.length; i++) {
      cumulative += test.weights[i];
      if (random <= cumulative) {
        return test.variants[i];
      }
    }

    return test.variants[0]; // fallback to first variant
  }

  getVariant(testName) {
    return localStorage.getItem(`ab_test_${testName}`) || "control";
  }

  trackConversion(testName, conversionType = "default") {
    const variant = this.getVariant(testName);
    this.trackEvent("ab_test_conversion", {
      test: testName,
      variant: variant,
      conversionType: conversionType,
    });
  }

  trackEvent(eventType, data) {
    if (window.analytics) {
      window.analytics.trackEvent(eventType, data);
    }
  }

  // Apply visual changes based on test variants
  applyVariant(testName) {
    const variant = this.getVariant(testName);

    switch (testName) {
      case "homepage_layout":
        this.applyHomepageLayoutVariant(variant);
        break;
      case "product_button_color":
        this.applyButtonColorVariant(variant);
        break;
    }
  }

  applyHomepageLayoutVariant(variant) {
    const body = document.body;

    switch (variant) {
      case "variant-a":
        body.classList.add("layout-variant-a");
        break;
      case "variant-b":
        body.classList.add("layout-variant-b");
        break;
      default:
        // control - no changes
        break;
    }
  }

  applyButtonColorVariant(variant) {
    const buttons = document.querySelectorAll(".add-to-cart-button");

    buttons.forEach((button) => {
      button.classList.remove("button-blue", "button-green", "button-orange");

      switch (variant) {
        case "green":
          button.classList.add("button-green");
          break;
        case "orange":
          button.classList.add("button-orange");
          break;
        default:
          button.classList.add("button-blue");
          break;
      }
    });
  }

  // Get test results summary
  getTestResults() {
    const results = {};

    Object.keys(this.tests).forEach((testName) => {
      results[testName] = {
        currentVariant: this.getVariant(testName),
        conversions: this.getConversionsForTest(testName),
      };
    });

    return results;
  }

  getConversionsForTest(testName) {
    // This would typically be calculated from server data
    // For demo purposes, return simulated data
    const variants = this.tests[testName].variants;
    const conversions = {};

    variants.forEach((variant) => {
      conversions[variant] = {
        views: Math.floor(Math.random() * 1000) + 100,
        conversions: Math.floor(Math.random() * 50) + 10,
        rate: (Math.random() * 5 + 1).toFixed(2) + "%",
      };
    });

    return conversions;
  }
}

// Initialize A/B testing when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.abTesting = new ABTesting();

  // Apply variants after a short delay to ensure DOM is ready
  setTimeout(() => {
    window.abTesting.applyVariant("homepage_layout");
    window.abTesting.applyVariant("product_button_color");
  }, 100);
});

export { ABTesting };
