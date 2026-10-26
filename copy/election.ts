// Election Day reminders (owner 2026-10-26): a "make a plan" notification two
// days ahead (Sunday 6pm), one on Election Day morning, and an in-app banner
// from two days ahead through the day. Every tap opens VOTE411
// (sharedCopy.voteInfoUrl). Marketing lead copy, Clark voice, nonpartisan; it
// names VOTE411 before the tap so the browser hand-off is no surprise.
export const electionCopy = {
  planTitle: "Election Day is Tuesday.",
  planBody: "Make a plan. Find your polling place and hours on VOTE411. Tap to look it up.",
  dayTitle: "It's Election Day.",
  dayBody: "Polls are open today. Find your polling place and hours on VOTE411. Tap to look it up.",
  channelName: "Election Day",
  bannerBeforeTitle: "ELECTION DAY IS TUESDAY",
  bannerBeforeBody: "Make a plan. Find your polling place and hours on VOTE411. Tap to look it up.",
  bannerBeforeA11y: "Election Day is Tuesday. Make a plan: find your polling place and hours on VOTE411. Opens in your browser.",
  bannerDayTitle: "IT'S ELECTION DAY",
  bannerDayBody: "Polls are open today. Find your polling place and hours on VOTE411. Tap to look it up.",
  bannerDayA11y: "It's Election Day. Polls are open today. Find your polling place and hours on VOTE411. Opens in your browser.",
  dismissA11y: "Hide for today.",
} as const;
