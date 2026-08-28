import { DatasetMapper } from './DatasetMapper';
import { NormalizedQuestion } from './NormalizedQuestion';
import { DifficultyLevel, QuestionTypeEnum } from '../../generated/client';
import { generateQuestionHash } from './utils';

/**
 * Mapper for the curated coding.json dataset.
 * Structure: { id, title, difficulty, topic, description, examples, constraints, testCases, hints }
 * Signature fields: 'id' starts with 'COD-', has 'testCases', has 'description'
 */
export class CuratedCodingMapper implements DatasetMapper {
  canMap(record: any): boolean {
    return (
      typeof record.id === 'string' &&
      record.id.startsWith('COD-') &&
      'title' in record &&
      'description' in record &&
      'testCases' in record
    );
  }

  map(record: any): NormalizedQuestion {
    if (!record.title || typeof record.title !== 'string') {
      throw new Error(`Missing 'title' in curated coding record: ${record.id}`);
    }
    if (!record.description) {
      throw new Error(`Missing 'description' in curated coding record: ${record.id}`);
    }

    let difficulty: DifficultyLevel = DifficultyLevel.MEDIUM;
    if (record.difficulty) {
      const d = record.difficulty.toString().toUpperCase();
      if (['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(d)) {
        difficulty = d as DifficultyLevel;
      }
    }

    const examples = Array.isArray(record.examples)
      ? record.examples.map((ex: any, i: number) => ({
          input: ex.input,
          output: ex.output,
          explanation: ex.explanation,
          order: i + 1,
        }))
      : [];

    const constraints = Array.isArray(record.constraints)
      ? record.constraints.map((c: string, i: number) => ({ constraint: c, order: i + 1 }))
      : [];

    const hints = Array.isArray(record.hints)
      ? record.hints.map((h: string, i: number) => ({ hint: h, order: i + 1 }))
      : [];

    const topic = record.topic || 'Algorithms';

    return {
      title: record.title.substring(0, 255),
      description: record.description,
      questionType: QuestionTypeEnum.CODING,
      datasetName: 'Curated Coding Set v1',
      difficulty,
      category: 'Programming',
      topic,
      language: 'Python',
      tags: [topic],
      examples,
      constraints,
      hints,
      originalId: record.id,
      metadata: {
        originalId: record.id,
        testCases: record.testCases || [],
        examples: examples,
        constraints: constraints,
        hints: hints,
        datasetSource: 'CURATED_DEMO',
        execution: record.execution || null
      },
      hash: generateQuestionHash({
        title: record.title.substring(0, 255),
        description: record.description,
        questionType: QuestionTypeEnum.CODING,
        category: 'Programming',
        language: 'Python',
      }),
    };
  }
}
