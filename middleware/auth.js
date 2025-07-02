const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar se o usuário está autenticado
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acesso não fornecido' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuário no banco de dados
        const users = await query('SELECT id, name, email, type, phone, address FROM users WHERE id = ?', [decoded.userId]);
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        return res.status(403).json({ 
            success: false, 
            message: 'Token inválido ou expirado' 
        });
    }
};

// Middleware para verificar se o usuário tem permissão de administrador
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.type !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
        });
    }
    next();
};

// Middleware para verificar se o usuário é uma organização
const requireOrganization = (req, res, next) => {
    if (!req.user || req.user.type !== 'organizacao') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acesso negado. Apenas organizações podem acessar este recurso.' 
        });
    }
    next();
};

// Middleware para verificar se o usuário é doador ou organização
const requireDonor = (req, res, next) => {
    if (!req.user || (req.user.type !== 'doador' && req.user.type !== 'organizacao')) {
        return res.status(403).json({ 
            success: false, 
            message: 'Acesso negado. Apenas doadores e organizações podem acessar este recurso.' 
        });
    }
    next();
};

// Middleware para verificar se o usuário é beneficiário
const requireBeneficiary = (req, res, next) => {
    if (!req.user || req.user.type !== 'beneficiario') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acesso negado. Apenas beneficiários podem acessar este recurso.' 
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireOrganization,
    requireDonor,
    requireBeneficiary
}; 