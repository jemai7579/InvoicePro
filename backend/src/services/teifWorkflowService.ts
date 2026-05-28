import type { Invoice, Company, Client, InvoiceLine, Payment } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../prisma';
import generatePdf from '../utils/pdfGenerator';
import { generateTeifXml } from '../utils/teifGenerator';
import { numberToWordsTND } from '../utils/numberToWords';
import {
  appendComplianceStatus,
  readComplianceArtifact,
  readComplianceMetadata,
  saveComplianceArtifact,
  type ComplianceWorkflowStatus,
  type InvoiceComplianceMetadata,
} from './complianceStorage';
import { getSignatureProvider } from './signatureProvider';
import { getTTNMode, getTTNProvider } from './ttnProvider';
import { getInvoiceVisibleNumber } from './numberingService';
import {
  assertProductionTeifValidationConfigured,
  getCompanyDossierStatus,
  getEInvoiceConfig,
  getEInvoiceReadiness,
} from './einvoiceConfig';

type FullInvoice = Invoice & {
  company: Company;
  client: Client;
  lines: InvoiceLine[];
  payments?: Payment[];
};

export const TTN_WORKFLOW_ORDER: ComplianceWorkflowStatus[] = [
  'DRAFT',
  'VALIDATED',
  'TEIF_GENERATED',
  'SIGNED',
  'SENT_TO_TTN',
  'PENDING_TTN',
  'ACCEPTED_TTN',
  'REJECTED_TTN',
  'CANCELLED',
];

export const STATUS_LABELS: Record<'fr' | 'en' | 'ar', Record<string, string>> = {
  fr: {
    DRAFT: 'Brouillon',
    VALIDATED: 'Validee',
    TEIF_GENERATED: 'TEIF genere',
    SIGNED: 'Signee',
    SENT_TO_TTN: 'Envoyee a TTN',
    PENDING_TTN: 'En attente TTN',
    ACCEPTED_TTN: 'Acceptee par TTN',
    REJECTED_TTN: 'Rejetee par TTN',
    CANCELLED: 'Annulee',
  },
  en: {
    DRAFT: 'Draft',
    VALIDATED: 'Validated',
    TEIF_GENERATED: 'TEIF generated',
    SIGNED: 'Signed',
    SENT_TO_TTN: 'Sent to TTN',
    PENDING_TTN: 'Pending TTN',
    ACCEPTED_TTN: 'Accepted by TTN',
    REJECTED_TTN: 'Rejected by TTN',
    CANCELLED: 'Cancelled',
  },
  ar: {
    DRAFT: 'مسودة',
    VALIDATED: 'مؤكدة',
    TEIF_GENERATED: 'تم توليد TEIF',
    SIGNED: 'موقعة',
    SENT_TO_TTN: 'أرسلت إلى TTN',
    PENDING_TTN: 'في انتظار TTN',
    ACCEPTED_TTN: 'مقبولة من TTN',
    REJECTED_TTN: 'مرفوضة من TTN',
    CANCELLED: 'ملغاة',
  },
};

const isLegalTtnAcceptance = (mode?: string | null, reference?: string | null) =>
  mode === 'production' && Boolean(reference);

const LEGACY_STATUS_MAP: Record<string, ComplianceWorkflowStatus> = {
  DRAFT: 'DRAFT',
  READY_FOR_TEIF: 'VALIDATED',
  PENDING_VALIDATION: 'VALIDATED',
  VALIDATED: 'VALIDATED',
  TEIF_GENERATED: 'TEIF_GENERATED',
  SIGNATURE_REQUIRED: 'TEIF_GENERATED',
  SIGNED: 'SIGNED',
  SUBMITTED_TO_TTN: 'SENT_TO_TTN',
  SENT_TO_TTN: 'SENT_TO_TTN',
  TTN_PROCESSING: 'PENDING_TTN',
  PENDING_TTN: 'PENDING_TTN',
  TTN_ACCEPTED: 'ACCEPTED_TTN',
  FINALIZED: 'ACCEPTED_TTN',
  ACCEPTED_TTN: 'ACCEPTED_TTN',
  TTN_REJECTED: 'REJECTED_TTN',
  REJECTED: 'REJECTED_TTN',
  REJECTED_TTN: 'REJECTED_TTN',
  CANCELLED: 'CANCELLED',
};

const normalizeWorkflowStatus = (status?: string | null): ComplianceWorkflowStatus | null =>
  status ? LEGACY_STATUS_MAP[status] || null : null;

