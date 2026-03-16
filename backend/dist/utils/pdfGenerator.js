"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateInvoicePDF = (invoice, res) => {
    const doc = new pdfkit_1.default({ margin: 50 });
    // Pipe the PDF directly to the response
    doc.pipe(res);
    // Colors
    const primaryColor = '#2563eb'; // Blue 600
    const textColor = '#374151'; // Gray 700
    const lightGray = '#f3f4f6'; // Gray 100
    // Header Details Setup
    const company = invoice.company;
    const client = invoice.client;
    // --- Header ---
    doc
        .fillColor(primaryColor)
        .fontSize(24)
        .text('FACTURE', 50, 50)
        .fontSize(10)
        .text(`N°: ${invoice.id.slice(0, 8).toUpperCase()}`, 50, 75)
        .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 50, 90)
        .text(`Status: ${invoice.status.replace(/_/g, ' ')}`, 50, 105);
    // --- Company Details (Right Side) ---
    doc
        .fillColor(textColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(company.name, 350, 50, { align: 'right' })
        .font('Helvetica')
        .fontSize(10)
        .text(company.address, 350, 65, { align: 'right' })
        .text(company.email, 350, 80, { align: 'right' })
        .text(`Tel: ${company.phone || 'N/A'}`, 350, 95, { align: 'right' })
        .text(`MF: ${company.matriculeFiscal}`, 350, 110, { align: 'right' });
    doc.moveDown(3);
    // --- Client Details ---
    doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Adressé à:', 50, 160)
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .text(client.name, 50, 175)
        .font('Helvetica')
        .text(client.address || 'Adresse: N/A', 50, 190)
        .text(client.email || 'Email: N/A', 50, 205)
        .text(`Tel: ${client.phone || 'N/A'}`, 50, 220)
        .text(`MF: ${client.matriculeFiscal || 'N/A'}`, 50, 235);
    doc.moveDown(4);
    // --- Table Constants ---
    const invoiceTableTop = 300;
    const itemCol = 50;
    const qtyCol = 250;
    const priceCol = 320;
    const tvaCol = 400;
    const totalCol = 470;
    // --- Table Header ---
    doc
        .rect(50, invoiceTableTop - 10, 500, 20)
        .fill(lightGray)
        .stroke();
    doc
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Désignation', itemCol, invoiceTableTop)
        .text('Qté', qtyCol, invoiceTableTop, { width: 40, align: 'right' })
        .text('Prix Unitaire HT', priceCol, invoiceTableTop, { width: 70, align: 'right' })
        .text('TVA %', tvaCol, invoiceTableTop, { width: 40, align: 'right' })
        .text('Total HT', totalCol, invoiceTableTop, { width: 80, align: 'right' });
    // --- Table Rows ---
    let i = 0;
    let currentTop = invoiceTableTop + 20;
    doc.font('Helvetica');
    invoice.lines.forEach((line) => {
        // If we run out of space, create a new page
        if (currentTop > 700) {
            doc.addPage();
            currentTop = 50;
        }
        doc
            .fontSize(10)
            .text(line.description, itemCol, currentTop, { width: 200 })
            .text(line.quantity.toString(), qtyCol, currentTop, { width: 40, align: 'right' })
            .text(line.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 3 }), priceCol, currentTop, { width: 70, align: 'right' })
            .text(`${line.tvaRate}%`, tvaCol, currentTop, { width: 40, align: 'right' })
            .text(line.totalHT.toLocaleString(undefined, { minimumFractionDigits: 3 }), totalCol, currentTop, { width: 80, align: 'right' });
        currentTop += 20;
        i++;
    });
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, currentTop).lineTo(550, currentTop).stroke();
    currentTop += 15;
    // --- Totals Calculation Section ---
    const summaryLeft = 320;
    doc.font('Helvetica-Bold');
    // Subtotal HT
    doc.text('Total Net HT:', summaryLeft, currentTop, { width: 150, align: 'left' });
    doc.text(invoice.totalHT.toLocaleString(undefined, { minimumFractionDigits: 3 }) + ' TND', totalCol, currentTop, { width: 80, align: 'right' });
    currentTop += 20;
    // Total TVA
    doc.text('Total TVA:', summaryLeft, currentTop, { width: 150, align: 'left' });
    doc.text(invoice.totalTVA.toLocaleString(undefined, { minimumFractionDigits: 3 }) + ' TND', totalCol, currentTop, { width: 80, align: 'right' });
    currentTop += 20;
    // Timbre Fiscal (Stamp Duty)
    doc.text('Timbre Fiscal:', summaryLeft, currentTop, { width: 150, align: 'left' });
    doc.text(invoice.stampDuty.toLocaleString(undefined, { minimumFractionDigits: 3 }) + ' TND', totalCol, currentTop, { width: 80, align: 'right' });
    currentTop += 20;
    // Final Total TTC
    doc.rect(summaryLeft - 10, currentTop - 5, 240, 25).fill(lightGray).stroke();
    doc.fillColor(primaryColor).fontSize(12);
    doc.text('Total TTC:', summaryLeft, currentTop, { width: 150, align: 'left' });
    doc.text(invoice.netToPay.toLocaleString(undefined, { minimumFractionDigits: 3 }) + ' TND', totalCol, currentTop, { width: 80, align: 'right' });
    // --- Footer Notice ---
    doc.moveDown(5);
    doc
        .fillColor(textColor)
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Conditions de paiement: À réception de la facture.', 50, 750, { align: 'center' })
        .text('Généré par la plateforme El Fatoora - Facturation Électronique TTN', 50, 765, { align: 'center' });
    // Finalize the PDF
    doc.end();
};
exports.default = generateInvoicePDF;
