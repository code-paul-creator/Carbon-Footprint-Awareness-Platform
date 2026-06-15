/**
 * @fileoverview EcoTrack Carbon Footprint Calculator — Core Engine
 * @description Pure calculation module for estimating annual CO₂e emissions
 *              across transport, home energy, diet, and shopping categories.
 * @module calculator
 * @version 3.0.0
 * @author EcoTrack Team
 * @license MIT
 *
 * @see {@link https://www.ipcc.ch/report/ar6/wg3/} IPCC AR6 Working Group III
 * @see {@link https://cea.nic.in/} Central Electricity Authority India (CEA 2023)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** @constant {number} KG_PER_TONNE - Unit conversion factor */
const KG_PER_TONNE = 1000;

/** @constant {number} WEEKS_PER_YEAR - Weeks in a calendar year */
const WEEKS_PER_YEAR = 52;

/** @constant {number} MONTHS_PER_YEAR - Months in a calendar year */
const MONTHS_PER_YEAR = 12;

/** @constant {number} MIN_HOUSEHOLD - Minimum household size (prevents division by zero) */
const MIN_HOUSEHOLD = 1;

/** @constant {number} MAX_DECIMAL_PLACES - Default rounding precision */
const MAX_DECIMAL_PLACES = 4;

/**
 * @constant {Readonly<Object>} EMISSION_FACTORS
 * @description Emission intensity values from peer-reviewed sources.
 *   All values in kg CO₂e per unit unless otherwise stated.
 *   Wrapped in Object.freeze() to prevent accidental mutation.
 */
