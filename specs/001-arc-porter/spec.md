# Arc Porter — Especificação (spec.md)

Feature: `001-arc-porter` · Estado: aprovado, com decisões registradas na seção 10 · Data: 13/11/2026
Autor: Manoel Lúcio (Nearxlabs)

Arc Porter é um analisador estático que lê contratos Solidity e aponta, antes do deploy, o que quebra ou se comporta diferente na Arc. Ele automatiza o checklist oficial "Port a contract to Arc".

Este documento diz **o quê** e **por quê**. O **como** está em `plan.md`; a ordem de execução, em `tasks.md`.

## 1. Princípios do projeto (constituição)

1. **Toda regra cita a fonte.** Uma regra só existe se apontar para uma página oficial dos docs da Arc. Sem fonte, não entra.
2. **Teste antes da regra.** Cada regra nasce de um par de exemplos: um contrato que deve disparar e um que não deve.
3. **Heurística declarada.** A análise é sintática. Cada achado informa severidade e confiança; nada é apresentado como certeza quando é suspeita.
4. **Sem rede, sem telemetria.** O código do usuário nunca sai da máquina dele, nem na versão web.
5. **Não é auditoria.** O relatório diz isso. A ferramenta não substitui `arc-forge test` nem uma revisão de segurança.
6. **Código sem comentários.** Nenhum comentário em código, em nenhuma linguagem. A intenção vai na mensagem de commit ou na documentação.

## 2. Problema

- Contratos Ethereum "rodam sem mudança na maioria dos casos" na Arc, mas os casos restantes custam dinheiro: USDC é o ativo nativo, com 18 casas decimais na interface nativa e 6 na ERC-20, sobre o mesmo saldo.
- Hoje a checagem é manual: um checklist de 8 passos nos docs.
- O Arc Foundry testa em execução, o que só pega o que os testes exercitam.
- Não foi encontrada ferramenta que faça essa leitura estática do código-fonte (busca em GitHub, web e docs em 13/11/2026).

Projeto vizinho, complementar: `arc-preflight` simula se uma transferência de USDC vai reverter antes de gastar gas. Ele olha uma transação; o Arc Porter olha o código-fonte.

Inspiração: Scout, da CoinFabrik, que faz detecção estática para contratos Soroban na Stellar.

## 3. Usuários

| Persona                                 | Necessidade                                            |
| :-------------------------------------- | :----------------------------------------------------- |
| Dev portando um contrato EVM para a Arc | Saber em minutos o que revisar, com o link do doc      |
| Time com CI                             | Barrar merge quando entra um padrão que quebra na Arc  |
| Recém-chegado à Arc                     | Colar um contrato numa página e entender as diferenças |
| Revisor ou auditor                      | Exportar achados em formato de máquina                 |

## 4. Histórias de usuário

Prioridade: P1 é o MVP; P2 entra em seguida; P3 fica registrado.

### US1 (P1) — Verificar um projeto pela linha de comando

Como dev, quero rodar um comando na raiz do projeto e ver os achados por arquivo e linha.

- **Dado** um diretório com arquivos `.sol`, **quando** rodo `arc-porter check`, **então** vejo cada achado com regra, severidade, confiança, arquivo, linha, explicação curta e link do doc.
- **Dado** um projeto sem achados no limite configurado, **então** o comando termina com código 0.
- **Dado** ao menos um achado no limite configurado ou acima, **então** termina com código 1.
- **Dado** um arquivo que não pode ser lido como Solidity, **então** o erro nomeia o arquivo, os demais são analisados e o código de saída é 2.

### US2 (P1) — Saída para máquinas

Como revisor, quero JSON e SARIF para integrar com outras ferramentas.

- **Dado** `--format json`, **então** a saída segue o esquema de `plan.md` e é idêntica entre execuções com a mesma entrada.
- **Dado** `--format sarif`, **então** o arquivo é aceito pelo upload de code scanning do GitHub.

### US3 (P1) — Barrar no CI

Como time, quero uma GitHub Action que anote o PR e falhe em achados graves.

