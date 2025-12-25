const PROXY_URL = 'https://reading-companion-proxy-production.up.railway.app/api/claude';

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt || 'You are a helpful reading assistant.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'API error');
  return data.content[0].text;
}

export async function generatePreReadBriefing(params: {
  chapterText: string;
  bookTitle: string;
  bookAuthor?: string;
  domain?: string;
  userGoal?: string;
  goalType?: string;
}): Promise<{
  overview: string;
  concepts: Array<{ term: string; definition: string; importance: string }>;
  questions: string[];
  structure: string;
}> {
  const systemPrompt = 'You are an expert reading coach. Create a pre-read briefing. Always respond with valid JSON.';
  const prompt = `Analyze this chapter and create a pre-read briefing.
Book: ${params.bookTitle}${params.bookAuthor ? ' by ' + params.bookAuthor : ''}
${params.domain ? 'Domain: ' + params.domain : ''}
${params.userGoal ? 'Reader Goal: ' + params.userGoal : ''}
Chapter Text:
${params.chapterText.substring(0, 15000)}

Create a JSON response with:
1. "overview": 2-3 sentence overview
2. "concepts": Array of 3-5 key concepts with "term", "definition", "importance"
3. "questions": Array of 3-5 questions to hold while reading
4. "structure": How the chapter is organized

Respond ONLY with valid JSON.`;

  const response = await callClaude(prompt, systemPrompt);
  const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function generatePostReadExtraction(params: {
  chapterText: string;
  bookTitle: string;
  bookAuthor?: string;
  domain?: string;
  userGoal?: string;
  goalType?: string;
  preReadQuestions?: string[];
}): Promise<{
  summary: string;
  concepts: Array<{ name: string; explanation: string; connections: string[] }>;
  claims: Array<{ claim: string; evidence: string; significance: string }>;
  answers: Array<{ question: string; answer: string }>;
  openQuestions: string[];
  cards: Array<{ front: string; back: string; type: string; difficulty: string }>;
}> {
  const systemPrompt = 'You are an expert reading coach. Extract key knowledge. Always respond with valid JSON.';
  const prompt = `Analyze this chapter and extract key knowledge.
Book: ${params.bookTitle}${params.bookAuthor ? ' by ' + params.bookAuthor : ''}
${params.domain ? 'Domain: ' + params.domain : ''}
${params.userGoal ? 'Reader Goal: ' + params.userGoal : ''}
${params.preReadQuestions?.length ? 'Pre-read questions: ' + params.preReadQuestions.join('; ') : ''}
Chapter Text:
${params.chapterText.substring(0, 15000)}

Create a JSON response with:
1. "summary": 3-4 sentence summary
2. "concepts": Array of 3-5 concepts with "name", "explanation", "connections"
3. "claims": Array of 2-4 claims with "claim", "evidence", "significance"
4. "answers": Array answering pre-read questions with "question", "answer"
5. "openQuestions": Array of 2-3 open questions
6. "cards": Array of 5-10 flashcards with "front", "back", "type", "difficulty"

Respond ONLY with valid JSON.`;

  const response = await callClaude(prompt, systemPrompt);
  const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}