const legalStatusMap: Record<ComplianceWorkflowStatus, string> = {
  DRAFT: 'draft',
  VALIDATED: 'draft',
  TEIF_GENERATED: 'teif_generated',
  SIGNED: 'signed',
  SENT_TO_TTN: 'submitted_to_ttn',
  PENDING_TTN: 'submitted_to_ttn',
  ACCEPTED_TTN: 'accepted_by_ttn',
  REJECTED_TTN: 'rejected_by_ttn',
  CANCELLED: 'archived',
  READY_FOR_TEIF: 'draft',
  SIGNATURE_REQUIRED: 'ready_for_signature',
  SUBMITTED_TO_TTN: 'submitted_to_ttn',
  TTN_PROCESSING: 'submitted_to_ttn',
  TTN_ACCEPTED: 'accepted_by_ttn',
  TTN_REJECTED: 'rejected_by_ttn',
  FINALIZED: 'archived',
};

const getBlockedRequirements = (nextAction: string) => {
  const readiness = getEInvoiceReadiness();
  const missingRequirements: string[] = [];
  if (nextAction === 'generate-teif' && getEInvoiceConfig().isProductionMode && !readiness.teifConfigured) {
    missingRequirements.push('Official TTN TEIF XSD not configured');
  }
  if (nextAction === 'sign-teif' && !readiness.signatureConfigured) {
    missingRequirements.push('Signature provider not configured');
  }
  if (nextAction === 'submit-ttn' && !readiness.ttnConfigured && !readiness.mode.includes('mock')) {
    missingRequirements.push('TTN API credentials missing');
  }
  return missingRequirements;
};

const isInvoiceContentComplete = (
  invoice: Pick<Invoice, 'status'> & {
    company?: Partial<Company> | null;
    client?: Partial<Client> | null;
    lines?: Partial<InvoiceLine>[] | null;
  }
) =>
  !!invoice.company?.matriculeFiscal &&
  !!invoice.client?.name &&
  !!invoice.lines?.length &&
  invoice.lines.every(
    (line) =>
      !!String(line.description || '').trim() &&
      Number(line.quantity || 0) > 0 &&
      Number(line.unitPrice || 0) >= 0
  );

export const getInvoiceComplianceStatus = (
  invoice: Pick<Invoice, 'status' | 'ttnStatus'> & {
    company?: Partial<Company> | null;
    client?: Partial<Client> | null;
    lines?: Partial<InvoiceLine>[] | null;
  },
  metadata: InvoiceComplianceMetadata
): ComplianceWorkflowStatus => {
  const metadataStatus = normalizeWorkflowStatus(metadata.workflowStatus);
  if (metadataStatus && metadataStatus !== 'DRAFT') return metadataStatus;

  const ttnStatus = normalizeWorkflowStatus(invoice.ttnStatus);
  if (ttnStatus && ttnStatus !== 'DRAFT') return ttnStatus;

  const businessStatus = normalizeWorkflowStatus(invoice.status);
  if (businessStatus && businessStatus !== 'DRAFT') return businessStatus;

  if (invoice.status === 'VALIDATED' && isInvoiceContentComplete(invoice)) return 'VALIDATED';
  return 'DRAFT';
};

export const getComplianceLabel = (status: ComplianceWorkflowStatus, lang: 'fr' | 'en' | 'ar' = 'fr') =>
  STATUS_LABELS[lang][status] || status;

export const getInvoiceNextAction = (status: ComplianceWorkflowStatus) => {
  switch (status) {
    case 'DRAFT':
      return 'validate-invoice';
    case 'VALIDATED':
      return 'generate-teif';
    case 'TEIF_GENERATED':
      return 'sign-teif';
    case 'SIGNED':
      return 'submit-ttn';
    case 'SENT_TO_TTN':
    case 'PENDING_TTN':
      return 'check-ttn';
    case 'REJECTED_TTN':
      return 'correct-invoice';
    case 'ACCEPTED_TTN':
      return 'download-final';
    default:
      return 'validate-invoice';
  }
};

export const getInvoiceByIdForCompliance = async (invoiceId: string, companyId: string): Promise<FullInvoice | null> =>
  prisma.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
      company: true,
      client: true,
      lines: true,
      payments: true,
    },
  });

