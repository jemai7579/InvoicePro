import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { numberToWordsTND } from './numberToWords';

// ── helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number, d = 3) =>
  Number(n).toLocaleString('fr-TN', { minimumFractionDigits: d, maximumFractionDigits: d });

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    DRAFT:              'Brouillon',
    SENT_TO_TTN:        'Envoyé à TTN',
    PENDING_VALIDATION: 'En attente de validation',
    VALIDATED:          'Validée',
    PAID:               'Payée',
    REJECTED:           'Rejetée',
  };
  return map[s] ?? s.replace(/_/g, ' ');
}

export function invoiceRef(id: string, createdAt: Date): string {
  const y = createdAt.getFullYear();
  const m = String(createdAt.getMonth() + 1).padStart(2, '0');
  return `F-${y}${m}-${id.slice(0, 8).toUpperCase()}`;
}

function groupByTva(lines: any[]): { rate: number; baseHT: number; montantTVA: number }[] {
  const map = new Map<number, { baseHT: number; montantTVA: number }>();
  for (const l of lines) {
    const prev = map.get(l.tvaRate) ?? { baseHT: 0, montantTVA: 0 };
    map.set(l.tvaRate, {
      baseHT:     prev.baseHT     + l.totalHT,
      montantTVA: prev.montantTVA + l.totalHT * (l.tvaRate / 100),
    });
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([rate, v]) => ({ rate, ...v }));
}

// ── Layout ─────────────────────────────────────────────────────────────────
const PAGE_W   = 595.28;
const MARGIN   = 45;
const CONT_W   = PAGE_W - MARGIN * 2;
const HEADER_H = 112;
const FOOTER_H = 22;
const FOOTER_Y = 841.89 - FOOTER_H;
const BODY_MAX = FOOTER_Y - 14;

const C = {
  primary:  '#003F88',
  light:    '#E8F0FC',
  border:   '#BED0EC',
  text:     '#1A1A2E',
  muted:    '#6B7280',
  white:    '#FFFFFF',
  rowAlt:   '#F5F8FF',
  accent:   '#0057B8',
};

