/**
 * Idempotency Store for Mosquito Persistent Layer
 * Prevents duplicate effects from retry operations
 */

const crypto = require('crypto');

class IdempotencyStore {
  constructor(sqlite) {
    this.sqlite = sqlite;
  }

  /**
   * Generate hash of payload for comparison
   * @private
   */
  _generatePayloadHash(payload) {
    const jsonStr = JSON.stringify(payload);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  /**
   * Check if idempotency key exists
   * @param {string} key - Idempotency key
   * @param {string} operationType - Type of operation
   * @param {object} payload - Operation payload
   * @returns {Promise<object|false|string>}
   *   - false if key doesn't exist
   *   - object with result if key exists and payload matches
   *   - 'DUPLICATE_KEY_DIFFERENT_PAYLOAD' if key exists but payload differs
   */
  async checkIdempotency(key, operationType, payload) {
    if (!key) {
      return false;
    }

    try {
      const record = await this.sqlite.getIdempotencyKey(key);

      if (!record) {
        return false;
      }

      // Key exists, check payload hash
      const incomingHash = this._generatePayloadHash(payload);
      const storedHash = record.payload_hash;

      if (incomingHash !== storedHash) {
        return 'DUPLICATE_KEY_DIFFERENT_PAYLOAD';
      }

      // Hash matches, return previous result
      return { result: record.result };
    } catch (error) {
      throw new Error(`Idempotency check failed: ${error.message}`);
    }
  }

  /**
   * Store idempotency key with result
   * @param {string} key - Idempotency key
   * @param {string} operationType - Type of operation
   * @param {object} payload - Operation payload
   * @param {object} result - Operation result
   * @returns {Promise<void>}
   */
  async storeIdempotencyKey(key, operationType, payload, result) {
    if (!key) {
      return;
    }

    const payloadHash = this._generatePayloadHash(payload);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const record = {
      key,
      case_id: payload.case_id || 'unknown',
      operation_type: operationType,
      payload_hash: payloadHash,
      result,
      expires_at: expiresAt,
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    try {
      await this.sqlite.saveIdempotencyKey(record);
    } catch (error) {
      throw new Error(`Failed to store idempotency key: ${error.message}`);
    }
  }

  /**
   * Validate idempotency key exists for operation
   * @param {string} key - Idempotency key
   * @returns {Promise<object>} { valid: boolean, status: PASS|HOLD|BLOCK, reason: string }
   */
  async validateIdempotencyKeyExists(key) {
    if (!key) {
      return {
        valid: false,
        status: 'BLOCK',
        reason: 'MISSING_IDEMPOTENCY_KEY'
      };
    }

    try {
      const record = await this.sqlite.getIdempotencyKey(key);

      if (!record) {
        return {
          valid: false,
          status: 'HOLD',
          reason: 'IDEMPOTENCY_KEY_NOT_STORED'
        };
      }

      // Check if expired
      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        return {
          valid: false,
          status: 'HOLD',
          reason: 'IDEMPOTENCY_KEY_EXPIRED'
        };
      }

      return {
        valid: true,
        status: 'PASS',
        reason: 'KEY_VALID'
      };
    } catch (error) {
      return {
        valid: false,
        status: 'BLOCK',
        reason: `VALIDATION_ERROR: ${error.message}`
      };
    }
  }

  /**
   * Get idempotency key record
   * @param {string} key - Idempotency key
   * @returns {Promise<object|null>}
   */
  async getIdempotencyKey(key) {
    try {
      return await this.sqlite.getIdempotencyKey(key);
    } catch (error) {
      throw new Error(`Failed to get idempotency key: ${error.message}`);
    }
  }
}

module.exports = IdempotencyStore;
