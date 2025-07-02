const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configurações
const { testConnection } = require('./config/database');

// Importar rotas
const routes = require('./routes');

// Criar aplicação Express
const app = express();

// Configurações de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "http://localhost:3000"],
        }
    }
}));

// forçar rodar na pasta raiz do projeto
const path = require('path');

// Servir arquivos estáticos corretamente
app.use(express.static(path.join(__dirname, 'public')));

// Configurar CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://seudominio.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite por IP
    message: {
        success: false,
        message: 'Muitas requisições deste IP, tente novamente mais tarde.'
    }
});
app.use(limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Rotas da API
app.use('/api', routes);

// Rota raiz para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Função para iniciar o servidor
async function startServer() {
    try {
        // Testar conexão com o banco de dados
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Não foi possível conectar ao banco de dados. Verifique as configurações.');
            process.exit(1);
        }

        // Definir porta
        const PORT = process.env.PORT || 3000;

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado com sucesso!');
            console.log(`📡 API rodando em: http://localhost:${PORT}`);
            console.log(`🔗 Endpoint de teste: http://localhost:${PORT}/api/health`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log('✅ Pronto para receber requisições!');
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Iniciar servidor
startServer(); 