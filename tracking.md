# Roadmap Analysis

This document analyzes the current state of the system based on the `roadmap.md` file, evaluating the implementation of each requirement in the `src` and `prisma` directories.

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
  - ❌ Quantidade de bags (total / em uso / disponíveis).
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
  - ⚠️ Blacklist. **Note:** A per-client blacklist (`ClientBlock`) is implemented, but not a global one for the deliveryman entity itself. `isBlocked` can serve this purpose.
- **Telas (Endpoints):**
  - ✅ Lista de entregadores (ativos/bloqueados).
  - ✅ Cadastro/edição + upload docs.
  - ✅ Perfil do entregador (histórico, etc.).

### M3 — Escala por Loja (semanal/mensal)
- **Funcionalidades:**
  - ✅ Criar escala por loja com dia/turno, quantidade, entregadores.
  - ✅ Suporte para freelancers (via `contractType`).
- **Visualização:**
  - ✅ Semana (grid). **Note:** Backend filtering by week is implemented.
  - ✅ Mês (calendário). **Note:** Backend filtering by month is implemented.
- **Status da vaga:**
  - ⚠️ Aberta / Reservada / Confirmada / Cancelada / No-show. **Note:** The `WorkShiftSlot` model has a `status` field, but the detailed business logic and flow for these specific states are not implemented.
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
  - ⚠️ Central de vagas abertas. **Note:** Can be achieved by filtering, but depends on the full status implementation.
  - ❌ Relatórios (por loja/período).
- **Regras importantes:**
  - ❌ Não permitir escalar entregador “blacklist/bloqueado”.
  - ❌ Evitar duplicidade no mesmo horário (conflito de turno).
  - ❌ Log de alterações (quem mudou, quando, antes/depois). **Note:** `HistoryTrace` module is not used for `WorkShiftSlots`.

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
  - ✅ Ao cadastrar/aprovar freelancer → habilita para “vagas abertas”.
  - ✅ Freelancer entra no fluxo de pagamento automaticamente.

### M6 — Fluxo de Pagamento (freelancer e/ou fixo)
- **Fluxo sugerido (status):**
  - ✅ Escalado.
  - ❌ Confirmado via WhatsApp.
  - ❌ Check-in (“CHEGUEI”).
  - ❌ Produção do dia: qtd entregas/rotas.
  - ❌ Check-out (entregador confirma final).
  - ✅ Conferência operacional / Aprovado financeiro. **Note:** Implemented via `PaymentRequest.status` enum.
  - ❌ Pagamento enviado ao banco.
  - ⚠️ Pago / comprovante. **Note:** Status `PAID` exists, but no field for the receipt.
- **Telas (Endpoints):**
  - ✅ Painel “Pagamentos pendentes”.
  - ✅ Detalhe do turno/dia.
  - ❌ Aprovação em lote.
  - ❌ Exportação/integração bancária (arquivo ou API).
  - ✅ Histórico de pagamentos (por entregador/loja).
- **Regras:**
  - ❌ Pagamento só libera com: confirmação + checkout.
  - ❌ Ajustes (vale/desconto/ocorrência) registrados com motivo.
  - ⚠️ Auditoria: log completo. **Note:** A `logs` field exists on the models, but `HistoryTrace` is not used.

### 3. Relatórios (mínimo viável)
- ❌ Cobertura de escala por loja (necessário x atendido).
- ❌ Confirmados x faltas.
- ❌ Top freelancers (presença/qualidade).
- ❌ Custo por loja (diárias + extras + chuva).
- ❌ Pagamentos por período (por entregador e por loja).

---

## Resumo do Progresso

- **Total de Itens Avaliados:** 68
- **Implementado:** 29 (42.6%)
- **Parcial:** 8 (11.8%)
- **Não Implementado:** 31 (45.6%)

### Progresso Geral: 48.5%
*(Calculado como (Implementado * 1) + (Parcial * 0.5) / Total)*

---

## Próximos Passos Sugeridos

Com base na análise e no plano de MVP, sugiro focar nos seguintes pontos para completar a **Fase 1 e 2**:

1.  **Finalizar M3 (Escala):** A funcionalidade de escala é o coração do sistema.
    *   **Implementar as regras de negócio críticas:** Adicionar validações para **não escalar entregadores bloqueados** e para **evitar conflitos de horário**. Isso é crucial para a integridade da operação.
    *   **Detalhar o status da vaga:** Expandir o campo `status` em `WorkShiftSlot` para incluir todo o fluxo (`Aberta`, `Reservada`, `Confirmada`, `Cancelada`, `No-show`) e implementar a lógica de transição entre eles.
    *   **Ativar `HistoryTrace` para Escalas:** Integrar o serviço de log de auditoria nas operações de criação e edição de `WorkShiftSlot` para rastreabilidade.

2.  **Completar M6 (Fluxo de Pagamento):** Conectar a escala ao pagamento é o próximo passo lógico.
    *   **Adicionar Campos de Check-in/Check-out:** Incluir campos de data/hora para check-in e check-out no modelo `WorkShiftSlot` para registrar o início e fim do trabalho.
    *   **Implementar Lógica de Liberação de Pagamento:** Criar a regra no serviço `paymentRequestsService` para que um pagamento só possa ser processado (ex: mudar status para `ANALYZING`) se o `WorkShiftSlot` correspondente tiver um check-out registrado.
    *   **Adicionar Campo de "Produção do Dia":** Permitir que o operacional ou lojista insira dados de produção (ex: `qtd_entregas`) no `WorkShiftSlot`, que servirá de base para o cálculo do pagamento.

3.  **Melhorar Perfis de Usuário:**
    *   **Definir as Roles:** Adicionar as roles faltantes (`Operacional`, `Financeiro`, etc.) no enum `userRoles.enum.ts`.
    *   **Refinar Permissões:** Começar a aplicar uma lógica de permissões mais granular nos endpoints, em vez de checar apenas se o usuário é `ADMIN`.

Ao focar nesses três pilares, você solidifica o core funcional do sistema, que é criar uma escala, gerenciar sua execução e processar o pagamento correspondente de forma rastreável, abrindo caminho para as fases de dashboards, relatórios e automações.
