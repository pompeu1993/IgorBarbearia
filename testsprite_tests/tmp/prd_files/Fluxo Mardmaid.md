# Fluxo e Arquitetura do Sistema

```mermaid
graph TD
    A[Usuário/Cliente] --> B[Frontend Next.js]
    B --> C{Autenticação}
    C -- Sim --> D[Dashboard Principal]
    C -- Não --> E[Tela de Login/Cadastro]
    E --> D
    
    D --> F[Meus Agendamentos]
    D --> G[Novo Agendamento]
    D --> H[Histórico]
    D --> I[Perfil]
    
    G --> J[Selecionar Serviço]
    J --> K[Selecionar Data e Hora]
    K --> L[Módulo de Checkout]
    L --> M2{Dados p/ Pagamento?}
    M2 -- Faltam --> N[Modal Perfil/CPF]
    N --> N2[Gerar PIX - Asaas]
    M2 -- Estão OK --> N2
    N2 --> F
    
    F --> M[Banco de Dados]
    G --> M
    H --> M
    I --> M
```
