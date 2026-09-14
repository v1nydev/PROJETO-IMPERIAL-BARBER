# IMPERIAL BARBER — ROADMAP

## FASE 1 — LANDING PAGE

> Landing page pública, identidade visual e experiência inicial da Imperial Barber.

- [x] Etapa 01 — Fundação e Design System
- [x] Etapa 02 — Navbar + Hero
- [x] Etapa 03 — Experiência + Serviços
- [x] Etapa 04 — Scroll-driven Experience
- [x] Etapa 05 — Barbeiros + Galeria
- [x] Etapa 06 — Social Proof
- [x] Etapa 07 — Interface de Agendamento
- [x] Etapa 08 — Localização + CTA + Footer
- [x] Etapa 09 — Responsividade / Mobile
- [x] Etapa 10 — Polimento
- [x] Etapa 11 — QA
- [x] Etapa 12 — Portfolio Edition

---

# FASE 2 — SISTEMA DE GESTÃO DA BARBEARIA

## Objetivo

Transformar a Imperial Barber de uma landing page conceitual em uma
aplicação full-stack funcional.

A landing page pública continuará sendo a interface utilizada pelos
clientes.

Será criado um painel administrativo protegido para gerenciamento da
barbearia.

O sistema deverá permitir:

- clientes realizarem agendamentos;
- administradores visualizarem a agenda;
- barbeiros visualizarem seus atendimentos;
- gerenciamento de serviços;
- gerenciamento de profissionais;
- gerenciamento de disponibilidade;
- alteração e cancelamento de agendamentos;
- acompanhamento de faturamento;
- visualização de métricas;
- integração completa entre site público e painel administrativo.

O projeto deve continuar seguindo as regras estabelecidas no CLAUDE.md.

---

# ETAPA 13 — ARQUITETURA FULL-STACK

- [x] Analisar a arquitetura atual antes de realizar alterações.
- [x] Definir claramente frontend, camada de dados e responsabilidades.
- [x] Preparar integração com Supabase.
- [x] Criar variáveis de ambiente corretamente.
- [x] Criar `.env.example`.
- [x] Garantir que secrets nunca sejam commitados.
- [x] Definir tipos principais do domínio.
- [x] Definir camada responsável pelo acesso aos dados.
- [x] Preparar estrutura para autenticação.
- [x] Preparar estrutura de rotas públicas e administrativas.
- [x] Documentar decisões arquiteturais relevantes.

### Entidades iniciais

Planejar suporte para:

- users
- barbers
- clients
- services
- appointments
- barber_availability

Não implementar funcionalidades futuras desnecessariamente nesta etapa.

### Conclusão

A etapa estará concluída quando:

- arquitetura estiver definida;
- Supabase estiver preparado;
- TypeScript passar;
- lint passar;
- build passar;
- aplicação existente continuar funcionando.

---

# ETAPA 14 — BANCO DE DADOS / SUPABASE

## Objetivo

Criar a fonte real de dados da Imperial Barber.

### Services

Criar estrutura para:

- id
- name
- description
- duration_minutes
- price
- active
- created_at
- updated_at

Exemplos:

- Corte Degradê
- Barba
- Corte + Barba
- Pigmentação
- Luzes
- Combo da Casa

### Barbers

Criar estrutura para:

- id
- name
- slug
- specialty
- bio
- avatar_url
- active
- created_at
- updated_at

### Clients

Criar estrutura para:

- id
- name
- phone
- email opcional
- created_at
- updated_at

Evitar armazenar dados pessoais desnecessários.

### Appointments

Criar estrutura para:

- id
- client_id
- barber_id
- service_id
- appointment_date
- start_time
- end_time
- price
- status
- notes
- created_at
- updated_at

### Status possíveis

- pending
- confirmed
- in_progress
- completed
- cancelled
- no_show

### Barber Availability

Preparar estrutura para definir:

- profissional
- dia da semana
- horário inicial
- horário final
- ativo/inativo

Preparar também suporte futuro para exceções:

- folgas;
- feriados;
- horários bloqueados;
- indisponibilidades específicas.

### Regras

- Criar relacionamentos adequados.
- Criar constraints importantes.
- Evitar agendamentos inválidos.
- Preparar índices para consultas frequentes.
- Utilizar migrations.
- Não depender de alterações manuais impossíveis de reproduzir.

### Segurança

Configurar Row Level Security quando aplicável.

Nenhuma operação administrativa sensível deve depender apenas de
esconder elementos na interface.

---

# ETAPA 15 — DADOS INICIAIS / SEED

Criar dados de demonstração realistas.

### Profissionais

Exemplo:

