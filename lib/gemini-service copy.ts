/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  private flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  /**
   * Answer natural language questions about production data
   */
  async naturalLanguageQuery(query: string, context: any): Promise<string> {
    try {
      const prompt = `
You are an AI assistant helping with hydrocarbon production data analysis.

User Question: "${query}"

Production Data Context:
${JSON.stringify(context, null, 2)}

Provide a clear, concise answer that:
1. Directly answers the question
2. Includes specific numbers and data points
3. Highlights any notable trends or patterns
4. Uses industry terminology (BBL, BSW%, API gravity, etc.)

Keep your response under 200 words and be specific.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini query error:', error);
      return 'Sorry, I encountered an error processing your query. Please try again.';
    }
  }

  /**
   * Detect anomalies in production entries
   */
  async detectAnomalies(entries: any[]): Promise<any[]> {
    try {
      if (entries.length === 0) {
        return [];
      }

      const prompt = `
You are analyzing hydrocarbon production data for anomalies.

Production Entries (Last ${entries.length} entries):
${JSON.stringify(entries.slice(0, 20), null, 2)}

Industry Standards:
- BSW% (Basic Sediment & Water): Expected range 0-10%, typical 1-5%
- Temperature: Expected range 60-150°F, typical 80-120°F
- API Gravity: Expected range 15-45°, typical 25-35°
- Volume: Should be consistent day-to-day (±20% variation is normal)

Analyze and identify:
1. Volume outliers (>30% deviation from average)
2. BSW% anomalies (>10% or sudden changes)
3. Temperature anomalies (outside 60-150°F)
4. API gravity inconsistencies
5. Suspicious patterns (duplicates, rounded numbers)

For EACH anomaly found, return JSON array with:
{
  "entry_id": "string",
  "partner": "string",
  "type": "volume_spike|bsw_anomaly|temperature_anomaly|api_gravity_outlier",
  "severity": "low|medium|high",
  "value": number,
  "expected_range": "string",
  "explanation": "Clear explanation of why this is anomalous",
  "action": "Recommended action to take"
}

Return ONLY the JSON array, no other text.
`;

      const result = await this.flashModel.generateContent(prompt);
      const response = await result.response;
      return this.parseJSON(response.text());
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  /**
   * Generate strategic insights from allocation data
   */
  async generateInsights(allocationData: any): Promise<string> {
    try {
      const prompt = `
You are a strategic analyst for hydrocarbon joint venture operations.

Allocation Report Data:
${JSON.stringify(allocationData, null, 2)}

Analyze this data and provide:

## Key Findings
- 3-5 bullet points of the most important insights

## Performance Metrics
- Overall allocation efficiency
- Data quality assessment
- Shrinkage analysis

## Partner Analysis
- Relative performance comparison
- Notable trends or patterns
- Any concerns

## Recommendations
- 3-5 actionable recommendations for optimization

## Risk Assessment
- Potential allocation disputes
- Data integrity concerns
- Operational risks

Format your response in clean Markdown with clear headers and bullet points.
Keep it professional and actionable.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Insights generation error:', error);
      return 'Unable to generate insights at this time. Please try again later.';
    }
  }

  /**
   * Predict future allocation based on historical data
   */
  async predictAllocation(historicalData: any[]): Promise<any> {
    try {
      if (historicalData.length === 0) {
        return {
          predictions: [],
          confidence: 0,
          message: 'Insufficient data for predictions'
        };
      }

      const prompt = `
You are predicting hydrocarbon allocation for the next period.

Historical Production Data (Last ${historicalData.length} entries):
${JSON.stringify(historicalData.slice(0, 30), null, 2)}

Based on this historical data:
1. Calculate trends for each partner
2. Predict next month's production volumes
3. Provide confidence scores
4. Identify key assumptions
5. Flag potential risks

Return JSON format:
{
  "predictions": [
    {
      "partner": "string",
      "predicted_volume": number,
      "confidence": number (0-100),
      "trend": "increasing|stable|decreasing"
    }
  ],
  "total_predicted_volume": number,
  "confidence_score": number (0-100),
  "key_assumptions": ["string"],
  "risk_factors": ["string"],
  "methodology": "Brief explanation of prediction method"
}

Return ONLY valid JSON, no markdown formatting.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseJSON(response.text());
    } catch (error) {
      console.error('Prediction error:', error);
      return {
        predictions: [],
        confidence: 0,
        message: 'Unable to generate predictions'
      };
    }
  }

  /**
   * Explain allocation calculation in simple terms
   */
  async explainAllocation(allocationResult: any): Promise<string> {
    try {
      const prompt = `
Explain this hydrocarbon allocation calculation in simple, non-technical terms.

Allocation Result:
${JSON.stringify(allocationResult, null, 2)}

Provide:
1. What happened (in plain English)
2. Why each partner received their share
3. How the calculation was performed
4. What the shrinkage factor means
5. Whether the allocation is fair and why

Keep the explanation simple enough for a business stakeholder to understand.
Use analogies if helpful.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Explanation error:', error);
      return 'Unable to explain allocation at this time.';
    }
  }

  /**
   * Parse JSON from Gemini response (handles markdown code blocks)
   */
  private parseJSON(text: string): any {
    try {
      // First try direct parse
      return JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.error('Failed to parse JSON from markdown:', e);
        }
      }

      // Try finding JSON object or array without code blocks
      const jsonObjMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonObjMatch) {
        try {
          return JSON.parse(jsonObjMatch[0]);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
        }
      }

      // Return empty structure based on expected format
      console.warn('Could not parse JSON, returning empty structure');
      return [];
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