export const validateTeifXml = async (invoice: FullInvoice) => {
  const errors: string[] = [];
  assertProductionTeifValidationConfigured();

  if (invoice.status !== 'VALIDATED') {
    errors.push('La facture doit etre validee avant la generation TEIF.');
  }
  if (!invoice.number) {
    errors.push('Le numero officiel de facture est requis avant la generation TEIF.');
  }
  if (!invoice.clientId) errors.push('Veuillez selectionner un client.');
  if (!invoice.client?.name) errors.push('Le nom du client est requis.');
  if (!invoice.company?.matriculeFiscal) errors.push("L'identifiant fiscal de l'entreprise est requis.");
  if (!invoice.lines?.length) errors.push('Ajoutez au moins une ligne de facture.');

  if (errors.length === 0) {
    try {
      generateTeifXml(invoice);
    } catch (error: any) {
      errors.push(error.message || 'La generation XML a echoue.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const assertCanGenerateTEIF = async (invoice: FullInvoice) => {
  const validation = await validateTeifXml(invoice);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }
};

export const generateInvoiceTeifXml = async (invoice: FullInvoice) => {
  await assertCanGenerateTEIF(invoice);

  const xml = generateTeifXml(invoice);
  const xmlHash = crypto.createHash('sha256').update(xml, 'utf8').digest('hex');
  const teifGeneratedAt = new Date();
  const teifVersion = process.env.TEIF_SCHEMA_VERSION || null;
  const xmlPath = await saveComplianceArtifact(invoice.companyId, invoice.id, 'teif.xml', xml);
  const metadata = await appendComplianceStatus(
    invoice.companyId,
    invoice.id,
    'TEIF_GENERATED',
    {
      teifXmlPath: xmlPath,
      teifXmlHash: xmlHash,
      teifGeneratedAt: teifGeneratedAt.toISOString(),
      teifVersion,
      complianceMode: getEInvoiceConfig().mode === 'sandbox' ? 'test' : getEInvoiceConfig().mode === 'production' ? 'production' : 'mock',
    },
    'TEIF XML generated'
  );

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'TEIF_GENERATED' as any,
      ttnStatus: 'TEIF_GENERATED',
      legalStatus: 'teif_generated',
      teifXmlPath: xmlPath,
      teifXmlHash: xmlHash,
      teifGeneratedAt,
      teifVersion,
    },
  });

  return { xml, metadata };
};

export const getDownloadableTeifXml = async (invoice: FullInvoice) => {
  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);

  if (metadata.signedXmlPath) {
    const signed = await readComplianceArtifact(metadata.signedXmlPath);
    if (signed) return signed.toString('utf-8');
  }

  if (metadata.teifXmlPath) {
    const xml = await readComplianceArtifact(metadata.teifXmlPath);
    if (xml) return xml.toString('utf-8');
  }

  const generated = await generateInvoiceTeifXml(invoice);
  return generated.xml;
};

export const assertCanSignTEIF = async (invoice: FullInvoice) => {
  const dossier = getCompanyDossierStatus(invoice.company);
  if (!dossier.complete) {
    throw new Error(`Dossier entreprise incomplet: ${dossier.missingFields.join(', ')}`);
  }
  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);
  const xml = metadata.teifXmlPath ? await readComplianceArtifact(metadata.teifXmlPath) : null;
  if (!metadata.teifXmlPath || !xml) {
    throw new Error('Veuillez generer le fichier XML TEIF avant la signature.');
  }
  if (getEInvoiceConfig().isProductionMode && metadata.signatureIsMock) {
    throw new Error('MOCK_SIGNATURE_NOT_ALLOWED: Signature simulee interdite en production.');
  }
};

