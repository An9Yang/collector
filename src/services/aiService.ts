export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string;
const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY as string;

export async function getAzureOpenAIChatCompletion(
  messages: ChatMessage[],
  // You can add other parameters like temperature, max_tokens, etc. if needed
): Promise<string> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    console.error('Azure OpenAI environment variables (VITE_AZURE_OPENAI_ENDPOINT, VITE_AZURE_OPENAI_KEY) are not set.');
    throw new Error('Azure OpenAI environment variables are not configured.');
  }

  try {
    const response = await fetch(AZURE_OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: messages,
        // GPT-5-mini 配置 (Azure OpenAI官方限制)
        max_tokens: 131072,  // Azure OpenAI GPT-5-mini 最大输出
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Azure OpenAI API Error:', response.status, errorBody);
      throw new Error(`Azure OpenAI API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      console.error('Invalid response structure from Azure OpenAI:', data);
      throw new Error('Failed to get a valid response from Azure OpenAI.');
    }
  } catch (error) {
    console.error('Error calling Azure OpenAI service:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
