"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitInvoiceToTTN = exports.TTN_SIMULATION_MODE = void 0;
/**
 * TTN (Tunisie TradeNet) Integration Service
 *
 * Legacy wrapper kept for older imports. New code should use ttnProvider.ts.
 */
const einvoiceConfig_1 = require("./einvoiceConfig");
exports.TTN_SIMULATION_MODE = (0, einvoiceConfig_1.getEInvoiceConfig)().isMockMode;
const submitInvoiceToTTN = async (xmlString, companyMatricule, invoiceId) => {
    if (exports.TTN_SIMULATION_MODE) {
        // Simulation: return a stable "submitted / pending validation" status.
        // The admin or user can manually update the status once real TTN credentials are configured.
        return {
            status: 'SENT_TO_TTN',
            message: `Facture ${invoiceId} marquée comme envoyée à TTN. ` +
                `Mode simulation actif — configurez les variables TTN_* officielles pour activer la soumission réelle.`,
            simulationMode: true,
        };
    }
    (0, einvoiceConfig_1.assertProductionTTNConfigured)();
    throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
};
exports.submitInvoiceToTTN = submitInvoiceToTTN;