export const signInvoiceTeifXml = async (invoice: FullInvoice, signedByUserId?: string | null) => {
  await assertCanSignTEIF(invoice);

  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);
  const xml = metadata.teifXmlPath
    ? (await readComplianceArtifact(metadata.teifXmlPath))?.toString('utf-8')
    : (await generateInvoiceTeifXml(invoice)).xml;

  if (!xml) {
    throw new Error('Veuillez generer le fichier XML TEIF avant la signature.');
  }

  const provider = getSignatureProvider();
  const result = await provider.signTeifXml(xml, invoice.company);
  const signatureHash = crypto.createHash('sha256').update(result.signedXml, 'utf8').digest('hex');
  if (!result.verified) {
    await appendComplianceStatus(
      invoice.companyId,
      invoice.id,
      'TEIF_GENERATED',
      { signatureStatus: 'failed' },
      'Electronic signature failed'
    );
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { legalStatus: 'signature_failed', signatureStatus: 'failed' },
    });
    throw new Error('La signature électronique a échoué.');
  }
  const signedXmlPath = await saveComplianceArtifact(invoice.companyId, invoice.id, 'teif.signed.xml', result.signedXml);

  const nextMetadata = await appendComplianceStatus(
    invoice.companyId,
    invoice.id,
    'SIGNED',
    {
      signedXmlPath,
      signatureProvider: result.providerLabel,
      certificateType: result.certificateType,
      lastSignatureTestDate: result.signedAt,
      signatureStatus: result.mode === 'mock' ? 'mock_signed' : 'signed',
      signatureTimestamp: result.signedAt,
      signatureHash,
      signatureIsMock: result.mode === 'mock',
      signatureValidationStatus: result.verified ? 'verified' : 'failed',
      signedByUserId: signedByUserId || null,
      certificateIdentifier: result.certificateIdentifier || null,
      complianceMode: result.mode === 'mock' ? 'mock' : getEInvoiceConfig().mode === 'sandbox' ? 'test' : 'production',
    },
    result.mode === 'mock' ? 'Signature simulee - non legale' : 'Electronic signature completed'
  );

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'SIGNED' as any,
      ttnStatus: 'SIGNED',
      legalStatus: result.mode === 'mock' ? 'signature_simulation_non_legal' : 'signed',
      signedXmlPath,
      signatureStatus: result.mode === 'mock' ? 'mock_signed' : 'signed',
      signatureTimestamp: new Date(result.signedAt),
      signedByUserId: signedByUserId || null,
      certificateIdentifier: result.certificateIdentifier || null,
    },
  });

  return { signedXml: result.signedXml, metadata: nextMetadata };
};

export const assertCanSubmitToTTN = async (invoice: FullInvoice) => {
  const dossier = getCompanyDossierStatus(invoice.company);
  if (!dossier.complete) {
    throw new Error(`Dossier entreprise incomplet: ${dossier.missingFields.join(', ')}`);
  }
  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);
  const signedXml = metadata.signedXmlPath
    ? (await readComplianceArtifact(metadata.signedXmlPath))?.toString('utf-8')
    : null;
  if (!metadata.teifXmlPath) {
    throw new Error("Veuillez generer le fichier XML TEIF avant l'envoi a TTN.");
  }
  if (!signedXml) {
    throw new Error("Signature electronique requise avant l'envoi a TTN.");
  }
  if (getEInvoiceConfig().isProductionMode && metadata.signatureIsMock) {
    throw new Error('MOCK_SIGNATURE_NOT_ALLOWED: Signature simulee interdite pour une soumission TTN production.');
  }
};

export const submitInvoiceToTTNWorkflow = async (invoice: FullInvoice) => {
  await assertCanSubmitToTTN(invoice);

  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);
  const signedXml = metadata.signedXmlPath
    ? (await readComplianceArtifact(metadata.signedXmlPath))?.toString('utf-8')
    : null;
  if (!signedXml) {
    throw new Error("Signature electronique requise avant l'envoi a TTN.");
  }

  const provider = getTTNProvider();
  await provider.authenticate();
  const response = await provider.submitSignedInvoice({
    invoiceId: invoice.id,
    companyMatricule: invoice.company.matriculeFiscal,
    signedXml,
  });

  const metadataAfterSubmit = await appendComplianceStatus(
    invoice.companyId,
    invoice.id,
    response.status,
    {
      ttnSubmissionId: response.submissionId,
      lastTtnSyncAt: new Date().toISOString(),
      complianceMode: response.mode === 'mock' ? 'mock' : response.mode === 'sandbox' ? 'test' : 'production',
    },
    response.message
  );

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'SENT_TO_TTN' as any,
      ttnId: response.submissionId,
      ttnStatus: response.status,
      legalStatus: 'submitted_to_ttn',
    },
  });

  return {
    message: response.message,
    metadata: metadataAfterSubmit,
  };
};

