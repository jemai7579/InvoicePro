import fs from 'fs-extra';
import path from 'path';

export type ComplianceWorkflowStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'TEIF_GENERATED'
  | 'SIGNED'
  | 'SENT_TO_TTN'
  | 'PENDING_TTN'
  | 'ACCEPTED_TTN'
  | 'REJECTED_TTN'
  | 'CANCELLED'
  | 'READY_FOR_TEIF'
  | 'SIGNATURE_REQUIRED'
  | 'SUBMITTED_TO_TTN'
  | 'TTN_PROCESSING'
  | 'TTN_ACCEPTED'
  | 'TTN_REJECTED'
  | 'FINALIZED';

export interface ComplianceHistoryEntry {
  status: ComplianceWorkflowStatus;
  at: string;
  note?: string;
}

export interface InvoiceComplianceMetadata {
  workflowStatus?: ComplianceWorkflowStatus;
  teifXmlPath?: string | null;
  signedXmlPath?: string | null;
  finalizedPdfPath?: string | null;
  ttnSubmissionId?: string | null;
  ttnReference?: string | null;
  ttnRejectionReason?: string | null;
  ttnQrCode?: string | null;
  ttnAcceptedAt?: string | null;
  complianceMode?: 'mock' | 'test' | 'production';
  teifXmlHash?: string | null;
  teifGeneratedAt?: string | null;
  teifVersion?: string | null;
  signatureStatus?: string | null;
  signatureTimestamp?: string | null;
  signatureHash?: string | null;
  signatureIsMock?: boolean | null;
  signatureValidationStatus?: string | null;
  signedByUserId?: string | null;
  certificateIdentifier?: string | null;
  ttnProofPath?: string | null;
  lastTtnSyncAt?: string | null;
  lastStatusAt?: string | null;
  signatureProvider?: string | null;
  certificateType?: string | null;
  lastSignatureTestDate?: string | null;
  mockDecision?: 'accept' | 'reject' | null;
  statusHistory?: ComplianceHistoryEntry[];
}

const complianceRoot = path.resolve('uploads/compliance');
const uploadsRoot = path.resolve('uploads');

const isWithinDirectory = (baseDir: string, candidate: string) =>
  candidate === baseDir || candidate.startsWith(`${baseDir}${path.sep}`);

const ensureInvoiceDir = async (companyId: string, invoiceId: string) => {
  const dir = path.resolve(complianceRoot, companyId, invoiceId);
  if (!isWithinDirectory(complianceRoot, dir)) {
    throw new Error('Invalid compliance storage path.');
  }
  await fs.ensureDir(dir);
  return dir;
};

const buildPublicPath = (absolutePath: string) => {
  const relative = path.relative(path.resolve('uploads'), absolutePath).replace(/\\/g, '/');
  return `/uploads/${relative}`;
};

const buildAbsolutePath = (publicPath: string) => {
  if (!publicPath.startsWith('/uploads/compliance/')) {
    throw new Error('Invalid compliance artifact path.');
  }
  const absolutePath = path.resolve(uploadsRoot, publicPath.replace(/^\/uploads\//, ''));
  if (!isWithinDirectory(complianceRoot, absolutePath)) {
    throw new Error('Invalid compliance artifact path.');
  }
  return absolutePath;
};

export const readComplianceMetadata = async (companyId: string, invoiceId: string): Promise<InvoiceComplianceMetadata> => {
  const dir = await ensureInvoiceDir(companyId, invoiceId);
  const metadataPath = path.join(dir, 'metadata.json');

  if (!(await fs.pathExists(metadataPath))) {
    return {};
  }

  return fs.readJson(metadataPath);
};

export const writeComplianceMetadata = async (
  companyId: string,
  invoiceId: string,
  metadata: InvoiceComplianceMetadata
): Promise<InvoiceComplianceMetadata> => {
  const dir = await ensureInvoiceDir(companyId, invoiceId);
  const metadataPath = path.join(dir, 'metadata.json');
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  return metadata;
};

export const appendComplianceStatus = async (
  companyId: string,
  invoiceId: string,
  status: ComplianceWorkflowStatus,
  patch: Partial<InvoiceComplianceMetadata> = {},
  note?: string
) => {
  const current = await readComplianceMetadata(companyId, invoiceId);
  const now = new Date().toISOString();
  const next: InvoiceComplianceMetadata = {
    ...current,
    ...patch,
    workflowStatus: status,
    lastStatusAt: now,
    statusHistory: [
      ...(current.statusHistory || []),
      {
        status,
        at: now,
        note,
      },
    ],
  };

  return writeComplianceMetadata(companyId, invoiceId, next);
};

export const saveComplianceArtifact = async (
  companyId: string,
  invoiceId: string,
  fileName: string,
  content: Buffer | string
) => {
  const dir = await ensureInvoiceDir(companyId, invoiceId);
  const safeFileName = path.basename(fileName);
  const absolutePath = path.resolve(dir, safeFileName);
  if (!isWithinDirectory(dir, absolutePath)) {
    throw new Error('Invalid compliance artifact file name.');
  }
  await fs.writeFile(absolutePath, content);
  return buildPublicPath(absolutePath);
};

export const readComplianceArtifact = async (publicPath?: string | null) => {
  if (!publicPath) return null;
  const absolutePath = buildAbsolutePath(publicPath);
  if (!(await fs.pathExists(absolutePath))) return null;
  return fs.readFile(absolutePath);
};

export const resolveComplianceArtifactPath = (publicPath?: string | null) => {
  if (!publicPath) return null;
  return buildAbsolutePath(publicPath);
};
