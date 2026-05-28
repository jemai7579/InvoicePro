import { create } from 'xmlbuilder2';
import { getInvoiceVisibleNumber } from '../services/numberingService';

const round3 = (value: number) => Number(Number(value || 0).toFixed(3));
const validTvaRates = [0, 7, 13, 19];
const matriculeFiscalPattern = /^(\d{7}\/[A-Z]\/[A-Z]\/[A-Z]\/\d{3}|\d{7}[A-Z]{3}\d{3})$/;
export const TUNISIAN_MATRICULE_FISCAL_FORMAT_HELP = 'Format attendu : 1234567/A/B/C/000 ou 1234567ABC000.';

export const normalizeTunisianMatriculeFiscal = (value?: string | null) =>
  String(value || '')
    .trim()
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u034F\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    .replace(/[⁄∕／]/g, '/')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, '')
    .toUpperCase();

export const validateTunisianMatriculeFiscal = (value?: string | null) => {
  const normalizedValue = normalizeTunisianMatriculeFiscal(value);
  return Boolean(normalizedValue && matriculeFiscalPattern.test(normalizedValue));
};

export const validateTeifInvoiceData = (invoice: any) => {
  const errors: string[] = [];
  const company = invoice.company || {};
  const client = invoice.client || {};
  const lines = invoice.lines || [];

  if (!invoice.number) errors.push('Le numero officiel de facture est requis.');
  if (!invoice.createdAt || Number.isNaN(new Date(invoice.createdAt).getTime())) errors.push('La date de facture est invalide.');

  if (!company.name) errors.push("La raison sociale de l'emetteur est requise.");
  if (!company.address) errors.push("L'adresse de l'emetteur est requise.");
  const companyMatriculeFiscal = normalizeTunisianMatriculeFiscal(company.matriculeFiscal);
  const clientMatriculeFiscal = normalizeTunisianMatriculeFiscal(client.matriculeFiscal);

  if (!companyMatriculeFiscal) {
    errors.push(
      `Pour continuer le workflow TEIF/TTN, veuillez compléter le matricule fiscal de votre entreprise dans Paramètres > Profil Entreprise. ${TUNISIAN_MATRICULE_FISCAL_FORMAT_HELP}`
    );
  } else if (!validateTunisianMatriculeFiscal(companyMatriculeFiscal)) {
    errors.push(
      `Le matricule fiscal de votre entreprise est invalide. Corrigez-le dans Paramètres > Profil Entreprise. ${TUNISIAN_MATRICULE_FISCAL_FORMAT_HELP}`
    );
  }

  if (!client.name) errors.push('Le nom du client est requis.');
  if (!client.address) errors.push("L'adresse du client est requise.");
  if (!clientMatriculeFiscal) {
    errors.push(
      `Pour continuer le workflow TEIF/TTN, veuillez compléter le matricule fiscal du client dans Clients > Modifier client. ${TUNISIAN_MATRICULE_FISCAL_FORMAT_HELP}`
    );
  } else if (!validateTunisianMatriculeFiscal(clientMatriculeFiscal)) {
    errors.push(
      `Le matricule fiscal du client est invalide. Corrigez-le dans Clients > Modifier client. ${TUNISIAN_MATRICULE_FISCAL_FORMAT_HELP}`
    );
  }

  if (!lines.length) errors.push('Ajoutez au moins une ligne de facture.');

  let computedHT = 0;
  let computedTVA = 0;
  lines.forEach((line: any, index: number) => {
    const prefix = `Ligne ${index + 1}`;
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    const tvaRate = Number(line.tvaRate);
    const lineHT = round3(quantity * unitPrice);

    if (!String(line.description || '').trim()) errors.push(`${prefix}: description requise.`);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push(`${prefix}: quantite invalide.`);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push(`${prefix}: prix unitaire invalide.`);
    if (!validTvaRates.includes(tvaRate)) errors.push(`${prefix}: taux TVA invalide.`);
    if (round3(Number(line.totalHT)) !== lineHT) errors.push(`${prefix}: total HT incoherent.`);

    computedHT += lineHT;
    computedTVA += round3(lineHT * (tvaRate / 100));
  });

  const stampDuty = round3(Number(invoice.stampDuty || 0));
  const withholdingTax = round3(Number(invoice.withholdingTax || 0));
  const totalHT = round3(computedHT);
  const totalTVA = round3(computedTVA);
  const totalTTC = round3(totalHT + totalTVA);
  const netToPay = round3(totalTTC + stampDuty - withholdingTax);

  if (round3(Number(invoice.totalHT)) !== totalHT) errors.push('Total HT incoherent avec les lignes.');
  if (round3(Number(invoice.totalTVA)) !== totalTVA) errors.push('Total TVA incoherent avec les lignes.');
  if (round3(Number(invoice.totalTTC)) !== totalTTC) errors.push('Total TTC incoherent avec HT + TVA.');
  if (round3(Number(invoice.netToPay)) !== netToPay) errors.push('Net a payer incoherent avec TTC + timbre - retenue.');

  return { valid: errors.length === 0, errors };
};

