const { query } = require('../config/database');

// Listar todas as solicitações
const getAllRequests = async (req, res) => {
    try {
        const { status, urgency, category } = req.query;
        
        let sql = `
            SELECT r.*, u.name as beneficiary_name, u.email as beneficiary_email 
            FROM requests r 
            LEFT JOIN users u ON r.beneficiary_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        // Filtros
        if (status) {
            sql += ` AND r.status = ?`;
            params.push(status);
        }

        if (urgency) {
            sql += ` AND r.urgency = ?`;
            params.push(urgency);
        }

        if (category) {
            sql += ` AND r.category = ?`;
            params.push(category);
        }

        sql += ` ORDER BY r.created_at DESC`;

        const requests = await query(sql, params);

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Erro ao listar solicitações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter solicitação por ID
const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const requests = await query(`
            SELECT r.*, u.name as beneficiary_name, u.email as beneficiary_email 
            FROM requests r 
            LEFT JOIN users u ON r.beneficiary_id = u.id 
            WHERE r.id = ?
        `, [id]);

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada'
            });
        }

        res.json({
            success: true,
            data: requests[0]
        });

    } catch (error) {
        console.error('Erro ao buscar solicitação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Criar nova solicitação
const createRequest = async (req, res) => {
    try {
        const { title, description, category, urgency } = req.body;
        const beneficiaryId = req.user.id;

        // Verificar se o usuário é beneficiário
        if (req.user.type !== 'beneficiario') {
            return res.status(403).json({
                success: false,
                message: 'Apenas beneficiários podem criar solicitações'
            });
        }

        // Validações básicas
        if (!title || !description || !category || !urgency) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar se o beneficiário já tem muitas solicitações pendentes
        const pendingRequests = await query(
            'SELECT COUNT(*) as count FROM requests WHERE beneficiary_id = ? AND status = "pendente"',
            [beneficiaryId]
        );

        if (pendingRequests[0].count >= 3) {
            return res.status(400).json({
                success: false,
                message: 'Você já possui 3 solicitações pendentes. Aguarde o atendimento antes de fazer novas solicitações.'
            });
        }

        // Inserir solicitação
        const result = await query(
            'INSERT INTO requests (title, description, category, urgency, beneficiary_id) VALUES (?, ?, ?, ?, ?)',
            [title, description, category, urgency, beneficiaryId]
        );

        // Buscar solicitação criada
        const newRequest = await query(`
            SELECT r.*, u.name as beneficiary_name, u.email as beneficiary_email 
            FROM requests r 
            LEFT JOIN users u ON r.beneficiary_id = u.id 
            WHERE r.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Solicitação criada com sucesso!',
            data: newRequest[0]
        });

    } catch (error) {
        console.error('Erro ao criar solicitação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Atualizar solicitação
const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, urgency } = req.body;
        const userId = req.user.id;

        // Verificar se a solicitação existe e pertence ao usuário
        const existingRequests = await query(
            'SELECT * FROM requests WHERE id = ? AND beneficiary_id = ?',
            [id, userId]
        );

        if (existingRequests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada ou você não tem permissão para editá-la'
            });
        }

        // Verificar se a solicitação não foi atendida
        if (existingRequests[0].status === 'atendida') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível editar uma solicitação já atendida'
            });
        }

        // Atualizar solicitação
        await query(
            'UPDATE requests SET title = ?, description = ?, category = ?, urgency = ? WHERE id = ?',
            [title, description, category, urgency, id]
        );

        // Buscar solicitação atualizada
        const updatedRequest = await query(`
            SELECT r.*, u.name as beneficiary_name, u.email as beneficiary_email 
            FROM requests r 
            LEFT JOIN users u ON r.beneficiary_id = u.id 
            WHERE r.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Solicitação atualizada com sucesso!',
            data: updatedRequest[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar solicitação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Excluir solicitação
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar se a solicitação existe e pertence ao usuário
        const existingRequests = await query(
            'SELECT * FROM requests WHERE id = ? AND beneficiary_id = ?',
            [id, userId]
        );

        if (existingRequests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada ou você não tem permissão para excluí-la'
            });
        }

        // Verificar se a solicitação não foi atendida
        if (existingRequests[0].status === 'atendida') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir uma solicitação já atendida'
            });
        }

        // Excluir solicitação
        await query('DELETE FROM requests WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Solicitação excluída com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao excluir solicitação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Aprovar solicitação (apenas organizações e admins)
const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar se o usuário tem permissão
        if (req.user.type !== 'organizacao' && req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Apenas organizações e administradores podem aprovar solicitações'
            });
        }

        // Verificar se a solicitação existe e está pendente
        const requests = await query(
            'SELECT * FROM requests WHERE id = ? AND status = "pendente"',
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada ou não está pendente'
            });
        }

        // Aprovar solicitação
        await query(
            'UPDATE requests SET status = "atendida", approved_by = ? WHERE id = ?',
            [userId, id]
        );

        res.json({
            success: true,
            message: 'Solicitação aprovada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao aprovar solicitação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Rejeitar solicitação (apenas organizações e admins)
const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar se o usuário tem permissão
        if (req.user.type !== 'organizacao' && req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Apenas organizações e administradores podem rejeitar solicitações'
            });
        }

        // Verificar se a solicitação existe e está pendente
        const requests = await query(
            'SELECT * FROM requests WHERE id = ? AND status = "pendente"',
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitação não encontrada ou não está pendente'
            });
        }

        // Rejeitar solicitação
        await query(
            'UPDATE requests SET status = "rejeitada", approved_by = ? WHERE id = ?',
            [userId, id]
        );

        res.json({
            success: true,
            message: 'Solicitação rejeitada'
        });

    } catch (error) {
        console.error('Erro ao rejeitar solicitação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter estatísticas das solicitações
const getRequestStats = async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pending_requests,
                SUM(CASE WHEN status = 'atendida' THEN 1 ELSE 0 END) as approved_requests,
                SUM(CASE WHEN status = 'rejeitada' THEN 1 ELSE 0 END) as rejected_requests,
                COUNT(DISTINCT beneficiary_id) as total_beneficiaries
            FROM requests
        `);

        const urgencyStats = await query(`
            SELECT 
                urgency,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'atendida' THEN 1 ELSE 0 END) as approved
            FROM requests 
            GROUP BY urgency
        `);

        const categoryStats = await query(`
            SELECT 
                category,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'atendida' THEN 1 ELSE 0 END) as approved
            FROM requests 
            GROUP BY category
        `);

        res.json({
            success: true,
            data: {
                general: stats[0],
                byUrgency: urgencyStats,
                byCategory: categoryStats
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    getAllRequests,
    getRequestById,
    createRequest,
    updateRequest,
    deleteRequest,
    approveRequest,
    rejectRequest,
    getRequestStats
}; 