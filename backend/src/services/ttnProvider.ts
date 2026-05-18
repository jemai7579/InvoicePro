export interface TTNSubmissionResult {
  submissionId: string;
  status: 'SENT_TO_TTN' | 'PENDING_TTN';
  message: string;
  mode: 'mock' | 'webservice' | 'sftp' | 'provider';
}

export interface TTNStatusResult {
  status: 'PENDING_TTN' | 'ACCEPTED_TTN' | 'REJECTED_TTN';
  message: string;
  ttnReference?: string;
  rejectionReason?: string;
  qrCodeData?: string;
  approvedXmlContent?: string;
  mode: 'mock' | 'webservice' | 'sftp' | 'provider';
}

export interface TTNProvider {
  submitSignedInvoice(params: { invoiceId: string; companyMatricule: string; signedXml: string }): Promise<TTNSubmissionResult>;
  getSubmissionStatus(params: {
    invoiceId: string;
    submissionId: string;
    signedXml: string;
    simulationDecision?: 'accept' | 'reject' | null;
  }): Promise<TTNStatusResult>;
}

const getMode = (): 'mock' | 'webservice' | 'sftp' | 'provider' => {
  const mode = (process.env.TTN_MODE || 'mock').toLowerCase();
  if (mode === 'webservice' || mode === 'sftp' || mode === 'provider') return mode;
  return 'mock';
};

class MockTTNProvider implements TTNProvider {
  async submitSignedInvoice({ invoiceId }: { invoiceId: string }) {
    return {
      submissionId: `MOCK-SUB-${invoiceId.slice(0, 8).toUpperCase()}-${Date.now()}`,
      status: 'SENT_TO_TTN' as const,
      message: 'TTN integration is not configured yet. Simulation mode enabled.',
      mode: 'mock' as const,
    };
  }

  async getSubmissionStatus({
    invoiceId,
    signedXml,
    simulationDecision,
  }: {
    invoiceId: string;
    submissionId: string;
    signedXml: string;
    simulationDecision?: 'accept' | 'reject' | null;
  }) {
    if (!simulationDecision) {
      return {
        status: 'PENDING_TTN' as const,
        message: 'TTN integration is not configured yet. Simulation mode enabled.',
        mode: 'mock' as const,
      };
    }

    if (simulationDecision === 'reject') {
      return {
        status: 'REJECTED_TTN' as const,
        message: 'TTN integration is not configured yet. Simulation mode enabled.',
        rejectionReason: 'Simulation test : numero fiscal client incomplet ou incoherence de donnees.',
        mode: 'mock' as const,
      };
    }

    const ttnReference = `TTN-${new Date().getFullYear()}-${invoiceId.slice(0, 8).toUpperCase()}`;
    const qrCodeData = JSON.stringify({
      mode: 'mock',
      invoiceId,
      reference: ttnReference,
      acceptedAt: new Date().toISOString(),
    });

    return {
      status: 'ACCEPTED_TTN' as const,
      message: 'TTN integration is not configured yet. Simulation mode enabled.',
      ttnReference,
      qrCodeData,
      approvedXmlContent: `${signedXml}\n<!-- MOCK TTN ACCEPTED ${ttnReference} -->`,
      mode: 'mock' as const,
    };
  }
}

class PlaceholderTTNProvider implements TTNProvider {
  constructor(private readonly mode: 'webservice' | 'sftp' | 'provider') {}

  async submitSignedInvoice(): Promise<TTNSubmissionResult> {
    // TODO: Implement the real TTN submission transport here for webservice, sftp, or partner provider mode.
    throw new Error(`TTN mode "${this.mode}" is configured but the real connector is not implemented yet.`);
  }

  async getSubmissionStatus(): Promise<TTNStatusResult> {
    // TODO: Implement the real TTN status polling here for webservice, sftp, or partner provider mode.
    throw new Error(`TTN mode "${this.mode}" is configured but the real connector is not implemented yet.`);
  }
}

export const getTTNProvider = (): TTNProvider => {
  const mode = getMode();
  return mode === 'mock' ? new MockTTNProvider() : new PlaceholderTTNProvider(mode);
};

export const getTTNMode = () => getMode();
