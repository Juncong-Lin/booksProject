import { SimpleAnalytics } from "../shared/analytics.js";

// Disable Chart.js animations globally to reduce CPU usage
if (window.Chart) {
  Chart.defaults.animation = false;
  Chart.defaults.animations.colors = false;
  Chart.defaults.animations.x = false;
  Chart.defaults.animations.y = false;
}

class ProductDiscoveryDashboard {
  constructor() {
    this.charts = {};
    this.realTimeUpdateInterval = null;
    this.metricsUpdateInterval = null;
    this.isPaused = false;
    this.categoryData = {};
    this.searchData = {};
    this.currentTimePeriod = "24h"; // Track current time period
    this.chartUpdatePending = false; // Throttle chart updates
    this.chartsCreated = false; // Lazy load charts
    this.performanceMode = false; // Disable performance mode by default since button is removed

    this.initDashboard();
    // Load stored data first, then delay heavy operations to reduce initial CPU spike
    this.loadStoredData();
    setTimeout(() => {
      this.updateMetricsFromRealData();
      this.createChartsLazy();
      this.startRealTimeUpdates();
    }, 100);
    this.initEventHandlers();
    this.loadCategoryAnalytics();
    this.initResponsiveHandlers();
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
        // Initialize with empty data if parsing fails
        this.handleDataUpdate({});
      }
    } else {
      // No stored data, initialize with empty data
      this.handleDataUpdate({});
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

    // Update category performance metrics
    const productMetrics = this.generateProductDiscoveryMetrics();
    this.updateCategoryPerformance(productMetrics);
  }

  updateHomepageFunnelWithRealData(data) {
    // Check if we have any real data
    const hasRealData =
      data &&
      (data.categoryClicks > 0 ||
        data.productClicks > 0 ||
        data.searchQueries > 0);

    const homepageVisits = hasRealData ? data.homepageVisits || 0 : 0;
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

    // Calculate conversion percentages - handle division by zero
    const categoryPercent =
      homepageVisits > 0
        ? ((categoryNavigation / homepageVisits) * 100).toFixed(1)
        : "0.0";
    const productPercent =
      homepageVisits > 0
        ? ((productViews / homepageVisits) * 100).toFixed(1)
        : "0.0";
    const cartPercent =
      homepageVisits > 0
        ? ((cartAdditions / homepageVisits) * 100).toFixed(1)
        : "0.0";

    this.updateMetricValue("funnel-categories-percent", `${categoryPercent}%`);
    this.updateMetricValue("funnel-products-percent", `${productPercent}%`);
    this.updateMetricValue("funnel-cart-adds-percent", `${cartPercent}%`);

    // Homepage visits should always be 100% when there are visits (it's the top of the funnel)
    const homepagePercent = homepageVisits > 0 ? "100.0" : "0.0";
    this.updateMetricValue("funnel-homepage-percent", `${homepagePercent}%`);

    // Update visual funnel bars
    this.updateFunnelBar("funnel-homepage-bar", homepageVisits > 0 ? 100 : 0);
    this.updateFunnelBar("funnel-categories-bar", parseFloat(categoryPercent));
    this.updateFunnelBar("funnel-products-bar", parseFloat(productPercent));
    this.updateFunnelBar("funnel-cart-adds-bar", parseFloat(cartPercent));
  }

  getPreviousData() {
    // Get previous period data for trend calculation
    // For now, we'll simulate by using a percentage of current data as "previous"
    // In a real implementation, this would fetch actual historical data
    const currentData = this.productDiscoveryData || {};

    // For small numbers (like 1), simulate that previous was 0 to show meaningful trends
    // For larger numbers, use percentage-based previous values
    const getPreviousValue = (current) => {
      if (current <= 1) return 0; // Show as new activity
      if (current <= 5) return Math.max(0, current - 1); // Show recent growth
      return Math.max(0, Math.floor(current * 0.8)); // Show percentage growth
    };

    return {
      categoryClicks: getPreviousValue(currentData.categoryClicks || 0),
      productClicks: getPreviousValue(currentData.productClicks || 0),
      searchQueries: getPreviousValue(currentData.searchQueries || 0),
      cartAdditions: getPreviousValue(currentData.cartAdditions || 0),
    };
  }

  generateCategoryList(data) {
    if (data && data.categoryPerformance) {
      return Object.entries(data.categoryPerformance)
        .map(([name, clicks]) => ({ name, clicks }))
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
        },
        {
          name: "Romance",
          clicks: 0,
        },
        {
          name: "Mystery",
          clicks: 0,
        },
        {
          name: "Sci-Fi",
          clicks: 0,
        },
        {
          name: "Non-Fiction",
          clicks: 0,
        },
      ];
    }

    // Generate realistic data based on total category clicks
    const totalClicks = data.categoryClicks || 0;
    return [
      {
        name: "Fiction",
        clicks: Math.round(totalClicks * 0.4),
      },
      {
        name: "Romance",
        clicks: Math.round(totalClicks * 0.35),
      },
      {
        name: "Mystery",
        clicks: Math.round(totalClicks * 0.15),
      },
      {
        name: "Sci-Fi",
        clicks: Math.round(totalClicks * 0.07),
      },
      {
        name: "Non-Fiction",
        clicks: Math.round(totalClicks * 0.03),
      },
    ];
  }

  updateCategoryClicksChart() {
    if (!this.charts.categoryClicks) return;

    const data = this.productDiscoveryData;
    const hasCategoryData =
      data &&
      (data.categoryClicks > 0 ||
        (data.categoryPerformance &&
          Object.keys(data.categoryPerformance).length > 0 &&
          Object.values(data.categoryPerformance).some((val) => val > 0)));

    if (!hasCategoryData) {
      // Clear chart data when no category data exists
      this.clearChartData(this.charts.categoryClicks);
      this.updateCategoryClicksEmptyState(true);
    } else {
      // Update with real data if available
      this.updateChartWithRealData(this.charts.categoryClicks, data);
      this.updateCategoryClicksEmptyState(false);
    }
  }

  clearChartData(chart) {
    // Completely clear datasets when no data exists
    chart.data.datasets = [];
    chart.data.labels = [];
    chart.update();
  }

  updateChartWithRealData(chart, data) {
    // Update chart with real category performance data
    if (chart === this.charts.categoryClicks) {
      // Handle category clicks chart specifically with dynamic categories
      let categories = [];
      let categoryValues = {};

      if (
        data.categoryPerformance &&
        Object.keys(data.categoryPerformance).length > 0
      ) {
        // Use actual clicked categories
        categories = Object.keys(data.categoryPerformance)
          .filter((cat) => data.categoryPerformance[cat] > 0)
          .sort(
            (a, b) => data.categoryPerformance[b] - data.categoryPerformance[a]
          );

        categories.forEach((cat) => {
          categoryValues[cat] = data.categoryPerformance[cat];
        });
      } else {
        // Fallback to default categories
        categories = [
          "Fiction",
          "Romance",
          "Mystery",
          "Science Fiction",
          "Non-Fiction",
        ];
        categories.forEach((cat) => {
          categoryValues[cat] = 0;
        });
      }

      const baseColors = [
        "#3b82f6",
        "#ef4444",
        "#8b5cf6",
        "#10b981",
        "#f59e0b",
        "#ec4899",
        "#06b6d4",
        "#84cc16",
        "#f97316",
      ];

      // Recreate datasets if they don't exist or if categories have changed
      const currentLabels = chart.data.datasets.map((d) => d.label);
      const categoriesChanged =
        JSON.stringify(currentLabels.sort()) !==
        JSON.stringify(categories.sort());

      if (chart.data.datasets.length === 0 || categoriesChanged) {
        const timeInfo = this.getTimeInfoForPeriod(this.currentTimePeriod);
        const labels = this.generateTimeLabels(
          timeInfo.points,
          timeInfo.format
        );

        chart.data.labels = labels;
        chart.data.datasets = categories.map((category, index) => ({
          label: category,
          data: Array(timeInfo.points).fill(0),
          borderColor: baseColors[index % baseColors.length],
          backgroundColor: baseColors[index % baseColors.length] + "20",
          tension: 0.4,
          fill: false,
        }));
      }

      // Update with real data
      chart.data.datasets.forEach((dataset, index) => {
        const categoryName = dataset.label;
        const categoryValue = categoryValues[categoryName] || 0;

        // Generate unique realistic trend data for each category using current time period
        dataset.data = this.generateCategorySpecificTrendData(
          categoryValue,
          index,
          this.currentTimePeriod
        );
      });

      chart.update();
    } else {
      // Handle other charts (existing logic)
      const categories = [
        "Fiction",
        "Romance",
        "Mystery",
        "Sci-Fi",
        "Non-Fiction",
      ];

      if (data.categoryPerformance) {
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
          const categoryValue =
            data.categoryClicks / chart.data.datasets.length;
          dataset.data = this.generateCategorySpecificTrendData(
            categoryValue,
            index,
            this.currentTimePeriod
          );
        });
      }
      chart.update();
    }
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

    // For real user interaction data, show actual clicks at the most recent time point
    // instead of spreading them across time periods to avoid inflating the appearance of activity

    // Fill most time points with 0
    for (let i = 0; i < timeInfo.points - 1; i++) {
      data.push(0);
    }

    // Put the actual click count at the last time point (most recent)
    data.push(totalValue);

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

    if (this.charts.searchConversionChart) {
      this.updateSearchConversionChart();
    }

    if (this.charts.bookCategories) {
      this.updateBookCategoriesChart();
    }

    this.updateCategoryFunnelChart();

    // Mini charts removed - no longer needed
  }

  updateSearchConversionChart() {
    if (!this.charts.searchConversionChart) return;

    const data = this.productDiscoveryData;
    const hasData =
      data &&
      (data.searchQueries > 0 ||
        data.searchToCartConversions > 0 ||
        data.searchPurchases > 0);

    if (!hasData) {
      // Clear chart data when no data exists
      this.clearBarChartData(this.charts.searchConversionChart);
    } else {
      // Update with real funnel data
      this.updateSearchConversionWithRealData(
        this.charts.searchConversionChart,
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

  updateCategoryFunnelChart() {
    if (!this.charts.categoryFunnel) return;

    const data = this.productDiscoveryData;

    // Only check for CATEGORY-related data, not search data
    const hasCategoryData =
      data &&
      (data.categoryClicks > 0 ||
        (data.productClicks > 0 && data.categoryClicks > 0)); // Product clicks only count if there are category clicks

    if (!hasCategoryData) {
      // Clear chart data when no category data exists
      this.clearBarChartData(this.charts.categoryFunnel);
      // Also update conversion rate to 0 when no data
      const conversionRateElement = document.getElementById(
        "funnel-conversion-rate"
      );
      if (conversionRateElement) {
        conversionRateElement.textContent = "0.00%";
        conversionRateElement.style.color = "#ef4444"; // Red for no data
      }
    } else {
      // Update with real data
      const funnelData = this.calculateFunnelData();

      // Update chart data
      this.charts.categoryFunnel.data.datasets[0].data = [
        funnelData["category-view"].count,
        funnelData["product-click"].count,
        funnelData["category-add-to-cart"].count,
        funnelData["detail-add-to-cart"].count,
        funnelData["purchase"].count,
      ];

      // Update the chart
      this.charts.categoryFunnel.update();

      // Update conversion rate display only when there's data
      this.updateFunnelConversionRate(funnelData);
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

    // Also clear the custom legend
    if (chart === this.charts.bookCategories) {
      this.createBookCategoriesLegend([]);
    }
  }

  clearScatterChartData(chart) {
    chart.data.datasets.forEach((dataset) => {
      dataset.data = [];
    });
    chart.update();
  }

  updateSearchConversionWithRealData(chart, data) {
    // Force reload latest data from localStorage
    const stored = localStorage.getItem("product_discovery_data");
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch (error) {
        console.error("Error loading stored data:", error);
      }
    }

    // Calculate search funnel data
    const funnelData = this.calculateSearchFunnelData();

    chart.data.datasets[0].data = [
      funnelData["search-query"].count,
      funnelData["clicks-from-search"].count,
      funnelData["search-add-to-cart"].count,
      funnelData["detail-add-to-cart"].count,
      funnelData["purchase"].count,
    ];
    chart.update();

    // Update conversion rate display
    this.updateSearchFunnelConversionRate(funnelData);
  }

  updateBookCategoriesWithRealData(chart, data) {
    // Create dynamic category data based on actual clicks
    let bookCategories = [];

    if (
      data.categoryPerformance &&
      Object.keys(data.categoryPerformance).length > 0
    ) {
      // Use actual clicked categories
      const sortedCategories = Object.entries(data.categoryPerformance)
        .filter(([name, clicks]) => clicks > 0)
        .sort(([, a], [, b]) => b - a); // Sort by clicks descending (no limit)

      const colors = [
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#f59e0b",
        "#ef4444",
        "#06b6d4",
        "#84cc16",
        "#f97316",
        "#6366f1",
        "#14b8a6",
        "#f43f5e",
        "#eab308",
        "#8c6de7",
        "#f59e0b",
        "#22c55e",
        "#ec4899",
        "#06b6d4",
        "#a855f7",
        "#64748b",
        "#0ea5e9",
      ];

      bookCategories = sortedCategories.map(([name, clicks], index) => ({
        name: name,
        sales: clicks,
        color: colors[index % colors.length],
      }));
    } else {
      // Fallback to default categories when no specific performance data
      bookCategories = [
        { name: "Fiction", sales: 0, color: "#3b82f6" },
        { name: "Non-Fiction", sales: 0, color: "#10b981" },
        { name: "Science Fiction", sales: 0, color: "#8b5cf6" },
        { name: "Romance", sales: 0, color: "#f59e0b" },
        { name: "Mystery", sales: 0, color: "#ef4444" },
        { name: "Biography", sales: 0, color: "#06b6d4" },
      ];

      // Distribute total category clicks among default categories
      const totalClicks = data.categoryClicks || 0;
      if (totalClicks > 0) {
        bookCategories[0].sales = Math.round(totalClicks * 0.3); // Fiction
        bookCategories[1].sales = Math.round(totalClicks * 0.25); // Non-Fiction
        bookCategories[2].sales = Math.round(totalClicks * 0.2); // Science Fiction
        bookCategories[3].sales = Math.round(totalClicks * 0.15); // Romance
        bookCategories[4].sales = Math.round(totalClicks * 0.1); // Mystery
      }
    }

    // Update chart data
    chart.data.labels = bookCategories.map((cat) => cat.name);
    chart.data.datasets[0].data = bookCategories.map((cat) => cat.sales);
    chart.data.datasets[0].backgroundColor = bookCategories.map(
      (cat) => cat.color
    );
    chart.data.datasets[0].borderColor = bookCategories.map((cat) => cat.color);

    chart.update();

    // Update the legend with new data
    this.createBookCategoriesLegend(bookCategories);
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
    // Auto-refresh every 30 seconds to show real-time updates
    this.autoRefreshInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateMetrics();
      }
    }, 30000);
  }

  refreshAllCharts() {
    try {
      // Throttle chart updates to prevent excessive CPU usage
      if (this.chartUpdatePending) {
        return;
      }

      this.chartUpdatePending = true;

      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        Object.keys(this.charts).forEach((chartKey) => {
          const chart = this.charts[chartKey];
          if (chart && typeof chart.update === "function") {
            // Use 'none' animation mode to reduce CPU usage
            chart.update("none");
          }
        });
        this.chartUpdatePending = false;
      });
    } catch (error) {
      console.error("Error updating charts:", error);
      this.chartUpdatePending = false;
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

  initResponsiveHandlers() {
    // Handle window resize for responsive chart configurations
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateChartsForResponsive();
      }, 250); // Debounce resize events
    });
  }

  updateChartsForResponsive() {
    // Update category clicks chart legend position based on screen size
    if (this.charts.categoryClicks) {
      const isMobile = window.innerWidth <= 768;
      const isSmallMobile = window.innerWidth <= 480;

      // Keep legend position consistently at bottom for all screen sizes
      this.charts.categoryClicks.options.plugins.legend.position = "bottom";

      // Update legend font size
      this.charts.categoryClicks.options.plugins.legend.labels.font.size =
        isSmallMobile ? 10 : 12;
      this.charts.categoryClicks.options.plugins.legend.labels.padding =
        isMobile ? 8 : 12;
      this.charts.categoryClicks.options.plugins.legend.labels.maxWidth =
        isSmallMobile ? 80 : 120;

      // Update scale font sizes
      this.charts.categoryClicks.options.scales.x.ticks.font.size =
        isSmallMobile ? 10 : 12;
      this.charts.categoryClicks.options.scales.y.ticks.font.size =
        isSmallMobile ? 10 : 12;

      // Update the chart
      this.charts.categoryClicks.update("none"); // Use 'none' animation for performance
    }
  }

  updateMetrics() {
    try {
      // Reload data from localStorage to get latest changes
      this.loadStoredData();

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

      // Update all charts with latest data
      this.updateAllCharts();

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
        // Only use actual data - no estimation when data is cleared
        homepageVisits = 0;
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

    // Calculate conversion percentages - handle division by zero
    const homepageVisits = metrics.homepageVisits;
    const categoryPercent =
      homepageVisits > 0
        ? ((metrics.categoryNavigation / metrics.homepageVisits) * 100).toFixed(
            1
          )
        : "0.0";
    const productPercent =
      homepageVisits > 0
        ? ((metrics.productViews / metrics.homepageVisits) * 100).toFixed(1)
        : "0.0";
    const cartPercent =
      homepageVisits > 0
        ? ((metrics.cartAdditions / metrics.homepageVisits) * 100).toFixed(1)
        : "0.0";

    this.updateMetricValue("funnel-categories-percent", `${categoryPercent}%`);
    this.updateMetricValue("funnel-products-percent", `${productPercent}%`);
    this.updateMetricValue("funnel-cart-adds-percent", `${cartPercent}%`);

    // Homepage visits should always be 100% when there are visits (it's the top of the funnel)
    const homepagePercent = homepageVisits > 0 ? "100.0" : "0.0";
    this.updateMetricValue("funnel-homepage-percent", `${homepagePercent}%`);

    // Update visual funnel bars
    this.updateFunnelBar("funnel-homepage-bar", homepageVisits > 0 ? 100 : 0);
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
      metrics &&
      (metrics.categoryClicks > 0 ||
        metrics.productClicks > 0 ||
        metrics.searchQueries > 0);

    if (!hasRealData) {
      // Use zero values when no real data
      this.updateMetricValue("category-product-ctr", "0.0%");
      this.updateMetricValue("search-click-success", "0.0%");
      this.updateMetricValue("sidebar-header-usage", "0.0% / 0.0%");
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
      // Check if we have any real data
      const hasRealData =
        categories && categories.some((cat) => cat.clicks > 0);

      if (!hasRealData) {
        // Show empty state when no real data exists
        container.innerHTML = `
          <div class="empty-state">
            <p class="empty-message">No category data available</p>
            <p class="empty-subtitle">Start browsing categories to see analytics</p>
          </div>
        `;
      } else {
        // Show actual data
        container.innerHTML = categories
          .filter((category) => category.clicks > 0) // Only show categories with clicks
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
    this.createCategoryFunnelChart();
  }

  createChartsLazy() {
    // Create charts with delay to prevent initial CPU spike
    if (this.chartsCreated) return;

    setTimeout(() => {
      this.createCharts();
      this.chartsCreated = true;

      // Update charts with real data after creation
      setTimeout(() => {
        this.updateAllCharts();
      }, 50);
    }, 200);

    // Mini charts removed - no longer needed
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
          duration: 0, // Disable animation to reduce CPU usage
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
          duration: 0,  // Disable animation to reduce CPU usage
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
          duration: 0,  // Disable animation to reduce CPU usage
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
    // Create dynamic category data based on actual clicks
    let bookCategories = [];

    // Use real data if available
    if (
      this.productDiscoveryData &&
      this.productDiscoveryData.categoryClicks > 0
    ) {
      // Use actual category performance data if available
      if (
        this.productDiscoveryData.categoryPerformance &&
        Object.keys(this.productDiscoveryData.categoryPerformance).length > 0
      ) {
        // Use actual clicked categories
        const sortedCategories = Object.entries(
          this.productDiscoveryData.categoryPerformance
        )
          .filter(([name, clicks]) => clicks > 0)
          .sort(([, a], [, b]) => b - a); // Sort by clicks descending (no limit)

        const colors = [
          "#3b82f6",
          "#10b981",
          "#8b5cf6",
          "#f59e0b",
          "#ef4444",
          "#06b6d4",
          "#84cc16",
          "#f97316",
          "#6366f1",
          "#14b8a6",
          "#f43f5e",
          "#eab308",
          "#8c6de7",
          "#f59e0b",
          "#22c55e",
          "#ec4899",
          "#06b6d4",
          "#a855f7",
          "#64748b",
          "#0ea5e9",
        ];

        bookCategories = sortedCategories.map(([name, clicks], index) => ({
          name: name,
          sales: clicks,
          color: colors[index % colors.length],
        }));
      } else {
        // Fallback to default categories with proportional distribution
        bookCategories = [
          { name: "Fiction", sales: 0, color: "#3b82f6" },
          { name: "Non-Fiction", sales: 0, color: "#10b981" },
          { name: "Science Fiction", sales: 0, color: "#8b5cf6" },
          { name: "Romance", sales: 0, color: "#f59e0b" },
          { name: "Mystery", sales: 0, color: "#ef4444" },
          { name: "Biography", sales: 0, color: "#06b6d4" },
        ];

        const totalClicks = this.productDiscoveryData.categoryClicks;
        bookCategories[0].sales = Math.round(totalClicks * 0.3); // Fiction
        bookCategories[1].sales = Math.round(totalClicks * 0.25); // Non-Fiction
        bookCategories[2].sales = Math.round(totalClicks * 0.2); // Science Fiction
        bookCategories[3].sales = Math.round(totalClicks * 0.15); // Romance
        bookCategories[4].sales = Math.round(totalClicks * 0.1); // Mystery
      }
    } else {
      // Default empty state
      bookCategories = [
        { name: "Fiction", sales: 0, color: "#3b82f6" },
        { name: "Non-Fiction", sales: 0, color: "#10b981" },
        { name: "Science Fiction", sales: 0, color: "#8b5cf6" },
        { name: "Romance", sales: 0, color: "#f59e0b" },
        { name: "Mystery", sales: 0, color: "#ef4444" },
        { name: "Biography", sales: 0, color: "#06b6d4" },
      ];
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
    const leftLegend = document.getElementById("book-categories-legend-left");
    const rightLegend = document.getElementById("book-categories-legend-right");

    if (!leftLegend || !rightLegend) {
      console.error("Legend containers not found");
      return;
    }

    // Calculate total sales for percentages
    const totalSales = categories.reduce((sum, cat) => sum + cat.sales, 0);

    if (totalSales === 0) {
      // Show empty state when no data
      leftLegend.innerHTML = `
        <div class="empty-state">
          <p class="empty-message">No data</p>
        </div>
      `;
      rightLegend.innerHTML = "";
      return;
    }

    // Filter categories with sales (show ALL categories, no limit)
    const validCategories = categories.filter((cat) => cat.sales > 0);

    // Create compact legend items - show all in one container
    const createLegendItems = (cats) =>
      cats
        .map((cat) => {
          const percentage =
            totalSales > 0
              ? ((cat.sales / totalSales) * 100).toFixed(1)
              : "0.0";
          return `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${cat.color}"></div>
          <span class="legend-text">${cat.name} ${percentage}%</span>
        </div>
      `;
        })
        .join("");

    // Show all categories in the left container, clear the right one
    leftLegend.innerHTML = createLegendItems(validCategories);
    rightLegend.innerHTML = "";
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

    // Check if we have any real CATEGORY data specifically
    const hasRealCategoryData =
      this.productDiscoveryData &&
      (this.productDiscoveryData.categoryClicks > 0 ||
        (this.productDiscoveryData.categoryPerformance &&
          Object.keys(this.productDiscoveryData.categoryPerformance).length >
            0 &&
          Object.values(this.productDiscoveryData.categoryPerformance).some(
            (val) => val > 0
          )));

    // Generate time info and labels
    const timeInfo = this.getTimeInfoForPeriod(period);
    const labels = this.generateTimeLabels(timeInfo.points, timeInfo.format);

    let datasets = [];

    if (hasRealCategoryData) {
      // Get categories from actual category performance data or use defaults
      let categories = [];
      let categoryValues = {};

      if (
        this.productDiscoveryData.categoryPerformance &&
        Object.keys(this.productDiscoveryData.categoryPerformance).length > 0
      ) {
        // Use actual clicked categories
        categories = Object.keys(this.productDiscoveryData.categoryPerformance)
          .filter(
            (cat) => this.productDiscoveryData.categoryPerformance[cat] > 0
          )
          .sort(
            (a, b) =>
              this.productDiscoveryData.categoryPerformance[b] -
              this.productDiscoveryData.categoryPerformance[a]
          );

        categories.forEach((cat) => {
          categoryValues[cat] =
            this.productDiscoveryData.categoryPerformance[cat];
        });
      }

      // Color palette - cycle through colors if we have more categories than colors
      const baseColors = [
        "#3b82f6",
        "#ef4444",
        "#8b5cf6",
        "#10b981",
        "#f59e0b",
        "#ec4899",
        "#06b6d4",
        "#84cc16",
        "#f97316",
      ];

      // Create datasets based on actual categories
      datasets = categories.map((category, index) => ({
        label: category,
        data: Array(timeInfo.points).fill(0), // Start with zeros
        borderColor: baseColors[index % baseColors.length],
        backgroundColor: baseColors[index % baseColors.length] + "20",
        tension: 0.4,
        fill: false,
      }));

      // Update datasets with real data
      datasets.forEach((dataset, index) => {
        const categoryName = categories[index];
        const categoryValue = categoryValues[categoryName] || 0;

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
            position: "bottom", // Always position legend below chart for consistency
            labels: {
              color: "#ffffff",
              usePointStyle: true,
              font: {
                size: window.innerWidth <= 480 ? 8 : 10, // Match Popular Book Categories font size
              },
              padding: window.innerWidth <= 768 ? 6 : 8, // Reduce padding to match
              maxWidth: window.innerWidth <= 480 ? 80 : 100, // Slightly reduce max width
            },
            display: datasets.length > 0, // Only show legend if we have datasets
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
            ticks: {
              color: "#9ca3af",
              font: {
                size: window.innerWidth <= 480 ? 10 : 12,
              },
            },
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: {
              color: "#9ca3af",
              font: {
                size: window.innerWidth <= 480 ? 10 : 12,
              },
            },
          },
        },
      },
    });

    // Add empty state overlay if no category data
    this.updateCategoryClicksEmptyState(!hasRealCategoryData);
  }

  updateCategoryClicksEmptyState(isEmpty) {
    const chartContainer = document.getElementById(
      "category-clicks-chart"
    ).parentElement;

    // Remove existing empty state
    const existingEmptyState =
      chartContainer.querySelector(".chart-empty-state");
    if (existingEmptyState) {
      existingEmptyState.remove();
    }

    if (isEmpty) {
      // Add empty state overlay
      const emptyStateDiv = document.createElement("div");
      emptyStateDiv.className = "chart-empty-state";
      emptyStateDiv.innerHTML = `
        <div class="empty-state">
          <p class="empty-message">No category data available</p>
          <p class="empty-subtitle">Start browsing categories to see click patterns</p>
        </div>
      `;
      chartContainer.appendChild(emptyStateDiv);
    }
  }

  createSearchConversionChart() {
    const ctx = document
      .getElementById("search-conversion-chart")
      .getContext("2d");

    // Start with zero data - will be updated by updateSearchConversionChart()
    const searchFunnelData = {
      labels: [
        "Search Query",
        "Search Product Click",
        "Search Page Add To Cart",
        "Detail Page Add To Cart",
        "Purchase",
      ],
      datasets: [
        {
          label: "Search Conversion Funnel",
          data: [0, 0, 0, 0, 0], // Start with zeros
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)", // Blue for Search Query
            "rgba(16, 185, 129, 0.8)", // Green for Clicks from Search
            "rgba(245, 158, 11, 0.8)", // Orange for Search Page Add To Cart
            "rgba(139, 69, 195, 0.8)", // Purple for Detail Page Add To Cart
            "rgba(239, 68, 68, 0.8)", // Red for Purchase
          ],
          borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b45c3", "#ef4444"],
          borderWidth: 2,
        },
      ],
    };

    this.charts.searchConversionChart = new Chart(ctx, {
      type: "bar",
      data: searchFunnelData,
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
                const funnelData = window.dashboard
                  ? window.dashboard.calculateSearchFunnelData()
                  : null;
                if (funnelData) {
                  const stepNames = [
                    "search-query",
                    "clicks-from-search",
                    "search-add-to-cart",
                    "detail-add-to-cart",
                    "purchase",
                  ];
                  const stepKey = stepNames[context.dataIndex];
                  const percentage = funnelData[stepKey].rate.toFixed(1);
                  return `${percentage}% conversion rate`;
                }
                return "";
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
            beginAtZero: true,
          },
        },
      },
    });

    // Let updateSearchConversionChart() handle the initial data update
  }

  createCategoryFunnelChart() {
    const ctx = document
      .getElementById("category-funnel-chart")
      .getContext("2d");

    // Start with zero data - will be updated by updateCategoryFunnelChart()
    const chartData = {
      labels: [
        "Category View",
        "Product Click",
        "Category Page Add To Cart",
        "Detail Page Add To Cart",
        "Purchase",
      ],
      datasets: [
        {
          label: "Conversion Funnel",
          data: [0, 0, 0, 0, 0], // Start with zeros
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)", // Blue for Category View
            "rgba(16, 185, 129, 0.8)", // Green for Product Click
            "rgba(245, 158, 11, 0.8)", // Orange for Category Page Add to Cart
            "rgba(147, 51, 234, 0.8)", // Purple for Detail Page Add to Cart
            "rgba(239, 68, 68, 0.8)", // Red for Purchase
          ],
          borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#9333ea", "#ef4444"],
          borderWidth: 2,
        },
      ],
    };

    this.charts.categoryFunnel = new Chart(ctx, {
      type: "bar",
      data: chartData,
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
                const funnelData = window.dashboard
                  ? window.dashboard.calculateFunnelData()
                  : null;
                if (funnelData) {
                  const stepNames = [
                    "category-view",
                    "product-click",
                    "category-add-to-cart",
                    "detail-add-to-cart",
                    "purchase",
                  ];
                  const stepKey = stepNames[context.dataIndex];
                  const percentage = funnelData[stepKey].rate.toFixed(1);
                  return `${percentage}% conversion rate`;
                }
                return "";
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
            beginAtZero: true,
          },
        },
      },
    });

    // Store reference for tooltip access
    window.dashboard = this;

    // Let updateCategoryFunnelChart() handle the initial data update
  }

  // OLD FUNNEL STEP FUNCTION - NO LONGER USED
  // createFunnelStep(step, data, nextStepData, index) {
  //   const stepDiv = document.createElement("div");
  //   stepDiv.className = "funnel-step";
  //   stepDiv.dataset.step = step.id;
  //   stepDiv.title = step.description; // Add tooltip

  //   // Calculate width based on conversion rate (minimum 20% width for visibility)
  //   const width = Math.max(20, data.rate || 0);

  //   // Calculate drop-off rate to next step
  //   const dropOffRate = nextStepData
  //     ? Math.max(0, 100 - (nextStepData.count / Math.max(data.count, 1)) * 100)
  //     : 0;

  //   stepDiv.innerHTML = `
  //     <div class="funnel-bar" style="width: ${width}%">
  //       <div class="step-info">
  //         <div class="step-icon">
  //           <i data-feather="${step.icon}"></i>
  //         </div>
  //         <div class="step-label">
  //           <div class="step-name">${step.label}</div>
  //         </div>
  //       </div>
  //       <div class="step-metrics">
  //         <div class="step-count">${data.count.toLocaleString()}</div>
  //         <div class="step-rate">${data.rate.toFixed(1)}%</div>
  //       </div>
  //     </div>
  //     ${
  //       nextStepData
  //         ? `
  //       <div class="drop-off-indicator"></div>
  //       <div class="drop-off-rate">-${dropOffRate.toFixed(1)}%</div>
  //     `
  //         : ""
  //     }
  //   `;

  //   return stepDiv;
  // }

  calculateFunnelData() {
    if (!this.productDiscoveryData) {
      return {
        "category-view": { count: 0, rate: 0 },
        "product-click": { count: 0, rate: 0 },
        "category-add-to-cart": { count: 0, rate: 0 },
        "detail-add-to-cart": { count: 0, rate: 0 },
        purchase: { count: 0, rate: 0 },
      };
    }

    const categoryViews = this.productDiscoveryData.categoryClicks || 0;
    const productClicks = this.productDiscoveryData.productClicks || 0;
    const cartAdditions = this.productDiscoveryData.cartAdditions || 0;
    const searchQueries = this.productDiscoveryData.searchQueries || 0;
    const searchToCartConversions =
      this.productDiscoveryData.searchToCartConversions || 0;

    // For category funnel, exclude cart additions that came from search
    const categoryCartAdditions = Math.max(
      0,
      cartAdditions - searchToCartConversions
    );

    // Check if all category-related data is zero or empty (exclude search data)
    const categoryInteractions =
      categoryViews + productClicks + categoryCartAdditions;

    if (categoryInteractions === 0) {
      // Return all zeros when no category data exists
      return {
        "category-view": { count: 0, rate: 0 },
        "product-click": { count: 0, rate: 0 },
        "category-add-to-cart": { count: 0, rate: 0 },
        "detail-add-to-cart": { count: 0, rate: 0 },
        purchase: { count: 0, rate: 0 },
      };
    }

    // Check if we have separate tracking for category vs detail page cart additions
    const categoryPageCartAdditions =
      this.productDiscoveryData.categoryPageCartAdditions || 0;
    const detailPageCartAdditions =
      this.productDiscoveryData.detailPageCartAdditions || 0;

    let categoryPageAddToCart, detailPageAddToCart;

    // If we have separate tracking data, use it
    if (categoryPageCartAdditions > 0 || detailPageCartAdditions > 0) {
      categoryPageAddToCart = categoryPageCartAdditions;
      detailPageAddToCart = detailPageCartAdditions;
    } else {
      // Fallback: Split total category cart additions between category page and detail page
      // For small numbers, track realistic user behavior patterns
      if (categoryCartAdditions === 0) {
        categoryPageAddToCart = 0;
        detailPageAddToCart = 0;
      } else if (categoryCartAdditions === 1) {
        // Single cart addition - based on user feedback, showing as category page
        categoryPageAddToCart = 1;
        detailPageAddToCart = 0;
      } else if (categoryCartAdditions === 2) {
        // 2 cart additions - distribute based on typical user behavior
        categoryPageAddToCart = 1;
        detailPageAddToCart = 1;
      } else if (categoryCartAdditions <= 5) {
        // For small numbers (3-5), ensure both get representation
        categoryPageAddToCart = Math.max(
          1,
          Math.floor(categoryCartAdditions * 0.4)
        );
        detailPageAddToCart = categoryCartAdditions - categoryPageAddToCart;
      } else {
        // For larger numbers, use percentage split (60% detail, 40% category)
        categoryPageAddToCart = Math.floor(categoryCartAdditions * 0.4);
        detailPageAddToCart = Math.floor(categoryCartAdditions * 0.6);
      }
    }

    // Use real category purchase data if available, otherwise estimate
    const categoryPurchases = this.productDiscoveryData.categoryPurchases || 0;
    const actualPurchases = this.productDiscoveryData.actualPurchases || 0;
    const searchPurchases = this.productDiscoveryData.searchPurchases || 0;

    let purchases;
    if (categoryPurchases > 0) {
      // Use actual category purchase tracking
      purchases = categoryPurchases;
    } else if (actualPurchases > 0) {
      // If we have total purchases but no source tracking, subtract search purchases to avoid double counting
      purchases = Math.max(0, actualPurchases - searchPurchases);
    } else {
      // Fallback: Estimate purchases as percentage of total category cart additions
      purchases = Math.floor(categoryCartAdditions * 0.25); // 25% cart-to-purchase conversion
    }

    // Calculate realistic base views from actual category interactions only
    // Use actual category clicks as the base, or estimate from other category interactions
    const estimatedPageViews = Math.max(
      categoryViews, // Use actual category clicks
      categoryInteractions, // Or category interactions as baseline (no search)
      productClicks * 1.5 // Or estimate from product clicks
    );

    // Use real data without artificial minimums
    const baseViews = estimatedPageViews;
    const actualProductClicks = productClicks; // Use actual data

    return {
      "category-view": {
        count: baseViews,
        rate: 100,
      },
      "product-click": {
        count: actualProductClicks,
        rate: baseViews > 0 ? (actualProductClicks / baseViews) * 100 : 0,
      },
      "category-add-to-cart": {
        count: categoryPageAddToCart,
        rate: baseViews > 0 ? (categoryPageAddToCart / baseViews) * 100 : 0,
      },
      "detail-add-to-cart": {
        count: detailPageAddToCart,
        rate: baseViews > 0 ? (detailPageAddToCart / baseViews) * 100 : 0,
      },
      purchase: {
        count: purchases,
        rate: baseViews > 0 ? (purchases / baseViews) * 100 : 0,
      },
    };
  }

  calculateSearchFunnelData() {
    if (!this.productDiscoveryData) {
      return {
        "search-query": { count: 0, rate: 0 },
        "clicks-from-search": { count: 0, rate: 0 },
        "search-add-to-cart": { count: 0, rate: 0 },
        "detail-add-to-cart": { count: 0, rate: 0 },
        purchase: { count: 0, rate: 0 },
      };
    }

    const searchQueries = this.productDiscoveryData.searchQueries || 0;
    const searchProductClicks =
      this.productDiscoveryData.searchProductClicks || 0;
    const searchToCartConversions =
      this.productDiscoveryData.searchToCartConversions || 0;
    const searchPurchases = this.productDiscoveryData.searchPurchases || 0;

    // Check if all search data is zero
    const totalSearchInteractions =
      searchQueries +
      searchProductClicks +
      searchToCartConversions +
      searchPurchases;

    if (totalSearchInteractions === 0) {
      return {
        "search-query": { count: 0, rate: 0 },
        "clicks-from-search": { count: 0, rate: 0 },
        "search-add-to-cart": { count: 0, rate: 0 },
        "detail-add-to-cart": { count: 0, rate: 0 },
        purchase: { count: 0, rate: 0 },
      };
    }

    // Use actual clicks from search instead of estimation
    const clicksFromSearch = searchProductClicks;

    // For search funnel, use separate tracking if available, otherwise estimate
    let searchPageAddToCart, detailPageAddToCartFromSearch;

    // Check if we have separate tracking for search page vs detail page cart additions
    const searchPageCartAdditions =
      this.productDiscoveryData.searchPageCartAdditions || 0;
    const searchDetailPageCartAdditions =
      this.productDiscoveryData.searchDetailPageCartAdditions || 0;

    if (searchPageCartAdditions > 0 || searchDetailPageCartAdditions > 0) {
      // Use actual tracking data when available
      searchPageAddToCart = searchPageCartAdditions;
      detailPageAddToCartFromSearch = searchDetailPageCartAdditions;
    } else if (searchToCartConversions === 0) {
      searchPageAddToCart = 0;
      detailPageAddToCartFromSearch = 0;
    } else if (searchToCartConversions === 1) {
      // Single cart addition from search - assume detail page since most users click through
      searchPageAddToCart = 0;
      detailPageAddToCartFromSearch = 1;
    } else if (searchToCartConversions === 2) {
      // 2 cart additions - 1 search page, 1 detail page
      searchPageAddToCart = 1;
      detailPageAddToCartFromSearch = 1;
    } else {
      // For larger numbers, use percentage split (40% search page, 60% detail page)
      searchPageAddToCart = Math.floor(searchToCartConversions * 0.4);
      detailPageAddToCartFromSearch =
        searchToCartConversions - searchPageAddToCart;
    }

    // Use actual search purchases
    const purchases = searchPurchases;

    // Calculate base views from search queries
    const baseViews = searchQueries;

    return {
      "search-query": {
        count: baseViews,
        rate: 100,
      },
      "clicks-from-search": {
        count: clicksFromSearch,
        rate: baseViews > 0 ? (clicksFromSearch / baseViews) * 100 : 0,
      },
      "search-add-to-cart": {
        count: searchPageAddToCart,
        rate: baseViews > 0 ? (searchPageAddToCart / baseViews) * 100 : 0,
      },
      "detail-add-to-cart": {
        count: detailPageAddToCartFromSearch,
        rate:
          baseViews > 0 ? (detailPageAddToCartFromSearch / baseViews) * 100 : 0,
      },
      purchase: {
        count: purchases,
        rate: baseViews > 0 ? (purchases / baseViews) * 100 : 0,
      },
    };
  }

  updateSearchFunnelConversionRate(funnelData) {
    const conversionRateElement = document.getElementById(
      "search-funnel-conversion-rate"
    );
    if (conversionRateElement && funnelData["search-query"]) {
      const overallRate = funnelData["purchase"].rate || 0;
      conversionRateElement.textContent = `${overallRate.toFixed(2)}%`;

      // Color code the conversion rate
      if (overallRate >= 3) {
        conversionRateElement.style.color = "#10b981"; // Green for good conversion
      } else if (overallRate >= 1) {
        conversionRateElement.style.color = "#f59e0b"; // Orange for medium conversion
      } else {
        conversionRateElement.style.color = "#ef4444"; // Red for low conversion
      }
    }
  }

  updateFunnelConversionRate(funnelData) {
    const conversionRateElement = document.getElementById(
      "funnel-conversion-rate"
    );
    if (conversionRateElement && funnelData["category-view"]) {
      const overallRate = funnelData["purchase"].rate || 0;
      conversionRateElement.textContent = `${overallRate.toFixed(2)}%`;

      // Color code the conversion rate
      if (overallRate >= 3) {
        conversionRateElement.style.color = "#10b981"; // Green for good conversion
      } else if (overallRate >= 1) {
        conversionRateElement.style.color = "#f59e0b"; // Orange for medium conversion
      } else {
        conversionRateElement.style.color = "#ef4444"; // Red for low conversion
      }
    }
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

  startRealTimeUpdates() {
    // Clear any existing intervals first
    if (this.realTimeUpdateInterval) {
      clearInterval(this.realTimeUpdateInterval);
    }

    // Use much longer intervals to minimize CPU usage
    // Update real-time events every 5 minutes instead of 60 seconds
    this.realTimeUpdateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateRealTimeEvents();
      }
    }, 300000);

    // Update metrics every 30 seconds for real-time updates
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

  // Add cleanup method to prevent memory leaks
  destroy() {
    // Clear all intervals
    if (this.realTimeUpdateInterval) {
      clearInterval(this.realTimeUpdateInterval);
      this.realTimeUpdateInterval = null;
    }
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }

    // Destroy charts to free memory
    Object.keys(this.charts).forEach((chartKey) => {
      if (
        this.charts[chartKey] &&
        typeof this.charts[chartKey].destroy === "function"
      ) {
        this.charts[chartKey].destroy();
      }
    });
    this.charts = {};

    // Remove event listeners
    window.removeEventListener("message", this.handleDataUpdate.bind(this));
    window.removeEventListener("beforeunload", this.destroy.bind(this));
  }
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
  const dashboard = new ProductDiscoveryDashboard();

  // Store global reference for performance toggle
  window.dashboardInstance = dashboard;

  // Cleanup when page unloads to prevent memory leaks
  window.addEventListener("beforeunload", () => {
    if (dashboard && typeof dashboard.destroy === "function") {
      dashboard.destroy();
    }
  });

  // Pause updates when page is hidden to save CPU
  document.addEventListener("visibilitychange", () => {
    if (dashboard) {
      if (document.hidden) {
        dashboard.isPaused = true;
      } else {
        dashboard.isPaused = false;
      }
    }
  });
});

export { ProductDiscoveryDashboard };
