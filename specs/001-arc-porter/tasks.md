# Arc Porter — Tarefas (tasks.md)

Feature: `001-arc-porter` · Depende de: `spec.md` e `plan.md` aprovados

Formato: `[ID] [P?] [História] Descrição`. `[P]` indica que a tarefa pode correr em paralelo com as vizinhas. Em cada regra, a tarefa de exemplos vem antes da tarefa de implementação e precisa falhar primeiro.

## Fase 0 — Preparação

- [ ] T001 Criar o repositório `arc-porter` com monorepo pnpm, TypeScript estrito, Vitest e licença MIT
- [ ] T002 [P] Configurar formatação e lint sem regras que exijam comentários
- [ ] T003 [P] CI: instalar, checar tipos, lint e testes em cada push e PR
- [ ] T004 Copiar `specs/001-arc-porter/` para o repositório

## Fase A — Núcleo e primeiras regras (US1)

- [ ] T010 Definir `Rule`, `Finding` e `Report` em `packages/core/src/finding.ts`
- [ ] T011 `parse.ts`: ler um arquivo com posições; erro por arquivo sem interromper os demais
- [ ] T012 Teste do parser com um contrato válido e um inválido
- [ ] T013 `engine.ts`: percorrer a árvore uma vez e despachar nós por tipo; ordenação fixa
- [ ] T014 Teste do motor com uma regra falsa
- [ ] T015 Utilitário de teste que roda `fixtures/<ID>/bad` e `good` e confere SC-001
- [ ] T020 [P] [US1] Exemplos AP001 (prevrandao e difficulty; uso fora de aleatoriedade no `good`)
- [ ] T021 [US1] Implementar AP001
- [ ] T022 [P] [US1] Exemplos AP004 (valor e token para `address(0)`)
- [ ] T023 [US1] Implementar AP004
- [ ] T024 [P] [US1] Exemplos AP006 (selfdestruct)
- [ ] T025 [US1] Implementar AP006
- [ ] T026 [P] [US1] Exemplos AP008 (sentinela EIP-7528)
- [ ] T027 [US1] Implementar AP008
- [ ] T030 [US1] `report/text.ts` com resumo, achados, aviso de não auditoria e data das fontes
- [ ] T031 [US1] Snapshot da saída em texto

**Ponto de verificação A:** quatro regras passam em SC-001 e a saída em texto está estável.

## Fase B — Regras restantes, formatos e configuração (US1, US2, US5)

- [ ] T040 Índice por arquivo: literais de endereço e chamadas de token por função
- [ ] T041 [P] [US1] Exemplos AP002 (msg.value com balanceOf na mesma função)
- [ ] T042 [US1] Implementar AP002
- [ ] T043 [P] [US1] Exemplos AP003 (endereço do USDC com escala 1e18)
- [ ] T044 [US1] Implementar AP003
- [ ] T045 [P] [US1] Exemplos AP005 (envio em laço; pull payment no `good`)
- [ ] T046 [US1] Implementar AP005
- [ ] T047 [P] [US1] Exemplos AP007 (WETH, WUSDC, deposit e withdraw)
- [ ] T048 [US1] Implementar AP007
- [ ] T049 [P] [US1] Exemplos AP009 (sweep do saldo nativo com token no mesmo contrato)
- [ ] T050 [US1] Implementar AP009
- [ ] T051 [P] [US1] Exemplos AP010, AP011, AP012 e AP013
- [ ] T052 [US1] Implementar AP010, AP011, AP012 e AP013
- [ ] T060 [US2] `report/json.ts` e snapshot
- [ ] T061 [US2] `report/sarif.ts`, snapshot e validação contra o esquema 2.1.0
- [ ] T062 [US5] `config.ts`: regras ligadas e desligadas, severidade, caminhos ignorados
- [ ] T063 [US5] Supressões com motivo obrigatório e seção "suprimidos" no relatório
- [ ] T064 [US5] Testes de configuração válida e inválida
- [ ] T070 Corpus: `arc-milestone-escrow` sem achado alto (SC-002)
- [ ] T071 [P] Corpus: `UniswapV2Router02` dispara AP007 (SC-003)
- [ ] T072 [P] Corpus: contratos dos apps de exemplo oficiais rodam sem falhar (SC-004)
- [ ] T073 Revisar falsos positivos do corpus e ajustar confiança ou regra, registrando cada ajuste

**Ponto de verificação B:** SC-001 a SC-004 atendidos.

## Fase C — CLI e GitHub Action (US1, US3)

- [ ] T080 [US1] `arc-porter check` com caminhos, globs e pastas ignoradas por padrão
- [ ] T081 [US1] `--format`, `--fail-on`, `--config`, `--output`, `--no-color`
- [ ] T082 [US1] Códigos de saída 0, 1 e 2 com testes
- [ ] T083 [US1] `arc-porter rules` e `arc-porter explain <id>`
- [ ] T084 [US1] Medir NFR-001 com 100 arquivos e registrar o resultado
- [ ] T090 [US3] `action.yml` com entradas e saídas do plano
- [ ] T091 [US3] Anotações por linha e falha conforme `fail-on`
- [ ] T092 [US3] Repositório de exemplo com um PR que falha e um que passa
- [ ] T093 README com instalação, primeiro uso em menos de 2 minutos (SC-005), tabela de regras e limites
- [ ] T094 Publicar a versão 0.1.0 em npm na conta pessoal do autor (ele cria a conta antes)

**Ponto de verificação C:** US1 a US3 aceitas.

## Fase D — Versão web (US4)

- [ ] T100 [US4] Empacotar o núcleo para navegador e conferir que não há chamada de rede
- [ ] T101 [US4] Página com editor, exemplos por regra e relatório
- [ ] T102 [US4] Explicação de cada regra com exemplo ruim, exemplo bom e link do doc
- [ ] T103 [US4] Política de conteúdo sem conexões externas e teste que a comprova
- [ ] T104 [US4] Publicar na conta Vercel do autor

**Ponto de verificação D:** US4 aceita.

## Fase E — Manutenção (FR-012)

- [ ] T110 `sources.ts` com URL, hash e data de cada página citada
- [ ] T111 `scripts/check-doc-sources.ts` lista regras afetadas quando uma página muda
- [ ] T112 Job semanal no CI que roda o script e avisa
- [ ] T113 Página de documentação por regra gerada a partir dos metadados

## Dependências

- Fase 0 antes de tudo.
- T010 a T015 bloqueiam todas as regras.
- T040 bloqueia AP002, AP003 e AP009.
- Fase B bloqueia C; C bloqueia D apenas no empacotamento do núcleo (T100).
- Fase E pode começar depois da fase B.

## Fora desta lista

US6 (regras para scripts fora da chain) e os detectores para Slither viram uma feature `002` depois do MVP.
