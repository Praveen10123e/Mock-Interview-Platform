const fs = require('fs');
const path = require('path');

const CURATED_DIR = path.join(__dirname, '../data/curated');
const CODING_FILE = path.join(CURATED_DIR, 'coding.json');
const APTITUDE_FILE = path.join(CURATED_DIR, 'aptitude.json');
const HR_FILE = path.join(CURATED_DIR, 'hr.json');

function validateCoding() {
  console.log('--- Validating coding.json ---');
  if (!fs.existsSync(CODING_FILE)) throw new Error('coding.json missing');
  
  const data = JSON.parse(fs.readFileSync(CODING_FILE, 'utf8'));
  const questions = data.questions;
  
  if (data.datasetName !== 'Curated Coding Set v1') throw new Error('Invalid datasetName');
  if (data.questionType !== 'CODING') throw new Error('Invalid questionType');
  if (data.language !== 'Python') throw new Error('Invalid language');
  if (questions.length !== 20) throw new Error(`Expected 20 questions, found ${questions.length}`);
  
  const ids = new Set();
  questions.forEach((q) => {
    if (ids.has(q.id)) throw new Error(`Duplicate ID: ${q.id}`);
    ids.add(q.id);
    if (!q.id.startsWith('COD-')) throw new Error(`Invalid ID prefix: ${q.id}`);
    if (!q.title || !q.description) throw new Error(`Missing title/description for ${q.id}`);
    if (!q.testCases || !Array.isArray(q.testCases)) throw new Error(`Missing testCases for ${q.id}`);
  });
  
  console.log('✅ coding.json valid. (20 questions)');
  return 20;
}

function validateAptitude() {
  console.log('--- Validating aptitude.json ---');
  if (!fs.existsSync(APTITUDE_FILE)) throw new Error('aptitude.json missing');
  
  const data = JSON.parse(fs.readFileSync(APTITUDE_FILE, 'utf8'));
  const questions = data.questions;
  
  if (data.datasetName !== 'Curated Aptitude Set v1') throw new Error('Invalid datasetName');
  if (data.questionType !== 'APTITUDE') throw new Error('Invalid questionType');
  if (questions.length !== 15) throw new Error(`Expected 15 questions, found ${questions.length}`);
  
  const ids = new Set();
  questions.forEach((q) => {
    if (ids.has(q.id)) throw new Error(`Duplicate ID: ${q.id}`);
    ids.add(q.id);
    if (!q.id.startsWith('APT-')) throw new Error(`Invalid ID prefix: ${q.id}`);
    if (!q.question) throw new Error(`Missing question for ${q.id}`);
    if (!q.options || !Array.isArray(q.options)) throw new Error(`Missing options for ${q.id}`);
    if (typeof q.correctOptionIndex !== 'number') throw new Error(`Missing correctOptionIndex for ${q.id}`);
    if (!q.explanation) throw new Error(`Missing explanation for ${q.id}`);
  });
  
  console.log('✅ aptitude.json valid. (15 questions)');
  return 15;
}

function validateHR() {
  console.log('--- Validating hr.json ---');
  if (!fs.existsSync(HR_FILE)) throw new Error('hr.json missing');
  
  const data = JSON.parse(fs.readFileSync(HR_FILE, 'utf8'));
  const questions = data.questions;
  
  if (data.datasetName !== 'Curated HR Set v1') throw new Error('Invalid datasetName');
  if (data.questionType !== 'HR') throw new Error('Invalid questionType');
  if (questions.length !== 10) throw new Error(`Expected 10 questions, found ${questions.length}`);
  
  const ids = new Set();
  questions.forEach((q) => {
    if (ids.has(q.id)) throw new Error(`Duplicate ID: ${q.id}`);
    ids.add(q.id);
    if (!q.id.startsWith('HR-')) throw new Error(`Invalid ID prefix: ${q.id}`);
    if (!q.question) throw new Error(`Missing question for ${q.id}`);
    if (!q.evaluationCriteria || !Array.isArray(q.evaluationCriteria)) throw new Error(`Missing evaluationCriteria for ${q.id}`);
  });
  
  console.log('✅ hr.json valid. (10 questions)');
  return 10;
}

async function run() {
  try {
    let total = 0;
    total += validateCoding();
    total += validateAptitude();
    total += validateHR();
    console.log(`\n🎉 Success! Total verified questions: ${total} (Expected: 45)`);
  } catch (err) {
    console.error(`\n❌ Validation Failed: ${err.message}`);
    process.exit(1);
  }
}

run();
