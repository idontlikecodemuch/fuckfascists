# Track Screen V3 Notes

## Purpose

This note is for the lead architect and for rollback safety. It explains:

- why the prior Claude fix in commit `795e7d8` did not resolve the Track issue
- what was pressure-tested in the rebuilt Track implementation in commit `38d2a63`
- how to revert safely if this rebuild needs to be backed out

## Why Claude's Fix Still Failed

The previous fix changed the list container from `FlatList` to `ScrollView` to work around suspected context propagation issues:

- Commit: `795e7d8`
- Message: `fix: replace FlatList with ScrollView to fix context propagation`

That change did not address the real failure mode.

### Root cause

The expand/collapse bug lived in Track state coordination, not in list virtualization:

1. `setFocusedPlatformId()` cleared `expandedIds` whenever focus changed.
2. The `✓` button path on an unfocused row called both:
   - `setFocusedPlatformId(platformId)`
   - `toggleExpand(platformId)`
3. Those updates were queued in the same interaction, but through separate state paths.
4. Because React batches state updates, the focus reset could wipe out the expansion update in the same event cycle.

This matches React's documented batching and updater-queue behavior:

- [React: Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [React `useState` reference](https://react.dev/reference/react/useState)

### Secondary issues in the prior fix

- The Track screen spec explicitly called for `FlatList` as the only scrollable element, but the workaround replaced it with `ScrollView`.
- The first-visit day-circle animation was guarded only in module memory, not persisted by date.
- Platform avoid writes still allowed more than one avoid per platform per day in the data layer.

## What Changed In V3

### State model

Focus and expansion are now coordinated through a reducer in:

- [trackUIState.ts](/Users/christophershannon/fuckfascists/features/Platforms/context/trackUIState.ts)

This makes the key user interactions atomic:

- focus row
- focus group
- toggle focused row expansion
- focus and expand an unfocused row in one transition

### Structure

Track is back to the intended layout:

- [TrackScreen.tsx](/Users/christophershannon/fuckfascists/features/Platforms/TrackScreen.tsx)
- [TrackList.tsx](/Users/christophershannon/fuckfascists/features/Platforms/components/TrackList.tsx)

Structure:

1. `TrackHeader`
2. `GameArena`
3. `FlatList`

### Data guard

Platform avoids are now binary per platform per calendar day:

- [eventStore.ts](/Users/christophershannon/fuckfascists/core/data/eventStore.ts)
- [usePlatformAvoidance.ts](/Users/christophershannon/fuckfascists/features/Platforms/hooks/usePlatformAvoidance.ts)

Legacy overcounted platform events are normalized on read so Track and Scorecard totals do not keep surfacing impossible daily counts.

## Pressure Test Matrix

These were exercised in code and in the interaction model:

1. User taps a row body on an unfocused row.
Expected: focus shifts, no automatic expansion.

2. User taps the row body again on the focused row.
Expected: day circles expand.

3. User taps the row body a third time.
Expected: day circles collapse.

4. User taps `AVOID` on an unfocused row.
Expected: today logs once, focus shifts, button becomes `✓`, arena hit FX fires.

5. User taps `✓` on an unfocused row.
Expected: row focuses and day circles expand together.

6. User taps `✓` on a focused row.
Expected: day circles toggle with no extra data write.

7. User taps a different row while one row is expanded.
Expected: previous row collapses immediately.

8. User taps a group header.
Expected: arena focuses that figure without opening child rows.

9. User revisits Track later the same day.
Expected: daily auto-open animation does not replay.

10. User logs a platform twice on the same day.
Expected: second write is ignored in the data layer.

### Automated coverage added

- [trackUIState.test.ts](/Users/christophershannon/fuckfascists/features/Platforms/__tests__/trackUIState.test.ts)
- [eventStore.test.ts](/Users/christophershannon/fuckfascists/core/data/__tests__/eventStore.test.ts)
- [aggregateScorecard.test.ts](/Users/christophershannon/fuckfascists/features/Scorecard/data/__tests__/aggregateScorecard.test.ts)

### Verification run

- `npx tsc --noEmit`
- `npx jest --runInBand`

Result: 310 tests passing, 28 suites passing.

## Rollback Path

### Fastest full rollback

Revert the Track rebuild commit:

```bash
git revert 38d2a63
```

This is the cleanest path if the entire Track v3 pass needs to come out.

### Restore the prior Track implementation only

If you want the repo state before the rebuild but do not want to revert unrelated later commits:

```bash
git checkout 795e7d8 -- \
  features/Platforms/TrackScreen.tsx \
  features/Platforms/context/TrackContext.tsx \
  features/Platforms/components/GameArena.tsx \
  features/Platforms/components/PlatformRow.tsx \
  features/Platforms/components/PlatformGroupHeader.tsx \
  features/Platforms/components/TrackHeader.tsx \
  features/Platforms/components/ArenaFX.tsx \
  features/Platforms/components/AvoidButton.tsx \
  features/Platforms/components/DayCircles.tsx \
  features/Platforms/hooks/usePlatformAvoidance.ts \
  core/data/eventStore.ts \
  core/sprites/spriteLoader.tsx \
  config/constants.ts \
  design/tokens.ts
```

Then review and commit explicitly.

### Recommended rollback discipline

1. Revert in a dedicated branch.
2. Run `npx tsc --noEmit`.
3. Run `npx jest --runInBand`.
4. Verify Track on-device before merging the rollback.

## Architect Summary

The bug was not primarily a rendering-container issue. It was a state-coordination bug caused by trying to change focus and expansion through separate state setters in the same interaction, while the focus setter also cleared expansion state. The v3 rebuild fixes that by making Track interactions reducer-driven and atomic, restoring the spec'd `FlatList` structure instead of working around it with `ScrollView`.
