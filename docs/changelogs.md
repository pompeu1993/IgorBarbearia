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
- **Implementação Real de Backend (Supabase + PagSeguro):**
  - Criação de migração SQL (`profiles`, `services`, `appointments`) no Supabase MCP.
  - Autenticação real integrada via `AuthContext` manipulando sessões do Supabase.
  - Adicionadas credenciais de ambiente em `.env.local` incluindo Token do PagSeguro.
  - Tela de login `/login/page.tsx` conectada diretamente ao `signInWithPassword` e `signUp` do Supabase.
  - Rota de API POST `/api/checkout/route.ts` preparada para receber payload e gerar Ordens de pagamento no PagSeguro e salvar no banco de dados.

### Modified
- **`src/app/login/page.tsx` e `RouteGuard.tsx`:** O fluxo de agendamento foi reestruturado. O usuário não autenticado agora pode entrar e escolher livremente Serviço, Data e Horário. O login apenas será acionado confirmando a intenção de pagar as seleções. Adicionada a capacidade de capturar o parâmetro da URL de retorno no ato da conversão (`redirect`).
- **`src/app/page.tsx`:** Alterado para Client Component. Passa a ocultar a imagem de perfil do header para deslogados e o ícone de notificações fica escuro e inacessível. Substituída saudação "Olá, CARLOS" por "OLÁ, CLIENTE" quando deslogado. Alterado o cabeçalho de "Barbearia" para "IGOR BARBEARIA". Ocultou a seção de "Próximo Horário" para usuários deslogados. Botão "Agendar Corte" redireciona para `/appointments/new` independentemente do estado da sessão.
- **`src/components/BottomNav.tsx`:** Ícones de menu desabilitados (escuros e sem clique), exceto "Início", quando o usuário não está autenticado.
- **`src/app/layout.tsx`:** Aplicação envolvida com `AuthProvider` e proteção de rotas com `RouteGuard`.
