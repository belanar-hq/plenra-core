/**
 * Booking Execution Runtime
 * 
 * Orchestrates booking flow: options, slot selection, locking, duplicate prevention.
 * Fail-closed behavior for slot management.
 */

class BookingExecutionRuntime {
  constructor(storageAdapter = null) {
    this.schema_version = '1.0.0';
    this.available_slots = {}; // In-memory storage; in production would be database
    this.locked_slots = {};
    this.booking_records = {};
    this.storageAdapter = storageAdapter;
  }

  /**
   * Check if available slots exist for the geo scope
   */
  checkAvailableSlots(input) {
    const { geo_scope, service_type } = input;

    if (!geo_scope || geo_scope !== 'Petah Tikva') {
      return {
        has_slots: false,
        reason: 'OUT_OF_GEO_SCOPE',
        status: 'HOLD'
      };
    }

    const key = `${geo_scope}_${service_type || 'standard'}`;
    const slots = this.available_slots[key] || [];

    return {
      has_slots: slots.length > 0,
      slot_count: slots.length,
      slots: slots.slice(0, 5) // Return first 5 available
    };
  }

  /**
   * Send booking options to customer
   * FAIL_CLOSED: Only if slots exist
   */
  sendBookingOptions(input) {
    const slotCheck = this.checkAvailableSlots(input);

    if (!slotCheck.has_slots) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['NO_AVAILABLE_SLOTS'],
        error: 'No available slots in geo scope'
      };
    }

    return {
      success: true,
      status: 'BOOKING_OPTIONS_SENT',
      options_id: `opt_${Date.now()}`,
      available_slots: slotCheck.slots,
      geo_scope: input.geo_scope,
      sent_at: new Date().toISOString()
    };
  }

  /**
   * Select and reserve booking slot
   */
  selectBookingSlot(input) {
    const { case_id, slot_id, customer_id, geo_scope } = input;

    if (!slot_id || !case_id) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['MISSING_SLOT_OR_CASE_ID'],
        error: 'Slot ID and case ID required'
      };
    }

    // Check for duplicate booking
    const existingBooking = this.booking_records[case_id];
    if (existingBooking && existingBooking.status !== 'cancelled') {
      return {
        success: false,
        status: 'BLOCK',
        reason_codes: ['DUPLICATE_BOOKING_ATTEMPT'],
        error: 'Booking already exists for this case'
      };
    }

    // Check if slot is already locked
    if (this.locked_slots[slot_id]) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['SLOT_CONFLICT'],
        error: 'Slot already reserved by another customer'
      };
    }

    const booking = {
      booking_id: `book_${Date.now()}`,
      case_id,
      slot_id,
      customer_id,
      geo_scope,
      status: 'slot_selected',
      selected_at: new Date().toISOString()
    };

    this.booking_records[case_id] = booking;

    return {
      success: true,
      status: 'BOOKING_SLOT_SELECTED',
      booking_id: booking.booking_id,
      slot_id
    };
  }

  /**
   * Lock booking slot to prevent concurrent bookings
   * FAIL_CLOSED: Slot must be available
   */
  lockBookingSlot(input) {
    const { booking_id, slot_id, case_id } = input;

    if (!booking_id || !slot_id) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['MISSING_BOOKING_OR_SLOT_ID'],
        error: 'Booking ID and slot ID required for locking'
      };
    }

    // Check if already locked
    if (this.locked_slots[slot_id] && this.locked_slots[slot_id] !== booking_id) {
      return {
        success: false,
        status: 'BLOCK',
        reason_codes: ['SLOT_ALREADY_LOCKED'],
        error: 'Slot locked by different booking'
      };
    }

    // Lock the slot
    this.locked_slots[slot_id] = booking_id;

    // Update booking record
    if (this.booking_records[case_id]) {
      this.booking_records[case_id].status = 'slot_locked';
      this.booking_records[case_id].locked_at = new Date().toISOString();
    }

    return {
      success: true,
      status: 'SLOT_LOCKED',
      booking_id,
      slot_id,
      lock_acquired_at: new Date().toISOString()
    };
  }

  /**
   * FAIL_CLOSED: Prevent duplicate booking
   */
  preventDuplicateBooking(input) {
    const { case_id, customer_id } = input;

    if (!case_id) {
      return {
        valid: false,
        error: 'case_id required'
      };
    }

    const existingBooking = this.booking_records[case_id];

    if (existingBooking && existingBooking.status !== 'cancelled') {
      return {
        valid: false,
        duplicate_detected: true,
        existing_booking_id: existingBooking.booking_id,
        status: 'BLOCK',
        reason_codes: ['DUPLICATE_BOOKING_DETECTED'],
        error: 'Active booking already exists for this case'
      };
    }

    return {
      valid: true,
      duplicate_detected: false,
      status: 'NO_DUPLICATE'
    };
  }

  /**
   * Unlock slot (for cancellation scenarios)
   */
  unlockBookingSlot(input) {
    const { slot_id } = input;

    if (this.locked_slots[slot_id]) {
      delete this.locked_slots[slot_id];
    }

    return {
      success: true,
      status: 'SLOT_UNLOCKED',
      slot_id
    };
  }

  /**
   * Add available slots (for testing/setup)
   */
  addAvailableSlots(input) {
    const { geo_scope, slots } = input;
    const key = `${geo_scope}_standard`;
    this.available_slots[key] = slots || [];
  }
}

module.exports = { BookingExecutionRuntime };
