/**
 * Drop schedule data — stub retained for import compatibility.
 *
 * The drop schedule is now computed deterministically on-device.
 * See core/dropSchedule/computeDropTime.ts and useDropSchedule.ts.
 *
 * The fetchDropSchedule function has been removed. If you have an import
 * pointing here, update it to use getCurrentDropTime() directly.
 */
