const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  try {
    const c = await prisma.company.findMany();
    fs.writeFileSync('prisma-error.txt', JSON.stringify(c));
  } catch (error) {
    fs.writeFileSync('prisma-error.txt', error.toString() + '\\n' + error.stack);
  } finally {
    await prisma.$disconnect();
  }
}
main();
