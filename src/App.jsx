import { useRef, useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useStockfish } from "./useStockfish";
import Modal from './components/Modal';
import ControlPanel from './components/ControlPanel';
import { playSound } from './utils';


function App() {
  const initialFen = localStorage.getItem('fen') || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const game = useRef(new Chess(initialFen));
  const lastBestMove = useRef(null);
  const chessGame = game.current;
  const [position, setPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [winner, setWinner] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  const [isLoadingHint, setIsLoadingHint] = useState(null);
  const [difficulty, setDifficulty] = useState(() => {
    const saved = localStorage.getItem('chessDifficulty');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.value === 'number' && typeof parsed.depth === 'number') {
          return parsed;
        }
      } catch {
        console.log('Difficulty is not saved yet!')
      }
    }
    return { label:'Beginner', value:1, depth:4 };
  });

  const { sendCommand, getBestMove } = useStockfish((line) => {
    if (typeof line === 'string' && line.startsWith('bestmove')) {
      const best = line.split(' ')[1];
      lastBestMove.current = best;
      if (chessGame.turn() === 'b') {
        const from = best.slice(0, 2);
        const to = best.slice(2, 4);
        safeMove(from, to);
      }
    } else if (line.error) {
      console.log(line.error);
    }
  });

  useEffect(() => {
    if (!difficulty) return;

    sendCommand("uci");
    sendCommand(`setoption name Skill Level value ${difficulty.value}`);
    sendCommand("isready");

    // Save difficulty to localStorage
    localStorage.setItem('chessDifficulty', JSON.stringify(difficulty));
  }, [difficulty]);

  
  function safeMove(from, to) {
    const legalMoves = chessGame.moves({ verbose: true });
    const move = legalMoves.find(m => m.from === from && m.to === to);

    if (!move) {
      console.log('Illegal move attempted:', from, to);
      return false;
    }

    const result = chessGame.move({
      from,
      to,
      promotion: move.promotion ? 'q' : undefined,
    });

   if (result) {
    setPosition(chessGame.fen());
    localStorage.setItem('fen', chessGame.fen());

    if (result.captured) {
      playSound('capture.mp3');
    } else {
      playSound('move.mp3');
    }

    // Check for game over
    if (chessGame.isGameOver()) {
      if (chessGame.isCheckmate()) {
        setTimeout(() => {
          setWinner(chessGame.turn() === 'w' ? 'Black' : 'White')
        }, 2000)
      } else {
        setTimeout(() => {
          setWinner('Draw')
        }, 2000)
      }
    }

    return true;
  }

    return false;
  }

  function requestEngineMove() {
    if (chessGame.turn() !== 'b') return;
    
    sendCommand(`position fen ${chessGame.fen()}`);
    sendCommand(`go depth ${difficulty.depth}`);
  }

  function onPlayerMoveComplete() {
    if (chessGame.turn() === 'b') {
      setTimeout(() => requestEngineMove(), 1000); 
    }
  }


  function getMoveOptions(square) {
      const moves = chessGame.moves({
        square,
        verbose: true
      });

      if (moves.length === 0) {
        setOptionSquares({});
        return false;
      }

      const newSquares = {};

      for (const move of moves) {
        newSquares[move.to] = {
          background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
          borderRadius: '50%'
        };
      }

      newSquares[square] = {
        background: 'rgba(255, 255, 0, 0.4)'
      };

      setOptionSquares(newSquares);

      return true;
  }

  // Handle square click
  function onSquareClick({ square, piece }) {
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square);

      if (hasMoveOptions) {
        setMoveFrom(square);
      }
      return;
    }

    const moved = safeMove(moveFrom, square);
    setHintMove(null);

    if (moved) {
      setMoveFrom('');
      setOptionSquares({});
      if (chessGame.turn() === 'b') {
        requestEngineMove();
      }
    } else {
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : '');
    }
  }

  // Handle drag and drop
  function onPieceDrop({ sourceSquare, targetSquare }) {
    setHintMove(null);
    const moved = safeMove(sourceSquare, targetSquare);
    if (moved) {
      setMoveFrom('');
      setOptionSquares({});
      onPlayerMoveComplete();
      return true;
    }
    return false;
  }

  function handleNewGame() {
    const newGame = new Chess();
    game.current = newGame;
    setPosition(newGame.fen());
    setMoveFrom('');
    setHintMove(null);
    setOptionSquares({});
    setWinner(null);
    localStorage.removeItem('fen')
  }

  const showHint = async () => {
    if (isLoadingHint) return;
    console.log('hint clicked');
    setIsLoadingHint(true);
    setHintMove(null);

    try {
      const fen = game.current.fen();
      const bestMoveUCI = await getBestMove(fen);

      if (bestMoveUCI) {
        setHintMove({
          from: bestMoveUCI.slice(0, 2),
          to: bestMoveUCI.slice(2, 4),
        });
      }
    } catch (error) {
      console.error('Error getting hint:', error);
      setHintMove(null);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleTakeBack = () => {
    setHintMove(null);
    setIsLoadingHint(false);

    if (chessGame.history().length === 0) {
      return;
    }

    // Undo engine's last move
    chessGame.undo();
    // Undo player's last move
    chessGame.undo();

    setPosition(chessGame.fen());

    setMoveFrom('');
    setOptionSquares({});
  };

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position,
    darkSquareStyle: {
      backgroundColor: '#8ca2ac',
    },
    lightSquareStyle: {
      backgroundColor: '#dee3e6',
    },
    draggingPieceStyle: {
      transform: 'scale(1)',
    },
    squareStyles: {
      ...optionSquares,
      ...(hintMove && {
        [hintMove.from]: { backgroundColor: 'rgba(153, 102, 255, 0.5)' },
        [hintMove.to]: { backgroundColor: 'rgba(13, 153, 0, 0.6)' },
      }),
    },
    id: 'click-or-drag-to-move'
  }

  return (
    <>
      <header>
        <h1 className='logo'>Play Against Stockfish</h1>
      </header>
      <main>
        <div className='chessboard-container'>
          <Chessboard options={chessboardOptions}/>
        </div>
        <ControlPanel 
          isLoading={isLoadingHint}
          currentLevel={difficulty.value} 
          handleLevelChange={setDifficulty} 
          handleHintClick={showHint}
          handleTakeBack={handleTakeBack}
          handleNewGame={handleNewGame}
        />
        {winner ? <Modal winner={winner} handleNewGame={handleNewGame}/> : null}
      </main>
      <footer>
        <p>Made by <a href="https://github.com/JulietaSargsyan" target='_blank'>J.S.</a></p>
      </footer>
    </>
  )
}

export default App