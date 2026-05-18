"use strict";
/**
 * TTN (Tunisie TradeNet) Integration Service
 *
 * PRODUCTION NOTE:
 * To enable real TTN submission, set the following environment variables:
 *   TTN_API_URL  — the base URL of the TradeNet REST/SOAP endpoint
 *   TTN_API_KEY  — the API key issued by TradeNet
 *
 * When these variables are absent, the service runs in SIMULATION MODE and
 * returns a predictable "pending" response instead of sending to TTN.
 * This is safe and transparent — no random failures, no misleading results.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitInvoiceToTTN = exports.TTN_SIMULATION_MODE = void 0;
exports.TTN_SIMULATION_MODE = !process.env.TTN_API_URL || !process.env.TTN_API_KEY;
const submitInvoiceToTTN = async (xmlString, companyMatricule, invoiceId) => {
    if (exports.TTN_SIMULATION_MODE) {
        // Simulation: return a stable "submitted / pending validation" status.
        // The admin or user can manually update the status once real TTN credentials are configured.
        return {
            status: 'SENT_TO_TTN',
            message: `Facture ${invoiceId} marquée comme envoyée à TTN. ` +
                `Mode simulation actif — configurez TTN_API_URL et TTN_API_KEY pour activer la soumission réelle.`,
            simulationMode: true,
        };
    }
    // ── Real TTN submission ──────────────────────────────────────────────────────
    // TODO: Replace with the actual TradeNet API call once credentials are provided.
    // Example axios call structure (uncomment and adapt):
    //
    // const response = await axios.post(
    //   `${process.env.TTN_API_URL}/invoices/submit`,
    //   { xml: xmlString, matricule: companyMatricule },
    //   { headers: { Authorization: `Bearer ${process.env.TTN_API_KEY}` } }
    // );
    // return { status: response.data.status, message: response.data.message, simulationMode: false };
    throw new Error('TTN_API_URL and TTN_API_KEY are set but real integration is not yet implemented. Contact your developer.');
};
exports.submitInvoiceToTTN = submitInvoiceToTTN;
