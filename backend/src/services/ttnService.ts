/**
 * Mock Service for Tunisie TradeNet (TTN) Integration
 * In a real-world scenario, this would use axios to communicate with the TTN SOAP or REST API.
 */

export const submitInvoiceToTTN = async (xmlString: string, companyMatricule: string, invoiceId: string): Promise<{ status: 'VALIDATED' | 'REJECTED', message: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Determine success or failure randomly for demonstration purposes.
  // We'll give it an 80% chance of success.
  const isSuccess = Math.random() > 0.2;

  if (isSuccess) {
    return {
      status: 'VALIDATED',
      message: `Invoice ${invoiceId} successfully validated by TTN.`
    };
  } else {
    return {
      status: 'REJECTED',
      message: `Invoice ${invoiceId} rejected by TTN. Error: Invalid tax code structure.`
    };
  }
};
