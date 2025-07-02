const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Registrar novo usuário
const register = async (req, res) => {
    try {
        const { name, email, password, phone, type, address } = req.body;

        // Validações básicas
        if (!name || !email || !password || !type) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos obrigatórios devem ser preenchidos'
            });
        }

        // Verificar se o email já existe
        const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado no sistema'
            });
        }

        // Hash da senha
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Inserir usuário no banco
        const result = await query(
            'INSERT INTO users (name, email, password_hash, phone, type, address) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, passwordHash, phone, type, address]
        );

        // Buscar usuário criado (sem a senha)
        const newUser = await query(
            'SELECT id, name, email, type, phone, address, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        // Gerar token JWT
        const token = jwt.sign(
            { userId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            data: {
                user: newUser[0],
                token
            }
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Login do usuário
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validações básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        // Buscar usuário pelo email
        const users = await query(
            'SELECT id, name, email, password_hash, type, phone, address FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha incorretos'
            });
        }

        const user = users[0];

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha incorretos'
            });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remover password_hash do objeto de resposta
        delete user.password_hash;

        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter perfil do usuário logado
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const users = await query(
            'SELECT id, name, email, type, phone, address, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Atualizar perfil do usuário
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, address } = req.body;

        // Validações básicas
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome é obrigatório'
            });
        }

        // Atualizar usuário
        await query(
            'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
            [name, phone, address, userId]
        );

        // Buscar usuário atualizado
        const users = await query(
            'SELECT id, name, email, type, phone, address, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso!',
            data: users[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Alterar senha
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validações básicas
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Senha atual e nova senha são obrigatórias'
            });
        }

        // Buscar senha atual
        const users = await query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Senha atual incorreta'
            });
        }

        // Hash da nova senha
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Atualizar senha
        await query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Listar todos os usuários (apenas admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await query(
            'SELECT id, name, email, type, phone, address, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers
}; 