Arthur Vinícius
Especialidade: Fade e cortes modernos

Daniel Vital
Especialidade: cortes clássicos e barba

Adicionar outros profissionais se necessário.

### Serviços

Adicionar serviços e preços coerentes.

Exemplo:

Corte Degradê — R$ 75
Barba — R$ 50
Combo da Casa — R$ 140

### Agendamentos

Criar alguns agendamentos de demonstração para diferentes:

- dias;
- horários;
- profissionais;
- serviços;
- status.

O seed deve permitir demonstrar o dashboard imediatamente.

---

# ETAPA 16 — AUTENTICAÇÃO ADMINISTRATIVA

## Objetivo

Criar acesso protegido ao painel.

### Implementar

- página `/admin/login`;
- autenticação com Supabase Auth;
- sessão persistente;
- logout;
- proteção das rotas `/admin/*`;
- loading durante verificação de sessão;
- tratamento de credenciais inválidas;
- redirecionamento adequado.

### Segurança

Não considerar uma rota segura apenas porque ela não aparece na
navegação pública.

Garantir autorização também na camada de dados.

Não armazenar senha manualmente no banco.

Não armazenar tokens sensíveis em código-fonte.

---

# ETAPA 17 — LAYOUT DO PAINEL ADMINISTRATIVO

Criar a fundação visual do painel.

## Navegação

Criar:

- Dashboard
- Agenda
- Agendamentos
- Serviços
- Profissionais
- Configurações

### Layout

Implementar:

- sidebar desktop;
- navegação apropriada para mobile;
- header;
- identificação do usuário;
- logout;
- área principal;
- estados de loading;
- estados vazios;
- estados de erro.

O painel deve pertencer visualmente à mesma marca Imperial Barber,
mas priorizar produtividade e legibilidade.

Não transformar o painel em uma coleção exagerada de cards.

Evitar estética genérica de dashboard gerado por IA.

---

# ETAPA 18 — DASHBOARD

## Objetivo

Dar ao administrador uma visão imediata do funcionamento da barbearia.

### Resumo de hoje

Exibir:

- faturamento previsto;
- faturamento realizado;
- quantidade de agendamentos;
- atendimentos concluídos;
- cancelamentos;
- próximos atendimentos.

Exemplo:

HOJE

14:30
Lucas
Corte Degradê
Arthur Vinícius
R$ 75
Confirmado

15:30
Marcos
Combo da Casa
Daniel Vital
R$ 140
Confirmado

Faturamento previsto:
R$ 215

### Métricas adicionais

Preparar:

- ticket médio;
- serviço mais vendido;
- profissional com mais atendimentos;
- taxa de cancelamento.

Não criar métricas sem utilidade real.

---

# ETAPA 19 — AGENDA

## Objetivo

Criar uma visão operacional dos horários da barbearia.

### Visualizações

Implementar inicialmente:

- Hoje
- Próximos dias

Se fizer sentido posteriormente:

- semana;
- calendário mensal.

### Cada agendamento deve mostrar

- horário;
- cliente;
- serviço;
- profissional;
- duração;
- preço;
- status.

### Filtros

Permitir filtrar por:

- profissional;
- status;
- data.

### Estados

Diferenciar visualmente:

- pendente;
- confirmado;
- em atendimento;
- concluído;
- cancelado;
- não compareceu.

---

# ETAPA 20 — GESTÃO DE AGENDAMENTOS

## Objetivo

Permitir que o administrador realmente opere a agenda.

### Ações

Permitir:

- visualizar detalhes;
- confirmar;
- iniciar atendimento;
- concluir;
- cancelar;
- remarcar;
- alterar profissional;
- alterar serviço;
- adicionar observação.

### Cancelamento

Solicitar confirmação antes de cancelar.

Não excluir o registro permanentemente apenas porque um agendamento
foi cancelado.

Manter histórico através do status.

### Remarcação

Antes de salvar:

- validar disponibilidade;
- impedir conflito de horário;
- recalcular horário final;
- atualizar dados relacionados quando necessário.

### Feedback

Todas as ações devem possuir:

- loading;
- sucesso;
- erro;
- feedback visual adequado.

---

# ETAPA 21 — GESTÃO DE SERVIÇOS

Permitir ao administrador:

- criar serviço;
- editar serviço;
- alterar preço;
- alterar duração;
- alterar descrição;
- ativar/desativar serviço.

Evitar excluir definitivamente serviços associados a agendamentos
históricos.

Serviços inativos não devem aparecer para novos agendamentos.

---

# ETAPA 22 — GESTÃO DE PROFISSIONAIS

Permitir:

