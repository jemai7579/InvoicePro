export const STATUS_ALIASES = {
  TTN_ACCEPTED: 'ACCEPTED_TTN',
  FINALIZED: 'ACCEPTED_TTN',
  SUBMITTED_TO_TTN: 'SENT_TO_TTN',
  TTN_PROCESSING: 'PENDING_TTN',
  TTN_REJECTED: 'REJECTED_TTN',
};

export const normalizeStatus = (status) => STATUS_ALIASES[status] || status;

// TODO: add a dedicated backend data migration once old and new status values are fully inventoried.
