export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jztnruyvcxjhzkckqpfg.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6Imp6dG5ydXl2Y3hqaHprY2txcGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTU5MzAsImV4cCI6MjEwMjg5MTkzMH0.JZ13cIwlGJflSFTXA9ztQo4BMq1Bd_K1NrFlK10ocXs';

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
