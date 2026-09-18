/**
 * WhatsApp Execution Runtime
 * 
 * Orchestrates WhatsApp handoff and contact validation.
 * Handoff allowed only after gate_passed.
 * Uses existing WhatsApp templates if available.
 */

const fs = require('fs');
const path = require('path');

class WhatsAppExecutionRuntime {
  constructor() {
    this.schema_version = '1.0.0';
    this.routing_channel = 'WhatsApp';
  }

  /**
   * Validate WhatsApp contact is present and valid
   * FAIL_CLOSED: Missing contact returns HOLD
   */
  validateWhatsAppContact(input) {
    if (!input.customer_phone || !input.customer_phone.trim()) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['MISSING_WHATSAPP_CONTACT'],
        error: 'WhatsApp contact required'
      };
    }

    // Basic phone format validation
    const phoneRegex = /^\+?[0-9]{1,15}$/;
    if (!phoneRegex.test(input.customer_phone.replace(/[-\s]/g, ''))) {
      return {
        valid: false,
        status: 'HOLD',
        reason_codes: ['INVALID_WHATSAPP_CONTACT_FORMAT'],
        error: 'Invalid WhatsApp phone format'
      };
    }

    return {
      valid: true,
      status: 'CONTACT_VALIDATED',
      customer_phone: input.customer_phone
    };
  }

  /**
   * Create WhatsApp handoff after gate passed
   * FAIL_CLOSED: Only allowed after gate_passed
   */
  createWhatsAppHandoff(input) {
    // Check gate status
    if (input.gate_status !== 'gate_passed') {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['GATE_NOT_PASSED'],
        error: 'WhatsApp handoff only allowed after gate_passed'
      };
    }

    // Validate contact
    const contactValidation = this.validateWhatsAppContact(input);
    if (!contactValidation.valid) {
      return {
        success: false,
        status: contactValidation.status,
        reason_codes: contactValidation.reason_codes,
        error: contactValidation.error
      };
    }

    // Check geo scope
    if (input.geo_scope !== 'Petah Tikva') {
      return {
        success: false,
        status: 'HOLD',
        reason_codes: ['OUT_OF_GEO_SCOPE'],
        error: 'WhatsApp handoff not available in this geo scope'
      };
    }

    return {
      success: true,
      status: 'WHATSAPP_HANDOFF_CREATED',
      handoff_id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      routing_channel: this.routing_channel,
      customer_phone: input.customer_phone,
      case_id: input.case_id,
      geo_scope: input.geo_scope,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Get existing WhatsApp template if available
   */
  getWhatsAppTemplate(templateName) {
    const templatePath = path.join('apps', 'mosquito-poc', 'flows', 'whatsapp-message-templates.md');
    
    if (!fs.existsSync(templatePath)) {
      return {
        found: false,
        template: null
      };
    }

    const content = fs.readFileSync(templatePath, 'utf8');
    
    // Simple template extraction
    if (templateName === 'greeting' && content.includes('Initial Greeting')) {
      return {
        found: true,
        template: 'greeting',
        uses_existing: true
      };
    }

    return {
      found: false,
      template: null
    };
  }
}

module.exports = { WhatsAppExecutionRuntime };
