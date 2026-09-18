/**
 * Contractor Scheduling Runtime
 * 
 * Manages contractor availability checking and scheduling.
 * Scheduling only after payment_validated.
 * No adaptive routing.
 */

class ContractorSchedulingRuntime {
  constructor() {
    this.schema_version = '1.0.0';
    this.contractors = {}; // In-memory storage
    this.schedules = {};
  }

  /**
   * Check contractor availability
   * FAIL_CLOSED: If no contractors available, return HOLD
   */
  checkContractorAvailability(input) {
    const { geo_scope, service_slot, service_type } = input;

    if (!geo_scope || geo_scope !== 'Petah Tikva') {
      return {
        available: false,
        status: 'HOLD',
        reason_codes: ['OUT_OF_GEO_SCOPE'],
        error: 'Geo scope not supported'
      };
    }

    // For MVP: assume at least one contractor available
    const availableContractors = [
      { contractor_id: 'cont_001', name: 'Contractor A', available_slots: 5 },
      { contractor_id: 'cont_002', name: 'Contractor B', available_slots: 3 }
    ];

    if (availableContractors.length === 0) {
      return {
        available: false,
        status: 'HOLD',
        reason_codes: ['CONTRACTOR_NOT_AVAILABLE'],
        error: 'No contractors available in geo scope'
      };
    }

    return {
      available: true,
      status: 'CONTRACTORS_AVAILABLE',
      contractor_count: availableContractors.length,
      contractors: availableContractors
    };
  }

  /**
   * Schedule contractor for service
   * FAIL_CLOSED: Only after payment_validated
   */
  scheduleContractor(input) {
    const {
      booking_id,
      case_id,
      contractor_id,
      service_slot,
      payment_status
    } = input;

    // FAIL_CLOSED: Contractor scheduling only after payment_validated
    if (payment_status !== 'payment_validated') {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['PAYMENT_NOT_VALIDATED'],
        error: 'Contractor can only be scheduled after payment is validated'
      };
    }

    // Check contractor availability
    const availabilityCheck = this.checkContractorAvailability(input);
    if (!availabilityCheck.available) {
      return {
        success: false,
        status: availabilityCheck.status,
        reason_codes: availabilityCheck.reason_codes,
        error: availabilityCheck.error
      };
    }

    if (!contractor_id) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['CONTRACTOR_ID_MISSING'],
        error: 'Contractor ID required for scheduling'
      };
    }

    const schedule = {
      schedule_id: `sched_${Date.now()}`,
      booking_id,
      case_id,
      contractor_id,
      service_slot,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    this.schedules[schedule.schedule_id] = schedule;

    return {
      success: true,
      status: 'CONTRACTOR_SCHEDULED',
      schedule_id: schedule.schedule_id,
      contractor_id,
      service_slot,
      notification_pending: true
    };
  }

  /**
   * Get contractor details
   */
  getContractorDetails(contractor_id) {
    return this.contractors[contractor_id] || null;
  }

  /**
   * Register contractor (for setup)
   */
  registerContractor(input) {
    const { contractor_id, name, geo_scope } = input;
    this.contractors[contractor_id] = {
      contractor_id,
      name,
      geo_scope,
      active: true
    };
  }
}

module.exports = { ContractorSchedulingRuntime };
