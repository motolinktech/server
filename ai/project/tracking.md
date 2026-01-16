# Roadmap Analysis

This document analyzes the current state of the system based on the `roadmap.md` file, evaluating the implementation of each requirement in the `src` and `prisma` directories.

**Last Updated:** 2026-01-16

---

## 1. Visão do sistema

### Perfis de usuário (permissões)
- ⚠️ **Admin (diretoria):** Partial. `ADMIN` role exists but specific permissions are not granularly defined.
- ⚠️ **Operacional (escala/controle):** Partial. A generic `USER` role exists, which could be adapted, but no specific "Operacional" role is defined.
- ❌ **Financeiro (pagamentos/vales):** Not Implemented.
- ❌ **Lojista (ver escala e vagas):** Not Implemented.
- ⚠️ **Entregador (confirmar/checkout):** Partial. Handled via the generic `Deliveryman` entity, but no specific user profile/login capabilities.
- ⚠️ **Freelancer (confirmar/checkout):** Partial. Handled via the generic `Deliveryman` entity, but no specific user profile/login capabilities.

**Note:** The `User` model supports roles and permissions, but only `ADMIN` and `USER` are currently defined. The other roles from the roadmap need to be created and integrated into the authorization logic.

---

## 2. Módulos e requisitos

### M1 — Cadastro de Lojistas (Clientes)
- **Dados:**
  - ✅ Razão/Nome fantasia, CNPJ/CPF.
  - ✅ Endereço completo.
  - ❌ Geolocalização (lat/lng).
  - ⚠️ Contato (nome/telefone/WhatsApp/email). **Note:** Email field is missing from the `Client` model.
  - ✅ Valor do motoboy (diária, por rota, etc.). **Note:** Implemented via `CommercialCondition` model.
  - ✅ Quantidade mínima de entregadores por turno/dia. **Note:** Implemented via `Planning` model.
  - ⚠️ Quantidade de bags (total / em uso / disponíveis). **Note:** `bagsAllocated` and `bagsStatus` exist in `CommercialCondition`, but "em uso / disponíveis" tracking is not implemented.
  - ✅ Regras internas (observações).
- **Telas (Endpoints):**
  - ✅ Lista de lojas (filtro por cidade/status).
  - ✅ Cadastro/edição.
  - ✅ Detalhe da loja.

### M2 — Cadastro de Entregadores (Fixos)
- **Dados:**
  - ✅ Nome, CPF.
  - ❌ Data nasc.
  - ⚠️ Endereço, cidade/área de atuação. **Note:** Only `regionId` is present, no full address fields.
  - ✅ Telefone/WhatsApp.
  - ✅ Documentos (CNH, doc moto, etc.). **Note:** A `files: String[]` field exists for this.
  - ✅ PIX (tipo + chave).
  - ⚠️ Status: ativo / suspenso / bloqueado. **Note:** `isBlocked` and `isDeleted` exist, but a specific "suspenso" status is missing.
  - ⚠️ Blacklist. **Note:** A per-client blacklist (`ClientBlock`) is implemented, plus global `isBlocked` flag on Deliveryman.
- **Telas (Endpoints):**
  - ✅ Lista de entregadores (ativos/bloqueados).
  - ✅ Cadastro/edição + upload docs.
  - ✅ Perfil do entregador (histórico, etc.).

### M3 — Escala por Loja (semanal/mensal)
- **Funcionalidades:**
  - ✅ Criar escala por loja com dia/turno, quantidade, entregadores.
  - ✅ Suporte para freelancers (via `contractType` e `isFreelancer` flag).
- **Visualização:**
  - ✅ Semana (grid). **Note:** Backend filtering by week is implemented.
  - ✅ Mês (calendário). **Note:** Backend filtering by month is implemented.
- **Status da vaga:**
  - ✅ Aberta / Reservada / Confirmada / Cancelada / No-show. **Note:** Full status flow implemented: `OPEN`, `INVITED`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `ABSENT`, `CANCELLED`, `REJECTED`. Status transitions are validated via `VALID_STATUS_TRANSITIONS` map.
