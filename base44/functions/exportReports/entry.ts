import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
...
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { report } = await req.json().catch(() => ({ report: null }));

    if (report === 'users_csv') {
      const rows = await base44.asServiceRole.entities.UserProfile.list('-created_date');
...
      const rows = await base44.asServiceRole.entities.Assignment.list('-created_date');
      const header = asCsvRow(['id', 'title', 'subject', 'target', 'dueDate', 'xpReward', 'isApproved']);
      const body = rows.map(r => asCsvRow([r.id, r.title, r.subject, r.target, r.dueDate || '', r.xpReward || 0, !!r.isApproved])).join('\n');
      const csv = header + '\n' + body;
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=assignments.csv'
        }
      });
    }

    return Response.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
});