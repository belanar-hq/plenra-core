function aggregateFrictionEvents(events) {
  const safeEvents = Array.isArray(events) ? events : [];
  const customerConfusionEvents = safeEvents.filter((event) => (
    event.friction_type === 'CUSTOMER_STUCK' ||
    event.friction_type === 'CONFUSING_QUESTION' ||
    Boolean(event.friction_fields && (
      event.friction_fields.customer_stuck_reason ||
      event.friction_fields.confusing_question_id
    ))
  ));

  const contractorResponseTimes = safeEvents
    .map((event) => event.friction_fields && event.friction_fields.contractor_response_time_minutes)
    .filter((value) => typeof value === 'number');

  const manualNoteCounts = new Map();
  for (const event of safeEvents) {
    const note = event.friction_fields && event.friction_fields.manual_operator_note;
    if (note) {
      manualNoteCounts.set(note, (manualNoteCounts.get(note) || 0) + 1);
    }
  }

  const repeatedManualOperatorNotes = Array.from(manualNoteCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([note, count]) => ({ note, count }));

  return {
    customer_confusion_rate: safeEvents.length === 0 ? 0 : customerConfusionEvents.length / safeEvents.length,
    average_contractor_response_time_minutes: average(contractorResponseTimes),
    repeated_manual_operator_notes: repeatedManualOperatorNotes,
    payment_block_count: countType(safeEvents, 'PAYMENT_BLOCK'),
    booking_failed_count: countType(safeEvents, 'BOOKING_FAILED'),
    trust_drop_count: countType(safeEvents, 'TRUST_DROP'),
    observation_only: true,
    kill_criteria_triggered: false,
    optimization_triggered: false,
    routing_changed: false
  };
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countType(events, frictionType) {
  return events.filter((event) => event.friction_type === frictionType).length;
}

module.exports = {
  aggregateFrictionEvents
};
