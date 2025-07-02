// Application State
let currentUser = null;
let items = [];
let requests = [];
let events = [];
let users = [];

// Charts instances
let charts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // loadMockData(); // Removido para usar dados reais do backend
    updateStats();
    loadItems();
    loadRequests();
    loadEvents();
    
    // Set up search functionality
    document.getElementById('searchItems').addEventListener('input', filterItems);
    
    // Set up form handlers
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);
    document.getElementById('addRequestForm').addEventListener('submit', handleAddRequest);
    document.getElementById('addEventForm').addEventListener('submit', handleAddEvent);
    document.getElementById('donateEventForm').addEventListener('submit', handleDonateToEvent);
}

function loadMockData() {
    // Mock users
    users = [
        { id: 1, name: 'Maria Silva', email: 'maria@email.com', type: 'doador', phone: '(11) 99999-9999', address: 'São Paulo, SP' },
        { id: 2, name: 'João Santos', email: 'joao@email.com', type: 'beneficiario', phone: '(11) 88888-8888', address: 'Rio de Janeiro, RJ' },
        { id: 3, name: 'ONG Esperança', email: 'contato@esperanca.org', type: 'organizacao', phone: '(11) 77777-7777', address: 'Brasília, DF' }
    ];

    // Mock items
    items = [
        { id: 1, name: 'Conjunto de Roupas Infantis', description: 'Roupas para crianças de 2 a 5 anos, em bom estado de conservação', quantity: 10, category: 'roupas', status: 'disponivel', donorId: 1, createdAt: new Date('2024-01-15') },
        { id: 2, name: 'Livros Didáticos', description: 'Coleção de livros do ensino fundamental', quantity: 25, category: 'livros', status: 'disponivel', donorId: 1, createdAt: new Date('2024-01-20') },
        { id: 3, name: 'Cestas Básicas', description: 'Cestas com alimentos não perecíveis', quantity: 5, category: 'alimentos', status: 'reservado', donorId: 3, createdAt: new Date('2024-01-25') },
        { id: 4, name: 'Brinquedos Educativos', description: 'Jogos e brinquedos para desenvolvimento infantil', quantity: 15, category: 'brinquedos', status: 'disponivel', donorId: 1, createdAt: new Date('2024-02-01') }
    ];

    // Mock requests
    requests = [
        { id: 1, title: 'Roupas de Inverno', description: 'Preciso de roupas quentes para minha família', category: 'roupas', status: 'pendente', urgency: 'alta', beneficiaryId: 2, createdAt: new Date('2024-01-18') },
        { id: 2, title: 'Material Escolar', description: 'Cadernos, lápis e material para o ano letivo', category: 'outros', status: 'atendida', urgency: 'media', beneficiaryId: 2, createdAt: new Date('2024-01-22') },
        { id: 3, title: 'Alimentos Não Perecíveis', description: 'Família em situação de vulnerabilidade precisa de ajuda com alimentação', category: 'alimentos', status: 'pendente', urgency: 'alta', beneficiaryId: 2, createdAt: new Date('2024-02-05') }
    ];

    // Mock events
    events = [
        { 
            id: 1, 
            title: 'Campanha do Agasalho 2024', 
            description: 'Arrecadação de roupas de inverno para famílias carentes', 
            start_date: '2024-06-01', 
            end_date: '2024-08-31', 
            goal_amount: 5000.00, 
            goal_items: 500, 
            current_amount: 2500.00,
            current_items: 250,
            status: 'ativo', 
            organization_id: 3,
            organization_name: 'ONG Esperança',
            created_at: new Date('2024-06-01')
        },
        { 
            id: 2, 
            title: 'Natal Solidário', 
            description: 'Campanha para arrecadar brinquedos e alimentos para crianças', 
            start_date: '2024-11-01', 
            end_date: '2024-12-25', 
            goal_amount: 3000.00, 
            goal_items: 200, 
            current_amount: 1800.00,
            current_items: 120,
            status: 'ativo', 
            organization_id: 3,
            organization_name: 'ONG Esperança',
            created_at: new Date('2024-11-01')
        }
    ];
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // Load section-specific data
    if (sectionName === 'items') {
        loadItems();
    } else if (sectionName === 'requests') {
        loadRequests();
    } else if (sectionName === 'events') {
        loadEvents();
    } else if (sectionName === 'reports') {
        loadReports();
    }
}

function updateStats() {
    document.getElementById('totalItems').textContent = items.length;
    document.getElementById('totalDonations').textContent = items.filter(item => item.status === 'entregue').length;
    document.getElementById('totalRequests').textContent = requests.filter(req => req.status === 'atendida').length;
    document.getElementById('totalUsers').textContent = users.length;
}

