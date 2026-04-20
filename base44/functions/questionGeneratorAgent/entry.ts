import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Proxies question_generator agent calls using service role (app uses custom PIN auth, not base44 auth).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const { profileId, username } = body;
      const convo = await base44.asServiceRole.agents.createConversation({
        agent_name: 'question_generator',
        metadata: {
          name: 'Question Generator Session',
          description: 'AI question generator session',
          profileId,
          username,
        },
      });
      return Response.json({ conversation: convo });
    }

    if (action === 'send') {
      const { conversationId, content } = body;
      const convo = await base44.asServiceRole.agents.getConversation(conversationId);
      base44.asServiceRole.agents.addMessage(convo, {
        role: 'user',
        content,
      }).catch(err => console.error('Agent run error:', err));
      return Response.json({ ok: true });
    }

    if (action === 'get') {
      const { conversationId } = body;
      const convo = await base44.asServiceRole.agents.getConversation(conversationId);
      return Response.json({ conversation: convo });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('questionGeneratorAgent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});