export const syncInvoiceTTNStatus = async (
  invoice: FullInvoice,
  simulationDecision?: 'accept' | 'reject' | null
) => {
  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);
  const signedXml = metadata.signedXmlPath
    ? (await readComplianceArtifact(metadata.signedXmlPath))?.toString('utf-8')
    : null;

  if (!metadata.ttnSubmissionId) {
    throw new Error("Aucune soumission TTN n'a encore ete enregistree.");
  }

  if (!signedXml) {
    throw new Error('Le fichier XML signe est introuvable pour cette facture.');
  }

  const provider = getTTNProvider();
  const result = await provider.getSubmissionStatus({
    invoiceId: invoice.id,
    submissionId: metadata.ttnSubmissionId,
    signedXml,
    simulationDecision: simulationDecision || metadata.mockDecision || null,
  });

  if (result.status === 'PENDING_TTN') {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PENDING_TTN' as any,
        ttnStatus: 'PENDING_TTN',
        legalStatus: 'submitted_to_ttn',
      },
    });

    const nextMetadata = await appendComplianceStatus(
      invoice.companyId,
      invoice.id,
      'PENDING_TTN',
      {
        lastTtnSyncAt: new Date().toISOString(),
      },
      result.message
    );

    return { result, metadata: nextMetadata };
  }

  if (result.status === 'REJECTED_TTN') {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'REJECTED_TTN' as any,
        ttnStatus: 'REJECTED_TTN',
        legalStatus: 'rejected_by_ttn',
      },
    });

    const nextMetadata = await appendComplianceStatus(
      invoice.companyId,
      invoice.id,
      'REJECTED_TTN',
      {
        ttnRejectionReason: result.rejectionReason || null,
        lastTtnSyncAt: new Date().toISOString(),
      },
      result.message
    );

    return { result, metadata: nextMetadata };
  }

  const approvedXmlPath = result.approvedXmlContent
    ? await saveComplianceArtifact(invoice.companyId, invoice.id, 'teif.approved.xml', result.approvedXmlContent)
    : metadata.signedXmlPath;

  const legalAcceptance = isLegalTtnAcceptance(result.mode, result.ttnReference || metadata.ttnReference || null);
  const nextMetadata = await appendComplianceStatus(
    invoice.companyId,
    invoice.id,
    'ACCEPTED_TTN',
    {
      signedXmlPath: approvedXmlPath,
      complianceMode: result.mode === 'mock' ? 'mock' : result.mode === 'sandbox' ? 'test' : 'production',
      ttnReference: legalAcceptance ? result.ttnReference || metadata.ttnReference || null : null,
      ttnQrCode: legalAcceptance ? result.qrCodeData || metadata.ttnQrCode || null : null,
      ttnAcceptedAt: legalAcceptance ? new Date().toISOString() : null,
      lastTtnSyncAt: new Date().toISOString(),
      mockDecision: simulationDecision || metadata.mockDecision || null,
    },
    result.message
  );

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'ACCEPTED_TTN' as any,
      ttnStatus: 'ACCEPTED_TTN',
      ttnId: legalAcceptance ? result.ttnReference || metadata.ttnReference || null : metadata.ttnSubmissionId || null,
      ttnReference: legalAcceptance ? result.ttnReference || metadata.ttnReference || null : null,
      legalStatus: legalAcceptance ? 'accepted_by_ttn' : 'ttn_simulation_accepted_non_legal',
    },
  });

  return { result, metadata: nextMetadata };
};

export const finalizeInvoicePdf = async (invoice: FullInvoice) => {
  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);
  const currentStatus = getInvoiceComplianceStatus(invoice, metadata);

  if (currentStatus !== 'ACCEPTED_TTN' || !isLegalTtnAcceptance(metadata.complianceMode, metadata.ttnReference)) {
    throw new Error('La facture finale legale est disponible uniquement apres acceptation TTN officielle en production.');
  }

  const pdfBuffer = await generatePdf(invoice, 'FACTURE', metadata);
  const finalizedPdfPath = await saveComplianceArtifact(invoice.companyId, invoice.id, 'invoice.final.pdf', pdfBuffer);
  const nextMetadata = await appendComplianceStatus(
    invoice.companyId,
    invoice.id,
    'ACCEPTED_TTN',
    {
      finalizedPdfPath,
    },
    'Final PDF generated'
  );

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'ACCEPTED_TTN' as any,
      ttnStatus: 'ACCEPTED_TTN',
      legalStatus: 'accepted_by_ttn',
    },
  });

  return {
    pdfBuffer,
    metadata: nextMetadata,
  };
};