// ── main generator ─────────────────────────────────────────────────────────
export const generatePdf = async (
  docData: any,
  _type: 'FACTURE' | 'DEVIS' = 'FACTURE'
): Promise<Buffer> => {

  const ref     = invoiceRef(docData.id, new Date(docData.createdAt));
  const company = docData.company ?? {};
  const client  = docData.client  ?? {};
  const hasCert = !!(company.certificatePath && company.certificatePassword);

  const issueDate = new Date(docData.createdAt).toLocaleDateString('fr-TN');
  const dueDate   = new Date(
    new Date(docData.createdAt).getTime() + 30 * 86_400_000
  ).toLocaleDateString('fr-TN');

  // ── QR (JSON, internal verification) ─────────────────────────────────────
  const qrPayload = JSON.stringify({
    reference: ref,
    mf:        company.matriculeFiscal ?? '',
    total_ttc: Math.round(docData.netToPay * 1000) / 1000,
    date:      new Date(docData.createdAt).toISOString().split('T')[0],
    status:    docData.status,
  });
  const qrPng: Buffer = await QRCode.toBuffer(qrPayload, {
    type: 'png', width: 88, margin: 1, errorCorrectionLevel: 'M',
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: MARGIN,
      size: 'A4',
      autoFirstPage: true,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data',  (c: Buffer) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let pageNum = 1;

    // ── Header ───────────────────────────────────────────────────────────────
    const addHeader = () => {
      // Background
      doc.rect(0, 0, PAGE_W, HEADER_H).fill(C.primary);

      // Thin accent stripe at bottom of header
      doc.rect(0, HEADER_H - 3, PAGE_W, 3).fill(C.accent);

      // ── Left block: title + reference + status ────────────────────────────
      doc
        .fillColor(C.white)
        .font('Helvetica-Bold')
        .fontSize(19)
        .text('FACTURE ÉLECTRONIQUE', MARGIN, 16);

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#A8C4F0')  // light blue sub-text
        .text('Plateforme El Fatoora  ·  Gestion TTN interne', MARGIN, 40);

      doc
        .fillColor(C.white)
        .fontSize(8.5)
        .text(`Référence :  ${ref}`, MARGIN, 53)
        .text(`N° interne : ${docData.id.slice(0, 8).toUpperCase()}`, MARGIN, 65)
        .text(`Statut :        ${statusLabel(docData.status)}`, MARGIN, 77);

      // ── Centre/Right block: dates ─────────────────────────────────────────
      const dateX = MARGIN + 230;

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#A8C4F0')
        .text("Date d'émission", dateX, 53);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(C.white)
        .text(issueDate, dateX, 64);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#A8C4F0')
        .text("Date d'échéance", dateX, 80);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(C.white)
        .text(dueDate, dateX, 91);

      // ── QR code (far right) ───────────────────────────────────────────────
      const qrX = PAGE_W - MARGIN - 88;
      doc.image(qrPng, qrX, 9, { width: 88, height: 88 });
      doc
        .fontSize(6)
        .fillColor('#A8C4F0')
        .text('Vérification interne', qrX, 99, { width: 88, align: 'center' });
    };

    const addFooter = (page: number, total: number) => {
      doc.rect(0, FOOTER_Y, PAGE_W, FOOTER_H).fill(C.primary);
      doc
        .fillColor(C.white)
        .font('Helvetica')
        .fontSize(7)
        .text(
          `El Fatoora — Facturation Électronique TTN  ·  Réf. ${ref}  ·  Page ${page} / ${total}`,
          0, FOOTER_Y + 7, { width: PAGE_W, align: 'center' }
        );
    };

    addHeader();
    let y = HEADER_H + 12;

    const ensureSpace = (needed: number) => {
      if (y + needed > BODY_MAX) {
        doc.addPage();
        pageNum++;
        addHeader();
        y = HEADER_H + 12;
      }
    };

    // ── Section label helper ──────────────────────────────────────────────────
    const sectionLabel = (label: string) => {
      ensureSpace(22);
      doc.rect(MARGIN, y, CONT_W, 16).fill(C.light);
      doc
        .fillColor(C.primary)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(label, MARGIN + 8, y + 4);
      y += 20;
    };

    // ── Parties ───────────────────────────────────────────────────────────────
    ensureSpace(145);
    const colW   = (CONT_W - 10) / 2;
    const rightX = MARGIN + colW + 10;

    const drawParty = (
      boxX   : number,
      title  : string,
      name   : string,
      mf     : string,
      rc     : string,
      address: string,
      zip    : string,
      city   : string,
      country: string,
      phone  : string,
      email  : string
    ) => {
      const BOX_H = 138;
      const PAD   = 10;
      const TW    = colW - PAD * 2;  // full usable text width
      const X     = boxX + PAD;
      const LINE  = 11;              // line-height in points

      /* ── Box + title bar ────────────────────────────────────── */
      doc.roundedRect(boxX, y, colW, BOX_H, 4).fill(C.white).stroke(C.border);
      doc.rect(boxX, y, colW, 15).fill(C.primary);

      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5);
      doc.text(title, X, y + 4, { width: TW, lineBreak: false, ellipsis: true });

      /* ── Name ────────────────────────────────────────────────── */
      doc.fillColor(C.text).font('Helvetica-Bold').fontSize(9.5);
      doc.text(name || '—', X, y + 19, { width: TW, lineBreak: false, ellipsis: true });

      /* ── Info lines — one complete string per row ─────────────
         Each doc.text() call is fully self-contained:
           • absolute (X, rowY) position
           • width: TW  ← full box width, never too narrow
           • lineBreak: false  ← no line break at end
           • ellipsis: true    ← '...' instead of wrapping
         Result: text NEVER splits mid-word.                      */
      const info = [
        { label: 'MF',      value: mf      },
        { label: 'RC',      value: rc      },
        { label: 'Adresse', value: address },
        { label: 'Ville',   value: [zip, city, country].filter(Boolean).join(' ') },
        { label: 'Tél',     value: phone   },
        { label: 'Email',   value: email   },
      ];

      let iy = y + 33;
      for (const { label, value } of info) {
        const line = value?.trim() ? `${label} : ${value.trim()}` : `${label} : —`;
        doc.fillColor(C.muted).font('Helvetica').fontSize(8);
        doc.text(line, X, iy, { width: TW, lineBreak: false, ellipsis: true });
        iy += LINE;
      }
    };

    drawParty(
      MARGIN, 'ÉMETTEUR',
      company.name, company.matriculeFiscal ?? '', company.registreCommerce ?? '',
      company.address ?? '', company.zipCode ?? '', company.city ?? '',
      company.country ?? 'Tunisie', company.phone ?? '', company.email ?? ''
    );
    drawParty(
      rightX, 'DESTINATAIRE / CLIENT',
      client.name, client.matriculeFiscal ?? '', '',
      client.address ?? '', client.zipCode ?? '', client.city ?? '',
      client.country ?? 'Tunisie', client.phone ?? '', client.email ?? ''
    );

    y += 138; // BOX_H (128) + 10 gap


    // ── Articles table ─────────────────────────────────────────────────────
    sectionLabel('LIGNES DE FACTURE');
    ensureSpace(22);

    // Column definitions
    const TC = {
      num:   { x: MARGIN,        w: 24  },
      desc:  { x: MARGIN + 24,   w: 178 },
      qty:   { x: MARGIN + 202,  w: 42  },
      pu:    { x: MARGIN + 244,  w: 68  },
      tva:   { x: MARGIN + 312,  w: 38  },
      mva:   { x: MARGIN + 350,  w: 66  },
      total: { x: MARGIN + 416,  w: CONT_W - 416 },
    };

    // Header bar
    doc.rect(MARGIN, y, CONT_W, 20).fill(C.primary);
    const hY = y + 6;
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
    doc.text('#',             TC.num.x + 4, hY);
    doc.text('Désignation',   TC.desc.x + 4, hY);
    doc.text('Qté',           TC.qty.x,  hY, { width: TC.qty.w,   align: 'right' });
    doc.text('P.U. HT',       TC.pu.x,   hY, { width: TC.pu.w,    align: 'right' });
    doc.text('TVA',           TC.tva.x,  hY, { width: TC.tva.w,   align: 'right' });
    doc.text('Mt. TVA',       TC.mva.x,  hY, { width: TC.mva.w,   align: 'right' });
    doc.text('Total HT',      TC.total.x, hY, { width: TC.total.w, align: 'right' });
    y += 20;

    // Rows
    docData.lines.forEach((line: any, idx: number) => {
      doc.font('Helvetica').fontSize(9);
      const descH = doc.heightOfString(line.description, { width: TC.desc.w - 8 });
      const rowH  = Math.max(20, descH + 10);
      ensureSpace(rowH);

      // Alternating background
      doc.rect(MARGIN, y, CONT_W, rowH).fill(idx % 2 === 0 ? C.white : C.rowAlt);

      // Bottom rule for each row
      doc.rect(MARGIN, y + rowH - 1, CONT_W, 1).fill(C.border);

      const mva   = line.totalHT * (line.tvaRate / 100);
      const lineY = y + 5;

      doc.fillColor(C.muted).font('Helvetica').fontSize(9)
         .text(String(idx + 1), TC.num.x + 4, lineY);

      doc.fillColor(C.text).font('Helvetica').fontSize(9)
         .text(line.description, TC.desc.x + 4, lineY, { width: TC.desc.w - 8 });

      doc.fillColor(C.text).font('Helvetica').fontSize(9)
         .text(fmt(line.quantity, 2), TC.qty.x,   lineY, { width: TC.qty.w,   align: 'right' })
         .text(fmt(line.unitPrice),   TC.pu.x,    lineY, { width: TC.pu.w,    align: 'right' })
         .text(`${line.tvaRate} %`,   TC.tva.x,   lineY, { width: TC.tva.w,   align: 'right' })
         .text(fmt(mva),              TC.mva.x,   lineY, { width: TC.mva.w,   align: 'right' })
         .font('Helvetica-Bold')
         .text(fmt(line.totalHT),     TC.total.x, lineY, { width: TC.total.w, align: 'right' });

      y += rowH;
    });

    y += 10;

    // ── TVA detail + Totals ────────────────────────────────────────────────
    const tvaGroups  = groupByTva(docData.lines);
    const tvaRows    = tvaGroups.length;
    const totalRows  = 3 + (docData.withholdingTax > 0 ? 1 : 0);
    const blockH     = Math.max(tvaRows * 16 + 38, totalRows * 18 + 24) + 20;
    ensureSpace(blockH);

    sectionLabel('RÉCAPITULATIF FISCAL');

    const tvaW  = CONT_W * 0.48;
    const sumX  = MARGIN + tvaW + 12;
    const sumW  = CONT_W - tvaW - 12;
    const ySnap = y;

    // TVA table header
    doc.rect(MARGIN, y, tvaW, 16).fill(C.light);
    doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(8)
       .text('Taux',              MARGIN + 6,         y + 4, { width: 36 })
       .text('Base imposable HT', MARGIN + 44,        y + 4, { width: 110 })
       .text('Montant TVA',       MARGIN + tvaW - 76, y + 4, { width: 74, align: 'right' });
    y += 16;

    for (const g of tvaGroups) {
      doc.rect(MARGIN, y, tvaW, 16).fill(C.white).stroke(C.border);
      doc.fillColor(C.text).font('Helvetica').fontSize(9)
         .text(`${g.rate} %`,     MARGIN + 6,         y + 3, { width: 36 })
         .text(fmt(g.baseHT),     MARGIN + 44,        y + 3, { width: 110 })
         .font('Helvetica-Bold')
         .text(fmt(g.montantTVA), MARGIN + tvaW - 76, y + 3, { width: 74, align: 'right' });
      y += 16;
    }

    // Totals block (right side, aligned with tva section start)
    let tY = ySnap;

    const drawTotal = (
      label: string, value: string,
      bold = false, highlight = false
    ) => {
      const h = highlight ? 24 : 18;
      const bg = highlight ? C.primary : (bold ? C.light : C.white);
      doc.rect(sumX, tY, sumW, h).fill(bg).stroke(C.border);
      doc
        .fillColor(highlight ? C.white : C.text)
        .font(bold || highlight ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(highlight ? 10.5 : 9)
        .text(label, sumX + 8, tY + (highlight ? 7 : 4), { width: sumW * 0.55 })
        .text(value, sumX + 8, tY + (highlight ? 7 : 4), { width: sumW - 12, align: 'right' });
      tY += h;
    };

    drawTotal('Total HT',               `${fmt(docData.totalHT)}  TND`);
    drawTotal('Total TVA',              `${fmt(docData.totalTVA)} TND`);
    drawTotal('Droit de timbre fiscal', `${fmt(docData.stampDuty)} TND`);
    if (docData.withholdingTax > 0) {
      drawTotal('Retenue à la source',  `- ${fmt(docData.withholdingTax)} TND`);
    }
    drawTotal('NET À PAYER (TTC)', `${fmt(docData.netToPay)} TND`, true, true);

    y = Math.max(y, tY) + 14;

    // ── Arrêté en lettres ─────────────────────────────────────────────────
    ensureSpace(32);
    const words = numberToWordsTND(docData.netToPay);
    doc.rect(MARGIN, y, CONT_W, 26).fill(C.light).stroke(C.border);
    doc
      .fillColor(C.primary).font('Helvetica-Bold').fontSize(7.5)
      .text("Arrêté la présente facture à la somme de :", MARGIN + 10, y + 5);
    doc
      .fillColor(C.text).font('Helvetica-Oblique').fontSize(9)
      .text(words, MARGIN + 10, y + 15, { width: CONT_W - 20 });
    y += 34;

    // ── RIB ──────────────────────────────────────────────────────────────
    if (company.rib) {
      ensureSpace(16);
      doc
        .fillColor(C.muted).font('Helvetica').fontSize(8.5)
        .text(`Virement bancaire  —  RIB : ${company.rib}`, MARGIN, y);
      y += 14;
    }

    // ── Mentions légales ──────────────────────────────────────────────────
    ensureSpace(60);
    y += 8;
    doc.rect(MARGIN, y, CONT_W, 1).fill(C.border);
    y += 8;

    let legalText =
      'Ce document est une facture électronique générée par la plateforme El Fatoora, ' +
      'système de gestion et de préparation des factures électroniques conforme au cadre TTN ' +
      '(Tunisie Trade Net). ' +
      'Les données de cette facture (montants, références, statut) font foi à la date d\'émission indiquée. ' +
      'Tout rectificatif ultérieur du statut est consigné dans le système et traçable à des fins de contrôle interne.';

    if (hasCert) {
      legalText +=
        ' Cette facture est signée électroniquement (XAdES-B / RSA-SHA256) ' +
        "avec le certificat numérique enregistré de l'émetteur.";
    } else {
      legalText +=
        ' Aucune signature électronique n\'a été appliquée à ce document — ' +
        'veuillez configurer un certificat TunTrust dans les Paramètres pour activer la signature.';
    }

    doc
      .fillColor(C.muted).font('Helvetica-Oblique').fontSize(7.5)
      .text(legalText, MARGIN, y, { width: CONT_W, align: 'justify' });

    y += doc.heightOfString(legalText, { width: CONT_W }) + 10;

    doc
      .fillColor(C.muted).font('Helvetica').fontSize(7.5)
      .text(
        "Conditions de paiement : Paiement à réception de la facture.  |  Pénalité de retard : 1 % par mois.",
        MARGIN, y, { width: CONT_W, align: 'center' }
      );

    // ── Footers on all pages ──────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    const total = range.count;
    for (let i = 0; i < total; i++) {
      doc.switchToPage(range.start + i);
      addFooter(i + 1, total);
    }

    doc.end();
  });
};

export default generatePdf;
