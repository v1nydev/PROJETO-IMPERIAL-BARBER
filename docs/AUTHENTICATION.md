# Autenticação administrativa

## Modelo adotado

O painel usa Supabase Auth com e-mail e senha. A chave publicável identifica o
projeto no navegador, enquanto a autorização é decidida no servidor e pelas
políticas RLS do PostgreSQL.

O fluxo possui três camadas:

1. `proxy.ts` valida o token e persiste cookies renovados nas requisições de
   `/admin/*`;
2. o layout protegido consulta a identidade validada e o registro em
   `public.users` antes de renderizar qualquer rota administrativa;
3. as políticas RLS continuam limitando cada operação diretamente no banco.

Não se utiliza `getSession()` para autorizar acesso server-side. A identidade é
validada com `getClaims()` antes da consulta do papel da aplicação.

## Papéis

Contas novas recebem um perfil `barber` ativo por meio do trigger
`auth_users_create_profile`. A função `private.assign_app_role` permite ao
operador do banco promover uma identidade para `admin` de forma reproduzível.

Essa função está no schema privado e não pode ser executada pelas roles `anon`
ou `authenticated`. Nunca deve ser exposta por uma rota pública.

## Criar a primeira conta administrativa

1. Criar o usuário em **Authentication → Users** no painel do Supabase. A senha
   deve ser definida e guardada pelo proprietário; ela não entra no código.
2. Com o projeto vinculado pela CLI, promover o e-mail criado:

```sql
select private.assign_app_role('seu-email', 'admin');
```

3. Acessar `/admin/login` e autenticar com essa conta.

## Variáveis de ambiente

O ambiente precisa apenas destes valores públicos:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

No desenvolvimento, ficam em `.env.local`, arquivo ignorado pelo Git. No host,
devem ser configurados no painel de variáveis do ambiente. Nenhuma chave
`secret` ou `service_role` é necessária para o login e jamais deve usar o
prefixo `NEXT_PUBLIC_`.

## Comportamentos esperados

- visitante anônimo em `/admin` é redirecionado para `/admin/login`;
- credenciais inválidas recebem mensagem genérica;
- conta válida sem papel ativo não entra no painel;
- conta autorizada na tela de login é redirecionada para `/admin`;
- logout remove a sessão local e retorna ao login;
- refresh mantém uma sessão válida por meio dos cookies renovados.
