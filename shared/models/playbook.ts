/**
 * Single source of truth for root-level diagnostic categories.
 * Used by:
 * - Frontend: ScoutChatScreen.tsx welcome message pills
 * - Backend: playbookService.ts root-level path extraction
 *
 * If you add/remove/rename a category here, both sides update automatically.
 */
export const ROOT_CATEGORIES = [
  "Wi-Fi / Internet",
  "Smart Home Devices",
  "Appliances",
  "HVAC / Thermostat",
  "TV / Streaming",
] as const;

export type RootCategory = (typeof ROOT_CATEGORIES)[number];
