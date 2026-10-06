import scriptJson from './data/script.json';

export const FPS = 30;
export type Cut = '60' | '30' | '15' | 'map' | 'track' | 'scan' | 'card';
/** One tab each, vertical, ≤ 15 s: title card → 2–3 beats → outro. */
export const SHORTS: Cut[] = ['map', 'track', 'scan', 'card'];
export type PanelKind = 'cold' | 'hook' | 'clark' | 'title' | 'feature' | 'drop' | 'share' | 'outro';
export type Feature = 'MAP' | 'TRACK' | 'SCAN' | 'SCORECARD';

export type ScriptLine = { id: string; text: string; horns?: boolean };
export type ScriptPanel = {
  panel: string;
  title: string;
  kind: PanelKind;
  feature?: Feature;
  lines: ScriptLine[];
};

export type Box = {
  id: string;
  text: string;
  horns: boolean;
  from: number; // frames, relative to panel
  duration: number; // frames
  typingFrames: number;
  vo: boolean;
  voSrc?: string;
};
export type Transition = 'none' | 'crt';
export type PanelTL = {
  key: string; // `${cut}-${panel}` e.g. "60-05"
  panel: ScriptPanel;
  from: number;
  duration: number;
  boxes: Box[];
  transitionIn: Transition;
};
export type Timeline = { cut: Cut; totalFrames: number; panels: PanelTL[] };

// ---- tunables --------------------------------------------------------------
export const TYPE_CPS = 28; // dialogue typing speed (chars/second)
export const HORNS_DELAY_S = 0.6; // 🤘🏽 appears this long after the text finishes
export const OUTRO_HOLD_S = 1.5; // hold after the horns
export const VO_PAD_S = 0.4; // box = VO duration + this, when VO exists

type Formula = { perWord: number; base: number; min: number };
/** Box duration without VO = max(min, words * perWord + base). Tuned per cut. */
export const FORMULAS: Record<Cut, Formula> = {
  '60': { perWord: 0.28, base: 0.8, min: 2.2 },
  '30': { perWord: 0.25, base: 0.7, min: 2.2 },
  '15': { perWord: 0.34, base: 0.9, min: 2.2 },
  map: { perWord: 0.3, base: 0.8, min: 2.2 },
  track: { perWord: 0.3, base: 0.8, min: 2.2 },
  scan: { perWord: 0.3, base: 0.8, min: 2.2 },
  card: { perWord: 0.3, base: 0.8, min: 2.2 },
};
/** The 15 is paced by the storyboard's own panel times, not by word count. */
export const BOX_OVERRIDES_S: Record<string, number> = {
  'c60-03-1': 4.0, // map beat: pinch-zoom + tap needs the room
  'c15-02-1': 3.0,
  'c15-03-1': 3.0,
  'c15-04-1': 4.5,
  'c15-05-1': 0.9, // + horns delay + hold = 3.0
  'c30-07-1': 1.9, // end card has no box; + horns delay + hold = 4.0
  'cmap-02-1': 4.0, // same map beat as c60-03-1
  'ctrack-02-1': 3.3, // Oct 6: trimmed so the track short + its cold open stays under the 15 s bed
  'ctrack-03-1': 3.6,
  'ctrack-04-1': 2.3,
  'cmap-05-1': 0.9,
  'ctrack-05-1': 0.9,
  'cscan-04-1': 0.9,
  'ccard-05-1': 0.9,
};
export const HOOK_S: Record<Cut, number> = { '60': 2.0, '30': 2.0, '15': 1.5, map: 0, track: 0, scan: 0, card: 0 };
/** Outcome-first cold open before the title card (shorts only; creator, Oct 6: each short opens differently). */
export const COLD_OPEN_S: Record<Cut, number> = { '60': 0, '30': 0, '15': 0, map: 1.5, track: 1.5, scan: 1.5, card: 1.5 };
/** Hook variants: 'rain' = card already up, money falling; 'slam' = the card slams onto the screen first, then the caption. */
export type HookStyle = 'rain' | 'slam';
/** extra hook time the slam needs before the caption; the 30 and 15 have no slack to give */
export const SLAM_EXTRA_S: Record<Cut, number> = { '60': 0.8, '30': 0, '15': 0, map: 0, track: 0, scan: 0, card: 0 };
/** Full-bleed staging: beats without a dialogue box are paced by the footage, not the word count. */
export const FULL_OVERRIDES_S: Record<string, number> = {
  'c60-03-1': 3.2, // zoom + tap (clip starts 0.8 s in)
  'c60-04-1': 3.4, // the file comes up; "I pull the file…" types in the top box
  'c60-05-1': 2.6, // "Tap avoid." → stamp → defeat
  'c60-10-1': 3.0, // scan card + avoid
  'cmap-02-1': 3.2,
  'cmap-03-1': 3.0,
  'cmap-04-1': 2.6,
  'cscan-03-1': 3.0,
  'c30-03-1': 4.4, // tap, file up at 0.95 s, stamp at 2.75 s
  'c30-05-1': 3.7, // camera, file up at 1.4 s
  'c30-04-1': 3.7, // keeps the 30 under thirty seconds
};
/** with VO the words land with the voice: typing spans the audio minus this tail */
export const VO_TYPE_TAIL_S = 0.5;
/** Section title card (icon + word) before each feature group; 0 = none for that cut. */
export const TITLE_S: Record<Cut, number> = { '60': 0.8, '30': 0.6, '15': 0, map: 0.7, track: 0.7, scan: 0.7, card: 0.7 };

