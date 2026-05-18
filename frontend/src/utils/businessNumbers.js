export const getFallbackVisibleNumber = (id = '') => (id ? id.slice(0, 8).toUpperCase() : '');

export const getInvoiceNumber = (invoice = {}) =>
  invoice.number || invoice.invoiceNumber || getFallbackVisibleNumber(invoice.id);

export const getDevisNumber = (devis = {}) =>
  devis.number || devis.devisNumber || getFallbackVisibleNumber(devis.id);

export const getClientNumber = (client = {}) =>
  client.number || getFallbackVisibleNumber(client.id);

export const getProjectNumber = (project = {}) =>
  project.projectReference || getFallbackVisibleNumber(project.id);

export const sanitizeBusinessNumberForFileName = (value = '') => value.replace(/[^\w-]/g, '_');
