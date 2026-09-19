# Arquitetura — Imperial Barber

## Visão geral

A Imperial Barber é uma aplicação full-stack executada em Cloudflare Workers por meio de Vinext/Vite. O frontend usa React e o App Router do Next.js; autenticação e persistência ficam no Supabase.

```text
Cliente web
├── /                         landing e fluxo de agendamento
├── /api/public/*             catálogo, disponibilidade e reservas
└── /admin/*                  painel autenticado
        │
        ▼
Aplicação Vinext / Next.js
├── Server Components
├── Server Actions
├── Route Handlers
└── camada de dados em lib/data
        │
        ▼
Supabase
├── Auth
├── PostgreSQL
├── RLS
└── RPCs transacionais
```

## Camada de apresentação

`app/` contém as rotas, layouts e interfaces:

- `app/page.tsx`: landing pública e jornada de agendamento;
- `app/api/public/`: endpoints de baixo privilégio consumidos pela landing;
- `app/admin/login/`: autenticação administrativa;
- `app/admin/(protected)/`: dashboard, agenda, agendamentos, serviços, profissionais e configurações.

Componentes visuais reutilizáveis ficam em `components/`. Estilos globais e a identidade pública ficam em `app/globals.css`; o painel possui estilos próprios em `app/admin/admin-auth.css`.

## Dados e domínio

`types/domain.ts` concentra os conceitos compartilhados da aplicação. Os módulos de `lib/data/` isolam consultas e transformações do Supabase para que páginas e componentes não dependam do formato bruto das tabelas.

Entidades principais:

- usuários administrativos;
- profissionais;
- clientes;
- serviços;
- disponibilidade dos profissionais;
- agendamentos;
- configurações da barbearia.

Valores monetários são tratados em centavos no domínio quando aplicável. Datas e horários trafegam em formatos ISO e são validados nas fronteiras da aplicação.

## Fluxo público de agendamento

1. `GET /api/public/catalog` carrega serviços, profissionais e dados da barbearia.
2. `POST /api/public/availability` valida serviço, profissional e data antes de consultar os horários.
3. `POST /api/public/bookings` valida a entrada com Zod e chama a RPC `create_public_booking`.
4. O PostgreSQL cria cliente e agendamento dentro da regra transacional e rejeita conflitos de horário.

Os endpoints usam a chave pública do Supabase e dependem de grants, constraints e políticas de RLS. Nenhuma credencial privilegiada é enviada ao navegador.

## Autenticação e autorização

O Supabase Auth mantém a sessão administrativa em cookies. `proxy.ts` renova e valida os claims nas rotas `/admin/*`. A proteção efetiva acontece no servidor:

- `lib/auth/admin.ts` exige uma sessão válida;
- o perfil precisa existir em `users`, estar ativo e possuir papel `admin` ou `barber`;
- Server Actions repetem a verificação antes de mutações;
- políticas RLS e funções do banco formam a última barreira de autorização.

Ocultar elementos da interface nunca é considerado autorização. O fluxo completo está em [AUTHENTICATION.md](AUTHENTICATION.md).

## Banco de dados

O schema reproduzível está em `supabase/migrations/`, os dados demonstrativos em `supabase/seed.sql` e os testes pgTAP em `supabase/tests/database/`.

As migrations definem tabelas, constraints, índices, policies e RPCs. Mudanças estruturais devem ser adicionadas como novas migrations imutáveis e validadas localmente antes de serem aplicadas ao projeto remoto. Consulte [DATABASE.md](DATABASE.md).

## Configuração

As duas variáveis usadas pela aplicação são públicas e de baixo privilégio:

| Variável | Finalidade |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave publicável sujeita a RLS |

`.env.local` é exclusivo do ambiente local e não deve ser versionado. Os mesmos nomes precisam ser configurados no ambiente do Cloudflare. Chaves `service_role`, senhas do banco e outros secrets não pertencem a variáveis `NEXT_PUBLIC_*`.

## Runtime e deploy

- desenvolvimento: `vinext dev` em `http://localhost:5173`;
- build: `vinext build`;
- produção: Cloudflare Workers;
- configuração do host: `.openai/hosting.json`, `vite.config.ts`, `build/`, `vendor/` e `scripts/`.

O scaffold D1/Drizzle existente em `db/`, `drizzle/` e `examples/d1/` pertence à infraestrutura opcional do starter e não participa do caminho oficial de dados. Ele é mantido isolado para preservar compatibilidade com a hospedagem; o banco da aplicação é PostgreSQL no Supabase.

## Princípios de manutenção

- consultas de negócio devem permanecer na camada de dados;
- mutações administrativas precisam validar autenticação no servidor;
- regras críticas e concorrentes devem ser reforçadas no banco;
- erros internos não devem ser exibidos diretamente ao usuário;
- novas variáveis e bindings devem ser documentados;
- TypeScript, lint, build e testes de banco devem acompanhar alterações relevantes.
