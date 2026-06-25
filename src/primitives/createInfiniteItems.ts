import { writable, type Writable } from 'svelte/store';

export interface InfiniteItems<T> extends Writable<T[]> {
  page: Writable<number>;
  end: Writable<boolean>;
  load: () => Promise<T[]>;
  reset: () => void;
}

export function createInfiniteItems<T>(
  fetcher: (page: number) => Promise<T[]>,
): InfiniteItems<T> {
  const items = writable<T[]>([]) as InfiniteItems<T>;
  const page = writable(0);
  const end = writable(false);
  let currentPage = 0;

  items.page = page;
  items.end = end;
  items.load = async () => {
    const content = await fetcher(currentPage);
    if (content.length === 0) {
      end.set(true);
    } else {
      items.update((prev) => [...prev, ...content]);
      currentPage += 1;
      page.set(currentPage);
    }
    return content;
  };
  items.reset = () => {
    currentPage = 0;
    page.set(0);
    end.set(false);
    items.set([]);
  };

  return items;
}
