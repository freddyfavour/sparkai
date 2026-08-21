export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jztnruyvcxjhzkckqpfg.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6Imp6dG5ydXl2Y3hqaHprY2txcGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTU5MzAsImV4cCI6MjEwMjg5MTkzMH0.JZ13cIwlGJflSFTXA9ztQo4BMq1Bd_K1NrFlK10ocXs';

export interface TelemetryPoint {
  time: string;
  temp: number;
  gas: number;
  humidity: number;
  anomaly?: boolean;
}

export async function logHazardEventToSupabase(eventData: {
  home_id?: string;
  room_name: string;
  hazard_type: string;
  severity: string;
  measured_text: string;
  recommendation: string;
}) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/hazard_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        room_name: eventData.room_name,
        hazard_type: eventData.hazard_type,
        severity: eventData.severity,
        explanation: eventData.measured_text,
        recommendation: eventData.recommendation,
        created_at: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      console.log('Hazard event logged to Supabase successfully.');
    } else {
      console.warn('Supabase log hazard table status:', res.status);
    }
  } catch (err) {
    console.warn('Supabase log hazard error:', err);
  }
}

// Persist real hardware telemetry to LocalStorage & Supabase
export function saveTelemetrySnapshot(point: TelemetryPoint) {
  if (typeof window === 'undefined') return;

  try {
    const existing = localStorage.getItem('spark_sensor_telemetry_history');
    let history: TelemetryPoint[] = existing ? JSON.parse(existing) : [];

    // Avoid duplicate timestamp entries
    if (history.length > 0 && history[history.length - 1].time === point.time) {
      return history;
    }

    history.push(point);
    if (history.length > 30) history = history.slice(-30); // Keep last 30 real hardware points

    localStorage.setItem('spark_sensor_telemetry_history', JSON.stringify(history));

    // Async push to Supabase REST table if available
    fetch(`${SUPABASE_URL}/rest/v1/sensor_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        temperature: point.temp,
        gas: point.gas,
        humidity: point.humidity,
        logged_at: new Date().toISOString(),
      }),
    }).catch(() => {});

    return history;
  } catch (err) {
    console.warn('LocalStorage save error:', err);
    return [];
  }
}

export function getSavedTelemetryHistory(): TelemetryPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = localStorage.getItem('spark_sensor_telemetry_history');
    return existing ? JSON.parse(existing) : [];
  } catch (err) {
    return [];
  }
}
