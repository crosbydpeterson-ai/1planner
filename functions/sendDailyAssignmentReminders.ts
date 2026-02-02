import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use Gmail app connector to send emails (authorized in app)
    const gmailToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

    // Use service role for scheduled job
    const users = await base44.asServiceRole.entities.UserProfile.list();
    const assignments = await base44.asServiceRole.entities.Assignment.list();

    let sentCount = 0;

    for (const user of users) {
      const email = user?.contactEmail;
      if (!email) continue;

      // Find visible, not-completed assignments for this user
      const completed = Array.isArray(user.completedAssignments) ? user.completedAssignments : [];
      const relevant = assignments.filter((a) => {
        if (!a.isApproved) return false;
        if (completed.includes(a.id)) return false;
        if (a.subject === 'everyone' || a.target === 'everyone') return true;
        if (a.target === user.userId) return true;
        if (a.subject === 'math' && a.target === user.mathTeacher) return true;
        if (a.subject === 'reading' && a.target === user.readingTeacher) return true;
        return false;
      });

      if (relevant.length === 0) continue;

      // Build simple HTML email
      const listItems = relevant
        .map((a) => {
          const dueText = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date';
          const xp = typeof a.xpReward === 'number' ? ` (${a.xpReward} XP)` : '';
          return `<li><b>${a.title}</b>${xp} — Due: ${dueText}</li>`;
        })
        .join('');

      const body = `
        <p>Hi ${user.username || 'there'},</p>
        <p>You have the following assignments:</p>
        <ul>${listItems}</ul>
        <p>Good luck!<br/>— 1Planner</p>
      `;

      // Build MIME email and send via Gmail API
      const mime = `To: ${email}\nSubject: Your assignments reminder from 1Planner\nContent-Type: text/html; charset=UTF-8\nMIME-Version: 1.0\n\n${body}`;
      const raw = btoa(unescape(encodeURIComponent(mime)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Gmail send failed', res.status, errText);
      }

      sentCount += 1;
    }

    return Response.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('sendDailyAssignmentReminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});