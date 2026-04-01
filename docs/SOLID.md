# Princípios SOLID

**SOLID** é um acrônimo para cinco princípios de design de software orientado a objetos (ou funções/tipos modulares no TypeScript). Eles ajudam a criar sistemas mais escaláveis, manuteníveis e fáceis de entender.

## 1. [S] Single Responsibility Principle (Princípio da Responsabilidade Única)
*Uma classe, módulo ou função deve ter apenas um motivo para mudar.*

**Aplicação no projeto:**
- Em vez de termos um arquivo gigante (`page.tsx`) que faz o fetch do histórico, lida com paginação, filtra os dados e renderiza os cards, nós separamos:
  - `HistoryCard.tsx`: Apenas renderiza visualmente um agendamento.
  - `HistoryFilters.tsx`: Apenas lida com o formulário de filtros de busca.
  - `service.ts`: Apenas executa a regra de negócio do histórico.

## 2. [O] Open/Closed Principle (Princípio do Aberto/Fechado)
*Entidades de software devem estar abertas para extensão, mas fechadas para modificação.*

**Aplicação no projeto:**
- O utilitário que formata os dados de histórico (`normalizeHistoryRow` em `utils.ts`) está aberto para receber novas formatações de status ou de provedores sem que precisemos quebrar o componente da interface que já os consome.
- Se adicionarmos um novo gateway de pagamento além do Asaas, criamos uma nova classe/função que implementa a interface de pagamento, sem alterar o código principal de Checkout.

## 3. [L] Liskov Substitution Principle (Princípio da Substituição de Liskov)
*Objetos de uma superclasse devem ser substituíveis por objetos de suas subclasses sem quebrar a aplicação.*
*(No contexto do TypeScript: Abstrações e Mocks).*

**Aplicação no projeto:**
- Na API de histórico, temos o contrato `HistoryRepository`. No código de produção, injetamos a implementação que usa o Supabase. No ambiente de testes (Vitest), injetamos um "Mock" que simula o Supabase. A aplicação não quebra, pois o Mock respeita estritamente o contrato/tipagem estabelecido pelo `HistoryRepository`.

## 4. [I] Interface Segregation Principle (Princípio da Segregação de Interfaces)
*Clientes não devem ser forçados a depender de métodos que não usam.*

**Aplicação no projeto:**
- Evitamos criar uma interface "Deus" `IApp` gigante.
- Criamos tipos menores e específicos: `HistoryItem` para representar a visualização no Front, e `RawHistoryRow` para representar o retorno bruto do banco de dados Supabase. Assim, o componente React não é forçado a conhecer campos do banco de dados que não importam para a tela.

## 5. [D] Dependency Inversion Principle (Princípio da Inversão de Dependência)
*Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.*

**Aplicação no projeto:**
- A função de regras de negócio (`loadUserHistory` em `src/lib/history/service.ts`) não importa o `createClient` do Supabase (baixo nível) diretamente.
- Em vez disso, ela recebe o banco de dados através dos parâmetros `repository` (uma abstração baseada em Interface/Tipo). É a rota (`route.ts`) quem decide qual é o driver real de banco de dados e o repassa para o serviço. Isso facilita enormemente a realização de testes unitários rápidos.