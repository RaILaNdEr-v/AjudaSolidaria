const express = require('express');
const router = express.Router();

// Importar controladores
const userController = require('../controllers/userController');
const itemController = require('../controllers/itemController');
const requestController = require('../controllers/requestController');
const eventController = require('../controllers/eventController');
const reportController = require('../controllers/reportController');

// Importar middleware de autenticação
const { authenticateToken, requireAdmin, requireOrganization, requireDonor, requireBeneficiary } = require('../middleware/auth');

// Rotas de usuários (públicas)
router.post('/register', userController.register);
router.post('/login', userController.login);

// Rotas de usuários (autenticadas)
router.get('/user/profile', authenticateToken, userController.getProfile);
router.put('/user/profile', authenticateToken, userController.updateProfile);
router.put('/user/password', authenticateToken, userController.changePassword);
router.get('/users', authenticateToken, requireAdmin, userController.getAllUsers);

// Rotas de itens
router.get('/items', itemController.getAllItems);
router.get('/items/:id', itemController.getItemById);
router.post('/items', authenticateToken, requireDonor, itemController.createItem);
router.put('/items/:id', authenticateToken, itemController.updateItem);
router.delete('/items/:id', authenticateToken, itemController.deleteItem);
router.post('/items/:id/request', authenticateToken, requireBeneficiary, itemController.requestItem);
router.post('/items/:id/approve-delivery', authenticateToken, itemController.approveDelivery);
router.get('/items/stats', authenticateToken, requireAdmin, itemController.getItemStats);

// Rotas de solicitações
router.get('/requests', requestController.getAllRequests);
router.get('/requests/:id', requestController.getRequestById);
router.post('/requests', authenticateToken, requireBeneficiary, requestController.createRequest);
router.put('/requests/:id', authenticateToken, requestController.updateRequest);
router.delete('/requests/:id', authenticateToken, requestController.deleteRequest);
router.post('/requests/:id/approve', authenticateToken, requireAdmin, requestController.approveRequest);
router.post('/requests/:id/reject', authenticateToken, requireAdmin, requestController.rejectRequest);
router.get('/requests/stats', authenticateToken, requireAdmin, requestController.getRequestStats);

// Rotas de eventos
router.get('/events', eventController.getAllEvents);
router.get('/events/:id', eventController.getEventById);
router.post('/events', authenticateToken, requireOrganization, eventController.createEvent);
router.put('/events/:id', authenticateToken, requireOrganization, eventController.updateEvent);
router.delete('/events/:id', authenticateToken, requireOrganization, eventController.deleteEvent);
router.post('/events/:id/donate', authenticateToken, eventController.donateToEvent);
router.get('/events/stats', authenticateToken, requireAdmin, eventController.getEventStats);

// Rotas de relatórios
router.get('/reports/general', authenticateToken, requireAdmin, reportController.generateGeneralReport);
router.get('/reports/pdf', authenticateToken, requireAdmin, reportController.generatePDFReport);
router.get('/reports/impact', authenticateToken, requireAdmin, reportController.generateImpactReport);

// Rota de teste
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API Ajuda Solidária funcionando!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 