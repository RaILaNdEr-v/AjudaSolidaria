-- Script de criação do banco de dados para a plataforma Ajuda Solidária
-- Execute este script no seu MySQL para criar as tabelas necessárias

CREATE DATABASE IF NOT EXISTS ajuda_solidaria;
USE ajuda_solidaria;

-- Tabela de usuários
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    type ENUM('doador', 'beneficiario', 'organizacao', 'admin') NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de itens para doação
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    category ENUM('roupas', 'alimentos', 'moveis', 'eletronicos', 'livros', 'brinquedos', 'outros') NOT NULL,
    status ENUM('disponivel', 'reservado', 'entregue') DEFAULT 'disponivel',
    donor_id INT NOT NULL,
    beneficiary_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (beneficiary_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de solicitações de ajuda
CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('roupas', 'alimentos', 'moveis', 'eletronicos', 'livros', 'brinquedos', 'outros') NOT NULL,
    urgency ENUM('baixa', 'media', 'alta') NOT NULL,
    status ENUM('pendente', 'atendida', 'rejeitada') DEFAULT 'pendente',
    beneficiary_id INT NOT NULL,
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (beneficiary_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de eventos/campanhas
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goal_amount DECIMAL(10,2) NULL,
    goal_items INT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    current_items INT DEFAULT 0,
    status ENUM('ativo', 'finalizado', 'cancelado') DEFAULT 'ativo',
    organization_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de doações para eventos
CREATE TABLE event_donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    donor_id INT NOT NULL,
    amount DECIMAL(10,2) NULL,
    items_description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inserir dados de exemplo
INSERT INTO users (name, email, password_hash, phone, type, address) VALUES
('Maria Silva', 'maria@email.com', '$2b$12$kRUoEOBpB6tReer1X7uCyOaeXvN0CTkjq0Rtac6FXZVYLHDxsIEo', '(11) 99999-9999', 'doador', 'São Paulo, SP'),
('João Santos', 'joao@email.com', '$2b$12$kRUoEOBpB6tReer1X7uCyOaeXvN0CTkjq0Rtac6FXZVYLHDxsIEo', '(11) 88888-8888', 'beneficiario', 'Rio de Janeiro, RJ'),
('ONG Esperança', 'contato@esperanca.org', '$2b$12$kRUoEOBpB6tReer1X7uCyOaeXvN0CTkjq0Rtac6FXZVYLHDxsIEo', '(11) 77777-7777', 'organizacao', 'Brasília, DF'),
('Admin Sistema', 'admin@ajudasolidaria.com', '$2b$12$kRUoEOBpB6tReer1X7uCyOaeXvN0CTkjq0Rtac6FXZVYLHDxsIEo', '(11) 66666-6666', 'admin', 'São Paulo, SP');

-- Inserir itens de exemplo
INSERT INTO items (name, description, quantity, category, status, donor_id) VALUES
('Conjunto de Roupas Infantis', 'Roupas para crianças de 2 a 5 anos, em bom estado de conservação', 10, 'roupas', 'disponivel', 1),
('Livros Didáticos', 'Coleção de livros do ensino fundamental', 25, 'livros', 'disponivel', 1),
('Cestas Básicas', 'Cestas com alimentos não perecíveis', 5, 'alimentos', 'reservado', 3),
('Brinquedos Educativos', 'Jogos e brinquedos para desenvolvimento infantil', 15, 'brinquedos', 'disponivel', 1);

-- Inserir solicitações de exemplo
INSERT INTO requests (title, description, category, urgency, status, beneficiary_id) VALUES
('Roupas de Inverno', 'Preciso de roupas quentes para minha família', 'roupas', 'alta', 'pendente', 2),
('Material Escolar', 'Cadernos, lápis e material para o ano letivo', 'outros', 'media', 'atendida', 2),
('Alimentos Não Perecíveis', 'Família em situação de vulnerabilidade precisa de ajuda com alimentação', 'alimentos', 'alta', 'pendente', 2);

-- Inserir eventos de exemplo
INSERT INTO events (title, description, start_date, end_date, goal_amount, goal_items, organization_id) VALUES
('Campanha do Agasalho 2024', 'Arrecadação de roupas de inverno para famílias carentes', '2024-06-01', '2024-08-31', 5000.00, 500, 3),
('Natal Solidário', 'Campanha para arrecadar brinquedos e alimentos para crianças', '2024-11-01', '2024-12-25', 3000.00, 200, 3);

-- Criar índices para melhor performance
CREATE INDEX idx_items_donor ON items(donor_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_requests_beneficiary ON requests(beneficiary_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_events_status ON events(status); 