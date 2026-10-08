import { describe, expect, it } from 'vitest';

import type { ExerciseCatalogItem } from '@/types/models';

import { groupByMuscle, normalizeSearch } from './search-utils';

const item = (name: string, muscleGroup: string): ExerciseCatalogItem => ({
  id: name,
  name,
  muscleGroup,
  createdBy: 'system',
});

describe('normalizeSearch', () => {
  it('ignora acentos, caixa e espaços extras', () => {
    expect(normalizeSearch('  Tríceps   PULLEY ')).toBe('triceps pulley');
    expect(normalizeSearch('Elevação')).toBe('elevacao');
    expect(normalizeSearch('Abdômen')).toBe(normalizeSearch('abdomen'));
  });

  it('string vazia continua vazia', () => {
    expect(normalizeSearch('   ')).toBe('');
  });
});

describe('groupByMuscle', () => {
  it('ordena grupos na ordem de treino e desconhecidos no fim', () => {
    const groups = groupByMuscle([
      item('Agachamento', 'Pernas'),
      item('Meu exercício', 'Personalizado'),
      item('Supino', 'Peito'),
      item('Remada', 'Costas'),
      item('Alongamento', 'Mobilidade'),
    ]);
    expect(groups.map((g) => g.muscleGroup)).toEqual(['Peito', 'Costas', 'Pernas', 'Mobilidade', 'Personalizado']);
  });

  it('ordena itens alfabeticamente dentro do grupo (pt-BR)', () => {
    const [peito] = groupByMuscle([item('Supino', 'Peito'), item('Crucifixo', 'Peito'), item('Élevação', 'Peito')]);
    expect(peito.items.map((i) => i.name)).toEqual(['Crucifixo', 'Élevação', 'Supino']);
  });

  it('grupo vazio vira "Outros"', () => {
    expect(groupByMuscle([item('X', '')])[0].muscleGroup).toBe('Outros');
  });

  it('lista vazia não quebra', () => {
    expect(groupByMuscle([])).toEqual([]);
  });
});
