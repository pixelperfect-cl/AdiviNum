import {
    calculateToquesYFamas,
    isValidSecret,
    isValidGuess,
    isPerfectGuess,
} from '@adivinum/shared';

describe('AdiviNum Game Engine', () => {
    // ================================================================
    // Validation Tests
    // ================================================================

    describe('isValidSecret', () => {
        it('should accept a valid 4-digit secret', () => {
            expect(isValidSecret('1234')).toBe(true);
            expect(isValidSecret('5678')).toBe(true);
            expect(isValidSecret('9123')).toBe(true);
        });

        it('should reject secrets starting with 0', () => {
            expect(isValidSecret('0123')).toBe(false);
            expect(isValidSecret('0987')).toBe(false);
        });

        it('should reject secrets with repeated digits', () => {
            expect(isValidSecret('1123')).toBe(false);
            expect(isValidSecret('1122')).toBe(false);
            expect(isValidSecret('1111')).toBe(false);
        });

        it('should reject secrets with wrong length', () => {
            expect(isValidSecret('123')).toBe(false);
            expect(isValidSecret('12345')).toBe(false);
            expect(isValidSecret('')).toBe(false);
        });

        it('should reject non-numeric inputs', () => {
            expect(isValidSecret('abcd')).toBe(false);
            expect(isValidSecret('12a4')).toBe(false);
        });
    });

    describe('isValidGuess', () => {
        it('should have the same rules as isValidSecret', () => {
            expect(isValidGuess('1234')).toBe(true);
            expect(isValidGuess('0123')).toBe(false);
            expect(isValidGuess('1123')).toBe(false);
        });
    });

    // ================================================================
    // Toques & Famas Calculation Tests
    // ================================================================

    describe('calculateToquesYFamas', () => {
        it('should return 4 famas for perfect match', () => {
            const result = calculateToquesYFamas('1234', '1234');
            expect(result.famas).toBe(4);
            expect(result.toques).toBe(0);
        });

        it('should return 0 toques 0 famas for no match at all', () => {
            const result = calculateToquesYFamas('1234', '5678');
            expect(result.famas).toBe(0);
            expect(result.toques).toBe(0);
        });

        it('should correctly identify toques (right digit, wrong position)', () => {
            // secret: 1234, guess: 4321
            // 4 is in secret but at pos 0 instead of 3 → toque
            // 3 is in secret but at pos 1 instead of 2 → toque
            // 2 is in secret but at pos 2 instead of 1 → toque
            // 1 is in secret but at pos 3 instead of 0 → toque
            const result = calculateToquesYFamas('1234', '4321');
            expect(result.famas).toBe(0);
            expect(result.toques).toBe(4);
        });

        it('should correctly identify famas (right digit, right position)', () => {
            // secret: 1234, guess: 1567
            // 1 is correct at pos 0 → fama
            const result = calculateToquesYFamas('1234', '1567');
            expect(result.famas).toBe(1);
            expect(result.toques).toBe(0);
        });

        it('should correctly mix toques and famas', () => {
            // secret: 1234, guess: 1432
            // pos 0: 1 == 1 → fama
            // pos 1: 4 is in secret at pos 3 → toque
            // pos 2: 3 is in secret at pos 2… wait no, pos 2 has '3' and guess pos 2 has '3' → fama
            // Actually: secret=1234, guess=1432
            // pos 0: 1==1 → fama
            // pos 1: 4 vs 2 — 4 is in secret (pos 3) → toque
            // pos 2: 3 vs 3 → fama
            // pos 3: 2 vs 4 — 2 is in secret (pos 1) → toque
            const result = calculateToquesYFamas('1234', '1432');
            expect(result.famas).toBe(2);
            expect(result.toques).toBe(2);
        });

        it('should handle example from game doc: secret=1234, guess=4251', () => {
            // pos 0: 4 vs 1 — 4 is in secret (pos 3) → toque
            // pos 1: 2 vs 2 → fama
            // pos 2: 5 vs 3 — 5 is NOT in secret → nothing
            // pos 3: 1 vs 4 — 1 is in secret (pos 0) → toque
            const result = calculateToquesYFamas('1234', '4251');
            expect(result.famas).toBe(1);
            expect(result.toques).toBe(2);
        });

        it('should handle all digits being toques', () => {
            const result = calculateToquesYFamas('1234', '2143');
            // pos 0: 2 at pos 0, should be pos 1 → toque
            // pos 1: 1 at pos 1, should be pos 0 → toque
            // pos 2: 4 at pos 2, should be pos 3 → toque
            // pos 3: 3 at pos 3, should be pos 2 → toque
            expect(result.famas).toBe(0);
            expect(result.toques).toBe(4);
        });

        it('should handle 3 famas and 0 toques', () => {
            const result = calculateToquesYFamas('1234', '1235');
            expect(result.famas).toBe(3);
            expect(result.toques).toBe(0);
        });

        it('should handle 1 fama and 3 toques', () => {
            // secret: 1234, guess: 1342
            // pos 0: 1==1 → fama
            // pos 1: 3 at pos 1, should be pos 2 → toque
            // pos 2: 4 at pos 2, should be pos 3 → toque
            // pos 3: 2 at pos 3, should be pos 1 → toque
            const result = calculateToquesYFamas('1234', '1342');
            expect(result.famas).toBe(1);
            expect(result.toques).toBe(3);
        });
    });

    // ================================================================
    // Perfect Guess Tests
    // ================================================================

    describe('isPerfectGuess', () => {
        it('should return true for exact match', () => {
            expect(isPerfectGuess('1234', '1234')).toBe(true);
        });

        it('should return false for partial match', () => {
            expect(isPerfectGuess('1234', '1235')).toBe(false);
        });

        it('should return false for all toques', () => {
            expect(isPerfectGuess('1234', '4321')).toBe(false);
        });
    });
});
