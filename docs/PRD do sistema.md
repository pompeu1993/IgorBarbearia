# PRD - Barbearia Igor Web App

## 1. Visão Geral do Produto
O aplicativo web da Barbearia do Igor é uma plataforma onde clientes podem agendar cortes de cabelo, visualizar seus agendamentos ativos, histórico e perfil, gerenciando sua experiência na barbearia ("Exclusive Barbershop").

## 2. Tecnologias
- **Frontend**: Next.js, React, Tailwind CSS
- **Estilização**: Tailwind (Dark mode, Acentos em Dourado `#D4AF37`, Fonte "Plus Jakarta Sans")
- **Ícones**: Material Symbols Outlined
- **Backend/Banco de Dados**: Supabase (PostgreSQL) com RLS e Auth nativo.
- **Pagamentos**: Integração com gateway PagSeguro.

## 3. Funcionalidades Principais
1. **Página Inicial (Dashboard)**:
   - Visualização rápida de agendamentos.
   - Botões de ações rápidas.
2. **Sistema de Agendamento**:
   - Seleção de dias, horários disponíveis e serviços.
3. **Meus Agendamentos**:
   - Lista de horários marcados.
   - Opção de cancelar ou remarcar.
4. **Histórico**:
   - Serviços já realizados.
5. **Autenticação / Perfil**:
   - Cadastro e login simples para usuários gerenciarem seus horários.

## 4. Design
O design segue o material de UI "Telas app", caracterizado por uma interface clean, modo escuro ("carbon-bg"), elementos translúcidos e minimalistas.
