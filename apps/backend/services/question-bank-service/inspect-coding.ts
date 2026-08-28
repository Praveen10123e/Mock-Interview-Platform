import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const q = await prisma.question.findFirst({
    where: {
      questionType: 'CODING',
      source: { name: { startsWith: 'Curated' } }
    },
    include: {
      metadata: true,
      examples: true
    }
  });
  console.dir(q, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
