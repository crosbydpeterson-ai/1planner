import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { subject, body } = await req.json();
    if (!subject || !body) return Response.json({ error: 'Missing subject or body' }, { status: 400 });

    

    // Fetch all app users (send only to registered user emails)
    const users = await base44.asServiceRole.entities.User.list();
    const recipients = (users || [])
      .map(u => u.email?.trim())
      .filter(e => !!e);

    let sent = 0;
    const failed = [];
    for (const to of recipients) {
      try {
        await base44.integrations.Core.SendEmail({
          to,
          subject,
          body,
          from_name: '1Planner'
        });
        sent += 1;
      } catch (e) {
        failed.push({ to, error: e?.message || String(e) });
      }
    }

    return Response.json({ success: failed.length === 0, sent, failedCount: failed.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});