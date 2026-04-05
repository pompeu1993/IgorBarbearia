# Roadmap do Sistema - Barbearia Igor 💈

Este documento serve como o norte arquitetural e funcional das próximas atualizações do sistema, garantindo alta escalabilidade, segurança (Zero Trust) e uma experiência perfeita tanto para o cliente quanto para o barbeiro.

***

## 🚀 Fase 1: Automação Financeira e Fechamento do Ciclo (Urgente)

O cliente gera o Pix e o sistema valida o pagamento em tempo real.

<br />

- [x] **Notificação de Confirmação (Resend)**: Usar a `RESEND_API_KEY` existente para enviar um e-mail de confirmação elegante ao cliente logo após a rota de `/confirm` validar o pagamento.
- [x] **Automação do Cleanup (Cron Job)**: Configurar um `vercel.json` com Cron (ou `pg_cron` no Supabase) para chamar a rota `/api/appointments/cleanup` a cada 10 minutos automaticamente.

***

##

***

#

***

## 🔒 Fase 4: Observabilidade e Performance (Nível Big Tech)

Quando a barbearia estiver com a agenda lotada e muito tráfego.

- [x] **Rate Limiting no Checkout**: Adicionado proteção com Redis (Upstash) para evitar que bots tentem gerar múltiplos Pix falsos de uma vez.
- [ ] **Monitoramento (Sentry ou Datadog)**: Rastrear erros silenciosos do frontend em produção. (*Requer configuração manual de credenciais rodando `npx @sentry/wizard@latest -i nextjs`*).
- [x] **Otimização de SEO (Next.js)**: Configurado Metatags e OpenGraph para a página principal da barbearia indexar bem no Google.

***

## 🔄 Fase 5: Pivot de Negócios (Agendamento Anônimo & Pix Condicional)

Implementações das novas regras de negócio para maximizar a conversão.

- [x] **Agendamento Anônimo ("Ghost Users")**: Permitir agendamentos apenas com o "Nome", criando contas invisíveis no Supabase atreladas ao dispositivo.
- [x] **Pagamento Condicional**: Cobrar Pix no Asaas apenas em horários de pico (antes das 09h ou a partir das 18h). Demais horários gratuitos.
- [x] **Simplificação Asaas**: Bypass do CPF via payload fixo (`00483932159`) para não exigir dados do usuário final.
- [x] **Login Administrativo Rápido**: Acesso ao painel `/admin` apenas com um código de acesso simples, mantendo segurança do Supabase.

