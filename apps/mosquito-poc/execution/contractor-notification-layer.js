/**
 * Contractor Notification Layer
 * 
 * Creates and manages contractor notifications.
 * Notifications only after payment_validated.
 * No adaptive routing.
 */

class ContractorNotificationLayer {
  constructor() {
    this.schema_version = '1.0.0';
    this.notifications = {}; // In-memory storage
  }

  /**
   * Create contractor notification
   * FAIL_CLOSED: Only after payment_validated
   */
  createContractorNotification(input) {
    const {
      booking_id,
      case_id,
      contractor_id,
      customer_phone,
      service_slot,
      geo_scope,
      payment_status
    } = input;

    // FAIL_CLOSED: Notification only after payment_validated
    if (payment_status !== 'payment_validated') {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['PAYMENT_NOT_VALIDATED'],
        error: 'Contractor notification only allowed after payment validation'
      };
    }

    if (!booking_id || !contractor_id || !case_id) {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['MISSING_REQUIRED_FIELDS'],
        error: 'booking_id, contractor_id, and case_id required'
      };
    }

    if (geo_scope !== 'Petah Tikva') {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['OUT_OF_GEO_SCOPE'],
        error: 'Contractor notification outside supported geo scope'
      };
    }

    const notification = {
      notification_id: `notif_${Date.now()}`,
      booking_id,
      case_id,
      contractor_id,
      customer_phone,
      service_slot,
      geo_scope,
      notification_type: 'job_assignment',
      status: 'created',
      created_at: new Date().toISOString(),
      lineage: {
        source: 'payment_validation',
        payment_status: payment_status
      }
    };

    this.notifications[notification.notification_id] = notification;

    return {
      success: true,
      status: 'CONTRACTOR_NOTIFICATION_CREATED',
      notification_id: notification.notification_id,
      booking_id,
      contractor_id,
      service_slot,
      geo_scope,
      created_at: notification.created_at
    };
  }

  /**
   * Get notification by ID
   */
  getNotification(notification_id) {
    return this.notifications[notification_id] || null;
  }

  /**
   * List notifications for contractor
   */
  getContractorNotifications(contractor_id) {
    const contractorNotifications = Object.values(this.notifications)
      .filter(n => n.contractor_id === contractor_id);

    return {
      contractor_id,
      notification_count: contractorNotifications.length,
      notifications: contractorNotifications
    };
  }

  /**
   * Mark notification as sent
   */
  markNotificationSent(notification_id) {
    if (this.notifications[notification_id]) {
      this.notifications[notification_id].status = 'sent';
      this.notifications[notification_id].sent_at = new Date().toISOString();

      return {
        success: true,
        status: 'NOTIFICATION_SENT',
        notification_id
      };
    }

    return {
      success: false,
      error: 'Notification not found'
    };
  }

  /**
   * Mark notification as acknowledged
   */
  markNotificationAcknowledged(notification_id, contractor_id) {
    const notification = this.notifications[notification_id];

    if (!notification) {
      return {
        success: false,
        error: 'Notification not found'
      };
    }

    if (notification.contractor_id !== contractor_id) {
      return {
        success: false,
        error: 'Contractor ID mismatch'
      };
    }

    notification.status = 'acknowledged';
    notification.acknowledged_at = new Date().toISOString();

    return {
      success: true,
      status: 'NOTIFICATION_ACKNOWLEDGED',
      notification_id
    };
  }
}

module.exports = { ContractorNotificationLayer };
