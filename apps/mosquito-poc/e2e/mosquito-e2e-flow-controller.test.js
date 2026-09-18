const fs = require('fs');
const path = require('path');
const { MosquitoE2EFlowController } = require('./mosquito-e2e-flow-controller');

const tempDir = path.join(__dirname, '..', '..', 'tmp', 'mosquito-e2e');

function createTempPaths(testName) {
  const safeName = testName.replace(/[^a-z0-9_-]/gi, '_');
  const dbPath = path.join(tempDir, `${safeName}.sqlite`);
  const eventsDir = path.join(tempDir, `${safeName}_events`);
  return { dbPath, eventsDir };
}

beforeAll(() => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
});

afterAll(() => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('Mosquito E2E Storage-Bound Flow', () => {
  it('completes the E2E flow end-to-end with storage and replay verification', async () => {
    const { dbPath, eventsDir } = createTempPaths('complete_flow');
    const controller = new MosquitoE2EFlowController({ dbPath, eventsDir });

    const input = {
      case_id: 'case-123',
      customer_id: 'customer-123',
      geo_scope: 'Petah Tikva',
      idempotency_key: 'flow-123',
      lineage: ['lead_created', 'booking_flow_initiated'],
      reason_codes: ['MOSQUITO_SERVICE_REQUEST']
    };

    const result = await controller.runMosquitoE2EFlow(input);
    expect(result.status).toBe('PASS');
    expect(result.case_id).toBe('case-123');
    expect(result.message).toContain('completed successfully');
  });

  it('blocks missing idempotency key', async () => {
    const { dbPath, eventsDir } = createTempPaths('missing_idempotency');
    const controller = new MosquitoE2EFlowController({ dbPath, eventsDir });

    const input = {
      case_id: 'case-124',
      customer_id: 'customer-124',
      geo_scope: 'Petah Tikva',
      lineage: ['lead_created'],
      reason_codes: ['MOSQUITO_SERVICE_REQUEST']
    };

    const result = await controller.runMosquitoE2EFlow(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('MISSING_IDEMPOTENCY_KEY');
  });

  it('blocks external API call attempts', async () => {
    const { dbPath, eventsDir } = createTempPaths('external_api_block');
    const controller = new MosquitoE2EFlowController({ dbPath, eventsDir });

    const input = {
      case_id: 'case-125',
      customer_id: 'customer-125',
      geo_scope: 'Petah Tikva',
      idempotency_key: 'flow-125',
      external_api_call: true,
      lineage: ['lead_created'],
      reason_codes: ['MOSQUITO_SERVICE_REQUEST']
    };

    const result = await controller.runMosquitoE2EFlow(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('EXTERNAL_API_CALL_ATTEMPTED');
  });

  it('blocks live credit card activation attempts', async () => {
    const { dbPath, eventsDir } = createTempPaths('live_cc_block');
    const controller = new MosquitoE2EFlowController({ dbPath, eventsDir });

    const input = {
      case_id: 'case-126',
      customer_id: 'customer-126',
      geo_scope: 'Petah Tikva',
      idempotency_key: 'flow-126',
      live_credit_card_activation: true,
      lineage: ['lead_created'],
      reason_codes: ['MOSQUITO_SERVICE_REQUEST']
    };

    const result = await controller.runMosquitoE2EFlow(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('LIVE_CREDIT_CARD_ACTIVATION_ATTEMPTED');
  });

  it('blocks adaptive routing attempts', async () => {
    const { dbPath, eventsDir } = createTempPaths('adaptive_routing_block');
    const controller = new MosquitoE2EFlowController({ dbPath, eventsDir });

    const input = {
      case_id: 'case-127',
      customer_id: 'customer-127',
      geo_scope: 'Petah Tikva',
      idempotency_key: 'flow-127',
      adaptive_routing: true,
      lineage: ['lead_created'],
      reason_codes: ['MOSQUITO_SERVICE_REQUEST']
    };

    const result = await controller.runMosquitoE2EFlow(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('ADAPTIVE_ROUTING_ATTEMPTED');
  });

  it('blocks duplicate slot lock when the same slot is already locked', async () => {
    const { dbPath, eventsDir } = createTempPaths('duplicate_slot_lock');
    const controller = new MosquitoE2EFlowController({ dbPath, eventsDir });

    const firstInput = {
      case_id: 'case-128',
      customer_id: 'customer-128',
      geo_scope: 'Petah Tikva',
      idempotency_key: 'flow-128',
      lineage: ['lead_created'],
      reason_codes: ['MOSQUITO_SERVICE_REQUEST']
    };

    const secondInput = {
      case_id: 'case-129',
      customer_id: 'customer-129',
      geo_scope: 'Petah Tikva',
      idempotency_key: 'flow-129',
      lineage: ['lead_created'],
      reason_codes: ['MOSQUITO_SERVICE_REQUEST']
    };

    const firstResult = await controller.runMosquitoE2EFlow(firstInput);
    expect(firstResult.status).toBe('PASS');

    const secondResult = await controller.runMosquitoE2EFlow(secondInput);
    expect(secondResult.status).toBe('BLOCK');
    expect(secondResult.reason_codes).toContain('DUPLICATE_STATE_TRANSITION');
  });
});
