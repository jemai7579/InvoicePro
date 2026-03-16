import forge from 'node-forge';
import fs from 'fs-extra';
import path from 'path';

async function createDummyCert() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{
    name: 'commonName',
    value: 'el-fatoora-test.com'
  }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Self-sign
  cert.sign(keys.privateKey);

  // Create P12
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey,
    [cert],
    'dummyPassword123'
  );

  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  const certPath = path.join(__dirname, 'dummy.p12');
  
  await fs.writeFile(certPath, p12Der, 'binary');
  console.log(`Dummy cert created at ${certPath}`);
}

createDummyCert().catch(console.error);
