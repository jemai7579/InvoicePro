"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTTNMode = exports.getTTNProvider = void 0;
const einvoiceConfig_1 = require("./einvoiceConfig");
const getMode = () => (0, einvoiceConfig_1.getEInvoiceConfig)().mode;
class MockTTNProvider {
    async authenticate() {
        return { accessToken: 'mock-token', mode: 'mock' };
    }
    async submitSignedInvoice({ invoiceId }) {
        return {
            submissionId: `MOCK-SUB-${invoiceId.slice(0, 8).toUpperCase()}-${Date.now()}`,
            status: 'SENT_TO_TTN',
            message: 'TTN integration is not configured yet. Simulation mode enabled.',
            mode: 'mock',
        };
    }
    async getSubmissionStatus({ invoiceId, signedXml, simulationDecision, }) {
        if (!simulationDecision) {
            return {
                status: 'PENDING_TTN',
                message: 'TTN integration is not configured yet. Simulation mode enabled.',
                mode: 'mock',
            };
        }
        if (simulationDecision === 'reject') {
            return {
                status: 'REJECTED_TTN',
                message: 'TTN integration is not configured yet. Simulation mode enabled.',
                rejectionReason: 'Simulation test : numero fiscal client incomplet ou incoherence de donnees.',
                mode: 'mock',
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
            status: 'ACCEPTED_TTN',
            message: 'TTN integration is not configured yet. Simulation mode enabled.',
            ttnReference,
            qrCodeData,
            approvedXmlContent: `${signedXml}\n<!-- MOCK TTN ACCEPTED ${ttnReference} -->`,
            mode: 'mock',
        };
    }
    async downloadTtnProof() {
        return null;
    }
}
class PlaceholderTTNProvider {
    constructor(mode) {
        this.mode = mode;
    }
    async authenticate() {
        (0, einvoiceConfig_1.assertProductionTTNConfigured)();
        throw new Error('TTN_API_NOT_CONFIGURED: Official TTN authentication contract is not implemented yet.');
    }
    async submitSignedInvoice() {
        (0, einvoiceConfig_1.assertProductionTTNConfigured)();
        throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
    }
    async getSubmissionStatus() {
        (0, einvoiceConfig_1.assertProductionTTNConfigured)();
        throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
    }
    async downloadTtnProof() {
        (0, einvoiceConfig_1.assertProductionTTNConfigured)();
        throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
    }
}
const getTTNProvider = () => {
    const mode = getMode();
    return mode === 'mock' ? new MockTTNProvider() : new PlaceholderTTNProvider(mode);
};
exports.getTTNProvider = getTTNProvider;
const getTTNMode = () => getMode();
exports.getTTNMode = getTTNMode;
