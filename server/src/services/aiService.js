import { ApiError } from '../utils/apiError.js';

export async function completeAI(messages, { json = false } = {}) {
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();
  // const endpoint = process.env.AI_BASE_URL?.trim() || 'https://api.groq.com/openai/v1';
  const base = (process.env.AI_BASE_URL?.trim() || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  const endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
  if (!apiKey || !model) {
    throw new ApiError(503, 'The AI assistant is not configured. Add AI_API_KEY and AI_MODEL to the server environment.');
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 1400,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new ApiError(502, 'Could not reach the AI provider. Check the server connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new ApiError(503, 'The AI provider rejected its server credentials. Check AI_API_KEY.');
    if (response.status === 429) throw new ApiError(503, 'The AI provider is busy or its usage limit was reached. Try again later.');
    throw new ApiError(502, 'The AI provider could not complete that request. Try again shortly.');
  }

  let result;
  try { result = await response.json(); }
  catch { throw new ApiError(502, 'The AI provider returned an unreadable response.'); }
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new ApiError(502, 'The AI provider returned an empty response. Try again.');
  return content.trim();
}
