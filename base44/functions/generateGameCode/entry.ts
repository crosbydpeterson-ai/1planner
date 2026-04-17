import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, gameDescription, gameVibe, questionIntegration, colorTheme, font, existingCode, editPrompt, gameName } = body;

    const COLOR_THEMES = {
      'Electric Blue': { primary: '#3B82F6', secondary: '#1D4ED8', bg: '#0F172A', accent: '#60A5FA' },
      'Sunset Orange': { primary: '#F97316', secondary: '#EA580C', bg: '#1C1917', accent: '#FB923C' },
      'Forest Green': { primary: '#22C55E', secondary: '#16A34A', bg: '#0F1A0F', accent: '#4ADE80' },
      'Royal Purple': { primary: '#A855F7', secondary: '#7C3AED', bg: '#1E1033', accent: '#C084FC' },
      'Amber Gold': { primary: '#F59E0B', secondary: '#D97706', bg: '#1C1507', accent: '#FCD34D' },
      'Teal Mint': { primary: '#14B8A6', secondary: '#0D9488', bg: '#0F1D1B', accent: '#5EEAD4' },
      'Rose Pink': { primary: '#EC4899', secondary: '#DB2777', bg: '#1F0A1A', accent: '#F472B6' },
      'Navy Slate': { primary: '#64748B', secondary: '#475569', bg: '#0F172A', accent: '#94A3B8' },
    };

    const colors = COLOR_THEMES[colorTheme] || COLOR_THEMES['Electric Blue'];

    if (action === 'generate') {
      const systemPrompt = `You are an expert React game developer creating educational mini-games for kids (ages 10-14). You write complete, self-contained React components that work with the following constraints:

CRITICAL RULES:
1. The component must be a single default export function component.
2. You can ONLY use: React (with hooks), inline styles, and basic DOM events. NO external imports at all - no framer-motion, no lucide-react, no external libraries.
3. Use React.useState, React.useEffect, React.useRef, React.useCallback etc.
4. The component receives these props: { questions, onGameEnd, onAnswerResult }
   - questions: array of {question: string, options: string[], correctAnswer: string}
   - onGameEnd: function({score, correctAnswers, totalQuestions, survivalTime}) called when game ends
   - onAnswerResult: function({correct: boolean, question: string}) called after each answer
5. The game MUST integrate quiz questions as described. When a question event triggers, pause the game and show the question with multiple choice options.
6. Correct answer = continue playing (revive/reload ammo/unlock next level based on integration type)
7. Wrong answer = game over (call onGameEnd)
8. Mobile friendly: include on-screen touch controls (buttons overlaid on game area)
9. Use requestAnimationFrame for game loops, not setInterval
10. All content must be kid-safe and school-appropriate
11. Use canvas via ref for rendering, or pure DOM elements with absolute positioning
12. The game should be FUN and visually polished with the given color theme
13. Include a HUD showing score, lives/ammo, and time
14. The component should fill its container (width: 100%, height: 100%)

COLOR THEME: ${JSON.stringify(colors)}
FONT: ${font || 'Inter'}

The game should use these colors throughout - background, UI elements, particles, etc.`;

      const userPrompt = `Create a mini-game with these specifications:

GAME CONCEPT: ${gameDescription}
GAME VIBE: ${gameVibe}
QUESTION INTEGRATION: ${questionIntegration} - When the question trigger happens (e.g., lose a life, run out of ammo, need to unlock something), show a quiz question overlay. Correct answer = continue, wrong = game over.

Generate a COMPLETE, WORKING React component. The code must be production-ready and fun to play. Include particle effects, smooth animations, and satisfying feedback. Make the game start with a title screen showing the game name, brief instructions, and a "Start" button.

IMPORTANT: Return ONLY the JavaScript code, no markdown, no explanation, no code fences. Just the pure component code starting with "function GameComponent({" or "const GameComponent = ({".`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: userPrompt,
        model: 'claude_opus_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Complete React component code' },
            name: { type: 'string', description: 'Game name (creative, catchy)' },
            description: { type: 'string', description: 'One-line game description' }
          }
        },
        file_urls: [],
      });

      return Response.json({
        code: result.code,
        name: result.name || gameName || 'Mini Game',
        description: result.description || gameDescription,
      });

    } else if (action === 'edit') {
      const editSystemPrompt = `You are editing a React game component. Apply the requested change while keeping all existing functionality working. Return ONLY the complete updated component code, no markdown, no explanation. The code must start with the function definition.

Current color theme: ${JSON.stringify(colors)}
Font: ${font || 'Inter'}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Here is the current game code:\n\n${existingCode}\n\nPlease make this change: ${editPrompt}\n\nReturn the COMPLETE updated code. No markdown fences, no explanation.`,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Complete updated React component code' },
            changeDescription: { type: 'string', description: 'Brief description of what changed' }
          }
        },
      });

      return Response.json({
        code: result.code,
        changeDescription: result.changeDescription,
      });

    } else if (action === 'generateQuestions') {
      const { assignmentTitle, assignmentDescription, topic, questionCount } = body;
      const count = questionCount || 10;

      const prompt = topic
        ? `Generate exactly ${count} multiple-choice quiz questions about the topic: "${topic}". These are for students aged 10-14. Each question must have exactly 4 options and one correct answer. The correctAnswer must be one of the options exactly.`
        : `Generate exactly ${count} multiple-choice quiz questions based on this school assignment:
Title: ${assignmentTitle}
Description: ${assignmentDescription || 'No description provided'}

These are for students aged 10-14. Make questions that test understanding of the material. Each question must have exactly 4 options and one correct answer. The correctAnswer must be one of the options exactly.`;

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    correctAnswer: { type: 'string' }
                  }
                }
              }
            }
          },
        });
        return Response.json({ questions: result?.questions || [] });
      } catch (qErr) {
        console.error('Question generation error:', qErr.message);
        return Response.json({ error: qErr.message, questions: [] }, { status: 500 });
      }

    } else if (action === 'generateThumbnail') {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `A colorful, fun, kid-friendly game thumbnail icon for a mini-game called "${gameName}". ${gameDescription}. Style: flat design, vibrant ${colorTheme || 'blue'} colors, playful, suitable for a school learning app. Square format, simple and eye-catching.`,
      });
      return Response.json({ thumbnailUrl: result.url });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Game generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});