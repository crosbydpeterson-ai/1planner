import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, gameDescription, gameVibe, questionIntegration, colorTheme, font, existingCode, editPrompt, gameName, gameDescriptionForThumb } = body;

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

    const NO_JSX_RULE = `
CRITICAL JSX RULE: You MUST NOT use JSX syntax (angle brackets like <div>, <span>, <canvas>, etc).
Instead, use React.createElement() for ALL rendering.
Example: Instead of: return <div style={{color:'red'}}>Hello</div>
Write: return React.createElement('div', {style:{color:'red'}}, 'Hello')
Instead of: <canvas ref={canvasRef} />
Write: React.createElement('canvas', {ref: canvasRef})
This is MANDATORY because the code runs via new Function() which cannot parse JSX.
NEVER use <> or </> fragment syntax either. Use React.createElement(React.Fragment, null, ...) instead.
`;

    if (action === 'generate') {
      const systemPrompt = `You are an expert React game developer creating educational mini-games for kids (ages 10-14). You write complete, self-contained React components.

CRITICAL RULES:
1. The component MUST be named GameComponent and defined as: function GameComponent({ questions, onGameEnd, onAnswerResult }) { ... }
2. You can ONLY use: React (with hooks), inline styles, and basic DOM events. NO external imports at all.
3. Use React.useState, React.useEffect, React.useRef, React.useCallback etc.
4. The component receives these props: { questions, onGameEnd, onAnswerResult }
   - questions: array of {question: string, options: string[], correctAnswer: string}
   - onGameEnd: function({score, correctAnswers, totalQuestions, survivalTime}) called when game ends
   - onAnswerResult: function({correct: boolean, question: string}) called after each answer
5. The game MUST integrate quiz questions. When a question event triggers, pause and show multiple choice.
6. Correct answer = continue playing. Wrong answer = game over (call onGameEnd).
7. Mobile friendly: include on-screen touch controls
8. Use requestAnimationFrame for game loops
9. All content must be kid-safe
10. Use canvas via ref for rendering, or pure DOM elements with absolute positioning
11. The game should be FUN and visually polished
12. Include a HUD showing score, lives/ammo, and time
13. The component should fill its container (width: 100%, height: 100%)
${NO_JSX_RULE}

COLOR THEME: ${JSON.stringify(colors)}
FONT: ${font || 'Inter'}

Use these colors throughout - background, UI elements, particles, etc.`;

      const userPrompt = `Create a mini-game:

GAME CONCEPT: ${gameDescription}
GAME VIBE: ${gameVibe}
QUESTION INTEGRATION: ${questionIntegration}

Generate a COMPLETE, WORKING React component using React.createElement (NO JSX). 
The function MUST be named GameComponent.
Return ONLY the JavaScript code. No markdown, no explanation, no code fences.
Start directly with: function GameComponent({ questions, onGameEnd, onAnswerResult }) {`;

      // Get name and description
      const metaResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Given this game concept, generate a creative catchy name and one-line description:\n\nConcept: ${gameDescription}\nVibe: ${gameVibe}`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Creative catchy game name' },
            description: { type: 'string', description: 'One-line game description' }
          }
        },
      });

      const generatedName = metaResult?.name || 'Mini Game';
      const generatedDesc = metaResult?.description || gameDescription;

      // Generate the actual game code
      let code = '';
      const maxAttempts = 2;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const extraWarning = attempt > 0 
          ? '\n\nWARNING: Your previous response contained JSX syntax (<div>, <span>, etc). This is FORBIDDEN. You MUST use React.createElement() for ALL elements. Do NOT use any angle-bracket HTML/JSX tags.' 
          : '';
        
        const codeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}${extraWarning}\n\n${userPrompt}`,
          model: 'claude_sonnet_4_6',
        });

        code = (codeResult || '').replace(/^```(?:jsx?|javascript)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
        
        // Check if code contains JSX patterns
        const hasJSX = /return\s*\(?\s*<[a-zA-Z]/.test(code) || /<[a-zA-Z][a-zA-Z0-9]*[\s>]/.test(code);
        if (!hasJSX) break; // Clean code, no retry needed
        console.log(`Attempt ${attempt + 1}: JSX detected in generated code, retrying...`);
      }

      if (!code) {
        return Response.json({ error: 'Failed to generate game code' }, { status: 500 });
      }

      return Response.json({
        code,
        name: generatedName,
        description: generatedDesc,
      });

    } else if (action === 'edit') {
      const editSystemPrompt = `You are editing a React game component. Apply the requested change while keeping all existing functionality working.
${NO_JSX_RULE}
Return ONLY the complete updated component code. No markdown, no explanation. The function must be named GameComponent.
Current color theme: ${JSON.stringify(colors)}
Font: ${font || 'Inter'}`;

      let editedCode = '';
      for (let attempt = 0; attempt < 2; attempt++) {
        const extraWarning = attempt > 0
          ? '\n\nCRITICAL: Your previous output contained JSX (<div>, etc). You MUST only use React.createElement(). NO JSX.'
          : '';
        
        const codeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${editSystemPrompt}${extraWarning}\n\nHere is the current game code:\n\n${existingCode}\n\nPlease make this change: ${editPrompt}\n\nReturn the COMPLETE updated code. No markdown fences, no explanation.`,
          model: 'claude_sonnet_4_6',
        });

        editedCode = (codeResult || '').replace(/^```(?:jsx?|javascript)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
        
        const hasJSX = /return\s*\(?\s*<[a-zA-Z]/.test(editedCode) || /<[a-zA-Z][a-zA-Z0-9]*[\s>]/.test(editedCode);
        if (!hasJSX) break;
        console.log(`Edit attempt ${attempt + 1}: JSX detected, retrying...`);
      }

      return Response.json({
        code: editedCode,
        changeDescription: `Applied: ${editPrompt}`,
      });

    } else if (action === 'generateQuestions') {
      const { assignmentTitle, assignmentDescription, topic, questionCount } = body;
      const count = questionCount || 10;

      const prompt = topic
        ? `Generate exactly ${count} multiple-choice quiz questions about: "${topic}". For ages 10-14. Each: 4 options, one correct. correctAnswer must match one option exactly.`
        : `Generate exactly ${count} multiple-choice quiz questions based on:\nTitle: ${assignmentTitle}\nDescription: ${assignmentDescription || 'N/A'}\nFor ages 10-14. Each: 4 options, one correct.`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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

    } else if (action === 'generateThumbnail') {
      const result = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: `A colorful, fun, kid-friendly game thumbnail icon for "${gameName}". ${gameDescriptionForThumb || ''}. Style: flat design, vibrant ${colorTheme || 'blue'} colors, playful, school learning app. Square, simple, eye-catching.`,
      });
      return Response.json({ thumbnailUrl: result.url });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Game generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});