/**
 * localLlmNetworkClient.ts
 * Connects the frontend to the locally running llama-server sidecar.
 * The server is spawned by Tauri on port 8080 and exposes OpenAI-compatible endpoints.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export async function generateLocalLlmResponse(request: ChatCompletionRequest): Promise<string> {
  try {
    const response = await fetch('http://127.0.0.1:8080/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM Server Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Failed to communicate with local LLM sidecar:', error);
    throw error;
  }
}
