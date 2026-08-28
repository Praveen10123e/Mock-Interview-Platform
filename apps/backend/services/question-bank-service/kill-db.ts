import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE state = 'idle in transaction' OR state = 'active' AND pid <> pg_backend_pid();
  `);
  console.log('Terminated stuck queries');
}

main().finally(() => prisma.$disconnect());
