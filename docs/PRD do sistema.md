# PRD - Barbearia Igor Web App

## 1. Visão Geral do Produto
O aplicativo "Barbearia Igor" é uma plataforma Premium (focada no público masculino e com design Dark/Gold) desenvolvida para digitalizar e simplificar agendamentos de cortes de cabelo e tratamentos de barba. A ideia é eliminar o atrito de comunicação entre o barbeiro e o cliente via WhatsApp, oferecendo uma experiência de agendamento ágil, anônima na maioria dos horários, e com pagamento PIX antecipado apenas em horários de pico (antes das 09h ou a partir das 18h).

## 2. Personas e Casos de Uso
1. **O Cliente (Usuário final):** 
   - Quer acessar o aplicativo de forma rápida, escolher um horário e serviço, e confirmar.
   - Pode fazer agendamentos apenas informando o nome (sem necessidade de cadastro completo) para horários entre 09:00 e 17:00.
   - Para horários antes das 09:00 e após as 18:00, o sistema gera e exige pagamento Pix antecipado.
   - Após o primeiro acesso, o aplicativo mantém seus dados salvos localmente e realiza auto-login silencioso ("Ghost Login") para que o cliente consiga consultar seu histórico na próxima visita.
2. **O Administrador (Barbeiro / Igor):**
   - Quer gerenciar seu faturamento, cancelar clientes que não pagaram e ter previsibilidade da agenda sem lidar com "falsos agendamentos".
   - Acessa o painel usando um Código de Acesso rápido (`igor123778`), visualizando todos os horários e informações (data de agendamento, nome, serviço).

## 3. Principais Funcionalidades
### 3.1. Agendamento Fluido e Híbrido (Anônimo vs. Pix)
- O cliente pode escolher qualquer serviço cadastrado no sistema.
- Ao selecionar um horário, o sistema verifica a regra de negócios:
  - **Horários Padrão (09:00 às 17:00):** O cliente informa apenas o nome. O agendamento é salvo imediatamente como `CONFIRMED` e `FREE` no banco.
  - **Horários Premium (< 09:00 ou >= 18:00):** O cliente informa o nome e o sistema gera uma chave Pix Copia e Cola / QR Code via Asaas.
- O sistema envia um CPF fixo (`00483932159`) para a API do Asaas a fim de não criar atrito pedindo o CPF do usuário, agilizando o fluxo.
- **Ghost Authentication:** No backend, o sistema cria automaticamente uma conta Supabase "fantasma" vinculada àquele dispositivo. O frontend guarda um token no `localStorage` e loga o usuário no background, permitindo que ele acesse a aba Histórico depois.

## 2. Tecnologias e Arquitetura
- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Estilização**: Tailwind (Dark mode predominante, Acentos em Dourado `#D4AF37`, Fonte "Plus Jakarta Sans")
- **Ícones**: Material Symbols Outlined
- **Backend/Banco de Dados**: Supabase (PostgreSQL) com suporte a Row Level Security (RLS) e Supabase Auth.
- **Pagamentos**: Integração exclusiva com a API do **Asaas** para geração e confirmação de pagamentos via Pix dinâmico.
- **Testes**: Vitest (Unitários e Integração).

## 3. Estrutura de Rotas e Páginas (Frontend)

### Área Pública / Autenticação
- `/` - **Página Inicial (Dashboard)**: Redireciona ou mostra agendamentos rápidos dependendo do estado de autenticação.
- `/login` - Tela de autenticação de usuários (Email e Senha).
- `/cadastro` - Tela de registro de novos usuários.
- `/recuperar-senha` - Fluxo para envio de email de recuperação.
- `/update-password` - Tela para definição de nova senha pós-recuperação.

### Área do Cliente (Requer Autenticação)
- `/profile` - Gerenciamento de perfil do usuário (Nome, Telefone, CPF, Foto).
- `/appointments` - Listagem dos agendamentos futuros confirmados.
- `/appointments/new` - Início do fluxo de novo agendamento (Seleção de Serviço).
- `/appointments/new/datetime` - Seleção de data e hora (verificando horários já ocupados e dias de funcionamento).
- `/appointments/new/summary` - Resumo do pedido e **Integração com Asaas** (Geração do Pix, exibição do QR Code/Copia e Cola, e verificação automática de pagamento a cada 5 segundos com Polling).
- `/appointments/reschedule` - Tela para reagendamento de um horário existente (permitido até 24h de antecedência).
- `/history` - Histórico filtrado de agendamentos do cliente. Consome a API paginada de histórico exibindo exclusivamente serviços `CONFIRMED` e `COMPLETED` em ordem cronológica reversa, sem filtro de serviços, garantindo performance e clareza.

