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

### Modified
- **`src/app/page.tsx`:** Alterado para Client Component. Passa a ocultar a imagem de perfil do header para deslogados e o ícone de notificações fica escuro e inacessível. Substituída saudação "Olá, CARLOS" por "OLÁ, CLIENTE" quando deslogado. Alterado o cabeçalho de "Barbearia" para "IGOR BARBEARIA". Ocultou a seção de "Próximo Horário" para usuários deslogados. Botão "Agendar Corte" redireciona para `/login` quando deslogado na tentativa de agendamento.
- **`src/components/BottomNav.tsx`:** Ícones de menu desabilitados (escuros e sem clique), exceto "Início", quando o usuário não está autenticado.
- **`src/app/layout.tsx`:** Aplicação envolvida com `AuthProvider` e proteção de rotas com `RouteGuard`.
