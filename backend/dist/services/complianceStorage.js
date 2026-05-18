"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveComplianceArtifactPath = exports.readComplianceArtifact = exports.saveComplianceArtifact = exports.appendComplianceStatus = exports.writeComplianceMetadata = exports.readComplianceMetadata = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const complianceRoot = path_1.default.resolve('uploads/compliance');
const ensureInvoiceDir = async (companyId, invoiceId) => {
    const dir = path_1.default.join(complianceRoot, companyId, invoiceId);
    await fs_extra_1.default.ensureDir(dir);
    return dir;
};
const buildPublicPath = (absolutePath) => {
    const relative = path_1.default.relative(path_1.default.resolve('uploads'), absolutePath).replace(/\\/g, '/');
    return `/uploads/${relative}`;
};
const buildAbsolutePath = (publicPath) => path_1.default.resolve('uploads', publicPath.replace(/^\/uploads\//, ''));
const readComplianceMetadata = async (companyId, invoiceId) => {
    const dir = await ensureInvoiceDir(companyId, invoiceId);
    const metadataPath = path_1.default.join(dir, 'metadata.json');
    if (!(await fs_extra_1.default.pathExists(metadataPath))) {
        return {};
    }
    return fs_extra_1.default.readJson(metadataPath);
};
exports.readComplianceMetadata = readComplianceMetadata;
const writeComplianceMetadata = async (companyId, invoiceId, metadata) => {
    const dir = await ensureInvoiceDir(companyId, invoiceId);
    const metadataPath = path_1.default.join(dir, 'metadata.json');
    await fs_extra_1.default.writeJson(metadataPath, metadata, { spaces: 2 });
    return metadata;
};
exports.writeComplianceMetadata = writeComplianceMetadata;
const appendComplianceStatus = async (companyId, invoiceId, status, patch = {}, note) => {
    const current = await (0, exports.readComplianceMetadata)(companyId, invoiceId);
    const now = new Date().toISOString();
    const next = {
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
    return (0, exports.writeComplianceMetadata)(companyId, invoiceId, next);
};
exports.appendComplianceStatus = appendComplianceStatus;
const saveComplianceArtifact = async (companyId, invoiceId, fileName, content) => {
    const dir = await ensureInvoiceDir(companyId, invoiceId);
    const absolutePath = path_1.default.join(dir, fileName);
    await fs_extra_1.default.writeFile(absolutePath, content);
    return buildPublicPath(absolutePath);
};
exports.saveComplianceArtifact = saveComplianceArtifact;
const readComplianceArtifact = async (publicPath) => {
    if (!publicPath)
        return null;
    const absolutePath = buildAbsolutePath(publicPath);
    if (!(await fs_extra_1.default.pathExists(absolutePath)))
        return null;
    return fs_extra_1.default.readFile(absolutePath);
};
exports.readComplianceArtifact = readComplianceArtifact;
const resolveComplianceArtifactPath = (publicPath) => {
    if (!publicPath)
        return null;
    return buildAbsolutePath(publicPath);
};
exports.resolveComplianceArtifactPath = resolveComplianceArtifactPath;