### Área Administrativa (Requer Perfil `admin`)
- `/admin` - Dashboard do administrador. Mostra agendamentos do dia em ordem cronológica.
- `/admin/agenda` - Visualização em formato de calendário, permitindo ver detalhes e gerenciar todos os agendamentos.
- `/admin/settings` - Configurações do sistema: alteração de preço de serviços, habilitar/desabilitar reagendamentos, configurar dias da semana de funcionamento e bloquear dias específicos no calendário.

## 4. Estrutura de Rotas de API (Backend / Next.js API Routes)
- `POST /api/auth/reset-password` - Rota auxiliar para disparo de e-mails de recuperação via Supabase.
- `POST /api/checkout` - Rota que se comunica com a API do **Asaas** (`api.asaas.com/v3`). Verifica se o cliente existe no Asaas (pelo CPF), cria o cliente se necessário, gera a cobrança Pix e o QR Code, e salva o agendamento no Supabase com status `PENDING`.
- `POST /api/checkout/cancel` - Rota para cancelar uma cobrança Pix gerada no Asaas caso o usuário desista.
- `POST /api/checkout/confirm` - Rota que verifica no Asaas o status do pagamento. Se pago, atualiza o status do agendamento no Supabase para `CONFIRMED` e dispara e-mail de notificação para o cliente via Resend.
- `POST /api/appointments/cleanup` - Endpoint chamado automaticamente via Cron Vercel a cada 10 minutos para alterar status de agendamentos PENDING maiores que 30 minutos para CANCELLED.
- `GET /api/history` - Endpoint robusto que retorna o histórico de agendamentos do usuário autenticado filtrando rigorosamente apenas `CONFIRMED` e `COMPLETED`. Suporta paginação (`page`, `pageSize`) e período (`from`, `to`). Garante que agendamentos passados sejam marcados automaticamente como `COMPLETED`.

## 5. Integração Supabase e Banco de Dados (PostgreSQL)

O sistema abandonou o Prisma/SQLite em favor do Supabase (PostgreSQL). Todo o acesso a dados é feito via Supabase Client (no cliente ou no servidor) com segurança baseada em RLS.

