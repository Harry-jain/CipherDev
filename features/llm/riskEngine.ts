import { RiskInput, RiskResult, RiskLevel, RiskAction } from './llm.types';

/**
 * Assesses health and disaster risk based on input parameters
 * Uses rule-based logic with optional Watsonx AI integration
 */
export async function assessRisk(input: RiskInput): Promise<RiskResult> {
  const { age, location, healthCondition, temperature, humidity, heartRate } = input;

  // Rule-based risk assessment logic
  let risk: RiskLevel = 'low';
  let action: RiskAction = 'none';
  let reason = '';

  // Critical conditions - HIGH RISK
  if (temperature > 40) {
    risk = 'high';
    action = 'rescue';
    reason = `Critical: Body temperature ${temperature}°C is dangerously high. Immediate medical attention required.`;
  } else if (heartRate && heartRate > 130) {
    risk = 'high';
    action = 'rescue';
    reason = `Critical: Heart rate ${heartRate} bpm is dangerously elevated. Immediate medical attention required.`;
  }
  // Moderate conditions - MEDIUM RISK
  else if (temperature > 37.5 && temperature <= 40) {
    risk = 'medium';
    action = 'medical_kit';
    reason = `Elevated temperature ${temperature}°C detected. Monitor closely and use medical kit if symptoms worsen.`;
  } else if (hasHighRiskCondition(healthCondition)) {
    risk = 'medium';
    action = 'medical_kit';
    reason = `Pre-existing condition "${healthCondition}" requires monitoring. Keep medical kit accessible.`;
  } else if (age > 65 || age < 5) {
    risk = 'medium';
    action = 'medical_kit';
    reason = `Age ${age} is in vulnerable category. Extra precautions recommended.`;
  } else if (heartRate && (heartRate > 100 || heartRate < 50)) {
    risk = 'medium';
    action = 'medical_kit';
    reason = `Heart rate ${heartRate} bpm is outside normal range. Monitor and have medical kit ready.`;
  }
  // Low risk - NORMAL
  else {
    risk = 'low';
    action = 'none';
    reason = `All vital signs within normal range. Temperature: ${temperature}°C${heartRate ? `, Heart rate: ${heartRate} bpm` : ''}. Continue monitoring.`;
  }

  return {
    risk,
    action,
    reason,
  };
}

/**
 * Check if health condition contains high-risk keywords
 */
function hasHighRiskCondition(condition: string): boolean {
  const lowerCondition = condition.toLowerCase();
  const highRiskKeywords = [
    'diabetic',
    'diabetes',
    'asthma',
    'cardiac',
    'heart',
    'hypertension',
    'copd',
    'respiratory',
    'immunocompromised',
    'cancer',
    'kidney',
    'liver',
    'stroke',
    'epilepsy',
  ];

  return highRiskKeywords.some((keyword) => lowerCondition.includes(keyword));
}

/**
 * Optional: Call Watsonx AI for advanced risk assessment
 * Falls back to rule-based logic if API is unavailable
 */
export async function assessRiskWithWatsonx(input: RiskInput): Promise<RiskResult> {
  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;
  const url = process.env.WATSONX_URL;

  // If Watsonx credentials not available, use rule-based logic
  if (!apiKey || !projectId || !url) {
    return assessRisk(input);
  }

  try {
    // Watsonx API call would go here
    // For now, fall back to rule-based logic
    console.log('Watsonx integration not fully implemented, using rule-based logic');
    return assessRisk(input);
  } catch (error) {
    console.error('Watsonx API error, falling back to rule-based logic:', error);
    return assessRisk(input);
  }
}

// Made with Bob
