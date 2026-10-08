import { useEffect, useState } from 'react';

interface ViewportBox {
  height: number;
  offsetTop: number;
}

function read(): ViewportBox {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (vv) return { height: vv.height, offsetTop: vv.offsetTop };
  return { height: typeof window !== 'undefined' ? window.innerHeight : 0, offsetTop: 0 };
}

/**
 * Área realmente visível da tela. No iOS o teclado não reduz 100vh/100dvh — só o
 * visualViewport encolhe. Usado pra dimensionar sheets de tela cheia que têm inputs.
 */
export function useVisualViewport(enabled = true): ViewportBox {
  const [box, setBox] = useState<ViewportBox>(read);

  useEffect(() => {
    if (!enabled) return;
    const vv = window.visualViewport;
    const update = () => setBox(read());
    update();
    if (!vv) {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return box;
}
