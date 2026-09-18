/**
 * Storage Schema Definitions for Mosquito Persistent Layer
 * Defines strict schemas for all persistent entities
 */

const storageSchema = {
  // Booking entity schema
  booking: {
    table_name: 'bookings',
    required_fields: [
      'id',
      'case_id',
      'customer_phone',
      'booking_status',
      'installation_date',
      'installer_name',
      'trap_count',
      'created_at',
      'updated_at',
      'lineage',
      'reason_codes'
    ],
    optional_fields: [
      'notes',
      'contact_name',
      'address',
      'confirmation_method',
      'reminder_sent_at'
    ],
    validations: {
      booking_status: {
        allowed: [
          'pending',
          'confirmed',
          'completed',
          'cancelled',
          'hold',
          'failed'
        ]
      },
      trap_count: { min: 1, type: 'number' },
      installation_date: { type: 'iso8601' },
      case_id: { type: 'string', required: true }
    }
  },

  // Slot lock entity schema
  slot_lock: {
    table_name: 'slot_locks',
    required_fields: [
      'id',
      'case_id',
      'slot_id',
      'booking_id',
      'lock_status',
      'created_at',
      'updated_at',
      'lineage',
      'reason_codes'
    ],
    optional_fields: [
      'locked_at',
      'unlocked_at',
      'release_reason'
    ],
    validations: {
      lock_status: {
        allowed: [
          'acquired',
          'held',
          'released',
          'conflict',
          'expired'
        ]
      },
      slot_id: { type: 'string', required: true },
      booking_id: { type: 'string', required: true }
    }
  },

  // Payment state entity schema
  payment_state: {
    table_name: 'payments',
    required_fields: [
      'id',
      'case_id',
      'booking_id',
      'payment_status',
      'amount',
      'currency',
      'payment_method',
      'created_at',
      'updated_at',
      'lineage',
      'reason_codes'
    ],
    optional_fields: [
      'payment_proof_hash',
      'proof_upload_time',
      'payment_confirmed_at',
      'payment_failed_reason',
      'retry_count'
    ],
    validations: {
      payment_status: {
        allowed: [
          'pending',
          'proof_requested',
          'proof_uploaded',
          'validated',
          'failed',
          'hold'
        ]
      },
      payment_method: {
        allowed: [
          'manual_confirmation',
          'credit_card_page'
        ]
      },
      amount: { min: 0, type: 'number' },
      currency: { type: 'string', default: 'ILS' }
    }
  },

  // Invoice and receipt lineage schema
  invoice_receipt_lineage: {
    table_name: 'invoice_receipts',
    required_fields: [
      'id',
      'case_id',
      'booking_id',
      'payment_id',
      'invoice_id',
      'receipt_id',
      'provider',
      'status',
      'created_at',
      'updated_at',
      'lineage',
      'reason_codes'
    ],
    optional_fields: [
      'invoice_url',
      'receipt_url',
      'vat_amount',
      'provider_reference_id',
      'reconciliation_status'
    ],
    validations: {
      provider: {
        allowed: [
          'morning',
          'green_invoice',
          'test_provider'
        ]
      },
      status: {
        allowed: [
          'created',
          'issued',
          'confirmed',
          'failed',
          'reconciled'
        ]
      }
    }
  },

  // Field status/lifecycle entity schema
  field_status: {
    table_name: 'field_status',
    required_fields: [
      'id',
      'case_id',
      'field_name',
      'field_lifecycle_stage',
      'current_value',
      'created_at',
      'updated_at',
      'lineage',
      'reason_codes'
    ],
    optional_fields: [
      'previous_value',
      'transition_reason',
      'validated_at'
    ],
    validations: {
      field_lifecycle_stage: {
        allowed: [
          'initialized',
          'in_progress',
          'validated',
          'persisted',
          'completed',
          'rolled_back'
        ]
      }
    }
  },

  // Contractor scheduling entity schema
  contractor_schedule: {
    table_name: 'contractor_schedules',
    required_fields: [
      'id',
      'case_id',
      'contractor_id',
      'contractor_name',
      'assigned_date',
      'scheduled_time_window',
      'schedule_status',
      'created_at',
      'updated_at',
      'lineage',
      'reason_codes'
    ],
    optional_fields: [
      'geo_territory',
      'estimated_duration',
      'completion_time'
    ],
    validations: {
      schedule_status: {
        allowed: [
          'assigned',
          'confirmed',
          'in_progress',
          'completed',
          'cancelled'
        ]
      },
      assigned_date: { type: 'iso8601' }
    }
  },

  // Customer reminder entity schema
  customer_reminder: {
    table_name: 'customer_reminders',
    required_fields: [
      'id',
      'case_id',
      'booking_id',
      'reminder_type',
      'reminder_status',
      'scheduled_send_time',
      'created_at',
      'updated_at',
      'lineage',
      'reason_codes'
    ],
    optional_fields: [
      'sent_at',
      'delivery_status',
      'customer_response',
      'channel'
    ],
    validations: {
      reminder_type: {
        allowed: [
          'booking_confirmation',
          'installation_reminder',
          'renewal_reminder',
          'post_service_feedback'
        ]
      },
      reminder_status: {
        allowed: [
          'scheduled',
          'sent',
          'delivered',
          'failed',
          'cancelled'
        ]
      }
    }
  },

  // Operational event schema
  operational_event: {
    required_fields: [
      'event_id',
      'event_type',
      'case_id',
      'timestamp',
      'actor',
      'payload'
    ],
    optional_fields: [
      'booking_id',
      'payment_id',
      'slot_id',
      'source_system',
      'idempotency_key'
    ],
    validations: {
      event_type: {
        allowed: [
          'booking_created',
          'slot_locked',
          'payment_initiated',
          'payment_validated',
          'invoice_generated',
          'receipt_generated',
          'installation_scheduled',
          'installation_completed',
          'field_updated',
          'reminder_scheduled',
          'state_replayed',
          'migration_snapshot_created'
        ]
      }
    }
  },

  // Idempotency key schema
  idempotency_key: {
    table_name: 'idempotency_keys',
    required_fields: [
      'key',
      'case_id',
      'operation_type',
      'payload_hash',
      'result',
      'created_at'
    ],
    optional_fields: [
      'expires_at',
      'retry_count'
    ],
    validations: {
      key: { type: 'string', required: true },
      operation_type: { type: 'string', required: true },
      payload_hash: { type: 'string', required: true }
    }
  }
};

