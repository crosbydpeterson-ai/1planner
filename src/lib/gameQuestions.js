import { base44 } from '@/api/base44Client';

// Quiz questions for the Game Studio come from the app's own question_generator
// agent, so no backend function is involved.

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120000;

/** Pulls the JSON question array out of the agent's reply. */
export function parseQuestions(content) {
  if (!content) return [];
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  for (const raw of [fenced?.[1], content]) {
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw.trim());
      const list = Array.isArray(parsed) ? parsed : parsed?.questions;
      const clean = (list || []).filter(
        (q) => q?.question && Array.isArray(q?.options) && q?.correctAnswer
      );
      if (clean.length) return clean;
    } catch (e) {
      // Not valid JSON on its own — try the next candidate.
    }
  }
  return [];
}

/**
 * Asks the question_generator agent for quiz questions and waits for its reply.
 * Returns [] if nothing usable came back in time.
 */
export async function generateQuizQuestions({ topic, assignment, questionCount = 10 } = {}) {
  const profileId = localStorage.getItem('quest_profile_id');
  const label = assignment?.title || topic || 'Game questions';
  const convo = await base44.agents.createConversation({
    agent_name: 'question_generator',
    metadata: { name: `Questions: ${label}`, description: 'Game Studio question generation', profileId },
  });
  if (!convo?.id) throw new Error('The question generator is unavailable right now.');

  const prompt = assignment
    ? `Generate ${questionCount} quiz questions for the assignment titled "${assignment.title}"${assignment.description ? `. Description: ${assignment.description}` : ''}.`
    : `Generate ${questionCount} quiz questions about "${topic}".`;

  const message = { role: 'user', content: prompt };
  if (assignment?.pdfUrl) message.file_urls = [assignment.pdfUrl];
  await base44.agents.addMessage(convo, message);

  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const fresh = await base44.agents.getConversation(convo.id);
    const replies = (fresh?.messages || []).filter((m) => m.role === 'assistant' && m.content);
    const questions = parseQuestions(replies[replies.length - 1]?.content);
    if (questions.length) return questions;
  }
  return [];
}