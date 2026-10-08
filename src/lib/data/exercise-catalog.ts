import { getState, newId, update } from '@/lib/data/local-db';
import type { ExerciseCatalogItem } from '@/types/models';

const SEED_EXERCISES: Omit<ExerciseCatalogItem, 'id'>[] = [
  // Peito
  { name: 'Supino Reto Articulado', muscleGroup: 'Peito', createdBy: 'system' },
  { name: 'Supino Reto (Barra)', muscleGroup: 'Peito', createdBy: 'system' },
  { name: 'Supino Inclinado (Halteres)', muscleGroup: 'Peito', createdBy: 'system' },
  { name: 'Crucifixo na Máquina', muscleGroup: 'Peito', createdBy: 'system' },
  { name: 'Crucifixo Polia Alta', muscleGroup: 'Peito', createdBy: 'system' },
  { name: 'Crucifixo Polia Baixa', muscleGroup: 'Peito', createdBy: 'system' },
  { name: 'Paralelas (Chest Dip)', muscleGroup: 'Peito', createdBy: 'system' },
  { name: 'Peck Deck', muscleGroup: 'Peito', createdBy: 'system' },

  // Costas
  { name: 'Puxada Alta (Pulley)', muscleGroup: 'Costas', createdBy: 'system' },
  { name: 'Barra Fixa (Pull Up)', muscleGroup: 'Costas', createdBy: 'system' },
  { name: 'Remada Curvada (Barra)', muscleGroup: 'Costas', createdBy: 'system' },
  { name: 'Remada Baixa (Triângulo)', muscleGroup: 'Costas', createdBy: 'system' },
  { name: 'Remada Unilateral (Halter)', muscleGroup: 'Costas', createdBy: 'system' },
  { name: 'Remada Cavalinho', muscleGroup: 'Costas', createdBy: 'system' },
  { name: 'Pulldown Articulado', muscleGroup: 'Costas', createdBy: 'system' },
  { name: 'Levantamento Terra', muscleGroup: 'Costas', createdBy: 'system' },

  // Ombro
  { name: 'Desenvolvimento Militar (Barra)', muscleGroup: 'Ombro', createdBy: 'system' },
  { name: 'Desenvolvimento Máquina', muscleGroup: 'Ombro', createdBy: 'system' },
  { name: 'Elevação Lateral (Halteres)', muscleGroup: 'Ombro', createdBy: 'system' },
  { name: 'Elevação Lateral na Polia', muscleGroup: 'Ombro', createdBy: 'system' },
  { name: 'Elevação Frontal', muscleGroup: 'Ombro', createdBy: 'system' },
  { name: 'Crucifixo Invertido', muscleGroup: 'Ombro', createdBy: 'system' },
  { name: 'Encolhimento (Trapézio)', muscleGroup: 'Ombro', createdBy: 'system' },

  // Bíceps
  { name: 'Rosca Direta (Barra)', muscleGroup: 'Bíceps', createdBy: 'system' },
  { name: 'Rosca Alternada (Halteres)', muscleGroup: 'Bíceps', createdBy: 'system' },
  { name: 'Rosca Scott', muscleGroup: 'Bíceps', createdBy: 'system' },
  { name: 'Rosca Martelo', muscleGroup: 'Bíceps', createdBy: 'system' },
  { name: 'Rosca na Polia', muscleGroup: 'Bíceps', createdBy: 'system' },

  // Tríceps
  { name: 'Tríceps Pulley (Corda)', muscleGroup: 'Tríceps', createdBy: 'system' },
  { name: 'Tríceps Pulley (Barra)', muscleGroup: 'Tríceps', createdBy: 'system' },
  { name: 'Tríceps Testa', muscleGroup: 'Tríceps', createdBy: 'system' },
  { name: 'Tríceps Francês', muscleGroup: 'Tríceps', createdBy: 'system' },
  { name: 'Mergulho no Banco (Bench Dip)', muscleGroup: 'Tríceps', createdBy: 'system' },

  // Pernas
  { name: 'Agachamento Livre', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Leg Press 45', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Cadeira Extensora', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Cadeira Flexora', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Mesa Flexora', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Stiff (Halteres ou Barra)', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Cadeira Adutora', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Cadeira Abdutora', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Panturrilha em Pé', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Panturrilha Sentado', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Afundo (Passada)', muscleGroup: 'Pernas', createdBy: 'system' },
  { name: 'Hack Squat', muscleGroup: 'Pernas', createdBy: 'system' },

  // Abdômen
  { name: 'Abdominal Supra (Solo)', muscleGroup: 'Abdômen', createdBy: 'system' },
  { name: 'Abdominal na Polia', muscleGroup: 'Abdômen', createdBy: 'system' },
  { name: 'Elevação de Pernas', muscleGroup: 'Abdômen', createdBy: 'system' },
  { name: 'Prancha Isométrica', muscleGroup: 'Abdômen', createdBy: 'system' },
];

export async function seedExerciseCatalogIfEmpty() {
  if (getState().exerciseCatalog.some((item) => item.createdBy === 'system')) return;
  const seeded = SEED_EXERCISES.map((exercise) => ({ id: newId(), ...exercise }));
  update((s) => ({ ...s, exerciseCatalog: [...seeded, ...s.exerciseCatalog] }));
}

export async function listExerciseCatalog(): Promise<ExerciseCatalogItem[]> {
  return [...getState().exerciseCatalog].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function addCustomExercise(name: string, muscleGroup: string, uid: string) {
  const item: ExerciseCatalogItem = {
    id: newId(),
    name: name.trim(),
    muscleGroup: muscleGroup.trim() || 'Outro',
    createdBy: uid,
  };
  update((s) => ({ ...s, exerciseCatalog: [...s.exerciseCatalog, item] }));
  return item.id;
}