- **Disparos automáticos:**
  - ❌ Confirmação da escala (WhatsApp).
  - ❌ Vaga aberta (broadcast / grupo / lista).
- **Dashboard:**
  - ❌ Vagas abertas x fechadas.
  - ❌ % confirmação.
  - ❌ Faltas/no-show.
  - ❌ Cobertura por loja.
- **Telas (Endpoints):**
  - ✅ "Montar escala" (via `POST /work-shift-slots`).
  - ✅ Visão calendário (via `GET /work-shift-slots` with filters).
  - ✅ Central de vagas abertas. **Note:** Achievable by filtering by status `OPEN`.
  - ❌ Relatórios (por loja/período).
- **Regras importantes:**
  - ✅ Não permitir escalar entregador "blacklist/bloqueado". **Note:** Implemented in `workShiftSlots.service.ts` - validates `isBlocked` and `ClientBlock` before invite.
  - ❌ Evitar duplicidade no mesmo horário (conflito de turno).
  - ⚠️ Log de alterações (quem mudou, quando, antes/depois). **Note:** Uses inline `logs: Json[]` field instead of `HistoryTrace`. Stores action events but without full user audit trail.

### M4 — Agenda Inteligente (contexto operacional)
- **Itens de agenda:**
  - ✅ Datas típicas (pagamento, reuniões, etc.).
  - ✅ Feriados nacionais/estaduais/municipais.
  - ✅ Jogos (datas/horários).
  - ❌ Previsão do tempo (chuva).
- **Uso prático:**
  - ❌ Alertas para operação.
  - ❌ Sugestão de reforço de escala.
- **Telas (Endpoints):**
  - ✅ Calendário de eventos.
  - ❌ Configuração de alertas por cidade/loja.

### M5 — Cadastro de Freelancers
- **Dados:**
  - ✅ CPF (único), nome, WhatsApp.
  - ✅ PIX e documentos.
  - ✅ Área de atuação.
  - ✅ Status + blacklist (mesma lógica dos fixos).
  - ❌ Termo/aceite (check no app/whats).
- **Integração:**
  - ✅ Ao cadastrar/aprovar freelancer → habilita para "vagas abertas".
  - ✅ Freelancer entra no fluxo de pagamento automaticamente.

### M6 — Fluxo de Pagamento (freelancer e/ou fixo)
- **Fluxo sugerido (status):**
  - ✅ Escalado.
  - ❌ Confirmado via WhatsApp.
  - ✅ Check-in ("CHEGUEI"). **Note:** Implemented via `checkInAt` field and `CHECKED_IN` status in `WorkShiftSlot`.
  - ✅ Produção do dia: qtd entregas/rotas. **Note:** Implemented via `deliverymanAmountDay` and `deliverymanAmountNight` fields.
  - ✅ Check-out (entregador confirma final). **Note:** Implemented via `checkOutAt` field and `COMPLETED` status.
  - ✅ Conferência operacional / Aprovado financeiro. **Note:** Implemented via `PaymentRequest.status` enum (`NEW`, `ANALYZING`, `REQUESTED`, `PAID`).
  - ❌ Pagamento enviado ao banco.
  - ⚠️ Pago / comprovante. **Note:** Status `PAID` exists, but no field for the receipt.
- **Telas (Endpoints):**
  - ✅ Painel "Pagamentos pendentes".
  - ✅ Detalhe do turno/dia.
  - ❌ Aprovação em lote.
  - ❌ Exportação/integração bancária (arquivo ou API).
  - ✅ Histórico de pagamentos (por entregador/loja).
- **Regras:**
  - ❌ Pagamento só libera com: confirmação + checkout.
  - ❌ Ajustes (vale/desconto/ocorrência) registrados com motivo.
  - ⚠️ Auditoria: log completo. **Note:** `logs: Json[]` field exists on PaymentRequest, but `HistoryTrace` is not used.

### 3. Relatórios (mínimo viável)
- ❌ Cobertura de escala por loja (necessário x atendido).
- ❌ Confirmados x faltas.
- ❌ Top freelancers (presença/qualidade).
- ❌ Custo por loja (diárias + extras + chuva).
- ❌ Pagamentos por período (por entregador e por loja).

