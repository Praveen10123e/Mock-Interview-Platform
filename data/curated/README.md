# Curated Demo Datasets

This directory contains the **three manually verified** curated question datasets used for the current working Student Practice demo experience.

## Contents

| File | Dataset Name | Type | Count | Verified By |
|---|---|---|---|---|
| `coding.json` | Curated Coding Set v1 | CODING (Python) | 20 questions | Team Praveen / Dhanush M / Angesh Karthik |
| `aptitude.json` | Curated Aptitude Set v1 | APTITUDE (MCQ) | 15 questions | Team Praveen / Dhanush M / Angesh Karthik |
| `hr.json` | Curated HR Set v1 | HR (Descriptive) | 10 questions | Team Praveen / Dhanush M / Angesh Karthik |

**Total verified questions: 45**

## Purpose

These datasets are the **canonical source** for the currently working and demo-ready student practice experience.

- **coding.json** — 20 Python algorithm challenges (Easy to Hard) with examples, constraints, test cases, and hints. Executed live via Monaco Editor + Judge Service.
- **aptitude.json** — 15 MCQ questions covering Quantitative, Logical Reasoning, and Verbal Ability. Each question has 4 options, a correct option index, and an explanation.
- **hr.json** — 10 descriptive HR/behavioral questions with evaluation criteria for each.

## What These Are NOT

These curated files are **not replacements** for the bulk datasets. They are an additional, smaller, manually verified source.

The bulk datasets remain preserved separately in:
```
data-engineering/dataset/
├── python_interview_dataset.json   (~43 MB)
├── aptitude_dataset.json          (~185 MB)
├── hr_interview_dataset.json      (~54 MB)
└── sql_interview_dataset.json     (~23 MB)
```

## SQL Status

SQL questions remain **excluded from Student Practice** UI at this time.
The SQL dataset is preserved in the database and in `data-engineering/dataset/sql_interview_dataset.json`.
SQL will be re-enabled when the SQL Workspace is properly implemented.

## Integration Flow

```
data/curated/*.json
        ↓
CuratedImportService (scripts/import-curated.js)
        ↓
PostgreSQL (via question-bank-service Prisma)
        ↓
question-bank-service API
        ↓
API Gateway (port 3000)
        ↓
Student Practice UI
        ↓
┌─────────────┬──────────────┬─────────────┐
│   Python    │   Aptitude   │     HR      │
│ 20 verified │ 15 verified  │ 10 verified │
│   Judge     │     MCQ UI   │ Descriptive │
└─────────────┴──────────────┴─────────────┘
```

## Source Identification

These curated questions are stored in PostgreSQL with the `datasetName` / `QuestionSource.name` set to:

- `Curated Coding Set v1`
- `Curated Aptitude Set v1`
- `Curated HR Set v1`

This distinguishes them from the bulk imported datasets without requiring any new database columns.
