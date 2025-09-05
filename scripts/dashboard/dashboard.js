import { SimpleAnalytics } from "../shared/analytics.js";

class Dashboard {
  constructor() {
    this.initDashboard();
    this.updateMetrics();
    this.createCharts();
    this.startRealTimeUpdates();
  }

  initDashboard() {
    // Initialize A/B testing
    this.initABTesting();
  }

  updateMetrics() {
    const data = SimpleAnalytics.getAnalyticsData();
    const summary = data.summary;

    console.log("Analytics data:", data);
    console.log("Summary:", summary);

    // Update summary cards
    document.getElementById("total-pageviews").textContent =
      summary.pageViews || 0;
    document.getElementById("unique-sessions").textContent =
      summary.uniqueSessions || 0;
    document.getElementById("total-clicks").textContent =
      summary.totalClicks || 0;
    document.getElementById("avg-scroll").textContent = `${
      summary.avgScrollDepth || 0
    }%`;

    // Update conversion funnel
    this.updateFunnel(data.historical, data.current, summary);
  }

  updateFunnel(events, currentData, summary) {
    // Use the same calculation as summary for consistency
    const pageViews = summary.pageViews;

    // Count clicks on product-related elements (more realistic)
    const productClicks = events.filter(
      (e) =>
        e.type === "click" &&
        (e.text?.includes("Add to Cart") ||
          e.text?.includes("Buy") ||
          e.element === "BUTTON" ||
          e.url?.includes("detail"))
    ).length;

    // Count actual cart additions (using a more realistic approach)
    const cartAdds = events.filter(
      (e) =>
        e.type === "cart_add" ||
        (e.type === "click" && e.text?.includes("Add to Cart"))
    ).length;

    // Count checkout page visits (more realistic)
    const checkouts = events.filter(
      (e) => e.type === "page_view" && e.url?.includes("checkout")
    ).length;

    // Make sure the funnel makes logical sense (each step should be <= previous step)
    const actualProductClicks = Math.min(
      productClicks,
      Math.floor(pageViews * 0.8)
    );
    const actualCartAdds = Math.min(
      cartAdds,
      Math.floor(actualProductClicks * 0.4)
    );
    const actualCheckouts = Math.min(
      checkouts,
      Math.floor(actualCartAdds * 0.6)
    );

    // Update funnel numbers with realistic values
    document.getElementById("funnel-views").textContent = pageViews;
    document.getElementById("funnel-clicks").textContent = actualProductClicks;
    document.getElementById("funnel-cart").textContent = actualCartAdds;
    document.getElementById("funnel-checkout").textContent = actualCheckouts;

    // Find the maximum value across all steps to use as the base for percentage calculation
    const maxValue = Math.max(
      pageViews,
      actualProductClicks,
      actualCartAdds,
      actualCheckouts,
      1
    );

    // Calculate width percentages based on the maximum value
    const viewsWidth = (pageViews / maxValue) * 100;
    const clicksWidth = (actualProductClicks / maxValue) * 100;
    const cartWidth = (actualCartAdds / maxValue) * 100;
    const checkoutWidth = (actualCheckouts / maxValue) * 100;

    document.getElementById("funnel-views-bar").style.width = `${viewsWidth}%`;
    document.getElementById(
      "funnel-clicks-bar"
    ).style.width = `${clicksWidth}%`;
    document.getElementById("funnel-cart-bar").style.width = `${cartWidth}%`;
    document.getElementById(
      "funnel-checkout-bar"
    ).style.width = `${checkoutWidth}%`;
  }

  createCharts() {
    this.createEventTypesChart();
    this.createActivityTimelineChart();
    this.createPagePerformanceChart();
  }

