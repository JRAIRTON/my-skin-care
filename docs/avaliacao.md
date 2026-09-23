# Avaliação de viabilidade — MY Skin AI (spec v3.0)

## Viabilidade por módulo

| Módulo | Viabilidade | Observação |
|---|---|---|
| Captura guiada / qualidade | Alta | Métricas de imagem no aparelho; no app nativo, MediaPipe Face Landmarker para distância e ângulo em tempo real. |
| Fotoanálise / Skin Score | Média-alta | IA de visão com rubrica fixa + foto anterior como referência. Variação de luz é o maior risco. |
| Evolução, rotina, lembretes | Alta | Sem risco técnico. |
| Pesquisa de preços | Média | Sem API pública em Zoom/Buscapé/Google Shopping; produção exige serviço pago (ex.: SerpAPI) ou afiliados. |
| Assinatura | Alta (no app nativo) | Via App Store / Google Play Billing (RevenueCat simplifica). |

## Riscos

1. **Consistência do score** — iluminação costuma pesar mais que mudança real. Mitigações: guia de foto, checagem de qualidade, foto anterior enviada junto, rubrica fixa, faixa de ±5 pontos tratada como ruído.
2. **Regulação** — software que avalia condição de saúde pode ser dispositivo médico (ANVISA, RDC 657/2022). Manter enquadramento cosmético; não analisar pintas/lesões; encaminhar ao dermatologista.
3. **LGPD** — foto do rosto é dado biométrico (dado sensível): consentimento explícito, finalidade, exclusão, criptografia.
4. **Viés por tom de pele** — testar com fototipos variados.

## Melhorias sugeridas (com base em apps existentes)

Referências: Neutrogena Skin360, La Roche-Posay SpotScan, L'Oréal Skin Genius, Haut.AI, TroveSkin, Miiskin, Skin Bliss, YouCam.

1. Foto "fantasma" sobreposta na câmera para alinhar com a anterior (Miiskin, Trove).
2. Primeira análise grátis e paywall depois (a spec põe a assinatura antes da primeira foto). Plano anual.
3. Score com nível de confiança e acompanhamento semanal, não diário.
4. Diário de hábitos (sono, água, ciclo, estresse, clima/UV) correlacionado com o score (Trove).
5. Recomendação por ingrediente antes da marca + alternativas mais baratas equivalentes (Skin Bliss).
6. "Meus produtos": rotina com o que a pessoa já tem, alerta de combinações ruins (retinol + ácidos).
7. MVP só com rosto; corpo/celulite em fase 2.
8. Links de afiliado identificados como receita complementar (decisão de negócio).
9. Encaminhamento para teledermatologia quando houver alerta.

## O que o protótipo já cobre

Perfis por familiar com consentimento, upload, checagem de qualidade, análise por IA com rubrica,
Skin Score, alertas, comparação com a foto anterior, gráfico de evolução (15/30/60/90 dias),
antes/depois com slider, rotina manhã/noite/semanal com checklist e histórico de 7 dias,
ingredientes, produtos com separação recomendação × preço, preço por ml/g e links para Google Shopping,
Mercado Livre, Amazon e Zoom. Itens 3, 4 e 5 das melhorias já estão parcialmente no protótipo.

Fora do protótipo: câmera ao vivo, assinatura/pagamento, lembretes push, busca de preço em tempo real.
