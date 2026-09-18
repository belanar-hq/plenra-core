const HOOK_IDS = Object.freeze([
  'mosquito_human_friction_logging_v1',
  'mosquito_bootstrap_kill_criteria_v1'
]);

function createRuntimeHookRegistry(overrides = {}) {
  const handlers = new Map();

  for (const hookId of HOOK_IDS) {
    handlers.set(hookId, overrides[hookId] || null);
  }

  return {
    listHooks() {
      return HOOK_IDS.map((hook_id) => ({
        hook_id,
        active: typeof handlers.get(hook_id) === 'function'
      }));
    },

    registerHook(hookId, handler) {
      if (!HOOK_IDS.includes(hookId) || typeof handler !== 'function') {
        return {
          valid: false,
          status: 'BLOCK',
          reason_codes: ['INVALID_RUNTIME_HOOK_REGISTRATION']
        };
      }

      handlers.set(hookId, handler);
      return {
        valid: true,
        status: 'PASS',
        reason_codes: ['RUNTIME_HOOK_REGISTERED'],
        hook_id: hookId
      };
    },

    executeHook(hookId, { runtime_event_context, execution_state } = {}) {
      if (!HOOK_IDS.includes(hookId)) {
        return {
          valid: false,
          status: 'BLOCK',
          reason_codes: ['UNKNOWN_RUNTIME_HOOK'],
          hook_id: hookId
        };
      }

      const handler = handlers.get(hookId);
      if (!handler) {
        return {
          valid: true,
          status: 'HOLD',
          reason_codes: ['RUNTIME_HOOK_INACTIVE'],
          hook_id: hookId,
          active: false
        };
      }

      if (!runtime_event_context || !execution_state) {
        return {
          valid: false,
          status: 'BLOCK',
          reason_codes: ['MISSING_RUNTIME_HOOK_CONTEXT'],
          hook_id: hookId
        };
      }

      return handler({ runtime_event_context, execution_state });
    }
  };
}

module.exports = {
  HOOK_IDS,
  createRuntimeHookRegistry
};