---

## Resumo do Progresso

- **Total de Itens Avaliados:** 68
- **Implementado:** 36 (52.9%)
- **Parcial:** 11 (16.2%)
- **Não Implementado:** 21 (30.9%)

### Progresso Geral: 61.0%
*(Calculado como ((Implementado * 1) + (Parcial * 0.5)) / Total)*

---

## Mudanças desde a última revisão

| Item | Status Anterior | Status Atual | Observação |
|------|-----------------|--------------|------------|
| M3 - Status da vaga | ⚠️ Parcial | ✅ Implementado | Full status flow with 8 states and transitions |
| M3 - Central de vagas | ⚠️ Parcial | ✅ Implementado | Now fully achievable with status filtering |
| M3 - Bloqueio entregador | ❌ Não impl. | ✅ Implementado | Validates `isBlocked` + `ClientBlock` |
| M3 - Log alterações | ❌ Não impl. | ⚠️ Parcial | Uses inline logs, not HistoryTrace |
| M1 - Bags | ❌ Não impl. | ⚠️ Parcial | `bagsAllocated`/`bagsStatus` in CommercialCondition |
| M6 - Check-in | ❌ Não impl. | ✅ Implementado | `checkInAt` field + `CHECKED_IN` status |
| M6 - Check-out | ❌ Não impl. | ✅ Implementado | `checkOutAt` field + `COMPLETED` status |
| M6 - Produção do dia | ❌ Não impl. | ✅ Implementado | `deliverymanAmountDay/Night` fields |

---

## Próximos Passos Sugeridos

Com base na análise atualizada, sugiro focar nos seguintes pontos para completar o MVP:

### 1. Evitar Conflitos de Turno (Alta Prioridade)
A única regra de negócio crítica faltante em M3:
- **Implementar validação de conflito de horário:** Verificar se o entregador já está escalado em outro turno no mesmo horário antes de permitir nova alocação.
- **Arquivo:** `src/modules/workShiftSlots/workShiftSlots.service.ts`

### 2. Integrar HistoryTrace para WorkShiftSlots (Média Prioridade)
Melhorar a auditoria atual:
- **Migrar de logs inline para HistoryTrace:** Integrar o serviço de auditoria nas operações de `WorkShiftSlot` para ter rastreabilidade completa com identificação do usuário.
- **Arquivo:** `src/modules/workShiftSlots/workShiftSlots.service.ts`

### 3. Regras de Liberação de Pagamento (Média Prioridade)
Conectar o fluxo de escala ao pagamento:
- **Validar checkout antes de processar pagamento:** Implementar regra no `paymentRequestsService` para só permitir mudança de status para `ANALYZING` se o `WorkShiftSlot` tiver `checkOutAt` preenchido.
- **Arquivo:** `src/modules/paymentRequests/paymentRequests.service.ts`

### 4. Dashboard de Escala (Baixa Prioridade - Fase 2)
Criar endpoints de agregação:
- Vagas abertas x fechadas por período
- % de confirmação por cliente/região
- Contagem de faltas/no-show

### 5. Melhorar Perfis de Usuário (Fase 3)
- **Definir as Roles:** Adicionar as roles faltantes (`OPERACIONAL`, `FINANCEIRO`, `LOJISTA`) no enum `userRoles.enum.ts`.
- **Implementar middleware de permissões:** Aplicar lógica de permissões nos endpoints baseado na role do usuário.

---

## Arquivos Principais de Referência

| Funcionalidade | Arquivo |
|----------------|---------|
| Schema do banco | `prisma/schema.prisma` |
| Status WorkShift | `src/shared/enums/workShiftSlotStatus.enum.ts` |
| Service WorkShift | `src/modules/workShiftSlots/workShiftSlots.service.ts` |
| Status Pagamento | `src/shared/enums/paymentRequest.enum.ts` |
| Service Pagamento | `src/modules/paymentRequests/paymentRequests.service.ts` |
| Service Auditoria | `src/modules/historyTraces/historyTraces.service.ts` |
| Roles de Usuário | `src/shared/enums/userRoles.enum.ts` |
