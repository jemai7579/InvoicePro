import type { Company } from '@prisma/client';
import fs from 'fs-extra';
import crypto from 'crypto';
import { getEInvoiceConfig, assertProductionSignatureConfigured } from './einvoiceConfig';
import { signXml } from '../utils/signer';

export interface SignatureResult {
  signedXml: string;
  providerLabel: string;
  certificateType: string;
  signedAt: string;
  mode: 'mock' | 'real';
  certificateIdentifier?: string | null;
  verified?: boolean;
}

export interface SignatureProvider {
  signTeifXml(xml: string, company: Pick<Company, 'name' | 'matriculeFiscal' | 'certificatePath' | 'certificatePassword'>): Promise<SignatureResult>;
}

class MockSignatureProvider implements SignatureProvider {
  async signTeifXml(xml: string, company: Pick<Company, 'name' | 'matriculeFiscal'>): Promise<SignatureResult> {
    const config = getEInvoiceConfig();
    if (!config.isMockMode) {
      throw new Error("Impossible de signer : la signature électronique n'est pas configurée.");
    }
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
      certificateIdentifier: 'MOCK_CERTIFICATE_NO_LEGAL_VALUE',
      verified: true,
    };
  }
}

class RealSignatureProvider implements SignatureProvider {
  async signTeifXml(xml: string, company: Pick<Company, 'name' | 'matriculeFiscal' | 'certificatePath' | 'certificatePassword'>): Promise<SignatureResult> {
    assertProductionSignatureConfigured();

    const certPath = process.env.SIGNATURE_CERT_PATH || company.certificatePath;
    const password = process.env.SIGNATURE_CERT_PASSWORD;
    if (!certPath || !password) {
      throw new Error("Impossible de signer : la signature électronique n'est pas configurée.");
    }

    const p12Buffer = await fs.readFile(certPath);
    const signedXml = signXml({ xmlString: xml, p12Buffer, password });
    const signedAt = new Date().toISOString();
    const certificateIdentifier =
      process.env.SIGNATURE_CERT_ALIAS || crypto.createHash('sha256').update(p12Buffer).digest('hex').slice(0, 16);

    return {
      signedXml,
      providerLabel: process.env.SIGNATURE_PROVIDER || 'configured-certificate',
      certificateType: 'PKCS#12',
      signedAt,
      mode: 'real',
      certificateIdentifier,
      verified: signedXml.includes('<ds:SignatureValue>') || signedXml.includes('<ds:SignatureValue'),
    };
  }
}

export const getSignatureProvider = (): SignatureProvider => {
  const provider = (process.env.SIGNATURE_PROVIDER || 'mock').toLowerCase();
  return provider === 'mock' ? new MockSignatureProvider() : new RealSignatureProvider();
};