export const generateTeifXml = (invoice: any) => {
  const validation = validateTeifInvoiceData(invoice);
  if (!validation.valid) throw new Error(validation.errors.join(' '));

  const xmlObj = {
    Invoice: {
      '@xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      '@xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      '@xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      
      'ext:UBLExtensions': {
        'ext:UBLExtension': {
          'ext:ExtensionContent': {
            'ds:Signature': {
              '@Id': 'Signature',
              'ds:SignedInfo': {
                'ds:CanonicalizationMethod': { '@Algorithm': 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315' },
                'ds:SignatureMethod': { '@Algorithm': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256' },
                'ds:Reference': {
                  '@URI': '',
                  'ds:Transforms': {
                    'ds:Transform': { '@Algorithm': 'http://www.w3.org/2000/09/xmldsig#enveloped-signature' }
                  },
                  'ds:DigestMethod': { '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256' },
                  'ds:DigestValue': '' // To be filled optionally by actual signers later
                }
              },
              'ds:SignatureValue': '', // To be filled
              'ds:KeyInfo': {
                'ds:X509Data': {
                  'ds:X509Certificate': '' // To be filled
                }
              }
            }
          }
        }
      },

      // Document Metadata
      'cbc:ID': getInvoiceVisibleNumber(invoice),
      'cbc:IssueDate': new Date(invoice.createdAt).toISOString().split('T')[0],
      'cbc:InvoiceTypeCode': '380', // Commercial Invoice
      'cbc:DocumentCurrencyCode': 'TND',
      
      // Supplier (Company)
      'cac:AccountingSupplierParty': {
        'cac:Party': {
          'cac:PartyIdentification': {
            'cbc:ID': normalizeTunisianMatriculeFiscal(invoice.company.matriculeFiscal)
          },
          'cac:PartyName': {
            'cbc:Name': invoice.company.name
          },
          'cac:PostalAddress': {
            'cbc:StreetName': invoice.company.address,
            'cbc:CityName': invoice.company.city || '',
            'cbc:PostalZone': invoice.company.zipCode || '',
            'cac:Country': {
              'cbc:IdentificationCode': 'TN',
              'cbc:Name': invoice.company.country || 'Tunisie'
            }
          },
          'cac:Contact': {
            'cbc:Telephone': invoice.company.phone || '',
            'cbc:ElectronicMail': invoice.company.email || ''
          }
        }
      },

      // Customer (Client)
      'cac:AccountingCustomerParty': {
        'cac:Party': {
          'cac:PartyIdentification': {
            'cbc:ID': normalizeTunisianMatriculeFiscal(invoice.client.matriculeFiscal) || 'NOT_PROVIDED'
          },
          'cac:PartyName': {
            'cbc:Name': invoice.client.name
          },
          'cac:PostalAddress': {
            'cbc:StreetName': invoice.client.address || '',
            'cbc:CityName': invoice.client.city || '',
            'cbc:PostalZone': invoice.client.zipCode || '',
            'cac:Country': {
              'cbc:IdentificationCode': 'TN',
              'cbc:Name': invoice.client.country || 'Tunisie'
            }
          },
          'cac:Contact': {
            'cbc:Telephone': invoice.client.phone || '',
            'cbc:ElectronicMail': invoice.client.email || ''
          }
        }
      },

      // Payment Terms
      'cac:PaymentMeans': {
        'cbc:PaymentMeansCode': '10',
        'cbc:InstructionNote': 'Paiement en espece'
      },
      'cac:PaymentTerms': {
        'cbc:Note': 'Paiement en espece'
      },

      // Tax Totals
      'cac:TaxTotal': [
        // VAT Total
        {
          'cbc:TaxAmount': {
            '@currencyID': 'TND',
            '#': invoice.totalTVA.toFixed(3)
          },
          'cac:TaxSubtotal': {
            'cbc:TaxableAmount': { '@currencyID': 'TND', '#': invoice.totalHT.toFixed(3) },
            'cbc:TaxAmount': { '@currencyID': 'TND', '#': invoice.totalTVA.toFixed(3) },
            'cac:TaxCategory': {
              'cbc:ID': 'S',
              'cac:TaxScheme': { 'cbc:ID': 'VAT' }
            }
          }
        },
        // Stamp Duty (Droit de Timbre)
        {
          'cbc:TaxAmount': {
            '@currencyID': 'TND',
            '#': (invoice.stampDuty || 1.000).toFixed(3)
          },
          'cac:TaxSubtotal': {
            'cbc:TaxableAmount': { '@currencyID': 'TND', '#': (invoice.stampDuty || 1.000).toFixed(3) },
            'cbc:TaxAmount': { '@currencyID': 'TND', '#': (invoice.stampDuty || 1.000).toFixed(3) },
            'cac:TaxCategory': {
              'cbc:ID': 'OTH', // Other taxes for Stamp Duty
              'cac:TaxScheme': { 'cbc:ID': 'STAMP' }
            }
          }
        }
      ],

      // Legal Monetary Total
      'cac:LegalMonetaryTotal': {
        'cbc:LineExtensionAmount': {
          '@currencyID': 'TND',
          '#': invoice.totalHT.toFixed(3)
        },
        'cbc:TaxExclusiveAmount': {
          '@currencyID': 'TND',
          '#': invoice.totalHT.toFixed(3)
        },
        'cbc:TaxInclusiveAmount': {
          '@currencyID': 'TND',
          '#': (invoice.totalTTC + (invoice.stampDuty || 1.000)).toFixed(3)
        },
        'cbc:PayableRoundingAmount': {
          '@currencyID': 'TND',
          '#': (invoice.stampDuty || 1.000).toFixed(3)
        },
        'cbc:PayableAmount': {
          '@currencyID': 'TND',
          '#': invoice.netToPay.toFixed(3)
        }
      },

      // Invoice Lines
      'cac:InvoiceLine': invoice.lines.map((line: any, index: number) => ({
        'cbc:ID': (index + 1).toString(),
        'cbc:InvoicedQuantity': {
          '@unitCode': 'EA',
          '#': line.quantity.toString()
        },
        'cbc:LineExtensionAmount': {
          '@currencyID': 'TND',
          '#': line.totalHT.toFixed(3)
        },
        'cac:Item': {
          'cbc:Description': line.description,
          'cbc:Name': line.description,
          'cac:ClassifiedTaxCategory': {
            'cbc:ID': 'S',
            'cbc:Percent': line.tvaRate.toString(),
            'cac:TaxScheme': {
              'cbc:ID': 'VAT'
            }
          }
        },
        'cac:Price': {
          'cbc:PriceAmount': {
            '@currencyID': 'TND',
            '#': line.unitPrice.toFixed(3)
          }
        }
      }))
    }
  };

  const doc = create(xmlObj);
  let xmlString = doc.end({ prettyPrint: true });

  return xmlString;
};
