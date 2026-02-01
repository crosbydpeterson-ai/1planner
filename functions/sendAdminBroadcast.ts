import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';



Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { subject, body } = await req.json();
    if (!subject || !body) return Response.json({ error: 'Missing subject or body' }, { status: 400 });

    

    // Fetch all app users (send only to registered user emails)
    const users = await base44.asServiceRole.entities.User.list();
    const recipients = (users || [])
      .map(u => u.email?.trim())
      .filter(e => !!e);

    let sent = 0;
    for (const to of recipients) {
      await base44.integrations.Core.SendEmail({
        to,
        subject,
        body,
        from_name: '1Planner'
      });
      sent += 1;
    }

    return Response.json({ success: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});