// Items functions
async function loadItems() {
    try {
        const response = await api.getItems();
        items = response.data;
        displayItems();
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
        showAlert('Erro ao carregar itens', 'error');
    }
}

function displayItems() {
    const grid = document.getElementById('itemsGrid');
    const searchTerm = document.getElementById('searchItems').value.toLowerCase();
    
    let filteredItems = items;
    if (searchTerm) {
        filteredItems = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }

    grid.innerHTML = '';
    
    if (filteredItems.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Nenhum item encontrado.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const itemCard = createItemCard(item);
        grid.appendChild(itemCard);
    });
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const statusClass = `status-${item.status}`;
    const statusText = {
        'disponivel': 'Disponível',
        'reservado': 'Reservado',
        'entregue': 'Entregue'
    }[item.status];

    const categoryIcon = {
        'roupas': '👕',
        'alimentos': '🍎',
        'moveis': '🪑',
        'eletronicos': '📱',
        'livros': '📚',
        'brinquedos': '🧸',
        'outros': '📦'
    }[item.category] || '📦';

    card.innerHTML = `
        <div class="item-image">${categoryIcon}</div>
        <div class="item-content">
            <div class="item-title">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-meta">
                <span>Quantidade: ${item.quantity}</span>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                <strong>Doador:</strong> ${item.donor_name || 'Anônimo'}<br>
                <strong>Categoria:</strong> ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                ${item.status === 'disponivel' ? '<button class="btn btn-success btn-sm" onclick="requestItem(' + item.id + ')">Solicitar</button>' : ''}
                ${currentUser && currentUser.id === item.donor_id ? '<button class="btn btn-warning btn-sm" onclick="editItem(' + item.id + ')">Editar</button>' : ''}
                ${currentUser && currentUser.id === item.donor_id ? '<button class="btn btn-danger btn-sm" onclick="deleteItem(' + item.id + ')">Excluir</button>' : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Requests functions
async function loadRequests() {
    try {
        const response = await api.getRequests();
        requests = response.data;
        displayRequests();
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        showAlert('Erro ao carregar solicitações', 'error');
    }
}

function displayRequests() {
    const grid = document.getElementById('requestsGrid');
    grid.innerHTML = '';
    
    if (requests.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Nenhuma solicitação encontrada.</p>';
        return;
    }

    requests.forEach(request => {
        const requestCard = createRequestCard(request);
        grid.appendChild(requestCard);
    });
}

function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    const statusClass = `status-${request.status === 'pendente' ? 'disponivel' : request.status === 'atendida' ? 'entregue' : 'reservado'}`;
    const statusText = {
        'pendente': 'Pendente',
        'atendida': 'Atendida',
        'rejeitada': 'Rejeitada'
    }[request.status];

    const urgencyColor = {
        'baixa': '#28a745',
        'media': '#ffc107',
        'alta': '#dc3545'
    }[request.urgency];

    const categoryIcon = {
        'roupas': '👕',
        'alimentos': '🍎',
        'moveis': '🪑',
        'eletronicos': '📱',
        'livros': '📚',
        'brinquedos': '🧸',
        'outros': '📦'
    }[request.category] || '📦';

    card.innerHTML = `
        <div class="item-image">${categoryIcon}</div>
        <div class="item-content">
            <div class="item-title">${request.title}</div>
            <div class="item-description">${request.description}</div>
            <div class="item-meta">
                <span style="color: ${urgencyColor};">Urgência: ${request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}</span>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                <strong>Solicitante:</strong> ${request.beneficiary_name || 'Anônimo'}<br>
                <strong>Categoria:</strong> ${request.category.charAt(0).toUpperCase() + request.category.slice(1)}<br>
                <strong>Data:</strong> ${new Date(request.created_at).toLocaleDateString('pt-BR')}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                ${currentUser && (currentUser.type === 'organizacao' || currentUser.type === 'admin') && request.status === 'pendente' ? 
                    '<button class="btn btn-success btn-sm" onclick="approveRequest(' + request.id + ')">Aprovar</button>' : ''}
                ${currentUser && (currentUser.type === 'organizacao' || currentUser.type === 'admin') && request.status === 'pendente' ? 
                    '<button class="btn btn-danger btn-sm" onclick="rejectRequest(' + request.id + ')">Rejeitar</button>' : ''}
                ${currentUser && currentUser.id === request.beneficiary_id ? 
                    '<button class="btn btn-warning btn-sm" onclick="editRequest(' + request.id + ')">Editar</button>' : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Events functions
async function loadEvents() {
    try {
        const response = await api.getEvents();
        events = response.data;
        displayEvents();
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showAlert('Erro ao carregar eventos', 'error');
    }
}

function displayEvents() {
    const grid = document.getElementById('eventsGrid');
    grid.innerHTML = '';
    
    if (events.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Nenhum evento encontrado.</p>';
        return;
    }

    events.forEach(event => {
        const eventCard = createEventCard(event);
        grid.appendChild(eventCard);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    const amountProgress = event.goal_amount ? (event.current_amount / event.goal_amount) * 100 : 0;
    const itemsProgress = event.goal_items ? (event.current_items / event.goal_items) * 100 : 0;
    
    const statusClass = `status-${event.status}`;
    const statusText = {
        'ativo': 'Ativo',
        'finalizado': 'Finalizado',
        'cancelado': 'Cancelado'
    }[event.status];

    card.innerHTML = `
        <div class="event-header">
            <div>
                <div class="event-title">${event.title}</div>
                <div class="event-organization">${event.organization_name}</div>
            </div>
            <span class="event-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="event-description">${event.description}</div>
        
        <div class="event-dates">
            <span><strong>Início:</strong> ${new Date(event.start_date).toLocaleDateString('pt-BR')}</span>
            <span><strong>Fim:</strong> ${new Date(event.end_date).toLocaleDateString('pt-BR')}</span>
        </div>
        
        <div class="event-goals">
            ${event.goal_amount ? `
                <div class="goal-item">
                    <div class="goal-label">Meta de Valor</div>
                    <div class="goal-value">R$ ${(Number(event.current_amount) || 0).toFixed(2)} / R$ ${(Number(event.goal_amount) || 0).toFixed(2)}</div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar" style="width: ${Math.min(amountProgress, 100)}%"></div>
                    </div>
                </div>
            ` : ''}
            
            ${event.goal_items ? `
                <div class="goal-item">
                    <div class="goal-label">Meta de Itens</div>
                    <div class="goal-value">${event.current_items} / ${event.goal_items}</div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar" style="width: ${Math.min(itemsProgress, 100)}%"></div>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="event-actions">
            <button class="btn btn-primary btn-sm" onclick="showDonateToEvent(${event.id})">Fazer Doação</button>
            ${currentUser && currentUser.id === event.organization_id ? 
                '<button class="btn btn-warning btn-sm" onclick="editEvent(' + event.id + ')">Editar</button>' : ''}
            ${currentUser && currentUser.id === event.organization_id ? 
                '<button class="btn btn-danger btn-sm" onclick="deleteEvent(' + event.id + ')">Excluir</button>' : ''}
        </div>
    `;
    
    return card;
}

// Reports functions
async function loadReports() {
    try {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        const filters = {};
        if (startDate) filters.start_date = startDate;
        if (endDate) filters.end_date = endDate;
        
        const response = await api.getGeneralReport(filters);
        displayReportResults(response.data);
        createCharts(response.data);
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        showAlert('Erro ao carregar relatórios', 'error');
    }
}

function displayReportResults(data) {
    const results = document.getElementById('reportResults');
    
    const attendanceRate = data.requests.total_requests > 0 
        ? ((data.requests.approved_requests / data.requests.total_requests) * 100).toFixed(1)
        : 0;
    
    results.innerHTML = `
        <div class="report-summary fade-in">
            <h3>Relatório Geral - ${data.period.start_date} a ${data.period.end_date}</h3>
            
            <div class="report-stats">
                <div class="report-stat">
                    <span class="report-stat-value">${data.general.total_users}</span>
                    <span class="report-stat-label">Total de Usuários</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-value">${data.items.total_items}</span>
                    <span class="report-stat-label">Itens Cadastrados</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-value">${data.requests.total_requests}</span>
                    <span class="report-stat-label">Solicitações</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-value">${attendanceRate}%</span>
                    <span class="report-stat-label">Taxa de Atendimento</span>
                </div>
            </div>
            
            <div class="report-stats">
                <div class="report-stat">
                    <span class="report-stat-value">${data.general.total_donors}</span>
                    <span class="report-stat-label">Doadores</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-value">${data.general.total_beneficiaries}</span>
                    <span class="report-stat-label">Beneficiários</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-value">${data.items.delivered_items}</span>
                    <span class="report-stat-label">Itens Entregues</span>
                </div>
                <div class="report-stat">
                    <span class="report-stat-value">${data.requests.approved_requests}</span>
                    <span class="report-stat-label">Solicitações Atendidas</span>
                </div>
            </div>
        </div>
    `;
}

function createCharts(data) {
    // Items by Category Chart
    const itemsCtx = document.getElementById('itemsByCategoryChart').getContext('2d');
    if (charts.itemsByCategory) charts.itemsByCategory.destroy();
    
    charts.itemsByCategory = new Chart(itemsCtx, {
        type: 'doughnut',
        data: {
            labels: data.itemsByCategory.map(item => item.category.charAt(0).toUpperCase() + item.category.slice(1)),
            datasets: [{
                data: data.itemsByCategory.map(item => item.total),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Requests by Urgency Chart
    const requestsCtx = document.getElementById('requestsByUrgencyChart').getContext('2d');
    if (charts.requestsByUrgency) charts.requestsByUrgency.destroy();
    
    charts.requestsByUrgency = new Chart(requestsCtx, {
        type: 'bar',
        data: {
            labels: data.requestsByUrgency.map(item => item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)),
            datasets: [{
                label: 'Total',
                data: data.requestsByUrgency.map(item => item.total),
                backgroundColor: '#667eea'
            }, {
                label: 'Aprovadas',
                data: data.requestsByUrgency.map(item => item.approved),
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Attendance Rate Chart
    const attendanceCtx = document.getElementById('attendanceRateChart').getContext('2d');
    if (charts.attendanceRate) charts.attendanceRate.destroy();
    
    const attendanceRate = data.requests.total_requests > 0 
        ? ((data.requests.approved_requests / data.requests.total_requests) * 100)
        : 0;
    
    charts.attendanceRate = new Chart(attendanceCtx, {
        type: 'doughnut',
        data: {
            labels: ['Atendidas', 'Pendentes'],
            datasets: [{
                data: [data.requests.approved_requests, data.requests.total_requests - data.requests.approved_requests],
                backgroundColor: ['#28a745', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await api.login({ email, password });
        if (response.success) {
            currentUser = response.data.user;
            updateUI();
            closeModal('loginModal');
            showAlert('Login realizado com sucesso!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Erro no login', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        phone: document.getElementById('registerPhone').value,
        type: document.getElementById('registerType').value,
        address: document.getElementById('registerAddress').value,
        password: document.getElementById('registerPassword').value
    };
    
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (formData.password !== confirmPassword) {
        showAlert('As senhas não coincidem!', 'error');
        return;
    }
    
    try {
        const response = await api.register(formData);
        if (response.success) {
            currentUser = response.data.user;
            updateUI();
            closeModal('registerModal');
            showAlert('Cadastro realizado com sucesso!', 'success');
            updateStats();
        }
    } catch (error) {
        showAlert(error.message || 'Erro no cadastro', 'error');
    }
}

function logout() {
    api.logout();
    currentUser = null;
    updateUI();
    showAlert('Logout realizado com sucesso!', 'info');
}

function updateUI() {
    const loginSection = document.getElementById('loginSection');
    const userSection = document.getElementById('userSection');
    const addItemBtn = document.getElementById('addItemBtn');
    const addRequestBtn = document.getElementById('addRequestBtn');
    const addEventBtn = document.getElementById('addEventBtn');
    
    if (currentUser) {
        loginSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Show/hide buttons based on user type
        if (currentUser.type === 'doador' || currentUser.type === 'organizacao') {
            addItemBtn.style.display = 'inline-block';
        }
        if (currentUser.type === 'beneficiario') {
            addRequestBtn.style.display = 'inline-block';
        }
        if (currentUser.type === 'organizacao') {
            addEventBtn.style.display = 'inline-block';
        }
    } else {
        loginSection.classList.remove('hidden');
        userSection.classList.add('hidden');
        addItemBtn.style.display = 'none';
        addRequestBtn.style.display = 'none';
        addEventBtn.style.display = 'none';
    }
    
    loadItems();
    loadRequests();
    loadEvents();
}

// Item management functions
async function handleAddItem(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('itemName').value,
        description: document.getElementById('itemDescription').value,
        quantity: parseInt(document.getElementById('itemQuantity').value),
        category: document.getElementById('itemCategory').value
    };
    
    try {
        const response = await api.createItem(formData);
        if (response.success) {
            closeModal('addItemModal');
            document.getElementById('addItemForm').reset();
            loadItems();
            updateStats();
            showAlert('Item cadastrado com sucesso!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Erro ao cadastrar item', 'error');
    }
}

async function requestItem(itemId) {
    try {
        const response = await api.requestItem(itemId);
        if (response.success) {
            loadItems();
            showAlert('Item solicitado com sucesso! Aguarde contato do doador.', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Erro ao solicitar item', 'error');
    }
}

// Request management functions
async function handleAddRequest(e) {
    e.preventDefault();
    const formData = {
        title: document.getElementById('requestTitle').value,
        description: document.getElementById('requestDescription').value,
        category: document.getElementById('requestCategory').value,
        urgency: document.getElementById('requestUrgency').value
    };
    
    try {
        const response = await api.createRequest(formData);
        if (response.success) {
            closeModal('addRequestModal');
            document.getElementById('addRequestForm').reset();
            loadRequests();
            updateStats();
            showAlert('Solicitação enviada com sucesso!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Erro ao criar solicitação', 'error');
    }
}

async function approveRequest(requestId) {
    try {
        const response = await api.approveRequest(requestId);
        if (response.success) {
            loadRequests();
            updateStats();
            showAlert('Solicitação aprovada com sucesso!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Erro ao aprovar solicitação', 'error');
    }
}

async function rejectRequest(requestId) {
    try {
        const response = await api.rejectRequest(requestId);
        if (response.success) {
            loadRequests();
            showAlert('Solicitação rejeitada.', 'info');
        }
    } catch (error) {
        showAlert(error.message || 'Erro ao rejeitar solicitação', 'error');
    }
}

// Event management functions
async function handleAddEvent(e) {
    e.preventDefault();
    const formData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        start_date: document.getElementById('eventStartDate').value,
        end_date: document.getElementById('eventEndDate').value,
        goal_amount: parseFloat(document.getElementById('eventGoalAmount').value) || null,
        goal_items: parseInt(document.getElementById('eventGoalItems').value) || null
    };
    
    try {
        const response = await api.createEvent(formData);
        if (response.success) {
            closeModal('addEventModal');
            document.getElementById('addEventForm').reset();
            loadEvents();
            showAlert('Evento criado com sucesso!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Erro ao criar evento', 'error');
    }
}

async function handleDonateToEvent(e) {
    e.preventDefault();
    const eventId = currentEventId; // Global variable to store current event ID
    const formData = {
        amount: parseFloat(document.getElementById('donationAmount').value) || null,
        items_description: document.getElementById('donationItems').value || null
    };
    
    try {
        const response = await api.donateToEvent(eventId, formData);
        if (response.success) {
            closeModal('donateEventModal');
            document.getElementById('donateEventForm').reset();
            loadEvents();
            showAlert('Doação realizada com sucesso!', 'success');
        }
    } catch (error) {
        showAlert(error.message || 'Erro ao fazer doação', 'error');
    }
}

// Report functions
async function generateReport() {
    try {
        await loadReports();
        showAlert('Relatório gerado com sucesso!', 'success');
    } catch (error) {
        showAlert(error.message || 'Erro ao gerar relatório', 'error');
    }
}

async function downloadPDFReport() {
    try {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        const filters = {};
        if (startDate) filters.start_date = startDate;
        if (endDate) filters.end_date = endDate;
        
        await api.downloadPDFReport(filters);
        showAlert('Relatório PDF baixado com sucesso!', 'success');
    } catch (error) {
        showAlert(error.message || 'Erro ao baixar relatório', 'error');
    }
}

// Utility functions
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
}

function showAddItem() {
    if (!currentUser || (currentUser.type !== 'doador' && currentUser.type !== 'organizacao')) {
        showAlert('Apenas doadores e organizações podem cadastrar itens!', 'error');
        return;
    }
    document.getElementById('addItemModal').style.display = 'block';
}

function showAddRequest() {
    if (!currentUser || currentUser.type !== 'beneficiario') {
        showAlert('Apenas beneficiários podem fazer solicitações!', 'error');
        return;
    }
    document.getElementById('addRequestModal').style.display = 'block';
}

function showAddEvent() {
    if (!currentUser || currentUser.type !== 'organizacao') {
        showAlert('Apenas organizações podem criar eventos!', 'error');
        return;
    }
    document.getElementById('addEventModal').style.display = 'block';
}

let currentEventId = null;
function showDonateToEvent(eventId) {
    if (!currentUser) {
        showAlert('Faça login para fazer doações!', 'error');
        return;
    }
    currentEventId = eventId;
    document.getElementById('donateEventModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function filterItems() {
    displayItems();
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at the beginning of main content
    const main = document.querySelector('main .container');
    main.insertBefore(alertDiv, main.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Demo login credentials alert
setTimeout(() => {
    showAlert('Demo: Use email "maria@email.com", "joao@email.com" ou "contato@esperanca.org" com senha "123456" para testar o sistema.', 'info');
}, 2000);

window.showSection = showSection;
    