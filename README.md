# 📦 Gestão Incubadora - Documentação Completa

## 🎯 Visão Geral

A **Plataforma de Gestão da Incubadora** é um sistema web completo para gerenciar as operações da incubadora de empresas da Prefeitura Municipal de Penápolis, SP.

**Características principais:**
- ✅ Gestão de 40 boxes (ocupação e histórico)
- ✅ Cadastro completo de empresas com múltiplos boxes
- ✅ Sistema de obrigações (pagamentos, capacitações, documentos)
- ✅ Bandeiras visuais (vermelha, amarela, roxa)
- ✅ Dashboard com KPIs e análises
- ✅ Armazenamento de documentos em cloud
- ✅ Auditoria completa de operações
- ✅ Histórico de empresas desativadas
- ✅ Filtros avançados
- ✅ Integração com Supabase (autenticação, banco de dados, storage)

---

## 🚀 Setup Inicial

### Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn
- Conta no Supabase (grátis em https://supabase.com)
- Git (opcional)

### 1️⃣ Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Preencha os dados:
   - **Name**: `gestao-incubadora`
   - **Database Password**: Defina uma senha forte
   - **Region**: Escolha a mais próxima (South America - São Paulo)
4. Aguarde a criação do projeto (2-3 minutos)
5. Após criar, copie:
   - **URL do projeto**: `https://xxx.supabase.co`
   - **Anon Key**: Na aba "Settings" > "API"

### 2️⃣ Executar o Schema no Supabase

1. No Supabase, vá para "SQL Editor"
2. Clique em "New Query"
3. Cole o conteúdo de `supabase-schema.sql`
4. Clique em "Run" ou `Ctrl+Enter`
5. Aguarde a execução (pode levar alguns minutos)

**✅ Pronto!** O banco de dados foi criado com todas as tabelas, views, índices e políticas RLS.

### 3️⃣ Criar Storage Bucket

1. No Supabase, vá para "Storage"
2. Clique em "Create Bucket"
3. Nome: `documentos-incubadora`
4. Deixar como "Public"
5. Clique em "Create"

### 4️⃣ Configurar Autenticação

1. Vá para "Authentication" > "Providers"
2. Email já deve estar ativado por padrão
3. Se necessário, ative "Email" em "Settings"

### 5️⃣ Configurar o Projeto React

```bash
# Clone ou extraia os arquivos do projeto
cd seu-projeto

# Instale as dependências
npm install

# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o .env.local com suas credenciais
# REACT_APP_SUPABASE_URL=https://xxx.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=sua-chave-publica
```

### 6️⃣ Inicie o Servidor de Desenvolvimento

```bash
npm start
```

A aplicação abrirá em `http://localhost:3000`

---

## 👥 Autenticação de Usuários

### Criar Primeiro Usuário (Admin)

1. No Supabase > Authentication > Users
2. Clique em "Add user"
3. Preencha:
   - **Email**: `usuario@prefeitura.sp.br`
   - **Password**: Defina uma senha forte
4. Clique em "Create user"

### Fazer Login

1. Acesse `http://localhost:3000`
2. Clique em "Registrar" ou "Login"
3. Use as credenciais criadas

### Criar Mais Usuários

Na aplicação:
1. Clique em "Registrar" como novo usuário
2. Preencha email e senha
3. Será criado automaticamente na tabela `usuarios_sistema` com role `operador`

---

## 📊 Funcionalidades Principais

### 1. Dashboard
- **Boxes Ocupados**: Mostra quantos dos 40 boxes estão ocupados
- **Total de Empresas**: Quantidade de empresas ativas
- **Pagamentos Vencidos**: Alertas de obrigações pendentes
- **Tempo na Incubadora**: Distribuição de empresas por tempo (1 ano, 2 anos, 5 anos, 10 anos, 10+)

### 2. Gestão de Empresas
- **Adicionar Empresa**: 
  - Nome, CNPJ, inscrição municipal
  - Telefones principal e secundário
  - Número de funcionários
  - Atividade/CNAE
  - Múltiplos boxes com datas de entrada

- **Editar Empresa**: Alterar qualquer informação cadastrada

- **Desativar Empresa**: 
  - Move para seção "Desativadas"
  - Registra data de saída
  - Mantém histórico completo

- **Reativar Empresa**: Reativa empresa previamente desativada

### 3. Obrigações
- **Criar Obrigações**:
  - Tipo: Pagamento (taxa, água, luz), Capacitação, Documento, Outro
  - Aplicável a uma ou todas as empresas
  - Data de vencimento

- **Marcar como Cumprida**: Registra data e usuário que cumpriu

- **Bandeiras Visuais**:
  - 🔴 **Vermelha**: Pagamentos vencidos (obrigatório marcar data de vencimento)
  - 🟡 **Amarela**: Outras obrigações pendentes
  - 🟣 **Roxa**: Empresa há 2+ anos na incubadora

### 4. Documentos
- Upload de arquivos (PDFs, contratos, etc.)
- Armazenamento em cloud (Supabase Storage)
- Download direto dos arquivos

### 5. Filtros
- **Busca**: Por nome ou CNPJ
- **Atividade**: Filtrar por tipo de atividade
- **Status de Pagamento**: Em dia ou atrasados
- **Tempo na Incubadora**: 1 ano, 2 anos, 5 anos, 10 anos, 10+

### 6. Auditoria
- Registro automático de todas as operações
- Email do operador em cada ação
- Data/hora da modificação
- Dados antigos e novos armazenados

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `empresas`
```sql
- id (UUID)
- nome_empresa (VARCHAR)
- cnpj (VARCHAR UNIQUE)
- inscricao_municipal (VARCHAR)
- telefone_principal (VARCHAR)
- telefone_secundario (VARCHAR)
- numero_funcionarios (INTEGER)
- atividade (VARCHAR)
- ativa (BOOLEAN)
- email_ultima_manutencao (VARCHAR)
- created_at, updated_at (TIMESTAMP)
```

#### `boxes`
```sql
- id (UUID)
- numero (INTEGER UNIQUE) -- 1 a 40
- empresa_id (UUID FK -> empresas)
- data_entrada (DATE)
- data_saida (DATE)
- ativo (BOOLEAN)
```

#### `obrigacoes`
```sql
- id (UUID)
- empresa_id (UUID FK)
- descricao (TEXT)
- tipo (VARCHAR) -- 'pagamento', 'capacitacao', 'documento', 'outro'
- subtipo (VARCHAR) -- para pagamentos: 'taxa', 'agua', 'luz'
- status (BOOLEAN) -- true = cumprida
- data_cumprimento (TIMESTAMP)
- mes_referencia (INTEGER)
- ano_referencia (INTEGER)
- usuario_email_criacao (VARCHAR)
- usuario_email_cumprimento (VARCHAR)
```

#### `documentos`
```sql
- id (UUID)
- empresa_id (UUID FK)
- nome_arquivo (VARCHAR)
- tipo (VARCHAR) -- MIME type
- url_storage (VARCHAR)
- bucket_path (VARCHAR)
- tamanho_bytes (INTEGER)
- data_upload (TIMESTAMP)
- usuario_email (VARCHAR)
```

#### `empresas_desativadas`
```sql
- id (UUID)
- empresa_id (UUID)
- nome_empresa (VARCHAR)
- cnpj (VARCHAR)
- data_desativacao (TIMESTAMP)
- data_saida (DATE)
- usuario_email (VARCHAR)
- motivo_desativacao (TEXT)
- boxes_ocupados (TEXT) -- JSON string
- dados_empresa (JSONB) -- Snapshot
```

#### `auditoria`
```sql
- id (UUID)
- usuario_email (VARCHAR)
- operacao (VARCHAR) -- 'criar', 'editar', 'desativar'
- tabela (VARCHAR)
- registro_id (UUID)
- dados_antigos (JSONB)
- dados_novos (JSONB)
- created_at (TIMESTAMP)
```

### Views (Para Consultas Rápidas)

- `empresas_com_boxes`: Empresas + informações dos boxes
- `empresas_com_pagamentos`: Empresas + contagem de pagamentos vencidos
- `empresas_tempo_incubadora`: Tempo em incubadora + bandeira roxa
- `dashboard_kpis`: Métricas gerais do dashboard

---

## 📱 Rotas da Aplicação

| Página | URL | Função |
|--------|-----|--------|
| Dashboard | `/` | Visão geral com KPIs |
| Empresas | `/empresas` | Lista com filtros e gerenciamento |
| Desativadas | `/desativadas` | Histórico de empresas desativadas |
| Configurações | `/config` | Dados do usuário e sobre |

---

## 🔐 Segurança com RLS (Row Level Security)

Todas as tabelas possuem políticas RLS configuradas:

- **Públicos** podem ver apenas empresas ativas
- **Admin** pode ver todas as empresas
- **Operadores** podem criar, editar e deletar
- **Auditoria** é registrada automaticamente
- **Documentos** são armazenados em caminho protegido

---

## 🚀 Deployment no Vercel

### 1. Preparar o Projeto

```bash
# Certifique-se de que tudo funciona localmente
npm start

# Build
npm run build
```

### 2. Fazer Push no GitHub

```bash
git init
git add .
git commit -m "Inicial: Gestão Incubadora"
git remote add origin https://github.com/seu-usuario/gestao-incubadora.git
git push -u origin main
```

### 3. Deploy no Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione o repositório GitHub
4. Em "Environment Variables", adicione:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
5. Clique em "Deploy"

**✅ Pronto!** Sua aplicação está live em `https://seu-projeto.vercel.app`

---

## 🔧 Variáveis de Ambiente

### Obrigatórias
```
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-publica
```

### Opcionais
```
REACT_APP_NAME=Gestão Incubadora
REACT_APP_ENVIRONMENT=production
REACT_APP_API_TIMEOUT=30000
REACT_APP_MAX_UPLOAD_SIZE=52428800
```

---

## 📝 Exemplos de Uso

### Adicionar Empresa
1. Clique em "+ Adicionar Empresa"
2. Preencha:
   - Nome: "Tech Solutions LTDA"
   - CNPJ: "12.345.678/0001-99"
   - Telefone: "(17) 3333-1234"
   - Atividade: "Tecnologia"
3. Clique em "+ Adicionar Box"
4. Box 5, data 01/01/2022
5. Clique em "Adicionar Empresa"

### Criar Obrigação de Pagamento
1. Na empresa, clique em "Editar"
2. Vá para "Obrigações"
3. Clique em "+ Adicionar"
4. Tipo: "Pagamento"
5. Descrição: "Taxa de Incubadora - Janeiro"
6. Clique em "Salvar"

### Marcar Pagamento como Realizado
1. Empresa aparecerá com 🔴 bandeira vermelha
2. Clique em "Editar"
3. Na obrigação, marque "Cumprido"
4. Data será registrada automaticamente
5. Bandeira desaparece

---

## 🆘 Troubleshooting

### "Erro de Autenticação"
- Verifique as credenciais do Supabase em `.env.local`
- Confirme que o usuário foi criado no Supabase > Authentication

### "Tabelas não existem"
- Execute novamente o `supabase-schema.sql`
- Verifique se não houve erros na execução

### "Documentos não fazem upload"
- Confirme que o bucket `documentos-incubadora` foi criado
- Verifique as permissões do bucket em Supabase > Storage

### "Aplicação lenta"
- Verifique a conexão com a internet
- Ajuste `REACT_APP_API_TIMEOUT` em `.env.local`
- Considere usar índices adicionais no Supabase

### "CORS Error"
- Nas configurações do Supabase, adicione seu domínio em CORS
- Se estiver em localhost, já deve estar permitido

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação do Supabase: https://supabase.com/docs
2. Documentação do React: https://react.dev
3. Issues no GitHub (se disponível)

---

## 📄 Licença

Desenvolvido para a Prefeitura Municipal de Penápolis, SP.

---

## ✨ Próximas Melhorias

- [ ] Relatórios PDF exportáveis
- [ ] Agendamento automático de lembretes
- [ ] Integração com e-mail (alertas)
- [ ] Gráficos avançados de análise
- [ ] App mobile (React Native)
- [ ] Integração com sistema de pagamentos
- [ ] Múltiplas unidades/prefeituras

---

**Versão:** 1.0.0  
**Última atualização:** 2024  
**Mantido por:** Prefeitura Municipal de Penápolis
