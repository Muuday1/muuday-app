# Pacote de Revisão Jurídica UK

> **Status:** PRONTO PARA ENVIO AO ADVOGADO  
> **Data:** 2026-04-23  
> **Destinatário:** Founder → Advogado/Contador UK  
> **Escopo:** Revisão de todos os documentos legais após mudança de jurisdição para UK

---

## 1. Resumo da Mudança

A Muuday mudou a jurisdição contratual de **São Paulo, Brasil** para **England and Wales, courts of London**.

**Motivação:**
- Facilitar expansão internacional (México, Portugal, UK)
- Simplificar estrutura corporativa
- Reduzir complexidade fiscal e legal de operar sob múltiplas jurisdições

**O que mudou:**
- Cláusula de lei aplicável e foro em todos os termos
- Remoção de referências ao foro de São Paulo
- Manutenção de LGPD/LFPDPPP como legislação de proteção de dados aplicável

---

## 2. Documentos para Revisão

### 2.1 Termos de Uso da Plataforma (Usuários)

**Arquivo:** `app/termos-de-uso/page.tsx`  
**Idioma:** Português (Brasil)  
**Jurisdição atual:** England and Wales, courts of London  

**Pontos de atenção para o advogado:**
1. ✅ Jurisdição UK já aplicada (Seção 9)
2. ⚠️ **PENDENTE:** Termos não mencionam GDPR/UK DPA explicitamente — precisa de cláusula de proteção de dados UK?
3. ⚠️ **PENDENTE:** Não há menção a Consumer Rights Act 2015 (direitos do consumidor UK)
4. ⚠️ **PENDENTE:** Cláusula de resolução de disputas — apenas litígio ou também arbitration/mediation?
5. ⚠️ **PENDENTE:** Termos ainda em português — precisa de versão em inglês para usuários UK?

**Recomendação:** Criar versão bilíngue (PT/EN) com cláusula de "prevailing language".

---

### 2.2 Política de Privacidade

**Arquivo:** `app/privacidade/page.tsx`  
**Idioma:** Português (Brasil)  
**Jurisdição atual:** England and Wales  

