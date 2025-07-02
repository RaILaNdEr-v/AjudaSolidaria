// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Classe para gerenciar chamadas da API
class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    // Método para fazer requisições HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adicionar token de autenticação se existir
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Método para atualizar token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    // Autenticação
    async register(userData) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        const response = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    logout() {
        this.setToken(null);
    }

    // Usuários
    async getProfile() {
        return this.request('/user/profile');
    }

    async updateProfile(profileData) {
        return this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(passwordData) {
        return this.request('/user/password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    // Itens
    async getItems(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/items?${params}`);
    }

    async getItem(id) {
        return this.request(`/items/${id}`);
    }

    async createItem(itemData) {
        return this.request('/items', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    async updateItem(id, itemData) {
        return this.request(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    }

    async deleteItem(id) {
        return this.request(`/items/${id}`, {
            method: 'DELETE'
        });
    }

    async requestItem(id) {
        return this.request(`/items/${id}/request`, {
            method: 'POST'
        });
    }

    async approveDelivery(id) {
        return this.request(`/items/${id}/approve-delivery`, {
            method: 'POST'
        });
    }

    // Solicitações
    async getRequests(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/requests?${params}`);
    }

    async getRequest(id) {
        return this.request(`/requests/${id}`);
    }

    async createRequest(requestData) {
        return this.request('/requests', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    async updateRequest(id, requestData) {
        return this.request(`/requests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });
    }

    async deleteRequest(id) {
        return this.request(`/requests/${id}`, {
            method: 'DELETE'
        });
    }

    async approveRequest(id) {
        return this.request(`/requests/${id}/approve`, {
            method: 'POST'
        });
    }

    async rejectRequest(id) {
        return this.request(`/requests/${id}/reject`, {
            method: 'POST'
        });
    }

    // Eventos
    async getEvents(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/events?${params}`);
    }

    async getEvent(id) {
        return this.request(`/events/${id}`);
    }

    async createEvent(eventData) {
        return this.request('/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }

    async updateEvent(id, eventData) {
        return this.request(`/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });
    }

    async deleteEvent(id) {
        return this.request(`/events/${id}`, {
            method: 'DELETE'
        });
    }

    async donateToEvent(id, donationData) {
        return this.request(`/events/${id}/donate`, {
            method: 'POST',
            body: JSON.stringify(donationData)
        });
    }

    // Relatórios
    async getGeneralReport(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/reports/general?${params}`);
    }

    async getImpactReport(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/reports/impact?${params}`);
    }

    async downloadPDFReport(filters = {}) {
        const params = new URLSearchParams(filters);
        const url = `${this.baseURL}/reports/pdf?${params}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao baixar relatório');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `relatorio-ajuda-solidaria-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
    }

    // Verificar se o usuário está autenticado
    isAuthenticated() {
        return !!this.token;
    }

    // Verificar se o token ainda é válido
    async validateToken() {
        try {
            await this.getProfile();
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }
}

// Instância global da API
const api = new API();

// Verificar token ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    if (api.isAuthenticated()) {
        const isValid = await api.validateToken();
        if (!isValid) {
            showAlert('Sessão expirada. Faça login novamente.', 'error');
            updateUI();
        }
    }
}); 