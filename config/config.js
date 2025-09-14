// Configuration for different environments - v2.0

class AppConfig {
  constructor() {
    this.env = this.detectEnvironment();
    this.settings = this.getConfig();
  }

  detectEnvironment() {
    // Check if we're running on localhost
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";

    // Check for specific production domains
    const isProduction =
      hostname.includes("juncongmall.com") ||
      hostname.includes("netlify.app") ||
      hostname.includes("vercel.app") ||
      hostname.includes("github.io") ||
      !isLocalhost;

    return isProduction ? "production" : "development";
  }

  getConfig() {
    const configs = {
      development: {
        API_BASE_URL: "http://localhost:5000/api/v1",
        FRONTEND_URL: "http://localhost:5500",
        WEBSOCKET_URL: "ws://localhost:5000",
        ENVIRONMENT: "development",
      },
      production: {
        // Updated with your Render backend URL
        API_BASE_URL: "https://bookstore-backend-yu11.onrender.com/api/v1",
        FRONTEND_URL: window.location.origin,
        WEBSOCKET_URL: "wss://bookstore-backend-yu11.onrender.com",
        ENVIRONMENT: "production",
      },
    };

    return configs[this.env];
  }

  get apiBaseUrl() {
    return this.settings.API_BASE_URL;
  }

  get frontendUrl() {
    return this.settings.FRONTEND_URL;
  }

  get websocketUrl() {
    return this.settings.WEBSOCKET_URL;
  }

  get environment() {
    return this.settings.ENVIRONMENT;
  }

  get isDevelopment() {
    return this.environment === "development";
  }

  get isProduction() {
    return this.environment === "production";
  }
}

// Create global configuration instance
window.CONFIG = new AppConfig();

// Log current environment for debugging
console.log(`🌍 Environment: ${window.CONFIG.environment}`);
console.log(`🔗 API Base URL: ${window.CONFIG.apiBaseUrl}`);
