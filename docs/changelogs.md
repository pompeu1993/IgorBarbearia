# Changelogs
Todas as modificações do sistema devem ser registradas aqui.

## [Unreleased]
### Added
- Inicialização da documentação do projeto (PRD, Changelogs, Mermaid, Prisma).
- Definição do escopo inicial baseado nos designs da pasta `telas app`.
- **Implementada a lógica de visualização para Usuário Deslogado:**
  - Criação de um mock context para autenticação (`AuthContext`).
  - Criação do componente `RouteGuard` para impedir acesso a rotas privadas.
  - Tela `/login` adicionada para simulação de Login/Cadastro.
- **Implementação Real de Backend (Supabase + PagSeguro + Resend):**
  - Criação de migração SQL (`profiles`, `services`, `appointments`) no Supabase MCP.
  - Criação do banco de dados na Postgres Function + Trigger Automático via SQL (`on_auth_user_created`) para auto-preencher a tabela `profiles` com `name` e `phone` do usuário ao se cadastrar.
  - Deploy da Edge Function `send-reset-email` integrada à API do **Resend** para disparar e-mails de recuperação de senha com link mágico de administrador e template HTML premium.
  - Autenticação real integrada via `AuthContext` manipulando sessões do Supabase.
  - Adicionadas credenciais de ambiente em `.env.local` incluindo Token do PagSeguro.
  - Tela de login `/login/page.tsx` refatorada e Tela de cadastro separada (`/cadastro/page.tsx`) com os dados Nome, E-mail, Telefone e Senha (design premium dark).
  - Rota de API POST `/api/checkout/route.ts` preparada para receber payload e gerar Ordens de pagamento no PagSeguro e salvar no banco de dados.
  - Rota de API POST `/api/checkout/confirm/route.ts` criada para receber a confirmação de pagamento simulando os Webhooks do PagSeguro (alterando o status do agendamento para `CONFIRMED` e `PAID`).
  - Preenchimento real da tabela de `services` no banco de dados para puxar o fluxo dinamicamente.
### Modified
- **`src/app/login/page.tsx`:** O layout da tela de login foi inteiramente reconstruído para refletir com exatidão o "Premium" design estabelecido pelo novo mockup. O texto "Premium" foi alterado para "Igor Barbearia". O botão "Esqueci minha senha" foi reposicionado para baixo do input de senha e linkado corretamente para a nova tela de recuperação (`/recuperar-senha`).
- **`src/app/recuperar-senha/page.tsx`:** Nova tela construída seguindo fielmente o mockup UI premium. Ela invoca a Edge Function `send-reset-email` do Supabase bypassando os limites nativos de SMTP do Supabase e utilizando o Resend para enviar a recuperação de senha.
- **`src/app/page.tsx`:** Dashboard inteiramente refatorada usando Client Component para buscar os dados de usuário diretamente da tabela `profiles` juntamente com o **Próximo Horário Agendado** futuro real validado diretamente do Postgres (`date >= now()`).
- **`src/components/BottomNav.tsx`:** Ícones de menu desabilitados (escuros e sem clique), exceto "Início", quando o usuário não está autenticado.
- **`src/app/layout.tsx`:** Aplicação envolvida com `AuthProvider` e proteção de rotas com `RouteGuard`.
- **`src/app/appointments/new/page.tsx`:** Refatorada para buscar dinamicamente todos os procedimentos e valores reais diretamente do Supabase (`table: services`). 
- **`src/app/appointments/new/datetime/page.tsx`:** Calendário complexo implementado do zero para varrer o mês atual e permitir seleção interativa. A seleção do dia busca e bloqueia horários específicos que já foram ocupados na tabela `appointments`.
- **`src/app/appointments/new/summary/page.tsx`:** A tela final do fluxo agora gera e consome callbacks virtuais de pagamentos para efetivar agendamentos e marcá-los oficialmente confirmados.
- **`src/app/history/page.tsx`:** Histórico consome agendamentos passados e futuros com join da tabela `services`. Permite o **cancelamento em tempo real** alterando o status no Supabase.
- **`src/app/profile/page.tsx`:** Busca o total bruto de agendamentos para gerar a estatística e possibilita a edição de `Nome` e `Telefone` atualizando a entry oficial em `profiles`.
