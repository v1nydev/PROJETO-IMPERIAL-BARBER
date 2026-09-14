# Arquitetura — Imperial Barber

## Escopo desta decisão

Este documento estabelece a fundação full-stack da Fase 2 sem implementar
banco, autenticação, painel administrativo ou agendamento persistente. Essas
entregas continuam pertencendo às etapas posteriores do roadmap.

## Estado atual preservado

- A rota pública `/` continua em `app/page.tsx` como uma landing page client-side.
- Serviços, profissionais, datas e horários continuam mockados na landing até a
  integração pública prevista na Etapa 24.
- O fluxo de reserva atual altera apenas estado React e não grava dados.
- Os estilos, animações, imagens, componentes e a ferramenta WebMCP
  `create_booking` permanecem inalterados.
- O projeto continua executando Next.js sobre Vinext/Vite e Cloudflare Workers.

## Fronteiras da aplicação

### Apresentação

`app/` contém as rotas e a composição visual. Componentes de rota não devem
espalhar consultas diretas ao Supabase. A rota `/` é pública. O namespace
`/admin/*` fica reservado para o painel e será protegido na Etapa 16.

### Domínio

`types/domain.ts` define os conceitos compartilhados pela aplicação:

- users;
- barbers;
- clients;
- services;
- appointments;
- barber_availability.

Os tipos de domínio usam nomes em camelCase e não representam, por si só, um
schema SQL. O mapeamento entre registros do banco e domínio será responsabilidade
dos adapters de dados.

Valores monetários são representados em centavos no domínio para evitar
operações com ponto flutuante. Datas e horários permanecem strings ISO até que as
regras de disponibilidade sejam implementadas.

### Acesso a dados

`lib/data/contracts.ts` é a fronteira entre os casos de uso e a infraestrutura.
O código da aplicação deve depender desses contratos. Implementações concretas
para consultas e mutações serão adicionadas somente nas etapas que introduzirem
as respectivas funcionalidades.

O comportamento esperado é:

```text
rota/componente -> caso de uso -> contrato de repositório -> adapter Supabase
```

Erros de infraestrutura não devem ser exibidos diretamente ao usuário. Cada
caso de uso deverá convertê-los em resultados ou erros compreensíveis para sua
interface.

### Supabase

Supabase será a fonte oficial de autenticação e dados persistentes da Fase 2.

- `lib/supabase/client.ts` cria um singleton para código executado no navegador.
- `lib/supabase/server.ts` cria um cliente por requisição usando cookies.
- `lib/supabase/env.ts` centraliza e valida a configuração pública.
- Nenhum desses módulos é importado pela landing nesta etapa, portanto a página
  atual continua funcionando mesmo antes de um projeto Supabase ser conectado.

As credenciais públicas identificam o projeto, mas a autorização real dependerá
de grants e Row Level Security. Uma chave secreta do Supabase nunca poderá ser
usada em Client Components nem em variáveis com prefixo `NEXT_PUBLIC_`.

## Autenticação e autorização

Supabase Auth será responsável pelas sessões administrativas na Etapa 16. A
arquitetura separa autenticação de autorização:

- autenticação confirma a identidade da sessão;
- autorização verifica o papel `admin` ou `barber` e o recurso solicitado;
- RLS e regras server-side formam a proteção efetiva;
- esconder links ou componentes nunca será considerado autorização.

O helper existente `app/chatgpt-auth.ts` pertence à infraestrutura opcional de
Sites e não será usado como autenticação administrativa da barbearia. Ele é
preservado para não alterar capacidades atuais.

`app/admin/layout.tsx` apenas reserva a fronteira das futuras rotas. Ele não cria
uma página, não autentica usuários e não expõe um painel incompleto.

## Variáveis de ambiente

Configuração local:

1. copiar `.env.example` para `.env.local`;
2. preencher a URL e a chave publicável obtidas no painel do Supabase;
3. nunca versionar `.env.local`;
4. cadastrar os mesmos valores no ambiente de build/hospedagem.

Variáveis preparadas:

| Nome | Exposição | Responsabilidade |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | URL pública do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador e servidor | chave de baixo privilégio sujeita a RLS |

Credenciais server-only serão adicionadas somente quando houver um caso de uso
concreto. Se forem necessárias, não poderão possuir o prefixo `NEXT_PUBLIC_`.

## D1 e Drizzle existentes

O starter contém `db/`, `drizzle/`, `drizzle.config.ts` e dependências Drizzle
para Cloudflare D1. Atualmente:

- `.openai/hosting.json` declara `d1: null`;
- `db/schema.ts` não contém tabelas;
- não há migrations;
- nenhuma rota ativa chama `getDb()`;
- `examples/d1/` é demonstração e está excluído do TypeScript.

Esse scaffold permanece intacto nesta etapa para evitar uma remoção arquitetural
desnecessária. Ele não integra o caminho oficial de dados da Fase 2. Uma remoção
futura deve ser explícita e ocorrer apenas quando não houver dependência de
infraestrutura ou hospedagem.

## Estrutura preparada

```text
app/
  page.tsx                    # landing pública preservada
  admin/
    layout.tsx                # fronteira reservada, sem página
lib/
  data/
    contracts.ts              # portas da camada de dados
  supabase/
    env.ts                    # configuração validada
    client.ts                 # cliente browser
    server.ts                 # cliente server por requisição
types/
  domain.ts                   # entidades e estados do domínio
```

## Fora do escopo da Etapa 13

- criar projeto, tabelas, constraints, índices ou policies no Supabase;
- gerar ou aplicar migrations;
- criar dados iniciais;
- implementar login, logout ou proteção de sessão;
- criar páginas do painel;
- criar CRUD de serviços, profissionais ou agendamentos;
- substituir os mocks da landing;
- implementar cálculo de disponibilidade;
- alterar D1/Drizzle;
- realizar deploy.

## Próximas decisões

As etapas seguintes deverão estender esta fundação incrementalmente:

- Etapa 14: schema Postgres, migrations, constraints e RLS;
- Etapa 15: seed demonstrativo;
- Etapa 16: autenticação e proteção de `/admin/*`;
- Etapa 24: conexão da landing aos dados e horários reais.

Essas decisões não são implementadas antecipadamente neste documento.
