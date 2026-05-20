/**
 * TTN (Tunisie TradeNet) Integration Service
 *
 * Legacy wrapper kept for older imports. New code should use ttnProvider.ts.
 */
import { getEInvoiceConfig, assertProductionTTNConfigured } from './einvoiceConfig';

export const TTN_SIMULATION_MODE = getEInvoiceConfig().isMockMode;

export const submitInvoiceToTTN = async (
  xmlString: string,
  companyMatricule: string,
  invoiceId: string
): Promise<{ status: 'SENT_TO_TTN' | 'VALIDATED' | 'REJECTED'; message: string; simulationMode: boolean }> => {

  if (TTN_SIMULATION_MODE) {
    // Simulation: return a stable "submitted / pending validation" status.
    // The admin or user can manually update the status once real TTN credentials are configured.
    return {
      status: 'SENT_TO_TTN',
      message: `Facture ${invoiceId} marquée comme envoyée à TTN. ` +
               `Mode simulation actif — configurez les variables TTN_* officielles pour activer la soumission réelle.`,
      simulationMode: true,
    };
  }

  assertProductionTTNConfigured();
  throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
};
