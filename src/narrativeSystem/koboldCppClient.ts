export class KoboldCppClient {
  private endpoint: string;
  private isConnected: boolean = false;
  private generationTimeoutMs: number = 2500;

  constructor(endpoint: string = 'http://localhost:5001') {
    this.endpoint = endpoint;
  }

  public setEndpoint(url: string) {
    this.endpoint = url;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/v1/model`);
      this.isConnected = response.ok;
      return this.isConnected;
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
      throw new Error('Not connected to KoboldCpp');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.generationTimeoutMs);

      const response = await fetch(`${this.endpoint}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          max_length: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          stop_sequence: ["\n\n", "Dealer:"]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results?.[0]?.text?.trim() || '';
    } catch (e) {
      console.error('LLM Generation failed:', e);
      throw e;
    }
  }
}

export const koboldClient = new KoboldCppClient();
