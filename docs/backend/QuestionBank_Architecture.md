# Question Bank Service Architecture

The **Question Bank Service** is an independent, highly normalized microservice that serves as the Single Source of Truth for every question in the Naan Mudhalvan platform.

## 1. Domain Driven Boundaries
This service has absolutely no overlap with execution (Judge0) or Orchestration (Interview Service). It simply stores structured metadata about questions (Taxonomies, Code Constraints, Examples, Explanations, Hints, Companies, Languages). When an interview begins, the Interview Service merely references `questionId` strings that point to rows in this database.

## 2. Dataset Import Engine (`ImportService`)
Given that some datasets are massive (the Aptitude JSON is ~194MB), standard `JSON.parse` operations would cause immediate Node.js Heap Exhaustion crashes (V8 Out of Memory). 
To solve this, the Import Engine uses `stream-json`:
- It pipelines a `ReadStream` directly into the parser.
- It intercepts objects one-by-one without holding the full file array in memory.
- It flushes these to the database in configurable batches (e.g. `BATCH_SIZE = 500`).
- It enforces strict idempotency by hashing the question title and skipping exact duplicates, generating an accurate `QuestionImportBatch` audit log for rollback.

## 3. Search Engine (`SearchService`)
Provides advanced multi-dimensional filtering across:
- `keyword` (Insensitive searches across title and description)
- `categoryId`, `topicId`
- `difficulty`
- `questionType`
- `language`

## 4. Normalization
The engine auto-corrects dataset inconsistencies on the fly. Missing categories are normalized to generic variants, and string literals like "python" and "sql" are automatically mapped to the strict `QuestionTypeEnum`.