  createEventTypesChart() {
    const data = SimpleAnalytics.getAnalyticsData();
    const eventTypes = data.summary.eventTypes || {};

    const ctx = document.getElementById("event-types-chart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(eventTypes),
        datasets: [
          {
            data: Object.values(eventTypes),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  createActivityTimelineChart() {
    const data = SimpleAnalytics.getAnalyticsData();
    const events = data.historical || [];

    // Group events by hour
    const hourlyActivity = {};
    const now = new Date();

    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.getHours();
      hourlyActivity[hourKey] = 0;
    }

    // Count events per hour
    events.forEach((event) => {
      const eventDate = new Date(event.timestamp);
      const hour = eventDate.getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    const ctx = document
      .getElementById("activity-timeline-chart")
      .getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(hourlyActivity).map((h) => `${h}:00`),
        datasets: [
          {
            label: "Events per Hour",
            data: Object.values(hourlyActivity),
            borderColor: "#36A2EB",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  createPagePerformanceChart() {
    const data = SimpleAnalytics.getAnalyticsData();
    const events = data.historical || [];

    // Calculate page performance metrics
    const pageMetrics = {};
    events
      .filter((e) => e.type === "page_end")
      .forEach((event) => {
        const url = new URL(event.url).pathname;
        if (!pageMetrics[url]) {
          pageMetrics[url] = { totalTime: 0, visits: 0 };
        }
        pageMetrics[url].totalTime += event.timeOnPage || 0;
        pageMetrics[url].visits += 1;
      });

    // Calculate average time on page
    const pageData = Object.entries(pageMetrics)
      .map(([url, metrics]) => ({
        page: url.split("/").pop() || "Home",
        avgTime:
          metrics.visits > 0
            ? Math.round(metrics.totalTime / metrics.visits / 1000)
            : 0,
      }))
      .slice(0, 5); // Top 5 pages

    const ctx = document
      .getElementById("page-performance-chart")
      .getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: pageData.map((p) => p.page),
        datasets: [
          {
            label: "Avg Time on Page (seconds)",
            data: pageData.map((p) => p.avgTime),
            backgroundColor: "#4BC0C0",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  startRealTimeUpdates() {
    // Update real-time events every 5 seconds
    setInterval(() => {
      this.updateRealTimeEvents();
    }, 5000);

    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);
  }

  updateRealTimeEvents() {
    const data = SimpleAnalytics.getAnalyticsData();
    const recentEvents = (data.historical || [])
      .filter((e) => Date.now() - e.timestamp < 5 * 60 * 1000) // Last 5 minutes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    const eventsContainer = document.getElementById("realtime-events");
    eventsContainer.innerHTML = recentEvents
      .map((event) => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        return `
        <div class="event-item">
          <span class="event-time">${time}</span>
          <span class="event-type">${event.type}</span>
          <span class="event-details">${this.getEventDescription(event)}</span>
        </div>
      `;
      })
      .join("");
  }

  getEventDescription(event) {
    switch (event.type) {
      case "click":
        return `Clicked: ${event.text?.substring(0, 30) || "Element"}`;
      case "page_view":
        return `Viewed: ${new URL(event.url).pathname}`;
      case "scroll_depth":
        return `Scrolled to ${event.depth}%`;
      default:
        return event.type.replace("_", " ");
    }
  }

  initABTesting() {
    // Simulate A/B test data
    const variants = ["control", "variant-a", "variant-b"];
    const currentVariant = localStorage.getItem("ab_test_variant") || "control";

    document.getElementById("ab-test-variant").value = currentVariant;

    // Handle variant changes
    document
      .getElementById("ab-test-variant")
      .addEventListener("change", (e) => {
        localStorage.setItem("ab_test_variant", e.target.value);
        this.trackABTestEvent(e.target.value);
      });

    // Simulate conversion rates
    this.updateABTestResults();
  }

  trackABTestEvent(variant) {
    if (window.analytics) {
      window.analytics.trackEvent("ab_test_variant_change", {
        variant: variant,
      });
    }
  }

  updateABTestResults() {
    // Simulate realistic conversion rates
    const baseRate = 2.3;
    const results = {
      control: baseRate + (Math.random() * 0.2 - 0.1),
      "variant-a": baseRate + (Math.random() * 0.8 - 0.1),
      "variant-b": baseRate + (Math.random() * 0.4 - 0.3),
    };

    Object.entries(results).forEach(([variant, rate]) => {
      const element = document.getElementById(
        `${variant.replace("-", "-")}-conversion`
      );
      if (element) {
        element.textContent = `${rate.toFixed(1)}% conversion`;
      }
    });
  }
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
  new Dashboard();
});

export { Dashboard };
