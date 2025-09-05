import { SimpleAnalytics } from "../shared/analytics.js";

class Dashboard {
  constructor() {
    this.charts = {};
    this.realTimeUpdateInterval = null;
    this.metricsUpdateInterval = null;
    this.isPaused = false;

    this.initDashboard();
    this.updateMetrics();
    this.createCharts();
    this.createMiniCharts();
    this.startRealTimeUpdates();
    this.initEventHandlers();
  }

  initDashboard() {
    // Initialize A/B testing
    this.initABTesting();
    // Initialize time filters
    this.initTimeFilters();
    // Initialize control buttons
    this.initControlButtons();
  }

  initEventHandlers() {
    // Refresh button
    const refreshBtn = document.getElementById("refresh-data");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.refreshData();
      });
    }

    // Pause/resume real-time updates
    const pauseBtn = document.getElementById("pause-realtime");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        this.toggleRealTimeUpdates();
      });
    }

    // Clear events
    const clearBtn = document.getElementById("clear-events");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.clearEvents();
      });
    }
  }

  initTimeFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Remove active class from all buttons
        filterButtons.forEach((b) => b.classList.remove("active"));
        // Add active class to clicked button
        e.target.classList.add("active");

        // Update chart based on selected period
        const period = e.target.dataset.period;
        this.updateActivityChart(period);
      });
    });
  }

  initControlButtons() {
    // Add click handlers for various control buttons
    document.querySelectorAll(".test-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.style.transform = "scale(0.95)";
        setTimeout(() => {
          btn.style.transform = "";
        }, 100);
      });
    });
  }

  updateMetrics() {
    const data = SimpleAnalytics.getAnalyticsData();
    const summary = data.summary;

    console.log("Analytics data:", data);
    console.log("Summary:", summary);

    // Update summary cards with animations
    this.updateMetricValue("total-pageviews", summary.pageViews || 0);
    this.updateMetricValue("unique-sessions", summary.uniqueSessions || 0);
    this.updateMetricValue("total-clicks", summary.totalClicks || 0);
    this.updateMetricValue("avg-scroll", `${summary.avgScrollDepth || 0}%`);

    // Update conversion funnel
    this.updateFunnel(data.historical, data.current, summary);

    // Update overall conversion rate
    this.updateOverallConversionRate(data.historical, summary);
  }

  updateMetricValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (element) {
      const currentValue = element.textContent;
      if (currentValue !== newValue.toString()) {
        element.style.transform = "scale(1.1)";
        element.style.color = "#10b981";
        setTimeout(() => {
          element.textContent = newValue;
          element.style.transform = "";
          element.style.color = "";
        }, 200);
      }
    }
  }

  updateOverallConversionRate(events, summary) {
    const pageViews = summary.pageViews || 1;
    const checkouts = events.filter(
      (e) => e.type === "page_view" && e.url?.includes("checkout")
    ).length;

    const conversionRate = ((checkouts / pageViews) * 100).toFixed(1);
    const element = document.getElementById("overall-conversion");
    if (element) {
      element.textContent = `${conversionRate}%`;
    }
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

    // Update percentages
    if (pageViews > 0) {
      const clicksPercent = ((actualProductClicks / pageViews) * 100).toFixed(
        1
      );
      const cartPercent = ((actualCartAdds / pageViews) * 100).toFixed(1);
      const checkoutPercent = ((actualCheckouts / pageViews) * 100).toFixed(1);

      const clicksPercentEl = document.getElementById("funnel-clicks-percent");
      const cartPercentEl = document.getElementById("funnel-cart-percent");
      const checkoutPercentEl = document.getElementById(
        "funnel-checkout-percent"
      );

      if (clicksPercentEl) clicksPercentEl.textContent = `${clicksPercent}%`;
      if (cartPercentEl) cartPercentEl.textContent = `${cartPercent}%`;
      if (checkoutPercentEl)
        checkoutPercentEl.textContent = `${checkoutPercent}%`;
    }

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

    // Animate the bars
    this.animateBar("funnel-views-bar", viewsWidth);
    this.animateBar("funnel-clicks-bar", clicksWidth);
    this.animateBar("funnel-cart-bar", cartWidth);
    this.animateBar("funnel-checkout-bar", checkoutWidth);
  }

  animateBar(elementId, width) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.width = "0%";
      setTimeout(() => {
        element.style.width = `${width}%`;
      }, 100);
    }
  }

  createCharts() {
    this.createEventTypesChart();
    this.createActivityTimelineChart();
    this.createPagePerformanceChart();
    this.createBookCategoriesChart();
  }

  createMiniCharts() {
    // Create mini sparkline charts for each metric card
    this.createMiniChart(
      "pageviews-mini-chart",
      this.generateMiniData(),
      "#3b82f6"
    );
    this.createMiniChart(
      "sessions-mini-chart",
      this.generateMiniData(),
      "#10b981"
    );
    this.createMiniChart(
      "clicks-mini-chart",
      this.generateMiniData(),
      "#f59e0b"
    );
    this.createMiniChart(
      "scroll-mini-chart",
      this.generateMiniData(),
      "#8b5cf6"
    );
  }

  createMiniChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from({ length: data.length }, (_, i) => i),
        datasets: [
          {
            data: data,
            borderColor: color,
            backgroundColor: color + "20",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: {
          line: { borderWidth: 2 },
        },
      },
    });
  }

  generateMiniData() {
    // Generate realistic trending data for sparklines
    const data = [];
    let value = 50 + Math.random() * 50;
    for (let i = 0; i < 12; i++) {
      value += (Math.random() - 0.5) * 20;
      value = Math.max(10, Math.min(100, value));
      data.push(Math.round(value));
    }
    return data;
  }

  createEventTypesChart() {
    const data = SimpleAnalytics.getAnalyticsData();
    const eventTypes = data.summary.eventTypes || {};

    const ctx = document.getElementById("event-types-chart").getContext("2d");
    this.charts.eventTypes = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(eventTypes),
        datasets: [
          {
            data: Object.values(eventTypes),
            backgroundColor: [
              "#ef4444",
              "#3b82f6",
              "#f59e0b",
              "#10b981",
              "#8b5cf6",
              "#ec4899",
            ],
            borderWidth: 0,
            hoverBorderWidth: 2,
            hoverBorderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
          },
        },
        cutout: "60%",
      },
    });
  }

  createActivityTimelineChart(period = "24h") {
    const data = SimpleAnalytics.getAnalyticsData();
    const events = data.historical || [];

    let timelineData = this.processTimelineData(events, period);

    const ctx = document
      .getElementById("activity-timeline-chart")
      .getContext("2d");

    // Destroy existing chart if it exists
    if (this.charts.activityTimeline) {
      this.charts.activityTimeline.destroy();
    }

    this.charts.activityTimeline = new Chart(ctx, {
      type: "line",
      data: {
        labels: timelineData.labels,
        datasets: [
          {
            label: "User Activity",
            data: timelineData.data,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: "#6366f1",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#9ca3af",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#9ca3af",
            },
          },
        },
      },
    });
  }

  processTimelineData(events, period) {
    const now = new Date();
    let intervals, formatFn, filterFn;

    switch (period) {
      case "24h":
        intervals = 24;
        formatFn = (date) => `${date.getHours()}:00`;
        filterFn = (date) => now - date < 24 * 60 * 60 * 1000;
        break;
      case "7d":
        intervals = 7;
        formatFn = (date) =>
          date.toLocaleDateString("en", { weekday: "short" });
        filterFn = (date) => now - date < 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        intervals = 30;
        formatFn = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
        filterFn = (date) => now - date < 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        intervals = 24;
        formatFn = (date) => `${date.getHours()}:00`;
        filterFn = (date) => now - date < 24 * 60 * 60 * 1000;
    }

    // Initialize data structure
    const timeData = {};
    const labels = [];

    // Create time slots
    for (let i = intervals - 1; i >= 0; i--) {
      let date;
      if (period === "24h") {
        date = new Date(now.getTime() - i * 60 * 60 * 1000);
      } else if (period === "7d") {
        date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      } else {
        date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      }

      const label = formatFn(date);
      labels.push(label);
      timeData[label] = 0;
    }

    // Count events in each time slot
    events
      .filter((event) => filterFn(new Date(event.timestamp)))
      .forEach((event) => {
        const eventDate = new Date(event.timestamp);
        const label = formatFn(eventDate);
        if (timeData.hasOwnProperty(label)) {
          timeData[label]++;
        }
      });

    return {
      labels,
      data: Object.values(timeData),
    };
  }

  updateActivityChart(period) {
    this.createActivityTimelineChart(period);
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

    this.charts.pagePerformance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: pageData.map((p) => p.page),
        datasets: [
          {
            label: "Avg Time (seconds)",
            data: pageData.map((p) => p.avgTime),
            backgroundColor: "rgba(16, 185, 129, 0.8)",
            borderColor: "#10b981",
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#9ca3af",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#9ca3af",
            },
          },
        },
      },
    });
  }

  createBookCategoriesChart() {
    // Generate realistic book category data for a bookstore
    const bookCategories = [
      { name: "Fiction", sales: 1247, color: "#3b82f6" },
      { name: "Non-Fiction", sales: 892, color: "#10b981" },
      { name: "Science Fiction", sales: 634, color: "#8b5cf6" },
      { name: "Romance", sales: 578, color: "#f59e0b" },
      { name: "Mystery", sales: 423, color: "#ef4444" },
      { name: "Biography", sales: 387, color: "#06b6d4" },
      { name: "Children's", sales: 356, color: "#84cc16" },
      { name: "Academic", sales: 298, color: "#f97316" },
      { name: "Self-Help", sales: 245, color: "#ec4899" },
      { name: "History", sales: 198, color: "#6366f1" },
      { name: "Art", sales: 167, color: "#14b8a6" },
      { name: "Cooking", sales: 134, color: "#eab308" },
    ];

    const ctx = document
      .getElementById("book-categories-chart")
      .getContext("2d");

    this.charts.bookCategories = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: bookCategories.map((cat) => cat.name),
        datasets: [
          {
            data: bookCategories.map((cat) => cat.sales),
            backgroundColor: bookCategories.map((cat) => cat.color),
            borderColor: bookCategories.map((cat) => cat.color),
            borderWidth: 2,
            hoverBorderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            display: false, // We'll create a custom legend
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} sales (${percentage}%)`;
              },
            },
          },
        },
        onHover: (event, activeElements) => {
          event.native.target.style.cursor =
            activeElements.length > 0 ? "pointer" : "default";
        },
      },
    });

    // Create custom legend
    this.createBookCategoriesLegend(bookCategories);
  }

  createBookCategoriesLegend(categories) {
    const legend = document.getElementById("book-categories-legend");

    if (!legend) {
      console.error("Legend container not found");
      return;
    }

    // Calculate total sales for percentages
    const totalSales = categories.reduce((sum, cat) => sum + cat.sales, 0);

    legend.innerHTML = categories
      .slice(0, 6)
      .map((cat) => {
        const percentage = ((cat.sales / totalSales) * 100).toFixed(1);
        return `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${cat.color}"></div>
          <span class="legend-label">${cat.name}</span>
          <span class="legend-value">${percentage}%</span>
        </div>
      `;
      })
      .join("");
  }

  startRealTimeUpdates() {
    // Update real-time events every 3 seconds
    this.realTimeUpdateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateRealTimeEvents();
      }
    }, 3000);

    // Update metrics every 30 seconds
    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Initial update
    this.updateRealTimeEvents();
  }

  toggleRealTimeUpdates() {
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById("pause-realtime");
    if (pauseBtn) {
      const icon = pauseBtn.querySelector("i");
      if (this.isPaused) {
        icon.setAttribute("data-feather", "play");
        pauseBtn.title = "Resume updates";
      } else {
        icon.setAttribute("data-feather", "pause");
        pauseBtn.title = "Pause updates";
      }
      feather.replace();
    }
  }

  refreshData() {
    // Add visual feedback
    const refreshBtn = document.getElementById("refresh-data");
    if (refreshBtn) {
      refreshBtn.classList.add("spinning");
      setTimeout(() => {
        refreshBtn.classList.remove("spinning");
      }, 1000);
    }

    // Refresh all data
    this.updateMetrics();
    this.updateRealTimeEvents();

    // Recreate charts with new data
    Object.values(this.charts).forEach((chart) => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
    this.charts = {};
    this.createCharts();
  }

  clearEvents() {
    const eventsContainer = document.getElementById("realtime-events");
    if (eventsContainer) {
      eventsContainer.innerHTML =
        '<div class="no-events">No recent events</div>';
    }
  }

  updateRealTimeEvents() {
    const data = SimpleAnalytics.getAnalyticsData();
    const recentEvents = (data.historical || [])
      .filter((e) => Date.now() - e.timestamp < 5 * 60 * 1000) // Last 5 minutes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);

    const eventsContainer = document.getElementById("realtime-events");
    if (!eventsContainer) return;

    if (recentEvents.length === 0) {
      eventsContainer.innerHTML = `
        <div class="no-events" style="text-align: center; color: #6b7280; padding: 40px;">
          <i data-feather="activity" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
          <div>No recent activity</div>
        </div>
      `;
      feather.replace();
      return;
    }

    eventsContainer.innerHTML = recentEvents
      .map((event) => {
        const time = new Date(event.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `
        <div class="event-item">
          <span class="event-time">${time}</span>
          <span class="event-type ${event.type}">${event.type.replace(
          "_",
          " "
        )}</span>
          <span class="event-description">${this.getEventDescription(
            event
          )}</span>
        </div>
      `;
      })
      .join("");
  }

  getEventDescription(event) {
    switch (event.type) {
      case "click":
        return `Clicked: ${event.text?.substring(0, 40) || "Element"}`;
      case "page_view":
        const path = new URL(event.url).pathname;
        const pageName = path.split("/").pop() || "Home";
        return `Viewed: ${pageName}`;
      case "scroll_depth":
        return `Scrolled to ${event.depth}%`;
      case "page_end":
        return `Left page after ${Math.round((event.timeOnPage || 0) / 1000)}s`;
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
