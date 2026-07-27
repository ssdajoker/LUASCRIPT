/**
 * REAL-TIME TIER MONITOR DASHBOARD
 * Live tracking of language tier status and auto-evolution progress
 * 
 * Purpose: Provide visual monitoring of:
 * - Current tier status for all 7 languages
 * - Completion percentage toward 95% threshold
 * - Recent promotions and elevation events
 * - Performance metrics and trends
 * 
 * @module TierMonitorDashboard
 */

const AutoEvolutionEngine = require('./auto-evolution');

class TierMonitorDashboard {
  constructor(engine = null) {
    this.engine = engine || new AutoEvolutionEngine();
    this.refreshInterval = 5000; // 5 seconds
    this.updateCallbacks = [];
  }

  /**
   * START DASHBOARD
   * Begin real-time monitoring and updates
   * 
   * @param {Function} onUpdate - Callback for updates
   * @returns {Object} Dashboard control handle
   */
  start(onUpdate = null) {
    if (onUpdate) {
      this.updateCallbacks.push(onUpdate);
    }

    const controlHandle = {
      stop: () => this.stop(),
      refresh: () => this._refreshDashboard(),
      addCallback: (cb) => this.updateCallbacks.push(cb)
    };

    // Initial render
    this._refreshDashboard();

    // Set up interval
    this.refreshTimer = setInterval(() => {
      this._refreshDashboard();
    }, this.refreshInterval);

    return controlHandle;
  }

  /**
   * STOP DASHBOARD
   * Halt monitoring and updates
   */
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Refresh dashboard state
   * @private
   */
  async _refreshDashboard() {
    // Monitor current status
    await this.engine.monitor();

    // Get report
    const report = this.engine.report();
    const metrics = this.engine.getMetrics();

    // Render dashboard
    const display = this._renderDashboard(report, metrics);

    // Call callbacks
    for (const callback of this.updateCallbacks) {
      try {
        callback(display);
      } catch (error) {
        console.error('[DASHBOARD] Callback error:', error.message);
      }
    }
  }

  /**
   * Render dashboard display
   * @private
   * @param {Object} report - Engine report
   * @param {Object} metrics - Metrics summary
   * @returns {Object} Dashboard display object
   */
  _renderDashboard(report, metrics) {
    return {
      timestamp: new Date().toISOString(),
      title: '🎯 CSC LM EVO-A v3 - REAL-TIME TIER MONITOR',
      metrics: this._renderMetrics(metrics),
      tier1: this._renderTier1(report.tier1),
      tier2: this._renderTier2(report.tier2),
      nextTargets: this._renderTargets(report.nextTargets),
      recentPromotions: this._renderPromotions(report.recentPromotions),
      summary: this._renderSummary(report.summary)
    };
  }

  /**
   * Render metrics section
   * @private
   */
  _renderMetrics(metrics) {
    return {
      '📊 Languages at Tier 1': `${metrics.tier1Languages}/7`,
      '⏳ Languages in Progress': `${metrics.tier2Languages}/7`,
      '📈 Average Completion': metrics.averageCompletion,
      '🎉 Total Promotions': metrics.promotionCount,
      '⏱️  Last Updated': metrics.lastUpdate
    };
  }

  /**
   * Render Tier 1 languages section
   * @private
   */
  _renderTier1(tier1Languages) {
    const rows = tier1Languages.map(lang => ({
      '🌟 Language': lang.language,
      'Status': lang.status,
      'Completion': lang.completionPercentage,
      'Phases': this._renderPhases(lang.phases),
      'Promoted At': lang.promotedAt || 'Native Tier 1'
    }));

    return {
      title: '✅ TIER 1: PRODUCTION READY',
      count: tier1Languages.length,
      languages: rows
    };
  }

  /**
   * Render Tier 2 languages section
   * @private
   */
  _renderTier2(tier2Languages) {
    const rows = tier2Languages.map(lang => ({
      '🔧 Language': lang.language,
      'Status': lang.status,
      'Completion': lang.completionPercentage,
      'Phases Complete': lang.phasesComplete.join(', ') || 'None',
      'Phases Needed': lang.phasesPending.join(', '),
      'Hours to Tier 1': `${lang.hoursToElevation}h`
    }));

    return {
      title: '⏳ TIER 2: IN PROGRESS (TARGET: 95%)',
      count: tier2Languages.length,
      languages: rows,
      note: 'Languages shown in order of proximity to elevation'
    };
  }

  /**
   * Render next elevation targets
   * @private
   */
  _renderTargets(nextTargets) {
    return {
      title: '🎯 NEXT ELEVATION TARGETS (Ranked by Proximity)',
      targets: nextTargets.map((target, index) => ({
        rank: index + 1,
        language: target.language.toUpperCase(),
        completion: target.completionPercentage,
        toThreshold: target.percentageToThreshold,
        blocking: target.blockingPhases.join(', ') || 'None'
      }))
    };
  }

  /**
   * Render recent promotions
   * @private
   */
  _renderPromotions(promotions) {
    if (promotions.length === 0) {
      return {
        title: '🎉 RECENT PROMOTIONS',
        message: 'No promotions yet',
        count: 0
      };
    }

    return {
      title: '🎉 RECENT PROMOTIONS TO TIER 1',
      count: promotions.length,
      promotions: promotions.map(p => ({
        language: p.language.toUpperCase(),
        promotedAt: new Date(p.promotedAt).toLocaleString(),
        completionPercentage: `${(p.completionPercentage * 100).toFixed(1)}%`,
        reason: p.reason
      }))
    };
  }

