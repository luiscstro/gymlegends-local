# GymLegends (versão local): instruções para agentes

Estas regras valem para qualquer agente de IA (Claude, GPT, Gemini, Copilot etc.) e para pessoas que contribuam com o projeto. Siga-as em toda tarefa.

## O projeto

App web (PWA) de registro de treino, em português (pt-BR), **sem backend e sem login**. Os dados ficam no `localStorage` do navegador. O app é publicado como site estático no GitHub Pages, em `https://luiscstro.github.io/gymlegends-local/`. O repositório é **público**.

- **Stack:** Vite 7, React 19, TypeScript (strict, `verbatimModuleSyntax`: use `import type`), Tailwind CSS v4 (tokens em `src/index.css`), React Router 7, motion, recharts, vite-plugin-pwa.
- **Dados:** toda leitura e escrita passa por `src/lib/data/`. O `local-db.ts` é o único arquivo que toca o `localStorage`. As outras funções (`routines.ts`, `sessions.ts`, `history.ts`, `exercise-catalog.ts`) mantêm assinaturas assíncronas e retornam funções de cancelamento (`subscribe…`), como faria um backend remoto.
  - Toda alteração é imutável, via `update((state) => novoEstado)`.
  - `subscribeSelect` só notifica quando o pedaço observado muda.
  - **Mudou o formato dos dados?** Incremente o `SCHEMA_VERSION` e trate a migração em `normalize()`. Backups antigos (`importBackup`) precisam continuar funcionando.
- **Sem dados pessoais e sem segredos:** o repositório é público e o app não tem servidor. Nunca adicione chaves de API, analytics ou qualquer envio de dados do usuário para fora do aparelho sem uma Issue aprovada pelo dono.
- **Subcaminho do GitHub Pages:** o app roda em `/gymlegends-local/`. Use `import.meta.env.BASE_URL` (o Router já usa como `basename`) e caminhos relativos para arquivos de `public/`. Nunca use caminhos absolutos fixos como `/icons/...` em código.
- **Mobile primeiro:** precisa funcionar de 320px até desktop, sem rolagem horizontal. Respeite as safe areas (`--safe-top` e `--safe-bottom`) e o teclado do iOS (veja `useVisualViewport`). Alvos de toque têm no mínimo 44px. Modais vão dentro de `<Portal>`.

## Comandos

```bash
npm install
npm run dev          # servidor local
npm test             # testes unitários (Vitest + Testing Library)
npm run lint         # ESLint
npx tsc -b           # checagem de tipos
npm run build        # build de produção (tsc + vite)
```

Para testar o build no mesmo subcaminho do Pages: `VITE_BASE=/gymlegends-local/ npm run build && cp dist/index.html dist/404.html && VITE_BASE=/gymlegends-local/ npx vite preview`. No Git Bash do Windows, prefixe os comandos com `MSYS_NO_PATHCONV=1`.

## Fluxo de trabalho obrigatório: Issue → Branch → PR → Deploy

1. **Toda tarefa começa com uma Issue no GitHub**, antes de qualquer código. Use exatamente um destes labels:
   - `correção`: algo quebrado ou lento (bug).
   - `melhoria`: muda algo que já existe (UX, desempenho, visual, refatoração).
   - `nova função`: funcionalidade que ainda não existe.

   A Issue descreve o problema ou objetivo, como reproduzir (se for correção) e os critérios de aceite.
2. **Crie uma branch a partir de `main`**, nomeada pelo tipo e pelo número da Issue: `fix/<n>-descricao-curta`, `feat/<n>-descricao-curta` ou `chore/<n>-descricao-curta`.
3. **Nunca faça commit direto em `main`.** Use mensagens de commit em português, no imperativo, citando a Issue (ex.: `Adiciona filtro por grupo muscular (#12)`).
4. **Antes de abrir o PR**, rode `npm run lint`, `npx tsc -b`, `npm test` e `npm run build`. Tudo precisa passar. Toda correção ou função nova vem com teste unitário cobrindo o comportamento.
5. **Abra um Pull Request para `main`.** A descrição precisa ter:
   - `Closes #<n>`, que menciona a Issue e a fecha no merge (obrigatório);
   - o que mudou e por quê;
   - como foi testado.

   O CI (`.github/workflows/ci.yml`) roda lint, tipos, testes e build em todo PR. Só faça merge com o CI verde.
6. **O deploy é automático e só sai de `main`.** O merge dispara `.github/workflows/deploy.yml`, que roda os testes, faz o build e publica no GitHub Pages. Confira que o workflow terminou verde (`gh run list --workflow "Deploy (GitHub Pages)"`) antes de considerar a tarefa entregue, e comente no PR que a versão foi publicada.
7. **Uma Issue por tarefa.** Se, durante o trabalho, aparecer outro problema, abra uma nova Issue em vez de misturar no mesmo PR.

## Regras gerais

- Não use `npm audit fix --force`.
- Textos da interface ficam em pt-BR, com mensagens de erro que dizem o que aconteceu e o que fazer.
- Animações respeitam `prefers-reduced-motion`. Use só `transform` e `opacity`, sem animar layout.
- Mudou algo que o usuário final vê ou precisa fazer? Atualize o `README.md`, que é o manual de uso.
