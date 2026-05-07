CREATE DATABASE IF NOT EXISTS smartlab;
USE smartlab;

CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'technicien',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    raison_sociale VARCHAR(200) NOT NULL,
    contact_nom VARCHAR(100),
    contact_telephone VARCHAR(30),
    secteur VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS essais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(20) UNIQUE NOT NULL,
    type_essai VARCHAR(100) NOT NULL,
    norme VARCHAR(100) NOT NULL,
    client_id INT,
    phase VARCHAR(50) DEFAULT 'reception',
    statut VARCHAR(50) DEFAULT 'en_cours',
    date_planification DATE,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

INSERT IGNORE INTO clients (code, raison_sociale, contact_nom, contact_telephone, secteur) VALUES
('CLI-001', 'Sogéa BTP Bénin', 'M. Fonton', '+22997123456', 'BTP'),
('CLI-002', 'AGETUR Bénin', 'Mme Ahoton', '+22995678901', 'Infrastructure');

-- Mot de passe: admin123 (hash à générer avec bcrypt)
INSERT IGNORE INTO utilisateurs (nom, prenom, email, password_hash, role) VALUES
('Admin', 'SMARTLAB', 'admin@smartlab.com', '$2b$10$YourHashHere', 'directeur');
