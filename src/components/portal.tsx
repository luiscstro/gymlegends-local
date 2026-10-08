import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renderiza direto no <body>. Overlays fixos (modal, barra do cronômetro) precisam disso:
 * dentro da árvore da página, qualquer ancestral com transform/filter/stacking context
 * prende o position:fixed à página e o z-index fica abaixo da barra de navegação.
 */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
