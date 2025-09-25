import { useState, useEffect } from 'react';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";

interface Ship {
  id: number;
  size: number;
  positions: { x: number; y: number; hit?: boolean }[];
  placed: boolean;
}

interface GameState {
  playerId: number | null;
  playerName: string;
  gameId: number | null;
  gameStatus: 'setup' | 'waiting' | 'playing' | 'finished';
  playerTurn: number | 'ai' | null;
  winner: number | 'ai' | null;
  ships: Ship[];
  attacks: { x: number; y: number; hit: boolean }[];
  opponentAttacks: { x: number; y: number; hit: boolean }[];
  player1Name: string;
  player2Name: string;
}

export default function BattleshipGame() {
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState('');
  const [gameMode, setGameMode] = useState<'multiplayer' | 'singleplayer'>('multiplayer');
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
  const [shipRemovedMsg, setShipRemovedMsg] = useState<string>('');

  // Estados para IA
  const [aiShips, setAiShips] = useState<Ship[]>([]);

  // Função para registrar usuário
  const registerUser = async () => {
    try {
      const uniqueUsername = username + '_' + Date.now();
      if (gameMode === 'singleplayer') {
        // Singleplayer: não precisa registrar no backend
        setGameState(prev => ({
          ...prev,
          playerId: 1,
          playerName: username
        }));
        return;
      }
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
        setGameState(prev => ({
          ...prev,
          playerId: data.user_id,
          playerName: data.display_name
        }));
      } else {
        alert('Erro ao registrar: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor. Verifique se o XAMPP está rodando.');
    }
  };

  // Polling multiplayer
  const startContinuousPolling = (gameIdToCheck: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api.php?action=get_game_state&game_id=${gameIdToCheck}`);
        const data = await response.json();
        if (data.game) {
          const playerTurnId = data.game.turn === 1 ? data.game.player1_id : data.game.player2_id;
          const currentPlayerTurnId = parseInt(playerTurnId);
          const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
          const opponentAttacks = data.moves ? data.moves.filter((move: any) =>
            parseInt(move.player_id) !== currentPlayerId
          ).map((move: any) => ({
            x: parseInt(move.x),
            y: parseInt(move.y),
            hit: move.hit === '1' || move.hit === 1
          })) : [];
          const myAttacks = data.moves ? data.moves.filter((move: any) =>
            parseInt(move.player_id) === currentPlayerId
          ).map((move: any) => ({
            x: parseInt(move.x),
            y: parseInt(move.y),
            hit: move.hit === '1' || move.hit === 1
          })) : [];
          
          // Atualizar navios do jogador com base nos ataques do oponente que acertaram
          const updatedShips = gameState.ships.map(ship => ({
            ...ship,
            positions: ship.positions.map(pos => {
              const opponentHit = opponentAttacks.find((attack: { x: number; y: number; hit: boolean }) => 
                attack.x === pos.x && attack.y === pos.y && attack.hit
              );
              return opponentHit ? { ...pos, hit: true } : pos;
            })
          }));
          
          setGameState(prev => ({
            ...prev,
            ships: updatedShips,
            gameStatus: data.game.status,
            playerTurn: currentPlayerTurnId,
            winner: data.game.winner,
            attacks: myAttacks,
            opponentAttacks: opponentAttacks,
            player1Name: data.game.player1_name || prev.player1Name,
            player2Name: data.game.player2_name || prev.player2Name
          }));
          if (data.game.status === 'finished') {
            clearInterval(interval);
          }
        }
      } catch (error) {}
    }, 1500);
    setTimeout(() => clearInterval(interval), 600000);
    return interval;
  };

  // Salvar navios no backend
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
      if (!data.success) throw new Error(data.error || 'Erro ao salvar navios');
      return true;
    } catch (error: any) {
      alert('Erro ao salvar navios: ' + (error.message || 'Erro desconhecido'));
      return false;
    }
  };

  // Criar jogo
  const createGame = async () => {
    if (gameMode === 'singleplayer') {
      generateAiShips();
      setGameState(prev => ({
        ...prev,
        gameStatus: 'playing',
        playerTurn: prev.playerId // Jogador começa
      }));
      return;
    }
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
        const shipsSaved = await saveShipsToBackend(data.game_id);
        if (shipsSaved) {
          setGameState(prev => ({
            ...prev,
            gameId: data.game_id,
            gameStatus: 'waiting',
            player1Name: gameState.playerName
          }));
          startContinuousPolling(data.game_id);
        }
      } else {
        alert('Erro ao criar jogo: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    }
  };

  // Entrar em jogo existente
  const joinGame = async () => {
    try {
      const shipsSaved = await saveShipsToBackend(parseInt(gameId));
      if (!shipsSaved) return;
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
          startContinuousPolling(parseInt(gameId));
        } else {
          alert('Erro ao obter estado do jogo');
        }
      } else {
        alert('Erro ao entrar no jogo: ' + (data.error || 'Jogo não encontrado'));
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    }
  };

  // Gerar navios da IA
  const generateAiShips = () => {
    const sizes = [3, 2, 1];
    const ships: Ship[] = [];
    const occupied: { x: number; y: number }[] = [];
    for (let i = 0; i < sizes.length; i++) {
      let placed = false;
      while (!placed) {
        const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        const x = Math.floor(Math.random() * (orientation === 'horizontal' ? 5 - sizes[i] + 1 : 5));
        const y = Math.floor(Math.random() * (orientation === 'vertical' ? 5 - sizes[i] + 1 : 5));
        const positions = [];
        for (let j = 0; j < sizes[i]; j++) {
          positions.push({
            x: orientation === 'horizontal' ? x + j : x,
            y: orientation === 'vertical' ? y + j : y,
            hit: false
          });
        }
        if (positions.every(pos => !occupied.some(o => o.x === pos.x && o.y === pos.y))) {
          ships.push({ id: i + 1, size: sizes[i], positions, placed: true });
          occupied.push(...positions);
          placed = true;
        }
      }
    }
    setAiShips(ships);
  };

  // Colocar navio no tabuleiro
  const placeShip = (x: number, y: number) => {
    if (!selectedShip || gameState.gameStatus !== 'setup') return;
    const newPositions: { x: number; y: number; hit?: boolean }[] = [];
    for (let i = 0; i < selectedShip.size; i++) {
      if (orientation === 'horizontal') {
        newPositions.push({ x: x + i, y, hit: false });
      } else {
        newPositions.push({ x, y: y + i, hit: false });
      }
    }
    if (newPositions.some(pos => pos.x >= 5 || pos.y >= 5)) return;
    const updatedShips = gameState.ships.map(ship =>
      ship.id === selectedShip.id
        ? { ...ship, positions: newPositions, placed: true }
        : ship
    );
    setGameState(prev => ({ ...prev, ships: updatedShips }));
    setSelectedShip(null);
  };

  // Ataque da IA
  const aiAttack = () => {
    setGameState(prevState => {
      // Encontrar células disponíveis (não atacadas pela IA)
      const availableCells: { x: number; y: number }[] = [];
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const alreadyAttacked = prevState.opponentAttacks.some(a => a.x === x && a.y === y);
          if (!alreadyAttacked) availableCells.push({ x, y });
        }
      }
      if (availableCells.length === 0) return prevState;
      
      const target = availableCells[Math.floor(Math.random() * availableCells.length)];
      
      // Verificar se acertou um navio do jogador (apenas posições não atingidas)
      const hit = prevState.ships.some(ship =>
        ship.positions.some(pos => pos.x === target.x && pos.y === target.y && !pos.hit)
      );
      
      const newOpponentAttacks = [...prevState.opponentAttacks, { ...target, hit }];
      
      // Se acertou, atualizar ships marcando a posição como atingida
      let updatedShips = prevState.ships;
      if (hit) {
        updatedShips = prevState.ships.map(ship => ({
          ...ship,
          positions: ship.positions.map(pos => 
            pos.x === target.x && pos.y === target.y ? { ...pos, hit: true } : pos
          )
        }));
      }
      
      // Verifica vitória da IA usando as posições marcadas como atingidas
      const allShipsHit = updatedShips.every(ship =>
        ship.positions.every(pos => pos.hit)
      );
      
      const newState = {
        ...prevState,
        ships: updatedShips,
        opponentAttacks: newOpponentAttacks,
        playerTurn: hit ? ('ai' as const) : prevState.playerId,
        gameStatus: allShipsHit ? ('finished' as const) : prevState.gameStatus,
        winner: allShipsHit ? ('ai' as const) : prevState.winner
      };
      
      // Se acertou e jogo não terminou, dispara novo ataque após delay
      if (hit && !allShipsHit) {
        setTimeout(() => aiAttack(), 1000);
      }
      
      return newState;
    });
  };

  // Realizar ataque
  const attackOpponent = async (x: number, y: number) => {
    if (gameMode === 'singleplayer') {
      if (gameState.gameStatus !== 'playing' || gameState.playerTurn !== gameState.playerId) return;
      const alreadyAttacked = gameState.attacks.some(attack => attack.x === x && attack.y === y);
      if (alreadyAttacked) {
        alert('Você já atacou esta posição!');
        return;
      }
      const hit = aiShips.some(ship =>
        ship.positions.some(pos => pos.x === x && pos.y === y && !pos.hit)
      );
      const newAttacks = [...gameState.attacks, { x, y, hit }];
      
      // Se acertou, atualizar aiShips marcando a posição como atingida
      if (hit) {
        const updatedAiShips = aiShips.map(ship => ({
          ...ship,
          positions: ship.positions.map(pos => 
            pos.x === x && pos.y === y ? { ...pos, hit: true } : pos
          )
        }));
        setAiShips(updatedAiShips);
      }
      
      // Só passa o turno para IA se errar
      setGameState(prev => ({
        ...prev,
        attacks: newAttacks,
        playerTurn: hit ? prev.playerId : 'ai'
      }));
      
      // Verifica vitória do jogador usando as posições marcadas como atingidas
      const allAiShipsHit = aiShips.every(ship =>
        ship.positions.every(pos => pos.hit || newAttacks.some(a => a.x === pos.x && a.y === pos.y && a.hit))
      );
      if (allAiShipsHit) {
        setGameState(prev => ({
          ...prev,
          gameStatus: 'finished',
          winner: prev.playerId
        }));
        return;
      }
      // Se errar, IA ataca no próximo turno (useEffect vai disparar)
      return;
    }

    // Multiplayer
    const currentPlayerTurn = gameState.playerTurn ? parseInt(gameState.playerTurn.toString()) : null;
    const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
    const alreadyAttacked = gameState.attacks.some(attack => attack.x === x && attack.y === y);
    if (gameState.gameStatus !== 'playing' || currentPlayerTurn !== currentPlayerId) return;
    if (alreadyAttacked) {
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
        const newAttack = { x, y, hit: data.hit };
        setGameState(prev => ({
          ...prev,
          attacks: [...prev.attacks, newAttack]
        }));
        if (data.game_over) {
          setGameState(prev => ({
            ...prev,
            gameStatus: 'finished',
            winner: data.winner
          }));
        }
      } else {
        alert('Erro no ataque: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    }
  };

  useEffect(() => {
    if (
      gameMode === 'singleplayer' &&
      gameState.gameStatus === 'playing' &&
      gameState.playerTurn === 'ai' &&
      gameState.winner === null
    ) {
      const timeout = setTimeout(() => {
        aiAttack();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [gameState.playerTurn, gameState.gameStatus, gameMode, gameState.winner]);

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
      const shipPosition = gameState.ships.find(ship =>
        ship.positions.find(pos => pos.x === x && pos.y === y)
      )?.positions.find(pos => pos.x === x && pos.y === y);
      const opponentAttack = gameState.opponentAttacks.find(a => a.x === x && a.y === y);
      const isHitByOpponent = (shipPosition?.hit === true) || (opponentAttack?.hit === true);
      const isMissedByOpponent = opponentAttack && !opponentAttack.hit && !shipPosition?.hit;
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
        <div className="board-header">
          <div className="coord-corner"></div>
          {numbers.map(num => (
            <div key={num} className="coord-number">{num}</div>
          ))}
        </div>
        <div className="board-with-coords">
          {letters.map((letter, y) => (
            <div key={letter} className="board-row">
              <div className="coord-letter">{letter}</div>
              <div className="board-cells">
                {numbers.map((_, x) => renderCell(x, y, isOpponent))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderização principal
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
            <div className="flex gap-2">
              <Button onClick={() => { setGameMode('multiplayer'); registerUser(); }} className="w-full">
                Jogar Multiplayer
              </Button>
              <Button onClick={() => { setGameMode('singleplayer'); registerUser(); }} className="w-full">
                Jogar contra IA
              </Button>
            </div>
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
                    onClick={() => {
                      if (ship.placed) {
                        const updatedShips = gameState.ships.map(s =>
                          s.id === ship.id ? { ...s, positions: [], placed: false } : s
                        );
                        setGameState(prev => ({ ...prev, ships: updatedShips }));
                        setSelectedShip({ ...ship, positions: [], placed: false });
                        setShipRemovedMsg(`Navio de tamanho ${ship.size} removido! Pronto para reposicionar.`);
                      } else {
                        setSelectedShip(ship);
                        setShipRemovedMsg('');
                      }
                    }}
                    disabled={false}
                  >
                    Navio {ship.size} ⛵
                  </Button>
                ))}
              </div>
              {shipRemovedMsg && (
                <div className="mb-4 text-green-600 font-semibold text-center">
                  {shipRemovedMsg}
                </div>
              )}
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
                  {gameMode === 'singleplayer' ? 'Iniciar contra IA' : 'Criar Novo Jogo'}
                </Button>
              )}
            </CardContent>
          </Card>
          {gameMode === 'multiplayer' && (
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
                  <p className="text-center mt-2" style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Posicione todos os navios primeiro
                  </p>
                )}
              </CardContent>
            </Card>
          )}
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
                if (gameMode === 'singleplayer') {
                  return gameState.winner === gameState.playerId ? '🎉 Vitória!' : '😔 Derrota';
                }
                const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
                const isWinner = gameState.winner === currentPlayerId;
                return isWinner ? '🎉 Vitória!' : '😔 Derrota';
              })()}
            </CardTitle>
            <CardDescription>
              {(() => {
                if (gameMode === 'singleplayer') {
                  return gameState.winner === gameState.playerId
                    ? 'Parabéns! Você afundou todos os navios da IA!'
                    : 'A IA afundou todos os seus navios. Mais sorte na próxima vez!';
                }
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
              <div className="text-9xl mb-6" style={{ fontSize: '8rem', lineHeight: '1' }}>
                {(() => {
                  if (gameMode === 'singleplayer') {
                    return gameState.winner === gameState.playerId ? '🏆' : '💔';
                  }
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
                {gameMode === 'singleplayer'
                  ? 'Tabuleiro IA'
                  : `Tabuleiro Oponente${gameState.player1Name && gameState.player2Name ?
                    ` - ${gameState.playerName === gameState.player1Name ? gameState.player2Name : gameState.player1Name}` :
                    ''}`}
              </CardTitle>
              <CardDescription>
                {(() => {
                  if (gameMode === 'singleplayer') {
                    const isMyTurn = gameState.playerTurn === gameState.playerId;
                    return isMyTurn
                      ? '🎯 SUA VEZ! Clique para atacar'
                      : '⏳ Aguardando IA atacar...';
                  }
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
                if (gameMode === 'singleplayer') {
                  const isMyTurn = gameState.playerTurn === gameState.playerId;
                  return isMyTurn && (
                    <p className="text-center mt-2" style={{ color: '#22c55e', fontWeight: 'bold' }}>
                      Clique nas células para atacar!
                    </p>
                  );
                }
                const currentPlayerTurn = gameState.playerTurn ? parseInt(gameState.playerTurn.toString()) : null;
                const currentPlayerId = gameState.playerId ? parseInt(gameState.playerId.toString()) : null;
                const isMyTurn = currentPlayerTurn !== null && currentPlayerId !== null && currentPlayerTurn === currentPlayerId;
                return isMyTurn && (
                  <p className="text-center mt-2" style={{ color: '#22c55e', fontWeight: 'bold' }}>
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
