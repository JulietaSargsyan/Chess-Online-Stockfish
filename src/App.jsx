import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function App() {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const stockfishRef = useRef(null);
  const [position, setPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  useEffect(() => {
    const loadEngine = async () => {
      const script = document.createElement("script");
      script.src = "/stockfish.js";
      script.async = true;

      script.onload = async () => {
        const sf = await window.Stockfish();
        stockfishRef.current = sf;
        
        sf.addMessageListener((message) => {
          if (message.startsWith('bestmove')) {
            const move = message.split(' ')[1];

            if (move === '(none)') return;

            const from = move.slice(0, 2);
            const to = move.slice(2, 4);
            const promotion = move.length === 5 ? move[4] : 'q';

            const result = chessGameRef.current.move({ from, to, promotion });
            if (result) {
              setPosition(chessGameRef.current.fen());
              setIsEngineThinking(false);
            }
          }
        });

        sf.postMessage("uci");
        sf.postMessage('isready');
      };

      document.body.appendChild(script);
    };

    loadEngine();
  }, []);

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

  function onSquareClick({ square, piece }) {
      if (!moveFrom && piece) {
        const hasMoveOptions = getMoveOptions(square);

        if (hasMoveOptions) {
          setMoveFrom(square);
        }

        return;
      }
      const moves = chessGame.moves({
        square: moveFrom,
        verbose: true
      });
      const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

      if (!foundMove) {
        const hasMoveOptions = getMoveOptions(square);

        setMoveFrom(hasMoveOptions ? square : '');

        return;
      }

      try {
        chessGame.move({
          from: moveFrom,
          to: square,
          promotion: 'q'
        });
      } catch {
        const hasMoveOptions = getMoveOptions(square);

        if (hasMoveOptions) {
          setMoveFrom(square);
        }

        return;
      }

      setPosition(chessGame.fen());

      setTimeout(console.log('computers move'), 300);

      setMoveFrom('');
      setOptionSquares({});
    
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
      if (!targetSquare) {
        return false;
      }

      try {
        chessGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q'
        });

        setPosition(chessGame.fen()); // get the stockfish respinse move

        setMoveFrom('');
        setOptionSquares({});

        setTimeout(console.log('move'), 500); // get the stockfish respinse move

        return true;
      } catch {
        return false;
      }
    }

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: position,
    squareStyles: optionSquares,
    id: 'click-or-drag-to-move'
  }

  return (
    <main>
      <div className='chessboard-container'>
        <Chessboard options={chessboardOptions}/>
      </div>
    </main>
  )
}

export default App