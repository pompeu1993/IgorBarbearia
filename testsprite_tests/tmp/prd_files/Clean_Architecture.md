# Clean Architecture (Arquitetura Limpa)

A **Clean Architecture**, criada por Robert C. Martin (Uncle Bob), tem como objetivo principal separar as responsabilidades do sistema em camadas circulares concêntricas. O princípio fundamental é a **Regra da Dependência**: dependências de código-fonte só podem apontar para "dentro". As camadas internas não devem saber nada sobre as camadas externas.

## 1. As Camadas

1. **Entidades (Enterprise Business Rules)**
   - O núcleo do sistema.
   - Contém as regras de negócio puras (ex: Tipagens, Interfaces, Lógicas matemáticas sem dependência de framework).
   - No projeto: `src/lib/*/types.ts` e funções puras em `utils.ts`.

2. **Casos de Uso (Application Business Rules)**
   - Orquestram o fluxo de dados para e a partir das entidades.
   - Ex: "Listar histórico do usuário", "Criar um agendamento".
   - No projeto: `src/lib/history/service.ts` (`loadUserHistory`).

3. **Adaptadores de Interface (Interface Adapters)**
   - Convertem dados do formato conveniente para Casos de Uso e Entidades para o formato conveniente para agentes externos (Web, Banco de dados).
   - No projeto: Os Route Handlers do Next.js (`src/app/api/history/route.ts`) e os Componentes React.

4. **Frameworks e Drivers**
   - A camada mais externa, composta por ferramentas, banco de dados, UI.
   - No projeto: O framework Next.js, o banco de dados Supabase (PostgreSQL), e a API do Asaas.

## 2. Como Aplicamos na Barbearia Igor

Nós estruturamos a rota de histórico (`/api/history`) seguindo estes princípios:

1. **Separação de Preocupações**: A lógica de buscar os dados no Supabase não está jogada no meio do código React.
2. **Injeção de Dependência**: A função `createHistoryGetHandler` recebe o repositório do banco de dados por injeção (`createRepository`). A regra de negócio não sabe *se* é Supabase, Prisma ou Mock — ela só chama o contrato `repository.fetchAppointments`.
3. **Isolamento da UI**: Componentes React (`HistoryCard`, `HistoryFilters`) apenas recebem os dados formatados e cuidam da apresentação. Eles não sabem como a paginação é calculada internamente no backend.

## 3. Diretrizes

- **Mantenha o framework longe do domínio**: Não importe bibliotecas pesadas do React ou do Next.js dentro dos seus arquivos de domínio (`src/lib/`).
- **Use Interfaces/Tipos**: Defina a "forma" dos dados esperados pelas funções. Se precisarmos trocar o Supabase por Firebase amanhã, apenas a camada de adaptação (Data Access) precisará ser reescrita.