### Entidades Principais
1. **`profiles`**: Estende o Auth nativo do Supabase. Armazena `id` (referência ao auth.users), `name`, `phone`, `cpf`, `avatar_url`, e `role` (`'admin'` ou `'client'`).
2. **`services`**: Catálogo de serviços (`Corte Tradicional`, `Barba`, etc) com seus respectivos preços e duração.
3. **`appointments`**: Registro de agendamentos contendo `date`, `status` (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`), `payment_status`, `payment_id` (ID da transação no Asaas), `user_id` e `service_id`.
4. **`settings`**: Tabela de configuração global (Apenas ID 1) para gerenciar `allow_rescheduling`, `operating_days` (JSON array) e `disabled_dates` (JSON array).

### Row Level Security (RLS)
- **Profiles**: Usuários podem ler e atualizar apenas o próprio perfil (Regra `auth.uid() = id`). O fluxo possui "Retry Mechanism" e lida visualmente com a recusa de duplicação de CPF (Chave única).
- **Appointments**: Usuários podem ler, inserir e atualizar apenas os próprios agendamentos. Admins têm acesso total.
- **Services**: Leitura pública. Apenas admins podem atualizar (`role = 'admin'` ou e-mail explícito).
- **Settings**: Leitura pública. Apenas admins podem atualizar.

### Automações (Triggers)
- Criação automática de registro na tabela `profiles` quando um usuário se cadastra no Supabase Auth.
- Definição automática de `role = 'admin'` para o e-mail predefinido (`rafaelmiguelalonso@gmail.com`).

## 6. Fluxo de Pagamento Asaas
1. O agendamento é feito (escolha de serviço e horário).
2. Na tela de resumo (`/appointments/new/summary`), se o usuário não tem CPF salvo, um modal o solicita (obrigatório para o Asaas). O auto-preenchimento do CPF ocorre se ele já estiver cadastrado no perfil.
3. Ao salvar, atualiza a tabela `profiles`.
4. A API valida o CPF e payload (serviceId, date, price), verifica colisão de horário no banco de dados (concorrência), bloqueia tentativa excessiva via Rate Limit (Upstash Redis), busca ou cria o `Customer` no Asaas, cria a `Payment` (Pix) e obtém o `PixQrCode`.
5. Tratamento de exceção robusto (try/catch na conversão `.json()`) previne erros HTTP 500 no checkout quando a API do Asaas retorna páginas HTML ou 502 Bad Gateway.
6. A cobrança Pix é associada a um `id` externo para ser guardado no banco.
7. O frontend exibe o QR Code / Copia e Cola. O botão de confirmar verifica o status no Asaas chamando `/api/checkout/confirm`. Um intervalo automático (Polling de 5s) também verifica em background.
8. Quando o Asaas retorna `RECEIVED` ou `CONFIRMED`, a API atualiza o agendamento no Supabase, envia o email de confirmação e redireciona o cliente para a Home.
9. Se o cliente clicar em "Cancelar Agendamento", a rota `/api/checkout/cancel` é chamada para cancelar a cobrança no Asaas e ocultar o Pix na tela.
10. O fluxo de checkout é coberto por testes unitários (`checkout-api.test.ts` e `checkout-confirm-api.test.ts`) validando os payloads, as exceções e o sucesso.

## 7. Reagendamento e Cancelamento
- **Cancelamento**: Permitido apenas se o agendamento está pendente de pagamento. Agendamentos confirmados (pagos) não podem ser cancelados pelo cliente, apenas reagendados.
- **Reagendamento**: Permitido em até 24 horas antes do horário marcado (configurável pelo admin). O usuário seleciona um novo horário disponível e a data é atualizada no banco.

## 8. Funcionalidades Administrativas
O menu admin fica oculto para usuários comuns. O administrador visualiza um menu de rodapé diferente contendo Inicio, Agenda, Configurações e um ícone de "Sair" (Logout).
Na configuração, o admin define quais dias da semana a barbearia abre e seleciona dias específicos do mês para fechar (ex: feriados), regras que são aplicadas instantaneamente no calendário do cliente.

## 9. Manutenção e Regras de Negócio
- Agendamentos anteriores à data atual que possuam status `CONFIRMED` são automaticamente marcados como `COMPLETED` quando o histórico é consultado.
- Os preços dos serviços configurados pelo admin possuem validação estrita no frontend e backend para garantir um valor mínimo de R$ 2,00.
- A exibição de agendamentos na Home (`/`) e na Agenda do cliente (`/appointments`) filtra ativamente apenas agendamentos pagos (`CONFIRMED`), limitando-se a 3 resultados na tela inicial.
- Ao receber o webhook do Asaas, o sistema executa repasse (split) automático: subtrai uma taxa fixa de R$ 1,25 e transfere via PIX o valor líquido para a chave celular pré-configurada.

## 10. Skills do Workspace

O projeto mantém skills locais em `.trae/skills/` para padronizar análise, planejamento técnico, revisão de feedback e execução orientada por especificação. Essas skills fazem parte do fluxo de engenharia do workspace e devem ser consideradas fonte operacional de apoio para mudanças com impacto em múltiplos módulos, regras de negócio, integração com Supabase e fluxos de pagamento Asaas.

### Skills Disponíveis
- **`design-doc-creator`**: Cria design docs curtos com contexto, escopo, arquitetura, riscos e validação. Deve ser usada ao planejar funcionalidades, integrações ou refatorações relevantes.
- **`github-comment-resolver`**: Converte comentários de revisão em mudanças concretas com mapeamento de arquivos e validação. Deve ser usada ao resolver feedback vindo de PRs ou revisões formais.
- **`coupling-analysis`**: Analisa acoplamento, dependências ocultas e risco arquitetural entre páginas, APIs, componentes e módulos. Deve ser usada antes de refatorações ou ao investigar regressões.
- **`domain-analysis`**: Mapeia entidades, fluxos, invariantes e regras de negócio. Deve ser usada quando uma solicitação altera comportamento de agendamento, permissões, pagamentos, histórico ou administração.
- **`tlc-spec-driven`**: Define uma especificação técnica leve e rastreável antes da implementação. Deve ser usada em mudanças com critérios de aceitação claros, impacto em APIs, tabelas Supabase, rotas críticas ou regras de negócio sensíveis.
- **`skill-marketplace`**: Cataloga as skills disponíveis e recomenda qual aplicar primeiro conforme o tipo de demanda. Deve ser usada quando houver dúvida sobre qual skill melhor atende a tarefa.

### Diretriz da Skill TLC Spec Driven
Para este projeto, a skill `tlc-spec-driven` é a principal estratégia de execução controlada em mudanças sensíveis. A especificação criada por ela deve conter, no mínimo:
- **Objetivo** da mudança
- **Contexto de negócio**
- **Escopo** e **fora de escopo**
- **Critérios de aceitação** observáveis
- **Restrições**
- **Rotas, APIs e tabelas impactadas**
- **Arquivos impactados**
- **Estratégia de testes**
- **Plano de validação**

### Casos Recomendados de Uso
- Alterações no fluxo de Pix com Asaas
- Mudanças nas políticas de acesso e RLS do Supabase
- Ajustes no histórico paginado do usuário
- Regras de reagendamento, cancelamento e conclusão automática
- Evoluções do ambiente administrativo e permissões do perfil `admin`
