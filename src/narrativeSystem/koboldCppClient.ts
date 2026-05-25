const LLM_PROVIDER_STORAGE_KEY = 'starshipInfernum.llmProvider';
const LLM_ENDPOINT_STORAGE_KEY = 'starshipInfernum.llmEndpoint';

export class KoboldCppClient {
  private endpoint: string;
  private provider: 'sidecar' | 'external';
  private isConnected: boolean = false;
  private generationTimeoutMs: number = 10000;

  constructor() {
    const storedProvider = window.localStorage.getItem(LLM_PROVIDER_STORAGE_KEY);
    this.provider = (storedProvider === 'external') ? 'external' : 'sidecar';

    const storedEndpoint = window.localStorage.getItem(LLM_ENDPOINT_STORAGE_KEY);
    this.endpoint = storedEndpoint || 'http://localhost:5001';
  }

  public setProvider(provider: 'sidecar' | 'external') {
    this.provider = provider;
    window.localStorage.setItem(LLM_PROVIDER_STORAGE_KEY, provider);
  }

  public getProvider(): 'sidecar' | 'external' {
    return this.provider;
  }

  public setEndpoint(url: string) {
    this.endpoint = url;
    window.localStorage.setItem(LLM_ENDPOINT_STORAGE_KEY, url);
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      if (this.provider === 'sidecar') {
        const response = await fetch('http://127.0.0.1:8080/health');
        if (response.ok) {
          const data = await response.json();
          this.isConnected = data.status === 'ok';
          return this.isConnected;
        }
        this.isConnected = false;
        return false;
      } else {
        const response = await fetch(`${this.endpoint}/api/v1/model`);
        this.isConnected = response.ok;
        return this.isConnected;
      }
    } catch (e) {
      this.isConnected = false;
      return false;
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public async generate(prompt: string, maxTokens: number = 60): Promise<string> {
    if (!this.isConnected) {
      throw new Error(`Not connected to LLM Provider (${this.provider})`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.generationTimeoutMs);

      let url: string;
      let body: any;

      if (this.provider === 'sidecar') {
        url = 'http://127.0.0.1:8080/v1/completions';
        body = {
          prompt: prompt,
          max_tokens: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          stop: ["\n\n", "Dealer:"]
        };
      } else {
        url = `${this.endpoint}/api/v1/generate`;
        body = {
          prompt: prompt,
          max_length: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          stop_sequence: ["\n\n", "Dealer:"]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (this.provider === 'sidecar') {
        return data.choices?.[0]?.text?.trim() || '';
      } else {
        return data.results?.[0]?.text?.trim() || '';
      }
    } catch (e) {
      console.error('LLM Generation failed:', e);
      throw e;
    }
  }
}

export const koboldClient = new KoboldCppClient();
