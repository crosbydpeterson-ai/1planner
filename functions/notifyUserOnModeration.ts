import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const evt = payload?.event;
    const data = payload?.data;
    const old = payload?.old_data || {};

    if (!evt || evt.entity_name !== 'UserProfile' || evt.type !== 'update' || !data) {
      return Response.json({ skipped: true });
    }

    const email = data.contactEmail;
    if (!email) {
      return Response.json({ skipped: true, reason: 'no contactEmail' });
    }

    const changes = [];

    // Ban status changes
    if (typeof data.isBanned === 'boolean' && data.isBanned !== old.isBanned) {
      if (data.isBanned) {
        const until = data.banEndDate ? new Date(data.banEndDate).toLocaleString() : 'until further notice';
        changes.push({
          subject: 'Account Notice: Temporary restriction on your account',
          body: `<p>Hi ${data.username || 'there'},</p>
                 <p>Your account has been temporarily restricted${data.banReason ? ` for: <b>${data.banReason}</b>` : ''}.</p>
                 <p>This restriction is active ${until}.</p>
                 <p>If you believe this is a mistake, please contact your teacher or admin.</p>
                 <p>— 1Planner</p>`
        });
      } else {
        changes.push({
          subject: 'Good news: Your account restriction has been lifted',
          body: `<p>Hi ${data.username || 'there'},</p>
                 <p>Your account is no longer restricted. Please continue following the guidelines.</p>
                 <p>— 1Planner</p>`
        });
      }
    }

    // Flag status changes
    if (typeof data.flagged === 'boolean' && data.flagged !== old.flagged) {
      if (data.flagged) {
        changes.push({
          subject: 'Heads up: You received a warning',
          body: `<p>Hi ${data.username || 'there'},</p>
                 <p>You have received a warning${data.flagMessage ? `: <b>${data.flagMessage}</b>` : ''}.</p>
                 <p>Please acknowledge in the app and keep things positive.</p>
                 <p>— 1Planner</p>`
        });
      } else {
        changes.push({
          subject: 'Your warning has been cleared',
          body: `<p>Hi ${data.username || 'there'},</p>
                 <p>Your previous warning has been cleared. Thank you!</p>
                 <p>— 1Planner</p>`
        });
      }
    }

    if (changes.length === 0) {
      return Response.json({ skipped: true, reason: 'no relevant changes' });
    }

    // Send one email per change (in case both ban and flag changed)
    await Promise.all(
      changes.map((c) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: c.subject,
          body: c.body,
          from_name: '1Planner Notifications'
        })
      )
    );

    return Response.json({ success: true, sent: changes.length });
  } catch (error) {
    console.error('notifyUserOnModeration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});