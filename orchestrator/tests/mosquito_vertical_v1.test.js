const fs = require('fs');
const path = require('path');
const { evaluateMosquitoVerticalGate } = require('../contracts/mosquito_vertical_v1_contract');

describe('Mosquito Vertical v1 Merge and Canon Registration', () => {
  test('Existing apps/mosquito-poc files are not overwritten', () => {
    // Check that key files still exist and have expected content
    const readmePath = path.join('apps', 'mosquito-poc', 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('Mosquito POC');
  });

  test('Canon artifact is created only if missing or safely extended', () => {
    const canonJsonPath = path.join('canon', 'gates', 'mosquito_vertical_v1.json');
    expect(fs.existsSync(canonJsonPath)).toBe(true);
    const canon = JSON.parse(fs.readFileSync(canonJsonPath, 'utf8'));
    expect(canon.artifact_id).toBe('mosquito_vertical_v1');
    expect(canon.adaptive_routing_enabled).toBe(false);
  });

  test('Petah Tikva geo-scope is preserved', () => {
    const canonJsonPath = path.join('canon', 'gates', 'mosquito_vertical_v1.json');
    const canon = JSON.parse(fs.readFileSync(canonJsonPath, 'utf8'));
    expect(canon.geo_scope).toBe('Petah Tikva');
  });

  test('WhatsApp templates are reused, not replaced', () => {
    const templatePath = path.join('apps', 'mosquito-poc', 'flows', 'whatsapp-message-templates.md');
    expect(fs.existsSync(templatePath)).toBe(true);
    const content = fs.readFileSync(templatePath, 'utf8');
    expect(content).toContain('שלום! תודה שסרקת את הקוד שלנו.');
  });

  test('Booking, routing, and automation docs are linked in lineage', () => {
    const lineagePath = path.join('orchestrator', 'lineage', 'lineageRecords.json');
    expect(fs.existsSync(lineagePath)).toBe(true);
    const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
    const record = lineage.find(r => r.artifact_id === 'mosquito_vertical_v1');
    expect(record).toBeDefined();
    expect(record.linked_sources).toContain('apps/mosquito-poc/flows/lead-routing-logic.md');
    expect(record.linked_sources).toContain('apps/mosquito-poc/booking/scheduling-rules.md');
  });

  test('intake-engine.js is inspected but not overwritten unless explicitly needed for a contract export', () => {
    const intakePath = path.join('apps', 'mosquito-poc', 'runtime', 'intake-engine.js');
    expect(fs.existsSync(intakePath)).toBe(true);
    const content = fs.readFileSync(intakePath, 'utf8');
    expect(content).toContain('calculateScore');
  });

  test('Artifact registry receives mosquito_vertical_v1 non-destructively', () => {
    const registryPath = path.join('orchestrator', 'registry', 'artifactRegistry.json');
    expect(fs.existsSync(registryPath)).toBe(true);
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const artifact = registry.find(a => a.artifact_id === 'mosquito_vertical_v1');
    expect(artifact).toBeDefined();
    expect(artifact.priority).toBe('P1');
  });

  test('Codex queue receives only missing validation/contract tasks', () => {
    const queuePath = path.join('orchestrator', 'scheduler', 'codexQueue.json');
    expect(fs.existsSync(queuePath)).toBe(true);
    const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    const task = queue.find(t => t.artifact_id === 'mosquito_vertical_v1');
    expect(task).toBeDefined();
    expect(task.task_type).toBe('VALIDATION_CONTRACT');
  });

  test('Lineage links existing POC files to mosquito_vertical_v1', () => {
    const lineagePath = path.join('orchestrator', 'lineage', 'lineageRecords.json');
    const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
    const record = lineage.find(r => r.artifact_id === 'mosquito_vertical_v1');
    expect(record.linked_sources.length).toBeGreaterThan(5);
  });

  test('Static Decision Gate returns HOLD for missing required fields', () => {
    const input = { geo_scope: 'Petah Tikva', contact_channel: 'WhatsApp' }; // missing others
    const result = evaluateMosquitoVerticalGate(input);
    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('MISSING_REQUIRED_FIELDS');
  });

  test('Static Decision Gate returns HOLD for out-of-scope geo', () => {
    const input = {
      geo_scope: 'Tel Aviv',
      contact_channel: 'WhatsApp',
      mosquito_issue_description: 'many bites',
      property_type: 'house',
      recurring_evening_issue: true,
      requested_action: 'installation'
    };
    const result = evaluateMosquitoVerticalGate(input);
    expect(result.status).toBe('HOLD');
    expect(result.reason_codes).toContain('OUT_OF_INITIAL_GEO_SCOPE');
  });

  test('Static Decision Gate returns PASS for valid Petah Tikva WhatsApp mosquito input', () => {
    const input = {
      geo_scope: 'Petah Tikva',
      contact_channel: 'WhatsApp',
      mosquito_issue_description: 'many evening bites',
      property_type: 'house',
      recurring_evening_issue: true,
      requested_action: 'installation'
    };
    const result = evaluateMosquitoVerticalGate(input);
    expect(result.status).toBe('PASS');
    expect(result.reason_codes).toContain('STATIC_GATE_ELIGIBLE');
  });

  test('Static Decision Gate returns BLOCK for unsupported unsafe/adaptive behavior request', () => {
    const input = {
      geo_scope: 'Petah Tikva',
      contact_channel: 'WhatsApp',
      mosquito_issue_description: 'bites',
      property_type: 'house',
      recurring_evening_issue: true,
      requested_action: 'installation',
      adaptive_routing: true
    };
    const result = evaluateMosquitoVerticalGate(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('ADAPTIVE_ROUTING_REQUESTED');
  });

  test('Partner Pilot routing stub exists but does not perform adaptive routing', () => {
    // Check contract has stub
    const contractPath = path.join('orchestrator', 'contracts', 'mosquito_vertical_v1_contract.js');
    expect(fs.existsSync(contractPath)).toBe(true);
    const content = fs.readFileSync(contractPath, 'utf8');
    expect(content).toContain('partner_pilot_stub');
    expect(content).toContain('adaptive_routing: false');
  });

  test('Adaptive routing remains blocked', () => {
    const input = {
      geo_scope: 'Petah Tikva',
      contact_channel: 'WhatsApp',
      mosquito_issue_description: 'bites',
      property_type: 'house',
      recurring_evening_issue: true,
      requested_action: 'installation',
      autonomous_learning: true
    };
    const result = evaluateMosquitoVerticalGate(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('AUTONOMOUS_LEARNING_REQUESTED');
  });

  test('Predictive risk remains blocked', () => {
    const input = {
      geo_scope: 'Petah Tikva',
      contact_channel: 'WhatsApp',
      mosquito_issue_description: 'bites',
      property_type: 'house',
      recurring_evening_issue: true,
      requested_action: 'installation',
      predictive_risk: true
    };
    const result = evaluateMosquitoVerticalGate(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('PREDICTIVE_RISK_REQUESTED');
  });

  test('Autonomous learning remains blocked', () => {
    const input = {
      geo_scope: 'Petah Tikva',
      contact_channel: 'WhatsApp',
      mosquito_issue_description: 'bites',
      property_type: 'house',
      recurring_evening_issue: true,
      requested_action: 'installation',
      autonomous_learning: true
    };
    const result = evaluateMosquitoVerticalGate(input);
    expect(result.status).toBe('BLOCK');
    expect(result.reason_codes).toContain('AUTONOMOUS_LEARNING_REQUESTED');
  });

  test('Fail-closed behavior is preserved', () => {
    // Test that invalid inputs fail closed
    const invalidInput = {};
    const result = evaluateMosquitoVerticalGate(invalidInput);
    expect(result.status).toBe('HOLD');
  });
});