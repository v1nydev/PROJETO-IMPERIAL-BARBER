# Banco de dados — Imperial Barber

## Fonte oficial

O PostgreSQL gerenciado pelo Supabase é a fonte oficial dos dados da Fase 2.
O scaffold D1/Drizzle do starter continua preservado, porém não participa do
fluxo de dados da aplicação.

Toda alteração estrutural deve ser registrada em
`supabase/migrations/`. Alterações manuais pelo editor SQL do painel não fazem
parte do fluxo aceito, pois não podem ser reproduzidas em outro ambiente.

## Estrutura

### `users`

Relaciona uma identidade do Supabase Auth a um papel da aplicação:
`admin` ou `barber`. O identificador é o próprio `auth.users.id`; e-mail,
senha e outros dados de autenticação não são duplicados nesta tabela.

### `services`

Catálogo de serviços com duração e preço. Preços são armazenados em
`numeric(10, 2)` no banco e convertidos para centavos na camada de domínio.
Serviços inativos permanecem no histórico, mas não ficam disponíveis
publicamente.

### `barbers`

Cadastro profissional. `user_id` é opcional para permitir cadastrar o
profissional antes de criar sua conta. O vínculo, quando existir, é único.

### `clients`

Armazena somente nome, telefone e e-mail opcional. Não há campos para endereço,
documento ou outras informações pessoais que não sejam necessárias para o
agendamento.

### `appointments`

Mantém os vínculos com cliente, profissional e serviço, além da data, horários,
preço capturado e status.

O banco aplica as seguintes regras:

- o serviço e o profissional precisam existir e estar ativos ao criar ou
  remarcar;
- o horário final é calculado a partir da duração do serviço;
- o preço inicial é copiado do serviço;
- preço negativo e horário final anterior ao inicial são rejeitados;
- agendamentos `pending`, `confirmed` ou `in_progress` do mesmo profissional
  não podem ocupar intervalos sobrepostos;
- registros históricos usam relacionamentos com `on delete restrict`.

Agendamentos cancelados, concluídos ou marcados como não comparecimento não
bloqueiam o mesmo intervalo. As regras completas de disponibilidade e transição
de status pertencem às etapas 20 e 23.

### `barber_availability`

Define janelas semanais por profissional. `day_of_week` usa o intervalo de
0 a 6, onde 0 representa domingo. Janelas ativas sobrepostas para o mesmo
profissional e dia são rejeitadas.

### `barber_availability_exceptions`

Reserva a estrutura para folgas, feriados, bloqueios e indisponibilidades. Uma
exceção sem `barber_id` é global. Horários nulos representam o dia inteiro;
quando um horário inicial é informado, o horário final também é obrigatório.

## Segurança

Row Level Security está habilitado em todas as tabelas públicas da aplicação.
Os grants foram reduzidos explicitamente.

| Recurso | Visitante anônimo | Barbeiro autenticado | Administrador |
| --- | --- | --- | --- |
| serviços ativos | leitura | leitura | gerenciamento |
| profissionais ativos | leitura | leitura | gerenciamento |
| próprio cadastro profissional | sem acesso | leitura | gerenciamento |
| agendamentos | sem acesso | leitura dos próprios | gerenciamento |
| disponibilidade | sem acesso | leitura da própria | gerenciamento |
| exceções | sem acesso | leitura da própria e globais | gerenciamento |
| clientes | sem acesso | sem acesso nesta etapa | gerenciamento |
| usuários | sem acesso | leitura do próprio papel | gerenciamento |

As funções auxiliares de autorização ficam no schema privado `private`, usam
`security definer` com `search_path` vazio e não são expostas pela Data API.
O helper de ativação automática de RLS criado pelo Supabase não pode ser
executado pelas roles `anon` ou `authenticated`.
Uma chave publicável nunca ignora essas políticas. Uma eventual chave
`service_role` deve permanecer exclusivamente no servidor.

O agendamento público da Etapa 24 não deverá inserir diretamente em
`clients` ou `appointments` com a role anônima. Ele deverá passar por uma
operação server-side controlada, com validação de entrada e de disponibilidade.

## Migrations e testes

Arquivos versionados:

- `supabase/config.toml`: configuração local, sem secrets;
- `supabase/migrations/`: histórico imutável das alterações de schema;
- `supabase/tests/database/`: verificações pgTAP de estrutura, índices e RLS.

Com Docker ou runtime compatível disponível:

```powershell
npm run supabase:start
npm run supabase:reset
npm run supabase:lint
npm run supabase:test
```

Para conectar um projeto remoto:

```powershell
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push --dry-run
npm run supabase:push
```

O `project-ref`, tokens, senha do banco e chaves secretas não devem ser
commitados. Antes de aplicar uma migration remotamente, o `--dry-run` deve ser
revisado. Nunca utilizar `db reset --linked` em produção.

## Limites da Etapa 14

- nenhum dado inicial é inserido; isso pertence à Etapa 15;
- nenhuma conta administrativa é criada;
- não há login ou proteção de rotas nesta etapa;
- a landing continua utilizando os dados mockados até a Etapa 24;
- não há CRUD ou interface administrativa.
