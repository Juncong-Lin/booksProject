// Simple client-side analytics tracking
class SimpleAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    this.pageViews = [];
    this.currentPageStart = Date.now();

    // Initialize tracking
    this.initTracking();
    this.trackPageView();
  }

  generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  initTracking() {
    // Track clicks
    document.addEventListener("click", (e) => {
      this.trackEvent("click", {
        element: e.target.tagName,
        className: e.target.className,
        text: e.target.textContent?.substring(0, 50),
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      });
    });

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.trackEvent("page_hidden", { timestamp: Date.now() });
      } else {
        this.trackEvent("page_visible", { timestamp: Date.now() });
      }
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener("scroll", () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
          100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        this.trackEvent("scroll_depth", {
          depth: scrollPercent,
          timestamp: Date.now(),
        });
      }
    });

    // Track before page unload
    window.addEventListener("beforeunload", () => {
      this.trackPageEnd();
      this.saveData();
    });
  }

  trackPageView() {
    const pageData = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    };

    this.pageViews.push(pageData);

    // Also track as an event for dashboard analytics
    this.trackEvent("page_view", {
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    });

    this.saveData();
  }

  trackEvent(eventType, data) {
    const event = {
      type: eventType,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      ...data,
    };

    this.events.push(event);

    // Save every 10 events to prevent data loss
    if (this.events.length % 10 === 0) {
      this.saveData();
    }
  }

  trackPageEnd() {
    const timeOnPage = Date.now() - this.currentPageStart;
    this.trackEvent("page_end", { timeOnPage: timeOnPage });
  }

  saveData() {
    const analyticsData = {
      sessionId: this.sessionId,
      pageViews: this.pageViews,
      events: this.events,
      lastUpdated: Date.now(),
    };

    // Save to localStorage (in a real implementation, this would be sent to a server)
    localStorage.setItem("analytics_data", JSON.stringify(analyticsData));

    // Also save to a historical log
    const historicalData = JSON.parse(
      localStorage.getItem("analytics_history") || "[]"
    );
    historicalData.push(...this.events.splice(0)); // Move events to history and clear current

    // Keep only last 1000 events to prevent storage overflow
    if (historicalData.length > 1000) {
      historicalData.splice(0, historicalData.length - 1000);
    }

    localStorage.setItem("analytics_history", JSON.stringify(historicalData));
  }

  // Static method to get analytics data for dashboard
  static getAnalyticsData() {
    const currentData = JSON.parse(
      localStorage.getItem("analytics_data") || "{}"
    );
    const historicalData = JSON.parse(
      localStorage.getItem("analytics_history") || "[]"
    );

    // If no historical data exists, generate some sample data
    if (historicalData.length === 0) {
      this.generateSampleData();
      // Reload the data after generating samples
      const newHistoricalData = JSON.parse(
        localStorage.getItem("analytics_history") || "[]"
      );
      return {
        current: currentData,
        historical: newHistoricalData,
        summary: this.generateSummary(newHistoricalData, currentData),
      };
    }

    return {
      current: currentData,
      historical: historicalData,
      summary: this.generateSummary(historicalData, currentData),
    };
  }

  static generateSummary(events, currentData = {}) {
    const summary = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map((e) => e.sessionId)).size,
      eventTypes: {},
      pageViews: events.filter((e) => e.type === "page_view").length,
      totalClicks: events.filter((e) => e.type === "click").length,
      avgScrollDepth: 0,
    };

    // Add current session page views if available
    if (currentData.pageViews && currentData.pageViews.length > 0) {
      summary.pageViews += currentData.pageViews.length;
    }

    // Count event types
    events.forEach((event) => {
      summary.eventTypes[event.type] =
        (summary.eventTypes[event.type] || 0) + 1;
    });

    // Calculate average scroll depth
    const scrollEvents = events.filter((e) => e.type === "scroll_depth");
    if (scrollEvents.length > 0) {
      summary.avgScrollDepth = Math.round(
        scrollEvents.reduce((sum, e) => sum + e.depth, 0) / scrollEvents.length
      );
    }

    return summary;
  }

  // Generate sample data for demonstration purposes
  static generateSampleData() {
    const sampleEvents = [];
    const now = Date.now();
    const sessionIds = [
      "session_1",
      "session_2",
      "session_3",
      "session_4",
      "session_5",
    ];
    const pages = ["/", "/detail.html", "/index.html", "/checkout.html"];

    // Generate realistic user journey data
    sessionIds.forEach((sessionId, sessionIndex) => {
      const sessionStart = now - Math.random() * 24 * 60 * 60 * 1000;
      let currentTime = sessionStart;

      // Each session starts with a page view
      sampleEvents.push({
        type: "page_view",
        sessionId: sessionId,
        timestamp: currentTime,
        url: window.location.origin + "/",
        title: "Home Page",
        referrer: "",
      });
      currentTime += 2000;

      // 80% chance of clicking on products
      if (Math.random() < 0.8) {
        sampleEvents.push({
          type: "click",
          sessionId: sessionId,
          timestamp: currentTime,
          url: window.location.origin + "/",
          element: "BUTTON",
          text: "View Details",
        });
        currentTime += 1000;

        // View product detail page
        sampleEvents.push({
          type: "page_view",
          sessionId: sessionId,
          timestamp: currentTime,
          url: window.location.origin + "/detail.html",
          title: "Product Details",
          referrer: window.location.origin + "/",
        });
        currentTime += 3000;

        // 40% chance of adding to cart
        if (Math.random() < 0.4) {
          sampleEvents.push({
            type: "click",
            sessionId: sessionId,
            timestamp: currentTime,
            url: window.location.origin + "/detail.html",
            element: "BUTTON",
            text: "Add to Cart",
          });
          currentTime += 1000;

          sampleEvents.push({
            type: "cart_add",
            sessionId: sessionId,
            timestamp: currentTime,
            url: window.location.origin + "/detail.html",
            productId: "book_" + (sessionIndex + 1),
          });
          currentTime += 2000;

          // 60% chance of proceeding to checkout
          if (Math.random() < 0.6) {
            sampleEvents.push({
              type: "page_view",
              sessionId: sessionId,
              timestamp: currentTime,
              url: window.location.origin + "/checkout.html",
              title: "Checkout",
              referrer: window.location.origin + "/detail.html",
            });
            currentTime += 5000;
          }
        }
      }

      // Add some scroll events
      for (let i = 0; i < 3; i++) {
        sampleEvents.push({
          type: "scroll_depth",
          sessionId: sessionId,
          timestamp: currentTime + i * 1000,
          url: window.location.origin + (i === 0 ? "/" : "/detail.html"),
          depth: Math.min(25 + i * 25, 100),
        });
      }
    });

    // Add some additional random events to reach target
    while (sampleEvents.length < 80) {
      const randomSessionId =
        sessionIds[Math.floor(Math.random() * sessionIds.length)];
      const randomPage = pages[Math.floor(Math.random() * pages.length)];
      const timestamp = now - Math.random() * 24 * 60 * 60 * 1000;

      sampleEvents.push({
        type: "click",
        sessionId: randomSessionId,
        timestamp: timestamp,
        url: window.location.origin + randomPage,
        element: "DIV",
        text: "Random Click",
      });
    }

    // Sort events by timestamp
    sampleEvents.sort((a, b) => a.timestamp - b.timestamp);

    localStorage.setItem("analytics_history", JSON.stringify(sampleEvents));
  }
}

// Initialize analytics when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.analytics = new SimpleAnalytics();
});

export { SimpleAnalytics };