  /**
   * Render summary section
   * @private
   */
  _renderSummary(summary) {
    const elevationPercentage = (summary.tier1Count / summary.totalLanguages * 100).toFixed(1);

    return {
      title: '📋 SUMMARY',
      tier1: `${summary.tier1Count}/${summary.totalLanguages} languages at Tier 1`,
      elevationPercentage: `${elevationPercentage}%`,
      threshold: `Elevation threshold: ${summary.elevationThreshold}`,
      promotions: `${summary.promotionCount} total promotions`,
      timestamp: summary.timestamp
    };
  }

  /**
   * Render phase completion status
   * @private
   */
  _renderPhases(phases) {
    return Object.entries(phases)
      .map(([phase, complete]) => complete ? `✅${phase}` : `❌${phase}`)
      .join(' ');
  }

  /**
   * GET DASHBOARD OUTPUT AS TEXT
   * For console or log display
   * 
   * @returns {string} Formatted dashboard text
   */
  getTextDisplay() {
    // First refresh to get latest data
    const report = this.engine.report();
    const metrics = this.engine.getMetrics();
    const display = this._renderDashboard(report, metrics);

    let text = '\n';
    text += '═══════════════════════════════════════════════════════════════════════════\n';
    text += `${display.title}\n`;
    text += `Update: ${display.timestamp}\n`;
    text += '═══════════════════════════════════════════════════════════════════════════\n\n';

    // Metrics
    text += '📊 KEY METRICS\n';
    text += '─────────────────────────────────────────────────────────────────────────\n';
    for (const [key, value] of Object.entries(display.metrics)) {
      text += `${key.padEnd(35)} : ${value}\n`;
    }

    // Tier 1
    text += '\n✅ TIER 1 LANGUAGES (PRODUCTION READY)\n';
    text += '─────────────────────────────────────────────────────────────────────────\n';
    if (display.tier1.languages.length > 0) {
      for (const lang of display.tier1.languages) {
        text += `\n  🌟 ${lang['🌟 Language'].toUpperCase()}\n`;
        text += `     Status: ${lang.Status}\n`;
        text += `     Completion: ${lang.Completion}\n`;
        text += `     Phases: ${lang.Phases}\n`;
      }
    }

    // Tier 2
    text += '\n\n⏳ TIER 2 LANGUAGES (IN PROGRESS)\n';
    text += '─────────────────────────────────────────────────────────────────────────\n';
    if (display.tier2.languages.length > 0) {
      for (const lang of display.tier2.languages) {
        text += `\n  🔧 ${lang['🔧 Language'].toUpperCase()}\n`;
        text += `     Status: ${lang.Status}\n`;
        text += `     Completion: ${lang.Completion}\n`;
        text += `     Phases Complete: ${lang['Phases Complete']}\n`;
        text += `     Phases Needed: ${lang['Phases Needed']}\n`;
        text += `     Hours to Tier 1: ${lang['Hours to Tier 1']}\n`;
      }
    }

    // Next targets
    text += '\n\n🎯 NEXT ELEVATION TARGETS\n';
    text += '─────────────────────────────────────────────────────────────────────────\n';
    for (const target of display.nextTargets.targets) {
      text += `\n  ${target.rank}. ${target.language}\n`;
      text += `     Current: ${target.completion} | To Threshold: ${target.toThreshold}\n`;
      text += `     Blocking Phases: ${target.blocking}\n`;
    }

    // Recent promotions
    if (display.recentPromotions.count > 0) {
      text += '\n\n🎉 RECENT PROMOTIONS\n';
      text += '─────────────────────────────────────────────────────────────────────────\n';
      for (const promo of display.recentPromotions.promotions) {
        text += `\n  ${promo.language} (${promo.promotedAt})\n`;
        text += `     Completion: ${promo.completionPercentage}\n`;
        text += `     Reason: ${promo.reason}\n`;
      }
    }

    // Summary
    text += '\n\n📋 SUMMARY\n';
    text += '─────────────────────────────────────────────────────────────────────────\n';
    for (const [key, value] of Object.entries(display.summary)) {
      if (key !== 'title' && key !== 'timestamp') {
        text += `${key}: ${value}\n`;
      }
    }

    text += '\n═══════════════════════════════════════════════════════════════════════════\n\n';

    return text;
  }

  /**
   * GET DASHBOARD AS JSON
   * For programmatic access or API responses
   * 
   * @returns {string} JSON formatted dashboard
   */
  getJsonDisplay() {
    const report = this.engine.report();
    const metrics = this.engine.getMetrics();
    const display = this._renderDashboard(report, metrics);

    return JSON.stringify(display, null, 2);
  }

  /**
   * EXPORT DASHBOARD SNAPSHOT
   * Save current dashboard state to file
   * 
   * @param {string} filepath - File path for snapshot
   * @returns {string} Path where saved
   */
  exportSnapshot(filepath) {
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(filepath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const snapshot = {
      exportedAt: new Date().toISOString(),
      engineState: {
        tierStatus: Object.fromEntries(this.engine.getTierStatus()),
        metrics: this.engine.getMetrics(),
        auditLog: this.engine.getAuditLog()
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
    return filepath;
  }
}

module.exports = TierMonitorDashboard;
