import { create } from 'xmlbuilder2';
import { getInvoiceVisibleNumber } from '../services/numberingService';

export const generateTeifXml = (invoice: any) => {
  // Validate basic requirements before generation
  if (!invoice.company.matriculeFiscal) throw new Error('Company Matricule Fiscal is missing');
  if (!invoice.client) throw new Error('Client information is missing');
  if (!invoice.lines || invoice.lines.length === 0) throw new Error('Invoice must have at least one line');

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
            'cbc:ID': invoice.company.matriculeFiscal
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
            'cbc:ID': invoice.client.matriculeFiscal || 'NOT_PROVIDED'
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
