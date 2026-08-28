import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from './generated/client';
import { ImportService } from './services/ImportService';
import { SearchService } from './services/SearchService';
import { QuestionManagementService } from './services/QuestionManagementService';
import path from 'path';

const app = express();
let _prisma: PrismaClient;
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) _prisma = new PrismaClient();
    return (_prisma as any)[prop];
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', service: 'question-bank-service', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: 'Database disconnected' });
  }
});

// Response Wrapper Utilities
const sendSuccess = (
  res: express.Response,
  data: any,
  pagination: any = null,
  message = 'Success',
  statusCode = 200
) => {
  res.status(statusCode).json({ success: true, data, pagination, message });
};

const sendError = (res: express.Response, error: any, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
      message: error.message || 'An error occurred',
    },
  });
};

// Helper: Check if request is from Faculty or Administrator
const isFacultyOrAdmin = (req: express.Request): boolean => {
  const roleHeader = (req.headers['x-user-role'] as string) || '';
  const roles = roleHeader.split(',').map((r) => r.trim().toUpperCase());
  return roles.includes('FACULTY') || roles.includes('ADMINISTRATOR');
};

// Helper: Enforce Faculty authorization
const requireFaculty = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!isFacultyOrAdmin(req)) {
    return sendError(
      res,
      new Error('Forbidden: Only faculty or administrators can perform this action'),
      403
    );
  }
  next();
};

// ── IMPORT ENGINE ────────────────────────────────────────────────────────────

app.post('/import', requireFaculty, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return sendError(res, new Error('Filename is required'), 400);

    const filepath = path.resolve(__dirname, '../../../../data-engineering/dataset/', filename);
    ImportService.importDataset(filepath, filename).catch(console.error);

    sendSuccess(res, null, null, 'Import job accepted and is running in the background.');
  } catch (err: any) {
    sendError(res, err);
  }
});

// ── VALIDATION ENDPOINT ──────────────────────────────────────────────────────

app.post('/validate', requireFaculty, async (req, res) => {
  try {
    const validationResult = QuestionManagementService.validateQuestion(req.body);
    sendSuccess(res, validationResult, null, 'Validation completed');
  } catch (err: any) {
    sendError(res, err);
  }
});

// ── CATEGORIES, TOPICS, LANGUAGES, TAGS, STATS ───────────────────────────────

app.get('/categories', async (req, res) => {
  try {
    sendSuccess(res, await SearchService.getCategories(req.query.excludeTypes as string | string[]));
  } catch (err: any) {
    sendError(res, err);
  }
});

app.get('/topics', async (req, res) => {
  try {
    sendSuccess(res, await SearchService.getTopics(req.query.excludeTypes as string | string[]));
  } catch (err: any) {
    sendError(res, err);
  }
});

app.get('/languages', async (req, res) => {
  try {
    sendSuccess(res, await SearchService.getLanguages());
  } catch (err: any) {
    sendError(res, err);
  }
});

app.get('/tags', async (req, res) => {
  try {
    sendSuccess(res, await SearchService.getTags());
  } catch (err: any) {
    sendError(res, err);
  }
});

app.get('/statistics', async (req, res) => {
  try {
    sendSuccess(res, await SearchService.getStatistics(req.query.excludeTypes as string | string[]));
  } catch (err: any) {
    sendError(res, err);
  }
});

// ── QUESTION SEARCH & LISTING ────────────────────────────────────────────────

app.get('/', async (req, res) => {
  try {
    const isFaculty = isFacultyOrAdmin(req);
    const results = await SearchService.searchQuestions({
      ...req.query,
      isFaculty,
    });
    const { data, ...pagination } = results;
    sendSuccess(res, data, pagination);
  } catch (err: any) {
    sendError(res, err);
  }
});

// ── QUESTION DETAIL ──────────────────────────────────────────────────────────

app.get('/:id', async (req, res) => {
  try {
    const isFaculty = isFacultyOrAdmin(req);
    const question = await SearchService.getQuestionById(req.params.id, isFaculty);
    if (!question) {
      return sendError(res, new Error('Question not found'), 404);
    }
    sendSuccess(res, question);
  } catch (err: any) {
    sendError(res, err);
  }
});

// ── CREATE QUESTION (FACULTY ONLY) ───────────────────────────────────────────

app.post('/', requireFaculty, async (req, res) => {
  try {
    const identityId = req.headers['x-identity-id'] as string;
    const validation = QuestionManagementService.validateQuestion(req.body);
    if (!validation.valid) {
      return sendError(res, new Error(`Validation failed: ${validation.errors.join(' ')}`), 400);
    }

    const created = await QuestionManagementService.createQuestion(req.body, identityId);
    sendSuccess(res, created, null, 'Question created successfully', 201);
  } catch (err: any) {
    sendError(res, err);
  }
});

// ── UPDATE QUESTION (FACULTY ONLY) ───────────────────────────────────────────

app.put('/:id', requireFaculty, async (req, res) => {
  try {
    const identityId = req.headers['x-identity-id'] as string;
    const questionId = (req.params.id as string) || '';
    const updated = await QuestionManagementService.updateQuestion(questionId, req.body, identityId);
    sendSuccess(res, updated, null, 'Question updated successfully');
  } catch (err: any) {
    sendError(res, err, err.message === 'Question not found' ? 404 : 500);
  }
});

// ── DELETE / ARCHIVE QUESTION (FACULTY ONLY) ─────────────────────────────────

app.delete('/:id', requireFaculty, async (req, res) => {
  try {
    const questionId = (req.params.id as string) || '';
    const deleted = await QuestionManagementService.deleteQuestion(questionId);
    sendSuccess(res, deleted, null, 'Question archived successfully');
  } catch (err: any) {
    sendError(res, err, err.message === 'Question not found' ? 404 : 500);
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Question Bank Service running on port ${PORT}`);
});
