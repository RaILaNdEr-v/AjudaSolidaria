const PDFDocument = require('pdfkit');
const { query } = require('../config/database');

// Gerar relatório geral
const generateGeneralReport = async (req, res) => {
    const reportResponse = await getGeneralReportData(req);
    if (!reportResponse.success) {
        return res.status(500).json({ success: false, message: reportResponse.message || 'Erro ao gerar relatório' });
    }
    res.json({ success: true, data: reportResponse.data });
};

function hasReportPermission(user) {
    return user && (user.type === 'organizacao' || user.type === 'admin');
}

function validateDateParams(start_date, end_date) {
    if (start_date && isNaN(Date.parse(start_date))) return false;
    if (end_date && isNaN(Date.parse(end_date))) return false;
    return true;
}

function sanitizeFilenameDate(dateStr) {
    if (!dateStr) return 'geral';
    return String(dateStr).replace(/[^\d\w-]/g, '');
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function addPDFHeader(doc, reportData) {
    doc.fontSize(24)
        .text('Relatório Ajuda Solidária', { align: 'center' })
        .moveDown();
    doc.fontSize(14)
        .text(`Período: ${reportData.period.start_date} a ${reportData.period.end_date}`, { align: 'center' })
        .moveDown(2);
}

function addPDFStats(doc, reportData) {
    doc.fontSize(18).text('Estatísticas Gerais').moveDown();
    doc.fontSize(12)
        .text(`Total de Usuários: ${reportData.general.total_users}`)
        .text(`Doadores: ${reportData.general.total_donors}`)
        .text(`Beneficiários: ${reportData.general.total_beneficiaries}`)
        .text(`Organizações: ${reportData.general.total_organizations}`)
        .moveDown();
    doc.fontSize(18).text('Estatísticas de Itens').moveDown();
    doc.fontSize(12)
        .text(`Total de Itens: ${reportData.items.total_items}`)
        .text(`Itens Disponíveis: ${reportData.items.available_items}`)
        .text(`Itens Reservados: ${reportData.items.reserved_items}`)
        .text(`Itens Entregues: ${reportData.items.delivered_items}`)
        .text(`Doadores Ativos: ${reportData.items.active_donors}`)
        .moveDown();
    doc.fontSize(18).text('Estatísticas de Solicitações').moveDown();
    doc.fontSize(12)
        .text(`Total de Solicitações: ${reportData.requests.total_requests}`)
        .text(`Solicitações Pendentes: ${reportData.requests.pending_requests}`)
        .text(`Solicitações Atendidas: ${reportData.requests.approved_requests}`)
        .text(`Solicitações Rejeitadas: ${reportData.requests.rejected_requests}`)
        .text(`Beneficiários Ativos: ${reportData.requests.active_beneficiaries}`)
        .moveDown();
    const attendanceRate = reportData.requests.total_requests > 0
        ? ((reportData.requests.approved_requests / reportData.requests.total_requests) * 100).toFixed(1)
        : 0;
    doc.fontSize(16)
        .text(`Taxa de Atendimento: ${attendanceRate}%`)
        .moveDown(2);
}

function addPDFCategoryAndUrgency(doc, reportData) {
    const itemsByCategory = Array.isArray(reportData.itemsByCategory) ? reportData.itemsByCategory : [];
    doc.fontSize(18).text('Itens por Categoria').moveDown();
    itemsByCategory.forEach(category => {
        doc.fontSize(12)
            .text(`${capitalize(category.category)}: ${category.total} (${category.delivered} entregues)`)
            .moveDown(0.5);
    });
    doc.moveDown();
    const requestsByUrgency = Array.isArray(reportData.requestsByUrgency) ? reportData.requestsByUrgency : [];
    doc.fontSize(18).text('Solicitações por Urgência').moveDown();
    requestsByUrgency.forEach(urgency => {
        doc.fontSize(12)
            .text(`${capitalize(urgency.urgency)}: ${urgency.total} (${urgency.approved} aprovadas)`)
            .moveDown(0.5);
    });
    doc.moveDown();
}

function addPDFTopDonors(doc, reportData) {
    const topDonors = Array.isArray(reportData.topDonors) ? reportData.topDonors : [];
    if (topDonors.length > 0) {
        doc.fontSize(18).text('Top 10 Doadores').moveDown();
        topDonors.forEach((donor, index) => {
            doc.fontSize(12)
                .text(`${index + 1}. ${donor.name}: ${donor.items_donated} itens (${donor.items_delivered} entregues)`)
                .moveDown(0.5);
        });
    }
}

function addPDFFooter(doc) {
    doc.moveDown(2)
        .fontSize(10)
        .text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
}

// Função auxiliar para buscar dados do relatório geral (NÃO envia resposta HTTP)
async function getGeneralReportData(req) {
    try {
        const { start_date, end_date } = req.query;
        let dateFilter = '';
        const params = [];
        if (start_date && end_date) {
            dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }
        const generalStats = await query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN type = 'doador' THEN 1 ELSE 0 END) as total_donors,
                SUM(CASE WHEN type = 'beneficiario' THEN 1 ELSE 0 END) as total_beneficiaries,
                SUM(CASE WHEN type = 'organizacao' THEN 1 ELSE 0 END) as total_organizations
            FROM users
            ${dateFilter}
        `, params);
        const itemStats = await query(`
            SELECT 
                COUNT(*) as total_items,
                SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as available_items,
                SUM(CASE WHEN status = 'reservado' THEN 1 ELSE 0 END) as reserved_items,
                SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as delivered_items,
                COUNT(DISTINCT donor_id) as active_donors
            FROM items
            ${dateFilter}
        `, params);
        const requestStats = await query(`
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pending_requests,
                SUM(CASE WHEN status = 'atendida' THEN 1 ELSE 0 END) as approved_requests,
                SUM(CASE WHEN status = 'rejeitada' THEN 1 ELSE 0 END) as rejected_requests,
                COUNT(DISTINCT beneficiary_id) as active_beneficiaries
            FROM requests
            ${dateFilter}
        `, params);
        const eventStats = await query(`
            SELECT 
                COUNT(*) as total_events,
                SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as active_events,
                SUM(CASE WHEN status = 'finalizado' THEN 1 ELSE 0 END) as finished_events,
                SUM(current_amount) as total_amount_raised,
                SUM(current_items) as total_items_raised
            FROM events
            ${dateFilter}
        `, params);
        const itemsByCategory = await query(`
            SELECT 
                category,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as delivered
            FROM items
            ${dateFilter}
            GROUP BY category
            ORDER BY total DESC
        `, params);
        const requestsByUrgency = await query(`
            SELECT 
                urgency,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'atendida' THEN 1 ELSE 0 END) as approved
            FROM requests
            ${dateFilter}
            GROUP BY urgency
            ORDER BY total DESC
        `, params);
        const topDonors = await query(`
            SELECT 
                u.name,
                COUNT(i.id) as items_donated,
                SUM(CASE WHEN i.status = 'entregue' THEN 1 ELSE 0 END) as items_delivered
            FROM users u
            LEFT JOIN items i ON u.id = i.donor_id
            ${dateFilter ? 'WHERE DATE(i.created_at) BETWEEN ? AND ?' : 'WHERE i.id IS NOT NULL'}
            GROUP BY u.id, u.name
            HAVING items_donated > 0
            ORDER BY items_donated DESC
            LIMIT 10
        `, params);
        return {
            success: true,
            data: {
                period: {
                    start_date: start_date || 'Desde o início',
                    end_date: end_date || 'Até hoje'
                },
                general: generalStats[0],
                items: itemStats[0],
                requests: requestStats[0],
                events: eventStats[0],
                itemsByCategory,
                requestsByUrgency,
                topDonors
            }
        };
    } catch (error) {
        console.error('Erro ao buscar dados do relatório:', error);
        return { success: false, message: 'Erro ao buscar dados do relatório' };
    }
}

const generatePDFReport = async (req, res) => {
    const { start_date, end_date } = req.query;
    // Permissão e validação
    if (!hasReportPermission(req.user)) {
        return res.status(403).json({
            success: false,
            message: 'Apenas organizações e administradores podem gerar relatórios PDF'
        });
    }
    if (!validateDateParams(start_date, end_date)) {
        return res.status(400).json({
            success: false,
            message: 'Parâmetros de data inválidos'
        });
    }
    let reportData;
    try {
        const reportResponse = await getGeneralReportData(req);
        if (!reportResponse.success) {
            if (!res.headersSent) {
                return res.status(500).json({ success: false, message: reportResponse.message || 'Erro ao gerar relatório' });
            }
            return;
        }
        reportData = reportResponse.data;
    } catch (error) {
        console.error('Erro ao buscar dados do relatório:', error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Erro ao buscar dados do relatório' });
        }
        return;
    }
    try {
        const doc = new PDFDocument();
        const safeDate = sanitizeFilenameDate(start_date);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-ajuda-solidaria-${safeDate}.pdf`);
        doc.pipe(res);
        addPDFHeader(doc, reportData);
        addPDFStats(doc, reportData);
        addPDFCategoryAndUrgency(doc, reportData);
        addPDFTopDonors(doc, reportData);
        addPDFFooter(doc);
        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Erro ao gerar PDF' });
        }
    }
};

