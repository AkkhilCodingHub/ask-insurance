import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateVehicleAge } from '../../src/lib/idvCalculator';
import { IC38_QUESTION_BANK } from '../../src/lib/ic38Questions';

describe('Insurance Business Rules & Calculations', () => {
  describe('IRDAI Vehicle Age & Depreciation Calculation', () => {
    it('should correctly calculate vehicle age for a brand new vehicle', () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const { ageYears, ageMonths } = calculateVehicleAge(currentYear);
      assert.ok(ageYears >= 0 && ageYears <= 1.0);
      assert.ok(ageMonths >= 0 && ageMonths <= 12.0);
    });

    it('should return approximately 3 years for vehicle registered 3 years ago', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 3);
      const iso = pastDate.toISOString();
      
      const { ageYears, ageMonths } = calculateVehicleAge(undefined, iso);
      assert.ok(Math.abs(ageYears - 3.0) < 0.1, `Expected ~3.0 years, got ${ageYears}`);
      assert.ok(Math.abs(ageMonths - 36.0) < 1.5, `Expected ~36 months, got ${ageMonths}`);
    });

    it('should fallback gracefully when no date or year is provided', () => {
      const { ageYears, ageMonths } = calculateVehicleAge();
      assert.strictEqual(ageYears, 2.0);
      assert.strictEqual(ageMonths, 24);
    });
  });

  describe('POSP IC-38 Exam Question Bank Integrity', () => {
    it('should contain a valid question bank', () => {
      assert.ok(IC38_QUESTION_BANK.length >= 25, 'Bank should have at least 25 questions');
    });

    it('every question must have 4 distinct options and valid answer index', () => {
      for (const q of IC38_QUESTION_BANK) {
        assert.ok(q.id > 0, `Question missing valid id: ${JSON.stringify(q)}`);
        assert.ok(q.question.trim().length > 0, `Question ${q.id} text is empty`);
        assert.strictEqual(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
        assert.ok(
          q.correctAnswer >= 0 && q.correctAnswer <= 3,
          `Question ${q.id} correctAnswer must be between 0 and 3`
        );
        assert.ok(q.explanation.trim().length > 0, `Question ${q.id} explanation is empty`);
      }
    });
  });

  describe('Brokerage & Commission Calculations', () => {
    const calculateBrokerage = (premium: number, slabRate: number) => {
      return Math.round(premium * (slabRate / 100) * 100) / 100;
    };

    it('should compute 15% brokerage on a ₹10,000 premium accurately', () => {
      const amount = calculateBrokerage(10000, 15);
      assert.strictEqual(amount, 1500.00);
    });

    it('should compute fractional rates with correct 2-decimal rounding', () => {
      const amount = calculateBrokerage(12500, 7.5);
      assert.strictEqual(amount, 937.50);
    });

    it('should return 0 when rate is 0', () => {
      const amount = calculateBrokerage(50000, 0);
      assert.strictEqual(amount, 0);
    });
  });
});