- cadastrar profissional;
- editar informações;
- definir especialidades;
- adicionar foto;
- ativar/desativar profissional;
- visualizar agenda individual.

Preparar arquitetura para disponibilidade individual.

Profissionais inativos devem permanecer associados ao histórico de
agendamentos antigos.

---

# ETAPA 23 — DISPONIBILIDADE E HORÁRIOS

## Objetivo

Fazer o sistema entender quando realmente existe um horário disponível.

Implementar regras para:

- horário de funcionamento;
- jornada de cada barbeiro;
- duração de cada serviço;
- agendamentos existentes;
- intervalos;
- horários bloqueados.

### Exemplo

Arthur trabalha:

09:00 — 18:00

Já possui:

14:00 — 15:00

Um serviço de 60 minutos não poderá ser marcado às 14:30.

### Regras

O frontend nunca deve ser a única proteção contra conflitos.

A validação deverá existir também na camada responsável pela gravação
do agendamento.

---

# ETAPA 24 — INTEGRAÇÃO COM O AGENDAMENTO PÚBLICO

## Objetivo

Substituir os dados mockados da landing page pelos dados reais.

### Fluxo

Cliente acessa o site.

↓

Escolhe serviço.

↓

Escolhe profissional.

↓

Escolhe data.

↓

Sistema consulta horários realmente disponíveis.

↓

Cliente informa os dados necessários.

↓

Confirma.

↓

Agendamento é salvo.

↓

Agendamento aparece automaticamente no painel administrativo.

### Importante

O cliente nunca deverá conseguir selecionar um horário já ocupado.

Não confiar apenas no estado do frontend para garantir isso.

---

# ETAPA 25 — EXPERIÊNCIA PÓS-AGENDAMENTO

Após concluir o agendamento:

Mostrar:

- confirmação;
- serviço;
- profissional;
- data;
- horário;
- preço;
- código/identificador do agendamento quando apropriado.

Preparar opções como:

- adicionar ao calendário;
- entrar em contato via WhatsApp;
- retornar à página inicial.

Não expor IDs internos ou informações sensíveis desnecessariamente.

---

# ETAPA 26 — FINANCEIRO E ANALYTICS

## Dashboard financeiro

Implementar filtros:

- hoje;
- últimos 7 dias;
- mês atual;
- período personalizado.

### Métricas

Exibir:

- faturamento previsto;
- faturamento realizado;
- ticket médio;
- número de atendimentos;
- cancelamentos;
- no-shows;
- receita por serviço;
- receita por profissional.

### Importante

Diferenciar:

FATURAMENTO PREVISTO

Agendamentos futuros/confirmados.

FATURAMENTO REALIZADO

Somente atendimentos concluídos.

Um agendamento cancelado não deve contar como faturamento realizado.

### Visualização

Adicionar gráficos somente onde ajudarem a interpretar os dados.

Evitar dashboard excessivamente carregado.

---

# ETAPA 27 — PERFIL DO BARBEIRO

Preparar suporte para contas de profissionais.

Um barbeiro autenticado deverá poder visualizar:

- seus atendimentos de hoje;
- próximos atendimentos;
- histórico;
- faturamento relacionado aos seus atendimentos, caso permitido;
- disponibilidade.

Definir permissões diferentes entre:

ADMIN
e
BARBER.

### Admin

Pode gerenciar toda a barbearia.

### Barber

Acessa apenas os recursos autorizados e relacionados ao seu trabalho.

A autorização deverá existir no backend/banco, não apenas na interface.

---

# ETAPA 28 — AUDITORIA DE SEGURANÇA

Revisar:

- autenticação;
- autorização;
- RLS;
- queries;
- mutations;
- variáveis de ambiente;
- exposição de dados;
- validação de inputs;
- manipulação de IDs;
- rotas administrativas;
- permissões ADMIN/BARBER.

Testar situações como:

- usuário não autenticado tentando acessar `/admin`;
- barbeiro tentando acessar dados de outro profissional;
- tentativa de criar horário conflitante;
- alteração manual de requests;
- dados inválidos;
- sessão expirada.

Não considerar segurança concluída apenas porque a interface impede uma
ação.

---

# ETAPA 29 — RESPONSIVIDADE DO PAINEL

Auditar especificamente:

- smartphones;
- tablets;
- notebooks;
- desktops.

Garantir que:

- tabelas sejam utilizáveis;
- agenda funcione em telas pequenas;
- modais não estourem viewport;
- sidebar tenha alternativa mobile;
- formulários sejam confortáveis;
- ações importantes permaneçam acessíveis.

