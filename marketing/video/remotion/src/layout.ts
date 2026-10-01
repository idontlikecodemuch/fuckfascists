// Vertical 1080x1920 staging numbers (see storyboard "00 · Staging" + brief).
export const W = 1080;
export const H = 1920;

// Phone capture crop: clips were pre-cropped (status bar + tab bar removed)
// to 1206x2268 → the device frame keeps that aspect.
export const PHONE = {
  top: 60,
  right: 40,
  height: Math.round(H * 0.7), // 1344 — was 78%; shorter so Clark can sit higher without covering the screen
  width: Math.round((H * 0.7 * 1206) / 2268), // 715
  radius: 64,
  border: 6,
};
export const PHONE_LEFT = W - PHONE.right - PHONE.width;

export const BOX = {
  side: 24,
  bottom: 24,
  minHeight: 340, // two lines at 58 px + paddings; grows with the text
  fontSize: 58, // was 50 (creator, Sep 29: bigger dialogue type all around)
};
export const BOX_TOP = H - BOX.bottom - BOX.minHeight; // 1596 — Clark is clipped just below this

// Clark bust asset is 994x952 (2x). Standard placement: bottom-left, head
// clearing only the phone's lower-left corner, chest under the dialogue box.
export const CLARK_ASSET = { w: 994, h: 952, faceX: 500, faceY: 330 };
// Vertical Clark. 'body': the full-body asset standing left, legs behind the box (face
// ≈ 51% down the frame). 'bust': the 2x bust, smaller and feathered at the chest so it
// can float higher than the box. The creator asked for him higher and smaller (Sep 28).
export const VERTICAL_CLARK_MODE: 'body' | 'bust' = 'body';
export const CLARK = { scale: 0.56, left: -110, top: 900 }; // bust: face ≈ 56% down
export const CLARK_BODY = { scale: 1.12, left: -61, top: 772 }; // body: face at (275, 985)
export const CLARK_OUTRO = { scale: 0.64, left: -120, top: 985 }; // outro: bust behind the pile
export const CLARK_CLOSEUP_SCALE = 1.375;

// Wide (1920x1080) staging.
export const WIDE = {
  w: 1920,
  h: 1080,
  phone: { height: Math.round(1080 * 0.9), width: Math.round((1080 * 0.9 * 1206) / 2268), top: 54, left: 1180 },
  clarkFull: { w: 497, h: 1191 },
};
/** fallback clip size when a clip is missing from clipDims.json (phone clips are 1206x2150 crops) */
export const CAPTURE = { w: 1206, h: 2150 };
