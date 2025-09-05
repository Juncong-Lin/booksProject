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
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  initTracking() {
    // Track clicks
    document.addEventListener('click', (e) => {
      this.trackEvent('click', {
        element: e.target.tagName,
        className: e.target.className,
        text: e.target.textContent?.substring(0, 50),
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', { timestamp: Date.now() });
      } else {
        this.trackEvent('page_visible', { timestamp: Date.now() });
      }
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        this.trackEvent('scroll_depth', { depth: scrollPercent, timestamp: Date.now() });
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
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
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    };
    
    this.pageViews.push(pageData);
    this.saveData();
  }

  trackEvent(eventType, data) {
    const event = {
      type: eventType,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      ...data
    };
    
    this.events.push(event);
    
    // Save every 10 events to prevent data loss
    if (this.events.length % 10 === 0) {
      this.saveData();
    }
  }

  trackPageEnd() {
    const timeOnPage = Date.now() - this.currentPageStart;
    this.trackEvent('page_end', { timeOnPage: timeOnPage });
  }

  saveData() {
    const analyticsData = {
      sessionId: this.sessionId,
      pageViews: this.pageViews,
      events: this.events,
      lastUpdated: Date.now()
    };
    
    // Save to localStorage (in a real implementation, this would be sent to a server)
    localStorage.setItem('analytics_data', JSON.stringify(analyticsData));
    
    // Also save to a historical log
    const historicalData = JSON.parse(localStorage.getItem('analytics_history') || '[]');
    historicalData.push(...this.events.splice(0)); // Move events to history and clear current
    
    // Keep only last 1000 events to prevent storage overflow
    if (historicalData.length > 1000) {
      historicalData.splice(0, historicalData.length - 1000);
    }
    
    localStorage.setItem('analytics_history', JSON.stringify(historicalData));
  }

  // Static method to get analytics data for dashboard
  static getAnalyticsData() {
    const currentData = JSON.parse(localStorage.getItem('analytics_data') || '{}');
    const historicalData = JSON.parse(localStorage.getItem('analytics_history') || '[]');
    
    return {
      current: currentData,
      historical: historicalData,
      summary: this.generateSummary(historicalData)
    };
  }

  static generateSummary(events) {
    const summary = {
      totalEvents: events.length,
      uniqueSessions: new Set(events.map(e => e.sessionId)).size,
      eventTypes: {},
      pageViews: events.filter(e => e.type === 'page_view').length,
      totalClicks: events.filter(e => e.type === 'click').length,
      avgScrollDepth: 0
    };

    // Count event types
    events.forEach(event => {
      summary.eventTypes[event.type] = (summary.eventTypes[event.type] || 0) + 1;
    });

    // Calculate average scroll depth
    const scrollEvents = events.filter(e => e.type === 'scroll_depth');
    if (scrollEvents.length > 0) {
      summary.avgScrollDepth = Math.round(
        scrollEvents.reduce((sum, e) => sum + e.depth, 0) / scrollEvents.length
      );
    }

    return summary;
  }
}

// Initialize analytics when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.analytics = new SimpleAnalytics();
});

export { SimpleAnalytics };