O painel deve ser realmente utilizável pelo barbeiro através do celular.

---

# ETAPA 30 — UX E ESTADOS DE INTERFACE

Revisar toda a aplicação para implementar adequadamente:

- loading;
- skeleton;
- empty state;
- error state;
- success state;
- confirmação de ações destrutivas;
- optimistic updates somente quando seguros;
- mensagens compreensíveis.

Exemplo:

Em vez de uma tela vazia:

"Nenhum agendamento para hoje."

Em vez de erro técnico:

"Não foi possível carregar a agenda. Tente novamente."

---

# ETAPA 31 — PERFORMANCE

Auditar:

- queries desnecessárias;
- renders;
- bundle;
- imagens;
- lazy loading;
- carregamento do painel;
- animações;
- dependências;
- cache quando apropriado.

O painel administrativo não precisa utilizar as animações cinematográficas
da landing page.

Priorizar velocidade e produtividade.

---

# ETAPA 32 — QA FULL-STACK

Executar testes completos dos principais fluxos.

## Fluxo cliente

- abrir landing page;
- selecionar serviço;
- selecionar profissional;
- selecionar horário;
- preencher dados;
- confirmar;
- verificar persistência.

## Fluxo administrador

- login;
- visualizar novo agendamento;
- confirmar;
- remarcar;
- cancelar;
- concluir atendimento;
- verificar financeiro.

## Fluxo barbeiro

- login;
- visualizar agenda permitida;
- alterar ações permitidas;
- tentar acessar ação proibida.

### Testar também

- refresh;
- sessão expirada;
- internet lenta;
- dados vazios;
- erros do backend;
- múltiplos agendamentos;
- conflitos de horário;
- mobile.

Ao final:

- TypeScript deve passar;
- lint deve passar;
- build deve passar;
- console não deve possuir erros conhecidos.

---

# ETAPA 33 — PORTFOLIO / DEMO MODE

## Objetivo

Preparar o projeto para ser apresentado publicamente.

Criar dados fictícios de demonstração convincentes.

Garantir que nenhum dado pessoal real seja utilizado.

Preparar uma experiência demonstrável do painel.

### Portfólio

Documentar:

- problema;
- solução;
- stack;
- arquitetura;
- sistema de agendamento;
- painel administrativo;
- autenticação;
- banco de dados;
- analytics;
- responsividade;
- decisões de UI/UX.

Adicionar screenshots de:

- landing page;
- fluxo de agendamento;
- dashboard;
- agenda;
- mobile.

---

# ETAPA 34 — README E DOCUMENTAÇÃO FINAL

Atualizar README contendo:

- descrição do projeto;
- screenshots;
- funcionalidades;
- stack;
- arquitetura;
- configuração local;
- variáveis de ambiente;
- banco;
- migrations;
- comandos;
- build;
- estrutura do projeto.

Documentar como executar:

npm install
npm run dev
npm run build

Nunca colocar secrets reais no README.

---

# ETAPA 35 — RELEASE FINAL

Antes de considerar a Imperial Barber concluída:

- [ ] Landing page finalizada.
- [ ] Agendamento público funcional.
- [ ] Banco conectado.
- [ ] Autenticação funcional.
- [ ] Dashboard funcional.
- [ ] Agenda funcional.
- [ ] Gerenciamento de agendamentos funcional.
- [ ] Gerenciamento de serviços funcional.
- [ ] Gerenciamento de profissionais funcional.
- [ ] Disponibilidade funcional.
- [ ] Financeiro funcional.
- [ ] Permissões verificadas.
- [ ] Responsividade verificada.
- [ ] Segurança auditada.
- [ ] Performance auditada.
- [ ] TypeScript passando.
- [ ] Lint passando.
- [ ] Build passando.
- [ ] README atualizado.
- [ ] Dados de demonstração preparados.
- [ ] Projeto pronto para deploy.

---

# REGRA DE EXECUÇÃO DA FASE 2

Não implementar várias etapas simultaneamente sem necessidade.

Para cada etapa:

1. Ler `CLAUDE.md`.
2. Ler este `ROADMAP.md`.
3. Analisar o código existente.
4. Consultar `git status` e alterações pendentes.
5. Planejar somente a etapa atual.
6. Implementar incrementalmente.
7. Não quebrar funcionalidades existentes.
8. Executar validações.
9. Corrigir erros encontrados.
10. Atualizar o roadmap somente após a etapa realmente estar concluída.
11. Apresentar resumo objetivo das alterações.

Após uma etapa estável e validada, criar um commit antes de iniciar a
próxima.

Não marcar uma etapa como concluída caso existam erros conhecidos.
