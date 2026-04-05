"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotif = void 0;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Creates a notification for a company.
 * Types: DEMANDE_SENT | DEMANDE_ACCEPTED | DEMANDE_REJECTED |
 *        TTN_ACCEPTED | TTN_REJECTED | XML_IMPORTED | INFO
 */
const createNotif = async (companyId, title, message, type) => {
    try {
        await prisma_1.default.notification.create({
            data: { companyId, title, message, type }
        });
    }
    catch (err) {
        // Never throw — notif creation should never crash main flow
        console.error('[Notification] Failed to create:', err);
    }
};
exports.createNotif = createNotif;
