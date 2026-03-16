import forge from 'node-forge';
import crypto from 'crypto';

interface SignatureParams {
  xmlString: string;
  p12Buffer: Buffer;
  password: string;
}

  export const signXml = ({ xmlString, p12Buffer, password }: SignatureParams): string => {
    try {
      // 1. Decode p12 and get key/cert
      // Use 'raw' instead of 'binary' for buffer to string if needed, or forge's byteBuffer
      const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer.toString('binary'), 'raw'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
  
      let cert: forge.pki.Certificate | null = null;
      let privateKey: forge.pki.rsa.PrivateKey | null = null; // Explicit RSA Private Key
      let certDer: string = '';
  
      // Extract certificate and private key
      for (const safeContents of p12.safeContents) {
        for (const safeBags of safeContents.safeBags) {
          if (safeBags.type === forge.pki.oids.certBag) {
              cert = safeBags.cert as forge.pki.Certificate;
              const certAsn1 = forge.pki.certificateToAsn1(cert);
              certDer = forge.util.encode64(forge.asn1.toDer(certAsn1).getBytes());
          } else if (safeBags.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
              privateKey = safeBags.key as forge.pki.rsa.PrivateKey;
          } else if (safeBags.type === forge.pki.oids.keyBag) {
              privateKey = safeBags.key as forge.pki.rsa.PrivateKey;
          }
        }
      }
  
      if (!privateKey || !cert) {
        throw new Error('Could not extract private key or certificate from .p12 file');
      }
  
      // 2. Prepare XML for signing
      const canonicalXml = xmlString;
      
      // 3. Calculate Digest (SHA-256)
      const digestHash = crypto.createHash('sha256').update(canonicalXml, 'utf8').digest('base64');
  
      // 4. Create SignedInfo template and Calculate Signature
      const signedInfoTemplate = `<ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><ds:DigestValue>${digestHash}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;
  
      // Sign the SignedInfo string
      const md = forge.md.sha256.create();
      md.update(signedInfoTemplate, 'utf8');
      
      // node-forge sign
      const signature = privateKey.sign(md);
      const signatureBase64 = forge.util.encode64(signature);

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

  } catch (error) {
    console.error('XML Signing Error:', error);
    throw new Error('Failed to generate XAdES-B signature');
  }
};
