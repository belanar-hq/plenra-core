/**
 * Operational Metrics Pipeline
 * 
 * Calculates CAC vs collected revenue metrics without adaptive optimization.
 * Metrics only, no routing or pricing changes.
 */

class OperationalMetricsPipeline {
  constructor() {
    this.schema_version = '1.0.0';
    this.metrics = {}; // In-memory storage
  }

  /**
   * Calculate Customer Acquisition Cost vs Collected Revenue
   * Metrics only, no adaptive optimization
   */
  calculateCacVsCollectedRevenue(input) {
    const {
      case_id,
      acquisition_cost,
      collected_revenue,
      currency
    } = input;

    if (!case_id || typeof acquisition_cost !== 'number' || typeof collected_revenue !== 'number') {
      return {
        valid: false,
        error: 'case_id, acquisition_cost, and collected_revenue required'
      };
    }

    if (currency !== 'ILS') {
      return {
        valid: false,
        error: 'Only ILS currency supported'
      };
    }

    const roi = collected_revenue > 0 
      ? ((collected_revenue - acquisition_cost) / acquisition_cost * 100).toFixed(2)
      : -100;

    const metric = {
      metric_id: `metric_${Date.now()}`,
      case_id,
      acquisition_cost,
      collected_revenue,
      profit: collected_revenue - acquisition_cost,
      roi_percentage: parseFloat(roi),
      currency,
      calculated_at: new Date().toISOString(),
      status: 'CALCULATED_ONLY'
    };

    this.metrics[metric.metric_id] = metric;

    return {
      valid: true,
      metric_id: metric.metric_id,
      acquisition_cost,
      collected_revenue,
      profit: metric.profit,
      roi_percentage: metric.roi_percentage,
      status: 'METRICS_CALCULATED',
      note: 'Metrics for visibility only - no adaptive optimization applied'
    };
  }

  /**
   * Create operational metric event
   */
  createOperationalMetricEvent(input) {
    const {
      case_id,
      event_type,
      metric_value,
      dimension
    } = input;

    if (!case_id || !event_type || typeof metric_value !== 'number') {
      return {
        valid: false,
        error: 'case_id, event_type, and metric_value required'
      };
    }

    const event = {
      event_id: `evt_${Date.now()}`,
      case_id,
      event_type,
      metric_value,
      dimension: dimension || 'default',
      created_at: new Date().toISOString(),
      status: 'RECORDED'
    };

    const eventKey = `${case_id}_${event_type}`;
    this.metrics[eventKey] = event;

    return {
      valid: true,
      event_id: event.event_id,
      status: 'OPERATIONAL_METRIC_EVENT_CREATED',
      event_type,
      metric_value,
      note: 'Event recorded for analysis only - no automation triggered'
    };
  }

  /**
   * Get metrics for case
   */
  getCaseMetrics(case_id) {
    const caseMetrics = Object.values(this.metrics)
      .filter(m => m.case_id === case_id);

    return {
      case_id,
      metric_count: caseMetrics.length,
      metrics: caseMetrics
    };
  }

  /**
   * Get aggregated metrics
   * For visibility only
   */
  getAggregatedMetrics(input) {
    const { cases } = input;

    if (!cases || !Array.isArray(cases)) {
      return {
        valid: false,
        error: 'cases array required'
      };
    }

    let totalAcquisitionCost = 0;
    let totalCollectedRevenue = 0;
    let caseCount = 0;

    cases.forEach(caseId => {
      const caseMetrics = Object.values(this.metrics)
        .filter(m => m.case_id === caseId && m.metric_id);

      caseMetrics.forEach(m => {
        if (m.acquisition_cost !== undefined) {
          totalAcquisitionCost += m.acquisition_cost;
          totalCollectedRevenue += m.collected_revenue || 0;
          caseCount++;
        }
      });
    });

    const overallRoi = totalCollectedRevenue > 0
      ? ((totalCollectedRevenue - totalAcquisitionCost) / totalAcquisitionCost * 100).toFixed(2)
      : -100;

    return {
      valid: true,
      status: 'AGGREGATED_METRICS_CALCULATED',
      case_count: caseCount,
      total_acquisition_cost: totalAcquisitionCost,
      total_collected_revenue: totalCollectedRevenue,
      total_profit: totalCollectedRevenue - totalAcquisitionCost,
      overall_roi_percentage: parseFloat(overallRoi),
      note: 'Metrics for visibility only - no adaptive optimization applied'
    };
  }

  /**
   * Validate no adaptive optimization attempted
   */
  validateNoAdaptiveOptimization(input) {
    const blockedActions = [
      'AUTO_ADJUST_PRICING',
      'AUTO_ADJUST_ACQUISITION_CHANNEL',
      'AUTO_OPTIMIZE_CONTRACTOR_ROUTING',
      'ADAPTIVE_PRICING_TRIGGERED',
      'AUTONOMOUS_REVENUE_OPTIMIZATION'
    ];

    const triggeredActions = blockedActions.filter(action => input[action]);

    if (triggeredActions.length > 0) {
      return {
        valid: false,
        status: 'BLOCK',
        reason_codes: ['ADAPTIVE_OPTIMIZATION_ATTEMPTED'],
        attempted_actions: triggeredActions,
        error: 'Adaptive optimization not allowed in this layer'
      };
    }

    return {
      valid: true,
      status: 'NO_ADAPTIVE_OPTIMIZATION',
      optimization_allowed: false
    };
  }
}

module.exports = { OperationalMetricsPipeline };
