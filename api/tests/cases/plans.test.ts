import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Insurance Plans & Category Filter Test Cases', () => {
  const MOCK_PLANS = [
    { id: '1', name: 'HDFC Click 2 Protect', type: 'life', isActive: true },
    { id: '2', name: 'Care Supreme', type: 'health', isActive: true },
    { id: '3', name: 'Star Comprehensive', type: 'health', isActive: true },
    { id: '4', name: 'Bajaj Drive Smart', type: 'motor', isActive: true },
    { id: '5', name: 'Future Travel Shield', type: 'travel', isActive: false }, // inactive
    { id: '6', name: 'Old Home Secure', type: 'home', isActive: false },        // inactive
  ];

  describe('Dynamic Active Category Filtering', () => {
    it('should only return categories that have active plans', () => {
      // Simulates the query logic from GET /api/plans/categories
      const activeTypes = Array.from(
        new Set(
          MOCK_PLANS
            .filter(p => p.isActive)
            .map(p => p.type.toLowerCase().trim())
        )
      );

      assert.deepStrictEqual(activeTypes.sort(), ['health', 'life', 'motor']);
      assert.strictEqual(activeTypes.includes('travel'), false, 'Inactive travel plans must not appear in categories');
      assert.strictEqual(activeTypes.includes('home'), false, 'Inactive home plans must not appear in categories');
      assert.strictEqual(activeTypes.includes('business'), false, 'Non-existent business plans must not appear');
    });

    it('should immediately include a category when an active plan is added', () => {
      const updatedPlans = [
        ...MOCK_PLANS,
        { id: '7', name: 'Tata AIG Global Travel', type: 'travel', isActive: true }
      ];

      const activeTypes = Array.from(
        new Set(
          updatedPlans
            .filter(p => p.isActive)
            .map(p => p.type.toLowerCase().trim())
        )
      );

      assert.ok(activeTypes.includes('travel'), 'Newly activated category must now be present');
      assert.strictEqual(activeTypes.length, 4);
    });

    it('should normalize mixed case category strings cleanly', () => {
      const mixedPlans = [
        { type: 'LIFE', isActive: true },
        { type: 'Life', isActive: true },
        { type: 'life', isActive: true },
      ];

      const activeTypes = Array.from(
        new Set(
          mixedPlans
            .filter(p => p.isActive)
            .map(p => p.type.toLowerCase().trim())
        )
      );

      assert.strictEqual(activeTypes.length, 1);
      assert.strictEqual(activeTypes[0], 'life');
    });
  });

  describe('Plan Search and Filtering Constraints', () => {
    it('should accurately filter plans by category type', () => {
      const filterByType = (type: string) =>
        MOCK_PLANS.filter(p => p.isActive && (type === 'All' || p.type === type));

      assert.strictEqual(filterByType('All').length, 4);
      assert.strictEqual(filterByType('health').length, 2);
      assert.strictEqual(filterByType('life').length, 1);
      assert.strictEqual(filterByType('travel').length, 0);
    });
  });
});

