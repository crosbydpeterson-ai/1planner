import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sendGmail(accessToken, from, to, subject, html) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
  ].join('\r\n');

  const raw = base64UrlEncode(message);
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${text}`);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { subject, body } = await req.json();
    if (!subject || !body) return Response.json({ error: 'Missing subject or body' }, { status: 400 });

    

    // Fetch all profiles and filter to those with contactEmail
    const profiles = await base44.asServiceRole.entities.UserProfile.list();
    const recipients = (profiles || [])
      .map(p => p.contactEmail?.trim())
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