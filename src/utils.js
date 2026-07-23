const audioCache = {};

export function playSound(filename, volume = 1.0) {
  // BASE_URL keeps this correct whether served from the domain root or a subpath.
  const path = `${import.meta.env.BASE_URL}sounds/${filename}`;

  if (!audioCache[path]) {
    const audio = new Audio(path);
    audio.volume = volume;
    audioCache[path] = audio;
  }

  const sound = audioCache[path];
  sound.currentTime = 0;
  sound.play().catch((error) => {
    console.warn(`Unable to play sound "${filename}":`, error.message);
  });
}

export function saveGameStateToLocalStorage(chessGame) {
  localStorage.setItem('fen', chessGame.fen());
  localStorage.setItem('history', JSON.stringify(chessGame.history({ verbose: true })));
}

export function findKingSquare(chess, color) {
  const board = chess.board();
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece && piece.type === 'k' && piece.color === color) {
        const fileChar = 'abcdefgh'[file];
        const rankChar = `${8 - rank}`;
        return fileChar + rankChar;
      }
    }
  }
  return null;
}

export function cleanUp(funcArray) {
  funcArray.forEach(func => func(null))
}

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

// Derive the pieces each side has captured (and the net material advantage)
// from the game's move history.
//   capturedByWhite: black pieces White has taken   (render as black pieces)
//   capturedByBlack: white pieces Black has taken   (render as white pieces)
//   advantage:       net material, >0 White ahead, <0 Black ahead
export function getCapturedMaterial(chessGame) {
  const captured = { w: [], b: [] }; // keyed by the CAPTURED piece's color

  for (const move of chessGame.history({ verbose: true })) {
    if (!move.captured) continue;
    const capturedColor = move.color === 'w' ? 'b' : 'w';
    captured[capturedColor].push(move.captured);
  }

  const byValueDesc = (a, b) => PIECE_VALUES[b] - PIECE_VALUES[a];
  captured.w.sort(byValueDesc);
  captured.b.sort(byValueDesc);

  const sum = (types) => types.reduce((total, type) => total + PIECE_VALUES[type], 0);

  return {
    capturedByWhite: captured.b,
    capturedByBlack: captured.w,
    advantage: sum(captured.b) - sum(captured.w),
  };
}

// The ordered list of plies (SAN + the FEN reached after each) plus the game's
// starting FEN, so the board can jump to any point in the move history.
export function getGameLine(chessGame) {
  const history = chessGame.history({ verbose: true });
  return {
    startFen: history.length ? history[0].before : chessGame.fen(),
    plies: history.map((move) => ({ san: move.san, fen: move.after })),
  };
}