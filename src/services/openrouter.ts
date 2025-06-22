import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

export interface Model {
  id: string;
  name: string;
  isFree: boolean;
}

export const fetchModels = async (apiKey: string): Promise<Model[]> => {
  try {
    const response = await axios.get(`${OPENROUTER_API_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      isFree: model.pricing?.prompt === '0',
    }));
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};

export const sendChatMessage = async (
  apiKey: any,
  model: string,
  messages: { role: string; content: string }[],
  systemPrompt?: string,
  onStream?: (chunk: string) => void
) => {
  try {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: `
          Your primary role is to assist with the user's information needs. **But first, you MUST establish a clear 'TITLE:' for the current chat context
          /n${systemPrompt || ''}` }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              if (onStream) {
                onStream(content);
              }
            }
          } catch (err) {
            console.warn('Error parsing stream chunk:', err);
          }
        }
      }
    }
    return fullResponse;
  } catch (error) {
    console.error('Error streaming chat message:', error);
    throw new Error('Failed to get response from model');
  }
};