// ---- helpers ---------------------------------------------------------------
type ScriptFile = { cuts: Record<Cut, ScriptPanel[]> };
export const getScript = (cut: Cut): ScriptPanel[] => (scriptJson as ScriptFile).cuts[cut];
export const lineIds = (cut: Cut): string[] => getScript(cut).flatMap((p) => p.lines.map((l) => l.id));
export const wordCount = (t: string): number => t.trim().split(/\s+/).filter(Boolean).length;
export const sec = (s: number): number => Math.round(s * FPS);
export const typingFrames = (text: string): number => Math.ceil((text.length / TYPE_CPS) * FPS);

export const boxSeconds = (cut: Cut, line: ScriptLine, voSeconds: number | null): number => {
  if (voSeconds != null) {
    // never cut a box before its text has finished typing
    return Math.max(voSeconds + VO_PAD_S, line.text.length / TYPE_CPS + 0.4);
  }
  const override = BOX_OVERRIDES_S[line.id];
  if (override != null) return override;
  const f = FORMULAS[cut];
  return Math.max(f.min, wordCount(line.text) * f.perWord + f.base);
};

export const buildTimeline = (cut: Cut, vo: Record<string, { seconds: number; src: string } | null>, opts: { hook?: HookStyle; stage?: 'phone' | 'full' } = {}): Timeline => {
  const panels = getScript(cut);
  const out: PanelTL[] = [];
  let cursor = 0;
  let prevKind: PanelKind | null = null;
  let prevFeature: Feature | undefined;

  if (COLD_OPEN_S[cut] > 0) {
    const cold: ScriptPanel = { panel: 'C', title: 'COLD OPEN', kind: 'cold', lines: [] };
    const d = sec(COLD_OPEN_S[cut]);
    out.push({ key: `${cut}-C`, panel: cold, from: cursor, duration: d, boxes: [], transitionIn: 'none' });
    cursor += d;
    prevKind = 'cold';
  }

  panels.forEach((p, i) => {
    if (p.kind === 'feature' && p.feature && p.feature !== prevFeature && TITLE_S[cut] > 0) {
      const title: ScriptPanel = { panel: `T-${p.feature}`, title: p.feature, kind: 'title', feature: p.feature, lines: [] };
      const d = sec(TITLE_S[cut]);
      out.push({ key: `${cut}-T-${p.feature}`, panel: title, from: cursor, duration: d, boxes: [], transitionIn: 'crt' });
      cursor += d;
      prevKind = 'title';
    }
    const boxes: Box[] = [];
    let duration = 0;
    if (p.kind === 'hook') {
      duration = sec(HOOK_S[cut] + (opts.hook === 'slam' ? SLAM_EXTRA_S[cut] : 0));
    } else {
      let at = 0;
      for (const line of p.lines) {
        const entry = vo[line.id] ?? null;
        const fullOverride = opts.stage === 'full' && !entry ? FULL_OVERRIDES_S[line.id] : undefined;
        const d = sec(fullOverride ?? boxSeconds(cut, line, entry ? entry.seconds : null));
        boxes.push({
          id: line.id,
          text: line.text,
          horns: Boolean(line.horns),
          from: at,
          duration: d,
          typingFrames: entry ? Math.max(typingFrames(line.text), sec(entry.seconds - VO_TYPE_TAIL_S)) : typingFrames(line.text),
          vo: entry != null,
          voSrc: entry?.src,
        });
        at += d;
      }
      duration = at;
      if (p.kind === 'outro') {
        duration += sec(HORNS_DELAY_S + OUTRO_HOLD_S);
        const last = boxes[boxes.length - 1];
        if (last) last.duration = duration - last.from; // box stays up through the hold
      }
    }

    let transitionIn: Transition = 'none';
    if ((i > 0 || prevKind === 'cold') && (prevKind === 'cold' || prevKind === 'hook' || prevKind === 'title' || p.kind === 'outro')) transitionIn = 'crt';

    out.push({ key: `${cut}-${p.panel}`, panel: p, from: cursor, duration, boxes, transitionIn });
    cursor += duration;
    prevKind = p.kind;
    if (p.feature) prevFeature = p.feature;
  });

  return { cut, totalFrames: cursor, panels: out };
};

/** Absolute frame ranges where VO is playing (for music ducking). */
export const voRanges = (tl: Timeline): Array<{ from: number; to: number }> =>
  tl.panels.flatMap((p) =>
    p.boxes.filter((b) => b.vo).map((b) => ({ from: p.from + b.from, to: p.from + b.from + b.duration })),
  );
