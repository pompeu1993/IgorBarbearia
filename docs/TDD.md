# Test-Driven Development (TDD)

O **Test-Driven Development (TDD)**, ou Desenvolvimento Orientado a Testes, é uma metodologia onde os testes são escritos *antes* da implementação do código de produção.

## 1. O Ciclo TDD (Red - Green - Refactor)
O processo se baseia em repetições curtas de 3 etapas:
1. **Red (Vermelho)**: Escreva um teste automatizado que falhe, pois a funcionalidade ainda não existe.
2. **Green (Verde)**: Escreva a quantidade mínima de código de produção necessária para fazer o teste passar.
3. **Refactor (Refatorar)**: Melhore o código escrito (limpeza, legibilidade, performance) garantindo que o teste continue passando.

## 2. Ferramentas no Projeto
Utilizamos o **Vitest** como framework de testes devido à sua rapidez e integração nativa com ecossistemas modernos baseados em Vite e Next.js.

- Rodar os testes: `npm run test`
- Arquivo de configuração: `vitest.config.ts`

## 3. Exemplo Prático na Barbearia Igor
Quando fomos criar a funcionalidade de histórico de agendamentos (`/api/history`), o fluxo TDD foi:

**1. RED (Teste Falho):**
Criamos o arquivo `tests/history/history-route.test.ts` e escrevemos um teste que verificava se a rota retornava `401 Unauthorized` quando não houvesse usuário logado.
Ao rodar `npm run test`, o teste falhou pois a rota não existia.

**2. GREEN (Código Mínimo):**
Criamos o arquivo `src/app/api/history/route.ts` e inserimos um simples `if (!userId) return 401`. O teste passou.

**3. REFACTOR (Refatoração):**
Melhoramos a estrutura, separamos o roteador (Handler) da injeção de dependência (`createHistoryGetHandler`), permitindo injetar o `getCurrentUserId` e o `repository` via mocks para testes avançados.

## 4. Diretrizes de TDD para o Time
- **Comece pelas regras de negócio**: Antes de testar UI (React), teste as funções puras e utilitários em `src/lib/`.
- **Testes de Integração**: Escreva testes para as Rotas da API (`/api/*`) mockando o banco de dados (Supabase) ou chamadas externas (Asaas).
- **Cobertura Útil**: Não foque apenas em atingir 100% de cobertura. Foque em cobrir os cenários mais críticos: cálculo de horários livres, geração de pagamento, regras de reagendamento.