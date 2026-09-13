import {
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_MODEL,
} from '@/lib/settings/llm';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function chatDeepseek(options: {
  apiKey: string;
  messages: ChatMessage[];
  model?: string;
  baseUrl?: string;
  temperature?: number;
  /** 输出上限；长章节宜设高，避免正文被截断 */
  maxTokens?: number;
}): Promise<string> {
  const baseUrl = (options.baseUrl ?? DEFAULT_DEEPSEEK_BASE_URL).replace(
    /\/$/,
    '',
  );
  const model = options.model ?? DEFAULT_DEEPSEEK_MODEL;
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 8192,
      stream: false,
    }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'object' &&
      (payload as { error: { message?: unknown } }).error !== null &&
      typeof (payload as { error: { message?: unknown } }).error.message ===
        'string'
        ? (payload as { error: { message: string } }).error.message
        : `DeepSeek 调用失败（HTTP ${response.status}）`;
    throw new Error(message);
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'choices' in payload &&
    Array.isArray((payload as { choices: unknown }).choices) &&
    (payload as { choices: Array<{ message?: { content?: unknown } }> })
      .choices[0]
  ) {
    const content = (
      payload as { choices: Array<{ message?: { content?: unknown } }> }
    ).choices[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      return content.trim();
    }
  }

  throw new Error('DeepSeek 返回空内容');
}
