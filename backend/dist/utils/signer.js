"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signXml = void 0;
const node_forge_1 = __importDefault(require("node-forge"));
const crypto_1 = __importDefault(require("crypto"));
const signXml = ({ xmlString, p12Buffer, password }) => {
    try {
        // 1. Decode p12 and get key/cert
        // Use 'raw' instead of 'binary' for buffer to string if needed, or forge's byteBuffer
        const p12Asn1 = node_forge_1.default.asn1.fromDer(node_forge_1.default.util.createBuffer(p12Buffer.toString('binary'), 'raw'));
        const p12 = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
        let cert = null;
        let privateKey = null; // Explicit RSA Private Key
        let certDer = '';
        // Extract certificate and private key
        for (const safeContents of p12.safeContents) {
            for (const safeBags of safeContents.safeBags) {
                if (safeBags.type === node_forge_1.default.pki.oids.certBag) {
                    cert = safeBags.cert;
                    const certAsn1 = node_forge_1.default.pki.certificateToAsn1(cert);
                    certDer = node_forge_1.default.util.encode64(node_forge_1.default.asn1.toDer(certAsn1).getBytes());
                }
                else if (safeBags.type === node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag) {
                    privateKey = safeBags.key;
                }
                else if (safeBags.type === node_forge_1.default.pki.oids.keyBag) {
                    privateKey = safeBags.key;
                }
            }
        }
        if (!privateKey || !cert) {
            throw new Error('Could not extract private key or certificate from .p12 file');
        }
        // 2. Prepare XML for signing
        const canonicalXml = xmlString;
        // 3. Calculate Digest (SHA-256)
        const digestHash = crypto_1.default.createHash('sha256').update(canonicalXml, 'utf8').digest('base64');
        // 4. Create SignedInfo template and Calculate Signature
        const signedInfoTemplate = `<ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><ds:DigestValue>${digestHash}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;
        // Sign the SignedInfo string
        const md = node_forge_1.default.md.sha256.create();
        md.update(signedInfoTemplate, 'utf8');
        // node-forge sign
        const signature = privateKey.sign(md);
        const signatureBase64 = node_forge_1.default.util.encode64(signature);
        // 5. Inject values back into XML
        // Locate the empty placeholders we added in teifGenerator and replace them
        let signedXml = xmlString
            .replace('<ds:DigestValue></ds:DigestValue>', `<ds:DigestValue>${digestHash}</ds:DigestValue>`)
            .replace('<ds:SignatureValue></ds:SignatureValue>', `<ds:SignatureValue>${signatureBase64}</ds:SignatureValue>`)
            .replace('<ds:X509Certificate></ds:X509Certificate>', `<ds:X509Certificate>${certDer}</ds:X509Certificate>`);
        // Fallback for empty strings if the pretty printer collapsed them
        signedXml = signedXml
            .replace('<ds:DigestValue/>', `<ds:DigestValue>${digestHash}</ds:DigestValue>`)
            .replace('<ds:SignatureValue/>', `<ds:SignatureValue>${signatureBase64}</ds:SignatureValue>`)
            .replace('<ds:X509Certificate/>', `<ds:X509Certificate>${certDer}</ds:X509Certificate>`);
        return signedXml;
    }
    catch (error) {
        console.error('XML Signing Error:', error);
        throw new Error('Failed to generate XAdES-B signature');
    }
};
exports.signXml = signXml;