- **Dado** um PR que introduz `block.prevrandao`, **quando** a Action roda, **então** o job falha e a linha aparece anotada.
- **Dado** `fail-on: high`, **então** achados médios e baixos aparecem sem falhar o job.

### US4 (P2) — Verificar pelo navegador

Como recém-chegado, quero colar um contrato e ver o relatório sem instalar nada.

- **Dado** um contrato colado, **então** o relatório aparece sem nenhuma requisição de rede com o código.
- **Dado** um exemplo pronto escolhido na página, **então** vejo os achados e a explicação de cada regra.

### US5 (P2) — Aceitar um achado com justificativa

Como mantenedor, quero suprimir um achado específico registrando o motivo.

- **Dado** uma supressão no arquivo de configuração com regra, arquivo e motivo, **então** o achado some da contagem e aparece em uma seção "suprimidos".
- **Dado** uma supressão sem motivo, **então** a configuração é rejeitada.

### US6 (P3) — Regras para scripts fora da chain

Como dev, quero avisos em scripts TypeScript de deploy, como preço de gas abaixo do piso.

## 5. Requisitos funcionais

- **FR-001** Analisar arquivos `.sol` a partir de caminhos ou globs, ignorando `lib/`, `node_modules/`, `out/` e `cache/` por padrão.
- **FR-002** Funcionar sem compilar o projeto e sem resolver imports.
- **FR-003** Cada achado contém: id da regra, título, severidade, confiança, arquivo, linha e coluna, trecho, mensagem, sugestão e URL do doc.
- **FR-004** Formatos de saída: texto, JSON e SARIF 2.1.0.
- **FR-005** Códigos de saída: 0 sem achados no limite, 1 com achados, 2 erro de uso ou de leitura.
- **FR-006** Limite configurável por `--fail-on` (low, medium, high); padrão high.
- **FR-007** Arquivo de configuração para ligar e desligar regras, mudar severidade, ignorar caminhos e registrar supressões com motivo.
- **FR-008** `arc-porter rules` lista todas as regras; `arc-porter explain <id>` mostra descrição, exemplo ruim, exemplo bom e fonte.
- **FR-009** O relatório sempre inclui o aviso de que não é auditoria e a data em que as fontes foram conferidas.
- **FR-010** A GitHub Action expõe `paths`, `fail-on`, `format` e `config`.
- **FR-011** A versão web roda o mesmo núcleo de regras no navegador.
- **FR-012** Uma rotina de manutenção detecta mudança nas páginas de docs citadas e avisa quais regras revisar.

## 6. Catálogo de regras do MVP

Severidade: impacto se o padrão for real. Confiança: quão seguro é o casamento sintático.

| ID    | Regra                     | O que dispara                                                                                            | Sev.  | Conf. | Fonte                                    |
| :---- | :------------------------ | :------------------------------------------------------------------------------------------------------- | :---- | :---- | :--------------------------------------- |
| AP001 | prevrandao-randomness     | Uso de `block.prevrandao` ou `block.difficulty`                                                          | Alta  | Alta  | evm-differences, porting passo 6         |
| AP002 | native-erc20-decimal-mix  | Mesma função usa `msg.value` ou `.balance` junto com `balanceOf`, `transfer` ou `transferFrom` de token  | Alta  | Média | stablecoin-native-model, porting passo 1 |
| AP003 | usdc-18-decimals          | Endereço `0x3600…0000` no arquivo junto com escala `1e18` ou unidade `ether` aplicada a valores de token | Alta  | Média | contract-addresses                       |
| AP004 | value-to-zero-address     | Envio de valor ou `transfer` de token para `address(0)` literal                                          | Alta  | Alta  | evm-differences, regras de transferência |
| AP005 | push-payment-loop         | `call{value:}`, `.transfer`, `.send` ou `transfer` de token dentro de laço                               | Média | Alta  | porting passos 2 e 8                     |
| AP006 | selfdestruct-usage        | Qualquer `selfdestruct`                                                                                  | Alta  | Alta  | evm-differences, SELFDESTRUCT            |
| AP007 | wrapped-native-pattern    | Identificadores `WETH`, `IWETH`, `WUSDC`, ou `deposit{value:}` seguido de `withdraw(uint)`               | Média | Média | porting passo 4                          |
| AP008 | native-asset-sentinel     | Literal `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`                                                     | Média | Alta  | stablecoin-native-model                  |
| AP009 | native-balance-sweep      | Envio de `address(this).balance` em contrato que também opera token ERC-20                               | Alta  | Média | porting passo 3                          |
| AP010 | zero-balance-check        | `balanceOf(...) == 0` usado como condição                                                                | Baixa | Baixa | porting passo 1                          |
| AP011 | blob-opcodes              | `blobhash(...)` ou `block.blobbasefee`                                                                   | Média | Alta  | evm-differences, tabela de opcodes       |
| AP012 | beacon-roots              | Endereço do contrato EIP-4788 `0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02`                               | Média | Alta  | evm-differences, tabela de opcodes       |
| AP013 | timestamp-strict-ordering | Comparação `block.timestamp >` contra timestamp guardado, usada para exigir bloco posterior              | Baixa | Baixa | evm-differences, comportamento de bloco  |

