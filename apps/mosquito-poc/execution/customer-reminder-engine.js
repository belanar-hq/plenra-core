/**
 * Customer Reminder Engine
 * 
 * Manages customer reminders, post-service follow-up, and seasonal refill reminders.
 * Deterministic: no marketing automation beyond reminders.
 */

class CustomerReminderEngine {
  constructor() {
    this.schema_version = '1.0.0';
    this.reminders = {}; // In-memory storage
  }

  /**
   * Create customer reminder
   * FAIL_CLOSED: Customer no-response returns HOLD
   */
  createCustomerReminder(input) {
    const {
      case_id,
      customer_phone,
      reminder_type,
      scheduled_at,
      message
    } = input;

    if (!case_id || !customer_phone) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['MISSING_CASE_OR_CUSTOMER'],
        error: 'case_id and customer_phone required'
      };
    }

    // FAIL_CLOSED: No response flag returns HOLD
    if (input.customer_no_response) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['CUSTOMER_NO_RESPONSE'],
        error: 'Customer not responding - holding reminder'
      };
    }

    const reminder = {
      reminder_id: `rem_${Date.now()}`,
      case_id,
      customer_phone,
      reminder_type: reminder_type || 'payment_follow_up',
      scheduled_at: scheduled_at || new Date().toISOString(),
      message: message || 'Reminder from mosquito service',
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    this.reminders[reminder.reminder_id] = reminder;

    return {
      success: true,
      status: 'REMINDER_CREATED',
      reminder_id: reminder.reminder_id,
      reminder_type: reminder.reminder_type,
      scheduled_at: reminder.scheduled_at
    };
  }

  /**
   * Create post-service follow-up
   * FAIL_CLOSED: Only after service_completed
   */
  createPostServiceFollowup(input) {
    const {
      case_id,
      customer_phone,
      service_completed
    } = input;

    if (!service_completed) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['SERVICE_NOT_COMPLETED'],
        error: 'Post-service follow-up only allowed after service_completed'
      };
    }

    const followup = {
      followup_id: `fup_${Date.now()}`,
      case_id,
      customer_phone,
      followup_type: 'post_service_satisfaction',
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
      message: 'How was your mosquito service experience?',
      created_at: new Date().toISOString()
    };

    this.reminders[followup.followup_id] = followup;

    return {
      success: true,
      status: 'POST_SERVICE_FOLLOWUP_CREATED',
      followup_id: followup.followup_id,
      scheduled_at: followup.scheduled_at
    };
  }

  /**
   * Schedule seasonal refill reminder
   * FAIL_CLOSED: Only after service_completed
   */
  scheduleSeasonalRefillReminder(input) {
    const {
      case_id,
      customer_phone,
      service_completed
    } = input;

    if (!service_completed) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['SERVICE_NOT_COMPLETED'],
        error: 'Seasonal refill reminder only allowed after service_completed'
      };
    }

    // Schedule reminder for next mosquito season (6 months)
    const nextSeason = new Date();
    nextSeason.setMonth(nextSeason.getMonth() + 6);

    const reminder = {
      reminder_id: `seasonal_${Date.now()}`,
      case_id,
      customer_phone,
      reminder_type: 'seasonal_refill',
      status: 'scheduled',
      scheduled_at: nextSeason.toISOString(),
      message: 'Time for your seasonal mosquito treatment refresh!',
      created_at: new Date().toISOString()
    };

    this.reminders[reminder.reminder_id] = reminder;

    return {
      success: true,
      status: 'SEASONAL_REFILL_REMINDER_SCHEDULED',
      reminder_id: reminder.reminder_id,
      scheduled_for: nextSeason.toISOString()
    };
  }

  /**
   * Get all reminders for a case
   */
  getCaseReminders(case_id) {
    const caseReminders = Object.values(this.reminders).filter(r => r.case_id === case_id);

    return {
      case_id,
      reminder_count: caseReminders.length,
      reminders: caseReminders
    };
  }

  /**
   * Mark reminder as sent
   */
  markReminderSent(reminder_id) {
    if (this.reminders[reminder_id]) {
      this.reminders[reminder_id].status = 'sent';
      this.reminders[reminder_id].sent_at = new Date().toISOString();

      return {
        success: true,
        status: 'REMINDER_MARKED_SENT',
        reminder_id
      };
    }

    return {
      success: false,
      error: 'Reminder not found'
    };
  }
}

module.exports = { CustomerReminderEngine };
