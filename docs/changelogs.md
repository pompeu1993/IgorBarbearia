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

### Modified
- **`src/app/login/page.tsx`:** O layout da tela de login foi inteiramente reconstruído para refletir com exatidão o "Premium" design estabelecido pelo novo mockup. O texto "Premium" foi alterado para "Igor Barbearia". O botão "Esqueci minha senha" foi reposicionado para baixo do input de senha e linkado corretamente para a nova tela de recuperação (`/recuperar-senha`).
- **`src/app/recuperar-senha/page.tsx`:** Nova tela construída seguindo fielmente o mockup UI premium. Ela invoca a Edge Function `send-reset-email` do Supabase bypassando os limites nativos de SMTP do Supabase e utilizando o Resend para enviar a recuperação de senha.
- **`src/app/page.tsx`:** Alterado para Client Component. Passa a ocultar a imagem de perfil do header para deslogados e o ícone de notificações fica escuro e inacessível. Substituída saudação "Olá, CARLOS" por "OLÁ, CLIENTE" quando deslogado. Alterado o cabeçalho de "Barbearia" para "IGOR BARBEARIA". Ocultou a seção de "Próximo Horário" para usuários deslogados. Botão "Agendar Corte" redireciona para `/appointments/new` independentemente do estado da sessão.
- **`src/components/BottomNav.tsx`:** Ícones de menu desabilitados (escuros e sem clique), exceto "Início", quando o usuário não está autenticado.
- **`src/app/layout.tsx`:** Aplicação envolvida com `AuthProvider` e proteção de rotas com `RouteGuard`.