const EMISSION_FACTORS = Object.freeze({
  transport: Object.freeze({
    /** kg CO₂e per km driven, by fuel type */
    carPerKm: Object.freeze({
      petrol:   0.210,   // Average petrol car — IPCC AR6
      diesel:   0.170,   // Average diesel car — IPCC AR6
      hybrid:   0.110,   // Petrol-electric hybrid — IPCC AR6
      electric: 0.050,   // BEV on Indian grid (CEA 2023: 0.82 kg CO₂/kWh)
      none:     0.000    // No personal vehicle
    }),
    /** Short-haul flight parameters (< 3 hours) */
    flightShortHaul: Object.freeze({
      emissionFactor: 0.255,  // kg CO₂e per km (incl. radiative forcing index)
      avgDistanceKm:  800     // Representative short-haul distance
    }),
    /** Long-haul flight parameters (> 3 hours) */
    flightLongHaul: Object.freeze({
      emissionFactor: 0.195,  // kg CO₂e per km (economies of scale at altitude)
      avgDistanceKm:  5000    // Representative long-haul distance
    }),
    /** kg CO₂e per km — weighted average of bus/metro/train */
    publicTransportPerKm: 0.089
  }),

  home: Object.freeze({
    /** tonnes CO₂e per ₹ of electricity bill
     *  Derivation: 0.82 kg CO₂/kWh (CEA 2023) ÷ 1000 ÷ ₹8/kWh ≈ 0.000103 t/₹ */
    electricityPerRupee: 0.000103,
    /** Multiplier applied to grid emissions by energy source type */
    energySourceMultiplier: Object.freeze({
      grid:      1.00,  // Full grid emission factor
      solar:     0.40,  // ~60% offset from rooftop solar generation
      renewable: 0.05   // ~95% offset from 100% renewable energy tariff
    }),
    /** tonnes CO₂e per 14.2 kg LPG cylinder — GHG Protocol */
    lpgPerCylinder: 0.0629
  }),

  food: Object.freeze({
    /** Base annual food emissions in tonnes CO₂e by diet type
     *  Source: Poore & Nemecek (2018), Science; Oxford University */
    dietBaseTonnes: Object.freeze({
      vegan:        1.50,
      vegetarian:   1.70,
      flexitarian:  2.50,
      omnivore:     3.30,
      'heavy-meat': 4.50
    }),
    /** Multiplier for food waste level */
    wasteMultiplier: Object.freeze({
      rarely:    1.00,
      sometimes: 1.10,
      often:     1.25
    }),
    /** Multiplier for local vs imported produce */
    localProduceMultiplier: Object.freeze({
      always:    0.90,
      sometimes: 1.00,
      rarely:    1.05
    })
  }),

  shopping: Object.freeze({
    /** tonnes CO₂e per garment (full lifecycle — production, transport, washing) */
    clothingPerItem:     0.025,
    /** tonnes CO₂e per electronic device (full lifecycle) */
    electronicsPerUnit:  0.300,
    /** tonnes CO₂e per last-mile delivery order */
    onlineOrderPerOrder: 0.008
  })
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitizes a numeric input by clamping it within [min, max].
 * Returns `fallback` for any non-finite input (NaN, undefined, null, string).
 *
 * @param {*}      value    - Raw input (may be string, number, null, undefined)
 * @param {number} min      - Minimum allowed value (inclusive)
 * @param {number} max      - Maximum allowed value (inclusive)
 * @param {number} fallback - Returned when value is not a finite number
 * @returns {number} Sanitized numeric value
 *
 * @example
 * sanitizeInput('abc', 0, 100, 0) // → 0
 * sanitizeInput(150,   0, 100, 0) // → 100
 * sanitizeInput(50,    0, 100, 0) // → 50
 */
function sanitizeInput(value, min, max, fallback) {
  const n = parseFloat(value);
  if (!isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Safely looks up a key in an object.
 * Guards against null/undefined objects and missing keys.
 *
 * @param {Object|null|undefined} obj          - Source object
 * @param {string}                key          - Property key to look up
 * @param {number}                defaultValue - Returned when lookup fails
 * @returns {number} The looked-up value or the default
 *
 * @example
 * safeLookup({ petrol: 0.21 }, 'petrol', 0) // → 0.21
 * safeLookup({ petrol: 0.21 }, 'diesel', 0) // → 0   (missing key)
 * safeLookup(null, 'petrol', 0)             // → 0   (null object)
 */
function safeLookup(obj, key, defaultValue) {
  if (obj == null) return defaultValue;
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : defaultValue;
}

/**
 * Rounds a number to a specified number of decimal places.
 * Uses symmetric rounding (0.5 rounds away from zero).
 *
 * @param {number} value              - Number to round
 * @param {number} [decimals=4]       - Number of decimal places
 * @returns {number} Rounded value
 *
 * @example
 * round(1.2345)    // → 1.2345 (4dp default)
 * round(1.2345, 2) // → 1.23
 * round(1.2355, 2) // → 1.24
 */
function round(value, decimals = MAX_DECIMAL_PLACES) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates annual transport-related CO₂e emissions.
 *
 * Formula:
 *   car      = (km/week × 52 × factor_kg/km) ÷ 1000
 *   flights  = (count × avg_km × factor_kg/km) ÷ 1000
 *   public   = (km/week × 52 × 0.089) ÷ 1000
 *
 * @param {Object} [params={}]
 * @param {number} [params.carKmPerWeek=0]             - Weekly car distance in km
 * @param {string} [params.carType='none']             - Fuel type key
 * @param {number} [params.shortFlightsPerYear=0]      - Short-haul flights per year
 * @param {number} [params.longFlightsPerYear=0]       - Long-haul flights per year
 * @param {number} [params.publicTransportKmPerWeek=0] - Weekly public transport in km
 * @returns {number} Annual CO₂e in tonnes (rounded to 4dp)
 */
function calculateTransport({
  carKmPerWeek = 0,
  carType = 'none',
  shortFlightsPerYear = 0,
  longFlightsPerYear = 0,
  publicTransportKmPerWeek = 0
} = {}) {
  const ef = EMISSION_FACTORS.transport;

  const carFactor       = safeLookup(ef.carPerKm, carType, 0);
  const carTonnes       = (carKmPerWeek * WEEKS_PER_YEAR * carFactor) / KG_PER_TONNE;

  const shortFlightT    = (shortFlightsPerYear * ef.flightShortHaul.avgDistanceKm * ef.flightShortHaul.emissionFactor) / KG_PER_TONNE;
  const longFlightT     = (longFlightsPerYear  * ef.flightLongHaul.avgDistanceKm  * ef.flightLongHaul.emissionFactor)  / KG_PER_TONNE;

  const publicTonnes    = (publicTransportKmPerWeek * WEEKS_PER_YEAR * ef.publicTransportPerKm) / KG_PER_TONNE;

  return round(carTonnes + shortFlightT + longFlightT + publicTonnes);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME ENERGY CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates annual home energy CO₂e emissions per person.
 *
 * Formula:
 *   electricity = (bill/month × 12 × factor × src_multiplier) ÷ household_size
 *   lpg         = (cylinders/month × 12 × 0.0629) ÷ household_size
 *
 * @param {Object} [params={}]
 * @param {number} [params.monthlyElectricityBill=0] - Monthly bill in Indian Rupees
 * @param {string} [params.energySource='grid']      - Energy source key
 * @param {number} [params.lpgCylindersPerMonth=0]   - LPG cylinders per month
 * @param {number} [params.householdSize=1]          - People sharing the home
 * @returns {number} Annual CO₂e per person in tonnes (rounded to 4dp)
 */
function calculateHome({
  monthlyElectricityBill = 0,
  energySource = 'grid',
  lpgCylindersPerMonth = 0,
  householdSize = 1
} = {}) {
  const ef         = EMISSION_FACTORS.home;
  const hh         = Math.max(MIN_HOUSEHOLD, householdSize);
  const srcMult    = safeLookup(ef.energySourceMultiplier, energySource, 1);

  const elecT = (monthlyElectricityBill * MONTHS_PER_YEAR * ef.electricityPerRupee * srcMult) / hh;
  const lpgT  = (lpgCylindersPerMonth   * MONTHS_PER_YEAR * ef.lpgPerCylinder) / hh;

  return round(elecT + lpgT);
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOD CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates annual food-related CO₂e emissions.
 *
 * Formula:
 *   food = diet_base × waste_multiplier × local_multiplier
 *
 * @param {Object} [params={}]
 * @param {string} [params.dietType='omnivore']   - Diet type key
 * @param {string} [params.foodWaste='sometimes'] - Food waste frequency key
 * @param {string} [params.localFood='sometimes'] - Local produce frequency key
 * @returns {number} Annual CO₂e in tonnes (rounded to 4dp)
 */
function calculateFood({
  dietType  = 'omnivore',
  foodWaste = 'sometimes',
  localFood = 'sometimes'
} = {}) {
  const ef        = EMISSION_FACTORS.food;
  const base      = safeLookup(ef.dietBaseTonnes,         dietType,  2.50);
  const wasteMult = safeLookup(ef.wasteMultiplier,        foodWaste, 1.00);
  const localMult = safeLookup(ef.localProduceMultiplier, localFood, 1.00);

  return round(base * wasteMult * localMult);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPPING CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates annual shopping-related CO₂e emissions.
 *
 * Formula:
 *   shopping = (clothes/month × 12 × 0.025)
 *            + (electronics/year × 0.3)
 *            + (orders/month × 12 × 0.008)
 *
 * @param {Object} [params={}]
 * @param {number} [params.clothingItemsPerMonth=0] - New clothing items per month
 * @param {number} [params.electronicsPerYear=0]    - New electronic devices per year
 * @param {number} [params.onlineOrdersPerMonth=0]  - Online delivery orders per month
 * @returns {number} Annual CO₂e in tonnes (rounded to 4dp)
 */
function calculateShopping({
  clothingItemsPerMonth = 0,
  electronicsPerYear    = 0,
  onlineOrdersPerMonth  = 0
} = {}) {
  const ef = EMISSION_FACTORS.shopping;

  const clothingT    = clothingItemsPerMonth * MONTHS_PER_YEAR * ef.clothingPerItem;
  const electronicsT = electronicsPerYear    * ef.electronicsPerUnit;
  const deliveryT    = onlineOrdersPerMonth  * MONTHS_PER_YEAR * ef.onlineOrderPerOrder;

  return round(clothingT + electronicsT + deliveryT);
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADING SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef  {Object} GradeResult
 * @property {string} grade   - Letter grade: 'A+', 'A', 'B', 'C', 'D', or 'F'
 * @property {string} color   - CSS hex color for the grade
 * @property {string} message - Human-readable personalised feedback
 */

/**
 * Grading thresholds in ascending order of footprint size.
 * @constant {Array<{max: number, grade: string, color: string, message: string}>}
 */
const GRADE_THRESHOLDS = Object.freeze([
  { max: 1.5,      grade: 'A+', color: '#4ade80', message: "Outstanding! You're well below the 2050 sustainable target of 2t CO₂e." },
  { max: 2.5,      grade: 'A',  color: '#4ade80', message: "Excellent! You're close to the 2050 sustainable target of 2t CO₂e." },
  { max: 3.5,      grade: 'B',  color: '#86efac', message: "Good. Below the global average — a few tweaks will get you to an A." },
  { max: 5.0,      grade: 'C',  color: '#fbbf24', message: "Average. Targeted lifestyle changes can reduce this significantly." },
  { max: 8.0,      grade: 'D',  color: '#fb923c', message: "Above average. Focus on your highest-impact categories first." },
  { max: Infinity, grade: 'F',  color: '#f87171', message: "High impact. Immediate action across multiple areas is needed." }
]);

/**
 * Returns a grade, colour, and personalised feedback for a given footprint.
 *
 * @param {number} totalTonnes - Annual CO₂e footprint in tonnes
 * @returns {GradeResult}
 *
 * @example
 * getGrade(1.2) // → { grade: 'A+', color: '#4ade80', message: '...' }
 * getGrade(6.0) // → { grade: 'D',  color: '#fb923c', message: '...' }
 */
function getGrade(totalTonnes) {
  return GRADE_THRESHOLDS.find(({ max }) => totalTonnes < max);
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef  {Object} FootprintResult
 * @property {number} transport - Transport emissions (tonnes CO₂e/year)
 * @property {number} home      - Home energy emissions (tonnes CO₂e/year)
 * @property {number} food      - Food emissions (tonnes CO₂e/year)
 * @property {number} shopping  - Shopping emissions (tonnes CO₂e/year)
 * @property {number} total     - Total emissions (tonnes CO₂e/year)
 * @property {string} grade     - Letter grade (A+ to F)
 * @property {string} color     - CSS color for the grade
 * @property {string} message   - Personalised feedback message
 */

/**
 * Calculates the complete annual carbon footprint from raw UI inputs.
 * Applies input sanitization before passing values to individual calculators.
 *
 * @param {Object} [inputs={}] - Raw form values (may be strings or out-of-range)
 * @returns {FootprintResult}
 *
 * @example
 * const result = calculateTotalFootprint({
 *   carKmPerWeek: 100, carType: 'petrol',
 *   monthlyElectricityBill: 1500, energySource: 'grid',
 *   dietType: 'vegetarian', foodWaste: 'sometimes',
 *   clothingItemsPerMonth: 2, electronicsPerYear: 1
 * });
 * // result.total → e.g. 4.82
 * // result.grade → 'C'
 */
function calculateTotalFootprint(inputs = {}) {
  const transport = calculateTransport({
    carKmPerWeek:              sanitizeInput(inputs.carKmPerWeek,             0,   5000, 0),
    carType:                   inputs.carType || 'none',
    shortFlightsPerYear:       sanitizeInput(inputs.shortFlightsPerYear,      0,    100, 0),
    longFlightsPerYear:        sanitizeInput(inputs.longFlightsPerYear,       0,     50, 0),
    publicTransportKmPerWeek:  sanitizeInput(inputs.publicTransportKmPerWeek, 0,   1000, 0)
  });

  const home = calculateHome({
    monthlyElectricityBill: sanitizeInput(inputs.monthlyElectricityBill, 0, 100000, 0),
    energySource:           inputs.energySource || 'grid',
    lpgCylindersPerMonth:   sanitizeInput(inputs.lpgCylindersPerMonth,   0,     20, 0),
    householdSize:          sanitizeInput(inputs.householdSize,           1,     30, 1)
  });

  const food = calculateFood({
    dietType:  inputs.dietType  || 'omnivore',
    foodWaste: inputs.foodWaste || 'sometimes',
    localFood: inputs.localFood || 'sometimes'
  });

  const shopping = calculateShopping({
    clothingItemsPerMonth: sanitizeInput(inputs.clothingItemsPerMonth, 0, 200, 0),
    electronicsPerYear:    sanitizeInput(inputs.electronicsPerYear,    0,  50, 0),
    onlineOrdersPerMonth:  sanitizeInput(inputs.onlineOrdersPerMonth,  0, 200, 0)
  });

  const total             = round(transport + home + food + shopping, 2);
  const { grade, color, message } = getGrade(total);

  return { transport, home, food, shopping, total, grade, color, message };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS — works in Node.js (require) and browser (window.EcoTrack)
// ─────────────────────────────────────────────────────────────────────────────

const EcoTrackCalculator = {
  EMISSION_FACTORS,
  GRADE_THRESHOLDS,
  KG_PER_TONNE,
  WEEKS_PER_YEAR,
  MONTHS_PER_YEAR,
  sanitizeInput,
  safeLookup,
  round,
  calculateTransport,
  calculateHome,
  calculateFood,
  calculateShopping,
  calculateTotalFootprint,
  getGrade
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoTrackCalculator;
} else if (typeof window !== 'undefined') {
  window.EcoTrack = EcoTrackCalculator;
}
