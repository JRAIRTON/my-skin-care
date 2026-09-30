# Análise de enquadramento regulatório e jurídico — MY Skin AI

30/09/2026 · Elaborado pelo Claude Code por decisão do projeto, sem advogado. Não é parecer jurídico
assinado. Antes do lançamento público, recomenda-se ao menos uma revisão pontual dos documentos
finais por profissional habilitado, porque normas e interpretações mudam.

## 1. Resumo

| Tema | Conclusão | Risco |
|---|---|---|
| ANVISA: software como dispositivo médico | Fora do enquadramento **se** o app mantiver finalidade cosmética e não avaliar doenças nem risco de câncer | Médio: depende das alegações feitas |
| LGPD: fotos do rosto e dados de pele | Dados pessoais sensíveis; exigem consentimento específico e destacado | Alto: é o risco central |
| LGPD: transferência internacional | Ocorre (IA e nuvem no exterior); exige mecanismo previsto no art. 33 | Médio |
| Menores de idade | Vedar uso por menores de 18 anos | Baixo, se vedado |
| Consumidor: assinatura | Informação clara, renovação automática destacada, cancelamento simples, arrependimento | Médio |
| Recomendação de produtos e preços | Informação, não publicidade; se houver afiliados, identificar | Baixo a médio |
| Lojas de aplicativos | Regras próprias para apps de saúde e para assinaturas | Médio |

## 2. ANVISA: o app é um dispositivo médico?

**Norma:** RDC nº 657/2022 (regularização de software como dispositivo médico, SaMD) e RDC nº 751/2022
(classificação de dispositivos médicos).

**Critério decisivo: a finalidade declarada.** Software é dispositivo médico quando se destina a
diagnóstico, prevenção, monitoramento ou tratamento de doença. Software de bem-estar ou estética,
sem finalidade médica, fica fora.

**Como o MY Skin AI se mantém fora:**
1. Finalidade declarada em todos os textos: avaliação visual **cosmética** da aparência da pele.
2. Não nomear doenças como conclusão (usar "aparência de"); não graduar acne, rosácea ou melasma
   como diagnóstico.
3. **Não avaliar pintas nem risco de câncer de pele.** Apps que fazem isso são regulados como
   dispositivo médico em outros países.
4. Alertas apenas sugerem procurar um profissional, sem dizer qual doença pode ser.
5. Não recomendar medicamentos (tretinoína, hidroquinona, antibióticos etc.).
6. Não usar em publicidade expressões como "diagnóstico", "detecta doenças", "trata acne",
   "clinicamente comprovado" (este último só com estudo que o comprove).

**Recomendação:** antes do lançamento, formalizar a consulta pelos canais de atendimento da ANVISA,
descrevendo a finalidade cosmética, e guardar a resposta.

## 3. LGPD (Lei nº 13.709/2018)

- **Dados sensíveis.** Foto do rosto usada para comparar se é a mesma pessoa pode configurar dado
  biométrico, e a avaliação da pele e o ciclo menstrual podem ser dados referentes à saúde
  (art. 5º, II). Tratar tudo como sensível.
- **Base legal:** consentimento específico e destacado, para finalidades específicas (art. 11, I).
  Deve poder ser revogado a qualquer momento (art. 8º, § 5º). Cadastro e cobrança da assinatura
  podem usar a execução de contrato (art. 7º, V).
- **Menores:** crianças exigem consentimento dos pais (art. 14). Recomendação: exigir 18 anos ou mais.
- **Fotos de terceiros:** quem cadastra familiares declara ter a autorização de cada um. No produto
  definitivo, cada adulto deveria ter a própria conta ou confirmar o consentimento.
- **Direitos do titular (art. 18):** acesso, correção, eliminação, portabilidade, informação sobre
  compartilhamento, revogação. Resposta ao pedido de acesso completo em até 15 dias (art. 19, II).
- **Encarregado (art. 41):** agentes de pequeno porte podem ser dispensados de indicar encarregado
  (Resolução CD/ANPD nº 2/2022), mas precisam de um canal de comunicação com o titular. Como o app
  trata dados sensíveis em escala, recomenda-se indicar um encarregado (Resolução CD/ANPD nº 18/2024).
