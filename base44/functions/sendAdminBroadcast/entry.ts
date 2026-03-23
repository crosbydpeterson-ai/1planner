import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';



Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Allow built-in admins OR admins defined in UserProfile (rank admin/super_admin or username Crosby)
    const isBuiltInAdmin = user.role === 'admin';
    let isProfileAdmin = false;
    try {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ userId: user.email });
      if (profiles.length > 0) {
        const p = profiles[0];
        const uname = (p.username || '').toLowerCase();
        isProfileAdmin = p.rank === 'admin' || p.rank === 'super_admin' || uname === 'crosby';
      }
    } catch (_) {}

    if (!isBuiltInAdmin && !isProfileAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

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