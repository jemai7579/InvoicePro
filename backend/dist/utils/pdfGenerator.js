"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdf = exports.getPdfFileSafeNumber = exports.getPdfDocumentNumber = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const numberToWords_1 = require("./numberToWords");
const numberingService_1 = require("../services/numberingService");
const fmt = (n, digits = 3) => Number(n || 0).toLocaleString('fr-TN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
});
const PAGE_W = 595.28;
const MARGIN = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 112;
const FOOTER_H = 22;
const FOOTER_Y = 841.89 - FOOTER_H;
const BODY_MAX = FOOTER_Y - 14;
const C = {
    primary: '#003F88',
    accent: '#0057B8',
    text: '#1A1A2E',
    muted: '#6B7280',
    border: '#BED0EC',
    light: '#E8F0FC',
    white: '#FFFFFF',
    rowAlt: '#F5F8FF',
};
function statusLabel(status) {
    const map = {
        DRAFT: 'Brouillon',
        VALIDATED: 'Validee',
        TEIF_GENERATED: 'XML TEIF genere',
        SIGNED: 'Signee electroniquement',
        SENT_TO_TTN: 'Envoyee a TTN',
        PENDING_TTN: 'En attente TTN',
        ACCEPTED_TTN: 'Acceptee par TTN',
        REJECTED_TTN: 'Rejetee par TTN',
        CANCELLED: 'Annulee',
        READY_FOR_TEIF: 'Validee',
        SIGNATURE_REQUIRED: 'TEIF genere',
        SUBMITTED_TO_TTN: 'Envoyee a TTN',
        TTN_PROCESSING: 'En attente TTN',
        TTN_ACCEPTED: 'Acceptee par TTN',
        TTN_REJECTED: 'Rejetee par TTN',
        FINALIZED: 'Acceptee par TTN',
        PENDING_VALIDATION: 'En attente de validation',
        PAID: 'Payee',
        REJECTED: 'Rejetee',
        ACCEPTED: 'Acceptee',
        REFUSED: 'Refusee',
    };
    return map[status] ?? status.replace(/_/g, ' ');
}
const getPdfDocumentNumber = (docData, type) => type === 'DEVIS' ? (0, numberingService_1.getDevisVisibleNumber)(docData) : (0, numberingService_1.getInvoiceVisibleNumber)(docData);
exports.getPdfDocumentNumber = getPdfDocumentNumber;
const getPdfFileSafeNumber = (docData, type) => (0, numberingService_1.sanitizeBusinessNumberForFileName)((0, exports.getPdfDocumentNumber)(docData, type));
exports.getPdfFileSafeNumber = getPdfFileSafeNumber;
function groupByTva(lines) {
    const map = new Map();
    for (const line of lines || []) {
        const previous = map.get(line.tvaRate) ?? { baseHT: 0, montantTVA: 0 };
        map.set(line.tvaRate, {
            baseHT: previous.baseHT + Number(line.totalHT || 0),
            montantTVA: previous.montantTVA + Number(line.totalHT || 0) * (Number(line.tvaRate || 0) / 100),
        });
    }
    return Array.from(map.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([rate, value]) => ({ rate, ...value }));
}
const generatePdf = async (docData, type = 'FACTURE', compliance) => {
    const createdAt = new Date(docData.createdAt);
    const ref = (0, exports.getPdfDocumentNumber)(docData, type);
    const company = docData.company ?? {};
    const client = docData.client ?? {};
    const lines = docData.lines ?? [];
    const issueDate = createdAt.toLocaleDateString('fr-TN');
    const dueDate = new Date(createdAt.getTime() + 30 * 86400000).toLocaleDateString('fr-TN');
    const complianceStatus = compliance?.complianceStatus || docData.ttnStatus || docData.status || 'DRAFT';
    const complianceLabel = compliance?.complianceLabelFr || statusLabel(complianceStatus);
    const isFinalInvoice = type === 'FACTURE' && complianceStatus === 'ACCEPTED_TTN';
    const isMockMode = compliance?.complianceMode === 'mock' || compliance?.complianceMode === 'test';
    const headerTitle = type === 'DEVIS'
        ? 'DEVIS'
        : isFinalInvoice
            ? 'FACTURE FISCALE ELECTRONIQUE'
            : 'FACTURE EN PREPARATION';
    const qrPayload = JSON.stringify({
        reference: ref,
        fiscalId: company.matriculeFiscal ?? '',
        totalTTC: Math.round(Number(docData.netToPay || 0) * 1000) / 1000,
        date: createdAt.toISOString().split('T')[0],
        status: complianceStatus,
        ttnReference: compliance?.ttnReference ?? null,
        mode: compliance?.complianceMode ?? 'draft',
    });
    const qrPng = isFinalInvoice && compliance?.ttnQrCode
        ? await qrcode_1.default.toBuffer(compliance.ttnQrCode, {
            type: 'png',
            width: 88,
            margin: 1,
            errorCorrectionLevel: 'M',
        })
        : null;
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
            margin: MARGIN,
            size: 'A4',
            autoFirstPage: true,
            bufferPages: true,
        });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        let y = HEADER_H + 12;
        const addHeader = () => {
            doc.rect(0, 0, PAGE_W, HEADER_H).fill(C.primary);
            doc.rect(0, HEADER_H - 3, PAGE_W, 3).fill(C.accent);
            doc.fillColor(C.white).font('Helvetica-Bold').fontSize(19).text(headerTitle, MARGIN, 16);
            doc
                .font('Helvetica')
                .fontSize(7.5)
                .fillColor('#A8C4F0')
                .text(type === 'FACTURE'
                ? isFinalInvoice
                    ? 'Plateforme El Fatoora · Conformite TTN'
                    : 'Plateforme El Fatoora · Preparation TTN'
                : 'Plateforme El Fatoora · Document commercial', MARGIN, 40);
            doc
                .fillColor(C.white)
                .fontSize(8.5)
                .text(`Reference : ${ref}`, MARGIN, 53)
                .text(`No interne : ${docData.id.slice(0, 8).toUpperCase()}`, MARGIN, 65)
                .text(`Statut : ${complianceLabel}`, MARGIN, 77);
            const dateX = MARGIN + 230;
            doc.fillColor('#A8C4F0').font('Helvetica-Bold').fontSize(8).text("Date d'emission", dateX, 53);
            doc.fillColor(C.white).font('Helvetica').fontSize(9).text(issueDate, dateX, 64);
            doc.fillColor('#A8C4F0').font('Helvetica-Bold').fontSize(8).text("Date d'echeance", dateX, 80);
            doc.fillColor(C.white).font('Helvetica').fontSize(9).text(dueDate, dateX, 91);
            const qrX = PAGE_W - MARGIN - 88;
            if (qrPng) {
                doc.image(qrPng, qrX, 9, { width: 88, height: 88 });
                doc
                    .fontSize(6)
                    .fillColor('#A8C4F0')
                    .text(isMockMode ? 'QR fiscal mock' : 'QR fiscal TTN', qrX, 99, {
                    width: 88,
                    align: 'center',
                });
            }
            else {
                doc.roundedRect(qrX, 9, 88, 88, 8).stroke('#7EA7DE');
                doc
                    .fontSize(7)
                    .fillColor('#A8C4F0')
                    .text('QR TTN disponible apres acceptation', qrX + 8, 40, {
                    width: 72,
                    align: 'center',
                });
            }
        };
        const addFooter = (page, total) => {
            doc.rect(0, FOOTER_Y, PAGE_W, FOOTER_H).fill(C.primary);
            doc
                .fillColor(C.white)
                .font('Helvetica')
                .fontSize(7)
                .text(`El Fatoora · ${type === 'FACTURE' ? 'Facturation electronique' : 'Devis'} · Ref. ${ref} · Page ${page} / ${total}`, 0, FOOTER_Y + 7, { width: PAGE_W, align: 'center' });
        };
        const ensureSpace = (needed) => {
            if (y + needed <= BODY_MAX)
                return;
            doc.addPage();
            addHeader();
            y = HEADER_H + 12;
        };
        const sectionLabel = (label) => {
            ensureSpace(22);
            doc.rect(MARGIN, y, CONTENT_W, 16).fill(C.light);
            doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(8).text(label, MARGIN + 8, y + 4);
            y += 20;
        };
        const drawParty = (boxX, title, name, mf, rne, address, zip, city, country, phone, email) => {
            const boxW = (CONTENT_W - 10) / 2;
            const boxH = 138;
            const pad = 10;
            const textW = boxW - pad * 2;
            const x = boxX + pad;
            const info = [
                `MF : ${mf || '-'}`,
                `RNE : ${rne || '-'}`,
                `Adresse : ${address || '-'}`,
                `Ville : ${[zip, city, country].filter(Boolean).join(' ') || '-'}`,
                `Tel : ${phone || '-'}`,
                `Email : ${email || '-'}`,
            ];
            doc.roundedRect(boxX, y, boxW, boxH, 4).fill(C.white).stroke(C.border);
            doc.rect(boxX, y, boxW, 15).fill(C.primary);
            doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5).text(title, x, y + 4, { width: textW });
            doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9.5).text(name || '-', x, y + 19, {
                width: textW,
                lineBreak: false,
                ellipsis: true,
            });
            let infoY = y + 33;
            for (const line of info) {
                doc.fillColor(C.muted).font('Helvetica').fontSize(8).text(line, x, infoY, {
                    width: textW,
                    lineBreak: false,
                    ellipsis: true,
                });
                infoY += 11;
            }
        };
        addHeader();
        ensureSpace(145);
        const colW = (CONTENT_W - 10) / 2;
        const rightX = MARGIN + colW + 10;
        drawParty(MARGIN, 'EMETTEUR', company.name, company.matriculeFiscal ?? '', company.registreCommerce ?? '', company.address ?? '', company.zipCode ?? '', company.city ?? '', company.country ?? 'Tunisie', company.phone ?? '', company.email ?? '');
        drawParty(rightX, type === 'DEVIS' ? 'DESTINATAIRE' : 'CLIENT', client.name, client.matriculeFiscal ?? '', '', client.address ?? '', client.zipCode ?? '', client.city ?? '', client.country ?? 'Tunisie', client.phone ?? '', client.email ?? '');
        y += 138;
        if (type === 'FACTURE') {
            ensureSpace(52);
            doc
                .rect(MARGIN, y, CONTENT_W, 40)
                .fill(isFinalInvoice ? '#ECFDF5' : '#FFF7ED')
                .stroke(isFinalInvoice ? '#A7F3D0' : '#FED7AA');
            doc
                .fillColor(isFinalInvoice ? '#065F46' : '#9A3412')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text(isFinalInvoice ? 'VALIDITE FISCALE' : 'STATUT FISCAL', MARGIN + 10, y + 8);
            const finalText = isFinalInvoice
                ? `${compliance?.ttnReference ? `Reference TTN : ${compliance.ttnReference}` : 'TTN acceptee'}${compliance?.ttnAcceptedAt
                    ? ` · Date d'acceptation : ${new Date(compliance.ttnAcceptedAt).toLocaleDateString('fr-TN')}`
                    : ''}${isMockMode ? ' · Mode test' : ''}`
                : 'Votre facture est encore en preparation. Elle ne devient fiscalement valide qu apres signature electronique et acceptation TTN.';
            doc
                .fillColor(isFinalInvoice ? '#065F46' : '#7C2D12')
                .font('Helvetica')
                .fontSize(8.5)
                .text(finalText, MARGIN + 10, y + 20, { width: CONTENT_W - 20 });
            y += 48;
        }
        sectionLabel(type === 'DEVIS' ? 'LIGNES DU DEVIS' : 'LIGNES DE FACTURE');
        ensureSpace(22);
        const cols = {
            num: { x: MARGIN, w: 24 },
            desc: { x: MARGIN + 24, w: 178 },
            qty: { x: MARGIN + 202, w: 42 },
            pu: { x: MARGIN + 244, w: 68 },
            tva: { x: MARGIN + 312, w: 38 },
            mva: { x: MARGIN + 350, w: 66 },
            total: { x: MARGIN + 416, w: CONTENT_W - 416 },
        };
        doc.rect(MARGIN, y, CONTENT_W, 20).fill(C.primary);
        const headerY = y + 6;
        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
        doc.text('#', cols.num.x + 4, headerY);
        doc.text('Designation', cols.desc.x + 4, headerY);
        doc.text('Qte', cols.qty.x, headerY, { width: cols.qty.w, align: 'right' });
        doc.text('P.U. HT', cols.pu.x, headerY, { width: cols.pu.w, align: 'right' });
        doc.text('TVA', cols.tva.x, headerY, { width: cols.tva.w, align: 'right' });
        doc.text('Mt. TVA', cols.mva.x, headerY, { width: cols.mva.w, align: 'right' });
        doc.text('Total HT', cols.total.x, headerY, { width: cols.total.w, align: 'right' });
        y += 20;
        lines.forEach((line, index) => {
            doc.font('Helvetica').fontSize(9);
            const descH = doc.heightOfString(line.description || '-', { width: cols.desc.w - 8 });
            const rowH = Math.max(20, descH + 10);
            ensureSpace(rowH);
            doc.rect(MARGIN, y, CONTENT_W, rowH).fill(index % 2 === 0 ? C.white : C.rowAlt);
            doc.rect(MARGIN, y + rowH - 1, CONTENT_W, 1).fill(C.border);
            const lineY = y + 5;
            const tvaAmount = Number(line.totalHT || 0) * (Number(line.tvaRate || 0) / 100);
            doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(String(index + 1), cols.num.x + 4, lineY);
            doc.fillColor(C.text).font('Helvetica').fontSize(9).text(line.description || '-', cols.desc.x + 4, lineY, {
                width: cols.desc.w - 8,
            });
            doc
                .text(fmt(Number(line.quantity || 0), 2), cols.qty.x, lineY, { width: cols.qty.w, align: 'right' })
                .text(fmt(Number(line.unitPrice || 0)), cols.pu.x, lineY, { width: cols.pu.w, align: 'right' })
                .text(`${Number(line.tvaRate || 0)} %`, cols.tva.x, lineY, { width: cols.tva.w, align: 'right' })
                .text(fmt(tvaAmount), cols.mva.x, lineY, { width: cols.mva.w, align: 'right' })
                .font('Helvetica-Bold')
                .text(fmt(Number(line.totalHT || 0)), cols.total.x, lineY, { width: cols.total.w, align: 'right' });
            y += rowH;
        });
        y += 10;
        const tvaGroups = groupByTva(lines);
        const blockH = Math.max(tvaGroups.length * 16 + 38, 96) + 20;
        ensureSpace(blockH);
        sectionLabel('RECAPITULATIF FISCAL');
        const tvaW = CONTENT_W * 0.48;
        const summaryX = MARGIN + tvaW + 12;
        const summaryW = CONTENT_W - tvaW - 12;
        const snapshotY = y;
        doc.rect(MARGIN, y, tvaW, 16).fill(C.light);
        doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8);
        doc.text('Taux', MARGIN + 6, y + 4, { width: 36 });
        doc.text('Base imposable HT', MARGIN + 44, y + 4, { width: 110 });
        doc.text('Montant TVA', MARGIN + tvaW - 76, y + 4, { width: 74, align: 'right' });
        y += 16;
        for (const group of tvaGroups) {
            doc.rect(MARGIN, y, tvaW, 16).fill(C.white).stroke(C.border);
            doc.fillColor(C.text).font('Helvetica').fontSize(9);
            doc.text(`${group.rate} %`, MARGIN + 6, y + 3, { width: 36 });
            doc.text(fmt(group.baseHT), MARGIN + 44, y + 3, { width: 110 });
            doc.font('Helvetica-Bold').text(fmt(group.montantTVA), MARGIN + tvaW - 76, y + 3, {
                width: 74,
                align: 'right',
            });
            y += 16;
        }
        let totalY = snapshotY;
        const drawTotal = (label, value, bold = false, highlight = false) => {
            const height = highlight ? 24 : 18;
            doc.rect(summaryX, totalY, summaryW, height).fill(highlight ? C.primary : bold ? C.light : C.white).stroke(C.border);
            doc
                .fillColor(highlight ? C.white : C.text)
                .font(bold || highlight ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(highlight ? 10.5 : 9)
                .text(label, summaryX + 8, totalY + (highlight ? 7 : 4), { width: summaryW * 0.55 })
                .text(value, summaryX + 8, totalY + (highlight ? 7 : 4), { width: summaryW - 12, align: 'right' });
            totalY += height;
        };
        drawTotal('Total HT', `${fmt(Number(docData.totalHT || 0))} TND`);
        drawTotal('Total TVA', `${fmt(Number(docData.totalTVA || 0))} TND`);
        drawTotal('Droit de timbre fiscal', `${fmt(Number(docData.stampDuty || 0))} TND`);
        if (Number(docData.withholdingTax || 0) > 0) {
            drawTotal('Retenue a la source', `- ${fmt(Number(docData.withholdingTax || 0))} TND`);
        }
        drawTotal('NET A PAYER (TTC)', `${fmt(Number(docData.netToPay || 0))} TND`, true, true);
        y = Math.max(y, totalY) + 14;
        ensureSpace(32);
        const words = (0, numberToWords_1.numberToWordsTND)(Number(docData.netToPay || 0));
        doc.rect(MARGIN, y, CONTENT_W, 26).fill(C.light).stroke(C.border);
        doc
            .fillColor(C.primary)
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .text('Arrete le present document a la somme de :', MARGIN + 10, y + 5);
        doc.fillColor(C.text).font('Helvetica-Oblique').fontSize(9).text(words, MARGIN + 10, y + 15, {
            width: CONTENT_W - 20,
        });
        y += 34;
        ensureSpace(16);
        doc.fillColor(C.muted).font('Helvetica').fontSize(8.5).text('Mode de paiement : Espèce', MARGIN, y);
        y += 14;
        ensureSpace(70);
        y += 8;
        doc.rect(MARGIN, y, CONTENT_W, 1).fill(C.border);
        y += 8;
        let legalText = 'Ce document est genere par la plateforme El Fatoora dans le cadre du workflow de facturation electronique TTN. ' +
            'Les donnees de montant, client, reference et statut sont tracees dans le systeme.';
        if (type === 'FACTURE' && isFinalInvoice) {
            legalText += ` La facture a ete acceptee par TTN${compliance?.ttnReference ? ` sous la reference ${compliance.ttnReference}` : ''}.`;
            if (isMockMode) {
                legalText += ' Ce document a ete produit en mode test et ne doit pas etre utilise comme justificatif fiscal de production.';
            }
        }
        else if (type === 'FACTURE') {
            legalText += ' Cette version reste un brouillon ou une version intermediaire tant que la signature electronique et la validation TTN ne sont pas terminees.';
        }
        else {
            legalText += ' Ce devis n a pas valeur de facture fiscale.';
        }
        doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(7.5).text(legalText, MARGIN, y, {
            width: CONTENT_W,
            align: 'justify',
        });
        y += doc.heightOfString(legalText, { width: CONTENT_W }) + 10;
        doc
            .fillColor(C.muted)
            .font('Helvetica')
            .fontSize(7.5)
            .text("Conditions de paiement : paiement a reception. Une facture est fiscalement valide uniquement apres acceptation TTN.", MARGIN, y, { width: CONTENT_W, align: 'center' });
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i += 1) {
            doc.switchToPage(range.start + i);
            addFooter(i + 1, range.count);
        }
        doc.end();
    });
};
exports.generatePdf = generatePdf;
exports.default = exports.generatePdf;
