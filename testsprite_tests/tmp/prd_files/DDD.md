# Domain-Driven Design (DDD) na Barbearia Igor

O **Domain-Driven Design (DDD)** é uma abordagem de desenvolvimento de software que foca no "Core Domain" (o coração do negócio) e nas lógicas complexas do domínio. Ele baseia o design do sistema em um modelo contínuo de evolução em colaboração com os especialistas do domínio (no nosso caso, o gestor da barbearia).

## 1. Linguagem Ubíqua (Ubiquitous Language)
Todos os envolvidos no projeto (desenvolvedores, donos, clientes) devem usar a mesma linguagem. No sistema da Barbearia, estabelecemos os seguintes termos:
- **Agendamento (Appointment)**: A reserva de um horário para um serviço.
- **Serviço (Service)**: O trabalho realizado (ex: Corte Tradicional, Barba).
- **Cliente (Client/Profile)**: O usuário final que consome o serviço.
- **Administrador (Admin)**: O dono/gerente da barbearia.
- **Checkout/Pagamento (Payment)**: O processo de cobrança do serviço via Pix (Asaas).

## 2. Bounded Contexts (Contextos Delimitados)
O sistema pode ser dividido em contextos lógicos menores, onde os modelos fazem sentido sem interferir uns nos outros:

1. **Contexto de Catálogo (Catalog Context)**
   - Gerencia os `Services` (Serviços), preços e durações.
   - Domínio puramente administrativo.
2. **Contexto de Agendamento (Scheduling Context)**
   - Coração do sistema. Lida com `Appointments`, verificação de conflito de horários, regras de reagendamento e dias de funcionamento (`Settings`).
3. **Contexto de Pagamento (Billing Context)**
   - Lida exclusivamente com a comunicação com o Asaas, validação de CPF e status de transações.

## 3. Padrões Táticos no Projeto

- **Entidades (Entities)**: Possuem identidade única que persiste com o tempo.
  - Ex: `User` (id do auth), `Appointment` (id único do agendamento).
- **Objetos de Valor (Value Objects)**: Não possuem identidade única, importam apenas pelas suas propriedades.
  - Ex: O horário de um agendamento (`Date`), Preço formatado em Reais (`Price`).
- **Agregados (Aggregates)**: Grupos de Entidades e Value Objects que são tratados como uma única unidade de alteração de dados.
  - Ex: O fluxo de criação de Agendamento + Pagamento Asaas é um agregado. O agendamento só existe de fato se o pagamento for bem-sucedido ou gerado com sucesso.

## 4. Aplicação Prática (Diretrizes)
- **Isole o Domínio**: A regra de que um "agendamento só pode ser remarcado com 24h de antecedência" deve viver no domínio (funções isoladas em `src/lib/`), e não misturada diretamente no onClick do botão React ou dentro de chamadas diretas de banco de dados.