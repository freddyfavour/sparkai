import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const overrideToken = searchParams.get('token');
    const tempPin = (searchParams.get('tempPin') || 'v0').toLowerCase();
    const humPin = (searchParams.get('humPin') || 'v1').toLowerCase();
    const gasPin = (searchParams.get('gasPin') || 'v2').toLowerCase();
    
    // Use override token from settings or default to environment variable
    const token = overrideToken || process.env.BLYNK_AUTH_TOKEN;
    const blynkServer = process.env.BLYNK_SERVER_URL || 'https://blynk.cloud';

    if (!token) {
      return NextResponse.json(
        { error: 'Blynk authentication token is missing.', isHardwareConnected: false },
        { status: 400 }
      );
    }

    // Fetch getAll values and isHardwareConnected in parallel with no-store cache headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [getAllRes, isConnectedRes] = await Promise.allSettled([
      fetch(`${blynkServer}/external/api/getAll?token=${token}&_t=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      }),
      fetch(`${blynkServer}/external/api/isHardwareConnected?token=${token}&_t=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      }),
    ]);

    clearTimeout(timeoutId);

    let getAllData: Record<string, any> = {};
    let isHardwareConnected = false;

    if (getAllRes.status === 'fulfilled' && getAllRes.value.ok) {
      try {
        const text = await getAllRes.value.text();
        const parsed = JSON.parse(text);
        // Normalize keys to lowercase (v0, v1, v2)
        Object.keys(parsed).forEach((k) => {
          getAllData[k.toLowerCase()] = parsed[k];
        });
      } catch (err) {
        console.warn('Failed to parse Blynk getAll JSON:', err);
      }
    }

    // Authoritative hardware connection check directly from Blynk Cloud
    if (isConnectedRes.status === 'fulfilled' && isConnectedRes.value.ok) {
      try {
        const connText = await isConnectedRes.value.text();
        isHardwareConnected = connText.trim() === 'true';
      } catch (err) {
        console.warn('Failed to parse Blynk isHardwareConnected response:', err);
      }
    }

    const tempVal = getAllData[tempPin] !== undefined ? Number(getAllData[tempPin]) : getAllData.v0 !== undefined ? Number(getAllData.v0) : undefined;
    const humVal = getAllData[humPin] !== undefined ? Number(getAllData[humPin]) : getAllData.v1 !== undefined ? Number(getAllData.v1) : undefined;
    const gasVal = getAllData[gasPin] !== undefined ? Number(getAllData[gasPin]) : getAllData.v2 !== undefined ? Number(getAllData.v2) : undefined;

    return NextResponse.json(
      {
        success: true,
        data: {
          v0: tempVal,
          v1: humVal,
          v2: gasVal,
          v3: getAllData.v3 !== undefined ? Number(getAllData.v3) : undefined,
          v4: getAllData.v4 !== undefined ? Number(getAllData.v4) : undefined,
          isHardwareConnected, // 100% accurate real hardware connection status from Blynk!
          timestamp: new Date().toISOString(),
          rawBlynkResponse: getAllData,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Blynk API Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to communicate with Blynk IoT cloud API',
        isHardwareConnected: false,
      },
      { status: 500 }
    );
  }
}
