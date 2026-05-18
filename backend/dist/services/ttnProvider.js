"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTTNMode = exports.getTTNProvider = void 0;
const getMode = () => {
    const mode = (process.env.TTN_MODE || 'mock').toLowerCase();
    if (mode === 'webservice' || mode === 'sftp' || mode === 'provider')
        return mode;
    return 'mock';
};
class MockTTNProvider {
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
}
class PlaceholderTTNProvider {
    constructor(mode) {
        this.mode = mode;
    }
    async submitSignedInvoice() {
        // TODO: Implement the real TTN submission transport here for webservice, sftp, or partner provider mode.
        throw new Error(`TTN mode "${this.mode}" is configured but the real connector is not implemented yet.`);
    }
    async getSubmissionStatus() {
        // TODO: Implement the real TTN status polling here for webservice, sftp, or partner provider mode.
        throw new Error(`TTN mode "${this.mode}" is configured but the real connector is not implemented yet.`);
    }
}
const getTTNProvider = () => {
    const mode = getMode();
    return mode === 'mock' ? new MockTTNProvider() : new PlaceholderTTNProvider(mode);
};
exports.getTTNProvider = getTTNProvider;
const getTTNMode = () => getMode();
exports.getTTNMode = getTTNMode;
