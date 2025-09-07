import { SimpleAnalytics } from "../shared/analytics.js";

class ProductDiscoveryDashboard {
  constructor() {
    this.charts = {};
    this.realTimeUpdateInterval = null;
    this.metricsUpdateInterval = null;
    this.isPaused = false;
    this.categoryData = {};
    this.searchData = {};
    this.currentTimePeriod = "24h"; // Track current time period

    this.initDashboard();
    this.updateMetrics();
    this.createCharts();
    this.createMiniCharts();
    this.startRealTimeUpdates();
    this.initEventHandlers();
    this.loadCategoryAnalytics();
  }

  initDashboard() {
    // Initialize category performance tracking
    this.initCategoryTracking();
    // Initialize time filters
    this.initTimeFilters();
    // Initialize control buttons
    this.initControlButtons();
    // Initialize real-time data sync with management page
    this.initDataSync();
  }

  initDataSync() {
    // Listen for data updates from management page
    window.addEventListener("message", (event) => {
      if (event.data.type === "productDiscoveryUpdate") {
        this.handleDataUpdate(event.data.data);
      }
    });

    // Load initial data from localStorage
    this.loadStoredData();
  }

  loadStoredData() {
    const stored = localStorage.getItem("product_discovery_data");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.handleDataUpdate(data);
      } catch (error) {
        console.error("Error loading stored data:", error);
      }
    }
  }

  handleDataUpdate(data) {
    // Update internal data
    this.productDiscoveryData = data;

    // If data is empty, ensure it's properly structured
    if (!data || Object.keys(data).length === 0) {
      this.productDiscoveryData = {
        categoryClicks: 0,
        productClicks: 0,
        searchQueries: 0,
        cartAdditions: 0,
        homepageVisits: 0,
        sidebarClicks: 0,
        headerClicks: 0,
        dailyDiscoveryActions: [],
        categoryPerformance: [],
      };
    }

    // Check if all data is zero (data cleared)
    const isDataCleared =
      this.productDiscoveryData.categoryClicks === 0 &&
      this.productDiscoveryData.productClicks === 0 &&
      this.productDiscoveryData.searchQueries === 0 &&
      this.productDiscoveryData.cartAdditions === 0;

    // Update metrics immediately
    this.updateMetricsFromRealData();

    // Update all charts if they exist
    this.updateAllCharts();

    // Update category performance
    this.updateTopCategoriesList(
      this.generateCategoryList(this.productDiscoveryData)
    );

    // Update real-time events immediately to show cleared state
    this.updateRealTimeEvents();

    // Notify management page
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "dashboardMetricsUpdate" }, "*");
    }
  }

  updateMetricsFromRealData() {
    if (!this.productDiscoveryData) {
      // Initialize with empty data when no data exists
      this.productDiscoveryData = {};
    }

    const data = this.productDiscoveryData;
    const hasData =
      data.categoryClicks > 0 ||
      data.productClicks > 0 ||
      data.searchQueries > 0;

    // Update metric cards with real data
    this.updateMetricValue("category-clicks", data.categoryClicks || 0);
    this.updateMetricValue("product-clicks", data.productClicks || 0);
    this.updateMetricValue("search-queries", data.searchQueries || 0);

    // Update trend percentages
    if (!hasData) {
      // Set all trends to 0% when no data
      this.updateMetricValue("category-clicks-trend", "0.0%");
      this.updateMetricValue("product-clicks-trend", "0.0%");
      this.updateMetricValue("search-queries-trend", "0.0%");
      this.updateMetricValue("add-to-cart-trend", "0.0%");
    } else {
      // Calculate realistic trend percentages based on data
      const categoryTrend = Math.min(
        Math.max(data.categoryClicks / 100, 5),
        25
      ).toFixed(1);
      const productTrend = Math.min(
        Math.max(data.productClicks / 100, 3),
        20
      ).toFixed(1);
      const searchTrend = Math.min(
        Math.max(data.searchQueries / 50, 8),
        30
      ).toFixed(1);
      const cartTrend = Math.min(
        Math.max((data.cartAdditions || 0) / 50, 2),
        15
      ).toFixed(1);

      this.updateMetricValue("category-clicks-trend", `+${categoryTrend}%`);
      this.updateMetricValue("product-clicks-trend", `+${productTrend}%`);
      this.updateMetricValue("search-queries-trend", `+${searchTrend}%`);
      this.updateMetricValue("add-to-cart-trend", `+${cartTrend}%`);
    }

    // Calculate add to cart rate
    const cartRate =
      data.productClicks > 0
        ? (((data.cartAdditions || 0) / data.productClicks) * 100).toFixed(1)
        : "0.0";
    this.updateMetricValue("add-to-cart-rate", `${cartRate}%`);

    // Calculate homepage conversion rate
    const homepageConversion =
      data.homepageVisits > 0
        ? (((data.cartAdditions || 0) / data.homepageVisits) * 100).toFixed(1)
        : "0.0";
    this.updateMetricValue("homepage-conversion", `${homepageConversion}%`);

    // Update funnel with real data
    this.updateHomepageFunnelWithRealData(data);
  }

  updateHomepageFunnelWithRealData(data) {
    // Check if we have any real data
    const hasRealData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    const homepageVisits = hasRealData ? data.homepageVisits || 4000 : 0;
    const categoryNavigation = data.categoryClicks || 0;
    const productViews = data.productClicks || 0;
    const cartAdditions = data.cartAdditions || 0;

    this.updateMetricValue("funnel-homepage", homepageVisits.toLocaleString());
    this.updateMetricValue(
      "funnel-categories",
      categoryNavigation.toLocaleString()
    );
    this.updateMetricValue("funnel-products", productViews.toLocaleString());
    this.updateMetricValue("funnel-cart-adds", cartAdditions.toLocaleString());

    // Calculate conversion percentages
    const categoryPercent = (
      (categoryNavigation / homepageVisits) *
      100
    ).toFixed(1);
    const productPercent = ((productViews / homepageVisits) * 100).toFixed(1);
    const cartPercent = ((cartAdditions / homepageVisits) * 100).toFixed(1);

    this.updateMetricValue("funnel-categories-percent", `${categoryPercent}%`);
    this.updateMetricValue("funnel-products-percent", `${productPercent}%`);
    this.updateMetricValue("funnel-cart-adds-percent", `${cartPercent}%`);

    // Update visual funnel bars
    this.updateFunnelBar("funnel-homepage-bar", 100);
    this.updateFunnelBar("funnel-categories-bar", parseFloat(categoryPercent));
    this.updateFunnelBar("funnel-products-bar", parseFloat(productPercent));
    this.updateFunnelBar("funnel-cart-adds-bar", parseFloat(cartPercent));
  }

  generateCategoryList(data) {
    if (data && data.categoryPerformance) {
      return Object.entries(data.categoryPerformance)
        .map(([name, clicks]) => ({ name, clicks, trend: "+15%" }))
        .sort((a, b) => b.clicks - a.clicks);
    }

    // Check if we have any real data at all
    const hasRealData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    if (!hasRealData) {
      // Return categories with zero clicks when no data exists
      return [
        {
          name: "Fiction",
          clicks: 0,
          trend: "0%",
        },
        {
          name: "Romance",
          clicks: 0,
          trend: "0%",
        },
        {
          name: "Mystery",
          clicks: 0,
          trend: "0%",
        },
      ];
    }

    // Generate realistic data based on total category clicks
    const totalClicks = data.categoryClicks || 0;
    return [
      {
        name: "Fiction",
        clicks: Math.round(totalClicks * 0.4),
        trend: "+18%",
      },
      {
        name: "Romance",
        clicks: Math.round(totalClicks * 0.35),
        trend: "+12%",
      },
      {
        name: "Mystery",
        clicks: Math.round(totalClicks * 0.25),
        trend: "+8%",
      },
    ];
  }

  updateCategoryClicksChart() {
    if (!this.charts.categoryClicks) return;

    const data = this.productDiscoveryData;
    const hasData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    if (!hasData) {
      // Clear chart data when no data exists
      this.clearChartData(this.charts.categoryClicks);
    } else {
      // Update with real data if available
      this.updateChartWithRealData(this.charts.categoryClicks, data);
    }
  }

  clearChartData(chart) {
    // Set all data points to 0
    chart.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.map(() => 0);
    });
    chart.update();
  }

  updateChartWithRealData(chart, data) {
    // Update chart with real category performance data
    if (data.categoryPerformance) {
      const categories = [
        "Fiction",
        "Romance",
        "Mystery",
        "Sci-Fi",
        "Non-Fiction",
      ];
      chart.data.datasets.forEach((dataset, index) => {
        const categoryName = categories[index];
        let categoryValue = 0;

        // Use actual category performance data if available
        if (categoryName === "Sci-Fi") {
          categoryValue = data.categoryPerformance["Science Fiction"] || 0;
        } else if (categoryName === "Non-Fiction") {
          categoryValue = data.categoryPerformance["Young Adult"] || 0;
        } else {
          categoryValue = data.categoryPerformance[categoryName] || 0;
        }

        // Generate unique realistic trend data for each category using current time period
        dataset.data = this.generateCategorySpecificTrendData(
          categoryValue,
          index,
          this.currentTimePeriod
        );
      });
    } else {
      // No specific category data, use overall metrics with category-specific patterns
      chart.data.datasets.forEach((dataset, index) => {
        const categoryValue = data.categoryClicks / chart.data.datasets.length;
        dataset.data = this.generateCategorySpecificTrendData(
          categoryValue,
          index,
          this.currentTimePeriod
        );
      });
    }
    chart.update();
  }

  generateRealisticTrendData(totalValue) {
    // Generate 24 hours of data that adds up to totalValue
    const hours = 24;
    const data = [];

    if (totalValue === 0) {
      return Array(hours).fill(0);
    }

    // Create realistic hourly distribution
    for (let i = 0; i < hours; i++) {
      const hourlyRatio = this.getHourlyTrafficRatio(i);
      const hourlyValue = Math.round(totalValue * hourlyRatio * 0.1); // Scale down for hourly display
      data.push(Math.max(0, hourlyValue));
    }

    return data;
  }

  getHourlyTrafficRatio(hour) {
    // Realistic traffic pattern (higher during day, lower at night)
    const patterns = [
      0.2,
      0.1,
      0.05,
      0.05,
      0.1,
      0.2,
      0.4,
      0.6, // 0-7 AM
      0.8,
      1.0,
      1.2,
      1.4,
      1.6,
      1.8,
      1.6,
      1.4, // 8-15 PM
      1.2,
      1.0,
      0.8,
      0.6,
      0.4,
      0.3,
      0.25,
      0.2, // 16-23 PM
    ];
    return patterns[hour] || 0.5;
  }

  generateCategorySpecificTrendData(totalValue, categoryIndex, period = "24h") {
    // Get time info for the selected period
    const timeInfo = this.getTimeInfoForPeriod(period);
    const data = [];

    if (totalValue === 0) {
      return Array(timeInfo.points).fill(0);
    }

    // Different reading/browsing patterns for different categories
    const categoryPatterns = {
      0: {
        // Fiction - popular throughout the day, peaks in evening
        baseMultiplier: 1.0,
        peakHours: [19, 20, 21],
        lowHours: [3, 4, 5],
        variance: 0.3,
      },
      1: {
        // Romance - popular in evening and late night
        baseMultiplier: 0.8,
        peakHours: [21, 22, 23],
        lowHours: [6, 7, 8],
        variance: 0.4,
      },
      2: {
        // Mystery - consistent throughout day, slight evening peak
        baseMultiplier: 0.9,
        peakHours: [18, 19],
        lowHours: [4, 5],
        variance: 0.2,
      },
      3: {
        // Sci-Fi - afternoon and evening preference
        baseMultiplier: 0.7,
        peakHours: [16, 17, 18],
        lowHours: [2, 3, 4],
        variance: 0.35,
      },
      4: {
        // Non-Fiction - business hours preference
        baseMultiplier: 0.6,
        peakHours: [10, 11, 14, 15],
        lowHours: [0, 1, 23],
        variance: 0.25,
      },
    };

    const pattern = categoryPatterns[categoryIndex] || categoryPatterns[0];

    // Create realistic distribution based on time period
    for (let i = 0; i < timeInfo.points; i++) {
      let ratio = 1.0;

      if (timeInfo.format === "hour") {
        // Use hourly traffic pattern for 24h view
        ratio = this.getHourlyTrafficRatio(i);

        // Apply category-specific modifications
        if (pattern.peakHours.includes(i)) {
          ratio *= 1.5 + Math.random() * 0.5; // 50-100% boost during peak hours
        }

        if (pattern.lowHours.includes(i)) {
          ratio *= 0.3 + Math.random() * 0.2; // Reduce to 30-50% during low hours
        }
      } else {
        // Use daily pattern for 7d/30d view
        ratio = this.getDailyTrafficRatio(i, timeInfo.points, categoryIndex);
      }

      // Apply base multiplier and add variance
      ratio *= pattern.baseMultiplier;
      ratio *= 1 + (Math.random() - 0.5) * pattern.variance;

      const value = Math.round(
        totalValue *
          ratio *
          (timeInfo.format === "hour" ? 0.1 : 1.0 / timeInfo.points)
      );
      data.push(Math.max(0, value));
    }

    return data;
  }

  getDailyTrafficRatio(dayIndex, totalDays, categoryIndex) {
    // Generate different patterns for different time ranges and categories
    if (totalDays === 7) {
      // Weekly pattern - weekends vs weekdays vary by category
      const isWeekend = dayIndex === 0 || dayIndex === 6; // Sunday or Saturday
      const weekendMultipliers = [1.3, 1.5, 1.1, 0.8, 0.6]; // Fiction, Romance, Mystery, Sci-Fi, Non-Fiction
      const weekdayMultipliers = [1.0, 0.8, 1.0, 1.2, 1.4];

      return isWeekend
        ? weekendMultipliers[categoryIndex] || 1.0
        : weekdayMultipliers[categoryIndex] || 1.0;
    } else {
      // Monthly pattern - slight variation with growth trends
      const trendFactor = 1 + (dayIndex / totalDays) * 0.3; // 30% growth over period
      const randomVariation = 0.8 + Math.random() * 0.4; // ±20% variation
      return trendFactor * randomVariation;
    }
  }

  getTimeInfoForPeriod(period) {
    switch (period) {
      case "24h":
        return { points: 24, format: "hour" };
      case "7d":
        return { points: 7, format: "day" };
      case "30d":
        return { points: 30, format: "day" };
      default:
        return { points: 24, format: "hour" };
    }
  }

  generateTimeLabels(count, format) {
    const labels = [];
    const now = new Date();

    if (format === "hour") {
      // Generate hour labels for 24h view
      for (let i = count - 1; i >= 0; i--) {
        const time = new Date(now - i * 60 * 60 * 1000);
        labels.push(
          time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      }
    } else if (format === "day") {
      // Generate day labels for 7d or 30d view
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        if (count <= 7) {
          // Show full day names for 7 days
          labels.push(date.toLocaleDateString([], { weekday: "short" }));
        } else {
          // Show month/day for 30 days
          labels.push(
            date.toLocaleDateString([], { month: "short", day: "numeric" })
          );
        }
      }
    }

    return labels;
  }

  updateAllCharts() {
    // Update all charts when data changes
    if (this.charts.categoryClicks) {
      this.updateCategoryClicksChart();
    }

    if (this.charts.searchConversion) {
      this.updateSearchConversionChart();
    }

    if (this.charts.bookCategories) {
      this.updateBookCategoriesChart();
    }

    if (this.charts.discoveryHeatmap) {
      this.updateDiscoveryHeatmapChart();
    }

    // Update mini charts as well
    this.updateMiniCharts();
  }

  updateMiniCharts() {
    const data = this.productDiscoveryData;
    const hasData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    if (!hasData) {
      // Clear mini chart data
      this.clearMiniChartsData();
    } else {
      // Update mini charts with real trend data
      this.updateMiniChartsWithRealData(data);
    }
  }

  clearMiniChartsData() {
    const miniChartIds = [
      "category-clicks-mini-chart",
      "product-clicks-mini-chart",
      "search-mini-chart",
      "cart-rate-mini-chart",
    ];

    miniChartIds.forEach((chartId) => {
      const canvas = document.getElementById(chartId);
      if (canvas && canvas.chart) {
        canvas.chart.data.datasets[0].data = Array(12).fill(0);
        canvas.chart.update();
      }
    });
  }

  updateMiniChartsWithRealData(data) {
    // Update mini charts with realistic data based on current metrics
    this.updateSingleMiniChart(
      "category-clicks-mini-chart",
      data.categoryClicks || 0
    );
    this.updateSingleMiniChart(
      "product-clicks-mini-chart",
      data.productClicks || 0
    );
    this.updateSingleMiniChart("search-mini-chart", data.searchQueries || 0);

    const cartRate =
      data.productClicks > 0
        ? ((data.cartAdditions || 0) / data.productClicks) * 100
        : 0;
    this.updateSingleMiniChart("cart-rate-mini-chart", cartRate);
  }

  updateSingleMiniChart(chartId, value) {
    const canvas = document.getElementById(chartId);
    if (canvas && canvas.chart) {
      if (value === 0) {
        canvas.chart.data.datasets[0].data = Array(12).fill(0);
      } else {
        canvas.chart.data.datasets[0].data = this.generateMiniTrendData(value);
      }
      canvas.chart.update();
    }
  }

  generateMiniTrendData(baseValue) {
    // Generate 12 data points with realistic variation
    const data = [];
    let currentValue = Math.max(1, baseValue * 0.8);

    for (let i = 0; i < 12; i++) {
      const variation = (Math.random() - 0.5) * baseValue * 0.3;
      currentValue = Math.max(0, currentValue + variation);
      data.push(Math.round(currentValue));
    }

    return data;
  }

  updateSearchConversionChart() {
    if (!this.charts.searchConversion) return;

    const data = this.productDiscoveryData;
    const hasData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    if (!hasData) {
      // Clear chart data when no data exists
      this.clearBarChartData(this.charts.searchConversion);
    } else {
      // Update with real data
      this.updateSearchConversionWithRealData(
        this.charts.searchConversion,
        data
      );
    }
  }

  updateBookCategoriesChart() {
    if (!this.charts.bookCategories) return;

    const data = this.productDiscoveryData;
    const hasData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    if (!hasData) {
      // Clear chart data when no data exists
      this.clearPieChartData(this.charts.bookCategories);
    } else {
      // Update with real data
      this.updateBookCategoriesWithRealData(this.charts.bookCategories, data);
    }
  }

  updateDiscoveryHeatmapChart() {
    if (!this.charts.discoveryHeatmap) return;

    const data = this.productDiscoveryData;
    const hasData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    if (!hasData) {
      // Clear chart data when no data exists
      this.clearScatterChartData(this.charts.discoveryHeatmap);
    } else {
      // Update with real data
      this.updateDiscoveryHeatmapWithRealData(
        this.charts.discoveryHeatmap,
        data
      );
    }
  }

  clearBarChartData(chart) {
    chart.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.map(() => 0);
    });
    chart.update();
  }

  clearPieChartData(chart) {
    chart.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.map(() => 0);
    });
    chart.update();
  }

  clearScatterChartData(chart) {
    chart.data.datasets.forEach((dataset) => {
      dataset.data = [];
    });
    chart.update();
  }

  updateSearchConversionWithRealData(chart, data) {
    const searchQueries = data.searchQueries || 0;
    const clicksFromSearch = Math.round(searchQueries * 0.7); // 70% click rate
    const addToCart = Math.round(clicksFromSearch * 0.15); // 15% add to cart
    const purchases = Math.round(addToCart * 0.6); // 60% purchase conversion

    chart.data.datasets[0].data = [
      searchQueries,
      clicksFromSearch,
      addToCart,
      purchases,
    ];
    chart.update();
  }

  updateBookCategoriesWithRealData(chart, data) {
    if (data.categoryPerformance) {
      const categories = Object.keys(data.categoryPerformance);
      const values = Object.values(data.categoryPerformance);
      chart.data.datasets[0].data = values;
    } else {
      // Distribute total category clicks among categories
      const totalClicks = data.categoryClicks || 0;
      chart.data.datasets[0].data = [
        Math.round(totalClicks * 0.3), // Fiction
        Math.round(totalClicks * 0.25), // Romance
        Math.round(totalClicks * 0.2), // Mystery
        Math.round(totalClicks * 0.15), // Sci-Fi
        Math.round(totalClicks * 0.1), // Non-Fiction
      ];
    }
    chart.update();
  }

  updateDiscoveryHeatmapWithRealData(chart, data) {
    const totalInteractions =
      (data.categoryClicks || 0) + (data.productClicks || 0);

    if (totalInteractions === 0) {
      chart.data.datasets[0].data = [];
    } else {
      // Generate realistic heatmap data based on interactions
      const heatmapData = [];
      for (let i = 0; i < Math.min(totalInteractions, 50); i++) {
        heatmapData.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          r: Math.random() * 10 + 5,
        });
      }
      chart.data.datasets[0].data = heatmapData;
    }
    chart.update();
  }

  initEventHandlers() {
    // Refresh button with improved feedback
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

    // Export button functionality
    const exportBtn = document.querySelector(".export-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportData();
      });
    }

    // Auto-refresh every 30 seconds
    this.startAutoRefresh();
  }

  refreshData() {
    const refreshBtn = document.getElementById("refresh-data");

    try {
      // Add loading state to refresh button
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.classList.add("spinning");
        const icon = refreshBtn.querySelector("i");
        if (icon) {
          icon.style.animation = "spin 1s linear infinite";
        }
      }

      // Update all metrics
      this.updateMetrics();

      // Update charts
      this.updateAllCharts();

      // Show success message
      this.showUpdateStatus("success", "Dashboard refreshed");
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      this.showUpdateStatus("error", "Failed to refresh dashboard");
    } finally {
      // Remove loading state
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.classList.remove("spinning");
        const icon = refreshBtn.querySelector("i");
        if (icon) {
          icon.style.animation = "";
        }
      }
    }
  }

  exportData() {
    try {
      const data = SimpleAnalytics.getAnalyticsData();
      const exportData = {
        timestamp: new Date().toISOString(),
        summary: data.summary,
        events: data.historical,
        exportedBy: "BooksProject Dashboard",
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showUpdateStatus("success", "Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      this.showUpdateStatus("error", "Failed to export data");
    }
  }

  startAutoRefresh() {
    // Auto-refresh every 30 seconds
    this.autoRefreshInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateMetrics();
      }
    }, 30000);
  }

  updateAllCharts() {
    try {
      // Update all chart data
      Object.keys(this.charts).forEach((chartKey) => {
        const chart = this.charts[chartKey];
        if (chart && typeof chart.update === "function") {
          chart.update();
        }
      });
    } catch (error) {
      console.error("Error updating charts:", error);
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

        // Update current time period and charts based on selected period
        const period = e.target.dataset.period;
        this.currentTimePeriod = period;
        this.updateActivityChart(period);

        // Also update category clicks chart with new time period
        this.createCategoryClicksChart(period);
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
    try {
      // Get both real analytics data and generate product discovery metrics
      const realData = SimpleAnalytics.getAnalyticsData();
      const productMetrics = this.generateProductDiscoveryMetrics();

      console.log("Analytics data:", realData);
      console.log("Product Discovery Metrics:", productMetrics);

      // Update summary cards with product discovery focus
      this.updateMetricValue("category-clicks", productMetrics.categoryClicks);
      this.updateMetricValue("product-clicks", productMetrics.productClicks);
      this.updateMetricValue("search-queries", productMetrics.searchQueries);
      this.updateMetricValue(
        "add-to-cart-rate",
        `${productMetrics.addToCartRate}%`
      );

      // Update conversion funnel with homepage focus
      this.updateHomepageFunnel(productMetrics);

      // Update homepage conversion rate
      this.updateMetricValue(
        "homepage-conversion",
        `${productMetrics.homepageConversion}%`
      );

      // Update category performance
      this.updateCategoryPerformance(productMetrics);

      // Update last refreshed time
      this.updateLastRefreshTime();

      // Show success indicator
      this.showUpdateStatus(
        "success",
        "Product discovery data updated successfully"
      );
    } catch (error) {
      console.error("Error updating metrics:", error);
      this.showUpdateStatus("error", "Failed to update metrics");

      // Show fallback data
      this.showFallbackData();
    }
  }

  generateProductDiscoveryMetrics() {
    // Use real data if available, otherwise generate mock data
    if (this.productDiscoveryData) {
      const hasAnyData =
        this.productDiscoveryData.categoryClicks > 0 ||
        this.productDiscoveryData.productClicks > 0 ||
        this.productDiscoveryData.searchQueries > 0;

      // Calculate homepage visits intelligently based on other metrics
      let homepageVisits = this.productDiscoveryData.homepageVisits || 0;
      if (hasAnyData && homepageVisits === 0) {
        // Estimate homepage visits based on total interactions
        const totalInteractions =
          (this.productDiscoveryData.categoryClicks || 0) +
          (this.productDiscoveryData.productClicks || 0) +
          (this.productDiscoveryData.searchQueries || 0);
        homepageVisits = Math.max(totalInteractions * 2, 1000); // Assume 2x traffic than interactions
      }

      return {
        categoryClicks: this.productDiscoveryData.categoryClicks || 0,
        productClicks: this.productDiscoveryData.productClicks || 0,
        searchQueries: this.productDiscoveryData.searchQueries || 0,
        addToCartRate:
          this.productDiscoveryData.productClicks > 0
            ? (
                ((this.productDiscoveryData.cartAdditions || 0) /
                  this.productDiscoveryData.productClicks) *
                100
              ).toFixed(1)
            : "0.0",
        homepageConversion:
          homepageVisits > 0
            ? (
                ((this.productDiscoveryData.cartAdditions || 0) /
                  homepageVisits) *
                100
              ).toFixed(1)
            : "0.0",
        homepageVisits: homepageVisits,
        categoryNavigation: this.productDiscoveryData.categoryClicks || 0,
        productViews: this.productDiscoveryData.productClicks || 0,
        cartAdditions: this.productDiscoveryData.cartAdditions || 0,
      };
    }

    // Return zero metrics when no real data exists (no fallback random data)
    return {
      categoryClicks: 0,
      productClicks: 0,
      searchQueries: 0,
      addToCartRate: "0.0",
      homepageConversion: "0.0",
      homepageVisits: 0,
      categoryNavigation: 0,
      productViews: 0,
      cartAdditions: 0,
    };
  }

  updateHomepageFunnel(metrics) {
    // Update homepage-specific funnel metrics
    this.updateMetricValue(
      "funnel-homepage",
      metrics.homepageVisits.toLocaleString()
    );
    this.updateMetricValue(
      "funnel-categories",
      metrics.categoryNavigation.toLocaleString()
    );
    this.updateMetricValue(
      "funnel-products",
      metrics.productViews.toLocaleString()
    );
    this.updateMetricValue(
      "funnel-cart-adds",
      metrics.cartAdditions.toLocaleString()
    );

    // Calculate conversion percentages
    const categoryPercent = (
      (metrics.categoryNavigation / metrics.homepageVisits) *
      100
    ).toFixed(1);
    const productPercent = (
      (metrics.productViews / metrics.homepageVisits) *
      100
    ).toFixed(1);
    const cartPercent = (
      (metrics.cartAdditions / metrics.homepageVisits) *
      100
    ).toFixed(1);

    this.updateMetricValue("funnel-categories-percent", `${categoryPercent}%`);
    this.updateMetricValue("funnel-products-percent", `${productPercent}%`);
    this.updateMetricValue("funnel-cart-adds-percent", `${cartPercent}%`);

    // Update visual funnel bars
    this.updateFunnelBar("funnel-homepage-bar", 100);
    this.updateFunnelBar("funnel-categories-bar", parseFloat(categoryPercent));
    this.updateFunnelBar("funnel-products-bar", parseFloat(productPercent));
    this.updateFunnelBar("funnel-cart-adds-bar", parseFloat(cartPercent));
  }

  updateFunnelBar(barId, percentage) {
    const bar = document.getElementById(barId);
    if (bar) {
      bar.style.width = `${Math.max(5, percentage)}%`;
      bar.style.opacity = percentage > 0 ? "1" : "0.3";
    }
  }

  updateCategoryPerformance(metrics) {
    // Update category-specific performance metrics using real data
    const hasRealData =
      this.productDiscoveryData &&
      (this.productDiscoveryData.categoryClicks > 0 ||
        this.productDiscoveryData.productClicks > 0 ||
        this.productDiscoveryData.searchQueries > 0);

    if (!hasRealData) {
      // Use zero values when no real data
      this.updateMetricValue("category-product-ctr", "0.0%");
      this.updateMetricValue("search-click-success", "0.0%");
      this.updateMetricValue("sidebar-header-usage", "0% / 0%");
      this.updateMetricValue("avg-time-to-click", "0.0s");
    } else {
      // Calculate real CTR based on actual data
      const data = this.productDiscoveryData;
      const categoryProductCTR =
        data.productClicks > 0 && data.categoryClicks > 0
          ? ((data.productClicks / data.categoryClicks) * 100).toFixed(1)
          : "0.0";
      const searchClickSuccess =
        data.searchQueries > 0 && data.productClicks > 0
          ? ((data.productClicks / data.searchQueries) * 100).toFixed(1)
          : "0.0";

      // Calculate sidebar vs header usage based on actual clicks
      const sidebarClicks = parseInt(data.sidebarClicks) || 0;
      const headerClicks = parseInt(data.headerClicks) || 0;
      const totalNavClicks = sidebarClicks + headerClicks;

      const sidebarUsage =
        totalNavClicks > 0
          ? Math.round((sidebarClicks / totalNavClicks) * 100)
          : 0;
      const headerUsage =
        totalNavClicks > 0
          ? Math.round((headerClicks / totalNavClicks) * 100)
          : 0;

      // Calculate average time to click based on interaction volume
      const avgTime =
        data.categoryClicks > 0
          ? (10 + data.categoryClicks / 100).toFixed(1)
          : "0.0";

      this.updateMetricValue("category-product-ctr", `${categoryProductCTR}%`);
      this.updateMetricValue("search-click-success", `${searchClickSuccess}%`);
      this.updateMetricValue(
        "sidebar-header-usage",
        `${headerUsage}% / ${sidebarUsage}%`
      );
      this.updateMetricValue("avg-time-to-click", `${avgTime}s`);
    }

    // Update top categories if needed
    this.loadCategoryAnalytics();
  }

  loadCategoryAnalytics() {
    // Use real category data instead of generating random data
    const categories = this.generateCategoryList(this.productDiscoveryData);
    this.updateTopCategoriesList(categories);
  }

  updateTopCategoriesList(categories) {
    const container = document.getElementById("top-categories-list");
    if (container) {
      container.innerHTML = categories
        .slice(0, 3)
        .map(
          (category, index) => `
        <div class="rank-item">
          <span class="rank-number">${index + 1}</span>
          <span class="category-name">${category.name}</span>
          <span class="click-count">${category.clicks.toLocaleString()} clicks</span>
        </div>
      `
        )
        .join("");
    }
  }

  initCategoryTracking() {
    // Initialize category performance tracking
    this.categoryPerformance = {
      clickPatterns: new Map(),
      conversionRates: new Map(),
      searchSuccess: new Map(),
    };

    // Load initial category data
    this.loadCategoryAnalytics();
  }

  showUpdateStatus(type, message) {
    // Remove existing status
    const existingStatus = document.querySelector(".dashboard-status");
    if (existingStatus) {
      existingStatus.remove();
    }

    // Create status indicator
    const statusDiv = document.createElement("div");
    statusDiv.className = `dashboard-status dashboard-status-${type}`;
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10001;
      ${
        type === "error"
          ? "background: #f44336; color: white;"
          : "background: #4CAF50; color: white;"
      }
    `;
    statusDiv.textContent = message;

    document.body.appendChild(statusDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (statusDiv && statusDiv.parentNode) {
        statusDiv.remove();
      }
    }, 3000);
  }

  showFallbackData() {
    // Show reasonable fallback values
    this.updateMetricValue("total-pageviews", "No data");
    this.updateMetricValue("unique-sessions", "No data");
    this.updateMetricValue("total-clicks", "No data");
    this.updateMetricValue("avg-scroll", "No data");

    // Update overall conversion rate
    const conversionElement = document.getElementById("overall-conversion");
    if (conversionElement) {
      conversionElement.textContent = "N/A";
    }
  }

  updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const lastUpdated = document.getElementById("last-updated-time");
    if (lastUpdated) {
      lastUpdated.textContent = timeString;
    }
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
    this.createCategoryClicksChart();
    this.createSearchConversionChart();
    this.createBookCategoriesChart();
    this.createDiscoveryHeatmapChart();
  }

  createMiniCharts() {
    // Create mini sparkline charts for each product discovery metric card
    this.createMiniChart(
      "category-clicks-mini-chart",
      this.generateMiniData(),
      "#3b82f6"
    );
    this.createMiniChart(
      "product-clicks-mini-chart",
      this.generateMiniData(),
      "#10b981"
    );
    this.createMiniChart(
      "search-mini-chart",
      this.generateMiniData(),
      "#f59e0b"
    );
    this.createMiniChart(
      "cart-rate-mini-chart",
      this.generateMiniData(),
      "#8b5cf6"
    );
  }

  createMiniChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const chart = new Chart(ctx, {
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

    // Store chart reference on canvas for later updates
    canvas.chart = chart;
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

    // Sort data by value for better visualization
    const sortedEntries = Object.entries(eventTypes).sort(
      (a, b) => b[1] - a[1]
    );
    const sortedLabels = sortedEntries.map((entry) => {
      // Format labels for better display
      return entry[0]
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });
    const sortedValues = sortedEntries.map((entry) => entry[1]);

    const ctx = document.getElementById("event-types-chart").getContext("2d");
    this.charts.eventTypes = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedLabels,
        datasets: [
          {
            label: "Event Count",
            data: sortedValues,
            backgroundColor: [
              "rgba(239, 68, 68, 0.8)", // Red
              "rgba(59, 130, 246, 0.8)", // Blue
              "rgba(245, 158, 11, 0.8)", // Amber
              "rgba(16, 185, 129, 0.8)", // Emerald
              "rgba(139, 92, 246, 0.8)", // Violet
              "rgba(236, 72, 153, 0.8)", // Pink
            ],
            borderColor: [
              "#ef4444",
              "#3b82f6",
              "#f59e0b",
              "#10b981",
              "#8b5cf6",
              "#ec4899",
            ],
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
            hoverBackgroundColor: [
              "rgba(239, 68, 68, 1)",
              "rgba(59, 130, 246, 1)",
              "rgba(245, 158, 11, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(139, 92, 246, 1)",
              "rgba(236, 72, 153, 1)",
            ],
          },
        ],
      },
      options: {
        indexAxis: "y", // This makes it horizontal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function (context) {
                const total = sortedValues.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed.x / total) * 100).toFixed(
                  1
                );
                return `${context.parsed.x} events (${percentage}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              drawBorder: false,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 11,
                family: "'Inter', sans-serif",
              },
              stepSize: 1,
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.9)",
              font: {
                size: 12,
                family: "'Inter', sans-serif",
                weight: "500",
              },
              padding: 8,
            },
          },
        },
        layout: {
          padding: {
            left: 5,
            right: 5,
            top: 5,
            bottom: 5,
          },
        },
        animation: {
          duration: 1500,
          easing: "easeOutQuart",
        },
        barThickness: "flex",
        categoryPercentage: 0.9,
        barPercentage: 0.8,
      },
    });

    // Create custom legend for Event Types
    // Create custom legend for Event Types
    this.createEventTypesLegend(eventTypes);
  }

  createEventTypesLegend(eventTypes) {
    const legend = document.getElementById("event-legend");

    if (!legend) {
      console.error("Event legend container not found");
      return;
    }

    const colors = [
      "#ef4444",
      "#3b82f6",
      "#f59e0b",
      "#10b981",
      "#8b5cf6",
      "#ec4899",
    ];

    const total = Object.values(eventTypes).reduce(
      (sum, count) => sum + count,
      0
    );

    const sortedEntries = Object.entries(eventTypes).sort(
      (a, b) => b[1] - a[1]
    );

    legend.innerHTML = sortedEntries
      .map(([eventType, count], index) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        const color = colors[index % colors.length];

        // Format event type names for better display
        const displayName = eventType
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return `
          <div class="legend-item">
            <div class="legend-color" style="background-color: ${color}"></div>
            <span class="legend-label">${displayName}</span>
            <span class="legend-value">${percentage}%</span>
          </div>
        `;
      })
      .join("");
  }

  // Alternative: Polar Area Chart version (comment out horizontal bar version and uncomment this)
  /*
  createEventTypesChart() {
    const data = SimpleAnalytics.getAnalyticsData();
    const eventTypes = data.summary.eventTypes || {};

    // Sort data by value for better visualization
    const sortedEntries = Object.entries(eventTypes).sort((a, b) => b[1] - a[1]);
    const sortedLabels = sortedEntries.map(entry => entry[0]);
    const sortedValues = sortedEntries.map(entry => entry[1]);

    const ctx = document.getElementById("event-types-chart").getContext("2d");
    this.charts.eventTypes = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: sortedLabels,
        datasets: [
          {
            label: "Event Count",
            data: sortedValues,
            backgroundColor: [
              "rgba(239, 68, 68, 0.7)",   // Red
              "rgba(59, 130, 246, 0.7)",  // Blue  
              "rgba(245, 158, 11, 0.7)",  // Amber
              "rgba(16, 185, 129, 0.7)",  // Emerald
              "rgba(139, 92, 246, 0.7)",  // Violet
              "rgba(236, 72, 153, 0.7)",  // Pink
            ],
            borderColor: [
              "#ef4444",
              "#3b82f6", 
              "#f59e0b",
              "#10b981",
              "#8b5cf6",
              "#ec4899",
            ],
            borderWidth: 2,
            hoverBackgroundColor: [
              "rgba(239, 68, 68, 0.9)",
              "rgba(59, 130, 246, 0.9)",
              "rgba(245, 158, 11, 0.9)",
              "rgba(16, 185, 129, 0.9)",
              "rgba(139, 92, 246, 0.9)",
              "rgba(236, 72, 153, 0.9)",
            ],
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
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const total = sortedValues.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed.r / total) * 100).toFixed(1);
                return `${context.parsed.r} events (${percentage}%)`;
              }
            }
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            pointLabels: {
              color: "rgba(255, 255, 255, 0.9)",
              font: {
                size: 12,
                family: "'Inter', sans-serif",
                weight: '500',
              },
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 10,
                family: "'Inter', sans-serif",
              },
              backdropColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
        animation: {
          duration: 2000,
          easing: 'easeOutElastic',
        },
      },
    });

    // Create custom legend for Event Types
    this.createEventTypesLegend(eventTypes);
  }
  */

  // Alternative 2: Stacked Bar Chart with Time Progression (comment out others and uncomment this)
  /*
  createEventTypesChart() {
    const data = SimpleAnalytics.getAnalyticsData();
    const events = data.historical || [];
    
    // Group events by hour of day and type
    const hourlyData = {};
    const eventTypes = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      const type = event.type;
      
      if (!hourlyData[hour]) hourlyData[hour] = {};
      if (!hourlyData[hour][type]) hourlyData[hour][type] = 0;
      hourlyData[hour][type]++;
      
      if (!eventTypes[type]) eventTypes[type] = 0;
      eventTypes[type]++;
    });

    // Create labels for last 12 hours
    const now = new Date();
    const labels = [];
    for (let i = 11; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000).getHours();
      labels.push(`${hour}:00`);
    }

    const colors = [
      "#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"
    ];

    const datasets = Object.keys(eventTypes).map((type, index) => ({
      label: type.replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      data: labels.map((_, i) => {
        const hour = new Date(now.getTime() - (11-i) * 60 * 60 * 1000).getHours();
        return hourlyData[hour] ? (hourlyData[hour][type] || 0) : 0;
      }),
      backgroundColor: colors[index % colors.length] + '80', // 50% opacity
      borderColor: colors[index % colors.length],
      borderWidth: 1,
      borderRadius: 4,
    }));

    const ctx = document.getElementById("event-types-chart").getContext("2d");
    this.charts.eventTypes = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            cornerRadius: 8,
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              drawBorder: false,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 11,
                family: "'Inter', sans-serif",
              },
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              drawBorder: false,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 11,
                family: "'Inter', sans-serif",
              },
            },
          },
        },
        animation: {
          duration: 2000,
          easing: 'easeOutCubic',
        },
      },
    });

    // Create custom legend for Event Types
    this.createEventTypesLegend(eventTypes);
  }
  */

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
      { name: "Fiction", sales: 0, color: "#3b82f6" },
      { name: "Non-Fiction", sales: 0, color: "#10b981" },
      { name: "Science Fiction", sales: 0, color: "#8b5cf6" },
      { name: "Romance", sales: 0, color: "#f59e0b" },
      { name: "Mystery", sales: 0, color: "#ef4444" },
      { name: "Biography", sales: 0, color: "#06b6d4" },
      { name: "Children's", sales: 0, color: "#84cc16" },
      { name: "Academic", sales: 0, color: "#f97316" },
      { name: "Self-Help", sales: 0, color: "#ec4899" },
      { name: "History", sales: 0, color: "#6366f1" },
      { name: "Art", sales: 0, color: "#14b8a6" },
      { name: "Cooking", sales: 0, color: "#eab308" },
    ];

    // Use real data if available
    if (
      this.productDiscoveryData &&
      this.productDiscoveryData.categoryClicks > 0
    ) {
      // Use actual category performance data if available
      if (this.productDiscoveryData.categoryPerformance) {
        const categoryPerf = this.productDiscoveryData.categoryPerformance;

        // Map the real category data to our chart categories
        bookCategories.forEach((category) => {
          if (categoryPerf[category.name]) {
            category.sales = categoryPerf[category.name];
          } else if (
            category.name === "Science Fiction" &&
            categoryPerf["Science Fiction"]
          ) {
            category.sales = categoryPerf["Science Fiction"];
          } else if (
            category.name === "Non-Fiction" &&
            categoryPerf["Young Adult"]
          ) {
            // Use Young Adult data for Non-Fiction as fallback
            category.sales = categoryPerf["Young Adult"];
          }
        });
      } else {
        // Fallback to proportional distribution
        const totalClicks = this.productDiscoveryData.categoryClicks;
        bookCategories[0].sales = Math.round(totalClicks * 0.3); // Fiction
        bookCategories[1].sales = Math.round(totalClicks * 0.25); // Non-Fiction
        bookCategories[2].sales = Math.round(totalClicks * 0.2); // Science Fiction
        bookCategories[3].sales = Math.round(totalClicks * 0.15); // Romance
        bookCategories[4].sales = Math.round(totalClicks * 0.1); // Mystery
      }
    }

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

  // New Product Discovery Analytics Charts
  createCategoryClicksChart(period = "24h") {
    const ctx = document
      .getElementById("category-clicks-chart")
      .getContext("2d");

    // Destroy existing chart if it exists
    if (this.charts.categoryClicks) {
      this.charts.categoryClicks.destroy();
    }

    // Generate category click data over time based on period
    const timeInfo = this.getTimeInfoForPeriod(period);
    const labels = this.generateTimeLabels(timeInfo.points, timeInfo.format);
    const categories = [
      "Fiction",
      "Romance",
      "Mystery",
      "Sci-Fi",
      "Non-Fiction",
    ];
    const colors = ["#3b82f6", "#ef4444", "#8b5cf6", "#10b981", "#f59e0b"];

    // Start with zero data, update with real data if available
    const datasets = categories.map((category, index) => ({
      label: category,
      data: Array(timeInfo.points).fill(0), // Start with zeros
      borderColor: colors[index],
      backgroundColor: colors[index] + "20",
      tension: 0.4,
      fill: false,
    }));

    // If we have real data, update the datasets
    if (
      this.productDiscoveryData &&
      this.productDiscoveryData.categoryClicks > 0
    ) {
      datasets.forEach((dataset, index) => {
        const categoryName = categories[index];
        let categoryValue = 0;

        // Use actual category performance data if available
        if (this.productDiscoveryData.categoryPerformance) {
          if (categoryName === "Sci-Fi") {
            categoryValue =
              this.productDiscoveryData.categoryPerformance[
                "Science Fiction"
              ] || 0;
          } else if (categoryName === "Non-Fiction") {
            categoryValue =
              this.productDiscoveryData.categoryPerformance["Young Adult"] || 0;
          } else {
            categoryValue =
              this.productDiscoveryData.categoryPerformance[categoryName] || 0;
          }
        }

        // Fallback to equal distribution if no category performance data
        if (categoryValue === 0) {
          categoryValue =
            this.productDiscoveryData.categoryClicks / categories.length;
        }

        // Generate unique realistic trend data for each category
        dataset.data = this.generateCategorySpecificTrendData(
          categoryValue,
          index,
          period
        );
      });
    }

    this.charts.categoryClicks = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: { color: "#ffffff", usePointStyle: true },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#9ca3af" },
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#9ca3af" },
          },
        },
      },
    });
  }

  createSearchConversionChart() {
    const ctx = document
      .getElementById("search-conversion-chart")
      .getContext("2d");

    // Start with zero data, update with real data if available
    let searchQueries = 0;
    let clicksFromSearch = 0;
    let addToCart = 0;
    let purchases = 0;

    if (
      this.productDiscoveryData &&
      this.productDiscoveryData.searchQueries > 0
    ) {
      searchQueries = this.productDiscoveryData.searchQueries;
      clicksFromSearch = Math.round(searchQueries * 0.7); // 70% click rate
      addToCart = Math.round(clicksFromSearch * 0.15); // 15% add to cart
      purchases = Math.round(addToCart * 0.6); // 60% purchase conversion
    }

    const searchData = {
      labels: [
        "Search Queries",
        "Clicks from Search",
        "Add to Cart",
        "Purchases",
      ],
      datasets: [
        {
          label: "Search Funnel",
          data: [searchQueries, clicksFromSearch, addToCart, purchases],
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
          borderWidth: 2,
        },
      ],
    };

    this.charts.searchConversion = new Chart(ctx, {
      type: "bar",
      data: searchData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            callbacks: {
              afterLabel: function (context) {
                const percentage =
                  context.dataIndex === 0
                    ? 100
                    : ((context.parsed.y / 1000) * 100).toFixed(1);
                return `${percentage}% of initial searches`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#9ca3af" },
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#9ca3af" },
          },
        },
      },
    });
  }

  createDiscoveryHeatmapChart() {
    const ctx = document
      .getElementById("discovery-heatmap-chart")
      .getContext("2d");

    // Start with empty data, update with real data if available
    let heatmapData = [];

    if (this.productDiscoveryData) {
      const totalInteractions =
        (this.productDiscoveryData.categoryClicks || 0) +
        (this.productDiscoveryData.productClicks || 0);
      if (totalInteractions > 0) {
        heatmapData = this.generateHeatmapData(totalInteractions);
      }
    }

    this.charts.discoveryHeatmap = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Click Density",
            data: heatmapData,
            backgroundColor: function (context) {
              const value = context.parsed.y;
              const alpha = Math.min(value / 100, 1);
              return `rgba(59, 130, 246, ${alpha})`;
            },
            pointRadius: function (context) {
              return Math.max(3, context.parsed.y / 10);
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            callbacks: {
              label: function (context) {
                return `Position: (${context.parsed.x}, ${context.parsed.y}) - ${context.parsed.y} clicks`;
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Page Position", color: "#9ca3af" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#9ca3af" },
          },
          y: {
            title: { display: true, text: "Click Intensity", color: "#9ca3af" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#9ca3af" },
          },
        },
      },
    });
  }

  generateClickData(hours) {
    return Array.from(
      { length: hours },
      () => Math.floor(Math.random() * 100) + 20
    );
  }

  generateTimeLabels(hours) {
    const labels = [];
    const now = new Date();
    for (let i = hours - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(time.getHours().toString().padStart(2, "0") + ":00");
    }
    return labels;
  }

  generateHeatmapData(totalInteractions = 0) {
    const data = [];
    if (totalInteractions === 0) {
      return data; // Return empty array when no interactions
    }

    const numPoints = Math.min(totalInteractions, 50); // Limit to 50 points max
    for (let i = 0; i < numPoints; i++) {
      data.push({
        x: Math.random() * 100,
        y: Math.random() * 150,
      });
    }
    return data;
  }

  startRealTimeUpdates() {
    // Update real-time events every 15 seconds
    this.realTimeUpdateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateRealTimeEvents();
      }
    }, 15000);

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
    // Generate product discovery focused real-time events
    const productDiscoveryEvents = this.generateProductDiscoveryEvents();

    const eventsContainer = document.getElementById("realtime-events");
    if (!eventsContainer) return;

    if (productDiscoveryEvents.length === 0) {
      eventsContainer.innerHTML = `
        <div class="no-events" style="text-align: center; color: #6b7280; padding: 40px;">
          <i data-feather="activity" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
          <div>No recent product discovery activity</div>
        </div>
      `;
      feather.replace();
      return;
    }

    eventsContainer.innerHTML = productDiscoveryEvents
      .map((event) => {
        const time = new Date(event.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `
        <div class="event-item">
          <span class="event-time">${time}</span>
          <span class="event-type ${event.type}">${event.typeLabel}</span>
          <span class="event-description">${event.description}</span>
        </div>
      `;
      })
      .join("");
  }

  generateProductDiscoveryEvents() {
    // If no data or all data is zero, return empty events array
    if (
      !this.productDiscoveryData ||
      (this.productDiscoveryData.categoryClicks === 0 &&
        this.productDiscoveryData.productClicks === 0 &&
        this.productDiscoveryData.searchQueries === 0 &&
        this.productDiscoveryData.cartAdditions === 0)
    ) {
      return [];
    }

    const eventTypes = [
      {
        type: "category_click",
        typeLabel: "Category",
        descriptions: [
          "Clicked Fiction category",
          "Explored Romance subcategory",
          "Browsed Mystery section",
          "Viewed Science Fiction books",
          "Checked Young Adult novels",
        ],
      },
      {
        type: "product_click",
        typeLabel: "Product",
        descriptions: [
          'Viewed "The Silent Patient"',
          'Clicked "Dune" details',
          'Explored "Pride and Prejudice"',
          'Checked "The Hobbit"',
          'Viewed "1984" product page',
        ],
      },
      {
        type: "search_query",
        typeLabel: "Search",
        descriptions: [
          'Searched for "thriller books"',
          'Queried "romantic novels"',
          'Looked for "stephen king"',
          'Searched "bestsellers 2024"',
          'Found "fantasy series"',
        ],
      },
      {
        type: "add_to_cart",
        typeLabel: "Cart",
        descriptions: [
          'Added "Harry Potter" to cart',
          'Cart: "The Great Gatsby"',
          "Added mystery novel to cart",
          "Cart: romance book bundle",
          "Added cookbook to cart",
        ],
      },
      {
        type: "sidebar_expand",
        typeLabel: "Navigate",
        descriptions: [
          "Expanded Fiction submenu",
          "Opened Academic categories",
          "Explored Arts & Culture",
          "Checked Health & Self-Help",
          "Browsed Business section",
        ],
      },
    ];

    const events = [];
    const now = Date.now();

    for (let i = 0; i < 12; i++) {
      const eventType =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const description =
        eventType.descriptions[
          Math.floor(Math.random() * eventType.descriptions.length)
        ];

      events.push({
        timestamp: now - Math.random() * 5 * 60 * 1000, // Within last 5 minutes
        type: eventType.type,
        typeLabel: eventType.typeLabel,
        description: description,
      });
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  getEventDescription(event) {
    // This method is now handled in generateProductDiscoveryEvents
    return event.description || event.type.replace("_", " ");
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
  new ProductDiscoveryDashboard();
});

export { ProductDiscoveryDashboard };
