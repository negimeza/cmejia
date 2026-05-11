/**
 * performance-metrics.js - Métricas de rendimiento básicas
 */
window.PerformanceMetrics = {
  _metrics: {},

  init() {
    // Esperar a que la página cargue completamente
    if (document.readyState === 'complete') {
      this.collectMetrics();
    } else {
      window.addEventListener('load', () => this.collectMetrics());
    }

    // Observar cambios de visibilidad
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.logMetrics();
      }
    });
  },

  collectMetrics() {
    if (!window.performance || !window.performance.timing) {
      console.warn('Performance API no disponible');
      return;
    }

    const timing = window.performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];

    // Métricas de carga
    this._metrics = {
      // Tiempos de navegación
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domProcessing: timing.domComplete - timing.domLoading,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,

      // Métricas de Web Vitals (si están disponibles)
      fcp: this.getFirstContentfulPaint(),
      lcp: this.getLargestContentfulPaint(),
      fid: this.getFirstInputDelay(),
      cls: this.getCumulativeLayoutShift(),

      // Métricas de recursos
      resourceCount: performance.getEntriesByType('resource').length,
      totalResourceSize: this.getTotalResourceSize(),

      // Métricas de memoria (si están disponibles)
      memory: this.getMemoryUsage(),
    };

    // Log en consola para desarrollo
    if (process.env.NODE_ENV !== 'production') {
      this.logMetrics();
    }

    // Enviar a servicio de analytics (opcional)
    this.sendToAnalytics();
  },

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? Math.round(fcpEntry.startTime) : null;
  },

  getLargestContentfulPaint() {
    if (!PerformanceObserver) return null;

    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        resolve(Math.round(lcp.startTime));
        observer.disconnect();
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    });
  },

  getFirstInputDelay() {
    if (!PerformanceObserver) return null;

    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[0];
        resolve(Math.round(fid.processingStart - fid.startTime));
        observer.disconnect();
      });
      observer.observe({ type: 'first-input', buffered: true });
    });
  },

  getCumulativeLayoutShift() {
    if (!PerformanceObserver) return null;

    return new Promise((resolve) => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        resolve(clsValue.toFixed(4));
        observer.disconnect();
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });
  },

  getTotalResourceSize() {
    const resources = performance.getEntriesByType('resource');
    return resources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
  },

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  },

  logMetrics() {
    console.group('📊 Métricas de Rendimiento');
    console.log('⏱️  Tiempos de Carga:');
    console.log(`   DNS Lookup: ${this._metrics.dnsLookup}ms`);
    console.log(`   TCP Connection: ${this._metrics.tcpConnection}ms`);
    console.log(`   Request Time: ${this._metrics.requestTime}ms`);
    console.log(`   Response Time: ${this._metrics.responseTime}ms`);
    console.log(`   DOM Processing: ${this._metrics.domProcessing}ms`);
    console.log(`   DOM Content Loaded: ${this._metrics.domContentLoaded}ms`);
    console.log(`   Load Complete: ${this._metrics.loadComplete}ms`);

    console.log('🎯 Web Vitals:');
    console.log(`   FCP: ${this._metrics.fcp}ms`);
    console.log(`   LCP: ${this._metrics.lcp}ms`);
    console.log(`   FID: ${this._metrics.fid}ms`);
    console.log(`   CLS: ${this._metrics.cls}`);

    console.log('📦 Recursos:');
    console.log(`   Count: ${this._metrics.resourceCount}`);
    console.log(`   Total Size: ${Math.round(this._metrics.totalResourceSize / 1024)}KB`);

    if (this._metrics.memory) {
      console.log('💾 Memoria:');
      console.log(`   Used: ${this._metrics.memory.used}MB`);
      console.log(`   Total: ${this._metrics.memory.total}MB`);
      console.log(`   Limit: ${this._metrics.memory.limit}MB`);
    }

    console.groupEnd();
  },

  sendToAnalytics() {
    // Aquí puedes enviar las métricas a tu servicio de analytics
    // Ejemplo: Google Analytics, Mixpanel, etc.

    // Ejemplo con Google Analytics 4:
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        custom_map: {
          'dimension_1': 'fcp',
          'dimension_2': 'lcp',
          'dimension_3': 'fid',
          'dimension_4': 'cls',
        },
        fcp: this._metrics.fcp,
        lcp: this._metrics.lcp,
        fid: this._metrics.fid,
        cls: this._metrics.cls,
      });
    }

    // Ejemplo con console.log para desarrollo:
    console.log('📤 Métricas listas para enviar a analytics:', this._metrics);
  },

  /**
   * Obtiene métricas específicas
   */
  getMetric(name) {
    return this._metrics[name];
  },

  /**
   * Obtiene todas las métricas
   */
  getAllMetrics() {
    return { ...this._metrics };
  }
};

// Inicializar métricas de rendimiento
if (typeof window !== 'undefined') {
  window.PerformanceMetrics.init();
}
