-- Banco de dados para o jogo Batalha Naval
-- Execute este script no seu MySQL/phpMyAdmin

CREATE DATABASE IF NOT EXISTS battleship;
USE battleship;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de jogos
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NULL,
    player1_name VARCHAR(100) NOT NULL,
    player2_name VARCHAR(100) NULL,
    status ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
    turn INT DEFAULT 1,
    winner INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner) REFERENCES users(id)
);

-- Tabela de posições dos navios de cada jogador
CREATE TABLE IF NOT EXISTS ship_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    ship_id INT NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES users(id)
);

-- Tabela de ataques/movimentos de cada jogador
CREATE TABLE IF NOT EXISTS player_attacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    attacker_id INT NOT NULL,
    target_id INT NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (attacker_id) REFERENCES users(id),
    FOREIGN KEY (target_id) REFERENCES users(id),
    UNIQUE KEY unique_attack (game_id, attacker_id, x, y)
);

-- Tabela de movimentos (usada pela API) - compatibilidade
CREATE TABLE IF NOT EXISTS moves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES users(id),
    UNIQUE KEY unique_move (game_id, player_id, x, y)
);

-- Tabela para controlar turnos consecutivos quando acerta
CREATE TABLE IF NOT EXISTS game_turns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    current_player_id INT NOT NULL,
    consecutive_hits INT DEFAULT 0,
    last_move_hit BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (current_player_id) REFERENCES users(id)
);

-- Inserir alguns dados de teste (opcional)
INSERT INTO users (username, display_name) VALUES 
('player1_test', 'Jogador 1'),
('player2_test', 'Jogador 2');
