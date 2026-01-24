import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai@4.77.3';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { petIdea, generateImage } = await req.json();

    if (!petIdea) {
      return Response.json({ error: 'Pet idea is required' }, { status: 400 });
    }

    // Generate pet details
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a magical creature designer for a KIDS school gamification app called Quest Planner.

A student wants to create their own custom magical companion using a Magic Egg!

WHAT YOU CAN CREATE (be creative!):
- Traditional pets (cats, dogs, dragons, etc.)
- Magical creatures (sprites, fairies, elementals)
- Living objects (a friendly book, a dancing pencil, a wise calculator)
- Food creatures (a happy pizza slice, a brave taco warrior)
- Nature spirits (cloud beings, flower sprites, rock guardians)
- Abstract concepts (a helpful star, a friendly rainbow, a cozy blanket ghost)
- Robots and tech creatures (friendly AI, pixel pets)
- Mythical beings (mini phoenix, baby unicorn, tiny kraken)

CONTENT RULES (VERY IMPORTANT - THIS IS FOR CHILDREN):
- The creature MUST be appropriate for elementary/middle school kids
- NO violence, weapons, scary monsters, demons, or horror themes
- NO inappropriate body parts or suggestive content
- NO drugs, alcohol, or adult themes
- NO mean, bullying, or negative personalities
- If the user's idea is inappropriate, create a SAFE alternative (like a friendly version)
- Keep it cute, fun, positive, and school-friendly!

Generate a fun, school-appropriate magical companion. It should:
- Have a creative, catchy name (2-3 words max)
- Be cute, friendly, and have personality
- Have a fun description (1-2 sentences)
- Have a single emoji that fits (just ONE emoji character - can be any emoji!)
- Have a cohesive color theme with 4 HEX color codes

IMPORTANT for theme colors:
- primary: Main color (vibrant, saturated) - MUST be a valid hex like #3b82f6
- secondary: Lighter/complementary color - MUST be a valid hex like #93c5fd  
- accent: Pop color for highlights - MUST be a valid hex like #f59e0b
- bg: Background color (light for light themes like #f0f9ff, dark for dark themes like #1e1b4b)

Make sure all colors work well together and match the creature's personality!

Return ONLY valid JSON with this structure:
{
  "name": "Pet Name",
  "description": "Fun description",
  "emoji": "🐉",
  "rarity": "uncommon|rare|epic",
  "theme": {
    "primary": "#3b82f6",
    "secondary": "#93c5fd",
    "accent": "#f59e0b",
    "bg": "#f0f9ff"
  }
}`
        },
        {
          role: "user",
          content: petIdea
        }
      ],
      response_format: { type: "json_object" },
      temperature: 1.0
    });

    const petData = JSON.parse(completion.choices[0].message.content);

    // Generate image if requested
    let imageUrl = null;
    if (generateImage) {
      const imagePrompt = `Cute cartoon pet character for a CHILDREN'S educational game: ${petData.name}. ${petData.description}. 
Style: adorable, friendly, colorful digital art, game mascot style, simple clean design, kid-friendly, Pixar-style cuteness.
MUST BE: Safe for children, no scary elements, bright and cheerful.
Color scheme: primary ${petData.theme?.primary}, secondary ${petData.theme?.secondary}, accent ${petData.theme?.accent}.
White or transparent background, centered, high quality illustration.`;

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });

      const tempImageUrl = imageResponse.data[0].url;
      
      // Download the image from OpenAI and upload to Base44 storage
      const imageData = await fetch(tempImageUrl);
      const imageBlob = await imageData.blob();
      
      // Upload to Base44
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
        file: imageBlob
      });
      
      imageUrl = uploadResult.file_url;
    }

    return Response.json({
      pet: petData,
      imageUrl
    });

  } catch (error) {
    console.error('Error generating pet:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});