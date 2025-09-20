import { useState, useEffect } from 'react';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";

interface Ship {
  id: number;
  size: number;
  positions: { x: number; y: number }[];
  placed: boolean;
}

interface GameState {
  playerId: number | null;
  playerName: string;
  gameId: number | null;
  gameStatus: 'setup' | 'waiting' | 'playing' | 'finished';
  playerTurn: number | null;
  winner: number | null;
  ships: Ship[];
  attacks: { x: number; y: number; hit: boolean }[];
  opponentAttacks: { x: number; y: number; hit: boolean }[];
  player1Name: string;
  player2Name: string;
}

export default function BattleshipGame() {
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    playerId: null,
    playerName: '',
    gameId: null,
    gameStatus: 'setup',
    playerTurn: null,
    winner: null,
    ships: [
      { id: 1, size: 3, positions: [], placed: false },
      { id: 2, size: 2, positions: [], placed: false },
      { id: 3, size: 1, positions: [], placed: false }
    ],
    attacks: [],
    opponentAttacks: [],
    player1Name: '',
    player2Name: ''
  });
  
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Função para registrar usuário
  const registerUser = async () => {
    try {
      // Adicionar timestamp para garantir nomes únicos
      const uniqueUsername = username + '_' + Date.now();
      
      const response = await fetch('/api.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          username: uniqueUsername,
          display_name: username
        })
      });
      const data = await response.json();
      if (data.success) {
        console.log('Usuário registrado com ID:', data.user_id);
        setGameState(prev => ({ 
          ...prev, 
          playerId: data.user_id,
          playerName: data.display_name
        }));
      } else {
        alert('Erro ao registrar: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao registrar:', error);
      alert('Erro ao conectar com o servidor. Verifique se o XAMPP está rodando.');
    }
  };

  // Polling contínuo para sincronizar estado do jogo
  const startContinuousPolling = (gameIdToCheck: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api.php?action=get_game_state&game_id=${gameIdToCheck}`);
        const data = await response.json();

        if (data.game) {
          const playerTurnId = data.game.turn === 1 ? data.game.player1_id : data.game.player2_id;
          
          // Converter para number para garantir comparação correta
          const currentPlayerTurnId = parseInt(playerTurnId);
          const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
          
          // Debug: log para entender o que está acontecendo
          console.log('Polling Debug:', {
            gameId: gameIdToCheck,
            currentPlayerId: currentPlayerId,
            turn: data.game.turn,
            player1_id: data.game.player1_id,
            player2_id: data.game.player2_id,
            playerTurnId: currentPlayerTurnId,
            isMyTurn: currentPlayerId !== null && currentPlayerTurnId === currentPlayerId,
            rawPlayerTurnId: playerTurnId,
            rawCurrentPlayerId: gameState.playerId
          });
          
          // Carregar ataques do oponente contra mim
          const opponentAttacks = data.moves ? data.moves.filter((move: any) => 
            parseInt(move.player_id) !== currentPlayerId
          ).map((move: any) => ({
            x: parseInt(move.x),
            y: parseInt(move.y),
            hit: move.hit === '1' || move.hit === 1
          })) : [];

          // Carregar meus próprios ataques
          const myAttacks = data.moves ? data.moves.filter((move: any) => 
            parseInt(move.player_id) === currentPlayerId
          ).map((move: any) => ({
            x: parseInt(move.x),
            y: parseInt(move.y),
            hit: move.hit === '1' || move.hit === 1
          })) : [];

          setGameState(prev => ({
            ...prev,
            gameStatus: data.game.status,
            playerTurn: currentPlayerTurnId,
            winner: data.game.winner,
            attacks: myAttacks,
            opponentAttacks: opponentAttacks,
            player1Name: data.game.player1_name || prev.player1Name,
            player2Name: data.game.player2_name || prev.player2Name
          }));

          // Se o jogo terminou, para o polling
          if (data.game.status === 'finished') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 1500); // Verifica a cada 1.5 segundos para melhor responsividade

    // Para o polling após 10 minutos para evitar loops infinitos
    setTimeout(() => clearInterval(interval), 600000);
    
    // Retorna o interval para permitir limpeza manual se necessário
    return interval;
  };

  // Função para enviar posições dos navios para o backend
  const saveShipsToBackend = async (gameId: number) => {
    try {
      const shipsData = gameState.ships.filter(ship => ship.placed);
      const response = await fetch('/api.php?action=place_ships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          game_id: gameId.toString(),
          player_id: gameState.playerId!.toString(),
          ships: JSON.stringify(shipsData)
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Erro ao salvar navios');
      }
      console.log('Navios salvos com sucesso:', data.message);
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar navios:', error);
      alert('Erro ao salvar navios: ' + (error.message || 'Erro desconhecido'));
      return false;
    }
  };

  // Função para criar jogo
  const createGame = async () => {
    try {
      const response = await fetch('/api.php?action=create_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          player1_id: gameState.playerId!.toString(),
          player1_name: gameState.playerName
        })
      });
      const data = await response.json();
      if (data.success) {
        // Salvar navios no backend antes de definir o jogo como criado
        const shipsSaved = await saveShipsToBackend(data.game_id);
        if (shipsSaved) {
          setGameState(prev => ({ 
            ...prev, 
            gameId: data.game_id, 
            gameStatus: 'waiting',
            player1Name: gameState.playerName
          }));
          // Iniciar polling para o criador do jogo também
          startContinuousPolling(data.game_id);
        }
      } else {
        alert('Erro ao criar jogo: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  // Função para entrar em um jogo existente
  const joinGame = async () => {
    try {
      // Primeiro salvar os navios no backend
      const shipsSaved = await saveShipsToBackend(parseInt(gameId));
      if (!shipsSaved) {
        return; // Se não conseguiu salvar os navios, não continua
      }

      const response = await fetch('/api.php?action=join_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          game_id: gameId,
          player2_id: gameState.playerId!.toString(),
          player2_name: gameState.playerName
        })
      });
      const data = await response.json();
      if (data.success) {
        // Buscar o estado do jogo para obter player1_id e definir playerTurn corretamente
        const gameStateResponse = await fetch(`/api.php?action=get_game_state&game_id=${gameId}`);
        const gameStateData = await gameStateResponse.json();
        if (gameStateData.game) {
          const playerTurnId = gameStateData.game.turn === 1 ? gameStateData.game.player1_id : gameStateData.game.player2_id;
          setGameState(prev => ({
            ...prev,
            gameId: parseInt(gameId),
            gameStatus: 'playing',
            playerTurn: playerTurnId
          }));
          // Iniciar polling contínuo para o jogador que entrou
          startContinuousPolling(parseInt(gameId));
        } else {
          alert('Erro ao obter estado do jogo');
        }
      } else {
        alert('Erro ao entrar no jogo: ' + (data.error || 'Jogo não encontrado'));
      }
    } catch (error) {
      console.error('Erro ao entrar no jogo:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  // Colocar navio no tabuleiro
  const placeShip = (x: number, y: number) => {
    if (!selectedShip || gameState.gameStatus !== 'setup') return;

    const newPositions: { x: number; y: number }[] = [];
    for (let i = 0; i < selectedShip.size; i++) {
      if (orientation === 'horizontal') {
        newPositions.push({ x: x + i, y });
      } else {
        newPositions.push({ x, y: y + i });
      }
    }

    // Verificar se as posições são válidas
    if (newPositions.some(pos => pos.x >= 5 || pos.y >= 5)) return;

    const updatedShips = gameState.ships.map(ship =>
      ship.id === selectedShip.id
        ? { ...ship, positions: newPositions, placed: true }
        : ship
    );

    setGameState(prev => ({ ...prev, ships: updatedShips }));
    setSelectedShip(null);

    // Se todos os navios estiverem colocados, permitir criar jogo
    if (updatedShips.every(ship => ship.placed)) {
      // Navios prontos para iniciar
    }
  };

  // Realizar ataque
  const attackOpponent = async (x: number, y: number) => {
    // Converter para number para garantir comparação correta
    const currentPlayerTurn = gameState.playerTurn ? parseInt(gameState.playerTurn.toString()) : null;
    const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
    
    // Verificar se já atacou esta posição
    const alreadyAttacked = gameState.attacks.some(attack => attack.x === x && attack.y === y);
    
    console.log('Tentativa de ataque:', {
      position: `${x},${y}`,
      gameStatus: gameState.gameStatus,
      currentPlayerTurn,
      currentPlayerId,
      isMyTurn: currentPlayerTurn === currentPlayerId,
      alreadyAttacked,
      existingAttacks: gameState.attacks
    });
    
    if (gameState.gameStatus !== 'playing' || currentPlayerTurn !== currentPlayerId) {
      console.log('Ataque bloqueado - não é sua vez');
      return;
    }

    if (alreadyAttacked) {
      console.log('Ataque bloqueado - posição já atacada pelo frontend');
      alert('Você já atacou esta posição!');
      return;
    }

    try {
      const response = await fetch('/api.php?action=make_move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          game_id: gameState.gameId!.toString(),
          player_id: gameState.playerId!.toString(),
          x: x.toString(),
          y: y.toString()
        })
      });
      const data = await response.json();
      if (data.success) {
        console.log('Ataque bem-sucedido:', { x, y, hit: data.hit, game_over: data.game_over });
        // Atualizar estado com o resultado do ataque
        const newAttack = { x, y, hit: data.hit };
        setGameState(prev => ({
          ...prev,
          attacks: [...prev.attacks, newAttack]
        }));
        
        // Verificar se o jogo terminou
        if (data.game_over) {
          setGameState(prev => ({
            ...prev,
            gameStatus: 'finished',
            winner: data.winner
          }));
        } else if (data.continue_turn) {
          // Se acertou, continua sendo sua vez - mostrar mensagem
          console.log('Acertou! Continue jogando...');
        }
        // O turno será atualizado pelo polling contínuo
      } else {
        console.log('Erro no ataque:', data.error);
        alert('Erro no ataque: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao atacar:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  // Renderizar célula do tabuleiro
  const renderCell = (x: number, y: number, isOpponent: boolean = false) => {
    if (isOpponent) {
      // Tabuleiro do oponente: mostrar apenas SEUS ataques
      const myAttack = gameState.attacks.find(a => a.x === x && a.y === y);
      const isHit = myAttack?.hit;
      const isMiss = myAttack && !myAttack.hit;

      let cellClass = 'cell';
      if (isHit) cellClass += ' hit';
      if (isMiss) cellClass += ' miss';

      return (
        <div
          key={`${x}-${y}`}
          className={cellClass}
          onClick={() => attackOpponent(x, y)}
        >
          {isHit && '💥'}
          {isMiss && '💦'}
        </div>
      );
    } else {
      // Seu tabuleiro: mostrar seus navios + ataques do oponente contra você
      const hasShip = gameState.ships.some(ship => 
        ship.positions.some(pos => pos.x === x && pos.y === y)
      );
      
      const opponentAttack = gameState.opponentAttacks.find(a => a.x === x && a.y === y);
      const isHitByOpponent = opponentAttack?.hit;
      const isMissedByOpponent = opponentAttack && !opponentAttack.hit;

      let cellClass = 'cell';
      if (hasShip && !isHitByOpponent) cellClass += ' ship';
      if (isHitByOpponent) cellClass += ' hit';
      if (isMissedByOpponent) cellClass += ' miss';

      return (
        <div
          key={`${x}-${y}`}
          className={cellClass}
          onClick={() => placeShip(x, y)}
        >
          {isHitByOpponent && '💥'}
          {isMissedByOpponent && '💦'}
          {hasShip && !isHitByOpponent && '🚢'}
        </div>
      );
    }
  };

  // Renderizar tabuleiro 5x5 com coordenadas
  const renderBoard = (isOpponent: boolean = false) => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const numbers = ['1', '2', '3', '4', '5'];
    
    return (
      <div className="board-container">
        {/* Números no topo (1-5) */}
        <div className="board-header">
          <div className="coord-corner"></div>
          {numbers.map(num => (
            <div key={num} className="coord-number">{num}</div>
          ))}
        </div>
        
        {/* Tabuleiro com letras na lateral */}
        <div className="board-with-coords">
          {letters.map((letter, y) => (
            <div key={letter} className="board-row">
              {/* Letra na lateral esquerda (A-E) */}
              <div className="coord-letter">{letter}</div>
              
              {/* Células da linha */}
              <div className="board-cells">
                {numbers.map((_, x) => renderCell(x, y, isOpponent))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">Batalha Naval 🚢</h1>
      
      {!gameState.playerId ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Entrar no Jogo</CardTitle>
            <CardDescription>Digite seu nome para começar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Seu nome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <Button onClick={registerUser} className="w-full">
              Entrar
            </Button>
          </CardContent>
        </Card>
      ) : gameState.gameStatus === 'setup' ? (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Posicionar Navios</CardTitle>
              <CardDescription>Selecione e posicione seus 3 navios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {gameState.ships.map(ship => (
                  <Button
                    key={ship.id}
                    variant={selectedShip?.id === ship.id ? 'default' : 'outline'}
                    onClick={() => setSelectedShip(ship)}
                    disabled={ship.placed}
                  >
                    Navio {ship.size} ⛵
                  </Button>
                ))}
              </div>
              
              <Button
                variant="secondary"
                onClick={() => setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                className="mb-6"
              >
                Direção: {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
              </Button>

              <div className="mt-6">
                <h3 className="font-bold mb-2">Seu Tabuleiro</h3>
                {renderBoard(false)}
              </div>

              {gameState.ships.every(ship => ship.placed) && (
                <Button onClick={createGame} className="mt-6 w-full">
                  Criar Novo Jogo
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entrar em Jogo</CardTitle>
              <CardDescription>Digite o ID do jogo para se conectar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="ID do jogo (ex: 5)"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                />
              </div>
              <Button 
                onClick={joinGame} 
                className="w-full"
                disabled={!gameId || !gameState.ships.every(ship => ship.placed)}
              >
                Entrar no Jogo
              </Button>
              {!gameState.ships.every(ship => ship.placed) && (
                <p className="text-center mt-2" style={{color: '#6b7280', fontSize: '0.9rem'}}>
                  Posicione todos os navios primeiro
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : gameState.gameStatus === 'waiting' ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Aguardando Oponente</CardTitle>
            <CardDescription>Compartilhe o ID do jogo: {gameState.gameId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-4">⏳</div>
              <p>Aguardando outro jogador se conectar...</p>
            </div>
          </CardContent>
        </Card>
      ) : gameState.gameStatus === 'finished' ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>
              {(() => {
                const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
                const isWinner = gameState.winner === currentPlayerId;
                return isWinner ? '🎉 Vitória!' : '😔 Derrota';
              })()}
            </CardTitle>
            <CardDescription>
              {(() => {
                const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
                const isWinner = gameState.winner === currentPlayerId;
                return isWinner ? 
                  'Parabéns! Você afundou todos os navios do oponente!' : 
                  'O oponente afundou todos os seus navios. Mais sorte na próxima vez!';
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-9xl mb-6" style={{fontSize: '8rem', lineHeight: '1'}}>
                {(() => {
                  const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
                  const isWinner = gameState.winner === currentPlayerId;
                  return isWinner ? '🏆' : '💔';
                })()}
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Jogar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Seu Tabuleiro - {gameState.playerName}</CardTitle>
              <CardDescription>Seus navios e ataques recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              {renderBoard(false)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Tabuleiro Oponente{gameState.player1Name && gameState.player2Name ? 
                  ` - ${gameState.playerName === gameState.player1Name ? gameState.player2Name : gameState.player1Name}` : 
                  ''}
              </CardTitle>
              <CardDescription>
                {(() => {
                  const currentPlayerTurn = gameState.playerTurn ? parseInt(gameState.playerTurn.toString()) : null;
                  const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
                  const isMyTurn = currentPlayerTurn !== null && currentPlayerId !== null && currentPlayerTurn === currentPlayerId;
                  
                  return isMyTurn ? 
                    '🎯 SUA VEZ! Clique para atacar' : 
                    '⏳ Aguardando oponente atacar...';
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderBoard(true)}
              {(() => {
                const currentPlayerTurn = gameState.playerTurn ? parseInt(gameState.playerTurn.toString()) : null;
                const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
                const isMyTurn = currentPlayerTurn !== null && currentPlayerId !== null && currentPlayerTurn === currentPlayerId;
                
                return isMyTurn && (
                  <p className="text-center mt-2" style={{color: '#22c55e', fontWeight: 'bold'}}>
                    Clique nas células para atacar!
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
