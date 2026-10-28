import { base44 } from '@/api/base44Client';

// Quiz questions come from the app's own AI integration (InvokeLLM), so no
// logged-in Base44 user and no backend function is involved.

const QUESTION_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    options: { type: 'array', items: { type: 'string' } },
    correctAnswer: { type: 'string' },
  },
  required: ['question', 'options', 'correctAnswer'],
};

const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    questions: { type: 'array', items: QUESTION_ITEM_SCHEMA },
  },
  required: ['message', 'questions'],
};

const RULES = `RULES
- Every question must have exactly 4 options.
- correctAnswer must exactly match one of the options.
- Questions must be clear and age-appropriate for elementary/middle school students.
- Default to 10 questions unless the teacher asks for a different number.
- "message" is one or two friendly sentences about what you made. Never repeat the questions themselves inside it.
- Return the complete set of questions the teacher should have right now, in "questions".`;

/** Drops malformed questions so a partial reply still yields usable ones. */
export function cleanQuestions(list) {
  return (Array.isArray(list) ? list : []).filter(
    (q) => q?.question && Array.isArray(q?.options) && q.options.length >= 2 && q?.correctAnswer
  );
}

/**
 * Sends the conversation so far to the question generator.
 * Returns { message, questions }.
 */
export async function askQuestionGenerator({ transcript = [], fileUrls = [] } = {}) {
  const history = transcript
    .filter((m) => m?.content)
    .map((m) => `${m.role === 'assistant' ? 'You' : 'Teacher'}: ${m.content}`)
    .join('\n\n');

  const prompt = [
    'You are the Question Generator for Quest Planner. You write multiple-choice quiz questions for educational mini-games.',
    RULES,
    `Conversation so far:\n${history}`,
    "Reply to the teacher's latest message with a short message plus the full question set.",
  ].join('\n\n');

  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: REPLY_SCHEMA,
    ...(fileUrls.length ? { file_urls: fileUrls } : {}),
  });

  return {
    message: typeof res?.message === 'string' ? res.message.trim() : '',
    questions: cleanQuestions(res?.questions),
  };
}

/** Builds the prompt used when questions are generated for a game round. */
export function questionsRequest({ topic, assignment, questionCount = 10 }) {
  if (assignment) {
    return `Generate ${questionCount} quiz questions for the assignment titled "${assignment.title}"${
      assignment.description ? `. Description: ${assignment.description}` : ''
    }.`;
  }
  return `Generate ${questionCount} quiz questions about "${topic}".`;
}

/**
 * Asks the generator for quiz questions. Returns [] if nothing usable came back.
 */
export async function generateQuizQuestions({ topic, assignment, questionCount = 10 } = {}) {
  const { questions } = await askQuestionGenerator({
    transcript: [{ role: 'user', content: questionsRequest({ topic, assignment, questionCount }) }],
    fileUrls: assignment?.pdfUrl ? [assignment.pdfUrl] : [],
  });
  return questions;
}