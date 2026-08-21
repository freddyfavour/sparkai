export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RawSensorData {
  v0?: number; // Temperature (°C)
  v1?: number; // Humidity (%)
  v2?: number; // Gas (PPM)
  v3?: number; // Air Quality (AQI) - optional
  v4?: number; // Smoke - optional
  timestamp?: string;
  isHardwareConnected?: boolean;
}

export interface SensorMetrics {
  temperature: number | null; // °C
  humidity: number | null; // %
  gas: number | null; // PPM
  airQuality: number | null; // AQI
  smoke: number | null; // PPM
  tempRateOfChange: number; // °C per 5 mins
  gasRateOfChange: number; // PPM per 5 mins
  humidityRateOfChange: number; // % per 5 mins
  lastUpdated: string;
  isHardwareConnected: boolean;
}

export interface RoomState {
  id: string;
  name: string;
  type: 'kitchen' | 'living' | 'bedroom' | 'garage';
  hasHardwareSensor: boolean;
  temperature: number | null;
  humidity: number | null;
  gas: number | null;
  airQuality: number | null;
  smoke: number | null;
  riskLevel: RiskLevel;
  activeHazard: string | null;
  lastReadingTime: string;
}

export interface HazardAssessment {
  hazardDetected: boolean;
  hazardType: string; // 'FIRE_RISK' | 'GAS_LEAK' | 'POOR_AIR_QUALITY' | 'MOLD_RISK' | 'HIGH_HUMIDITY' | 'PREDICTIVE_HUMIDITY_SPIKE' | 'HEAT_EXHAUSTION' | 'NONE'
  hazardTitle: string;
  riskLevel: RiskLevel;
  anomalyScore: number; // 0.0 to 1.0
  primaryRoomId: string;
  primaryRoomName: string;
  measuredText: string;
  detectedText: string;
  inferredText: string;
  recommendedText: string;
  evidence: {
    label: string;
    value: string;
    baseline: string;
    trend: string;
    isAbnormal: boolean;
  }[];
}

// In-memory historical buffer for rate-of-change computation
const historyBuffer: { timestamp: number; data: SensorMetrics }[] = [];

