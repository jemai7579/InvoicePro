const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

if (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') {
  console.error('Seed refused: demo credentials and sample data must never be created in production.');
  process.exit(1);
}

async function ensureAdmin() {
  const email = 'admin@invoicepro.tn';
  const password = await bcrypt.hash('adminpassword123', 10);

  await prisma.admin.upsert({
    where: { email },
    update: {
      password,
      name: 'Platform Admin',
    },
    create: {
      email,
      password,
      name: 'Platform Admin',
    },
  });
}

async function ensureSystemSettings() {
  const settings = [
    { key: 'TVA_DEFAULT', value: '19', description: 'Taux de TVA par defaut en Tunisie' },
    { key: 'STAMP_DUTY', value: '1.0', description: 'Droit de timbre fiscal' },
    { key: 'TTN_API_URL', value: 'mock://ttn', description: 'TTN mock endpoint for local development' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        description: setting.description,
      },
      create: setting,
    });
  }
}

async function ensureDemoCompany() {
  const email = 'demo@invoicepro.tn';
  const password = await bcrypt.hash('password123', 10);

  const company = await prisma.company.upsert({
    where: { email },
    update: {
      name: 'Demo Company SARL',
      firstName: 'Demo',
      lastName: 'Owner',
      matriculeFiscal: '1234567/A/M/000',
      address: 'Tunis, Tunisie',
      phone: '12345678',
    },
    create: {
      email,
      password,
      name: 'Demo Company SARL',
      firstName: 'Demo',
      lastName: 'Owner',
      matriculeFiscal: '1234567/A/M/000',
      address: 'Tunis, Tunisie',
      phone: '12345678',
      subscription: {
        create: { plan: 'PROFESSIONAL', status: 'ACTIVE' },
      },
    },
  });

  const existingSubscription = await prisma.subscription.findUnique({
    where: { companyId: company.id },
  });
  if (!existingSubscription) {
    await prisma.subscription.create({
      data: { companyId: company.id, plan: 'PROFESSIONAL', status: 'ACTIVE' },
    });
  }

  const existingClient = await prisma.client.findFirst({
    where: { companyId: company.id, email: 'client@invoicepro.tn' },
  });
  const client = existingClient || await prisma.client.create({
    data: {
      companyId: company.id,
      number: 'CL-0001',
      name: 'Client Demo',
      email: 'client@invoicepro.tn',
      address: 'Avenue Habib Bourguiba, Tunis',
      phone: '87654321',
    },
  });

  const existingProduct = await prisma.product.findFirst({
    where: { companyId: company.id, code: 'SERV-001' },
  });
  const product = existingProduct || await prisma.product.create({
    data: {
      companyId: company.id,
      code: 'SERV-001',
      name: 'Service de demo',
      description: 'Prestation de service locale',
      priceHT: 100,
      tvaRate: 19,
    },
  });

  const existingInvoice = await prisma.invoice.findFirst({
    where: { companyId: company.id, number: 'INV-2026-0001' },
  });
  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        number: 'INV-2026-0001',
        status: 'DRAFT',
        totalHT: 100,
        totalTVA: 19,
        totalTTC: 120,
        netToPay: 120,
        lines: {
          create: {
            productId: product.id,
            description: 'Service de demo',
            quantity: 1,
            unitPrice: 100,
            tvaRate: 19,
            totalHT: 100,
          },
        },
      },
    });
  }
}

async function main() {
  await ensureAdmin();
  await ensureSystemSettings();
  await ensureDemoCompany();
  console.log('Seed complete: admin@invoicepro.tn / adminpassword123 and demo@invoicepro.tn / password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
