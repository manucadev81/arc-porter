# Arc Porter — Plano técnico (plan.md)

Feature: `001-arc-porter` · Depende de: `spec.md` aprovado · Data: 13/11/2026

## 1. Decisões técnicas

| Decisão             | Escolha                                 | Motivo                                                                                        |
| :------------------ | :-------------------------------------- | :-------------------------------------------------------------------------------------------- |
| Linguagem           | TypeScript, Node 20+                    | Mesmo núcleo roda na CLI, na Action e no navegador                                            |
| Leitura do Solidity | `@solidity-parser/parser`               | JavaScript puro, não exige compilar nem resolver imports (FR-002), roda no navegador (FR-011) |
| Repositório         | Monorepo pnpm                           | Núcleo, CLI, Action e web versionados juntos                                                  |
| Testes              | Vitest                                  | Rápido e com snapshots para as saídas                                                         |
| Empacotamento       | tsup (CLI e núcleo), ncc (Action)       | Um arquivo por alvo, sem dependência nativa                                                   |
| Web                 | Vite + React, página estática na Vercel | Sem servidor: o código colado não sai do navegador                                            |
| Formato de CI       | SARIF 2.1.0                             | Aceito pelo code scanning do GitHub                                                           |

Alternativa descartada para o MVP: detectores do Slither. Exigem Python e compilação do projeto, e não rodam no navegador. Ficam para a feature `002`, já decidida.

## 2. Estrutura

```text
arc-porter/
  packages/
    core/
      src/
        parse.ts
        engine.ts
        finding.ts
        rules/
          ap001-prevrandao-randomness.ts
          ...
          index.ts
        report/
          text.ts
          json.ts
          sarif.ts
        config.ts
        sources.ts
      fixtures/
        AP001/bad/*.sol
        AP001/good/*.sol
      test/
    cli/
      src/main.ts
    action/
      action.yml
      src/main.ts
  apps/
    web/
  specs/001-arc-porter/
  scripts/check-doc-sources.ts
```

## 3. Modelo de dados

```ts
type Severity = "low" | "medium" | "high";
type Confidence = "low" | "medium" | "high";

interface Rule {
  id: string;
  name: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  docUrl: string;
  description: string;
  suggestion: string;
  check(context: RuleContext): Finding[];
}

interface Finding {
  ruleId: string;
  severity: Severity;
  confidence: Confidence;
  file: string;
  line: number;
  column: number;
  snippet: string;
  message: string;
  suggestion: string;
  docUrl: string;
}

interface Report {
  tool: { name: "arc-porter"; version: string };
  sourcesVerifiedAt: string;
  disclaimer: string;
  summary: { files: number; high: number; medium: number; low: number; suppressed: number };
  findings: Finding[];
  suppressed: Finding[];
  errors: { file: string; message: string }[];
}
```

Ordenação fixa dos achados: arquivo, linha, coluna, id da regra (NFR-002).

## 4. Como uma regra funciona

1. `parse.ts` transforma cada arquivo em árvore sintática com posições.
2. `engine.ts` percorre a árvore uma vez e entrega a cada regra os nós que ela registrou interesse (por tipo de nó).
3. A regra devolve achados. Ela não lê arquivos nem faz rede.
4. O motor aplica configuração e supressões, ordena e monta o `Report`.

Contexto disponível para a regra: árvore do arquivo, texto-fonte, função e contrato que contêm o nó, e um índice por arquivo com literais de endereço e chamadas de token encontradas. Esse índice sustenta as regras que combinam dois sinais (AP002, AP003, AP009).

Limite assumido: sem tipos resolvidos, "chamada de token" é reconhecida pelo nome do membro (`transfer`, `transferFrom`, `balanceOf`, `approve`). Por isso a confiança dessas regras é média.

## 5. Contrato da CLI

```text
arc-porter check [paths...] [--format text|json|sarif] [--fail-on low|medium|high]
                 [--config <file>] [--output <file>] [--no-color]
arc-porter rules [--format text|json]
arc-porter explain <rule-id>
arc-porter --version
```

