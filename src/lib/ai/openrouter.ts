/**
 * OpenRouter API Integration for AI Coach (Kobi)
 * Provides multi-model access for different use cases
 */

// Model configurations optimized for different use cases
export const AI_MODELS = {
  // Fast & cheap for simple messages (greetings, encouragements)
  fast: {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    maxTokens: 256,
  },
  // Medium for personalized content
  medium: {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash',
    maxTokens: 512,
  },
  // Powerful for complex insights and weekly reports
  powerful: {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    maxTokens: 1024,
  },
  // Fallback model
  fallback: {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    maxTokens: 512,
  },
} as const;

export type ModelTier = keyof typeof AI_MODELS;

// System prompts for Kobi the AI Coach
export const KOBI_SYSTEM_PROMPTS = {
  base: `Je bent Kobi, de vriendelijke AI-coach van KlusjesKoning. Je bent een enthousiaste, warme en aanmoedigende mentor voor kinderen die helpt met huishoudelijke taken.

BELANGRIJKE REGELS:
- Je bent ALTIJD positief en bemoedigend, NOOIT bestraffend of kritisch
- Je gebruikt eenvoudige, kindvriendelijke taal
- Je viert successen, hoe klein ook
- Je geeft praktische, leuke tips
- Je bent kort en bondig (max 2-3 zinnen voor berichten aan kinderen)
- Je gebruikt af en toe emoji's maar niet overdreven
- Je spreekt in de tweede persoon ("je", "jij", "jouw")
- NOOIT ongepaste content, altijd veilig voor kinderen`,

  ageAdaptation: {
    young: `Het kind is 4-7 jaar. Gebruik hele eenvoudige woorden, korte zinnen, en maak het speels. Vergelijk met bekende dingen (superhelden, dieren).`,
    middle: `Het kind is 8-11 jaar. Gebruik duidelijke taal, geef concrete tips, en leg verbanden met school/sport.`,
    teen: `Het kind is 12-16 jaar. Wees respectvol en niet kinderachtig. Geef praktische tips en erken hun groeiende zelfstandigheid.`,
  },

  toneVariations: {
    friendly: `Je toon is warm en vriendelijk, als een aardige oudere broer/zus.`,
    enthusiastic: `Je toon is super enthousiast en energiek! Veel uitroeptekens!`,
    calm: `Je toon is rustig en kalmerend, geruststellend.`,
  },
};

// Message type to model tier mapping
export const MESSAGE_TYPE_MODEL_MAP: Record<string, ModelTier> = {
  greeting: 'fast',
  encouragement: 'fast',
  milestone: 'medium',
  reminder: 'fast',
  tip: 'medium',
  motivation: 'medium',
  explanation: 'medium',
  celebration: 'medium',
  // Parent insights always use powerful
  insight: 'powerful',
  weekly_summary: 'powerful',
};

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GenerateOptions {
  modelTier?: ModelTier;
  maxTokens?: number;
  temperature?: number;
  childAge?: number;
  tone?: 'friendly' | 'enthusiastic' | 'calm';
}

/**
 * Generate AI response using OpenRouter
 */
export async function generateCoachResponse(
  userPrompt: string,
  messageType: string,
  options: GenerateOptions = {}
): Promise<{ content: string; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('OpenRouter API key not configured, using fallback message');
    return {
      content: getFallbackMessage(messageType),
      model: 'fallback',
    };
  }

  const modelTier = options.modelTier || MESSAGE_TYPE_MODEL_MAP[messageType] || 'fast';
  const modelConfig = AI_MODELS[modelTier];

  // Build system prompt based on context
  let systemPrompt = KOBI_SYSTEM_PROMPTS.base;

  if (options.childAge) {
    if (options.childAge <= 7) {
      systemPrompt += '\n\n' + KOBI_SYSTEM_PROMPTS.ageAdaptation.young;
    } else if (options.childAge <= 11) {
      systemPrompt += '\n\n' + KOBI_SYSTEM_PROMPTS.ageAdaptation.middle;
    } else {
      systemPrompt += '\n\n' + KOBI_SYSTEM_PROMPTS.ageAdaptation.teen;
    }
  }

  if (options.tone && KOBI_SYSTEM_PROMPTS.toneVariations[options.tone]) {
    systemPrompt += '\n\n' + KOBI_SYSTEM_PROMPTS.toneVariations[options.tone];
  }

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://klusjeskoning.app',
        'X-Title': 'KlusjesKoning AI Coach',
      },
      body: JSON.stringify({
        model: modelConfig.id,
        messages,
        max_tokens: options.maxTokens || modelConfig.maxTokens,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);

      // Try fallback model
      if (modelTier !== 'fallback') {
        console.log('Trying fallback model...');
        return generateCoachResponse(userPrompt, messageType, {
          ...options,
          modelTier: 'fallback',
        });
      }

      return {
        content: getFallbackMessage(messageType),
        model: 'fallback',
      };
    }

    const data: OpenRouterResponse = await response.json();
    const content = data.choices[0]?.message?.content || getFallbackMessage(messageType);

    // Content safety check
    const safeContent = sanitizeContent(content);

    return {
      content: safeContent,
      model: data.model,
    };
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    return {
      content: getFallbackMessage(messageType),
      model: 'fallback',
    };
  }
}