- **Relatório de Impacto (art. 38):** recomendado por tratar dados sensíveis. Ver `ripd.md`.
- **Transferência internacional (art. 33):** a IA e a nuvem podem estar fora do Brasil. Usar as
  cláusulas-padrão contratuais da Resolução CD/ANPD nº 19/2024 nos contratos com os fornecedores, ou
  outro mecanismo do art. 33, e informar o titular.
- **Segurança e incidentes:** medidas técnicas (art. 46); incidente com risco relevante deve ser
  comunicado à ANPD e aos titulares (art. 48), no prazo da Resolução CD/ANPD nº 15/2024
  (3 dias úteis).
- **Sanções (art. 52):** advertência, multa de até 2% do faturamento limitada a R$ 50 milhões por
  infração, bloqueio ou eliminação dos dados.

## 4. Marco Civil da Internet (Lei nº 12.965/2014)

Provedor de aplicação com fins econômicos deve guardar os registros de acesso (data, hora, IP) por
6 meses, em sigilo (art. 15). Isso não inclui fotos nem dados de pele.

## 5. Consumidor

- **Código de Defesa do Consumidor:** informação clara sobre o serviço, suas limitações e o preço
  (arts. 6º, III, e 31); publicidade não enganosa (arts. 36 a 38); direito de arrependimento em
  7 dias para contratação fora do estabelecimento (art. 49); foro do domicílio do consumidor.
- **Decreto nº 7.962/2013 (comércio eletrônico):** identificação do fornecedor, resumo do contrato
  antes da contratação, atendimento eficaz e meio fácil de arrependimento.
- **Assinatura:** mostrar preço, periodicidade e renovação automática antes do pagamento; cancelamento
  tão simples quanto a contratação; avisar o fim do período grátis.
- **Limitação de responsabilidade:** em relação de consumo, cláusulas que excluam totalmente a
  responsabilidade são nulas. Os termos devem limitar expectativas (natureza cosmética, dependência
  da foto), não eximir de responsabilidade.

## 6. Recomendação de produtos e preços

- Sem venda e sem comissão: é informação, e deve deixar claro que preços são estimativas.
- Com links de afiliado: identificar como publicidade ou parceria, seguindo o Código Brasileiro de
  Autorregulamentação Publicitária (CONAR) e seu guia de publicidade por influenciadores digitais.
- Não fazer alegações terapêuticas sobre produtos cosméticos.

## 7. Lojas de aplicativos

- **Apple:** apps que possam fornecer dados de saúde imprecisos são revisados com mais rigor
  (diretriz 1.4.1); regras de privacidade e dados sensíveis (seção 5.1); assinaturas com renovação
  automática (3.1.2).
- **Google Play:** política para apps de saúde e declaração correspondente no Play Console; regras de
  assinaturas e de dados sensíveis.
- Em ambas: política de privacidade publicada e ficha de privacidade preenchida com o que é coletado.

## 8. O protótipo atual (teste com a família)

- Dados de 4 pessoas, com consentimento registrado no app para "o uso das fotos neste teste".
- As fotos são processadas pelo claude.ai (Anthropic, empresa estrangeira): há transferência
  internacional. Os participantes devem saber disso (ver `termo-participacao-teste.md`).
- Recomendação: colher o termo de participação dos 4 participantes, manter o app privado e excluir
  fotos e análises quando o teste acabar.

## 9. Pendências antes do lançamento

1. Definir o controlador (empresa, CNPJ) e o encarregado.
2. Contratos com fornecedores de nuvem e IA, com cláusulas de proteção de dados, proibição de uso das
   fotos para treino e cláusulas-padrão de transferência internacional.
3. Publicar termos de uso e política de privacidade e implementar o termo de consentimento no app.
4. Consulta formal à ANVISA sobre a finalidade cosmética.
5. Revisão pontual dos documentos finais por profissional habilitado (recomendado).