Códigos de saída: 0, 1 e 2 conforme FR-005.

Configuração (`arc-porter.json`):

```json
{
  "failOn": "high",
  "ignore": ["test/**", "script/**"],
  "rules": { "AP010": "off", "AP005": "high" },
  "suppressions": [
    { "rule": "AP006", "file": "src/Legacy.sol", "reason": "Contract is never deployed on Arc" }
  ]
}
```

Supressão sem `reason` invalida a configuração (US5).

## 6. GitHub Action

Entradas: `paths` (padrão `.`), `fail-on` (padrão `high`), `format` (padrão `sarif`), `config`.
Saídas: `findings-high`, `findings-medium`, `findings-low`, `report-path`.
Comportamento: gera o relatório, escreve anotações por linha e falha conforme `fail-on`. O upload de SARIF fica a cargo do usuário com a action oficial de code scanning, para não exigir permissão extra.

## 7. Versão web

- Editor com exemplos prontos por regra.
- O núcleo roda no navegador; não há backend.
- Cada achado abre a explicação da regra e o link do doc.
- Política de conteúdo sem conexões externas, para sustentar a garantia de privacidade.

## 8. Estratégia de testes

| Camada             | O que cobre                                                                                                                                     |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| Exemplos por regra | `bad/` deve disparar a regra; `good/` não pode disparar nenhuma (SC-001)                                                                        |
| Snapshots de saída | Texto, JSON e SARIF estáveis                                                                                                                    |
| Validação de SARIF | Esquema 2.1.0                                                                                                                                   |
| Corpus             | `arc-milestone-escrow` sem achado alto (SC-002); `UniswapV2Router02` dispara AP007 (SC-003); apps de exemplo oficiais rodam sem falhar (SC-004) |
| CLI                | Códigos de saída e mensagens de erro                                                                                                            |
| Configuração       | Regras desligadas, severidade alterada, supressão com e sem motivo                                                                              |

Ordem obrigatória: exemplos primeiro, regra depois (princípio 2).

## 9. Manutenção das fontes

`scripts/check-doc-sources.ts` baixa as páginas de docs citadas, compara com o hash guardado em `sources.ts` e lista as regras afetadas quando algo muda. Roda semanalmente no CI e abre um aviso; não altera regras sozinho. É a única parte do projeto que usa rede, e não faz parte da análise.

## 10. Riscos

| Risco                                      | Mitigação                                                                 |
| :----------------------------------------- | :------------------------------------------------------------------------ |
| Falsos positivos cansam o usuário          | Confiança exposta, `--fail-on high` por padrão, AP010 e AP013 como baixas |
| Docs da Arc mudam                          | Rotina da seção 9 e data das fontes no relatório                          |
| Parser não cobre sintaxe nova do Solidity  | Erro por arquivo sem derrubar a execução; teste com o corpus              |
| Confundirem com auditoria                  | Aviso em todo relatório e no README                                       |
| Sobreposição com ferramenta oficial futura | Regras portáveis para Slither na feature `002`                            |

## 11. Entregas por fase

| Fase | Entrega                                                                                    | Critério de pronto        |
| :--- | :----------------------------------------------------------------------------------------- | :------------------------ |
| A    | Núcleo com motor, 4 regras de alta confiança (AP001, AP004, AP006, AP008) e saída em texto | SC-001 para essas regras  |
| B    | Regras restantes, JSON, SARIF, configuração e supressões                                   | SC-001 a SC-004           |
| C    | CLI publicada e GitHub Action                                                              | US1 a US3 aceitas; SC-005 |
| D    | Versão web                                                                                 | US4 aceita                |
| E    | Rotina de fontes e documentação das regras                                                 | FR-012                    |

Estimativa do autor da spec, para uma pessoa: A 2 dias, B 3 dias, C 2 dias, D 2 dias, E 1 dia.
