<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$db = 'battleship';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        $username = $_POST['username'] ?? '';
        $display_name = $_POST['display_name'] ?? '';
        
        if (empty($username) || empty($display_name)) {
            echo json_encode(['error' => 'Username and display name required']);
            exit;
        }
        
        // Verificar se o usuário já existe
        $stmt = $pdo->prepare("SELECT id, display_name FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->rowCount() > 0) {
            // Se já existe, retornar o ID existente
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'user_id' => $user['id'], 'display_name' => $user['display_name']]);
        } else {
            // Se não existe, criar novo usuário
            $stmt = $pdo->prepare("INSERT INTO users (username, display_name) VALUES (?, ?)");
            if ($stmt->execute([$username, $display_name])) {
                echo json_encode(['success' => true, 'user_id' => $pdo->lastInsertId(), 'display_name' => $display_name]);
            } else {
                echo json_encode(['error' => 'Registration failed']);
            }
        }
        break;

    case 'create_game':
        $player1_id = $_POST['player1_id'] ?? 0;
        $player1_name = $_POST['player1_name'] ?? '';
        
        if (!$player1_id || !$player1_name) {
            echo json_encode(['error' => 'Player ID and name required']);
            exit;
        }
        
        // Inicializar o jogo com turn = 1 (player1 começa)
        $stmt = $pdo->prepare("INSERT INTO games (player1_id, player1_name, status, turn) VALUES (?, ?, 'waiting', 1)");
        if ($stmt->execute([$player1_id, $player1_name])) {
            $game_id = $pdo->lastInsertId();
            
            // Inicializar controle de turnos
            $stmt = $pdo->prepare("INSERT INTO game_turns (game_id, current_player_id) VALUES (?, ?)");
            $stmt->execute([$game_id, $player1_id]);
            
            echo json_encode(['success' => true, 'game_id' => $game_id]);
        } else {
            echo json_encode(['error' => 'Game creation failed']);
        }
        break;

    case 'join_game':
        $game_id = $_POST['game_id'] ?? 0;
        $player2_id = $_POST['player2_id'] ?? 0;
        $player2_name = $_POST['player2_name'] ?? '';
        
        if (!$game_id || !$player2_id || !$player2_name) {
            echo json_encode(['error' => 'Game ID, Player ID and name required']);
            exit;
        }
        
        // Verificar se o jogo existe e está aguardando
        $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ? AND status = 'waiting'");
        $stmt->execute([$game_id]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$game) {
            echo json_encode(['error' => 'Jogo não encontrado ou não está aguardando jogadores']);
            exit;
        }
        
        // Verificar se ambos os jogadores têm navios posicionados
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT player_id) as players_with_ships FROM ship_positions WHERE game_id = ? AND player_id IN (?, ?)");
        $stmt->execute([$game_id, $game['player1_id'], $player2_id]);
        $players_with_ships = $stmt->fetch(PDO::FETCH_ASSOC)['players_with_ships'];
        
        if ($players_with_ships < 2) {
            echo json_encode(['error' => 'Ambos os jogadores devem posicionar seus navios antes de iniciar']);
            exit;
        }
        
        // Atualizar o jogo para incluir o segundo jogador e iniciar
        $stmt = $pdo->prepare("UPDATE games SET player2_id = ?, player2_name = ?, status = 'playing', turn = 1 WHERE id = ?");
        if ($stmt->execute([$player2_id, $player2_name, $game_id]) && $stmt->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Erro ao entrar no jogo']);
        }
        break;

    case 'place_ships':
        $game_id = $_POST['game_id'] ?? 0;
        $player_id = $_POST['player_id'] ?? 0;
        $ships = $_POST['ships'] ?? '';
        
        if (!$game_id || !$player_id || !$ships) {
            echo json_encode(['error' => 'Dados obrigatórios: game_id, player_id, ships']);
            exit;
        }
        
        // Decodificar JSON dos navios
        $ships_data = json_decode($ships, true);
        if (!$ships_data) {
            echo json_encode(['error' => 'Formato inválido dos navios']);
            exit;
        }
        
        // Verificar se o jogo existe
        $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ?");
        $stmt->execute([$game_id]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$game) {
            echo json_encode(['error' => 'Jogo não encontrado']);
            exit;
        }
        
        // Remover posições antigas deste jogador neste jogo (caso esteja reposicionando)
        $stmt = $pdo->prepare("DELETE FROM ship_positions WHERE game_id = ? AND player_id = ?");
        $stmt->execute([$game_id, $player_id]);
        
        // Validar e inserir novas posições
        $all_positions = [];
        foreach ($ships_data as $ship) {
            if (!isset($ship['id']) || !isset($ship['positions']) || !is_array($ship['positions'])) {
                echo json_encode(['error' => 'Formato inválido do navio']);
                exit;
            }
            
            foreach ($ship['positions'] as $position) {
                if (!isset($position['x']) || !isset($position['y'])) {
                    echo json_encode(['error' => 'Posição inválida do navio']);
                    exit;
                }
                
                $x = intval($position['x']);
                $y = intval($position['y']);
                
                // Validar limites do tabuleiro
                if ($x < 0 || $x >= 5 || $y < 0 || $y >= 5) {
                    echo json_encode(['error' => 'Posição fora dos limites do tabuleiro']);
                    exit;
                }
                
                // Verificar sobreposição
                $pos_key = $x . ',' . $y;
                if (in_array($pos_key, $all_positions)) {
                    echo json_encode(['error' => 'Navios não podem se sobrepor']);
                    exit;
                }
                $all_positions[] = $pos_key;
                
                // Inserir posição na base de dados
                $stmt = $pdo->prepare("INSERT INTO ship_positions (game_id, player_id, ship_id, x, y) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$game_id, $player_id, $ship['id'], $x, $y]);
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Navios posicionados com sucesso']);
        break;

    case 'make_move':
        $game_id = $_POST['game_id'] ?? 0;
        $player_id = $_POST['player_id'] ?? 0;
        $x = $_POST['x'] ?? -1;
        $y = $_POST['y'] ?? -1;
        
        // Verificar se é a vez do jogador
        $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ?");
        $stmt->execute([$game_id]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$game || $game['status'] != 'playing') {
            echo json_encode(['error' => 'Game not in playing state']);
            exit;
        }
        
        $current_turn = ($player_id == $game['player1_id']) ? 1 : 2;
        if ($game['turn'] != $current_turn) {
            echo json_encode(['error' => 'Not your turn']);
            exit;
        }
        
        // Verificar se ESTE JOGADOR já atacou esta posição
        $stmt = $pdo->prepare("SELECT * FROM moves WHERE game_id = ? AND player_id = ? AND x = ? AND y = ?");
        $stmt->execute([$game_id, $player_id, $x, $y]);
        if ($stmt->rowCount() > 0) {
            echo json_encode(['error' => 'Position already attacked']);
            exit;
        }
        
        // Verificar se acertou baseado nas posições reais dos navios do oponente
        $opponent_id = ($player_id == $game['player1_id']) ? $game['player2_id'] : $game['player1_id'];
        $stmt = $pdo->prepare("SELECT * FROM ship_positions WHERE game_id = ? AND player_id = ? AND x = ? AND y = ?");
        $stmt->execute([$game_id, $opponent_id, $x, $y]);
        $hit = $stmt->rowCount() > 0;
        
        // Registrar movimento
        $stmt = $pdo->prepare("INSERT INTO moves (game_id, player_id, x, y, hit) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$game_id, $player_id, $x, $y, $hit]);
        
        // Marcar posição do navio como atingida se foi acerto
        if ($hit) {
            $stmt = $pdo->prepare("UPDATE ship_positions SET hit = 1 WHERE game_id = ? AND player_id = ? AND x = ? AND y = ?");
            $stmt->execute([$game_id, $opponent_id, $x, $y]);
        }
        
        // Verificar se o jogo terminou (todos os navios do oponente foram atingidos)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total_ship_positions 
            FROM ship_positions 
            WHERE game_id = ? AND player_id = ?
        ");
        $stmt->execute([$game_id, $opponent_id]);
        $total_positions = $stmt->fetch(PDO::FETCH_ASSOC)['total_ship_positions'];
        
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as hit_positions 
            FROM ship_positions 
            WHERE game_id = ? AND player_id = ? AND hit = 1
        ");
        $stmt->execute([$game_id, $opponent_id]);
        $hit_positions = $stmt->fetch(PDO::FETCH_ASSOC)['hit_positions'];
        
        if ($total_positions > 0 && $hit_positions >= $total_positions) {
            // Jogador atual ganhou
            $stmt = $pdo->prepare("UPDATE games SET status = 'finished', winner = ? WHERE id = ?");
            $stmt->execute([$player_id, $game_id]);
            echo json_encode(['success' => true, 'hit' => $hit, 'game_over' => true, 'winner' => $player_id]);
        } else {
            // Lógica de turnos: se acertou, continua jogando; se errou, passa a vez
            if ($hit) {
                // Acertou: mantém o turno atual
                echo json_encode(['success' => true, 'hit' => $hit, 'game_over' => false, 'continue_turn' => true]);
            } else {
                // Errou: alternar turno
                $new_turn = $game['turn'] == 1 ? 2 : 1;
                $stmt = $pdo->prepare("UPDATE games SET turn = ? WHERE id = ?");
                $stmt->execute([$new_turn, $game_id]);
                
                echo json_encode(['success' => true, 'hit' => $hit, 'game_over' => false, 'continue_turn' => false]);
            }
        }
        break;

    case 'get_game_state':
        $game_id = $_GET['game_id'] ?? 0;
        
        $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ?");
        $stmt->execute([$game_id]);
        $game = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("SELECT * FROM moves WHERE game_id = ?");
        $stmt->execute([$game_id]);
        $moves = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Debug: adicionar informações sobre o turno atual
        if ($game) {
            $current_player_turn_id = $game['turn'] == 1 ? $game['player1_id'] : $game['player2_id'];
            $game['current_player_turn_id'] = $current_player_turn_id;
        }
        
        echo json_encode(['game' => $game, 'moves' => $moves]);
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?>