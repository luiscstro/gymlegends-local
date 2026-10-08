# GymLegends (versão local)

Registro de treino para academia que roda no navegador do celular, **sem conta, sem servidor e de graça**. Seus dados ficam guardados só no seu aparelho.

**Usar agora:** https://luiscstro.github.io/gymlegends-local/

- Monte sua rotina semanal (Treino A, B, C…) com os exercícios e os dias da semana.
- Registre carga e repetições de cada série, vendo o que você fez da última vez.
- Use tipos de série: Aquecimento, Feeder, Work, Top e Cluster.
- Cronômetro de descanso automático depois de cada série.
- Histórico de sessões e gráfico de evolução de carga por exercício.
- Funciona offline e pode ser instalado na tela inicial como um app.

---

## Como usar

### 1. Instale no celular (recomendado)

Instalado, o app abre em tela cheia e o navegador tem menos chance de apagar seus dados.

- **iPhone (Safari):** abra o link → toque em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início**.
- **Android (Chrome):** abra o link → menu **⋮** → **Instalar app** (ou **Adicionar à tela inicial**).

> No iPhone, use sempre o ícone da tela de início. O Safari e o app instalado guardam dados separados.

### 2. Monte sua rotina

1. Abra a aba **Rotina** → **Novo treino**.
2. Dê um nome (ex.: *Treino A: Peito e Tríceps*) e marque os dias da semana.
3. Toque em **Adicionar** e busque o exercício. A busca ignora acentos: "triceps" encontra "Tríceps". Se ele não existir, toque em **Criar exercício "…"**.
4. Ajuste séries e a faixa de repetições (ex.: 3 × 8–12) e reordene com as setas.
5. **Salvar treino**.

### 3. Treine

1. Na aba **Hoje** aparece o treino do dia. Toque em **Iniciar treino**.
2. Em cada série, preencha **KG** e **REPS** e toque no **✓**.
   - A coluna **Anterior** mostra o que você fez da última vez nessa mesma série. Toque nela para repetir os valores.
   - O quadrado colorido à esquerda é o **tipo de série**. Toque para alternar entre A (Aquecimento), F (Feeder), W (Work), T (Top) e C (Cluster).
   - Errou? Toque no ✓ verde para desfazer a série.
3. Depois de cada série, o **cronômetro de descanso** começa sozinho (use −15 / +15 / Pular).
4. Ao terminar, toque em **Finalizar**.

### 4. Acompanhe a evolução

Na aba **Histórico**:
- **Sessões** lista os treinos finalizados, por mês;
- **Exercícios** abre o gráfico de carga máxima de cada exercício (1M, 3M, 6M ou Tudo).

### 5. Faça backup (importante!)

Como tudo fica só no seu aparelho, os dados **se perdem** se você limpar os dados do navegador, desinstalar o app ou trocar de celular. Na aba **Dados**:

- **Exportar backup** gera um arquivo `.json` com tudo. Salve no app Arquivos, no Google Drive ou mande para o seu e-mail. Faça isso com frequência, por exemplo toda semana.
- **Importar backup** restaura um arquivo exportado. **Substitui** os dados atuais do aparelho.
- **Trocar de celular:** exporte no antigo, envie o arquivo para o novo e importe lá.

---

## Perguntas frequentes

**Meus dados vão para algum servidor?**
Não. O app é um site estático (GitHub Pages). Tudo é salvo no `localStorage` do seu navegador e nunca sai do aparelho, a não ser que você exporte um backup.

**Dá para usar no computador e no celular ao mesmo tempo?**
Não automaticamente: cada aparelho tem seus próprios dados. Use exportar/importar para levar os dados de um para o outro.

**O cronômetro avisa com o app fechado?**
No Android/Chrome, a notificação funciona com o app em segundo plano. No iPhone, ela só aparece com o app aberto. É uma limitação do Safari.

**Quanto espaço ocupa?**
Muito pouco. Anos de treino cabem com folga no limite do navegador (cerca de 5 MB). O uso atual aparece na aba **Dados**.

---

## Rodar ou publicar a sua própria cópia

Precisa de [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
git clone https://github.com/luiscstro/gymlegends-local.git
cd gymlegends-local
npm install
npm run dev        # abre em http://localhost:5173
```

Outros comandos:

```bash
npm test           # testes unitários
npm run lint       # verificação de código
npm run build      # build de produção em dist/
```

**Publicar de graça no GitHub Pages (com um fork):**
1. Faça um fork deste repositório.
2. No fork, vá em **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Faça qualquer push na branch `main` (ou rode o workflow **Deploy (GitHub Pages)** em **Actions**).
4. O app fica em `https://<seu-usuário>.github.io/<nome-do-repositório>/`.

### Stack

Vite, React 19, TypeScript, Tailwind CSS v4, React Router, motion, recharts e vite-plugin-pwa. Os dados ficam em `localStorage` (`src/lib/data/local-db.ts`).

## Contribuir

Issues e pull requests são bem-vindos. O fluxo (Issue → Branch → PR) está descrito em [AGENTS.md](AGENTS.md) e vale para pessoas e para agentes de IA.

## Licença

[MIT](LICENSE)