export function processSensorData(
  rawData: RawSensorData,
  customToken?: string
): {
  metrics: SensorMetrics;
  assessment: HazardAssessment;
  rooms: RoomState[];
} {
  const now = new Date();
  const timestampStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Extract raw hardware pin values
  const rawTemp = typeof rawData.v0 === 'number' && !isNaN(rawData.v0) ? Number(rawData.v0.toFixed(1)) : null;
  const rawHum = typeof rawData.v1 === 'number' && !isNaN(rawData.v1) ? Number(rawData.v1.toFixed(1)) : null;
  const rawGas = typeof rawData.v2 === 'number' && !isNaN(rawData.v2) ? Math.round(rawData.v2) : null;
  const rawAQI = typeof rawData.v3 === 'number' && !isNaN(rawData.v3) ? Math.round(rawData.v3) : null;
  const rawSmoke = typeof rawData.v4 === 'number' && !isNaN(rawData.v4) ? Math.round(rawData.v4) : null;

  const isConnected = rawData.isHardwareConnected ?? true;

  // Calculate rate of change against buffer from 1 to 5 minutes ago
  let tempRate = 0;
  let gasRate = 0;
  let humRate = 0;

  if (historyBuffer.length > 0) {
    const prev = historyBuffer[0].data;
    if (rawTemp !== null && prev.temperature !== null) {
      tempRate = Number((rawTemp - prev.temperature).toFixed(1));
    }
    if (rawGas !== null && prev.gas !== null) {
      gasRate = rawGas - prev.gas;
    }
    if (rawHum !== null && prev.humidity !== null) {
      humRate = Number((rawHum - prev.humidity).toFixed(1));
    }
  }

  const metrics: SensorMetrics = {
    temperature: rawTemp,
    humidity: rawHum,
    gas: rawGas,
    airQuality: rawAQI,
    smoke: rawSmoke,
    tempRateOfChange: tempRate,
    gasRateOfChange: gasRate,
    humidityRateOfChange: humRate,
    lastUpdated: timestampStr,
    isHardwareConnected: isConnected,
  };

  // Push to rolling history buffer (keep last 30 readings ~ 5 mins if polled every 10s)
  historyBuffer.push({ timestamp: Date.now(), data: metrics });
  if (historyBuffer.length > 30) {
    historyBuffer.shift();
  }

  // --- SENSOR FUSION, PREDICTIVE ALERTS & HAZARD REASONING ---
  // Baselines for ESP32 sensor hardware:
  // Temp normal: 20°C - 38°C
  // Humidity normal: 30% - 74% (High humidity starts at 75%, Mold Risk >= 85%)
  // Gas normal baseline: 0 - 400 PPM (High gas starts at 400 PPM)

  let hazardType = 'NONE';
  let hazardTitle = 'Environment Safe';
  let riskLevel: RiskLevel = 'SAFE';
  let anomalyScore = 0.05;

  const temp = rawTemp ?? 25;
  const gas = rawGas ?? 140;
  const humidity = rawHum ?? 50;

  // Rule 1: Combustion / Fire Risk (High Temp OR rapid temp spike + Gas >= 500)
  if ((temp >= 45 || tempRate >= 4.0) && (gas >= 500 || (rawSmoke ?? 0) >= 50)) {
    hazardType = 'FIRE_RISK';
    hazardTitle = 'Possible Fire Hazard Detected';
    riskLevel = 'CRITICAL';
    anomalyScore = 0.95;
  } else if (temp >= 40 && gas >= 450) {
    hazardType = 'FIRE_RISK';
    hazardTitle = 'Elevated Thermal & Gas Activity';
    riskLevel = 'HIGH';
    anomalyScore = 0.78;
  } 
  // Rule 2: Gas Leak Risk (High gas starts from 400 PPM)
  else if (gas >= 800 && temp < 40) {
    hazardType = 'GAS_LEAK';
    hazardTitle = 'Critical Gas Concentration Detected';
    riskLevel = 'CRITICAL';
    anomalyScore = 0.91;
  } else if (gas >= 600 || gasRate >= 80) {
    hazardType = 'GAS_LEAK';
    hazardTitle = 'Unusual Gas Concentration Spike';
    riskLevel = 'HIGH';
    anomalyScore = 0.72;
  } else if (gas >= 400) {
    hazardType = 'GAS_LEAK';
    hazardTitle = 'Elevated Gas Concentration';
    riskLevel = 'MEDIUM';
    anomalyScore = 0.48;
  }
  // Rule 3: Humidity / Mold Risks (Critical >= 85%, High >= 75%, Predictive >= 65% with +3%/5m trend)
  else if (humidity >= 85) {
    hazardType = 'MOLD_RISK';
    hazardTitle = 'Critical Humidity & Mold Hazard';
    riskLevel = 'HIGH';
    anomalyScore = 0.75;
  } else if (humidity >= 75) {
    hazardType = 'HIGH_HUMIDITY';
    hazardTitle = 'High Indoor Humidity Warning';
    riskLevel = 'MEDIUM';
    anomalyScore = 0.55;
  } else if (humidity >= 65 && humRate >= 2.5) {
    hazardType = 'PREDICTIVE_HUMIDITY_SPIKE';
    hazardTitle = 'Early Predictive Moisture Warning';
    riskLevel = 'LOW';
    anomalyScore = 0.38;
  }
  // Rule 4: Heat & Air Quality Risks
  else if (temp >= 40) {
    hazardType = 'HEAT_EXHAUSTION';
    hazardTitle = 'Unusually High Indoor Temperature';
    riskLevel = 'MEDIUM';
    anomalyScore = 0.45;
  } else if ((rawAQI !== null && rawAQI > 120)) {
    hazardType = 'POOR_AIR_QUALITY';
    hazardTitle = 'Moderate Air Quality Degradation';
    riskLevel = 'LOW';
    anomalyScore = 0.30;
  }
  // Rule 5: Predictive Early Warning for Gas or Temperature
  else if (gas >= 300 && gasRate >= 30) {
    hazardType = 'GAS_LEAK';
    hazardTitle = 'Early Predictive Gas Rise Detected';
    riskLevel = 'LOW';
    anomalyScore = 0.35;
  } else if (temp >= 35 && tempRate >= 2.0) {
    hazardType = 'HEAT_EXHAUSTION';
    hazardTitle = 'Early Predictive Temperature Rise';
    riskLevel = 'LOW';
    anomalyScore = 0.32;
  }

  // Build Structured Evidence
  const evidence = [
    {
      label: 'Temperature',
      value: rawTemp !== null ? `${rawTemp}°C` : 'Unavailable',
      baseline: '20.0°C – 38.0°C',
      trend: tempRate !== 0 ? `${tempRate > 0 ? '+' : ''}${tempRate}°C/5min` : 'Stable',
      isAbnormal: temp > 40 || tempRate > 3.0,
    },
    {
      label: 'Gas Level',
      value: rawGas !== null ? `${rawGas} PPM` : 'Unavailable',
      baseline: '0 – 400 PPM (Normal)',
      trend: gasRate !== 0 ? `${gasRate > 0 ? '+' : ''}${gasRate} PPM/5min` : 'Stable',
      isAbnormal: gas >= 400 || gasRate > 60,
    },
    {
      label: 'Relative Humidity',
      value: rawHum !== null ? `${rawHum}%` : 'Unavailable',
      baseline: '30% – 74%',
      trend: humRate !== 0 ? `${humRate > 0 ? '+' : ''}${humRate}%/5min` : 'Stable',
      isAbnormal: humidity >= 75 || humidity < 20 || humRate >= 3.0,
    },
  ];

  // Distinguish Measured vs Detected vs Inferred vs Recommended
  const measuredText = `ESP32 hardware detected temperature at ${rawTemp ?? '--'}°C, humidity at ${rawHum ?? '--'}%, and gas concentration at ${rawGas ?? '--'} PPM.`;

  let detectedText = 'All environmental parameters are currently within expected baseline limits for your home.';
  let inferredText = 'No active environmental threats or atmospheric anomalies are indicated.';
  let recommendedText = 'Continue standard home monitoring. No action required.';

  if (hazardType === 'FIRE_RISK') {
    detectedText = `Simultaneous rapid temperature rise (${tempRate > 0 ? '+' : ''}${tempRate}°C) and high gas concentration (${rawGas} PPM) detected in Kitchen.`;
    inferredText = 'Pattern matches developing thermal combustion or localized heat source event.';
    recommendedText = 'Immediately check the kitchen if safe to do so. If smoke or fire is visible, evacuate all occupants and contact emergency services.';
  } else if (hazardType === 'GAS_LEAK') {
    detectedText = `Gas concentration (${rawGas} PPM) exceeded or is approaching the 400 PPM baseline by rising ${gasRate > 0 ? '+' : ''}${gasRate} PPM.`;
    inferredText = 'Pattern is consistent with an unlit burner, stove valve leak, or gas line irregularity.';
    recommendedText = 'Ensure stove burners are fully turned off, open windows to ventilate the area, avoid switching electrical lights, and inspect gas connections.';
  } else if (hazardType === 'MOLD_RISK') {
    detectedText = `Critical indoor humidity (${rawHum}%) exceeded the 85% mold danger threshold.`;
    inferredText = 'Sustained severe dampness directly fosters mold spore multiplication and structural moisture accumulation.';
    recommendedText = 'Turn on air conditioning, dehumidifiers, or exhaust fans immediately to bring humidity below 60%.';
  } else if (hazardType === 'HIGH_HUMIDITY') {
    detectedText = `High relative humidity (${rawHum}%) crossed the 75% dampness threshold.`;
    inferredText = 'Indoor air is holding excessive moisture, creating uncomfortable conditions and approaching the 85% mold growth threshold.';
    recommendedText = 'Open windows for cross-ventilation or switch on a dehumidifier/fan before mold spores begin developing.';
  } else if (hazardType === 'PREDICTIVE_HUMIDITY_SPIKE') {
    detectedText = `Early Warning: Humidity is currently at ${rawHum}% and climbing rapidly (+${humRate}%/5min) towards the 75% threshold.`;
    inferredText = 'Moisture trend analysis indicates humidity will breach the 75% dampness line in approximately 10–15 minutes if unchecked.';
    recommendedText = 'Proactive Action: Open windows or turn on exhaust fans now to prevent moisture buildup before it reaches critical levels!';
  } else if (hazardType === 'HEAT_EXHAUSTION') {
    detectedText = `Ambient indoor temperature reached ${rawTemp}°C.`;
    inferredText = 'Elevated room heat can cause physical discomfort for vulnerable occupants.';
    recommendedText = 'Increase ventilation, draw window blinds, or switch on cooling appliances.';
  }

  const assessment: HazardAssessment = {
    hazardDetected: hazardType !== 'NONE',
    hazardType,
    hazardTitle,
    riskLevel,
    anomalyScore,
    primaryRoomId: 'kitchen',
    primaryRoomName: 'Kitchen',
    measuredText,
    detectedText,
    inferredText,
    recommendedText,
    evidence,
  };

  // Build Room Topology
  const rooms: RoomState[] = [
    {
      id: 'kitchen',
      name: 'Kitchen',
      type: 'kitchen',
      hasHardwareSensor: true,
      temperature: rawTemp,
      humidity: rawHum,
      gas: rawGas,
      airQuality: rawAQI,
      smoke: rawSmoke,
      riskLevel: riskLevel,
      activeHazard: hazardType !== 'NONE' ? hazardTitle : null,
      lastReadingTime: timestampStr,
    },
    {
      id: 'living',
      name: 'Living Room',
      type: 'living',
      hasHardwareSensor: false,
      temperature: rawTemp !== null ? Number((rawTemp - 1.2).toFixed(1)) : null,
      humidity: rawHum !== null ? Math.min(100, Math.max(0, rawHum + 2.0)) : null,
      gas: rawGas !== null ? Math.max(0, rawGas - 15) : null,
      airQuality: rawAQI,
      smoke: rawSmoke,
      riskLevel: riskLevel === 'CRITICAL' ? 'HIGH' : riskLevel === 'HIGH' ? 'MEDIUM' : 'SAFE',
      activeHazard: null,
      lastReadingTime: timestampStr,
    },
    {
      id: 'bedroom',
      name: 'Master Bedroom',
      type: 'bedroom',
      hasHardwareSensor: false,
      temperature: rawTemp !== null ? Number((rawTemp - 2.0).toFixed(1)) : null,
      humidity: rawHum !== null ? Math.min(100, Math.max(0, rawHum - 3.0)) : null,
      gas: rawGas !== null ? Math.max(0, rawGas - 30) : null,
      airQuality: rawAQI,
      smoke: rawSmoke,
      riskLevel: 'SAFE',
      activeHazard: null,
      lastReadingTime: timestampStr,
    },
    {
      id: 'garage',
      name: 'Garage / Utility',
      type: 'garage',
      hasHardwareSensor: false,
      temperature: rawTemp !== null ? Number((rawTemp + 1.5).toFixed(1)) : null,
      humidity: rawHum !== null ? Math.min(100, Math.max(0, rawHum + 4.0)) : null,
      gas: rawGas !== null ? Math.max(0, rawGas + 25) : null,
      airQuality: rawAQI,
      smoke: rawSmoke,
      riskLevel: riskLevel === 'CRITICAL' ? 'HIGH' : 'SAFE',
      activeHazard: null,
      lastReadingTime: timestampStr,
    },
  ];

  return { metrics, assessment, rooms };
}
