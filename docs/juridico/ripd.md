# Relatório de Impacto à Proteção de Dados Pessoais (RIPD) — MY Skin AI

Versão 2 · 07/10/2026 (revisada para o app web com dados só no aparelho) · Base: LGPD, arts. 5º, XVII, e 38. Deve ser revisado a cada mudança relevante
do produto.

## 1. Identificação

- **Controlador:** Airton Carvalho Junior, pessoa física, Foz do Iguaçu (PR).
- **Encarregado:** Airton Carvalho Junior, myskincare.ia.sac@gmail.com.
- **Tratamento avaliado:** análise automatizada de fotos do rosto para avaliação cosmética da pele,
  acompanhamento, rotina e sugestão de produtos.

## 2. Descrição do tratamento

| Etapa | Descrição |
|---|---|
| Coleta | Foto tirada ou escolhida pelo usuário; perfil (tipo de pele, fototipo, objetivos, gestação) |
| Pré-processamento no aparelho | Redução da foto (re-codificação, que descarta os metadados) e medidas de qualidade |
| Armazenamento | Só no aparelho (IndexedDB do navegador ou do app); sem conta e sem cópia em nuvem |
| Análise | Servidor próprio na Cloudflare encaminha a foto atual à Anthropic (EUA), que devolve as notas; o servidor não guarda a foto |
| Uso | Exibição ao usuário, evolução, rotina e produtos (regras fixas, no aparelho) |
| Assinatura | Apple, Google e RevenueCat informam se a assinatura está ativa; sem dados de saúde |
| Eliminação | Pelo usuário (Ajustes → Apagar todos os dados) ou ao desinstalar o app |

**Titulares:** usuários adultos, cada um no próprio aparelho.
**Volume estimado nos 3 primeiros meses:** até 500 usuários e 2.000 fotos por mês (estimativa, revisar
com os números reais).

## 3. Necessidade e proporcionalidade

- Foto do rosto é indispensável para a finalidade.
- Coleta mínima: sem localização, sem metadados, sem acesso à galeria inteira.
- Contexto do dia (sono, ciclo menstrual) é opcional.
- Sem base de rostos, sem reconhecimento facial e sem identificação: a foto só é avaliada.
- Os dados ficam no aparelho do titular; o controlador não tem cópia das fotos nem das avaliações.

## 4. Riscos e medidas

| Risco | Probabilidade | Impacto | Medidas | Risco residual |
|---|---|---|---|---|
| Vazamento de fotos do rosto | Baixa | Alto | Fotos só no aparelho; servidor sem armazenamento; HTTPS; sem fotos em repositórios de código; plano de incidentes | Baixo |
| Uso das fotos pelo fornecedor de IA para treino | Baixa | Alto | Contrato que proíbe treino; configuração de não retenção quando disponível | Baixo |
| Transferência internacional sem garantia | Média | Médio | Cláusulas-padrão da ANPD; informação no termo | Baixo |
| Fotos de terceiros sem consentimento | Média | Alto | Proibição nos termos; um perfil por aparelho | Médio |
| Fotos de menores | Baixa | Alto | Vedação nos termos; exclusão ao identificar | Baixo |
| Perda de dados pelo titular (troca de celular, limpeza do navegador) | Média | Médio | Cópia de segurança em Ajustes; aviso nos termos; pedido de armazenamento persistente | Médio |
| Resultado errado levar a dano (atraso em procurar médico, irritação por produto) | Média | Médio | Aviso de não diagnóstico; alertas para procurar dermatologista; ingredientes restritos a lista revisada; sem medicamentos | Médio |
| Impacto na autoimagem | Média | Médio | Linguagem acolhedora; sem mensagens de culpa | Baixo |
| Inferências de saúde usadas para outros fins | Baixa | Alto | Finalidade restrita; sem publicidade; sem venda de dados | Baixo |
| Viés por tom de pele | Média | Médio | Testes com fototipos IV a VI antes do lançamento; monitorar diferenças por fototipo | Médio |

## 5. Conclusão

O tratamento é necessário para a finalidade e pode ser realizado com risco residual aceitável se
forem mantidas as medidas acima, em especial: consentimento específico, dados só no aparelho,
servidor sem armazenamento de fotos e testes com peles mais escuras. Pendências antes do lançamento
público:

- guardar os registros de acesso ao servidor por 6 meses (Marco Civil, art. 15); hoje o servidor não
  os guarda;
- confirmar nos termos comerciais da Anthropic o prazo de retenção dos pedidos e a proibição de
  treino com os dados;
- testar a análise com fototipos IV a VI (a amostra das etapas 1 e 5 não tinha);
- reavaliar os riscos residuais médios (fotos de terceiros, resultado errado, perda de dados, viés).

## 6. Aprovação

Responsável: Airton Carvalho Junior (titular e encarregado) · Aprovação: pendente de assinatura
