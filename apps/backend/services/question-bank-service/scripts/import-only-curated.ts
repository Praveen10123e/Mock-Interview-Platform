import { ImportService } from '../src/services/ImportService';
import path from 'path';

async function main() {
  const dataDir = path.join(__dirname, '../../../../../data/curated');
  
  const files = [
    { file: 'aptitude.json', name: 'Curated Aptitude Set v1' },
    { file: 'coding.json', name: 'Curated Coding Set v1' },
    { file: 'hr.json', name: 'Curated HR Set v1' }
  ];

  for (const { file, name } of files) {
    console.log(`\n========================================`);
    console.log(`Starting import for: ${file}`);
    
    try {
      const result = await ImportService.importCuratedDataset(path.join(dataDir, file), file);
      console.log(`Import successful!`);
      console.log(`- Batch ID: ${result.batchId}`);
      console.log(`- Total Records: ${result.totalRecords}`);
      console.log(`- Imported: ${result.importedCount}`);
      console.log(`- Skipped (Duplicates): ${result.skippedCount}`);
      console.log(`- Failed: ${result.failedCount}`);
    } catch (err: any) {
      console.error(`Failed to import ${file}:`, err.message);
    }
  }

  console.log('\n✅ All curated datasets processed successfully.');
}

main().catch(console.error).finally(() => process.exit(0));