Regras previstas para depois do MVP (US6): `gas-price-below-floor` (piso de 20 Gwei), `confirmation-wait` (finalidade em uma confirmação), `usdc-variant-naming` (`USDC.e`, `wUSDC`).

## 7. Requisitos não funcionais

- **NFR-001** 100 arquivos analisados em menos de 2 segundos numa máquina comum.
- **NFR-002** Saída determinística: mesma entrada, mesma saída, mesma ordem.
- **NFR-003** Node 20 ou superior; sem dependência nativa.
- **NFR-004** Nenhuma chamada de rede em tempo de análise.
- **NFR-005** Licença MIT; pacote publicado em npm.

## 8. Fora do escopo

- Análise semântica com tipos resolvidos, fluxo de dados ou execução simbólica.
- Vyper, Yul puro e bytecode.
- Correção automática do código.
- Vulnerabilidades genéricas de Solidity que já são cobertas por Slither e Aderyn.
- Simulação de transações (papel do `arc-preflight` e do `arc-anvil`).

## 9. Critérios de sucesso

- **SC-001** 100% dos exemplos "ruins" de cada regra disparam; 0% dos exemplos "bons" disparam.
- **SC-002** `arc-milestone-escrow` termina com zero achados de severidade alta.
- **SC-003** O `UniswapV2Router02` dispara AP007.
- **SC-004** A ferramenta roda sem falhar sobre os contratos dos apps de exemplo oficiais da Arc.
- **SC-005** Um dev que nunca viu a ferramenta consegue rodar a primeira verificação em menos de 2 minutos seguindo o README.

## 10. Decisões tomadas em 13/11/2026

- **D1 Nome:** Arc Porter, pacote `arc-porter`. "Arc" é marca da Circle, como em outros projetos da comunidade.
- **D2 Supressões:** só pelo arquivo de configuração no MVP, com motivo obrigatório. Sem diretiva por comentário no código; reavaliar se usuários pedirem.
- **D3 Versão web:** hospedada na conta Vercel do autor.
- **D4 npm:** publicado numa conta pessoal do autor, a ser criada por ele antes da tarefa T094.
- **D5 Slither:** as mesmas regras serão oferecidas como detectores do Slither numa feature `002`, depois do MVP.

## 11. Fontes (conferidas em 13/11/2026)

- https://docs.arc.io/arc/tutorials/porting-contracts-to-arc.md
- https://docs.arc.io/arc/references/evm-differences.md
- https://docs.arc.io/arc/concepts/stablecoin-native-model.md
- https://docs.arc.io/arc/references/contract-addresses.md
- https://docs.arc.io/arc/references/gas-and-fees.md
- https://github.com/tushar598/arc-preflight
- Scout (CoinFabrik), diretório Lumenloop do ecossistema Stellar
