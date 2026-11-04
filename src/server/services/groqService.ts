/**
 * Groq AI Model Adapter Service
 * 
 * Provides an integration adapter for Groq Cloud inference (LPU hardware).
 * Features:
 * - Checks key presence and verifies connectivity safely without leaking secrets.
 * - Queries Groq models endpoint to check accessible model IDs.
 * - Supports genuine Meta models hosted on Groq (e.g. llama-3.3-70b-versatile, llama-3.2-3b-preview, llama-3.2-11b-vision-preview).
 * - Tracks requests, rates, and latency.
 * - Safely handles quota, rate limits (HTTP 429), and missing credentials with actionable diagnostics.
 */

export interface GroqInferenceRequest {
  model?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  max_tokens?: number;
  temperature?: number;
}

export interface GroqInferenceResponse {
  reply: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs: number;
}

export interface GroqAccountStatus {
  configured: boolean;
  accessible: boolean;
  statusMessage: string;
  availableModels: string[];
  recommendedModel: string;
}

export class GroqService {
  private get apiKey(): string | undefined {
    return process.env.GROQ_API_KEY?.trim();
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Health and quota check: queries Groq models endpoint
   */
  public async checkStatus(): Promise<GroqAccountStatus> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        accessible: false,
        statusMessage: 'GROQ_API_KEY is not configured in the server environment.',
        availableModels: [],
        recommendedModel: 'llama-3.3-70b-versatile',
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const models = (data.data || []).map((m: any) => m.id as string);
        const metaModels = models.filter((m: string) => m.includes('llama') || m.includes('meta'));
        
        return {
          configured: true,
          accessible: true,
          statusMessage: 'Groq Cloud API is authenticated and operational.',
          availableModels: metaModels.length > 0 ? metaModels : models,
          recommendedModel: models.includes('llama-3.3-70b-versatile')
            ? 'llama-3.3-70b-versatile'
            : models.find((m: string) => m.includes('llama-3.2-3b')) || models[0] || 'llama-3.3-70b-versatile',
        };
      } else if (res.status === 401) {
        return {
          configured: true,
          accessible: false,
          statusMessage: 'GROQ_API_KEY was rejected (HTTP 401 Unauthorized). Please verify key accuracy in .env.',
          availableModels: [],
          recommendedModel: 'llama-3.3-70b-versatile',
        };
      } else if (res.status === 429) {
        return {
          configured: true,
          accessible: false,
          statusMessage: 'Groq Cloud API quota exceeded or rate limit hit (HTTP 429).',
          availableModels: [],
          recommendedModel: 'llama-3.3-70b-versatile',
        };
      } else {
        return {
          configured: true,
          accessible: false,
          statusMessage: `Groq API responded with HTTP ${res.status}.`,
          availableModels: [],
          recommendedModel: 'llama-3.3-70b-versatile',
        };
      }
    } catch (err: any) {
      return {
        configured: true,
        accessible: false,
        statusMessage: `Groq connection check error: ${err.message}`,
        availableModels: [],
        recommendedModel: 'llama-3.3-70b-versatile',
      };
    }
  }

  /**
   * Execute chat completion on Groq Cloud
   */
  public async executeChat(req: GroqInferenceRequest): Promise<GroqInferenceResponse> {
    if (!this.isConfigured()) {
      throw new Error('GROQ_API_KEY is not set in the server environment.');
    }

    const model = req.model || 'llama-3.3-70b-versatile';
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: req.messages,
        max_tokens: req.max_tokens || 1024,
        temperature: req.temperature ?? 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 429) {
        throw new Error('Groq rate limit / quota exceeded (HTTP 429). Please wait before issuing additional queries.');
      }
      throw new Error(`Groq API returned HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return {
      reply,
      model,
      usage: data.usage,
      latencyMs,
    };
  }
}

export const groqService = new GroqService();
