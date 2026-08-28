const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function run() {
  const titles = ['Two Sum', 'Trapping Rain Water'];
  
  for (const title of titles) {
    const q = await prisma.question.findFirst({ where: { title }, include: { metadata: true } });
    if (!q) continue;

    const funcName = title === 'Two Sum' ? 'twoSum' : 'trap';
    let payload = q.metadata.jsonPayload;
    
    if (payload && payload.execution && payload.execution.languages) {
      for (const lang of ['python', 'javascript', 'c', 'cpp', 'java']) {
        if (payload.execution.languages[lang]) {
          if (lang === 'java') {
            payload.execution.languages[lang].methodName = funcName;
            payload.execution.languages[lang].starterCode = payload.execution.languages[lang].starterCode.replace('solution', funcName);
          } else {
            payload.execution.languages[lang].functionName = funcName;
            payload.execution.languages[lang].starterCode = payload.execution.languages[lang].starterCode.replace('solution', funcName);
          }
        }
      }
      
      await prisma.questionMetadata.update({
        where: { id: q.metadata.id },
        data: { jsonPayload: payload }
      });
      console.log(`Updated ${title} metadata to use ${funcName}`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
