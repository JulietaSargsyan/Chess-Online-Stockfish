// Unicode silhouettes for each piece type (filled glyphs; colour comes from CSS).
const PIECE_GLYPHS = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

// A single tray of captured pieces shown outside the board.
//   pieces:    array of piece types, e.g. ['q', 'r', 'p']
//   color:     'w' | 'b' — the colour of the captured pieces in this tray
//   advantage: material lead to show as "+N" (0 hides it)
function CapturedPieces({ pieces = [], color, advantage = 0 }) {
  return (
    <div className="captured-tray" aria-label={`${color === 'w' ? 'White' : 'Black'} pieces captured`}>
      {pieces.map((type, index) => (
        <span key={`${type}-${index}`} className={`cp-piece cp-${color}`}>
          {PIECE_GLYPHS[type]}
        </span>
      ))}
      {advantage > 0 && <span className="cp-advantage">+{advantage}</span>}
    </div>
  );
}

export default CapturedPieces;