// Relatório de impacto
const generateImpactReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Verificar se o usuário tem permissão
        if (req.user.type !== 'organizacao' && req.user.type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Apenas organizações e administradores podem gerar relatórios de impacto'
            });
        }

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // Impacto por região (baseado no endereço)
        const impactByRegion = await query(`
            SELECT 
                SUBSTRING_INDEX(address, ',', 1) as region,
                COUNT(DISTINCT u.id) as users,
                COUNT(i.id) as items_donated,
                COUNT(r.id) as requests_made
            FROM users u
            LEFT JOIN items i ON u.id = i.donor_id ${dateFilter ? 'AND DATE(i.created_at) BETWEEN ? AND ?' : ''}
            LEFT JOIN requests r ON u.id = r.beneficiary_id ${dateFilter ? 'AND DATE(r.created_at) BETWEEN ? AND ?' : ''}
            GROUP BY region
            ORDER BY items_donated DESC
        `, [...params, ...params]);

        // Crescimento mensal
        const monthlyGrowth = await query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as new_users,
                SUM(CASE WHEN type = 'doador' THEN 1 ELSE 0 END) as new_donors,
                SUM(CASE WHEN type = 'beneficiario' THEN 1 ELSE 0 END) as new_beneficiaries
            FROM users
            ${dateFilter}
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        `, params);

        // Eficiência de entrega
        const deliveryEfficiency = await query(`
            SELECT 
                AVG(DATEDIFF(i.updated_at, i.created_at)) as avg_delivery_time_days,
                COUNT(CASE WHEN DATEDIFF(i.updated_at, i.created_at) <= 7 THEN 1 END) as fast_deliveries,
                COUNT(CASE WHEN DATEDIFF(i.updated_at, i.created_at) > 7 THEN 1 END) as slow_deliveries
            FROM items i
            WHERE i.status = 'entregue'
            ${dateFilter}
        `, params);

        const impactData = {
            period: {
                start_date: start_date || 'Desde o início',
                end_date: end_date || 'Até hoje'
            },
            impactByRegion,
            monthlyGrowth,
            deliveryEfficiency: deliveryEfficiency[0]
        };

        res.json({
            success: true,
            data: impactData
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de impacto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    generateGeneralReport,
    generatePDFReport,
    generateImpactReport
}; 