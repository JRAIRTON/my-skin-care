# Etapa 5 — Validação ampliada da IA

01/10/2026. Objetivo: medir a estabilidade **real** da análise e escolher o modelo. Na etapa 1, as
fotos foram avaliadas em sequência pelo mesmo analisador, que lembrava das notas anteriores; aqui cada
análise é uma chamada independente à API, como no app definitivo.

## O que é medido

| Medida | Como | Meta |
|---|---|---|
| Repetibilidade | A mesma foto analisada 3 vezes | Variação média do Skin Score até 3 pontos |
| Estabilidade entre fotos | Fotos da mesma pessoa com a mesma luz | Até 5 pontos |
| Efeito da luz | Foto com luz diferente × média das fotos com a mesma luz | Registrar |
| Acerto da faixa clínica (Método v1) | Notas comparadas com os graus da `etapa2-avaliacao-tecnica.md` | 70% ou mais (era 52%) |
| Custo e tempo por análise | Tokens reais de cada chamada | Registrar |

Modelos: Claude Haiku 4.5, Claude Sonnet 5 e Claude Opus 5. **Escolha:** o mais barato que cumpra as
três metas.

Escopo: 16 fotos da etapa 1 × 3 repetições × 3 modelos = 144 análises, estimadas em cerca de US$ 5
(limite de segurança padrão de US$ 8 no script). O pedido à IA contém só o Método v1 e as notas; rotina
e produtos não entram, porque não afetam a estabilidade e encareceriam o teste.

## Como rodar (numa sessão com `ANTHROPIC_API_KEY` configurada)

1. Ler o documento `etapa2/codigos-avaliacao-cega` do banco do app (códigos F01–F16 → pessoa, condição
   de luz e id da foto).
2. Baixar as 16 fotos do armazenamento do app pelos ids e salvar como `etapa5-dados/fotos/F01.jpg` …
   `F16.jpg`; salvar o mapa em `etapa5-dados/mapa.json` (`{"F01": {"pessoa": ..., "condicao": ...}}`).
3. Rodar:
   `python3 scripts/etapa5_validacao.py --fotos etapa5-dados/fotos --mapa etapa5-dados/mapa.json`
   (retoma de onde parou se for interrompido; para ao atingir o limite de gasto).
4. O relatório sai em `docs/etapa5-resultados.md`; os dados brutos ficam em `etapa5-dados/`, fora do
   repositório.

Teste sem custo: acrescentar `--simular` (respostas falsas, só para conferir o fluxo). A simulação grava em
`etapa5-dados/resultados-simulado.jsonl` e `etapa5-dados/relatorio-simulado.md`, sem tocar nos resultados reais.

## Limites

- Os graus clínicos de referência foram dados pelo Claude Code, não por dermatologista (ver etapa 2).
- A amostra continua sem fototipos IV a VI e sem pessoas abaixo de 30 ou acima de 50 anos.

## Situação em 02/10/2026

Executada: 144 análises (US$ 2,66) e mais 48 só com o Claude Sonnet 5.5 (US$ 0,68). Recomendação:
**Claude Sonnet 5.5**. Ver `etapa5-conclusao.md` e
`etapa5-resultados.md`.