/**
 * Generate parent insight using powerful model
 */
export async function generateParentInsight(
  insightType: string,
  context: {
    childName: string;
    childAge?: number;
    dataPoints: Record<string, unknown>;
    previousInsights?: string[];
  }
): Promise<{ title: string; content: string; actionText?: string; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      title: 'Inzicht niet beschikbaar',
      content: 'De AI Coach is momenteel niet beschikbaar.',
      model: 'fallback',
    };
  }

  const systemPrompt = `Je bent een slimme ouder-adviseur van KlusjesKoning. Je analyseert gedragspatronen van kinderen en geeft ouders waardevolle, actionable inzichten.

REGELS:
- Wees specifiek en data-gedreven
- Geef altijd concrete aanbevelingen
- Blijf positief maar eerlijk
- Respecteer de privacy van het kind
- Schrijf in het Nederlands
- Titel: max 50 karakters
- Content: 2-4 zinnen
- Actie: 1 concrete tip`;

  const userPrompt = `Genereer een ${insightType} inzicht voor ${context.childName} (${context.childAge || 'leeftijd onbekend'} jaar).

Data:
${JSON.stringify(context.dataPoints, null, 2)}

${context.previousInsights?.length ? `Eerder gegeven inzichten (vermijd herhaling):\n${context.previousInsights.join('\n')}` : ''}

Geef je antwoord in dit JSON formaat:
{
  "title": "Korte titel",
  "content": "Uitgebreide uitleg van het inzicht",
  "actionText": "Concrete actie die de ouder kan nemen"
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://klusjeskoning.app',
        'X-Title': 'KlusjesKoning AI Coach',
      },
      body: JSON.stringify({
        model: AI_MODELS.powerful.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: AI_MODELS.powerful.maxTokens,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    const rawContent = data.choices[0]?.message?.content || '';

    // Parse JSON response
    try {
      const parsed = JSON.parse(rawContent);
      return {
        title: sanitizeContent(parsed.title || 'Nieuw inzicht'),
        content: sanitizeContent(parsed.content || ''),
        actionText: parsed.actionText ? sanitizeContent(parsed.actionText) : undefined,
        model: data.model,
      };
    } catch {
      // If not valid JSON, use raw content
      return {
        title: 'Inzicht',
        content: sanitizeContent(rawContent),
        model: data.model,
      };
    }
  } catch (error) {
    console.error('Failed to generate parent insight:', error);
    return {
      title: 'Inzicht niet beschikbaar',
      content: 'Er is een fout opgetreden bij het genereren van dit inzicht.',
      model: 'fallback',
    };
  }
}

/**
 * Generate weekly summary for family
 */
export async function generateWeeklySummary(
  familyData: {
    familyName: string;
    children: Array<{
      name: string;
      age?: number;
      choresCompleted: number;
      totalPoints: number;
      streakDays: number;
      topChores: string[];
    }>;
    weekStats: {
      totalChoresCompleted: number;
      previousWeekTotal: number;
      totalPointsEarned: number;
      teamChoresCompleted: number;
    };
  }
): Promise<{
  summaryContent: string;
  highlights: string[];
  recommendations: string[];
  model: string;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      summaryContent: 'Wekelijkse samenvatting niet beschikbaar.',
      highlights: [],
      recommendations: [],
      model: 'fallback',
    };
  }

  const systemPrompt = `Je bent de wekelijkse rapporteur van KlusjesKoning. Je maakt enthousiasmerende, informatieve wekelijkse samenvattingen voor gezinnen.

STIJL:
- Warm en positief
- Vier successen
- Geef constructieve suggesties
- Gebruik data om punten te onderbouwen
- Schrijf in het Nederlands
- Markdown formatting toegestaan`;

  const userPrompt = `Maak een wekelijkse samenvatting voor het gezin ${familyData.familyName}.

KINDEREN:
${familyData.children.map(c => `- ${c.name} (${c.age || '?'} jaar): ${c.choresCompleted} klusjes, ${c.totalPoints} punten, ${c.streakDays} dagen streak. Topklusjes: ${c.topChores.join(', ')}`).join('\n')}

