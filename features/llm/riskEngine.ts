import { RiskInput, RiskResult, RiskLevel, RiskAction } from './llm.types';

export type { RiskInput, RiskResult } from './llm.types';

const WATSONX_VERSION = '2023-05-29';
const DEFAULT_WATSONX_MODEL_ID = 'ibm/granite-13b-chat-v2';
const MEDIUM_RISK_KEYWORDS = ['diabetic', 'diabetes', 'asthma', 'cardiac'];

/**
 * Assesses health and disaster risk based on input parameters.
 * Uses Watsonx AI if configured, falling back to rule-based logic.
 */
export async function assessRisk(input: RiskInput): Promise<RiskResult> {
  if (process.env.WATSONX_API_KEY) {
    return assessRiskWithWatsonx(input);
  }

  return assessRiskRuleBased(input);
}

/**
 * Rule-based risk assessment logic (fallback).
 */
function assessRiskRuleBased(input: RiskInput): RiskResult {
  const { healthCondition, temperature, heartRate } = input;

  let risk: RiskLevel = 'low';
  let action: RiskAction = 'none';
  let reason = '';

  if (temperature > 40) {
    risk = 'high';
    action = 'rescue';
    reason = `Critical temperature detected (${temperature}°C). Immediate medical attention required.`;
  } else if (heartRate !== undefined && heartRate > 130) {
    risk = 'high';
    action = 'rescue';
    reason = `Critical heart rate detected (${heartRate} bpm). Immediate medical attention required.`;
  } else if (temperature > 37.5) {
    risk = 'medium';
    action = 'medical_kit';
    reason = `Elevated temperature (${temperature}°C). Monitor closely and use a medical kit if symptoms worsen.`;
  } else if (hasMediumRiskCondition(healthCondition)) {
    risk = 'medium';
    action = 'medical_kit';
    reason = `Health condition "${healthCondition}" increases risk. Keep a medical kit accessible.`;
  } else {
    risk = 'low';
    action = 'none';
    reason = 'Vital signs are within normal range. Continue routine monitoring.';
  }

  return { risk, action, reason };
}

/**
 * Check if health condition contains medium-risk keywords.
 */
function hasMediumRiskCondition(condition: string): boolean {
  const lowerCondition = condition.toLowerCase();
  return MEDIUM_RISK_KEYWORDS.some((keyword) => lowerCondition.includes(keyword));
}

/**
 * Call Watsonx AI for advanced risk assessment.
 * Falls back to rule-based logic on error.
 */
export async function assessRiskWithWatsonx(input: RiskInput): Promise<RiskResult> {
  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;
  const url = process.env.WATSONX_URL;
  const modelId = process.env.WATSONX_MODEL_ID || DEFAULT_WATSONX_MODEL_ID;

  if (!apiKey || !projectId || !url) {
    return assessRiskRuleBased(input);
  }

  try {
    const accessToken = await fetchWatsonxToken(apiKey);
    if (!accessToken) {
      return assessRiskRuleBased(input);
    }

    const prompt = [
      'You are a health risk classifier.',
      'Return JSON only with keys: risk (low|medium|high), action (none|medical_kit|rescue), reason (short).',
      `Input: ${JSON.stringify(input)}`,
    ].join('\n');

    const response = await fetch(`${url}/ml/v1/text/generation?version=${WATSONX_VERSION}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: modelId,
        project_id: projectId,
        input: prompt,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 128,
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Watsonx API error:', response.status, errorText);
      return assessRiskRuleBased(input);
    }

    const payload = (await response.json()) as {
      results?: Array<{ generated_text?: string }>;
    };

    const generated = payload.results?.[0]?.generated_text || '';
    const parsed = parseWatsonxResult(generated);
    if (!parsed) {
      return assessRiskRuleBased(input);
    }

    return parsed;
  } catch (error) {
    console.error('Watsonx API error, falling back to rule-based logic:', error);
    return assessRiskRuleBased(input);
  }
}

async function fetchWatsonxToken(apiKey: string): Promise<string | null> {
  const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(apiKey)}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Failed to fetch Watsonx token:', tokenResponse.status, errorText);
    return null;
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  return tokenData.access_token ?? null;
}

function parseWatsonxResult(text: string): RiskResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<RiskResult>;
    if (
      !parsed ||
      (parsed.risk !== 'low' && parsed.risk !== 'medium' && parsed.risk !== 'high') ||
      (parsed.action !== 'none' && parsed.action !== 'medical_kit' && parsed.action !== 'rescue') ||
      typeof parsed.reason !== 'string'
    ) {
      return null;
    }

    return {
      risk: parsed.risk,
      action: parsed.action,
      reason: parsed.reason.trim(),
    };
  } catch (error) {
    console.error('Failed to parse Watsonx response:', error);
    return null;
  }
}

// Made with Bob
