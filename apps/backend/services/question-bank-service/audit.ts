import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function main() {
  console.log("--- PHASE 5: DATABASE AUDIT ---");
  
  const questionTypeCounts = await prisma.$queryRaw`SELECT "questionType", COUNT(*)::int as count FROM "Question" GROUP BY "questionType"`;
  console.log("\nSELECT questionType, COUNT(*) FROM \"Question\" GROUP BY questionType;");
  console.log(questionTypeCounts);

  // Since datasetName maps to source.name
  const datasetNameCounts = await prisma.$queryRaw`
    SELECT s.name as "datasetName", COUNT(*)::int as count 
    FROM "Question" q 
    LEFT JOIN "QuestionSource" s ON q."sourceId" = s.id 
    GROUP BY s.name
  `;
  console.log("\nSELECT datasetName, COUNT(*) FROM \"Question\" GROUP BY datasetName;");
  console.log(datasetNameCounts);

  const languageCounts = await prisma.$queryRaw`
    SELECT l.name as language, COUNT(*)::int as count 
    FROM "Question" q 
    LEFT JOIN "ProgrammingLanguage" l ON q."languageId" = l.id 
    GROUP BY l.name
  `;
  console.log("\nSELECT language, COUNT(*) FROM \"Question\" GROUP BY language;");
  console.log(languageCounts);

  const categoryCounts = await prisma.$queryRaw`
    SELECT c.name as category, COUNT(*)::int as count 
    FROM "Question" q 
    LEFT JOIN "QuestionCategory" c ON q."categoryId" = c.id 
    GROUP BY c.name
  `;
  console.log("\nSELECT categoryId, COUNT(*) FROM \"Question\" GROUP BY categoryId;");
  console.log(categoryCounts);

  const difficultyCounts = await prisma.$queryRaw`SELECT "difficulty", COUNT(*)::int as count FROM "Question" GROUP BY "difficulty"`;
  console.log("\nDifficulty Distribution:");
  console.log(difficultyCounts);
}

main().finally(() => prisma.$disconnect());