/**
 * Validate a record against schema
 * @param {string} entityType - Type of entity (booking, payment_state, etc.)
 * @param {object} record - Record to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateRecord(entityType, record) {
  if (!storageSchema[entityType]) {
    return {
      valid: false,
      errors: [`Unknown entity type: ${entityType}`]
    };
  }

  const schema = storageSchema[entityType];
  const errors = [];

  // Check required fields
  for (const field of schema.required_fields) {
    if (!(field in record)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Run custom validations if defined
  if (schema.validations) {
    for (const [field, validation] of Object.entries(schema.validations)) {
      if (field in record) {
        const value = record[field];

        if (validation.allowed && !validation.allowed.includes(value)) {
          errors.push(
            `Invalid value for ${field}: ${value}. Allowed: ${validation.allowed.join(', ')}`
          );
        }

        if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
          errors.push(`Field ${field} must be >= ${validation.min}`);
        }

        if (validation.type === 'iso8601' && !isValidISO8601(value)) {
          errors.push(`Field ${field} must be valid ISO8601 timestamp`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Simple ISO8601 validation
 * @param {string} value - Value to check
 * @returns {boolean}
 */
function isValidISO8601(value) {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
  return iso8601Regex.test(value);
}

module.exports = {
  storageSchema,
  validateRecord,
  isValidISO8601
};
