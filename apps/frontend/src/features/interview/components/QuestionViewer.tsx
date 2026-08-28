import React from 'react';
import { useInterviewSessionStore } from '../store/useInterviewSessionStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export const QuestionViewer: React.FC = () => {
  const currentQuestion = useInterviewSessionStore((state) => state.getCurrentQuestion());
  const currentIndex = useInterviewSessionStore((state) => state.currentQuestionIndex);

  if (!currentQuestion) {
    return (
      <Card className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading Question...</div>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <span className="text-sm text-primary font-bold tracking-wider uppercase">
            Question {currentIndex + 1}
          </span>
          <span className="text-xs bg-muted px-2 py-1 rounded">{currentQuestion.questionType}</span>
        </div>
        <CardTitle className="text-xl mt-2">{currentQuestion.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {currentQuestion.description}
        </div>

        {currentQuestion.examples && currentQuestion.examples.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-lg border-b pb-2">Examples</h3>
            {currentQuestion.examples.map((ex: any, idx: number) => (
              <div key={idx} className="bg-muted p-4 rounded-md space-y-2 text-sm">
                <div>
                  <strong>Input:</strong> {ex.input}
                </div>
                <div>
                  <strong>Output:</strong> {ex.output}
                </div>
                {ex.explanation && (
                  <div>
                    <strong>Explanation:</strong> {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
          <div className="space-y-2 mt-6">
            <h3 className="font-semibold text-lg border-b pb-2">Constraints</h3>
            <ul className="list-disc pl-5 space-y-1">
              {currentQuestion.constraints.map((c: string, i: number) => (
                <li key={i} className="text-sm bg-muted inline-block px-2 py-1 rounded mr-2 mb-2">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
