CREATE DATABASE meteotrack;

-- Depois de criar o banco, conecte nele e rode o restante:

CREATE TABLE locais_monitorados (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Brasil',
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    tipo VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registros_meteorologicos (
    id SERIAL PRIMARY KEY,
    local_id INTEGER NOT NULL REFERENCES locais_monitorados(id) ON DELETE CASCADE,
    data_hora TIMESTAMP NOT NULL,
    temperatura DECIMAL(6, 2),
    umidade DECIMAL(6, 2),
    pressao DECIMAL(8, 2),
    vento_velocidade DECIMAL(6, 2),
    vento_direcao DECIMAL(6, 2),
    precipitacao DECIMAL(6, 2),
    nebulosidade DECIMAL(6, 2),
    visibilidade DECIMAL(8, 2),
    origem VARCHAR(20) DEFAULT 'manual',
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE relatorios (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    tipo VARCHAR(50),
    local_id INTEGER REFERENCES locais_monitorados(id) ON DELETE SET NULL,
    data_inicio DATE,
    data_fim DATE,
    arquivo_url TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO locais_monitorados 
(nome, cidade, estado, pais, latitude, longitude, tipo)
VALUES
('Estação Centro', 'Cascavel', 'Paraná', 'Brasil', -24.9555, -53.4552, 'Cidade'),
('Fazenda Norte', 'Toledo', 'Paraná', 'Brasil', -24.7136, -53.7431, 'Fazenda');