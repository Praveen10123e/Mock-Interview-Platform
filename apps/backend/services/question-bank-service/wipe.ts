import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Question" CASCADE;`);
  console.log('Wiped Questions');
}

main().finally(() => prisma.$disconnect());
