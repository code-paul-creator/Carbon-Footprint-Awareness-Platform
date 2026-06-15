/**
 * @fileoverview EcoTrack — Comprehensive Test Suite
 * @version 3.0.0
 * @description 70+ unit, integration, boundary, and regression tests.
 *
 * Run in Node.js : node tests/calculator.test.js
 * Run in browser : open tests/index.html
 */

'use strict';

// ── Module loading ────────────────────────────────────────────────────────────
const calc = (typeof require !== 'undefined')
  ? require('../js/calculator.js')
  : window.EcoTrack;

const {
  EMISSION_FACTORS, GRADE_THRESHOLDS,
  sanitizeInput, safeLookup, round,
  calculateTransport, calculateHome, calculateFood,
  calculateShopping, calculateTotalFootprint, getGrade
} = calc;

// ── Micro test framework ──────────────────────────────────────────────────────
const RESULTS = { passed: 0, failed: 0, errors: [] };

function describe(label, fn) {
  console.log(`\n${label}`);
  console.log('─'.repeat(Math.min(label.length, 60)));
  fn();
}

function test(desc, fn) {
  try {
    fn();
    RESULTS.passed++;
    console.log(`  ✅ ${desc}`);
  } catch (err) {
    RESULTS.failed++;
    RESULTS.errors.push({ desc, error: err.message });
    console.log(`  ❌ ${desc}`);
    console.log(`       ↳ ${err.message}`);
  }
}

