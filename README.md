# Ajuda Solidária - Plataforma de Doações

Uma plataforma completa para conectar doadores, beneficiários e organizações, facilitando doações e ações solidárias.

## 🚀 Funcionalidades

- Sistema de autenticação JWT
- Cadastro, edição e solicitação de itens
- Solicitações de ajuda para beneficiários
- Criação de eventos/campanhas por organizações
- Relatórios avançados e geração de PDF
- Gráficos interativos (Chart.js)
- Interface responsiva

## 📋 Pré-requisitos

- Node.js 16+
- MySQL 5.7+
- npm

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd ajuda_solidaria
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados

#### 3.1 Crie o banco de dados
```bash
mysql -u root -p < database.sql
```

#### 3.2 Configure as variáveis de ambiente
Crie um arquivo `.env` baseado no exemplo abaixo:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=ajuda_solidaria
DB_PORT=3306
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Inicie o servidor
```bash
node server.js
```
O servidor estará rodando em `http://localhost:3000`

### 5. Acesse o frontend
Abra `http://localhost:3000` no navegador.

## 📊 Estrutura do Projeto

```
ajuda_solidaria/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       └── backend.js
├── config/
│   └── database.js
├── controllers/
│   ├── userController.js
│   ├── itemController.js
│   ├── requestController.js
│   ├── eventController.js
│   └── reportController.js
├── middleware/
│   └── auth.js
├── routes/
│   └── index.js
├── server.js
├── database.sql
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/register` - Registrar usuário
- `POST /api/login` - Login de usuário

### Usuários
- `GET /api/user/profile` - Obter perfil do usuário
- `PUT /api/user/profile` - Atualizar perfil
- `PUT /api/user/password` - Alterar senha

### Itens
- `GET /api/items` - Listar itens
- `GET /api/items/:id` - Obter item específico
- `POST /api/items` - Criar item
- `PUT /api/items/:id` - Atualizar item
- `DELETE /api/items/:id` - Excluir item
- `POST /api/items/:id/request` - Solicitar item

### Solicitações
- `GET /api/requests` - Listar solicitações
- `POST /api/requests` - Criar solicitação
- `PUT /api/requests/:id` - Atualizar solicitação
- `POST /api/requests/:id/approve` - Aprovar solicitação
- `POST /api/requests/:id/reject` - Rejeitar solicitação

### Eventos
- `GET /api/events` - Listar eventos
- `POST /api/events` - Criar evento
- `PUT /api/events/:id` - Atualizar evento
- `DELETE /api/events/:id` - Excluir evento
- `POST /api/events/:id/donate` - Fazer doação para evento

### Relatórios
- `GET /api/reports/general` - Relatório geral (apenas admin/organização)
- `GET /api/reports/pdf` - Download PDF (apenas admin/organização)
- `GET /api/reports/impact` - Relatório de impacto (apenas admin/organização)

## 👥 Tipos de Usuário

### Doador
- Cadastrar itens para doação
- Visualizar solicitações
- Participar de eventos

### Beneficiário
- Solicitar itens
- Visualizar itens disponíveis
- Participar de eventos

### Organização
- Criar eventos/campanhas
- Aprovar solicitações
- Gerar relatórios
- Cadastrar itens

### Administrador
- Acesso total ao sistema
- Gerenciar usuários
- Gerar relatórios completos

## 📈 Relatórios Disponíveis

### Relatório Geral
- Estatísticas de usuários
- Itens por categoria
- Solicitações por urgência
- Taxa de atendimento
- Top doadores

### Relatório de Impacto
- Impacto por região
- Crescimento mensal
- Eficiência de entrega

### Gráficos Interativos
- Gráfico de pizza para itens por categoria
- Gráfico de barras para solicitações por urgência
- Gráfico de rosca para taxa de atendimento

## 🔒 Segurança

- **Autenticação JWT**: Tokens seguros para sessões
- **Hash de Senhas**: bcrypt para criptografia
- **Rate Limiting**: Proteção contra ataques
- **Validação de Dados**: Validação em todas as entradas
- **CORS**: Configuração segura para requisições

## 🚀 Deploy

### Para Produção

1. **Configure o servidor:**
```bash
NODE_ENV=production
```

2. **Configure o banco de dados de produção**

3. **Use um process manager como PM2:**
```bash
npm install -g pm2
pm2 start server.js --name "ajuda-solidaria"
```

4. **Configure um proxy reverso (nginx/apache)**

### Variáveis de Ambiente de Produção
```env
NODE_ENV=production
DB_HOST=seu_host_producao
DB_USER=usuario_producao
DB_PASSWORD=senha_forte_producao
JWT_SECRET=chave_super_secreta_producao
```

## 🧪 Testando o Sistema

### Credenciais de Teste
- **Doador**: maria@email.com / 123456
- **Beneficiário**: joao@email.com / 123456
- **Organização**: contato@esperanca.org / 123456

### Fluxo de Teste
1. Faça login como doador
2. Cadastre alguns itens
3. Faça logout e entre como beneficiário
4. Solicite itens
5. Entre como organização para aprovar solicitações
6. Crie um evento
7. Gere relatórios (apenas organização/admin)

---

- Para gerar relatórios PDF, é necessário estar logado como **admin** ou **organização**.
- O frontend deve ser acessado via o servidor Express, não diretamente pelo arquivo HTML.




