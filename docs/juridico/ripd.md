# Relatório de Impacto à Proteção de Dados Pessoais (RIPD) — MY Skin AI

Versão 1 · 30/09/2026 · Base: LGPD, arts. 5º, XVII, e 38. Deve ser revisado a cada mudança relevante
do produto.

## 1. Identificação

- **Controlador:** [Nome da empresa], CNPJ [ ].
- **Encarregado:** [nome, e-mail].
- **Tratamento avaliado:** análise automatizada de fotos do rosto para avaliação cosmética da pele,
  acompanhamento, rotina e sugestão de produtos.

## 2. Descrição do tratamento

| Etapa | Descrição |
|---|---|
| Coleta | Fotos tiradas ou enviadas pelo usuário; questionário; cadastro |
| Pré-processamento no aparelho | Redução da foto, remoção de metadados, medidas de qualidade e mapas de cor |
| Armazenamento | Nuvem [fornecedor, região], criptografado |
| Análise | IA [fornecedor, região] recebe a foto atual e, se houver, a anterior; devolve notas e textos |
| Uso | Exibição ao usuário, evolução, rotina, produtos |
| Eliminação | Por exclusão do usuário, revogação do consentimento ou fim da conta |

**Titulares:** usuários adultos e familiares adultos cadastrados por eles.
**Volume estimado no lançamento:** [ ] usuários, [ ] fotos por mês.

## 3. Necessidade e proporcionalidade

- Foto do rosto é indispensável para a finalidade.
- Coleta mínima: sem localização, sem metadados, sem acesso à galeria inteira.
- Contexto do dia (sono, ciclo menstrual) é opcional.
- Comparação "mesma pessoa" usa apenas a foto anterior do próprio perfil, sem base de rostos e sem
  identificação.
- Idade aparente pode ser ocultada pelo usuário.

## 4. Riscos e medidas

| Risco | Probabilidade | Impacto | Medidas | Risco residual |
|---|---|---|---|---|
| Vazamento de fotos do rosto | Média | Alto | Criptografia, acesso restrito, sem fotos em repositórios de código, testes de segurança, plano de incidentes | Médio |
| Uso das fotos pelo fornecedor de IA para treino | Baixa | Alto | Contrato que proíbe treino; configuração de não retenção quando disponível | Baixo |
| Transferência internacional sem garantia | Média | Médio | Cláusulas-padrão da ANPD; informação no termo | Baixo |
| Fotos de terceiros sem consentimento | Média | Alto | Declaração no termo; no produto definitivo, conta própria para cada adulto; verificação de "mesma pessoa" | Médio |
| Fotos de menores | Baixa | Alto | Vedação nos termos; exclusão ao identificar | Baixo |
| Mistura de históricos (foto no perfil errado) | Média (ocorreu no teste) | Médio | Confirmação da pessoa antes do envio; verificação de "mesma pessoa"; mover ou excluir análise | Baixo |
| Resultado errado levar a dano (atraso em procurar médico, irritação por produto) | Média | Médio | Aviso de não diagnóstico; alertas para procurar dermatologista; ingredientes restritos a lista revisada; sem medicamentos | Médio |
| Impacto na autoimagem | Média | Médio | Linguagem acolhedora; sem mensagens de culpa; idade aparente pode ser ocultada | Baixo |
| Inferências de saúde usadas para outros fins | Baixa | Alto | Finalidade restrita; sem publicidade; sem venda de dados | Baixo |
| Viés por tom de pele | Média | Médio | Testes com fototipos IV a VI antes do lançamento; monitorar diferenças por fototipo | Médio |

## 5. Conclusão

O tratamento é necessário para a finalidade e pode ser realizado com risco residual aceitável se
forem implementadas as medidas acima, em especial: consentimento específico, contratos com os
fornecedores, criptografia, verificação da pessoa e testes com peles mais escuras. Os riscos
residuais médios (vazamento, fotos de terceiros, resultado errado, viés) devem ser reavaliados antes
do lançamento público.

## 6. Aprovação

Responsável: [nome, cargo] · Data: [ ]
