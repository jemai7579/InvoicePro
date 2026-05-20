"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichInvoiceWithCompliance = exports.finalizeInvoicePdf = exports.syncInvoiceTTNStatus = exports.submitInvoiceToTTNWorkflow = exports.signInvoiceTeifXml = exports.getDownloadableTeifXml = exports.generateInvoiceTeifXml = exports.validateTeifXml = exports.getInvoiceByIdForCompliance = exports.getInvoiceNextAction = exports.getComplianceLabel = exports.getInvoiceComplianceStatus = exports.STATUS_LABELS = exports.TTN_WORKFLOW_ORDER = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../prisma"));
const pdfGenerator_1 = __importDefault(require("../utils/pdfGenerator"));
const teifGenerator_1 = require("../utils/teifGenerator");
const numberToWords_1 = require("../utils/numberToWords");
const complianceStorage_1 = require("./complianceStorage");
const signatureProvider_1 = require("./signatureProvider");
const ttnProvider_1 = require("./ttnProvider");
const numberingService_1 = require("./numberingService");
const einvoiceConfig_1 = require("./einvoiceConfig");
exports.TTN_WORKFLOW_ORDER = [
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
exports.STATUS_LABELS = {
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
const LEGACY_STATUS_MAP = {
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
    PAID: 'ACCEPTED_TTN',
};
const normalizeWorkflowStatus = (status) => status ? LEGACY_STATUS_MAP[status] || null : null;
const legalStatusMap = {
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
const getBlockedRequirements = (nextAction) => {
    const readiness = (0, einvoiceConfig_1.getEInvoiceReadiness)();
    const missingRequirements = [];
    if (nextAction === 'generate-teif' && (0, einvoiceConfig_1.getEInvoiceConfig)().isProductionMode && !readiness.teifConfigured) {
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
const isInvoiceContentComplete = (invoice) => !!invoice.company?.matriculeFiscal &&
    !!invoice.client?.name &&
    !!invoice.lines?.length &&
    invoice.lines.every((line) => !!String(line.description || '').trim() &&
        Number(line.quantity || 0) > 0 &&
        Number(line.unitPrice || 0) >= 0);
const getInvoiceComplianceStatus = (invoice, metadata) => {
    const metadataStatus = normalizeWorkflowStatus(metadata.workflowStatus);
    if (metadataStatus && metadataStatus !== 'DRAFT')
        return metadataStatus;
    const ttnStatus = normalizeWorkflowStatus(invoice.ttnStatus);
    if (ttnStatus && ttnStatus !== 'DRAFT')
        return ttnStatus;
    const businessStatus = normalizeWorkflowStatus(invoice.status);
    if (businessStatus && businessStatus !== 'DRAFT')
        return businessStatus;
    if (invoice.status === 'VALIDATED' && isInvoiceContentComplete(invoice))
        return 'VALIDATED';
    return 'DRAFT';
};
exports.getInvoiceComplianceStatus = getInvoiceComplianceStatus;
const getComplianceLabel = (status, lang = 'fr') => exports.STATUS_LABELS[lang][status] || status;
exports.getComplianceLabel = getComplianceLabel;
const getInvoiceNextAction = (status) => {
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
exports.getInvoiceNextAction = getInvoiceNextAction;
const getInvoiceByIdForCompliance = async (invoiceId, companyId) => prisma_1.default.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
        company: true,
        client: true,
        lines: true,
        payments: true,
    },
});
exports.getInvoiceByIdForCompliance = getInvoiceByIdForCompliance;
const validateTeifXml = async (invoice) => {
    const errors = [];
    (0, einvoiceConfig_1.assertProductionTeifValidationConfigured)();
    if (invoice.status !== 'VALIDATED') {
        errors.push('La facture doit etre validee avant la generation TEIF.');
    }
    if (!invoice.number) {
        errors.push('Le numero officiel de facture est requis avant la generation TEIF.');
    }
    if (!invoice.clientId)
        errors.push('Veuillez selectionner un client.');
    if (!invoice.client?.name)
        errors.push('Le nom du client est requis.');
    if (!invoice.company?.matriculeFiscal)
        errors.push("L'identifiant fiscal de l'entreprise est requis.");
    if (!invoice.lines?.length)
        errors.push('Ajoutez au moins une ligne de facture.');
    if (errors.length === 0) {
        try {
            (0, teifGenerator_1.generateTeifXml)(invoice);
        }
        catch (error) {
            errors.push(error.message || 'La generation XML a echoue.');
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
};
exports.validateTeifXml = validateTeifXml;
const generateInvoiceTeifXml = async (invoice) => {
    const validation = await (0, exports.validateTeifXml)(invoice);
    if (!validation.valid) {
        throw new Error(validation.errors.join(' '));
    }
    const xml = (0, teifGenerator_1.generateTeifXml)(invoice);
    const xmlHash = crypto_1.default.createHash('sha256').update(xml, 'utf8').digest('hex');
    const teifGeneratedAt = new Date();
    const teifVersion = process.env.TEIF_SCHEMA_VERSION || null;
    const xmlPath = await (0, complianceStorage_1.saveComplianceArtifact)(invoice.companyId, invoice.id, 'teif.xml', xml);
    const metadata = await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, 'TEIF_GENERATED', {
        teifXmlPath: xmlPath,
        teifXmlHash: xmlHash,
        teifGeneratedAt: teifGeneratedAt.toISOString(),
        teifVersion,
        complianceMode: (0, einvoiceConfig_1.getEInvoiceConfig)().mode === 'sandbox' ? 'test' : (0, einvoiceConfig_1.getEInvoiceConfig)().mode === 'production' ? 'production' : 'mock',
    }, 'TEIF XML generated');
    await prisma_1.default.invoice.update({
        where: { id: invoice.id },
        data: {
            status: 'TEIF_GENERATED',
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
exports.generateInvoiceTeifXml = generateInvoiceTeifXml;
const getDownloadableTeifXml = async (invoice) => {
    const metadata = await (0, complianceStorage_1.readComplianceMetadata)(invoice.companyId, invoice.id);
    if (metadata.signedXmlPath) {
        const signed = await (0, complianceStorage_1.readComplianceArtifact)(metadata.signedXmlPath);
        if (signed)
            return signed.toString('utf-8');
    }
    if (metadata.teifXmlPath) {
        const xml = await (0, complianceStorage_1.readComplianceArtifact)(metadata.teifXmlPath);
        if (xml)
            return xml.toString('utf-8');
    }
    const generated = await (0, exports.generateInvoiceTeifXml)(invoice);
    return generated.xml;
};
exports.getDownloadableTeifXml = getDownloadableTeifXml;
const signInvoiceTeifXml = async (invoice, signedByUserId) => {
    const dossier = (0, einvoiceConfig_1.getCompanyDossierStatus)(invoice.company);
    if (!dossier.complete) {
        throw new Error(`Dossier entreprise incomplet: ${dossier.missingFields.join(', ')}`);
    }
    const metadata = await (0, complianceStorage_1.readComplianceMetadata)(invoice.companyId, invoice.id);
    const xml = metadata.teifXmlPath
        ? (await (0, complianceStorage_1.readComplianceArtifact)(metadata.teifXmlPath))?.toString('utf-8')
        : (await (0, exports.generateInvoiceTeifXml)(invoice)).xml;
    if (!xml) {
        throw new Error('Veuillez generer le fichier XML TEIF avant la signature.');
    }
    const provider = (0, signatureProvider_1.getSignatureProvider)();
    const result = await provider.signTeifXml(xml, invoice.company);
    if (!result.verified) {
        await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, 'TEIF_GENERATED', { signatureStatus: 'failed' }, 'Electronic signature failed');
        await prisma_1.default.invoice.update({
            where: { id: invoice.id },
            data: { legalStatus: 'signature_failed', signatureStatus: 'failed' },
        });
        throw new Error('La signature électronique a échoué.');
    }
    const signedXmlPath = await (0, complianceStorage_1.saveComplianceArtifact)(invoice.companyId, invoice.id, 'teif.signed.xml', result.signedXml);
    const nextMetadata = await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, 'SIGNED', {
        signedXmlPath,
        signatureProvider: result.providerLabel,
        certificateType: result.certificateType,
        lastSignatureTestDate: result.signedAt,
        signatureStatus: result.mode === 'mock' ? 'mock_signed' : 'signed',
        signatureTimestamp: result.signedAt,
        signedByUserId: signedByUserId || null,
        certificateIdentifier: result.certificateIdentifier || null,
        complianceMode: result.mode === 'mock' ? 'mock' : (0, einvoiceConfig_1.getEInvoiceConfig)().mode === 'sandbox' ? 'test' : 'production',
    }, 'Electronic signature completed');
    await prisma_1.default.invoice.update({
        where: { id: invoice.id },
        data: {
            status: 'SIGNED',
            ttnStatus: 'SIGNED',
            legalStatus: 'signed',
            signedXmlPath,
            signatureStatus: result.mode === 'mock' ? 'mock_signed' : 'signed',
            signatureTimestamp: new Date(result.signedAt),
            signedByUserId: signedByUserId || null,
            certificateIdentifier: result.certificateIdentifier || null,
        },
    });
    return { signedXml: result.signedXml, metadata: nextMetadata };
};
exports.signInvoiceTeifXml = signInvoiceTeifXml;
const submitInvoiceToTTNWorkflow = async (invoice) => {
    const dossier = (0, einvoiceConfig_1.getCompanyDossierStatus)(invoice.company);
    if (!dossier.complete) {
        throw new Error(`Dossier entreprise incomplet: ${dossier.missingFields.join(', ')}`);
    }
    const metadata = await (0, complianceStorage_1.readComplianceMetadata)(invoice.companyId, invoice.id);
    const signedXml = metadata.signedXmlPath
        ? (await (0, complianceStorage_1.readComplianceArtifact)(metadata.signedXmlPath))?.toString('utf-8')
        : null;
    if (!metadata.teifXmlPath) {
        throw new Error("Veuillez generer le fichier XML TEIF avant l'envoi a TTN.");
    }
    if (!signedXml) {
        throw new Error("Signature electronique requise avant l'envoi a TTN.");
    }
    const provider = (0, ttnProvider_1.getTTNProvider)();
    await provider.authenticate();
    const response = await provider.submitSignedInvoice({
        invoiceId: invoice.id,
        companyMatricule: invoice.company.matriculeFiscal,
        signedXml,
    });
    const metadataAfterSubmit = await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, response.status, {
        ttnSubmissionId: response.submissionId,
        lastTtnSyncAt: new Date().toISOString(),
        complianceMode: response.mode === 'mock' ? 'mock' : response.mode === 'sandbox' ? 'test' : 'production',
    }, response.message);
    await prisma_1.default.invoice.update({
        where: { id: invoice.id },
        data: {
            status: 'SENT_TO_TTN',
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
exports.submitInvoiceToTTNWorkflow = submitInvoiceToTTNWorkflow;
const syncInvoiceTTNStatus = async (invoice, simulationDecision) => {
    const metadata = await (0, complianceStorage_1.readComplianceMetadata)(invoice.companyId, invoice.id);
    const signedXml = metadata.signedXmlPath
        ? (await (0, complianceStorage_1.readComplianceArtifact)(metadata.signedXmlPath))?.toString('utf-8')
        : null;
    if (!metadata.ttnSubmissionId) {
        throw new Error("Aucune soumission TTN n'a encore ete enregistree.");
    }
    if (!signedXml) {
        throw new Error('Le fichier XML signe est introuvable pour cette facture.');
    }
    const provider = (0, ttnProvider_1.getTTNProvider)();
    const result = await provider.getSubmissionStatus({
        invoiceId: invoice.id,
        submissionId: metadata.ttnSubmissionId,
        signedXml,
        simulationDecision: simulationDecision || metadata.mockDecision || null,
    });
    if (result.status === 'PENDING_TTN') {
        await prisma_1.default.invoice.update({
            where: { id: invoice.id },
            data: {
                status: 'PENDING_TTN',
                ttnStatus: 'PENDING_TTN',
                legalStatus: 'submitted_to_ttn',
            },
        });
        const nextMetadata = await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, 'PENDING_TTN', {
            lastTtnSyncAt: new Date().toISOString(),
        }, result.message);
        return { result, metadata: nextMetadata };
    }
    if (result.status === 'REJECTED_TTN') {
        await prisma_1.default.invoice.update({
            where: { id: invoice.id },
            data: {
                status: 'REJECTED_TTN',
                ttnStatus: 'REJECTED_TTN',
                legalStatus: 'rejected_by_ttn',
            },
        });
        const nextMetadata = await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, 'REJECTED_TTN', {
            ttnRejectionReason: result.rejectionReason || null,
            lastTtnSyncAt: new Date().toISOString(),
        }, result.message);
        return { result, metadata: nextMetadata };
    }
    const approvedXmlPath = result.approvedXmlContent
        ? await (0, complianceStorage_1.saveComplianceArtifact)(invoice.companyId, invoice.id, 'teif.approved.xml', result.approvedXmlContent)
        : metadata.signedXmlPath;
    const nextMetadata = await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, 'ACCEPTED_TTN', {
        signedXmlPath: approvedXmlPath,
        ttnReference: result.ttnReference || metadata.ttnReference || null,
        ttnQrCode: result.qrCodeData || metadata.ttnQrCode || null,
        ttnAcceptedAt: new Date().toISOString(),
        lastTtnSyncAt: new Date().toISOString(),
        mockDecision: simulationDecision || metadata.mockDecision || null,
    }, result.message);
    await prisma_1.default.invoice.update({
        where: { id: invoice.id },
        data: {
            status: 'ACCEPTED_TTN',
            ttnStatus: 'ACCEPTED_TTN',
            ttnId: result.ttnReference || metadata.ttnSubmissionId || metadata.ttnReference || null,
            ttnReference: result.ttnReference || metadata.ttnReference || null,
            legalStatus: 'accepted_by_ttn',
        },
    });
    return { result, metadata: nextMetadata };
};
exports.syncInvoiceTTNStatus = syncInvoiceTTNStatus;
const finalizeInvoicePdf = async (invoice) => {
    const metadata = await (0, complianceStorage_1.readComplianceMetadata)(invoice.companyId, invoice.id);
    const currentStatus = (0, exports.getInvoiceComplianceStatus)(invoice, metadata);
    if (currentStatus !== 'ACCEPTED_TTN') {
        throw new Error('La facture finale est disponible uniquement apres acceptation TTN.');
    }
    const pdfBuffer = await (0, pdfGenerator_1.default)(invoice, 'FACTURE', metadata);
    const finalizedPdfPath = await (0, complianceStorage_1.saveComplianceArtifact)(invoice.companyId, invoice.id, 'invoice.final.pdf', pdfBuffer);
    const nextMetadata = await (0, complianceStorage_1.appendComplianceStatus)(invoice.companyId, invoice.id, 'ACCEPTED_TTN', {
        finalizedPdfPath,
    }, 'Final PDF generated');
    await prisma_1.default.invoice.update({
        where: { id: invoice.id },
        data: {
            status: 'ACCEPTED_TTN',
            ttnStatus: 'ACCEPTED_TTN',
            legalStatus: 'accepted_by_ttn',
        },
    });
    return {
        pdfBuffer,
        metadata: nextMetadata,
    };
};
exports.finalizeInvoicePdf = finalizeInvoicePdf;
const enrichInvoiceWithCompliance = async (invoice) => {
    const metadata = await (0, complianceStorage_1.readComplianceMetadata)(invoice.companyId, invoice.id);
    const complianceStatus = (0, exports.getInvoiceComplianceStatus)(invoice, metadata);
    const payments = invoice.payments || [];
    const totalPaid = payments
        .filter((payment) => ['PAID', 'PARTIALLY_PAID'].includes(payment.status))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const remainingAmount = Math.max(0, Number(invoice.netToPay || 0) - totalPaid);
    const nextAction = (0, exports.getInvoiceNextAction)(complianceStatus);
    const computedPaymentStatus = totalPaid <= 0 ? 'unpaid' : remainingAmount <= 0 ? 'paid' : 'partially_paid';
    const readiness = (0, einvoiceConfig_1.getEInvoiceReadiness)(invoice.company || null);
    const modeBadge = readiness.mode === 'mock'
        ? 'Mode simulation — non légal'
        : readiness.mode === 'sandbox'
            ? 'Mode test TTN — non légal'
            : 'Mode production';
    return {
        ...invoice,
        invoiceNumber: (0, numberingService_1.getInvoiceVisibleNumber)(invoice),
        items: invoice.lines || [],
        amountInWords: (0, numberToWords_1.numberToWordsTND)(Number(invoice.netToPay || 0)),
        paymentMethod: 'Espèce',
        complianceStatus,
        legalStatus: invoice.legalStatus || legalStatusMap[complianceStatus] || 'draft',
        teifStatus: metadata.teifXmlPath ? 'generated' : complianceStatus === 'REJECTED_TTN' ? 'validation_failed' : 'not_generated',
        signatureStatus: metadata.signatureStatus || invoice.signatureStatus || 'not_signed',
        ttnStatus: metadata.ttnReference ? 'accepted_by_ttn' : invoice.ttnStatus || complianceStatus,
        complianceLabelFr: (0, exports.getComplianceLabel)(complianceStatus, 'fr'),
        complianceLabelEn: (0, exports.getComplianceLabel)(complianceStatus, 'en'),
        complianceLabelAr: (0, exports.getComplianceLabel)(complianceStatus, 'ar'),
        complianceTimeline: metadata.statusHistory || [],
        teifXmlPath: metadata.teifXmlPath || null,
        teifXmlHash: metadata.teifXmlHash || invoice.teifXmlHash || null,
        teifGeneratedAt: metadata.teifGeneratedAt || invoice.teifGeneratedAt || null,
        teifVersion: metadata.teifVersion || invoice.teifVersion || null,
        signedXmlPath: metadata.signedXmlPath || null,
        finalizedPdfPath: metadata.finalizedPdfPath || null,
        ttnSubmissionId: metadata.ttnSubmissionId || null,
        ttnReference: metadata.ttnReference || invoice.ttnId || null,
        ttnRejectionReason: metadata.ttnRejectionReason || null,
        rejectedReason: metadata.ttnRejectionReason || null,
        ttnQrCode: metadata.ttnQrCode || null,
        ttnAcceptedAt: metadata.ttnAcceptedAt || null,
        acceptedByTtnAt: metadata.ttnAcceptedAt || null,
        sentToTtnAt: metadata.statusHistory?.find((entry) => normalizeWorkflowStatus(entry.status) === 'SENT_TO_TTN')?.at || null,
        complianceMode: metadata.complianceMode || ((0, ttnProvider_1.getTTNMode)() === 'sandbox' ? 'test' : (0, ttnProvider_1.getTTNMode)()),
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
        paymentStatus: (invoice.paymentStatus || computedPaymentStatus).toLowerCase(),
    };
};
exports.enrichInvoiceWithCompliance = enrichInvoiceWithCompliance;
