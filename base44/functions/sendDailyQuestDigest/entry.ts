import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Helper: encode email to base64url for Gmail API (UTF-8 safe)
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

// Build HTML for a student's digest
function buildDigestHtml(assignments) {
  const items = assignments.map(a => {
    const due = a.dueDate ? `<div><strong>Due:</strong> ${new Date(a.dueDate).toLocaleDateString()}</div>` : '';
    return `
      <li style="margin-bottom:12px;">
        <div style="font-weight:600;font-size:15px;">${a.title}</div>
        <div style="color:#334155;">Subject: ${a.subject} • Target: ${a.target}</div>
        ${due}
        <div style="margin-top:6px;">${a.description || ''}</div>
        <div style="margin-top:6px;color:#0f766e;"><strong>XP:</strong> ${a.xpReward ?? 25}</div>
      </li>
    `;
  }).join('');

  return `
    <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <h2 style="margin:0 0 12px 0;">New Quests</h2>
      <p style="margin:0 0 16px 0;color:#475569;">Here are the quests added in the last 24 hours.</p>
      <ul style="padding-left:18px;margin:0;">${items}</ul>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e2e8f0;" />
      <div style="color:#64748b;font-size:12px;">You’re receiving this because your teacher/subject matches these quests.</div>
    </div>
  `;
}

// Determine which assignments are relevant for a student profile
function filterAssignmentsForStudent(assignments, profile) {
  return assignments.filter(a => {
    if (!a || !a.subject || !a.target) return false;
    if (a.subject === 'everyone') return true;
    if (a.subject === 'math') {
      if (a.target === 'everyone') return true;
      return (profile?.mathTeacher && profile.mathTeacher === a.target);
    }
    if (a.subject === 'reading') {
      if (a.target === 'everyone') return true;
      return (profile?.readingTeacher && profile.readingTeacher === a.target);
    }
    return false;
  });
}

// Send email via Gmail API using access token
async function gmailSend(accessToken, to, subject, html) {
  const message = [
    `To: ${to}`,
    'Subject: ' + subject,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  const raw = toBase64Url(message);
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gmail send failed: ${resp.status} ${text}`);
  }
  return await resp.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role for scheduled invocation and data access
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Fetch recent assignments (last 24h by created_date)
    // Fetch latest 200 by created_date desc to keep it efficient
    const recent = await base44.asServiceRole.entities.Assignment.list('-created_date', 200);
    const now = Date.now();
    const last24h = recent.filter(a => {
      const cd = a?.created_date ? new Date(a.created_date).getTime() : 0;
      return cd >= (now - 24 * 60 * 60 * 1000);
    });

    if (last24h.length === 0) {
      return Response.json({ sent: 0, message: 'No new assignments in last 24h' });
    }

    // Load student profiles
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({});
    const students = profiles.filter(p => (p?.rank || 'user') === 'user' && p?.userId);

    let sentCount = 0;
    const errors = [];

    for (const student of students) {
      const relevant = filterAssignmentsForStudent(last24h, student);
      if (relevant.length === 0) continue;

      const html = buildDigestHtml(relevant);
      const subject = 'Your New Quests (last 24 hours)';

      try {
        await gmailSend(accessToken, student.userId, subject, html);
        sentCount += 1;
      } catch (e) {
        errors.push({ to: student.userId, error: String(e?.message || e) });
      }
    }

    return Response.json({ sent: sentCount, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});