WEEKSTATISTIEKEN:
- Totaal klusjes: ${familyData.weekStats.totalChoresCompleted} (vorige week: ${familyData.weekStats.previousWeekTotal})
- Totaal punten verdiend: ${familyData.weekStats.totalPointsEarned}
- Teamklusjes: ${familyData.weekStats.teamChoresCompleted}

Geef je antwoord in dit JSON formaat:
{
  "summaryContent": "Markdown-formatted samenvatting (3-5 paragrafen)",
  "highlights": ["Hoogtepunt 1", "Hoogtepunt 2", "Hoogtepunt 3"],
  "recommendations": ["Aanbeveling 1", "Aanbeveling 2", "Aanbeveling 3"]
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://klusjeskoning.app',
        'X-Title': 'KlusjesKoning AI Coach',
      },
      body: JSON.stringify({
        model: AI_MODELS.powerful.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    const rawContent = data.choices[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(rawContent);
      return {
        summaryContent: sanitizeContent(parsed.summaryContent || ''),
        highlights: (parsed.highlights || []).map((h: string) => sanitizeContent(h)),
        recommendations: (parsed.recommendations || []).map((r: string) => sanitizeContent(r)),
        model: data.model,
      };
    } catch {
      return {
        summaryContent: sanitizeContent(rawContent),
        highlights: [],
        recommendations: [],
        model: data.model,
      };
    }
  } catch (error) {
    console.error('Failed to generate weekly summary:', error);
    return {
      summaryContent: 'Wekelijkse samenvatting kon niet worden gegenereerd.',
      highlights: [],
      recommendations: [],
      model: 'fallback',
    };
  }
}

/**
 * Fallback messages when AI is unavailable
 */
function getFallbackMessage(messageType: string): string {
  const fallbacks: Record<string, string> = {
    greeting: 'Hoi! Fijn dat je er bent! Klaar voor een nieuwe dag met klusjes?',
    encouragement: 'Goed bezig! Je doet het super!',
    milestone: 'Wauw, wat een prestatie! Blijf zo doorgaan!',
    reminder: 'Vergeet je klusjes niet! Er wacht er eentje op je.',
    tip: 'Tip: begin met het makkelijkste klusje, dan krijg je lekker snel een goed gevoel!',
    motivation: 'Je kunt het! Elk klusje telt, hoe klein ook.',
    explanation: 'Door klusjes te doen verdien je punten die je kunt inwisselen voor beloningen!',
    celebration: 'Feest! Je hebt iets geweldigs bereikt!',
  };
  return fallbacks[messageType] || 'Je doet het geweldig!';
}

/**
 * Sanitize AI output for safety
 */
function sanitizeContent(content: string): string {
  // Remove any potential harmful content
  let safe = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');

  // Limit length
  if (safe.length > 2000) {
    safe = safe.substring(0, 2000) + '...';
  }

  return safe.trim();
}

/**
 * Prompt templates for different scenarios
 */
export const PROMPT_TEMPLATES = {
  choreCompleted: (childName: string, choreName: string, points: number, streakDays?: number) =>
    `${childName} heeft zojuist het klusje "${choreName}" afgerond en ${points} punten verdiend!${streakDays ? ` Dit is dag ${streakDays} van hun streak.` : ''} Geef een korte, enthousiaste felicitatie.`,

  dailyGreeting: (childName: string, pendingChores: number, currentStreak: number) =>
    `Genereer een vrolijke ochtendbegroeting voor ${childName}. Ze hebben ${pendingChores} klusje(s) te doen vandaag. Hun huidige streak is ${currentStreak} dagen.`,

  streakReminder: (childName: string, streakDays: number, hoursLeft: number) =>
    `${childName} heeft een streak van ${streakDays} dagen, maar heeft vandaag nog geen klusje gedaan. Er zijn nog ${hoursLeft} uur over. Stuur een zachte, motiverende herinnering.`,

  milestoneAchieved: (childName: string, milestoneType: string, value: number) =>
    `${childName} heeft een milestone bereikt: ${milestoneType} = ${value}! Vier dit met een enthousiast bericht.`,

  motivationDip: (childName: string, daysSinceActive: number, previousAverage: number) =>
    `${childName} is ${daysSinceActive} dagen niet actief geweest, terwijl ze normaal ${previousAverage} klusjes per week doen. Stuur een empathisch, aanmoedigend bericht zonder schuldgevoel.`,

  tipForChore: (childName: string, choreName: string, childAge: number) =>
    `Geef ${childName} (${childAge} jaar) een praktische, leuke tip voor het klusje "${choreName}". Maak het speels en uitvoerbaar.`,
};
