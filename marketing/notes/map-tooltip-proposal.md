# Map tap tooltip — proposal

Read-only research. Paths are the worktree at HEAD `58a133f`; the patch is written against the **main checkout working tree** (`2d9ea4a` + codex's uncommitted changes), which differs only in line numbers for the files touched.

## 1. What's actually true

**Correction to the brief first:** the iOS lookup is *not* on-device. `MKLocalPointsOfInterestRequest` runs through `MKLocalSearch` (`modules/mapkit-search/ios/MapKitSearchModule.swift:31-38`), which sends the tap coordinate to Apple's Maps service via the system framework already drawing the map. What *is* true: no FCK server, no third-party Places API, no developer key, no identifier added, nothing persisted. Copy must say "the map's own lookup," never "on-device" or "nothing leaves your phone."

- **Small circle, shrinks as you zoom in.** Radius = 2% of the shorter visible span, clamped 15–200 m (`features/Map/hooks/useTapSearch.ts:63-74`, `config/constants.ts:167-169`). Default region ≈ 90–110 m; after auto-center ≈ 35–45 m; two zoom-ins hit the 15 m floor. Zooming in makes the tap *stricter*, and a POI's registered coordinate is often not where its label is drawn. Codex's working tree adds a 45 m second pass when the strict pass finds nothing (`POI_SEARCH_FALLBACK_RADIUS_METERS`).
- **Coverage, not geometry, is the most common miss.** Every POI in the circle goes through `matchEntity` with `allowFecFallback: false` (`useTapSearch.ts:153-159`, `core/matching/pipeline.ts:145`) — bundled list only, domain then alias. A real business not on the list reads "Not on file."
- **Silent zero.** Toast + ghost marker appear only when POIs were found but none matched (`useTapSearch.ts:192`). Zero POIs (empty street, park) → a haptic and nothing else.
- **Dropped taps.** 500 ms debounce plus an in-flight drop (`useTapSearch.ts:246-250`, `constants.ts:209`). A 60 s in-memory cell cache on an ~11 m grid (`:46-49`) replays the same answer for a re-tap.
- **Neighbor resolution.** Zoomed out, several POIs come back: ≥2 matches → "SEVERAL HERE" chooser (`MapScreen.tsx:286-297`); one match → that card, even if it's the shop next door. Pins drop at the tap coordinate, not the POI's (`useTapSearch.ts:177`).
- **Android is name-only.** `onPoiClick` fires only on a Google-rendered POI label; the name string is matched, no website/category (`useTapSearch.ts:295-313`). Empty-map taps don't search.
- **Privacy facts to hang copy on.** Tap coordinates live in state/refs only (`useTapSearch.ts:96-100`); the cache key is a rounded string; nothing is written to disk.

## 2. Copy options (Clark)

Existing hints are 45–66 chars, one sentence. These are two sentences, ~100–110 chars. Platform-neutral so one string serves iOS and Android.

**A — recommended.** Mechanism, privacy fact, fix — in that order.
> Taps use the map's built-in place lookup — no separate places service, nothing saved. Zoom in and tap the name.
>
> a11y: "Map taps use the map's built-in place lookup, not a separate places service. Nothing is saved. Zoom in and tap the business name."

**B — mechanics-first.** Explains the radius; drops the privacy point to the FAQ.
> The map checks a small circle around your tap using its own place data. Zoom in and tap the name.
>
> a11y: "The map checks a small area around your tap using its own place data. Zoom in and tap the business name."

**C — privacy-first.** Closest to the creator's crux; slightly more Clark-at-the-window.
> No places API. The map's own lookup handles taps and we never see them — zoom in and tap the name.
>
> a11y: "No places API. The map's own lookup handles taps and nothing is sent to us. Zoom in and tap the business name."

The Tooltip reads `message` via `accessibilityRole="alert"`; the three existing hints have no separate label. The patch wires one through an optional `Text` prop (2 lines). Drop that hunk to match the existing hints exactly.

### Placement: contextual, not sequential

Show it once, the first time a tap produces "Not on file." (the `tapNoMatch` HUD pill), persisted under its own SecureStore key. Reasons:

- It answers the question when it's asked. A 4th sequential hint explains a failure the user hasn't had, the sequence already costs three dismissals, and 2/3 is already a tap hint.
- Users who never miss never see it.
- A separate `usePersistentHints` instance leaves the 1/3 progress labels untouched.

Trade-off: neighbor-card misses and silent zero-POI taps don't trigger it. The FAQ covers the first; the second is a `useTapSearch` feedback gap, not this hint's job.

## 3. Patch proposal

Base: `/Users/christophershannon/fuckfascists` working tree (codex's uncommitted state). `copy/map.ts` hint block is byte-identical to the worktree, offset +7 lines; `MapScreen.tsx` offset −3 (`topContentOffset` removed). `useMapHints.ts`, `usePersistentHints.ts`, `Tooltip.tsx`, `NoMatchToast.tsx` are identical in both.

```diff
--- a/copy/map.ts
+++ b/copy/map.ts
@@ -101,6 +101,10 @@ export const mapCopy = {
   hintSearch: "Search a business or tap on the map to see its political funding.",
   hintTap: "Tap any business on the map to pull up its record.",
   hintBarcode: "Use the UPC button to scan a product barcode.",
+  // Contextual hint — shown once, the first time a tap lands "Not on file."
+  // Clark voice. Platform-neutral: iOS uses Apple MapKit, Android uses Google POI labels.
+  hintTapMiss: "Taps use the map’s built-in place lookup — no separate places service, nothing saved. Zoom in and tap the name.",
+  hintTapMissLabel: "Map taps use the map’s built-in place lookup, not a separate places service. Nothing is saved. Zoom in and tap the business name.",
   hintDismissLabel: "Dismiss hint",
   hintProgress: (n: number, total: number) => `${n}/${total}`,
   // Folder card
--- a/features/Map/hooks/useMapHints.ts
+++ b/features/Map/hooks/useMapHints.ts
@@ -1,6 +1,7 @@
 import { usePersistentHints } from '../../../core/ui/usePersistentHints';
 
 const HINTS_KEY = 'map_hints_dismissed';
+const TAP_MISS_HINT_KEY = 'map_tap_miss_hint';
 
 const HINTS = [
   { id: 'search', version: 'v1' },
@@ -9,6 +10,9 @@ const HINTS = [
 ] as const;
 export type HintId = (typeof HINTS)[number]['id'];
 
+const TAP_MISS_HINTS = [{ id: 'tapMiss', version: 'v1' }] as const;
+export type TapMissHintId = (typeof TAP_MISS_HINTS)[number]['id'];
+
 interface MapHintsState {
   /** The currently active hint to display, or null if all dismissed. */
   activeHint: HintId | null;
@@ -30,3 +34,12 @@ interface MapHintsState {
 export function useMapHints(): MapHintsState {
   return usePersistentHints<HintId>({ storageKey: HINTS_KEY, hints: HINTS });
 }
+
+/**
+ * Contextual one-shot hint explaining why a map tap can miss. Separate
+ * storage key so it never renumbers the sequential 1/3 hints. The caller
+ * decides *when* to show it (first "Not on file." tap); this only tracks seen.
+ */
+export function useTapMissHint() {
+  return usePersistentHints<TapMissHintId>({ storageKey: TAP_MISS_HINT_KEY, hints: TAP_MISS_HINTS });
+}
--- a/features/Map/MapScreen.tsx
+++ b/features/Map/MapScreen.tsx
@@ -31,7 +31,7 @@ import { haptics } from '../../core/fx/haptics';
 import type { MapPin, ScanResult } from './types';
 import { MapControls } from './components/MapControls';
-import { useMapHints } from './hooks/useMapHints';
+import { useMapHints, useTapMissHint } from './hooks/useMapHints';
 import type { HintId } from './hooks/useMapHints';
 import { useSafeAreaInsets } from 'react-native-safe-area-context';
 import { mapCopy } from '../../copy/map';
@@ -77,6 +77,9 @@ const HINT_TAIL: Record<HintId, { tailDirection: 'up' | 'down' | null; tailOffs
   barcode: { tailDirection: 'down', tailOffset: theme.space.xl, tailAlign: 'right' },
 };
 
+// Sits just above NoMatchToast (bottom: 80) so the two read as one moment.
+const TAP_MISS_HINT_BOTTOM = 120;
+
 const DARK_MAP_STYLE: MapStyleElement[] = [
@@ -181,6 +184,10 @@ export function MapScreen({
   }, [nativeMapEnabled, location.coords, autoScan]);
 
   const hints = useMapHints();
+  const tapMissHint = useTapMissHint();
+  // Arm on the first "Not on file." tap; the tooltip then persists until dismissed.
+  const [tapMissed, setTapMissed] = useState(false);
+  useEffect(() => { if (tapNoMatch) setTapMissed(true); }, [tapNoMatch]);
   const [avoidedResult, setAvoidedResult] = useState<ScanResult | null>(null);
   const [avoidAnimating, setAvoidAnimating] = useState(false);
@@ -461,6 +468,22 @@ export function MapScreen({
       {(status === 'unmatched' || status === 'lookup_unavailable') && <UnmatchedBanner searchText={searchText} onOpenSearch={handleOpenSearch} variant={status === 'lookup_unavailable' ? 'lookup_unavailable' : 'no_match'} />}
       {tapNoMatch && !activeResult && <NoMatchToast />}
+      {nativeMapEnabled && tapMissed && tapMissHint.activeHint && !hints.activeHint && !activeResult && (
+        <>
+          <Pressable
+            style={styles.backdrop}
+            onPress={() => tapMissHint.dismiss('tapMiss')}
+            accessibilityRole="button"
+            accessibilityLabel={mapCopy.hintDismissLabel}
+          />
+          <Tooltip
+            message={mapCopy.hintTapMiss}
+            accessibilityLabel={mapCopy.hintTapMissLabel}
+            tailDirection={null}
+            style={styles.tapMissHint}
+          />
+        </>
+      )}
     </SafeAreaView>
   );
 }
@@ -501,6 +524,7 @@ const styles = StyleSheet.create({
   headerLogo:     { height: 42, aspectRatio: HORIZONTAL_LOGO_ASPECT, zIndex: 3 },
   backdrop:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
+  tapMissHint:    { position: 'absolute', bottom: TAP_MISS_HINT_BOTTOM, alignSelf: 'center', maxWidth: 240, zIndex: 3 },
--- a/core/ui/Tooltip.tsx
+++ b/core/ui/Tooltip.tsx
@@ -9,5 +9,7 @@ const TAIL_SIZE = 10;
 interface TooltipProps {
   message: string;
+  /** Optional screen-reader override for `message`. */
+  accessibilityLabel?: string;
   /** Direction the tail triangle points. null = no tail. */
@@ -33,3 +35,3 @@
-export function Tooltip({ message, tailDirection, tailOffset, tailAlign = 'left', progressLabel, style }: TooltipProps) {
+export function Tooltip({ message, accessibilityLabel, tailDirection, tailOffset, tailAlign = 'left', progressLabel, style }: TooltipProps) {
@@ -59,1 +61,1 @@
-          <Text style={styles.text} allowFontScaling>{message}</Text>
+          <Text style={styles.text} allowFontScaling accessibilityLabel={accessibilityLabel}>{message}</Text>
```

Notes:

- `MapScreen.tsx` is already ~510 lines (pre-existing); this adds ~20.
- No new dependency or storage pattern — same `usePersistentHints` the three hints use. Android trigger works unchanged.
- After landing: `bash scripts/audit-copy.sh`, regenerate `tools/copy-preview/copy-all.json` + `.js`, add the two keys to `SURFACE_COPY_MAP`.

## 4. FAQ addition — `copy/infoContent.ts`, category `app`

Insert after `wrong-match` (`copy/infoContent.ts:182`).

```ts
{
  id: 'map-tap-miss',
  q: 'Why does tapping the map sometimes miss?',
  a:
    'The map looks up places in a small circle around your tap — about a ' +
    'storefront wide when you’re zoomed in, wider when you’re zoomed out. It ' +
    'uses the map’s own place data (Apple Maps on iOS, Google Maps labels on ' +
    'Android), not a separate places service, so we never add an API key or see ' +
    'where you tapped. Nothing about a tap is saved. If a tap lands between two ' +
    'businesses you may get the neighbor — zoom in and tap the name. “Not on ' +
    'file” can also mean the business isn’t on our list yet. Search the name ' +
    'to check, or send a correction.',
  category: 'app',
},
```

Consistency finding: `data-transmitted` lists FEC.gov, the product database, and GitHub as the app's outbound calls. It omits the map provider. Name the gap; it's a separate copy fix.
