import type { ExerciseCatalogItem } from '@/types/models';

/** Minúsculas, sem acento e sem espaços duplicados — "Tríceps  Pulley" e "triceps pulley" batem. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const MUSCLE_ORDER = ['Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen'];

export interface MuscleGroup {
  muscleGroup: string;
  items: ExerciseCatalogItem[];
}

/** Agrupa por grupo muscular numa ordem de treino conhecida; grupos desconhecidos vão pro fim, em ordem alfabética. */
export function groupByMuscle(items: ExerciseCatalogItem[]): MuscleGroup[] {
  const map = new Map<string, ExerciseCatalogItem[]>();
  for (const item of items) {
    const key = item.muscleGroup || 'Outros';
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }

  const rank = (group: string) => {
    const index = MUSCLE_ORDER.indexOf(group);
    return index === -1 ? MUSCLE_ORDER.length : index;
  };

  return Array.from(map.entries())
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, 'pt-BR'))
    .map(([muscleGroup, groupItems]) => ({
      muscleGroup,
      items: [...groupItems].sort((x, y) => x.name.localeCompare(y.name, 'pt-BR')),
    }));
}
