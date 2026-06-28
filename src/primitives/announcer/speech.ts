type CoreSpeechType =
  | string
  | (() => SpeechType)
  | SpeechType[]
  | SpeechSynthesisUtterance;
export type SpeechType = CoreSpeechType | Promise<CoreSpeechType>;

export interface SeriesResult {
  series: Promise<void>;
  readonly active: boolean;
  append: (toSpeak: SpeechType) => void;
  cancel: () => void;
}

function delay(pause: number) {
  return new Promise((resolve) => setTimeout(resolve, pause));
}

function flattenStrings(series: SpeechType[] = []): SpeechType[] {
  const flattened: SpeechType[] = [];
  let i = 0;
  for (; i < series.length; i++) {
    const item = series[i];
    if (typeof item === 'string' && !item.includes('PAUSE-')) {
      flattened.push(item);
    } else {
      break;
    }
  }
  return [flattened.join(',\b '), ...series.slice(i)];
}

function speak(
  phrase: string,
  utterances: SpeechSynthesisUtterance[],
  lang: string,
) {
  const synth = window.speechSynthesis;
  return new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = lang;
    utterance.onend = () => resolve();
    utterance.onerror = (e) =>
      reject(new Error(`Speech synthesis error: ${e.error}`));
    utterances.push(utterance);
    synth.speak(utterance);
  });
}

function speakSeries(
  series: SpeechType,
  aria: boolean,
  lang: string,
): SeriesResult {
  const synth = window.speechSynthesis;
  const remaining = flattenStrings(Array.isArray(series) ? series : [series]);
  const nested: SeriesResult[] = [];
  const utterances: SpeechSynthesisUtterance[] = [];
  let active = true;

  const chain = (async () => {
    while (active && remaining.length) {
      const phrase = await Promise.resolve(remaining.shift());
      if (!active || !phrase) continue;

      if (typeof phrase === 'string' && phrase.includes('PAUSE-')) {
        const pause = Number(phrase.split('PAUSE-')[1]) * 1000;
        if (!Number.isNaN(pause)) await delay(pause);
      } else if (typeof phrase === 'string') {
        if (aria) announceAria(phrase, lang);
        else await speak(phrase, utterances, lang);
      } else if (phrase instanceof SpeechSynthesisUtterance) {
        if (aria) announceAria(phrase.text, phrase.lang || lang);
        else await speak(phrase.text, utterances, phrase.lang || lang);
      } else if (typeof phrase === 'function') {
        const result = speakSeries(phrase(), aria, lang);
        nested.push(result);
        await result.series;
      } else if (Array.isArray(phrase)) {
        const result = speakSeries(phrase, aria, lang);
        nested.push(result);
        await result.series;
      }
    }
    active = false;
  })();

  return {
    series: chain,
    get active() {
      return active;
    },
    append: (toSpeak) => remaining.push(toSpeak),
    cancel: () => {
      if (!active) return;
      if (!aria) synth.cancel();
      nested.forEach((result) => result.cancel());
      active = false;
    },
  };
}

function announceAria(text: string, lang: string) {
  let element = document.getElementById('svelte-tv-aria');
  if (!element) {
    element = document.createElement('div');
    element.id = 'svelte-tv-aria';
    element.setAttribute('aria-live', 'assertive');
    element.setAttribute('tabindex', '0');
    document.body.appendChild(element);
  }
  element.textContent = '';
  const span = document.createElement('span');
  span.lang = lang;
  span.setAttribute('aria-label', text);
  element.appendChild(span);
}

let currentSeries: SeriesResult | undefined;

export default function speech(
  toSpeak: SpeechType,
  aria = false,
  lang = 'en-US',
) {
  currentSeries?.cancel();
  currentSeries = speakSeries(toSpeak, aria, lang);
  return currentSeries;
}
