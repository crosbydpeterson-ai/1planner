import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { assignmentId } = await req.json();
    if (!assignmentId) return Response.json({ error: 'Missing assignmentId' }, { status: 400 });

    // Load assignment
    const assignments = await base44.asServiceRole.entities.Assignment.filter({ id: assignmentId });
    if (!assignments.length) return Response.json({ error: 'Assignment not found' }, { status: 404 });
    const a = assignments[0];

    // Determine recipients from UserProfile
    let profiles = [];
    if (a.subject === 'everyone' || a.target === 'everyone') {
      profiles = await base44.asServiceRole.entities.UserProfile.list();
    } else if (a.subject === 'math') {
      profiles = await base44.asServiceRole.entities.UserProfile.filter({ mathTeacher: a.target });
    } else if (a.subject === 'reading') {
      profiles = await base44.asServiceRole.entities.UserProfile.filter({ readingTeacher: a.target });
    } else {
      // Target may be a specific user (email in userId)
      const one = await base44.asServiceRole.entities.UserProfile.filter({ userId: a.target });
      profiles = one;
    }

    const recipients = (profiles || [])
      .map(p => (p.userId || '').trim())
      .filter(e => !!e && e.includes('@'));

    if (!recipients.length) {
      return Response.json({ success: true, sent: 0, failedCount: 0, message: 'No recipients for this assignment' });
    }

    const subject = `New Assignment: ${a.title}`;
    const parts = [] as string[];
    parts.push(`<p><strong>${a.title}</strong></p>`);
    if (a.description) parts.push(`<p>${a.description}</p>`);
    const meta: string[] = [];
    meta.push(a.subject === 'everyone' ? 'Everyone' : `${a.subject}: ${a.target}`);
    if (a.xpReward) meta.push(`${a.xpReward} XP`);
    if (a.dueDate) meta.push(`Due ${a.dueDate}`);
    parts.push(`<p style="color:#64748b;font-size:12px">${meta.join(' • ')}</p>`);
    parts.push('<p>Open the app to view and complete this assignment.</p>');
    const body = parts.join('\n');

    let sent = 0;
    const failed: Array<{to: string; error: string}> = [];
    for (const to of recipients) {
      try {
        await base44.integrations.Core.SendEmail({ to, subject, body, from_name: '1Planner' });
        sent += 1;
      } catch (e) {
        failed.push({ to, error: (e as any)?.message || String(e) });
      }
    }

    return Response.json({ success: failed.length === 0, sent, failedCount: failed.length });
  } catch (error) {
    return Response.json({ error: (error as any).message }, { status: 500 });
  }
});