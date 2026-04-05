"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importInvoiceXml = exports.submitToTTNController = exports.updateInvoiceStatus = exports.sendInvoiceEmailController = exports.deleteInvoice = exports.createInvoice = exports.getInvoiceXml = exports.getInvoicePdf = exports.getInvoiceById = exports.getInvoices = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const pdfGenerator_1 = __importDefault(require("../utils/pdfGenerator"));
const teifGenerator_1 = require("../utils/teifGenerator");
const notificationHelper_1 = require("../utils/notificationHelper");
const getInvoices = async (req, res) => {
    try {
        const invoices = await prisma_1.default.invoice.findMany({
            where: { companyId: req.company.id },
            include: {
                client: true,
                lines: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(invoices);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoices = getInvoices;
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            },
            include: {
                client: true,
                lines: true
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json(invoice);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoiceById = getInvoiceById;
const getInvoicePdf = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            },
            include: {
                company: true,
                client: true,
                lines: true
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const pdfBuffer = await (0, pdfGenerator_1.default)(invoice, 'FACTURE');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.id}.pdf`);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating PDF', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
};
exports.getInvoicePdf = getInvoicePdf;
const fs_extra_1 = __importDefault(require("fs-extra"));
const signer_1 = require("../utils/signer");
const getInvoiceXml = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            },
            include: {
                company: true,
                client: true,
                lines: true
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        let xmlContent = (0, teifGenerator_1.generateTeifXml)(invoice);
        // If company has uploaded a certificate, sign the XML
        if (invoice.company.certificatePath && invoice.company.certificatePassword) {
            try {
                const p12Buffer = await fs_extra_1.default.readFile(invoice.company.certificatePath);
                xmlContent = (0, signer_1.signXml)({
                    xmlString: xmlContent,
                    p12Buffer: p12Buffer,
                    password: invoice.company.certificatePassword
                });
            }
            catch (signError) {
                console.error('Signing failed:', signError.message);
                // Fallback to sending unsigned if signing fails, or return error depending on strictness
                // returning error since TTN requires signed
                return res.status(500).json({ message: 'Failed to sign the invoice with the registered certificate: ' + signError.message });
            }
        }
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=TEIF_${invoice.id}.xml`);
        res.status(200).send(xmlContent);
    }
    catch (error) {
        console.error('Error generating XML', error);
        // Send back specialized error message for validation failures
        res.status(400).json({ message: error.message || 'Error generating TEIF XML' });
    }
};
exports.getInvoiceXml = getInvoiceXml;
const createInvoice = async (req, res) => {
    try {
        const { devisId, clientId, lines, status, stampDuty, withholdingTax } = req.body;
        const companyId = req.company.id;
        const subscription = req.company.subscription;
        // Check Plan Limits (Starter: 7 invoices / month)
        if (subscription?.plan === 'starter') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const invoiceCount = await prisma_1.default.invoice.count({
                where: {
                    companyId,
                    createdAt: {
                        gte: startOfMonth
                    }
                }
            });
            if (invoiceCount >= 7) {
                return res.status(403).json({
                    message: 'Limite du plan Starter atteinte (7 factures/mois). Veuillez passer au plan Professional pour une facturation illimitée.',
                    limitReached: true
                });
            }
        }
        if (!clientId || !lines || lines.length === 0) {
            return res.status(400).json({ message: 'Client ID and at least one line are required' });
        }
        let totalHT = 0;
        let totalTVA = 0;
        const processedLines = lines.map((line) => {
            const lineTotalHT = line.quantity * line.unitPrice;
            const lineTVA = lineTotalHT * (line.tvaRate / 100);
            totalHT += lineTotalHT;
            totalTVA += lineTVA;
            return {
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                tvaRate: line.tvaRate,
                totalHT: lineTotalHT
            };
        });
        const totalTTC = totalHT + totalTVA;
        const netToPay = totalTTC + (stampDuty || 1.0) - (withholdingTax || 0);
        const invoice = await prisma_1.default.invoice.create({
            data: {
                companyId: req.company.id,
                clientId,
                devisId: devisId || null,
                status: status || 'DRAFT',
                totalHT,
                totalTVA,
                totalTTC,
                stampDuty: stampDuty || 1.0,
                withholdingTax: withholdingTax || 0,
                netToPay,
                lines: {
                    create: processedLines
                }
            },
            include: {
                lines: true
            }
        });
        if (devisId) {
            await prisma_1.default.devis.update({
                where: { id: devisId },
                data: { status: 'ACCEPTED' } // Auto-accept devis when turning to invoice
            });
        }
        res.status(201).json(invoice);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createInvoice = createInvoice;
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        await prisma_1.default.invoice.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'Invoice removed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteInvoice = deleteInvoice;
const mailer_1 = require("../utils/mailer");
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendInvoiceEmailController = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            },
            include: {
                company: true,
                client: true,
                lines: true
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (!invoice.client.email) {
            return res.status(400).json({ message: 'Client does not have an email address' });
        }
        // 1. Generate PDF
        const pdfBuffer = await (0, pdfGenerator_1.default)(invoice, 'FACTURE');
        // 2. Generate XML (signed if cert exists)
        let xmlContent = (0, teifGenerator_1.generateTeifXml)(invoice);
        if (invoice.company.certificatePath && invoice.company.certificatePassword) {
            try {
                const p12Buffer = await fs_extra_1.default.readFile(invoice.company.certificatePath);
                xmlContent = (0, signer_1.signXml)({
                    xmlString: xmlContent,
                    p12Buffer: p12Buffer,
                    password: invoice.company.certificatePassword
                });
            }
            catch (signError) {
                console.warn('Signing failed for email attachment:', signError.message);
            }
        }
        // 3. Send Email
        const subject = `Invoice ${invoice.id} from ${invoice.company.name}`;
        const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${invoice.client.name},</p>
        <p>Please find attached your invoice <b>#${invoice.id}</b>.</p>
        <p>Total amount due: <strong>${invoice.netToPay.toFixed(3)} TND</strong></p>
        <br/>
        <p>Thank you for your business!</p>
        <p>${invoice.company.name}</p>
      </div>
    `;
        const attachments = [
            {
                filename: `Invoice_${invoice.id}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            },
            {
                filename: `TEIF_${invoice.id}.xml`,
                content: xmlContent,
                contentType: 'application/xml'
            }
        ];
        const info = await (0, mailer_1.sendEmail)(invoice.client.email, subject, html, attachments);
        res.status(200).json({
            message: 'Email sent successfully',
            previewUrl: process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST ? nodemailer_1.default.getTestMessageUrl(info) : undefined
        });
    }
    catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({ message: 'Failed to send email' });
    }
};
exports.sendInvoiceEmailController = sendInvoiceEmailController;
const VALID_STATUSES = ['DRAFT', 'PENDING_VALIDATION', 'SENT_TO_TTN', 'VALIDATED', 'PAID', 'REJECTED'];
const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`
            });
        }
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const updated = await prisma_1.default.invoice.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
const ttnService_1 = require("../services/ttnService");
const submitToTTNController = async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const companyId = req.company.id;
        const invoice = await prisma_1.default.invoice.findFirst({
            where: { id: invoiceId, companyId },
            include: {
                company: true,
                client: true,
                lines: true
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.status === 'VALIDATED') {
            return res.status(400).json({ message: 'Invoice is already validated by TTN.' });
        }
        let xmlContent = (0, teifGenerator_1.generateTeifXml)(invoice);
        if (invoice.company.certificatePath && invoice.company.certificatePassword) {
            try {
                const p12Buffer = await fs_extra_1.default.readFile(invoice.company.certificatePath);
                xmlContent = (0, signer_1.signXml)({
                    xmlString: xmlContent,
                    p12Buffer: p12Buffer,
                    password: invoice.company.certificatePassword
                });
            }
            catch (signError) {
                return res.status(500).json({ message: 'Failed to sign the invoice before sending to TTN. ' + signError.message });
            }
        }
        else {
            return res.status(400).json({ message: 'A digital certificate is required to submit to TTN. Please configure it in Settings.' });
        }
        // Call Mock TTN Service
        const ttnResponse = await (0, ttnService_1.submitInvoiceToTTN)(xmlContent, invoice.company.matriculeFiscal, invoice.id);
        // Update the invoice status
        const updatedInvoice = await prisma_1.default.invoice.update({
            where: { id: invoice.id },
            data: { status: ttnResponse.status }
        });
        res.status(200).json({
            message: ttnResponse.message,
            invoice: updatedInvoice
        });
    }
    catch (error) {
        console.error('Error submitting to TTN:', error);
        res.status(500).json({ message: 'Server error during TTN submission' });
    }
};
exports.submitToTTNController = submitToTTNController;
// ── Import TEIF XML ──────────────────────────────────────────────────────────
const xmlbuilder2_1 = require("xmlbuilder2");
const importInvoiceXml = async (req, res) => {
    try {
        const xmlString = req.file?.buffer?.toString('utf-8') ?? req.body?.xml;
        if (!xmlString) {
            return res.status(400).json({ message: 'Aucun fichier XML fourni.' });
        }
        // Parse the XML into a plain JS object
        let doc;
        try {
            doc = (0, xmlbuilder2_1.convert)(xmlString, { format: 'object' });
        }
        catch {
            return res.status(400).json({ message: 'XML invalide ou non lisible.' });
        }
        const invoice = doc?.Invoice ?? doc;
        const companyId = req.company.id;
        // ── Extract client info ──────────────────────────────────────────────
        const customerParty = invoice?.['cac:AccountingCustomerParty']?.['cac:Party'];
        const clientMf = customerParty?.['cac:PartyIdentification']?.['cbc:ID']?.['#'] ??
            customerParty?.['cac:PartyIdentification']?.['cbc:ID'];
        const clientName = customerParty?.['cac:PartyName']?.['cbc:Name']?.['#'] ??
            customerParty?.['cac:PartyName']?.['cbc:Name'] ?? 'Importé depuis XML';
        const clientAddress = customerParty?.['cac:PostalAddress']?.['cbc:StreetName']?.['#'] ??
            customerParty?.['cac:PostalAddress']?.['cbc:StreetName'] ?? '';
        const clientCity = customerParty?.['cac:PostalAddress']?.['cbc:CityName']?.['#'] ??
            customerParty?.['cac:PostalAddress']?.['cbc:CityName'] ?? '';
        const clientEmail = customerParty?.['cac:Contact']?.['cbc:ElectronicMail']?.['#'] ??
            customerParty?.['cac:Contact']?.['cbc:ElectronicMail'] ?? undefined;
        const clientPhone = customerParty?.['cac:Contact']?.['cbc:Telephone']?.['#'] ??
            customerParty?.['cac:Contact']?.['cbc:Telephone'] ?? undefined;
        // ── Find or create client ────────────────────────────────────────────
        let client = null;
        if (clientMf && clientMf !== 'NOT_PROVIDED') {
            client = await prisma_1.default.client.findFirst({ where: { companyId, matriculeFiscal: String(clientMf) } });
        }
        if (!client) {
            client = await prisma_1.default.client.create({
                data: {
                    companyId,
                    name: String(clientName),
                    matriculeFiscal: clientMf ? String(clientMf) : undefined,
                    address: clientAddress ? String(clientAddress) : undefined,
                    city: clientCity ? String(clientCity) : undefined,
                    email: clientEmail ? String(clientEmail) : undefined,
                    phone: clientPhone ? String(clientPhone) : undefined,
                }
            });
        }
        // ── Extract invoice lines ────────────────────────────────────────────
        const rawLines = invoice?.['cac:InvoiceLine'];
        const lineArray = Array.isArray(rawLines) ? rawLines : (rawLines ? [rawLines] : []);
        if (lineArray.length === 0) {
            return res.status(400).json({ message: 'Le XML ne contient aucune ligne de facture.' });
        }
        const parsedLines = lineArray.map((l) => {
            const qty = parseFloat(l?.['cbc:InvoicedQuantity']?.['#'] ?? l?.['cbc:InvoicedQuantity'] ?? '1');
            const unitPrice = parseFloat(l?.['cac:Price']?.['cbc:PriceAmount']?.['#'] ?? '0');
            const tvaRate = parseFloat(l?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent']?.['#'] ??
                l?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent'] ?? '19');
            const description = String(l?.['cac:Item']?.['cbc:Description']?.['#'] ??
                l?.['cac:Item']?.['cbc:Description'] ??
                l?.['cac:Item']?.['cbc:Name']?.['#'] ??
                l?.['cac:Item']?.['cbc:Name'] ?? 'Article importé');
            const totalHT = parseFloat((qty * unitPrice).toFixed(3));
            return { description, quantity: qty, unitPrice, tvaRate, totalHT };
        });
        // ── Compute totals ───────────────────────────────────────────────────
        const totalHT = parseFloat(parsedLines.reduce((s, l) => s + l.totalHT, 0).toFixed(3));
        const totalTVA = parseFloat(parsedLines.reduce((s, l) => s + l.totalHT * (l.tvaRate / 100), 0).toFixed(3));
        const stampDuty = 1.000;
        const totalTTC = parseFloat((totalHT + totalTVA + stampDuty).toFixed(3));
        const netToPay = totalTTC;
        // ── Create invoice ───────────────────────────────────────────────────
        const created = await prisma_1.default.invoice.create({
            data: {
                companyId,
                clientId: client.id,
                status: 'PENDING_VALIDATION',
                totalHT,
                totalTVA,
                totalTTC,
                stampDuty,
                netToPay,
                lines: {
                    create: parsedLines
                }
            },
            include: { client: true, lines: true }
        });
        await (0, notificationHelper_1.createNotif)(companyId, 'Facture importée', `Facture importée depuis XML avec succès (client: ${created.client?.name ?? 'inconnu'}).`, 'XML_IMPORTED');
        res.status(201).json({
            message: 'Facture importée avec succès.',
            invoice: created
        });
    }
    catch (error) {
        console.error('Error importing XML:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'import XML.' });
    }
};
exports.importInvoiceXml = importInvoiceXml;
