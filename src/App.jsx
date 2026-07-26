import { useRef, useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useStockfish } from "./useStockfish";
import Modal from './components/Modal';
import ControlPanel from './components/ControlPanel';
import CapturedPieces from './components/CapturedPieces';
import MoveList from './components/MoveList';
import { playSound, saveGameStateToLocalStorage, findKingSquare, cleanUp, getCapturedMaterial, getGameLine } from './utils';


function App() {
  const initialFen = localStorage.getItem('fen') || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const savedHistory = localStorage.getItem('history');
  const game = useRef(new Chess(initialFen));
  const lastBestMove = useRef(null);
  // Guards hint / best-move against re-entrancy. A ref (not state) because it
  // must update synchronously — state updates are async, so rapid clicks would
  // otherwise slip past the check before the loading flag has re-rendered.
  const isThinkingRef = useRef(false);
  const chessGame = game.current;
  const isMobile = window.innerWidth < 1280;
  const [position, setPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [winner, setWinner] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  const [isLoadingHint, setIsLoadingHint] = useState(null);
  const [isLoadingBestMove, setIsLoadingBestMove] = useState(null);
  const [checkedSquare, setCheckedSquare] = useState(null);
  // Bumped after restoring a saved game to force the captured-piece trays to
  // recompute from the replayed history (the FEN alone may be unchanged).
  const [, setHistoryVersion] = useState(0);
  // Which ply the player is viewing in the move list; null = the latest (live)
  // position. Browsing a past position never mutates the game.
  const [viewPly, setViewPly] = useState(null);
  const [boardSize, setBoardSize] = useState(() => {
    const saved = localStorage.getItem('boardSize');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        console.warn('Failed to parse boardSize from localStorage');
      }
    }
    return isMobile ? { label: 'M', value: '75%' } : { label: 'M', value: '35%' };
  });
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

  // ---- Move-list navigation -------------------------------------------------
  // Derive the game line every render; `viewPly` selects which position to show.
  const { startFen, plies } = getGameLine(chessGame);
  const totalPlies = plies.length;
  const isLive = viewPly === null || viewPly >= totalPlies;
  const effectivePly = isLive ? totalPlies : viewPly;
  const boardPosition = isLive
    ? position
    : effectivePly === 0
      ? startFen
      : plies[effectivePly - 1].fen;

  // Jump to an absolute ply (used by clicking a move / the "first" button).
  const goToPly = (ply) => {
    const clamped = Math.max(0, Math.min(totalPlies, ply));
    cleanUp([setMoveFrom, setOptionSquares]);
    setViewPly(clamped >= totalPlies ? null : clamped);
  };

  // Step relative to wherever we currently are. Uses a functional update so
  // rapid presses (buttons or key auto-repeat) don't collapse into one step.
  const stepPly = (delta) => {
    cleanUp([setMoveFrom, setOptionSquares]);
    setViewPly((prev) => {
      const current = prev === null ? totalPlies : prev;
      const next = Math.max(0, Math.min(totalPlies, current + delta));
      return next >= totalPlies ? null : next;
    });
  };

  // Save board size to localStorage on every boardSize change
  useEffect(() => {
    if (boardSize) {
      localStorage.setItem('boardSize', JSON.stringify(boardSize));
    }
  }, [boardSize]);

  // Retrieve history
  useEffect(() => {
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        game.current.reset();
        for (const move of history) {
          game.current.move(move);
        }
        // Force a re-render after replay so the captured-piece trays (derived
        // from game history) reflect the restored game. setPosition alone can be
        // a no-op here, since the FEN often already matches the saved position.
        setPosition(game.current.fen());
        setHistoryVersion((v) => v + 1);
      } catch (error) {
        console.error("Failed to load move history:", error);
      }
    }
  }, [])

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

  // Arrow keys / Home / End step through the move history.
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;

      e.preventDefault();
      setMoveFrom('');
      setOptionSquares({});
      setViewPly((prev) => {
        const current = prev === null ? totalPlies : prev;
        let next;
        if (e.key === 'ArrowLeft') next = current - 1;
        else if (e.key === 'ArrowRight') next = current + 1;
        else if (e.key === 'Home') next = 0;
        else next = totalPlies; // End
        next = Math.max(0, Math.min(totalPlies, next));
        return next >= totalPlies ? null : next;
      });
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [totalPlies]);

  
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
    setViewPly(null);
    setPosition(chessGame.fen());
    saveGameStateToLocalStorage(chessGame)

    if (result.captured) {
      playSound('capture.mp3');
    } else {
      playSound('move.mp3');
    }

    // Check for check
    if (chessGame.inCheck()) {
      const color = chessGame.turn() === 'w' ? 'w' : 'b';
      const kingSquare = findKingSquare(chessGame, color);
      setCheckedSquare(kingSquare);
    } else {
      setCheckedSquare(null);
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
    if (!isLive) return; // board is read-only while reviewing past moves

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
      cleanUp([setMoveFrom, setOptionSquares]);
      if (chessGame.turn() === 'b') {
        requestEngineMove();
      }
    } else {
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : '');
    }
  }
  
  // Handle drag and drop
  function onPieceDrag({ square, piece }) {
    if (!isLive) return;

    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square);

      if (hasMoveOptions) {
        setMoveFrom(square);
      }
      return;
    }
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (!isLive) return false;

    const moved = safeMove(sourceSquare, targetSquare);
    if (moved) {
      cleanUp([setMoveFrom, setOptionSquares, setHintMove]);
      onPlayerMoveComplete();
      return true;
    }
    return false;
  }

  function handleNewGame() {
    const newGame = new Chess();
    game.current = newGame;
    setPosition(newGame.fen());
    setViewPly(null);
    cleanUp([setMoveFrom, setHintMove, setOptionSquares, setWinner]);
    localStorage.removeItem('fen');
    localStorage.removeItem('history');
  }

  function handleDismiss() {
    cleanUp([setWinner, setCheckedSquare, setHintMove]);
  }

  const showHint = async () => {
    if (isThinkingRef.current) return;
    isThinkingRef.current = true;
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
      isThinkingRef.current = false;
      cleanUp([setIsLoadingHint, setIsLoadingBestMove]);
    }
  };

  const handleTakeBack = () => {
    if (chessGame.history().length === 0) {
      return;
    }

    // Undo engine's last move
    chessGame.undo();
    // Undo player's last move
    chessGame.undo();

    setViewPly(null);
    setPosition(chessGame.fen());
    saveGameStateToLocalStorage(chessGame);
    cleanUp([setMoveFrom, setOptionSquares, setHintMove, setIsLoadingHint]);
  };

  async function handleBestMove() {
    if (isThinkingRef.current) return;
    isThinkingRef.current = true;
    setIsLoadingBestMove(true);
    setHintMove(null);

    try {
      const bestMove = await getBestMove(game.current.fen());

      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(bestMove)) {
        console.warn('Invalid best move returned from Stockfish:', bestMove);
        return;
      }

      // If Best move is clicked on the engine's turn, onMessage plays this same
      // bestmove first, so replaying it here is illegal and chess.js throws. The
      // catch below keeps that from leaving the loading spinner stuck.
      const move = game.current.move({
        from: bestMove.slice(0, 2),
        to: bestMove.slice(2, 4),
        promotion: bestMove.length > 4 ? bestMove[4] : undefined,
      });

      setViewPly(null);
      setPosition(game.current.fen());
      saveGameStateToLocalStorage(game.current);
      playSound(move.captured ? 'capture.mp3' : 'move.mp3');

      if (game.current.inCheck()) {
        setCheckedSquare(findKingSquare(game.current, game.current.turn()));
      } else {
        setCheckedSquare(null);
      }

      if (game.current.isGameOver()) {
        if (game.current.isCheckmate()) {
          setTimeout(() => setWinner(game.current.turn() === 'w' ? 'Black' : 'White'), 2000);
        } else {
          setTimeout(() => setWinner('Draw'), 2000);
        }
      }

      onPlayerMoveComplete();
    } catch (error) {
      console.warn('Best move could not be applied:', error?.message || error);
    } finally {
      isThinkingRef.current = false;
      setIsLoadingBestMove(false);
    }
  }

  const chessboardOptions = {
    onPieceDrag,
    onPieceDrop,
    onSquareClick,
    numericNotationStyle: {
        left: -15,
        top: '40%',
        color: 'black'
      },
    alphaNotationStyle: {
        bottom: -16,
        left: '40%',
        color: 'black'
      },
    position: boardPosition,
    allowDragging: isLive,
    darkSquareStyle: {
      backgroundColor: '#8ca2ac',
    },
    lightSquareStyle: {
      backgroundColor: '#dee3e6',
    },
    draggingPieceStyle: {
      transform: 'scale(1)',
    },
    // Live-position overlays (move options, hint, check) don't apply while
    // reviewing a past position.
    squareStyles: isLive ? {
      ...optionSquares,
      ...(hintMove && {
        [hintMove.from]: { backgroundColor: 'rgba(153, 102, 255, 0.5)' },
        [hintMove.to]: { backgroundColor: 'rgba(13, 153, 0, 0.6)' },
      }),
      ...(checkedSquare && {
        [checkedSquare]: { backgroundColor: 'rgba(255, 0, 0, 0.6)' }
      })
    } : {},
    id: 'click-or-drag-to-move'
  }

  // Recomputed each render; `position` state changes on every move, so the
  // trays stay in sync with the board (including new game and take-back).
  const { capturedByWhite, capturedByBlack, advantage } = getCapturedMaterial(chessGame);

  return (
    <>
      <header>
        <h1 className='logo'>Play Against Stockfish</h1>
      </header>
      <main onClick={handleDismiss}>
        <div className='chessboard-container' style={{width: boardSize.value}}>
          <Chessboard options={chessboardOptions}/>
          <div className='captured-side'>
            <CapturedPieces pieces={capturedByBlack} color="w" advantage={advantage < 0 ? -advantage : 0} />
            <CapturedPieces pieces={capturedByWhite} color="b" advantage={advantage > 0 ? advantage : 0} />
          </div>
          <MoveList
            moves={plies}
            currentPly={effectivePly}
            isLive={isLive}
            onSelectPly={goToPly}
            onFirst={() => goToPly(0)}
            onPrev={() => stepPly(-1)}
            onNext={() => stepPly(1)}
            onLast={() => setViewPly(null)}
          />
        </div>
        <ControlPanel 
          isLoading={isLoadingHint}
          isLoadingBestMove={isLoadingBestMove}
          currentLevel={difficulty.value} 
          handleLevelChange={setDifficulty} 
          handleHintClick={showHint}
          handleTakeBack={handleTakeBack}
          handleNewGame={handleNewGame}
          handleBestMove={handleBestMove}
          isMobile={isMobile}
          boardSize={boardSize}
          setBoardSize={setBoardSize}
        />
        {winner ? <Modal winner={winner} handleNewGame={handleNewGame} handleDismiss={handleDismiss}/> : null}
      </main>
      <footer>
        <p>Thanks to the developers of stockfish! <a href="https://stockfishchess.org/">Official Stockfish Website</a></p>
        <p>Thanks to Niklas Fiekas for the WebAssembly port of Stockfish! <a href="https://github.com/lichess-org/stockfish.wasm">stockfish.wasm</a></p>
        <p>Made by <a href="https://github.com/JulietaSargsyan" target='_blank'>Julieta Sargsyan</a></p>
      </footer>
    </>
  )
}

export default App