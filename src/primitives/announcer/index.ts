import { Announcer } from './announcer.js';

export { Announcer };
export type { SeriesResult, SpeechType } from './speech.js';

export function useAnnouncer() {
  return Announcer.setup();
}
