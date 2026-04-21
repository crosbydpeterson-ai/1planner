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

    if (action === 'generate' || action === 'create') {
      const systemPrompt = `You are an expert React game developer creating educational mini-games for kids (ages 10-14). You write complete, self-contained React components.

CRITICAL RULES:
1. The component MUST be named GameComponent and defined as: function GameComponent({ questions, onGameEnd, onAnswerResult }) { ... }
2. You can ONLY use: React (with hooks), inline styles, and basic DOM events. NO external imports at all.
3. Use React.useState, React.useEffect, React.useRef, React.useCallback etc.
4. The component receives these props: { questions, onGameEnd, onAnswerResult, petEmoji }
   - questions: array of {question: string, options: string[], correctAnswer: string}
   - onGameEnd: function({score, correctAnswers, totalQuestions, survivalTime}) called when game ends
   - onAnswerResult: function({correct: boolean, question: string}) called after each answer
   - petEmoji: string — the player's equipped pet emoji (e.g. "🐧", "🐉"). Use this as the player character/icon in the game instead of a generic shape. Render it as text in a canvas drawText call or as a DOM element. Make the player visually BE their pet.
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

      function checkSyntax(c) {
        try { new Function('React', c); return null; } catch (e) { return e.message; }
      }

      let code = '';
      const maxAttempts = 3;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let extraWarning = '';
        if (attempt === 1) {
          extraWarning = '\n\nWARNING: Your previous response contained JSX syntax (<div>, <span>, etc). This is FORBIDDEN. You MUST use React.createElement() for ALL elements.';
        } else if (attempt === 2) {
          extraWarning = '\n\nCRITICAL FINAL ATTEMPT: Previous code had syntax errors. You MUST output ONLY valid JavaScript using React.createElement(). NO JSX at all.';
        }
        
        const codeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${systemPrompt}${extraWarning}\n\n${userPrompt}`,
          model: 'claude_sonnet_4_6',
        });

        code = (codeResult || '').replace(/^```(?:jsx?|javascript)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
        code = code.replace(/export\s+default\s+/, '');
        
        const hasJSX = /return\s*\(?\s*<[a-zA-Z]/.test(code) || /<[a-zA-Z][a-zA-Z0-9]*[\s>]/.test(code);
        if (hasJSX) { console.log(`Attempt ${attempt + 1}: JSX detected, retrying...`); continue; }
        
        const syntaxErr = checkSyntax(code);
        if (syntaxErr) { console.log(`Attempt ${attempt + 1}: Syntax error: ${syntaxErr}, retrying...`); continue; }
        
        break;
      }

      if (!code) return Response.json({ error: 'Failed to generate game code' }, { status: 500 });

      return Response.json({ code, name: generatedName, description: generatedDesc });

    } else if (action === 'edit') {
      const editSystemPrompt = `You are editing a React game component. Apply the requested change while keeping all existing functionality working.
${NO_JSX_RULE}
Return ONLY the complete updated component code. No markdown, no explanation. The function must be named GameComponent.
Current color theme: ${JSON.stringify(colors)}
Font: ${font || 'Inter'}`;

      function checkSyntaxEdit(c) {
        try { new Function('React', c); return null; } catch (e) { return e.message; }
      }

      let editedCode = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        let extraWarning = '';
        if (attempt === 1) extraWarning = '\n\nCRITICAL: Your previous output contained JSX (<div>, etc). You MUST only use React.createElement(). NO JSX.';
        else if (attempt === 2) extraWarning = '\n\nFINAL ATTEMPT: Output ONLY valid JS with React.createElement. Check all brackets are balanced.';
        
        const codeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${editSystemPrompt}${extraWarning}\n\nHere is the current game code:\n\n${existingCode}\n\nPlease make this change: ${editPrompt}\n\nReturn the COMPLETE updated code. No markdown fences, no explanation.`,
          model: 'claude_sonnet_4_6',
        });

        editedCode = (codeResult || '').replace(/^```(?:jsx?|javascript)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
        editedCode = editedCode.replace(/export\s+default\s+/, '');
        
        const hasJSX = /return\s*\(?\s*<[a-zA-Z]/.test(editedCode) || /<[a-zA-Z][a-zA-Z0-9]*[\s>]/.test(editedCode);
        if (hasJSX) { console.log(`Edit attempt ${attempt + 1}: JSX detected, retrying...`); continue; }
        
        const syntaxErr = checkSyntaxEdit(editedCode);
        if (syntaxErr) { console.log(`Edit attempt ${attempt + 1}: Syntax error: ${syntaxErr}, retrying...`); continue; }
        
        break;
      }

      return Response.json({ code: editedCode, changeDescription: `Applied: ${editPrompt}` });

    } else if (action === 'generateQuestions') {
      const { assignmentTitle, assignmentDescription, topic, questionCount, pdfUrl } = body;
      const count = questionCount || 10;

      let prompt;
      if (topic) {
        prompt = `Generate exactly ${count} multiple-choice quiz questions about: "${topic}". For ages 10-14. Each: 4 options, one correct. correctAnswer must match one option exactly.`;
      } else if (pdfUrl) {
        prompt = `Generate exactly ${count} multiple-choice quiz questions based on the content of the attached PDF document.\nAssignment title: ${assignmentTitle}\nDescription: ${assignmentDescription || 'N/A'}\nFor ages 10-14. Each question must have 4 options, one correct. correctAnswer must match one option exactly.`;
      } else {
        prompt = `Generate exactly ${count} multiple-choice quiz questions based on:\nTitle: ${assignmentTitle}\nDescription: ${assignmentDescription || 'N/A'}\nFor ages 10-14. Each: 4 options, one correct.`;
      }

      const llmParams = {
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
      };

      if (pdfUrl) llmParams.file_urls = [pdfUrl];

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM(llmParams);
      return Response.json({ questions: result?.questions || [] });

    } else if (action === 'generateThumbnail') {
      const result = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: `A colorful, fun, kid-friendly game thumbnail icon for "${gameName}". ${gameDescriptionForThumb || ''}. Style: flat design, vibrant ${colorTheme || 'blue'} colors, playful, school learning app. Square, simple, eye-catching. No text.`,
      });
      const thumbnailUrl = result?.url || result?.file_url || result?.image_url || null;
      if (!thumbnailUrl) {
        console.error('Thumbnail generation returned no URL:', result);
        return Response.json({ error: 'No thumbnail URL returned', raw: result }, { status: 500 });
      }
      return Response.json({ thumbnailUrl });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Game generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});