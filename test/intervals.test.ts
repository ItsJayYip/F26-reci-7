import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// Construct valid intervals instead of generating invalid ones and discarding
// them. Keeping the range small also makes overlaps and shared endpoints common.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.nat(20))
  .map(([start, length]) => [start, start + length]);
const intervalList = fc.array(interval, { maxLength: 10 });

// Construct lists that are already in the required output form. A gap of one
// still leaves real numbers between integer endpoints (for example, 2.5 lies
// between [1, 2] and [3, 4]), so those intervals must remain separate.
const alreadyMergedList: fc.Arbitrary<Interval[]> = fc
  .tuple(
    fc.integer({ min: -20, max: 20 }),
    fc.array(
      fc.tuple(
        fc.nat(8),
        fc.oneof(fc.constant(1), fc.integer({ min: 2, max: 6 })),
      ),
      { maxLength: 8 },
    ),
  )
  .map(([firstStart, lengthsAndGaps]) => {
    let start = firstStart;
    return lengthsAndGaps.map(([length, gap]) => {
      const current: Interval = [start, start + length];
      start = current[1] + gap;
      return current;
    });
  });

function coversPoint(intervals: readonly Interval[], pointTwice: number): boolean {
  return intervals.some(([start, end]) => 2 * start <= pointTwice && pointTwice <= 2 * end);
}

// Membership can only change at an endpoint. Checking every endpoint, every
// midpoint between neighboring endpoints, and a point just outside each end
// therefore compares coverage over all real numbers without sampling luck.
function probePointsTwice(intervals: readonly Interval[]): number[] {
  const endpoints = [...new Set(intervals.flatMap(([start, end]) => [start, end]))].sort(
    (a, b) => a - b,
  );
  if (endpoints.length === 0) return [0];

  const probes = endpoints.map(point => 2 * point);
  for (let i = 1; i < endpoints.length; i += 1) {
    probes.push(endpoints[i - 1] + endpoints[i]);
  }
  probes.push(2 * endpoints[0] - 1, 2 * endpoints[endpoints.length - 1] + 1);
  return probes;
}

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. The output is sorted and consecutive intervals are disjoint and do not touch.
  it('returns intervals in canonical sorted and separated form', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);

        for (const [start, end] of out) expect(start).toBeLessThanOrEqual(end);
        for (let i = 1; i < out.length; i += 1) {
          expect(out[i - 1][0]).toBeLessThanOrEqual(out[i][0]);
          expect(out[i - 1][1]).toBeLessThan(out[i][0]);
        }
      }),
    );
  });

  // Pattern: differential. Input and output cover exactly the same real-number points.
  it('preserves point coverage', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (const pointTwice of probePointsTwice([...xs, ...out])) {
          expect(coversPoint(out, pointTwice)).toBe(coversPoint(xs, pointTwice));
        }
      }),
    );
  });

  // Pattern: metamorphic. Reordering the input does not change the output.
  it('is unaffected by reversing the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        expect(mergeIntervals([...xs].reverse())).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: algebraic. Merging an already merged result is idempotent.
  it('is idempotent', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. Already sorted, separated intervals are unchanged.
  it('leaves already merged inputs unchanged', () => {
    fc.assert(
      fc.property(alreadyMergedList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });

  // Pattern: invariant. The input array and its interval values are not modified.
  it('does not modify its input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = xs.map(([start, end]): Interval => [start, end]);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });
});
