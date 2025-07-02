const { query } = require('../config/database');

// Listar todos os eventos
const getAllEvents = async (req, res) => {
    try {
        const { status } = req.query;
        
        let sql = `
            SELECT e.*, u.name as organization_name, u.email as organization_email 
            FROM events e 
            LEFT JOIN users u ON e.organization_id = u.id 
            WHERE 1=1
        `;
        const params = [];

        // Filtros
        if (status) {
            sql += ` AND e.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY e.created_at DESC`;

        const events = await query(sql, params);

        res.json({
            success: true,
            data: events
        });

    } catch (error) {
        console.error('Erro ao listar eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter evento por ID
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const events = await query(`
            SELECT e.*, u.name as organization_name, u.email as organization_email 
            FROM events e 
            LEFT JOIN users u ON e.organization_id = u.id 
            WHERE e.id = ?
        `, [id]);

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evento não encontrado'
            });
        }

        // Buscar doações do evento
        const donations = await query(`
            SELECT ed.*, u.name as donor_name 
            FROM event_donations ed 
            LEFT JOIN users u ON ed.donor_id = u.id 
            WHERE ed.event_id = ?
            ORDER BY ed.created_at DESC
        `, [id]);

        const event = events[0];
        event.donations = donations;

        res.json({
            success: true,
            data: event
        });

    } catch (error) {
        console.error('Erro ao buscar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Criar novo evento
const createEvent = async (req, res) => {
    try {
        const { title, description, start_date, end_date, goal_amount, goal_items } = req.body;
        const organizationId = req.user.id;

        // Verificar se o usuário é uma organização
        if (req.user.type !== 'organizacao') {
            return res.status(403).json({
                success: false,
                message: 'Apenas organizações podem criar eventos'
            });
        }

        // Validações básicas
        if (!title || !description || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Título, descrição, data de início e data de fim são obrigatórios'
            });
        }

        // Validar datas
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const today = new Date();

        if (startDate < today) {
            return res.status(400).json({
                success: false,
                message: 'A data de início não pode ser anterior a hoje'
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'A data de fim deve ser posterior à data de início'
            });
        }

        // Inserir evento
        const result = await query(
            'INSERT INTO events (title, description, start_date, end_date, goal_amount, goal_items, organization_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, start_date, end_date, goal_amount || null, goal_items || null, organizationId]
        );

        // Buscar evento criado
        const newEvent = await query(`
            SELECT e.*, u.name as organization_name, u.email as organization_email 
            FROM events e 
            LEFT JOIN users u ON e.organization_id = u.id 
            WHERE e.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Evento criado com sucesso!',
            data: newEvent[0]
        });

    } catch (error) {
        console.error('Erro ao criar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Atualizar evento
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_date, end_date, goal_amount, goal_items, status } = req.body;
        const userId = req.user.id;

        // Verificar se o evento existe e pertence à organização
        const existingEvents = await query(
            'SELECT * FROM events WHERE id = ? AND organization_id = ?',
            [id, userId]
        );

        if (existingEvents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evento não encontrado ou você não tem permissão para editá-lo'
            });
        }

        // Validar datas se fornecidas
        if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const today = new Date();

            if (startDate < today) {
                return res.status(400).json({
                    success: false,
                    message: 'A data de início não pode ser anterior a hoje'
                });
            }

            if (endDate <= startDate) {
                return res.status(400).json({
                    success: false,
                    message: 'A data de fim deve ser posterior à data de início'
                });
            }
        }

        // Atualizar evento
        await query(
            'UPDATE events SET title = ?, description = ?, start_date = ?, end_date = ?, goal_amount = ?, goal_items = ?, status = ? WHERE id = ?',
            [title, description, start_date, end_date, goal_amount || null, goal_items || null, status, id]
        );

        // Buscar evento atualizado
        const updatedEvent = await query(`
            SELECT e.*, u.name as organization_name, u.email as organization_email 
            FROM events e 
            LEFT JOIN users u ON e.organization_id = u.id 
            WHERE e.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Evento atualizado com sucesso!',
            data: updatedEvent[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Excluir evento
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar se o evento existe e pertence à organização
        const existingEvents = await query(
            'SELECT * FROM events WHERE id = ? AND organization_id = ?',
            [id, userId]
        );

        if (existingEvents.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evento não encontrado ou você não tem permissão para excluí-lo'
            });
        }

        // Verificar se há doações no evento
        const donations = await query(
            'SELECT COUNT(*) as count FROM event_donations WHERE event_id = ?',
            [id]
        );

        if (donations[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível excluir um evento que possui doações registradas'
            });
        }

        // Excluir evento
        await query('DELETE FROM events WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Evento excluído com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Fazer doação para evento
const donateToEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, items_description } = req.body;
        const donorId = req.user.id;

        // Verificar se o evento existe e está ativo
        const events = await query(
            'SELECT * FROM events WHERE id = ? AND status = "ativo"',
            [id]
        );

        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evento não encontrado ou não está ativo'
            });
        }

        const event = events[0];

        // Validar doação
        if (!amount && !items_description) {
            return res.status(400).json({
                success: false,
                message: 'É necessário informar um valor ou descrição dos itens'
            });
        }

        if (amount && amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'O valor da doação deve ser maior que zero'
            });
        }

        // Inserir doação
        const result = await query(
            'INSERT INTO event_donations (event_id, donor_id, amount, items_description) VALUES (?, ?, ?, ?)',
            [id, donorId, amount || null, items_description || null]
        );

        // Atualizar contadores do evento
        if (amount) {
            await query(
                'UPDATE events SET current_amount = current_amount + ? WHERE id = ?',
                [amount, id]
            );
        }

        if (items_description) {
            await query(
                'UPDATE events SET current_items = current_items + 1 WHERE id = ?',
                [id]
            );
        }

        // Buscar doação criada
        const newDonation = await query(`
            SELECT ed.*, u.name as donor_name 
            FROM event_donations ed 
            LEFT JOIN users u ON ed.donor_id = u.id 
            WHERE ed.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Doação realizada com sucesso!',
            data: newDonation[0]
        });

    } catch (error) {
        console.error('Erro ao fazer doação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter estatísticas dos eventos
const getEventStats = async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_events,
                SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as active_events,
                SUM(CASE WHEN status = 'finalizado' THEN 1 ELSE 0 END) as finished_events,
                SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelled_events,
                COUNT(DISTINCT organization_id) as total_organizations
            FROM events
        `);

        const donationStats = await query(`
            SELECT 
                COUNT(*) as total_donations,
                SUM(amount) as total_amount,
                COUNT(DISTINCT donor_id) as total_donors,
                COUNT(DISTINCT event_id) as events_with_donations
            FROM event_donations
        `);

        res.json({
            success: true,
            data: {
                events: stats[0],
                donations: donationStats[0]
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
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    donateToEvent,
    getEventStats
}; 