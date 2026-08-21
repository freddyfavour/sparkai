import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userPrompt, metrics, assessment, room, preferredLanguage, conversationHistory } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    const promptContext = `
You are SPARK, an AI-powered environmental intelligence system protecting a home.
Tagline: "Sensors detect conditions. Spark understands them."

CURRENT REAL-TIME ENVIRONMENTAL CONTEXT:
- Active Room: ${room || 'Kitchen'}
- Sensor Connection: ${metrics?.isHardwareConnected ? 'ESP32 Hardware Online' : 'Hardware Disconnected / Stale Data'}
- Temperature: ${metrics?.temperature !== null ? `${metrics?.temperature}°C` : 'Unavailable'} (Trend: ${metrics?.tempRateOfChange > 0 ? '+' : ''}${metrics?.tempRateOfChange || 0}°C/5min)
- Humidity: ${metrics?.humidity !== null ? `${metrics?.humidity}%` : 'Unavailable'} (Trend: ${metrics?.humidityRateOfChange > 0 ? '+' : ''}${metrics?.humidityRateOfChange || 0}%/5min)
- Gas Level: ${metrics?.gas !== null ? `${metrics?.gas} PPM` : 'Unavailable'} (Trend: ${metrics?.gasRateOfChange > 0 ? '+' : ''}${metrics?.gasRateOfChange || 0} PPM/5min)
- Hazard Status: ${assessment?.hazardTitle || 'Environment Safe'}
- Risk Severity Level: ${assessment?.riskLevel || 'SAFE'}
- Anomaly Score: ${assessment?.anomalyScore ? (assessment.anomalyScore * 100).toFixed(0) + '%' : '5%'}

GUIDELINES FOR YOUR RESPONSE:
1. ALWAYS BE HONEST: Maintain a clear distinction between:
   - MEASURED: What physical ESP32 sensors actually recorded.
   - DETECTED: What the anomaly engine flagged.
   - INFERRED: What the data pattern may mean (e.g. possible gas leak, possible moisture buildup). NEVER claim absolute certainty when evidence is indirect.
   - RECOMMENDED: Practical safety steps the user should consider taking.
2. PREDICTIVE INSIGHTS & EARLY WARNINGS:
   - Actively analyze trends and rates of change!
   - If humidity is rising (e.g. >= 65% with a positive rate of change) towards the 75%-85% dampness/mold threshold, WARN THE USER BEFORE IT REACHES THE THRESHOLD.
   - Give proactive advice on what will happen in 10-15 minutes if unchecked and how to prevent it early (e.g., "Open windows or turn on exhaust fan now to prevent mold formation before humidity hits 75%").
3. CONVERSATIONAL & EMPATHETIC: Speak naturally like a calm, intelligent home safety assistant. Keep answers concise, informative, and focused on safety and environmental health.
4. MULTILINGUAL & REGIONAL INTENT: If the user asks in Nigerian Pidgin (e.g. "wetin dey happen", "is everything okay for house"), respond warmly in conversational Nigerian Pidgin or English as appropriate while remaining precise about sensor values.
5. USER QUESTION: "${userPrompt || 'What is the current environmental state of my home?'}"
`;

    // Attempt calling Google Gemini API endpoint
    let geminiReply = '';

    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: promptContext }],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const textCandidate = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textCandidate) {
            geminiReply = textCandidate.trim();
          }
        }
      } catch (e) {
        console.warn('Gemini API fetch error, falling back to local reasoning:', e);
      }
    }

    // Fallback response if Gemini endpoint was unreachable
    if (!geminiReply) {
      geminiReply = `**Spark Environmental Assessment**:\n\n• **Measured**: Temperature is ${metrics?.temperature ?? '--'}°C, Humidity is ${metrics?.humidity ?? '--'}%, Gas level is ${metrics?.gas ?? '--'} PPM in the ${room || 'Kitchen'}.\n• **Detected**: ${assessment?.detectedText || 'Readings are within nominal operational range.'}\n• **Inferred**: ${assessment?.inferredText || 'No atmospheric hazards detected.'}\n• **Recommended**: ${assessment?.recommendedText || 'Continue standard home monitoring.'}`;
    }

    // Return structured response with attached Room Evidence Card
    return NextResponse.json({
      success: true,
      replyText: geminiReply,
      evidenceCard: {
        room: room || 'Kitchen',
        riskLevel: assessment?.riskLevel || 'SAFE',
        hazardType: assessment?.hazardType || 'NONE',
        tempValue: `${metrics?.temperature ?? '--'}°C`,
        tempDiff: `${metrics?.tempRateOfChange > 0 ? '+' : ''}${metrics?.tempRateOfChange || 0}°C/5m`,
        gasValue: `${metrics?.gas ?? '--'} PPM`,
        gasDiff: `${metrics?.gasRateOfChange > 0 ? '+' : ''}${metrics?.gasRateOfChange || 0} PPM/5m`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });
  } catch (error: any) {
    console.error('Gemini Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to process AI reasoning request',
      },
      { status: 500 }
    );
  }
}
