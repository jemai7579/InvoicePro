import { getEInvoiceConfig, assertProductionTTNConfigured } from './einvoiceConfig';

type TTNTransportMode = 'mock' | 'sandbox' | 'production';

export interface TTNSubmissionResult {
  submissionId: string;
  status: 'SENT_TO_TTN' | 'PENDING_TTN';
  message: string;
  mode: TTNTransportMode;
}

export interface TTNStatusResult {
  status: 'PENDING_TTN' | 'ACCEPTED_TTN' | 'REJECTED_TTN';
  message: string;
  ttnReference?: string;
  rejectionReason?: string;
  qrCodeData?: string;
  approvedXmlContent?: string;
  mode: TTNTransportMode;
}

export interface TTNProvider {
  authenticate(): Promise<{ accessToken?: string; mode: 'mock' | 'sandbox' | 'production' }>;
  submitSignedInvoice(params: { invoiceId: string; companyMatricule: string; signedXml: string }): Promise<TTNSubmissionResult>;
  downloadTtnProof(params: { ttnReference: string }): Promise<Buffer | null>;
  getSubmissionStatus(params: {
    invoiceId: string;
    submissionId: string;
    signedXml: string;
    simulationDecision?: 'accept' | 'reject' | null;
  }): Promise<TTNStatusResult>;
}

const getMode = (): TTNTransportMode => getEInvoiceConfig().mode;

class MockTTNProvider implements TTNProvider {
  async authenticate() {
    return { accessToken: 'mock-token', mode: 'mock' as const };
  }

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

  async downloadTtnProof() {
    return null;
  }
}

class PlaceholderTTNProvider implements TTNProvider {
  constructor(private readonly mode: 'sandbox' | 'production') {}

  async authenticate(): Promise<{ accessToken?: string; mode: TTNTransportMode }> {
    assertProductionTTNConfigured();
    throw new Error('TTN_API_NOT_CONFIGURED: Official TTN authentication contract is not implemented yet.');
  }

  async submitSignedInvoice(): Promise<TTNSubmissionResult> {
    assertProductionTTNConfigured();
    throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
  }

  async getSubmissionStatus(): Promise<TTNStatusResult> {
    assertProductionTTNConfigured();
    throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
  }

  async downloadTtnProof(): Promise<Buffer | null> {
    assertProductionTTNConfigured();
    throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
  }
}

export const getTTNProvider = (): TTNProvider => {
  const mode = getMode();
  return mode === 'mock' ? new MockTTNProvider() : new PlaceholderTTNProvider(mode);
};

export const getTTNMode = () => getMode();
