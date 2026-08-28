import { PrismaClient } from './src/generated/client';

async function auditDb() {
  const prisma = new PrismaClient();
  const qCount = await prisma.question.count();
  const categories = await prisma.questionCategory.count();
  const topics = await prisma.questionTopic.count();
  
  console.log(`Questions: ${qCount}`);
  console.log(`Categories: ${categories}`);
  console.log(`Topics: ${topics}`);
  
  const sample = await prisma.question.findFirst({
    include: { category: true, topic: true }
  });
  console.log('Sample question:', JSON.stringify(sample, null, 2));
}

auditDb().catch(console.error);
