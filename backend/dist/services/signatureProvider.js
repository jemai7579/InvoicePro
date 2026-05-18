"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignatureProvider = void 0;
class MockSignatureProvider {
    async signTeifXml(xml, company) {
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
class RealSignatureProvider {
    async signTeifXml() {
        // TODO: Plug the real TunTrust / ANCE signature workflow here once the provider credentials and protocol are confirmed.
        throw new Error('Real electronic signature provider is not configured yet.');
    }
}
const getSignatureProvider = () => {
    const mode = (process.env.TTN_MODE || 'mock').toLowerCase();
    return mode === 'mock' ? new MockSignatureProvider() : new RealSignatureProvider();
};
exports.getSignatureProvider = getSignatureProvider;
