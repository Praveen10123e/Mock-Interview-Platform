import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const q = await prisma.question.findFirst({
    where: {
      title: { contains: 'Trapping Rain Water' },
      source: { name: { startsWith: 'Curated' } }
    },
    include: {
      metadata: true
    }
  });
  console.log(q?.id);
  console.dir(q?.metadata, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
