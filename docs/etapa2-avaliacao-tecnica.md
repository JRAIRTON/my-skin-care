# Etapa 2 — Avaliação técnica (substituta da revisão por dermatologista)

Data: 30/09/2026. Por decisão do projeto, não foi contratado dermatologista. Esta avaliação foi
feita pelo Claude Code, aplicando às fotos as escalas clínicas que um dermatologista usaria.

**Limite desta avaliação.** Quem avalia é o mesmo sistema que gerou as notas da IA. Por isso ela
**não mede concordância com um especialista independente** e não substitui validação clínica. O que
ela entrega: revisão do método contra escalas reconhecidas, identificação de erros sistemáticos e as
correções aplicadas ao protótipo.

## Método

Para cada pessoa foi dado um **grau clínico de 0 a 4** por categoria (0 = ausente; 1 = leve;
2 = moderado; 3 = evidente; 4 = intenso), usando como referência:

| Categoria | Referência |
|---|---|
| Rugas e linhas | Glogau e escala fotonumérica de Griffiths |
| Vermelhidão | Clinician's Erythema Assessment (CEA, 0 a 4) |
| Hidratação | Overall Dry Skin Score (ODS, 0 a 4) |
| Firmeza | Escalas fotonuméricas de flacidez (0 a 4) |
| Demais | Descritores de grau definidos no Método MY Skin v1 |

Cada grau corresponde a uma faixa de nota: 0 → 90–100; 1 → 75–89; 2 → 60–74; 3 → 40–59;
4 → abaixo de 40. A nota da IA (média das fotos com a mesma luz) foi comparada com essa faixa.

## Avaliação clínica por pessoa

| | aron (39) | airton (41) | meiri (36) | fernanda (40) |
|---|---|---|---|---|
| Fototipo estimado (Fitzpatrick) | III a IV | III | II | II a III |
| Glogau | II (linhas dinâmicas leves) | II | I a II | II |
| Eritema (CEA) | 1 (perinasal) | 2 (bochechas e nariz) | 1 (nariz) | 2 (bochechas e nariz) |
| Ressecamento (ODS) | 0 | 0 | 0 | 0 a 1 |
| Oleosidade | leve na zona T | moderada na zona T | leve na testa | ausente |
| Acne | sem lesões ativas | sem lesões ativas | sem lesões ativas | 1 pápula inflamatória no queixo (quase limpa) |
| Lesões pigmentadas | nevo pequeno no queixo, simétrico e de cor homogênea | nevos pequenos na testa, aspecto regular | efélides (sardas) e nevos pequenos | efélides discretas |
| Indicaria consulta? | não; orientar observação do nevo | não | não; reforçar fotoproteção (fototipo II com efélides) | não |

Nenhuma das 4 pessoas tem sinal que justifique alerta. A IA também não emitiu alerta: **concordância
total em alertas** (4 de 4).

## Comparação com as notas da IA

Grau clínico → faixa esperada, e a nota média da IA. ✓ = dentro da faixa; ↓ = abaixo da faixa (IA
mais severa), com a distância até o limite da faixa.

| Categoria | aron | airton | meiri | fernanda |
|---|---|---|---|---|
| Textura | 1 · 74 ↓1 | 1 · 72 ↓3 | 1 · 76 ✓ | 1 · 76 ✓ |
| Poros | 2 · 66 ✓ | 2 · 66 ✓ | 1 · 76 ✓ | 1 · 76 ✓ |
| Rugas e linhas | 1 · 79 ✓ | 1 · 80 ✓ | 1 · 82 ✓ | 1 · 80 ✓ |
| Firmeza | **0 · 84 ↓6** | 1 · 78 ✓ | **0 · 82 ↓8** | 1 · 78 ✓ |
| Manchas | 1 · 76 ✓ | 1 · 78 ✓ | 1 · 76 ✓ | 1 · 78 ✓ |
| Tom e uniformidade | 1 · 73 ↓2 | 1 · 70 ↓5 | 1 · 74 ↓1 | 2 · 73 ✓ |
| Vermelhidão | 1 · 73 ↓2 | 2 · 69 ✓ | 1 · 73 ↓2 | 2 · 71 ✓ |
| Oleosidade | 1 · 71 ↓4 | 2 · 61 ✓ | 1 · 73 ↓2 | **0 · 80 ↓10** |
| Brilho | 1 · 70 ↓5 | 1 · 71 ↓4 | 1 · 76 ✓ | 1 · 72 ↓3 |
| Hidratação | **0 · 74 ↓16** | **0 · 76 ↓14** | **0 · 78 ↓12** | 1 · 76 ✓ |
| **Dentro da faixa** | 3 de 10 | 5 de 10 | 5 de 10 | 8 de 10 |

**Resultado: 21 de 40 notas (52%) dentro da faixa clínica. Nas 19 fora da faixa, a IA foi sempre mais
severa, nunca mais branda.**

## Achados

1. **Tendência ao centro.** Onde o sinal está ausente (grau 0), a nota deveria ser 90 ou mais, mas a
   IA deu entre 74 e 84. Os maiores desvios estão em hidratação (12 a 16 pontos), oleosidade ausente
   (10) e firmeza sem flacidez (6 a 8). Consequência: peles saudáveis ficam com Skin Score perto de
   75, sem espaço para mostrar pele boa, e a evolução fica comprimida.
2. **Nos sinais presentes, a IA acerta a faixa.** Poros, rugas, manchas e oleosidade moderada ficaram
   dentro da faixa em quase todos os casos.
3. **Pequeno viés de severidade** (1 a 5 pontos) em tom, vermelhidão, brilho e textura: notas logo
   abaixo do limite da faixa correta.
4. **Alertas e idade aparente** coerentes com a avaliação clínica.
5. **Fototipo:** nenhum cadastro informava o fototipo. A estimativa visual (II a IV) mostra que a
   amostra não tem peles mais escuras.

## Correções aplicadas ao protótipo (Método MY Skin v1)

1. **Grau primeiro, nota depois.** A IA passa a dar para cada categoria um grau clínico de 0 a 4,
   seguindo descritores escritos, e a nota precisa cair dentro da faixa daquele grau. O app corrige
   automaticamente uma nota fora da faixa. Isso ataca a tendência ao centro: grau 0 obriga nota 90 ou
   mais.
2. **Descritores por grau** para as 10 categorias, com as escalas clínicas acima (ver
   `metodo-myskin-v1.md`).
3. **Lista de ingredientes permitida** (ver `ingredientes-v1.md`): a IA passa a escolher dela, em vez
   de citar de memória.
4. **Lista de alertas revisada**, sem avaliar risco de câncer de pele (ver o método).

**Efeito esperado:** as mesmas pessoas passariam a ter Skin Score entre cerca de 80 e 86. As notas
novas não são diretamente comparáveis com as da etapa 1.

## O que continua em aberto

- **Validação independente.** Sem um avaliador humano, não há medida real de concordância.
  Alternativas de baixo custo: uma consulta avulsa de teledermatologia para avaliar as 16 fotos,
  residentes de dermatologia de uma faculdade, ou bases públicas de imagens com anotação de
  dermatologistas e fototipo (como SCIN e Fitzpatrick17k) para testar alertas e diversidade.
- **Fototipos IV a VI** continuam fora da amostra.
