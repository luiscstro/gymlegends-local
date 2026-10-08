import { subscribe, type DbState } from '@/lib/data/local-db';

function shallowEqualArrays<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
}

/**
 * Como o onSnapshot do Firestore: chama o callback com o resultado do seletor agora e
 * sempre que ele mudar. Alterações em outras partes do banco não disparam re-render.
 */
export function subscribeSelect<T>(selector: (state: DbState) => T[], callback: (value: T[]) => void): () => void {
  let previous: T[] | null = null;
  return subscribe((state) => {
    const next = selector(state);
    if (previous && shallowEqualArrays(previous, next)) return;
    previous = next;
    callback(next);
  });
}
