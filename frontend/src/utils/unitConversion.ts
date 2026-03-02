
export type UnitType = 'length' | 'mass' | 'time' | 'volume' | 'area' | 'energy' | 'speed' | 'current' | 'voltage' | 'power';

interface UnitDefinition {
    type: UnitType;
    factor: number; // Factor to convert TO base unit. e.g. km factor is 1000 (1km = 1000m)
}

const UNIT_MAP: Record<string, UnitDefinition> = {
    // Length (Base: m)
    'm': { type: 'length', factor: 1 },
    'km': { type: 'length', factor: 1000 },
    'cm': { type: 'length', factor: 0.01 },
    'mm': { type: 'length', factor: 0.001 },

    // Mass (Base: kg)
    'kg': { type: 'mass', factor: 1 },
    't': { type: 'mass', factor: 1000 },
    'g': { type: 'mass', factor: 0.001 },
    'mg': { type: 'mass', factor: 0.000001 },

    // Time (Base: s)
    's': { type: 'time', factor: 1 },
    'min': { type: 'time', factor: 60 },
    'h': { type: 'time', factor: 3600 },

    // Volume (Base: m³)
    'm³': { type: 'volume', factor: 1 },
    'L': { type: 'volume', factor: 0.001 },

    // Area (Base: m²)
    'm²': { type: 'area', factor: 1 },
    'km²': { type: 'area', factor: 1000000 },

    // Energy (Base: J)
    'J': { type: 'energy', factor: 1 },
    'kJ': { type: 'energy', factor: 1000 },
    'kWh': { type: 'energy', factor: 3.6e6 },

    // Speed (Base: m/s)
    'm/s': { type: 'speed', factor: 1 },
    'km/h': { type: 'speed', factor: 1 / 3.6 },

    // Current (Base: A)
    'A': { type: 'current', factor: 1 },
    'mA': { type: 'current', factor: 0.001 },

    // Voltage (Base: V)
    'V': { type: 'voltage', factor: 1 },
    'kV': { type: 'voltage', factor: 1000 },
    'mV': { type: 'voltage', factor: 0.001 },

    // Power (Base: W)
    'W': { type: 'power', factor: 1 },
    'kW': { type: 'power', factor: 1000 },
    'MW': { type: 'power', factor: 1000000 },
};

// 便捷单位别名
const UNIT_ALIASES: Record<string, string> = {
    'm^2': 'm²',
    'km^2': 'km²',
    'm^3': 'm³',
    'sec': 's',
    'hr': 'h',
};

// Default target units for specific units
const DEFAULT_CONVERSION: Record<string, string> = {
    'km': 'm',
    'm': 'km',
    't': 'kg',
    'kg': 'g',
    'g': 'kg',
    'min': 's',
    'h': 'min',
    'L': 'm³',
    'm³': 'L',
    'kWh': 'J',
    'J': 'kWh',
    'km/h': 'm/s',
    'm/s': 'km/h',
    'kW': 'W',
    'W': 'kW',
};

export function normalizeUnit(unit: string): string {
    return UNIT_ALIASES[unit] || unit;
}

export function getUnitType(unit: string): UnitType | null {
    const norm = normalizeUnit(unit);
    return UNIT_MAP[norm]?.type || null;
}

export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
    const fromNorm = normalizeUnit(fromUnit);
    const toNorm = normalizeUnit(toUnit);

    const fromDef = UNIT_MAP[fromNorm];
    const toDef = UNIT_MAP[toNorm];

    if (!fromDef || !toDef || fromDef.type !== toDef.type) {
        console.warn(`Cannot convert from ${fromUnit} to ${toUnit}`);
        return value;
    }

    // Convert to base, then to target
    const baseValue = value * fromDef.factor;
    const targetValue = baseValue / toDef.factor;

    // Handle floating point precision issues roughly
    return parseFloat(targetValue.toPrecision(10));
}

export function getAvailableUnits(currentUnit: string): string[] {
    const norm = normalizeUnit(currentUnit);
    const type = getUnitType(norm);
    if (!type) return [];

    return Object.keys(UNIT_MAP).filter(u => UNIT_MAP[u].type === type);
}

export function getDefaultTargetUnit(fromUnit: string): string {
    const norm = normalizeUnit(fromUnit);
    // Return explicit default if exists
    if (DEFAULT_CONVERSION[norm]) {
        return DEFAULT_CONVERSION[norm];
    }

    // Otherwise return base unit or first available different unit
    const type = getUnitType(norm);
    if (!type) return norm;

    const candidates = Object.keys(UNIT_MAP).filter(u => UNIT_MAP[u].type === type);
    // Try to find a unit that is NOT the fromUnit
    const other = candidates.find(u => u !== norm);
    return other || norm;
}

export function isValidUnit(unit: string): boolean {
    const norm = normalizeUnit(unit);
    return !!UNIT_MAP[norm];
}
