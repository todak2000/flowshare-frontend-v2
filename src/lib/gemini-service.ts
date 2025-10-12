/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  private flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  /**
   * Answer natural language questions about production data
   */
  async naturalLanguageQuery(query: string, context: any): Promise<string> {
    const prompt = `
      User Question: "${query}"

      Production Data Context:
      ${JSON.stringify(context, null, 2)}

      Provide a clear, concise answer with:
      1. Direct answer to the question
      2. Relevant statistics
      3. Any insights or trends
      
      Keep under 200 words.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Detect anomalies in production entries
   */
  async detectAnomalies(entries: any[]): Promise<any[]> {
    const prompt = `
      Analyze these production entries for anomalies:

      ${JSON.stringify(entries, null, 2)}

      Identify:
      1. Volume outliers (unusual spikes/drops)
      2. BSW% anomalies (expected 0-10%)
      3. Temperature anomalies (expected 60-150°F)
      4. API gravity outliers (expected 15-45°)

      For each anomaly, provide:
      - entry_id
      - type
      - severity (low/medium/high)  
      - explanation
      - action

      Return as JSON array.
    `;

    const result = await this.flashModel.generateContent(prompt);
    const response = await result.response;
    return this.parseJSON(response.text());
  }

  /**
   * Generate allocation insights  
   */
  async generateInsights(allocationData: any): Promise<string> {
    const prompt = `
      Analyze this allocation report:

      ${JSON.stringify(allocationData, null, 2)}

      Provide:
      1. Key findings (3-5 bullet points)
      2. Efficiency metrics
      3. Partner performance comparison
      4. Recommendations
      5. Risk assessment

      Format as markdown.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Predict future allocation
   */
  async predictAllocation(historicalData: any[]): Promise<any> {
    const prompt = `
      Based on this historical production data, predict next month's allocation:

      ${JSON.stringify(historicalData, null, 2)}

      Provide:
      1. Predicted volumes per partner
      2. Confidence score (0-100%)
      3. Key assumptions
      4. Risk factors

      Return as JSON.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return this.parseJSON(response.text());
  }

  private parseJSON(text: string): any {
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parse failed:', error);
      return { error: 'Parse failed', raw: text };
    }
  }
}

export const geminiService = new GeminiService();