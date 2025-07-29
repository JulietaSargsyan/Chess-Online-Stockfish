const audioCache = {};

export function playSound(filename, volume = 1.0) {
  const path = `/sounds/${filename}`;

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