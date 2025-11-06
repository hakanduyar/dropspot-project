const { generateCoefficients, calculatePriorityScore } = require('../src/utils/seedGenerator');

describe('Seed Generator Unit Tests', () => {
  const testSeed = 'a1b2c3d4e5f6';

  describe('generateCoefficients', () => {
    test('should generate valid coefficients from seed', () => {
      const { A, B, C } = generateCoefficients(testSeed);
      
      expect(A).toBeGreaterThanOrEqual(7);
      expect(A).toBeLessThanOrEqual(11);
      expect(B).toBeGreaterThanOrEqual(13);
      expect(B).toBeLessThanOrEqual(19);
      expect(C).toBeGreaterThanOrEqual(3);
      expect(C).toBeLessThanOrEqual(5);
    });

    test('should generate consistent coefficients for same seed', () => {
      const result1 = generateCoefficients(testSeed);
      const result2 = generateCoefficients(testSeed);
      
      expect(result1).toEqual(result2);
    });

    test('should generate different coefficients for different seeds', () => {
      const result1 = generateCoefficients('seed1seed1se');
      const result2 = generateCoefficients('seed2seed2se');
      
      // At least one coefficient should be different
      const isDifferent = 
        result1.A !== result2.A || 
        result1.B !== result2.B || 
        result1.C !== result2.C;
      
      expect(isDifferent).toBe(true);
    });
  });

  describe('calculatePriorityScore', () => {
    test('should calculate priority score correctly', () => {
      const score = calculatePriorityScore(testSeed, 100, 30, 2);
      
      expect(score).toBeGreaterThan(0);
      expect(Number.isInteger(score)).toBe(true);
    });

    test('should return non-negative score', () => {
      const score = calculatePriorityScore(testSeed, 0, 0, 1000);
      
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('should handle zero values', () => {
      const score = calculatePriorityScore(testSeed, 0, 0, 0);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(score)).toBe(true);
    });

    test('should be deterministic for same inputs', () => {
      const score1 = calculatePriorityScore(testSeed, 250, 45, 3);
      const score2 = calculatePriorityScore(testSeed, 250, 45, 3);
      
      expect(score1).toBe(score2);
    });

    test('should vary with different inputs', () => {
      const score1 = calculatePriorityScore(testSeed, 100, 30, 1);
      const score2 = calculatePriorityScore(testSeed, 200, 60, 5);
      
      // Scores should be different (with high probability)
      expect(score1).not.toBe(score2);
    });
  });
});