**Pontos de atenção para o advogado:**
1. ✅ Menciona LGPD e GDPR (Seção 3)
2. ⚠️ **PENDENTE:** Não menciona UK Data Protection Act 2018 (DPA 2018) explicitamente
3. ⚠️ **PENDENTE:** Não há menção a ICO (Information Commissioner's Office) como autoridade de proteção de dados UK
4. ⚠️ **PENDENTE:** Não há cláusula de "Data Protection Officer" ou "UK Representative" (art. 27 GDPR)
5. ⚠️ **PENDENTE:** Transferências internacionais de dados — precisa de cláusula de Standard Contractual Clauses (SCCs)?
6. ⚠️ **PENDENTE:** Cookie policy é página separada (`/politica-de-cookies`) mas não é linkada na privacy policy

**Recomendação:** Adicionar DPA 2018, ICO reference, UK Representative clause, SCCs para transferências para Brasil/México.

---

### 2.3 Política de Cookies

**Arquivo:** `app/politica-de-cookies/page.tsx`  
**Idioma:** Português (Brasil)  

**Pontos de atenção para o advogado:**
1. ⚠️ **PENDENTE:** Precisa estar alinhada com UK PECR (Privacy and Electronic Communications Regulations)
2. ⚠️ **PENDENTE:** Banner de consentimento de cookies implementado? (verificar `components/cookies/`)
3. ⚠️ **PENDENTE:** Categorização de cookies (essential, analytics, marketing) documentada?

**Recomendação:** Revisar alinhamento com UK PECR + GDPR cookie consent requirements.

---

### 2.4 Termos do Profissional (4 documentos)

**Arquivo:** `lib/legal/professional-terms.ts`  
**Idioma:** Português (Brasil)  
**Jurisdição atual:** England and Wales, courts of London (Seção "Lei aplicável e foro")

**Documentos incluídos:**
1. **Platform Terms** — Termos de Uso da Plataforma
2. **Payment Terms** — Termos Financeiros (plano, cobrança, payout)
3. **Privacy Terms** — Política de Privacidade e Proteção de Dados
4. **Regulated Scope Terms** — Declaração de Conformidade Regulatória

**Pontos de atenção para o advogado:**
1. ✅ Jurisdição UK já aplicada em todos os 4 documentos
2. ⚠️ **PENDENTE:** Payment Terms menciona "Stripe Connect" como intermediador — precisa atualizar para UK single-region?
3. ⚠️ **PENDENTE:** Regulated Scope Terms menciona "conselhos profissionais no Brasil" — precisa generalizar para "regulatory bodies in the applicable jurisdiction"?
4. ⚠️ **PENDENTE:** Não há menção a UK Modern Slavery Act, Bribery Act 2010, ou outras leis UK específicas
5. ⚠️ **PENDENTE:** Termos de indemnidade e limitation of liability — precisam ser revistos sob common law UK?

**Recomendação:** Revisar limitation clauses sob UK Unfair Contract Terms Act 1977.

---

### 2.5 Termos de Uso para Clientes no México (Futuro)

**Status:** Não criado ainda  
**Previsão:** Sprint 6 (semanas 11-12)

**Nota:** Quando criar, manter jurisdição UK mas adaptar referências regulatórias para México (COFEPRIS, CONDUSEF, etc.).

---

## 3. Checklist de Revisão para o Advogado

### Jurisdição e Governing Law
- [ ] Confirmação: England and Wales é apropriada para operação internacional
- [ ] Courts of London: High Court ou County Court?
- [ ] Cláusula de "exclusive jurisdiction" ou "non-exclusive"?
- [ ] Arbitration clause (LCIA ou outra instituição)?

### Proteção de Dados (UK)
- [ ] UK GDPR + DPA 2018 compliance review
- [ ] ICO registration requirement
- [ ] UK Representative appointment (art. 27 GDPR)
- [ ] Standard Contractual Clauses (SCCs) para transferências BR→UK, MX→UK
- [ ] Privacy notice em inglês para usuários UK
- [ ] Data Processing Agreement (DPA) com fornecedores (Supabase, Stripe, Resend, Vercel)

### Consumer Protection (UK)
- [ ] Consumer Rights Act 2015 compliance
- [ ] Distance Selling Regulations (para serviços online)
- [ ] Cooling-off period (14 dias) — aplica-se a serviços digitais?
- [ ] Chargeback liability allocation

### Profissionais Regulados
- [ ] UK-specific regulatory references (GMC, SRA, ICAEW, etc.)
- [ ] Telehealth/telemedicine regulations UK (CQC, GMC guidance)
- [ ] Cross-border practice rules (profissional brasileiro atendendo cliente no UK)

### Pagamentos e Tributos
- [ ] VAT registration requirement (threshold £85k)
- [ ] Stripe UK compliance (Strong Customer Authentication — SCA)
- [ ] Professional payout: Trolley/PayPal UK terms
- [ ] Anti-money laundering (AML) policies

### Trabalho e Contratos
- [ ] Professional independent contractor status (IR35 UK rules)
- [ ] Self-employed vs employee classification
- [ ] Platform-to-professional contract: B2B or B2C?

### Outros
- [ ] Modern Slavery Act 2015 statement
- [ ] Bribery Act 2010 compliance
- [ ] Website Terms of Sale (se aplicável)
- [ ] Accessibility regulations (UK Equality Act 2010)

---

## 4. Documentos de Apoio Incluídos

| Documento | Localização | Status |
|-----------|-------------|--------|
| Termos de Uso (usuários) | `app/termos-de-uso/page.tsx` | ✅ Revisado por dev, pronto para advogado |
| Política de Privacidade | `app/privacidade/page.tsx` | ✅ Revisado por dev, pronto para advogado |
| Política de Cookies | `app/politica-de-cookies/page.tsx` | ✅ Revisado por dev, pronto para advogado |
| Termos do Profissional | `lib/legal/professional-terms.ts` | ✅ Revisado por dev, pronto para advogado |
| Migration de jurisdição | `db/sql/migrations/` (Sprint 1) | ✅ DB atualizado |

---

## 5. Próximos Passos

1. **Founder envia este pacote ao advogado UK**
2. **Advogado revisa e retorna com:
   - Lista de alterações necessárias
   - Versão draft em inglês (se necessário)
   - Checklist de compliance adicional
3. **Dev implementa alterações** (estimativa: 2-3 dias)
4. **Founder assina DPAs** com fornecedores (Supabase, Stripe, Resend, Vercel, Intercom, Sanity)
5. **ICO registration** (se obrigatório)

---

## 6. Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Advogado solicita rewrite completo dos termos | Média | Alto | Termos já estão em bom estado; mudança foi incremental |
| GDPR/DPA 2018 exige mudanças significativas na privacy policy | Alta | Médio | Privacy policy já menciona GDPR; precisa de refinamento |
| Consumer Rights Act exige cooling-off period | Média | Médio | Implementar política de cancelamento/reembolso UK-compliant |
| IR35 rules afetam classificação de profissionais | Baixa | Alto | Revisar contrato de prestação de serviços |
| VAT registration obrigatório | Média | Médio | Monitorar revenue threshold (£85k); registrar quando atingir |

---

> **Nota:** Este pacote foi preparado pelo time de engenharia. Não substitui assessoria jurídica. O advogado deve revisar todos os documentos e validar a adequação à legislação UK vigente.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
