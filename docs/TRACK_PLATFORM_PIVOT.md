# Track Platform Pivot

## Purpose

This note documents the functional pivot for the Track platform list.

The goal is to stop fighting the current inline row-height animation model and
replace it with a simpler, more reliable interaction model that still delivers
the same user-facing behavior:

- focus a platform
- open day circles
- collapse the previously open platform
- support the first-visit daily preview ripple
- keep arena focus in sync with list interactions

This is a functional pivot, not a visual redesign.

## Why Pivot

The current implementation keeps combining four moving parts that are all valid
on their own, but brittle together:

1. Virtualized list rows
2. Row-local animated height state
3. Async first-visit collapse timers
4. Focus and expansion rules that depend on interaction sequencing

The result is a UI that is too easy to desynchronize.

The new direction is to make expansion part of the list data itself.

## Internet Vetting

This pivot was checked against official docs and common controlled-disclosure
patterns:

- React batches state updates, which is why split focus/expand logic is easy to
  desynchronize when one update clears the other.
  Source: https://react.dev/learn/queueing-a-series-of-state-updates
- `FlatList` expects `extraData` when rendering depends on state outside the
  `data` array.
  Source: https://reactnative.dev/docs/flatlist
- `LayoutAnimation.configureNext(...)` is meant to animate the next layout pass,
  which makes it a better fit for inserting/removing a details row than
  maintaining per-row `Animated.Value` height state.
  Source: https://reactnative.dev/docs/layoutanimation
- Apple documents progressive disclosure inside lists through
  `DisclosureGroup`/list patterns. That matches the mental model of "tap a row,
  reveal more controls for that row."
  Source: https://developer.apple.com/documentation/swiftui/lists
- Controlled accordion behavior is also a common production pattern in mature UI
  libraries, where expansion is driven by a single `expanded` value rather than
  hidden local animation state.
  Source: https://mui.com/material-ui/api/accordion/

## Recommended Implementation

### Core idea

Do not render day circles as an animated child inside each platform row.

Instead:

- keep one `openPlatformId` in reducer state
- keep one `selectedPlatformId` in reducer state
- build the list data so an open platform is immediately followed by a
  `dayCircles` item
- animate the list re-layout with `LayoutAnimation`

This turns expansion into plain data:

- closed row = no detail item under it
- open row = one detail item under it

### State model

Use a reducer with only the values that matter:

- `selectedPlatformId: string | null`
- `openPlatformId: string | null`
- `dailyPreviewOpenIds: string[] | null`
- `isDailyPreviewActive: boolean`

Rules:

- Tapping a row body selects the row and opens its details item
- Tapping the same row body again closes its details item
- Tapping a different row closes the previous one and opens the new one
- Tapping `AVOID` logs today and selects the row
- Tapping `✓` toggles the details item
- Group headers affect arena focus only, not `openPlatformId`

### List data shape

Build `FlatList` data with explicit item types:

- `groupHeader`
- `platformRow`
- `childRow`
- `dayCircles`

When `openPlatformId === instagram`, insert:

- `childRow(instagram)`
- `dayCircles(instagram)`

This keeps the open state visible in the same data model the list already
renders, which is much easier to debug than per-row hidden animation state.

### Animation

Use `LayoutAnimation.configureNext(...)` immediately before reducer dispatch for:

- row open
- row close
- switching open rows
- first-visit ripple collapse

Do not keep row-local `Animated.Value` height refs for day circles.

### Daily first-visit preview

For the first Track visit of a calendar day:

- render every platform with a `dayCircles` detail item visible
- after the configured delay, remove those detail items one by one from the
  list data
- any user interaction cancels the preview immediately

This preserves the ripple effect while keeping the source of truth in one place.

## Arena Background Decision

Keep arena backgrounds simple:

- use `cover` for the art layer, since the assets were intentionally painted to
  crop well
- add a fallback background color or subtle texture under the image so empty or
  slow-loading states still look intentional

This is simpler than trying to switch between `cover` and `contain` dynamically.

## Sprite Crop Vetting

The sprite crop can stay simple too.

### What was checked

I visually sampled 10 random sprite sheets:

- `2x2`: `richard-uihlein`, `stephen-schwarzman`, `mark-cuban`,
  `gary-friedman`, `david-solomon`
- `2x1`: `anthony-hucker`, `heidi-petz`, `douglas-lindsay`, `rick-keyes`,
  `joel-anderson`

All 10 sampled sprites use the same frame dimensions:

- frame width: `728`
- frame height: `720`

### Findings

- The face placement is consistent across both `2x2` and `2x1` sheets
- The sprite body is slightly left of frame center
- The face sits high in the frame, but not flush against the top edge
- Neutral and defeated variants keep the same body anchor

### Conclusion

We do not need per-sprite metadata for this pivot.

We should use one shared crop rule for bust/grid presentation, and one shared
crop rule for the single-character portrait:

- bust/grid crop: slightly left-shifted, slightly top-biased
- single portrait crop: same anchor, wider/taller crop window

We should only add per-sprite crop metadata if a second random sample exposes
outliers after the simplified rewrite is in place.

## Why This Is Simpler

This pivot removes complexity instead of moving it around:

- no per-row height animation state
- no dependency on a row component preserving local animation refs
- no need for per-sprite crop metadata right now
- no dynamic arena resize-mode logic
- one reducer decides what is selected and what is open

## Implementation Order

1. Replace inline day-circle expansion with explicit `dayCircles` list items
2. Reduce Track UI state to `selectedPlatformId`, `openPlatformId`, and preview
   state
3. Rewire row taps and `✓` taps to control the detail item
4. Keep arena background on `cover` and add a fallback texture/color layer
5. Apply one shared crop rule across both `2x2` and `2x1` sprites
6. Re-test Track behavior before touching any further visuals

## Decision

Recommended path: proceed with the data-driven detail-row pivot and keep the
visual systems simple unless the rewritten behavior proves a specific exception
is needed.

## Implementation Status

Implemented on March 21, 2026:

- Track reducer now separates:
  - `selectedPlatformId`
  - `openPlatformId`
  - `focusedFigureName`
- `TrackList` now renders `dayCircles` as an explicit list item type instead of
  an animated child inside `PlatformRow`
- row open/close now uses `LayoutAnimation` around list-data changes
- the first-visit daily preview is handled locally in `TrackList` by inserting
  and then removing detail rows
- arena backgrounds are back on `cover` with the container/background color
  acting as the fallback layer
- sprite crop remains shared across `2x2` and `2x1` sheets; no per-sprite
  metadata was added
