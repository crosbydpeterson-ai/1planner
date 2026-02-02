import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Optional admin check when invoked from UI
    let authUser = null;
    try { authUser = await base44.auth.me(); } catch (_) {}
    if (authUser && authUser.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Use service role for scheduled job
    const userProfiles = await base44.asServiceRole.entities.UserProfile.list();
    const allAssignments = await base44.asServiceRole.entities.Assignment.list();
    const allBaseUsers = await base44.asServiceRole.entities.User.list();
    const baseUserMap = new Map(allBaseUsers.map(u => [u.email, u]));

    let sentCount = 0;

    for (const userProfile of userProfiles) {
      const userEmail = userProfile?.userId;
      const baseUser = baseUserMap.get(userEmail);
      if (!baseUser || !baseUser.email) continue;
      const recipientEmail = baseUser.email;

      // Find visible, not-completed assignments for this user
      const completed = Array.isArray(userProfile.completedAssignments) ? userProfile.completedAssignments : [];
      const relevant = allAssignments.filter((a) => {
        if (!a.isApproved) return false;
        if (completed.includes(a.id)) return false;
        if (a.subject === 'everyone' || a.target === 'everyone') return true;
        if (a.target === userProfile.userId) return true;
        if (a.subject === 'math' && a.target === userProfile.mathTeacher) return true;
        if (a.subject === 'reading' && a.target === userProfile.readingTeacher) return true;
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
        <p>Hi ${userProfile.username || 'there'},</p>
        <p>You have the following assignments:</p>
        <ul>${listItems}</ul>
        <p>Good luck!<br/>— 1Planner</p>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: 'Your assignments reminder from 1Planner',
        body,
        from_name: '1Planner Reminders'
      });

      sentCount += 1;
    }

    return Response.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('sendDailyAssignmentReminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});