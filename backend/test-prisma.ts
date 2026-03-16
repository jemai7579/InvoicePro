import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const company = await prisma.company.create({
      data: {
        email: 'test_server_error_1@example.com',
        password: 'hashedpassword',
        name: 'Test Corp',
        matriculeFiscal: '1234567/X/A/M/000',
        registreCommerce: 'RC123',
        address: 'Test Address',
        phone: '12345678',
      },
    });
    console.log('Success:', company);
  } catch (error) {
    console.error('Error in creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
