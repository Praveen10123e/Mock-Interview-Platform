import path from 'path';
import { ImportService } from '../src/services/ImportService';

async function main() {
  const filePath = 'd:/MINI_PROJECT/data/curated/coding.json';
  console.log('Importing curated coding...');
  try {
     const result = await ImportService.importCuratedDataset(filePath, 'coding.json');
     console.log('Result:', result);
  } catch (err) {
     console.error('Import failed:', err);
  }
}
main();
