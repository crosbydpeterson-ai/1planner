import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return Response.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // Fetch the job using service role
    const jobs = await base44.asServiceRole.entities.EggGenerationJob.filter({ id: jobId });
    if (jobs.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[0];
    if (job.status !== 'pending') {
      return Response.json({ error: 'Job already started or completed' }, { status: 400 });
    }

    // Mark as processing
    await base44.asServiceRole.entities.EggGenerationJob.update(jobId, {
      status: 'processing',
      currentStep: `Generating concept 1 of ${job.totalCount}...`,
      completedCount: 0
    });

    const createdPetIds = [];
    const createdThemeIds = [];

    // Process creatures one at a time so we can update progress
    for (let i = 0; i < job.totalCount; i++) {
      try {
        // Step 1: Generate concept
        await base44.asServiceRole.entities.EggGenerationJob.update(jobId, {
          currentStep: `Generating concept ${i + 1} of ${job.totalCount}...`
        });

        const concept = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a creative designer for a school-safe game. Design based on: "${job.idea}"${job.totalCount > 1 ? `. This is variation ${i + 1} of ${job.totalCount} — make each one unique with different names, colors, and styles.` : ''}. Generate: name (2-3 words), description (1-2 sentences), emoji, rarity (uncommon/rare/epic), theme {primary,secondary,accent,bg} hex colors.`,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              emoji: { type: "string" },
              rarity: { type: "string", enum: ["uncommon", "rare", "epic"] },
              theme: {
                type: "object",
                properties: {
                  primary: { type: "string" },
                  secondary: { type: "string" },
                  accent: { type: "string" },
                  bg: { type: "string" }
                }
              }
            }
          }
        });

        // Step 2: Generate image
        await base44.asServiceRole.entities.EggGenerationJob.update(jobId, {
          currentStep: `Generating image ${i + 1} of ${job.totalCount} (${concept.name})...`
        });

        let imageUrl = '';
        try {
          const img = await base44.asServiceRole.integrations.Core.GenerateImage({
            prompt: `School-safe illustration: ${concept.name}. ${concept.description}. Colors: ${concept.theme?.primary}, ${concept.theme?.secondary}. White background, centered.`
          });
          imageUrl = img.url;
        } catch (e) {
          console.error('Image gen failed for', concept.name, e);
        }

        // Step 3: Save pet and theme
        await base44.asServiceRole.entities.EggGenerationJob.update(jobId, {
          currentStep: `Saving creature ${i + 1} of ${job.totalCount} (${concept.name})...`
        });

        const pet = await base44.asServiceRole.entities.CustomPet.create({
          name: concept.name,
          description: concept.description,
          emoji: concept.emoji,
          imageUrl,
          rarity: concept.rarity,
          xpRequired: 999999,
          isGiftOnly: true,
          theme: concept.theme,
          createdBy: job.startedBy || 'admin',
          createdByProfileId: job.startedByProfileId,
          createdSourceTab: 'admin_eggs',
          imageSource: imageUrl ? 'ai_generated' : 'emoji_only'
        });

        const theme = await base44.asServiceRole.entities.CustomTheme.create({
          name: concept.name,
          rarity: concept.rarity || 'common',
          xpRequired: 0,
          description: `Theme from ${concept.name}`,
          primaryColor: concept.theme?.primary || '#6366f1',
          secondaryColor: concept.theme?.secondary || '#a5b4fc',
          accentColor: concept.theme?.accent || '#f59e0b',
          bgColor: concept.theme?.bg || '#f0f9ff'
        });

        createdPetIds.push(pet.id);
        createdThemeIds.push(theme.id);

        await base44.asServiceRole.entities.EggGenerationJob.update(jobId, {
          completedCount: i + 1,
          createdPetIds,
          createdThemeIds
        });

      } catch (innerErr) {
        console.error(`Error on creature ${i + 1}:`, innerErr);
        // Continue with next creature
      }
    }

    // Mark completed
    await base44.asServiceRole.entities.EggGenerationJob.update(jobId, {
      status: 'completed',
      currentStep: `Done! Created ${createdPetIds.length} creature${createdPetIds.length !== 1 ? 's' : ''}.`,
      completedCount: createdPetIds.length,
      createdPetIds,
      createdThemeIds
    });

    return Response.json({ success: true, petIds: createdPetIds, themeIds: createdThemeIds });
  } catch (error) {
    console.error('generateMagicEggs error:', error);

    // Try to mark job as failed
    try {
      const base44 = createClientFromRequest(req);
      const { jobId } = await req.json().catch(() => ({}));
      if (jobId) {
        await base44.asServiceRole.entities.EggGenerationJob.update(jobId, {
          status: 'failed',
          currentStep: 'Failed: ' + error.message,
          error: error.message
        });
      }
    } catch (_) { /* ignore */ }

    return Response.json({ error: error.message }, { status: 500 });
  }
});