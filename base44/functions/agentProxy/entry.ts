import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, agent_name, conversation_id, metadata, message } = body;

    if (action === 'create_conversation') {
      const conv = await base44.asServiceRole.agents.createConversation({
        agent_name,
        metadata: metadata || {},
      });
      return Response.json(conv);
    }

    if (action === 'add_message') {
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      const result = await base44.asServiceRole.agents.addMessage(conv, message);
      return Response.json(result);
    }

    if (action === 'get_conversation') {
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      return Response.json(conv);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('agentProxy error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});