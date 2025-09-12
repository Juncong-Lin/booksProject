// Simple client-side analytics tracking
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
    // Throttle click tracking to reduce CPU usage
    let clickTimeout = null;
    document.addEventListener("click", (e) => {
      if (clickTimeout) return; // Skip if already processing a click

      clickTimeout = setTimeout(() => {
        // Skip tracking for dashboard, analytics management, and other navigation links
        // to prevent them from being counted as category clicks
        const isDashboardLink =
          e.target.closest(".dashboard-link") ||
          e.target.closest('a[href*="dashboard.html"]');
        const isAnalyticsLink =
          e.target.closest(".data-management-link") ||
          e.target.closest('a[href*="analytics-management.html"]');
        const isCartLink =
          e.target.closest(".cart-link") ||
          e.target.closest('a[href*="checkout.html"]');
        const isHomeLink = e.target.closest('a[href*="index.html"]');

        // Skip tracking these navigation clicks to prevent category click inflation
        if (isDashboardLink || isAnalyticsLink || isCartLink || isHomeLink) {
          clickTimeout = null;
          return;
        }

        this.trackEvent("click", {
          element: e.target.tagName,
          className: e.target.className,
          text: e.target.textContent?.substring(0, 50),
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now(),
        });
        clickTimeout = null;
      }, 100); // Throttle clicks to maximum once per 100ms
    });

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.trackEvent("page_hidden", { timestamp: Date.now() });
      } else {
        this.trackEvent("page_visible", { timestamp: Date.now() });
      }
    });

    // Throttle scroll depth tracking to reduce CPU usage
    let maxScroll = 0;
    let scrollTimeout = null;
    window.addEventListener("scroll", () => {
      if (scrollTimeout) return; // Skip if already processing scroll

      scrollTimeout = setTimeout(() => {
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
        scrollTimeout = null;
      }, 250); // Throttle scroll events to maximum once per 250ms
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

    // Return empty data structure when no historical data exists
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

  // Product Discovery Tracking Methods
  trackCategoryClick(categoryName) {
    this.trackEvent("category_click", {
      category: categoryName,
      action: "navigation",
    });
    this.updateProductDiscoveryData("categoryClicks", 1);
    // Also update the specific category performance
    this.updateCategoryPerformance(categoryName, 1);

    // Clear search flag since user is now browsing categories
    sessionStorage.removeItem("from_search");
  }

  trackProductClick(productName, category = null, context = null) {
    this.trackEvent("product_click", {
      product: productName,
      category: category,
      action: "view_product",
      context: context,
    });

    // Track different types of clicks based on context
    if (context === "search") {
      this.updateProductDiscoveryData("searchProductClicks", 1);
    } else {
      this.updateProductDiscoveryData("productClicks", 1);
    }

    if (category) {
      this.updateCategoryPerformance(category, 1);
    }
  }

  trackSearchQuery(query) {
    this.trackEvent("search_query", {
      query: query,
      action: "search",
    });
    this.updateProductDiscoveryData("searchQueries", 1);

    // Set flag to indicate user is now in a search-based journey
    sessionStorage.setItem("from_search", "true");
  }

  trackAddToCart(productName, category = null, source = "unknown") {
    this.trackEvent("add_to_cart", {
      product: productName,
      category: category,
      source: source, // Track where the add to cart came from
      action: "add_to_cart",
    });
    this.updateProductDiscoveryData("cartAdditions", 1);

    // Determine if this is a search-based or category-based cart addition
    const isFromSearch = this.isUserFromSearch();

    if (isFromSearch) {
      // This is a search-based cart addition
      this.updateProductDiscoveryData("searchToCartConversions", 1);

      if (source === "search") {
        // Added to cart directly from search results page
        this.updateProductDiscoveryData("searchPageCartAdditions", 1);
      } else if (source === "detail") {
        // Added to cart from detail page after coming from search
        this.updateProductDiscoveryData("searchDetailPageCartAdditions", 1);
      }
    } else {
      // This is a category-based cart addition
      if (source === "category" || source === "index") {
        this.updateProductDiscoveryData("categoryPageCartAdditions", 1);
      } else if (source === "detail") {
        this.updateProductDiscoveryData("detailPageCartAdditions", 1);
      }
    }
  }

  isUserFromSearch() {
    // Check if user recently performed a search by looking at recent events
    // and URL parameters

    // Check URL for search parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("search") || urlParams.has("q")) {
      return true;
    }

    // Check if user came from search results (referrer check)
    if (document.referrer && document.referrer.includes("search")) {
      return true;
    }

    // Check recent events for search activity
    const recentEvents = this.events.slice(-10); // Check last 10 events
    const hasRecentSearch = recentEvents.some(
      (event) =>
        event.type === "search" ||
        (event.type === "click" && event.data.source === "search")
    );

    if (hasRecentSearch) {
      return true;
    }

    // Check session storage for search flag
    const searchFlag = sessionStorage.getItem("from_search");
    return searchFlag === "true";
  }

  trackSidebarExpand(section) {
    this.trackEvent("sidebar_expand", {
      section: section,
      action: "navigation",
    });
    this.updateProductDiscoveryData("sidebarClicks", 1);
  }

  trackPurchase(orderTotal, itemCount, cartItems = []) {
    console.log("trackPurchase called:", { orderTotal, itemCount, cartItems });
    this.trackEvent("purchase_completed", {
      orderTotal: orderTotal,
      itemCount: itemCount,
      action: "purchase",
    });
    this.updateProductDiscoveryData("actualPurchases", 1);

    // Analyze cart sources to determine purchase attribution
    let hasCategoryItems = false;
    let hasSearchItems = false;

    cartItems.forEach((item) => {
      if (item.source === "category" || item.source === "detail") {
        hasCategoryItems = true;
      } else if (item.source === "search") {
        hasSearchItems = true;
      }
    });

    // Attribute purchases based on cart sources
    // If cart has category/detail items, count as category purchase
    if (hasCategoryItems) {
      console.log("Updating categoryPurchases");
      this.updateProductDiscoveryData("categoryPurchases", 1);
    }

    // If cart has search items, count as search purchase
    if (hasSearchItems) {
      console.log("Updating searchPurchases");
      this.updateProductDiscoveryData("searchPurchases", 1);
    }
  }

  trackHeaderClick(item) {
    this.trackEvent("header_click", {
      item: item,
      action: "navigation",
    });
    this.updateProductDiscoveryData("headerClicks", 1);
  }

  updateProductDiscoveryData(metric, increment = 1) {
    let data = JSON.parse(
      localStorage.getItem("product_discovery_data") || "{}"
    );

    // Initialize data structure if empty
    if (Object.keys(data).length === 0) {
      data = {
        categoryClicks: 0,
        productClicks: 0,
        searchQueries: 0,
        searchProductClicks: 0,
        cartAdditions: 0,
        categoryPageCartAdditions: 0,
        detailPageCartAdditions: 0,
        searchToCartConversions: 0,
        actualPurchases: 0,
        categoryPurchases: 0,
        searchPurchases: 0,
        homepageVisits: 0,
        sidebarClicks: 0,
        headerClicks: 0,
        categoryPerformance: {},
        dailyDiscoveryActions: [],
        lastUpdated: Date.now(),
      };
    }

    // Update the specific metric
    data[metric] = (data[metric] || 0) + increment;
    data.lastUpdated = Date.now();

    // Save updated data
    localStorage.setItem("product_discovery_data", JSON.stringify(data));

    // Notify dashboard if open
    this.notifyDashboard(data);
  }

  updateCategoryPerformance(category, increment = 1) {
    let data = JSON.parse(
      localStorage.getItem("product_discovery_data") || "{}"
    );

    if (!data.categoryPerformance) {
      data.categoryPerformance = {};
    }

    data.categoryPerformance[category] =
      (data.categoryPerformance[category] || 0) + increment;
    data.lastUpdated = Date.now();

    localStorage.setItem("product_discovery_data", JSON.stringify(data));
    this.notifyDashboard(data);
  }

  notifyDashboard(data) {
    // Try to notify dashboard windows
    try {
      // Post message to parent window (if dashboard is opener)
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "productDiscoveryUpdate",
            data: data,
          },
          "*"
        );
      }

      // Post message to any child windows
      const dashboardWindows = window.dashboardWindows || [];
      dashboardWindows.forEach((win) => {
        if (win && !win.closed) {
          win.postMessage(
            {
              type: "productDiscoveryUpdate",
              data: data,
            },
            "*"
          );
        }
      });
    } catch (error) {
      console.log("Could not notify dashboard:", error);
    }
  }

  // Get current product discovery data
  getProductDiscoveryData() {
    return JSON.parse(localStorage.getItem("product_discovery_data") || "{}");
  }
}

// Initialize analytics when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.analytics = new SimpleAnalytics();

  // Track homepage visits for product discovery analytics
  if (
    window.location.pathname === "/" ||
    window.location.pathname.includes("index.html") ||
    window.location.pathname === ""
  ) {
    if (window.analytics) {
      window.analytics.updateProductDiscoveryData("homepageVisits", 1);
    }
  }
});

export { SimpleAnalytics };
