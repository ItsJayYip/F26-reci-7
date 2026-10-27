# Reflection

**Name / Andrew ID:** Jay Yip / jayy

**Recitation group members (Task 2):** Worked individually

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

The Wordle property "returns exactly five colors" killed none of the public
mutants. It is still valid because the specification says that matching two
five-letter words produces one result for each of the five positions. It would
catch an off-by-one bug in which the implementation's loop stopped after index
3 and returned only four colors (or ran once too many and returned six).

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

The `touchingNotMerged` mutant was flaky when my valid interval generator used
an unrestricted integer for each start. Two independently generated intervals
almost never shared an endpoint exactly, so the output-shape property rarely
reached the case it was meant to check. I kept constructing valid intervals as
`[start, start + length]`, but restricted starts to `-20..20`; this makes
overlaps and equal endpoints common without using `.filter` or `fc.pre`.

Before:

```text
~ touchingNotMerged       flaky: killed in 3/5 runs  by: returns intervals in canonical sorted and separated form
    Counterexample: [[[-6,12],[12,12]]]
Mutation score: 6/7 killed (86%)
```

After:

```text
✔ touchingNotMerged       killed  by: returns intervals in canonical sorted and separated form; is unaffected by reversing the input
    Counterexample: [[[1,3],[3,3]]]
Mutation score: 7/7 killed (100%)
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

```text
✔ mergesIntegerNeighbors  killed  by: preserves point coverage; leaves already merged inputs unchanged
    Counterexample: [[[-1,10],[11,11]]]
    AssertionError: expected true to be false // Object.is equality
```

The input does not cover the real number 10.5, because it lies strictly
between the intervals `[-1,10]` and `[11,11]`. The specification requires the
result to cover exactly the same real-number points, so merging these intervals
into `[-1,11]` incorrectly fills that gap.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

The file-editing module in our OpenCode project would benefit from
property-based testing.

- **Invariant:** Editing one selected part of a file should leave the rest of
  the file unchanged.
- **Metamorphic:** Making changes to two separate parts of a file should give
  the same result no matter which change is made first.

The generator would create a short text file and then choose sections that
actually exist in that file to edit. It should include cases such as empty
files, one-line files, repeated lines, and replacing text with an empty string.
A naive generator might choose positions outside the file or choose two edits
that overlap, which would create invalid inputs instead of useful test cases.
