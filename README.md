# Calculadora de Energia Mecânica — C++ → WebAssembly

Uma calculadora de energia mecânica (potencial, cinética e elástica) cujo
**núcleo de cálculo é C++ puro, compilado para WebAssembly**. O site é só a
casca visual: quem realmente calcula E = m·g·h, E = m·v²/2 e E = k·x²/2 é o
mesmo tipo de código que rodaria em um binário nativo.

> Projeto nasceu de um exercício de `switch/case` em C++ e evoluiu para
> explorar como reaproveitar lógica em C++ dentro do navegador sem reescrevê-la
> em JavaScript.

## Por que isso é interessante

- O **mesmo arquivo-fonte** (`src/physics_core.cpp`) compila de duas formas:
  como um executável de terminal (`make cli`) ou como módulo WebAssembly
  (`make wasm`) — a lógica física não é duplicada entre as duas versões.
- O JavaScript (`web/app.js`) não faz nenhuma conta: ele só chama as funções
  exportadas do WebAssembly via `cwrap` e desenha o resultado.
- O deploy é automático: um workflow de GitHub Actions compila o C++ com o
  Emscripten e publica em GitHub Pages a cada push na branch `main`.

## Estrutura

```
mech-calc/
├── src/
│   └── physics_core.cpp     # lógica física (fonte único, dois alvos de build)
├── web/
│   ├── index.html            # UI estilo prancheta de engenharia
│   ├── style.css
│   ├── app.js                 # ponte JS <-> WebAssembly + diagramas reativos
│   └── physics.js/.wasm       # gerados pelo build (não versionados)
├── .github/workflows/deploy.yml
└── Makefile
```

## Rodando localmente

Pré-requisito: [Emscripten](https://emscripten.io/docs/getting_started/downloads.html) instalado e ativado (`emsdk activate latest`).

```bash
make wasm     # compila src/physics_core.cpp -> web/physics.js + web/physics.wasm
make serve    # sobe http://localhost:8080 (o WASM exige HTTP, não abre com file://)
```

Também é possível compilar só a versão de terminal original, sem WebAssembly:

```bash
make cli
./calc
```

## Deploy

O workflow `.github/workflows/deploy.yml` compila o WASM em uma máquina do
GitHub Actions (onde o download do Emscripten não é bloqueado) e publica a
pasta `web/` em GitHub Pages a cada push em `main`. Não é necessário instalar
nada localmente para publicar — só habilitar GitHub Pages apontando para a
branch `gh-pages` no repositório.

## Fórmulas cobertas

| Fórmula | Expressão | Grandeza |
|---|---|---|
| Potencial gravitacional | E = m·g·h | massa, gravidade, altura |
| Cinética | E = m·v² / 2 | massa, velocidade |
| Elástica (mola ideal) | E = k·x² / 2 | constante elástica, deformação |

## Roadmap possível

- Adicionar mais fórmulas de mecânica (trabalho, momento linear, atrito).
- Trocar `cwrap` por Embind para expor uma classe `Formula` mais rica.
- Testes unitários do núcleo C++ com Catch2, rodando também em CI.

## Licença

MIT.
