import manifest from '@/data/circuit-shapes.json';

export interface CircuitShape {
  /** Circuit name, for the accessible label. */
  name: string;
  /** Normalised path data for the track outline. */
  d: string;
  viewBox: string;
  width: number;
  height: number;
  start: [number, number] | null;
  /** Real circuit length in km, used to scale the outline to true metres. */
  lengthKm: number | null;
  /** Attribution for the traced source vector. */
  file: string;
  artist: string;
  licence: string;
  licenceUrl: string;
  source: string;
  commands: number;
}

const shapes = (manifest as { shapes: Record<string, CircuitShape> }).shapes;

/** Real circuit outline for a results-API circuitId, if one was traced. */
export const shapeFor = (circuitId: string): CircuitShape | undefined => shapes[circuitId];

export const allShapes: (CircuitShape & { id: string })[] =
  Object.entries(shapes).map(([id, v]) => ({ id, ...v }));

/**
 * Grand Prix names as used by the Data Lab controls, mapped onto circuit ids so
 * the lab can show the right outline for the selected event.
 */
const GP_TO_CIRCUIT: Record<string, string> = {
  Bahrain: 'bahrain', 'Saudi Arabia': 'jeddah', Australia: 'albert_park',
  Japan: 'suzuka', China: 'shanghai', Miami: 'miami', 'Emilia Romagna': 'imola',
  Monaco: 'monaco', Canada: 'villeneuve', Spain: 'catalunya', Austria: 'red_bull_ring',
  'Great Britain': 'silverstone', Britain: 'silverstone', Hungary: 'hungaroring',
  Belgium: 'spa', Netherlands: 'zandvoort', Italy: 'monza', Azerbaijan: 'baku',
  Singapore: 'marina_bay', 'United States': 'americas', Mexico: 'rodriguez',
  Brazil: 'interlagos', 'Las Vegas': 'vegas', Qatar: 'losail', 'Abu Dhabi': 'yas_marina',
  Turkey: 'istanbul', Portugal: 'portimao', France: 'ricard', Germany: 'hockenheimring',
  Russia: 'sochi', Malaysia: 'sepang', Korea: 'yeongam', India: 'buddh',
};

export const shapeForGrandPrix = (gp: string): CircuitShape | undefined => {
  const id = GP_TO_CIRCUIT[gp];
  return id ? shapes[id] : undefined;
};
