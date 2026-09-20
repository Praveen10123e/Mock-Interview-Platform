# Curated Demo Datasets

This directory contains the **three manually verified** curated question datasets used for the current working Student Practice demo experience.

## Contents

| File | Dataset Name | Type | Count | Verified By |
|---|---|---|---|---|
| `full_program_coding_interview_dataset_40(3).json` | Curated - Full-Program Coding Interview Dataset | CODING (Full-Program stdin/stdout) | 40 questions | Team Praveen / Dhanush M / Angesh Karthik |
| `aptitude.json` | Curated Aptitude Set v1 | APTITUDE (MCQ) | 15 questions | Team Praveen / Dhanush M / Angesh Karthik |
| `hr.json` | Curated HR Set v1 | HR (Descriptive) | 10 questions | Team Praveen / Dhanush M / Angesh Karthik |

**Total verified questions: 65**

## Purpose

These datasets are the **canonical source** for the currently working and demo-ready student practice experience.

- **full_program_coding_interview_dataset_40(3).json** — 40 competitive-programming algorithmic challenges (13 Easy, 13 Medium, 14 Hard across 13 DSA patterns) with stdin/stdout execution, input/output formats, constraints, public examples, and hidden test cases. Executed live via Monaco Editor + Judge Service.
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
