import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, conversationId, message, agentName } = await req.json();

    if (action === 'create_conversation') {
      const conv = await base44.asServiceRole.agents.createConversation({
        agent_name: agentName || 'admin_assistant',
        metadata: { name: 'Admin Chat' }
      });
      return Response.json({ conversation: conv });
    }

    if (action === 'get_conversation') {
      const conv = await base44.asServiceRole.agents.getConversation(conversationId);
      return Response.json({ conversation: conv });
    }

    if (action === 'send_message') {
      const conv = await base44.asServiceRole.agents.getConversation(conversationId);
      await base44.asServiceRole.agents.addMessage(conv, {
        role: 'user',
        content: message
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});