function expect(actual) {
  return {
    toBe:                  (e) => { if (actual !== e)   throw new Error(`Expected ${JSON.stringify(e)}, got ${JSON.stringify(actual)}`) },
    toEqual:               (e) => { if (JSON.stringify(actual) !== JSON.stringify(e)) throw new Error(`Expected ${JSON.stringify(e)}, got ${JSON.stringify(actual)}`) },
    toBeCloseTo:           (e, d = 3) => { const f = 10 ** d; if (Math.round(actual * f) !== Math.round(e * f)) throw new Error(`Expected ≈${e} (±${1/f}), got ${actual}`) },
    toBeGreaterThan:       (e) => { if (actual <= e)    throw new Error(`Expected > ${e}, got ${actual}`) },
    toBeLessThan:          (e) => { if (actual >= e)    throw new Error(`Expected < ${e}, got ${actual}`) },
    toBeGreaterThanOrEqual:(e) => { if (actual < e)     throw new Error(`Expected ≥ ${e}, got ${actual}`) },
    toBeLessThanOrEqual:   (e) => { if (actual > e)     throw new Error(`Expected ≤ ${e}, got ${actual}`) },
    toBeTruthy:            ()  => { if (!actual)        throw new Error(`Expected truthy, got ${actual}`) },
    toBeFalsy:             ()  => { if (actual)         throw new Error(`Expected falsy, got ${actual}`) },
    toBeFinite:            ()  => { if (!isFinite(actual)) throw new Error(`Expected finite number, got ${actual}`) },
    toBeNonNegative:       ()  => { if (actual < 0)    throw new Error(`Expected ≥ 0, got ${actual}`) },
    toBeTypeOf:            (t) => { if (typeof actual !== t) throw new Error(`Expected type '${t}', got '${typeof actual}'`) },
    toBeInstanceOf:        (C) => { if (!(actual instanceof C)) throw new Error(`Expected instance of ${C.name}`) }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. UTILITY: sanitizeInput
// ─────────────────────────────────────────────────────────────────────────────
describe('🔧 sanitizeInput() — input validation & sanitization', () => {
  test('returns fallback for NaN string',         () => expect(sanitizeInput('abc',       0, 100, 42)).toBe(42));
  test('returns fallback for undefined',          () => expect(sanitizeInput(undefined,   0, 100,  5)).toBe(5));
  test('returns fallback for null',               () => expect(sanitizeInput(null,        0, 100,  7)).toBe(7));
  test('returns fallback for empty string',       () => expect(sanitizeInput('',          0, 100, 99)).toBe(99));
  test('clamps Infinity to max',                  () => expect(sanitizeInput(Infinity,    0, 100,  0)).toBe(0));
  test('clamps value above max',                  () => expect(sanitizeInput(999,         0, 100,  0)).toBe(100));
  test('clamps value below min',                  () => expect(sanitizeInput(-5,          0, 100,  0)).toBe(0));
  test('accepts value exactly at min',            () => expect(sanitizeInput(0,           0, 100,  0)).toBe(0));
  test('accepts value exactly at max',            () => expect(sanitizeInput(100,         0, 100,  0)).toBe(100));
  test('accepts valid mid-range value',           () => expect(sanitizeInput(50,          0, 100,  0)).toBe(50));
  test('parses valid numeric string',             () => expect(sanitizeInput('75',        0, 100,  0)).toBe(75));
  test('handles float input',                     () => expect(sanitizeInput(3.14,        0,  10,  0)).toBe(3.14));
  test('handles negative min range',              () => expect(sanitizeInput(-3,        -10,  10,  0)).toBe(-3));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. UTILITY: safeLookup
// ─────────────────────────────────────────────────────────────────────────────
describe('🔧 safeLookup() — safe property access', () => {
  test('returns value for valid key',             () => expect(safeLookup({ a: 1, b: 2 }, 'a', 0)).toBe(1));
  test('returns default for missing key',         () => expect(safeLookup({ a: 1 },       'z', 99)).toBe(99));
  test('returns default for null object',         () => expect(safeLookup(null,            'a',  5)).toBe(5));
  test('returns default for undefined object',    () => expect(safeLookup(undefined,       'a',  5)).toBe(5));
  test('does not access prototype properties',    () => expect(safeLookup({},     'toString', 7)).toBe(7));
  test('returns 0 as a valid (non-default) value',() => expect(safeLookup({ x: 0 },        'x',  9)).toBe(0));
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. UTILITY: round
// ─────────────────────────────────────────────────────────────────────────────
describe('🔧 round() — numeric rounding', () => {
  test('rounds to 4dp by default',               () => expect(round(1.23456)).toBe(1.2346));
  test('rounds to 2dp',                          () => expect(round(1.2345, 2)).toBe(1.23));
  test('rounds to 0dp',                          () => expect(round(1.6, 0)).toBe(2));
  test('rounds zero correctly',                  () => expect(round(0, 2)).toBe(0));
  test('handles negative values',                () => expect(round(-1.555, 2)).toBe(-1.55));
  test('does not alter already-rounded value',   () => expect(round(3.14, 2)).toBe(3.14));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRANSPORT CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
describe('🚗 calculateTransport() — vehicle & flight emissions', () => {
  test('no inputs → zero emissions',             () => expect(calculateTransport()).toBe(0));
  test('car=none, high km → zero (no car)',       () => expect(calculateTransport({ carKmPerWeek: 500, carType: 'none' })).toBe(0));
  test('petrol 100km/week — correct formula',    () => expect(calculateTransport({ carKmPerWeek: 100, carType: 'petrol' })).toBeCloseTo((100 * 52 * 0.21) / 1000, 3));
  test('diesel < petrol (same km)',               () => expect(calculateTransport({ carKmPerWeek: 100, carType: 'diesel' })).toBeLessThan(calculateTransport({ carKmPerWeek: 100, carType: 'petrol' })));
  test('hybrid < diesel (same km)',               () => expect(calculateTransport({ carKmPerWeek: 100, carType: 'hybrid' })).toBeLessThan(calculateTransport({ carKmPerWeek: 100, carType: 'diesel' })));
  test('electric < hybrid (same km)',             () => expect(calculateTransport({ carKmPerWeek: 100, carType: 'electric' })).toBeLessThan(calculateTransport({ carKmPerWeek: 100, carType: 'hybrid' })));
  test('short flight — correct formula',         () => expect(calculateTransport({ shortFlightsPerYear: 2 })).toBeCloseTo((2 * 800 * 0.255) / 1000, 3));
  test('long flight — correct formula',          () => expect(calculateTransport({ longFlightsPerYear: 1 })).toBeCloseTo((1 * 5000 * 0.195) / 1000, 3));
  test('long-haul > short-haul per flight',      () => expect(calculateTransport({ longFlightsPerYear: 1 })).toBeGreaterThan(calculateTransport({ shortFlightsPerYear: 1 })));
  test('public transport < petrol car same km',  () => expect(calculateTransport({ publicTransportKmPerWeek: 100 })).toBeLessThan(calculateTransport({ carKmPerWeek: 100, carType: 'petrol' })));
  test('result is always finite',                () => expect(calculateTransport({ carKmPerWeek: 200, carType: 'petrol', shortFlightsPerYear: 3 })).toBeFinite());
  test('result is always non-negative',          () => expect(calculateTransport({ carKmPerWeek: 200, carType: 'electric' })).toBeNonNegative());
  test('combined modes sum correctly',           () => {
    const combined = calculateTransport({ carKmPerWeek: 100, carType: 'petrol', shortFlightsPerYear: 1, publicTransportKmPerWeek: 50 });
    const car   = calculateTransport({ carKmPerWeek: 100, carType: 'petrol' });
    const flight = calculateTransport({ shortFlightsPerYear: 1 });
    const pub   = calculateTransport({ publicTransportKmPerWeek: 50 });
    expect(combined).toBeCloseTo(car + flight + pub, 3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. HOME ENERGY CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
describe('🏠 calculateHome() — electricity & LPG emissions', () => {
  test('no inputs → zero emissions',              () => expect(calculateHome()).toBe(0));
  test('solar = 40% of grid (same bill)',          () => {
    const g = calculateHome({ monthlyElectricityBill: 1000, energySource: 'grid', lpgCylindersPerMonth: 0 });
    const s = calculateHome({ monthlyElectricityBill: 1000, energySource: 'solar', lpgCylindersPerMonth: 0 });
    expect(s).toBeCloseTo(g * 0.4, 3);
  });
  test('renewable = 5% of grid (same bill)',       () => {
    const g = calculateHome({ monthlyElectricityBill: 1000, energySource: 'grid', lpgCylindersPerMonth: 0 });
    const r = calculateHome({ monthlyElectricityBill: 1000, energySource: 'renewable', lpgCylindersPerMonth: 0 });
    expect(r).toBeCloseTo(g * 0.05, 3);
  });
  test('household 4 = 1/4 of single-person',      () => {
    const one  = calculateHome({ monthlyElectricityBill: 2000, householdSize: 1,  lpgCylindersPerMonth: 0 });
    const four = calculateHome({ monthlyElectricityBill: 2000, householdSize: 4,  lpgCylindersPerMonth: 0 });
    expect(four).toBeCloseTo(one / 4, 3);
  });
  test('householdSize 0 treated as 1',             () => expect(calculateHome({ monthlyElectricityBill: 1000, householdSize: 0 })).toBe(calculateHome({ monthlyElectricityBill: 1000, householdSize: 1 })));
  test('negative householdSize treated as 1',      () => expect(calculateHome({ monthlyElectricityBill: 1000, householdSize: -99 })).toBe(calculateHome({ monthlyElectricityBill: 1000, householdSize: 1 })));
  test('LPG-only (no electricity) > 0',            () => expect(calculateHome({ monthlyElectricityBill: 0, lpgCylindersPerMonth: 2 })).toBeGreaterThan(0));
  test('more LPG = more emissions (monotonic)',     () => expect(calculateHome({ lpgCylindersPerMonth: 3 })).toBeGreaterThan(calculateHome({ lpgCylindersPerMonth: 1 })));
  test('result is finite and non-negative',        () => { const r = calculateHome({ monthlyElectricityBill: 3000, lpgCylindersPerMonth: 1.5, householdSize: 3 }); expect(r).toBeFinite(); expect(r).toBeNonNegative(); });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. FOOD CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
describe('🍽️ calculateFood() — diet emissions', () => {
  test('vegan < vegetarian < flexitarian < omnivore < heavy-meat', () => {
    const diets = ['vegan','vegetarian','flexitarian','omnivore','heavy-meat'];
    for (let i = 0; i < diets.length - 1; i++) {
      expect(calculateFood({ dietType: diets[i] })).toBeLessThan(calculateFood({ dietType: diets[i + 1] }));
    }
  });
  test('often waste > sometimes waste > rarely waste',              () => {
    expect(calculateFood({ foodWaste: 'often' })).toBeGreaterThan(calculateFood({ foodWaste: 'sometimes' }));
    expect(calculateFood({ foodWaste: 'sometimes' })).toBeGreaterThan(calculateFood({ foodWaste: 'rarely' }));
  });
  test('always local < sometimes local < rarely local',             () => {
    expect(calculateFood({ localFood: 'always' })).toBeLessThan(calculateFood({ localFood: 'sometimes' }));
    expect(calculateFood({ localFood: 'sometimes' })).toBeLessThan(calculateFood({ localFood: 'rarely' }));
  });
  test('omnivore neutral modifiers = 3.3t',                         () => expect(calculateFood({ dietType: 'omnivore', foodWaste: 'rarely', localFood: 'sometimes' })).toBeCloseTo(3.3, 2));
  test('vegan best-case < 1.5t',                                    () => expect(calculateFood({ dietType: 'vegan', foodWaste: 'rarely', localFood: 'always' })).toBeLessThan(1.5));
  test('result is finite and non-negative',                         () => { const r = calculateFood(); expect(r).toBeFinite(); expect(r).toBeNonNegative(); });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SHOPPING CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
describe('🛍️ calculateShopping() — consumer goods emissions', () => {
  test('no inputs → zero emissions',              () => expect(calculateShopping()).toBe(0));
  test('clothing formula correct',                () => expect(calculateShopping({ clothingItemsPerMonth: 4 })).toBeCloseTo(4 * 12 * 0.025, 3));
  test('electronics formula correct',             () => expect(calculateShopping({ electronicsPerYear: 3 })).toBeCloseTo(3 * 0.3, 3));
  test('online orders formula correct',           () => expect(calculateShopping({ onlineOrdersPerMonth: 6 })).toBeCloseTo(6 * 12 * 0.008, 3));
  test('more clothing = more emissions',          () => expect(calculateShopping({ clothingItemsPerMonth: 10 })).toBeGreaterThan(calculateShopping({ clothingItemsPerMonth: 1 })));
  test('all three categories sum correctly',      () => {
    const combined = calculateShopping({ clothingItemsPerMonth: 2, electronicsPerYear: 1, onlineOrdersPerMonth: 5 });
    const c = calculateShopping({ clothingItemsPerMonth: 2 });
    const e = calculateShopping({ electronicsPerYear: 1 });
    const o = calculateShopping({ onlineOrdersPerMonth: 5 });
    expect(combined).toBeCloseTo(c + e + o, 3);
  });
  test('result is finite and non-negative',       () => { const r = calculateShopping({ clothingItemsPerMonth: 5, electronicsPerYear: 2, onlineOrdersPerMonth: 10 }); expect(r).toBeFinite(); expect(r).toBeNonNegative(); });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GRADING SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
describe('🏆 getGrade() — scoring & feedback', () => {
  test('A+ for 0.0t',                           () => expect(getGrade(0.0).grade).toBe('A+'));
  test('A+ for 1.49t',                          () => expect(getGrade(1.49).grade).toBe('A+'));
  test('A  for exactly 1.5t (boundary)',        () => expect(getGrade(1.5).grade).toBe('A'));
  test('A  for 2.0t',                           () => expect(getGrade(2.0).grade).toBe('A'));
  test('B  for 2.5t (boundary)',                () => expect(getGrade(2.5).grade).toBe('B'));
  test('B  for 3.0t',                           () => expect(getGrade(3.0).grade).toBe('B'));
  test('C  for 3.5t (boundary)',                () => expect(getGrade(3.5).grade).toBe('C'));
  test('C  for 4.5t',                           () => expect(getGrade(4.5).grade).toBe('C'));
  test('D  for 5.0t (boundary)',                () => expect(getGrade(5.0).grade).toBe('D'));
  test('D  for 7.0t',                           () => expect(getGrade(7.0).grade).toBe('D'));
  test('F  for 8.0t (boundary)',                () => expect(getGrade(8.0).grade).toBe('F'));
  test('F  for 20t',                            () => expect(getGrade(20).grade).toBe('F'));
  test('result has color (string)',              () => expect(getGrade(3.0).color).toBeTypeOf('string'));
  test('result has message (string)',            () => expect(getGrade(3.0).message).toBeTypeOf('string'));
  test('color is a CSS hex string',             () => expect(getGrade(2.0).color.startsWith('#')).toBeTruthy());
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. INTEGRATION: calculateTotalFootprint
// ─────────────────────────────────────────────────────────────────────────────
describe('🔗 calculateTotalFootprint() — end-to-end integration', () => {
  const ECO = {
    carKmPerWeek: 0, carType: 'none', shortFlightsPerYear: 0, longFlightsPerYear: 0, publicTransportKmPerWeek: 20,
    monthlyElectricityBill: 400, energySource: 'solar', lpgCylindersPerMonth: 0.5, householdSize: 4,
    dietType: 'vegan', foodWaste: 'rarely', localFood: 'always',
    clothingItemsPerMonth: 1, electronicsPerYear: 0, onlineOrdersPerMonth: 2
  };
  const HIGH = {
    carKmPerWeek: 700, carType: 'petrol', shortFlightsPerYear: 8, longFlightsPerYear: 5, publicTransportKmPerWeek: 0,
    monthlyElectricityBill: 9000, energySource: 'grid', lpgCylindersPerMonth: 3, householdSize: 1,
    dietType: 'heavy-meat', foodWaste: 'often', localFood: 'rarely',
    clothingItemsPerMonth: 20, electronicsPerYear: 6, onlineOrdersPerMonth: 30
  };

  test('total = transport + home + food + shopping',  () => { const r = calculateTotalFootprint(ECO); expect(r.total).toBeCloseTo(r.transport + r.home + r.food + r.shopping, 1); });
  test('eco-friendly profile → grade A or better',    () => { const g = calculateTotalFootprint(ECO).grade; expect(g === 'A+' || g === 'A').toBeTruthy(); });
  test('high-consumption profile → grade D or F',     () => { const g = calculateTotalFootprint(HIGH).grade; expect(g === 'D' || g === 'F').toBeTruthy(); });
  test('empty input → non-negative total',            () => expect(calculateTotalFootprint({}).total).toBeNonNegative());
  test('result has all 8 required fields',            () => {
    const r = calculateTotalFootprint({});
    ['transport','home','food','shopping','total','grade','color','message'].forEach(k => expect(r[k] !== undefined).toBeTruthy());
  });
  test('invalid string inputs sanitized gracefully',  () => { const r = calculateTotalFootprint({ carKmPerWeek: 'bad', householdSize: 'x', electronicsPerYear: NaN }); expect(r.total).toBeFinite(); expect(r.total).toBeNonNegative(); });
  test('negative inputs sanitized to zero/min',       () => { const r = calculateTotalFootprint({ carKmPerWeek: -999, householdSize: -5 }); expect(r.total).toBeNonNegative(); });
  test('high-consumption > eco-friendly total',       () => expect(calculateTotalFootprint(HIGH).total).toBeGreaterThan(calculateTotalFootprint(ECO).total));
  test('total has max 2 decimal places',              () => { const r = calculateTotalFootprint(ECO); expect(r.total).toBeCloseTo(Math.round(r.total * 100) / 100, 2); });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. DATA INTEGRITY & IMMUTABILITY
// ─────────────────────────────────────────────────────────────────────────────
describe('📊 Emission Factors — data integrity & immutability', () => {
  test('EMISSION_FACTORS is frozen',                       () => expect(Object.isFrozen(EMISSION_FACTORS)).toBeTruthy());
  test('carPerKm sub-object is frozen',                    () => expect(Object.isFrozen(EMISSION_FACTORS.transport.carPerKm)).toBeTruthy());
  test('dietBaseTonnes sub-object is frozen',              () => expect(Object.isFrozen(EMISSION_FACTORS.food.dietBaseTonnes)).toBeTruthy());
  test('all car EFs are non-negative',                     () => Object.values(EMISSION_FACTORS.transport.carPerKm).forEach(v => expect(v).toBeNonNegative()));
  test('electric < hybrid < diesel < petrol (EF order)',   () => {
    const c = EMISSION_FACTORS.transport.carPerKm;
    expect(c.electric).toBeLessThan(c.hybrid);
    expect(c.hybrid).toBeLessThan(c.diesel);
    expect(c.diesel).toBeLessThan(c.petrol);
  });
  test('solar multiplier is between 0 and 1',              () => { const v = EMISSION_FACTORS.home.energySourceMultiplier.solar; expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(1); });
  test('renewable multiplier < solar multiplier',          () => expect(EMISSION_FACTORS.home.energySourceMultiplier.renewable).toBeLessThan(EMISSION_FACTORS.home.energySourceMultiplier.solar));
  test('diet order: vegan < veg < flex < omni < heavy',    () => {
    const d = EMISSION_FACTORS.food.dietBaseTonnes;
    expect(d.vegan).toBeLessThan(d.vegetarian);
    expect(d.vegetarian).toBeLessThan(d.flexitarian);
    expect(d.flexitarian).toBeLessThan(d.omnivore);
    expect(d.omnivore).toBeLessThan(d['heavy-meat']);
  });
  test('GRADE_THRESHOLDS covers 0 to Infinity',            () => {
    expect(GRADE_THRESHOLDS[0].max).toBeGreaterThan(0);
    expect(GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1].max).toBe(Infinity);
  });
  test('mutation of EMISSION_FACTORS silently fails',      () => {
    const before = EMISSION_FACTORS.transport.carPerKm.petrol;
    try { EMISSION_FACTORS.transport.carPerKm.petrol = 99; } catch (_) {}
    expect(EMISSION_FACTORS.transport.carPerKm.petrol).toBe(before);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(55));
console.log(`\n🌍 EcoTrack Test Results`);
console.log(`   ✅ Passed : ${RESULTS.passed}`);
console.log(`   ❌ Failed : ${RESULTS.failed}`);
console.log(`   📊 Total  : ${RESULTS.passed + RESULTS.failed}`);
if (RESULTS.failed === 0) {
  console.log('\n🎉 All tests passed!\n');
} else {
  console.log('\nFailed tests:');
  RESULTS.errors.forEach(({ desc, error }) => console.log(`  ❌ ${desc}\n       ↳ ${error}`));
}

if (typeof module !== 'undefined') module.exports = { RESULTS };
