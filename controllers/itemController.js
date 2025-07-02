const { query } = require('../config/database');

// Listar todos os itens
const getAllItems = async (req, res) => {
    try {
        const { search, category, status } = req.query;
        
        let sql = `
            SELECT i.*, u.name as donor_name, u.email as donor_email 
            FROM items i 
            LEFT JOIN users u ON i.donor_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        // Filtros
        if (search) {
            sql += ` AND (i.name LIKE ? OR i.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            sql += ` AND i.category = ?`;
            params.push(category);
        }

        if (status) {
            sql += ` AND i.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY i.created_at DESC`;

        const items = await query(sql, params);

        res.json({
            success: true,
            data: items
        });

    } catch (error) {
        console.error('Erro ao listar itens:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter item por ID
const getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const items = await query(`
            SELECT i.*, u.name as donor_name, u.email as donor_email 
            FROM items i 
            LEFT JOIN users u ON i.donor_id = u.id 
            WHERE i.id = ?
        `, [id]);

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        res.json({
            success: true,
            data: items[0]
        });

    } catch (error) {
        console.error('Erro ao buscar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Criar novo item
const createItem = async (req, res) => {
    try {
        const { name, description, quantity, category } = req.body;
        const donorId = req.user.id;

        // Validações básicas
        if (!name || !description || !quantity || !category) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantidade deve ser maior que zero'
            });
        }

        // Inserir item
        const result = await query(
            'INSERT INTO items (name, description, quantity, category, donor_id) VALUES (?, ?, ?, ?, ?)',
            [name, description, quantity, category, donorId]
        );

        // Buscar item criado
        const newItem = await query(`
            SELECT i.*, u.name as donor_name, u.email as donor_email 
            FROM items i 
            LEFT JOIN users u ON i.donor_id = u.id 
            WHERE i.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Item cadastrado com sucesso!',
            data: newItem[0]
        });

    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Atualizar item
const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, quantity, category, status } = req.body;
        const userId = req.user.id;

        // Verificar se o item existe e pertence ao usuário
        const existingItems = await query(
            'SELECT * FROM items WHERE id = ? AND donor_id = ?',
            [id, userId]
        );

        if (existingItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado ou você não tem permissão para editá-lo'
            });
        }

        // Atualizar item
        await query(
            'UPDATE items SET name = ?, description = ?, quantity = ?, category = ?, status = ? WHERE id = ?',
            [name, description, quantity, category, status, id]
        );

        // Buscar item atualizado
        const updatedItem = await query(`
            SELECT i.*, u.name as donor_name, u.email as donor_email 
            FROM items i 
            LEFT JOIN users u ON i.donor_id = u.id 
            WHERE i.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Item atualizado com sucesso!',
            data: updatedItem[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Excluir item
const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar se o item existe e pertence ao usuário
        const existingItems = await query(
            'SELECT * FROM items WHERE id = ? AND donor_id = ?',
            [id, userId]
        );

        if (existingItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado ou você não tem permissão para excluí-lo'
            });
        }

        // Excluir item
        await query('DELETE FROM items WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Item excluído com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao excluir item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Solicitar item (reservar)
const requestItem = async (req, res) => {
    try {
        const { id } = req.params;
        const beneficiaryId = req.user.id;

        // Verificar se o usuário é beneficiário
        if (req.user.type !== 'beneficiario') {
            return res.status(403).json({
                success: false,
                message: 'Apenas beneficiários podem solicitar itens'
            });
        }

        // Verificar se o item existe e está disponível
        const items = await query(
            'SELECT * FROM items WHERE id = ? AND status = "disponivel"',
            [id]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado ou não está disponível'
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

        // Reservar item
        await query(
            'UPDATE items SET status = "reservado", beneficiary_id = ? WHERE id = ?',
            [beneficiaryId, id]
        );

        res.json({
            success: true,
            message: 'Item solicitado com sucesso! Aguarde contato do doador.'
        });

    } catch (error) {
        console.error('Erro ao solicitar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Aprovar entrega de item
const approveDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar se o item existe e pertence ao usuário
        const items = await query(
            'SELECT * FROM items WHERE id = ? AND donor_id = ?',
            [id, userId]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado ou você não tem permissão para aprová-lo'
            });
        }

        // Marcar como entregue
        await query(
            'UPDATE items SET status = "entregue" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Entrega aprovada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao aprovar entrega:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter estatísticas dos itens
const getItemStats = async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_items,
                SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as available_items,
                SUM(CASE WHEN status = 'reservado' THEN 1 ELSE 0 END) as reserved_items,
                SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as delivered_items,
                COUNT(DISTINCT donor_id) as total_donors
            FROM items
        `);

        const categoryStats = await query(`
            SELECT 
                category,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as delivered
            FROM items 
            GROUP BY category
        `);

        res.json({
            success: true,
            data: {
                general: stats[0],
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
    getAllItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    requestItem,
    approveDelivery,
    getItemStats
}; 