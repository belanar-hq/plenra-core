/**
 * Migration Snapshot for Mosquito Persistent Layer
 * Manages migration from in-memory to persistent state
 */

const crypto = require('crypto');

class MigrationSnapshot {
  constructor(sqlite, eventLog) {
    this.sqlite = sqlite;
    this.eventLog = eventLog;
  }

  /**
   * Generate hash of entity for integrity check
   * @private
   */
  _generateEntityHash(entity) {
    const jsonStr = JSON.stringify(entity);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  /**
   * Create migration snapshot
   * @param {object} entities - Entities to migrate { bookings, payments, slot_locks, etc. }
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, snapshot_id: string, hashes: object }
   */
  async createMigrationSnapshot(entities) {
    try {
      const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      const hashes = {};
      const caseId = entities.case_id;

      // Generate hashes for all entities
      for (const [entityType, entityData] of Object.entries(entities)) {
        if (entityType === 'case_id') continue;

        if (Array.isArray(entityData)) {
          hashes[entityType] = entityData.map((item) => ({
            id: item.id,
            hash: this._generateEntityHash(item)
          }));
        } else if (typeof entityData === 'object' && entityData !== null) {
          hashes[entityType] = {
            id: entityData.id,
            hash: this._generateEntityHash(entityData)
          };
        }
      }

      // Write migration snapshot event
      await this.eventLog.writeOperationalTransition({
        event_type: 'migration_snapshot_created',
        case_id: caseId,
        actor: 'migration_engine',
        payload: {
          snapshot_id: snapshotId,
          timestamp,
          entities_migrated: Object.keys(entities).filter((k) => k !== 'case_id'),
          hashes
        }
      });

      return {
        status: 'PASS',
        snapshot_id: snapshotId,
        hashes,
        timestamp
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        snapshot_id: null,
        hashes: null,
        error: error.message
      };
    }
  }

  /**
   * Verify migration snapshot integrity
   * @param {string} caseId - Case ID
   * @param {object} entities - Migrated entities
   * @param {object} snapshotHashes - Original hashes from snapshot
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, mismatches: string[] }
   */
  async verifyMigrationIntegrity(caseId, entities, snapshotHashes) {
    const mismatches = [];

    try {
      for (const [entityType, originalHashData] of Object.entries(snapshotHashes)) {
        const currentData = entities[entityType];

        if (!currentData) {
          mismatches.push(`ENTITY_MISSING: ${entityType}`);
          continue;
        }

        if (Array.isArray(currentData)) {
          // Compare array items
          if (!Array.isArray(originalHashData)) {
            mismatches.push(`ENTITY_TYPE_MISMATCH: ${entityType} (expected array, got object)`);
            continue;
          }

          for (const originalItem of originalHashData) {
            const currentItem = currentData.find((i) => i.id === originalItem.id);

            if (!currentItem) {
              mismatches.push(`ENTITY_ITEM_MISSING: ${entityType}[${originalItem.id}]`);
              continue;
            }

            const currentHash = this._generateEntityHash(currentItem);
            if (currentHash !== originalItem.hash) {
              mismatches.push(`ENTITY_HASH_MISMATCH: ${entityType}[${originalItem.id}]`);
            }
          }
        } else if (typeof currentData === 'object') {
          // Compare single object
          if (!originalHashData.id) {
            mismatches.push(`SNAPSHOT_DATA_INVALID: ${entityType}`);
            continue;
          }

          const currentHash = this._generateEntityHash(currentData);
          if (currentHash !== originalHashData.hash) {
            mismatches.push(`ENTITY_HASH_MISMATCH: ${entityType}`);
          }
        }
      }

      const status = mismatches.length > 0 ? 'BLOCK' : 'PASS';

      return {
        status,
        mismatches
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        mismatches: [`VERIFICATION_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Persist entities from snapshot
   * @param {object} entities - Entities to persist
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, persisted: object, errors: string[] }
   */
  async persistEntitiesFromSnapshot(entities) {
    const persisted = {};
    const errors = [];
    const caseId = entities.case_id;

    try {
      // Persist bookings
      if (entities.bookings) {
        for (const booking of (Array.isArray(entities.bookings) ? entities.bookings : [entities.bookings])) {
          try {
            const result = await this.sqlite.saveBooking(booking);
            persisted.bookings = persisted.bookings || [];
            persisted.bookings.push(result);
          } catch (error) {
            errors.push(`BOOKING_PERSIST_ERROR: ${error.message}`);
          }
        }
      }

      // Persist payments
      if (entities.payments) {
        for (const payment of (Array.isArray(entities.payments) ? entities.payments : [entities.payments])) {
          try {
            const result = await this.sqlite.savePaymentState(payment);
            persisted.payments = persisted.payments || [];
            persisted.payments.push(result);
          } catch (error) {
            errors.push(`PAYMENT_PERSIST_ERROR: ${error.message}`);
          }
        }
      }

      // Persist slot locks
      if (entities.slot_locks) {
        for (const lock of (Array.isArray(entities.slot_locks) ? entities.slot_locks : [entities.slot_locks])) {
          try {
            const result = await this.sqlite.saveSlotLock(lock);
            persisted.slot_locks = persisted.slot_locks || [];
            persisted.slot_locks.push(result);
          } catch (error) {
            errors.push(`SLOT_LOCK_PERSIST_ERROR: ${error.message}`);
          }
        }
      }

      // Persist field status
      if (entities.field_status) {
        for (const field of (Array.isArray(entities.field_status) ? entities.field_status : [entities.field_status])) {
          try {
            const result = await this.sqlite.saveFieldStatus(field);
            persisted.field_status = persisted.field_status || [];
            persisted.field_status.push(result);
          } catch (error) {
            errors.push(`FIELD_STATUS_PERSIST_ERROR: ${error.message}`);
          }
        }
      }

      // Persist contractor schedules
      if (entities.contractor_schedules) {
        for (const schedule of (Array.isArray(entities.contractor_schedules) ? entities.contractor_schedules : [entities.contractor_schedules])) {
          try {
            const result = await this.sqlite.saveContractorSchedule(schedule);
            persisted.contractor_schedules = persisted.contractor_schedules || [];
            persisted.contractor_schedules.push(result);
          } catch (error) {
            errors.push(`CONTRACTOR_SCHEDULE_PERSIST_ERROR: ${error.message}`);
          }
        }
      }

      // Persist customer reminders
      if (entities.customer_reminders) {
        for (const reminder of (Array.isArray(entities.customer_reminders) ? entities.customer_reminders : [entities.customer_reminders])) {
          try {
            const result = await this.sqlite.saveCustomerReminder(reminder);
            persisted.customer_reminders = persisted.customer_reminders || [];
            persisted.customer_reminders.push(result);
          } catch (error) {
            errors.push(`CUSTOMER_REMINDER_PERSIST_ERROR: ${error.message}`);
          }
        }
      }

      // Write migration completion event
      await this.eventLog.writeOperationalTransition({
        event_type: 'migration_snapshot_persisted',
        case_id: caseId,
        actor: 'migration_engine',
        payload: {
          persisted_count: Object.values(persisted).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 1), 0),
          error_count: errors.length
        }
      });

      const status = errors.length > 0 ? 'HOLD' : 'PASS';

      return {
        status,
        persisted,
        errors
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        persisted: null,
        errors: [`PERSISTENCE_ERROR: ${error.message}`]
      };
    }
  }

  /**
   * Execute full migration with snapshot
   * @param {object} entities - Entities to migrate
   * @returns {Promise<object>} { status: PASS|HOLD|BLOCK, snapshot_id: string }
   */
  async executeMigration(entities) {
    try {
      // Create snapshot
      const snapshot = await this.createMigrationSnapshot(entities);
      if (snapshot.status !== 'PASS') {
        return {
          status: 'HOLD',
          snapshot_id: null,
          reason: 'SNAPSHOT_CREATION_FAILED'
        };
      }

      // Verify integrity
      const verification = await this.verifyMigrationIntegrity(
        entities.case_id,
        entities,
        snapshot.hashes
      );

      if (verification.status === 'BLOCK') {
        return {
          status: 'BLOCK',
          snapshot_id: snapshot.snapshot_id,
          reason: 'MIGRATION_INTEGRITY_CHECK_FAILED',
          mismatches: verification.mismatches
        };
      }

      // Persist entities
      const persistence = await this.persistEntitiesFromSnapshot(entities);

      return {
        status: persistence.status,
        snapshot_id: snapshot.snapshot_id,
        persisted: persistence.persisted,
        errors: persistence.errors
      };
    } catch (error) {
      return {
        status: 'BLOCK',
        snapshot_id: null,
        reason: `MIGRATION_ERROR: ${error.message}`
      };
    }
  }
}

module.exports = MigrationSnapshot;
