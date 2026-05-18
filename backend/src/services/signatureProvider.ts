import type { Company } from '@prisma/client';

export interface SignatureResult {
  signedXml: string;
  providerLabel: string;
  certificateType: string;
  signedAt: string;
  mode: 'mock' | 'real';
}

export interface SignatureProvider {
  signTeifXml(xml: string, company: Pick<Company, 'name' | 'matriculeFiscal' | 'certificatePath' | 'certificatePassword'>): Promise<SignatureResult>;
}

class MockSignatureProvider implements SignatureProvider {
  async signTeifXml(xml: string, company: Pick<Company, 'name' | 'matriculeFiscal'>): Promise<SignatureResult> {
    const signedAt = new Date().toISOString();
    const signatureBlock = `
<!-- MOCK SIGNATURE START -->
<MockSignature>
  <Provider>MockSignatureProvider</Provider>
  <Company>${company.name}</Company>
  <FiscalId>${company.matriculeFiscal}</FiscalId>
  <SignedAt>${signedAt}</SignedAt>
</MockSignature>
<!-- MOCK SIGNATURE END -->
`;

    return {
      signedXml: `${xml}\n${signatureBlock}`,
      providerLabel: process.env.SIGNATURE_PROVIDER_NAME || 'TunTrust / ANCE',
      certificateType: process.env.SIGNATURE_CERT_TYPE || 'USB token',
      signedAt,
      mode: 'mock',
    };
  }
}

class RealSignatureProvider implements SignatureProvider {
  async signTeifXml(): Promise<SignatureResult> {
    // TODO: Plug the real TunTrust / ANCE signature workflow here once the provider credentials and protocol are confirmed.
    throw new Error('Real electronic signature provider is not configured yet.');
  }
}

export const getSignatureProvider = (): SignatureProvider => {
  const mode = (process.env.TTN_MODE || 'mock').toLowerCase();
  return mode === 'mock' ? new MockSignatureProvider() : new RealSignatureProvider();
};
