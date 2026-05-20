"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignatureProvider = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const crypto_1 = __importDefault(require("crypto"));
const einvoiceConfig_1 = require("./einvoiceConfig");
const signer_1 = require("../utils/signer");
class MockSignatureProvider {
    async signTeifXml(xml, company) {
        const config = (0, einvoiceConfig_1.getEInvoiceConfig)();
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
class RealSignatureProvider {
    async signTeifXml(xml, company) {
        (0, einvoiceConfig_1.assertProductionSignatureConfigured)();
        const certPath = process.env.SIGNATURE_CERT_PATH || company.certificatePath;
        const password = process.env.SIGNATURE_CERT_PASSWORD;
        if (!certPath || !password) {
            throw new Error("Impossible de signer : la signature électronique n'est pas configurée.");
        }
        const p12Buffer = await fs_extra_1.default.readFile(certPath);
        const signedXml = (0, signer_1.signXml)({ xmlString: xml, p12Buffer, password });
        const signedAt = new Date().toISOString();
        const certificateIdentifier = process.env.SIGNATURE_CERT_ALIAS || crypto_1.default.createHash('sha256').update(p12Buffer).digest('hex').slice(0, 16);
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
const getSignatureProvider = () => {
    const provider = (process.env.SIGNATURE_PROVIDER || 'mock').toLowerCase();
    return provider === 'mock' ? new MockSignatureProvider() : new RealSignatureProvider();
};
exports.getSignatureProvider = getSignatureProvider;
