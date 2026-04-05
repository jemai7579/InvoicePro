import { PrismaClient, DevisStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@elfatoora.tn';
  const adminPassword = 'adminpassword123';
  const adminName = 'Platform Admin';

  // 1. Initialisation Admin
  const existingAdmin = await (prisma as any).admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await (prisma as any).admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
      },
    });
    console.log('✅ Compte administrateur créé.');
  }

  // 2. Paramètres système
  const defaultSettings = [
    { key: 'TVA_DEFAULT', value: '19', description: 'Taux de TVA par défaut en Tunisie' },
    { key: 'STAMP_DUTY', value: '1.0', description: 'Droit de timbre fiscal' },
    { key: 'TTN_API_URL', value: 'https://api.ttn.com/v1', description: 'URL de l\'API TTN (Simulée)' },
  ];

  for (const setting of defaultSettings) {
    await (prisma as any).systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // 3. Données de Test (Entreprises & Factures)
  const userPassword = await bcrypt.hash('password123', 10);
  
  const companiesData = [
    { name: 'Tech Solutions SARL', email: 'contact@techsol.tn', mf: '1234567/A/M/000' },
    { name: 'Green Energy Tunisia', email: 'info@greenenergy.tn', mf: '7654321/B/C/001' },
    { name: 'Creative Agency', email: 'hello@creative.tn', mf: '1122334/X/Y/000' },
  ];

  console.log('⏳ Génération des données de test...');

  for (const data of companiesData) {
    const company = await (prisma as any).company.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        password: userPassword,
        matriculeFiscal: data.mf,
        address: 'Tunis, Tunisie',
        subscription: {
          create: { plan: 'PRO', status: 'ACTIVE' }
        }
      },
    });

    // Ajouter un client pour chaque entreprise
    const client = await (prisma as any).client.create({
      data: {
        companyId: company.id,
        name: `Client de ${company.name}`,
        email: `client@${data.email.split('@')[1]}`,
        address: 'Avenue Habib Bourguiba, Tunis',
      }
    });

    // Ajouter quelques factures
    for (let i = 1; i <= 3; i++) {
        await (prisma as any).invoice.create({
            data: {
                companyId: company.id,
                clientId: client.id,
                status: i === 1 ? 'VALIDATED' : (i === 2 ? 'PAID' : 'DRAFT'),
                totalHT: 1000 * i,
                totalTVA: 190 * i,
                totalTTC: 1191 * i, // HT + TVA + Timbre
                ttnStatus: i === 1 ? 'ACCEPTED' : undefined,
            }
        });
    }
  }

  console.log('✅ Données de test (entreprises + factures) générées.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