export const enrichInvoiceWithCompliance = async <T extends Invoice & { companyId: string; id: string }>(
  invoice: T
) => {
  const metadata = await readComplianceMetadata(invoice.companyId, invoice.id);
  const complianceStatus = getInvoiceComplianceStatus(invoice, metadata);
  const payments = (invoice as any).payments || [];
  const totalPaid = payments
    .filter((payment: any) => ['PAID', 'PARTIALLY_PAID'].includes(payment.status))
    .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
  const remainingAmount = Math.max(0, Number((invoice as any).netToPay || 0) - totalPaid);
  const nextAction = getInvoiceNextAction(complianceStatus);
  const computedPaymentStatus = totalPaid <= 0 ? 'unpaid' : remainingAmount <= 0 ? 'paid' : 'partially_paid';
  const readiness = getEInvoiceReadiness((invoice as any).company || null);
  const modeBadge =
    readiness.mode === 'mock'
      ? 'Mode simulation — non légal'
      : readiness.mode === 'sandbox'
        ? 'Mode test TTN — non légal'
        : 'Mode production';

  return {
    ...invoice,
    invoiceNumber: getInvoiceVisibleNumber(invoice),
    items: (invoice as any).lines || [],
    amountInWords: numberToWordsTND(Number((invoice as any).netToPay || 0)),
    paymentMethod: 'Espèce',
    complianceStatus,
    legalStatus:
      complianceStatus === 'ACCEPTED_TTN' && !isLegalTtnAcceptance(metadata.complianceMode, metadata.ttnReference)
        ? 'ttn_simulation_accepted_non_legal'
        : (invoice as any).legalStatus || legalStatusMap[complianceStatus] || 'draft',
    teifStatus: metadata.teifXmlPath ? 'generated' : complianceStatus === 'REJECTED_TTN' ? 'validation_failed' : 'not_generated',
    signatureStatus: metadata.signatureStatus || (invoice as any).signatureStatus || 'not_signed',
    ttnStatus: metadata.ttnReference ? 'accepted_by_ttn' : (invoice as any).ttnStatus || complianceStatus,
    complianceLabelFr:
      complianceStatus === 'ACCEPTED_TTN' && !isLegalTtnAcceptance(metadata.complianceMode, metadata.ttnReference)
        ? 'Simulation TTN acceptee - non legal'
        : getComplianceLabel(complianceStatus, 'fr'),
    complianceLabelEn:
      complianceStatus === 'ACCEPTED_TTN' && !isLegalTtnAcceptance(metadata.complianceMode, metadata.ttnReference)
        ? 'TTN simulation accepted - not legal'
        : getComplianceLabel(complianceStatus, 'en'),
    complianceLabelAr: getComplianceLabel(complianceStatus, 'ar'),
    complianceTimeline: metadata.statusHistory || [],
    teifXmlPath: metadata.teifXmlPath || null,
    teifXmlHash: metadata.teifXmlHash || (invoice as any).teifXmlHash || null,
    teifGeneratedAt: metadata.teifGeneratedAt || (invoice as any).teifGeneratedAt || null,
    teifVersion: metadata.teifVersion || (invoice as any).teifVersion || null,
    signedXmlPath: metadata.signedXmlPath || null,
    finalizedPdfPath: metadata.finalizedPdfPath || null,
    ttnSubmissionId: metadata.ttnSubmissionId || null,
    ttnReference: metadata.ttnReference || null,
    ttnRejectionReason: metadata.ttnRejectionReason || null,
    rejectedReason: metadata.ttnRejectionReason || null,
    ttnQrCode: metadata.ttnQrCode || null,
    ttnAcceptedAt: metadata.ttnAcceptedAt || null,
    acceptedByTtnAt: metadata.ttnAcceptedAt || null,
    sentToTtnAt:
      metadata.statusHistory?.find((entry) => normalizeWorkflowStatus(entry.status) === 'SENT_TO_TTN')?.at || null,
    complianceMode: metadata.complianceMode || (getTTNMode() === 'sandbox' ? 'test' : getTTNMode()),
    eInvoiceMode: readiness.mode,
    modeBadge,
    eInvoiceReadiness: readiness,
    lastTtnSyncAt: metadata.lastTtnSyncAt || null,
    lastStatusAt: metadata.lastStatusAt || invoice.updatedAt,
    nextAction,
    missingRequirements: getBlockedRequirements(nextAction),
    signatureProvider: metadata.signatureProvider || null,
    certificateType: metadata.certificateType || null,
    lastSignatureTestDate: metadata.lastSignatureTestDate || null,
    hasTeifXml: !!metadata.teifXmlPath,
    hasSignedXml: !!metadata.signedXmlPath,
    hasFinalPdf: !!metadata.finalizedPdfPath,
    ttnResponse: metadata.statusHistory?.[metadata.statusHistory.length - 1]?.note || null,
    totalPaid,
    remainingAmount,
    paymentStatus: ((invoice as any).paymentStatus || computedPaymentStatus).toLowerCase(),
  };
};
