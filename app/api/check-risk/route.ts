import { NextRequest, NextResponse } from 'next/server';
import { assessRisk } from '@/features/llm/riskEngine';
import type { RiskInput } from '@/features/llm/llm.types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { age, location, healthCondition, temperature } = body;

    if (
      age === undefined ||
      age === null ||
      temperature === undefined ||
      temperature === null ||
      typeof location !== 'string' ||
      location.trim().length === 0 ||
      typeof healthCondition !== 'string' ||
      healthCondition.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: age, location, healthCondition, temperature' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof age !== 'number' || Number.isNaN(age) || age < 0 || age > 150) {
      return NextResponse.json(
        { error: 'Invalid age. Must be a number between 0 and 150' },
        { status: 400 }
      );
    }

    if (typeof temperature !== 'number' || Number.isNaN(temperature) || temperature < 20 || temperature > 50) {
      return NextResponse.json(
        { error: 'Invalid temperature. Must be a number between 20 and 50 Celsius' },
        { status: 400 }
      );
    }

    // Prepare risk input
    const riskInput: RiskInput = {
      age,
      location,
      healthCondition,
      temperature,
      humidity: body.humidity,
      heartRate: body.heartRate,
    };

    // Assess risk
    const result = await assessRisk(riskInput);

    // Return result
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Risk assessment error:', error);
    return NextResponse.json(
      { error: 'Internal server error during risk assessment' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

// Made with Bob
