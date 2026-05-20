"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTeifXml = exports.validateTeifInvoiceData = exports.validateTunisianMatriculeFiscal = void 0;
const xmlbuilder2_1 = require("xmlbuilder2");
const numberingService_1 = require("../services/numberingService");
const round3 = (value) => Number(Number(value || 0).toFixed(3));
const validTvaRates = [0, 7, 13, 19];
const matriculeFiscalPattern = /^(\d{7,8}\/[A-Z]\/[A-Z]\/[A-Z]\/\d{3}|\d{7,8}[A-Z]{3}\d{3}|\d{7,8}[A-Z]?(\/[A-Z0-9]+)?)$/i;
const validateTunisianMatriculeFiscal = (value) => Boolean(value && matriculeFiscalPattern.test(String(value).trim()));
exports.validateTunisianMatriculeFiscal = validateTunisianMatriculeFiscal;
const validateTeifInvoiceData = (invoice) => {
    const errors = [];
    const company = invoice.company || {};
    const client = invoice.client || {};
    const lines = invoice.lines || [];
    if (!invoice.number)
        errors.push('Le numero officiel de facture est requis.');
    if (!invoice.createdAt || Number.isNaN(new Date(invoice.createdAt).getTime()))
        errors.push('La date de facture est invalide.');
    if (!company.name)
        errors.push("La raison sociale de l'emetteur est requise.");
    if (!company.address)
        errors.push("L'adresse de l'emetteur est requise.");
    if (!(0, exports.validateTunisianMatriculeFiscal)(company.matriculeFiscal)) {
        errors.push("Le matricule fiscal de l'emetteur est invalide ou manquant.");
    }
    if (!client.name)
        errors.push('Le nom du client est requis.');
    if (!client.address)
        errors.push("L'adresse du client est requise.");
    if (client.matriculeFiscal && !(0, exports.validateTunisianMatriculeFiscal)(client.matriculeFiscal)) {
        errors.push('Le matricule fiscal du client est invalide.');
    }
    if (!lines.length)
        errors.push('Ajoutez au moins une ligne de facture.');
    let computedHT = 0;
    let computedTVA = 0;
    lines.forEach((line, index) => {
        const prefix = `Ligne ${index + 1}`;
        const quantity = Number(line.quantity);
        const unitPrice = Number(line.unitPrice);
        const tvaRate = Number(line.tvaRate);
        const lineHT = round3(quantity * unitPrice);
        if (!String(line.description || '').trim())
            errors.push(`${prefix}: description requise.`);
        if (!Number.isFinite(quantity) || quantity <= 0)
            errors.push(`${prefix}: quantite invalide.`);
        if (!Number.isFinite(unitPrice) || unitPrice < 0)
            errors.push(`${prefix}: prix unitaire invalide.`);
        if (!validTvaRates.includes(tvaRate))
            errors.push(`${prefix}: taux TVA invalide.`);
        if (round3(Number(line.totalHT)) !== lineHT)
            errors.push(`${prefix}: total HT incoherent.`);
        computedHT += lineHT;
        computedTVA += round3(lineHT * (tvaRate / 100));
    });
    const stampDuty = round3(Number(invoice.stampDuty || 0));
    const withholdingTax = round3(Number(invoice.withholdingTax || 0));
    const totalHT = round3(computedHT);
    const totalTVA = round3(computedTVA);
    const totalTTC = round3(totalHT + totalTVA);
    const netToPay = round3(totalTTC + stampDuty - withholdingTax);
    if (round3(Number(invoice.totalHT)) !== totalHT)
        errors.push('Total HT incoherent avec les lignes.');
    if (round3(Number(invoice.totalTVA)) !== totalTVA)
        errors.push('Total TVA incoherent avec les lignes.');
    if (round3(Number(invoice.totalTTC)) !== totalTTC)
        errors.push('Total TTC incoherent avec HT + TVA.');
    if (round3(Number(invoice.netToPay)) !== netToPay)
        errors.push('Net a payer incoherent avec TTC + timbre - retenue.');
    return { valid: errors.length === 0, errors };
};
exports.validateTeifInvoiceData = validateTeifInvoiceData;
const generateTeifXml = (invoice) => {
    const validation = (0, exports.validateTeifInvoiceData)(invoice);
    if (!validation.valid)
        throw new Error(validation.errors.join(' '));
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
            'cbc:ID': (0, numberingService_1.getInvoiceVisibleNumber)(invoice),
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
            'cac:InvoiceLine': invoice.lines.map((line, index) => ({
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
    const doc = (0, xmlbuilder2_1.create)(xmlObj);
    let xmlString = doc.end({ prettyPrint: true });
    return xmlString;
};
exports.generateTeifXml = generateTeifXml;
