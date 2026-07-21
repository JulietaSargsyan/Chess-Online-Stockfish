import { useEffect, useRef } from 'react';
import { MdFirstPage, MdChevronLeft, MdChevronRight, MdLastPage } from 'react-icons/md';

// A scrollable, clickable list of the game's moves with navigation controls.
//   moves:      [{ san }]  — the plies in order
//   currentPly: 0..moves.length — the ply currently shown on the board
//               (0 = starting position, moves.length = latest/live)
function MoveList({ moves, currentPly, isLive, onSelectPly, onFirst, onPrev, onNext, onLast }) {
  const activeRef = useRef(null);
  const totalPlies = moves.length;

  // Keep the highlighted move visible as you step through the game.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentPly]);

  // Group plies into numbered rows: white move + black move.
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      number: i / 2 + 1,
      white: { san: moves[i].san, ply: i + 1 },
      black: moves[i + 1] ? { san: moves[i + 1].san, ply: i + 2 } : null,
    });
  }

  const renderMove = (move) => {
    if (!move) return <span className="move-san empty" />;
    const active = currentPly === move.ply;
    return (
      <button
        ref={active ? activeRef : null}
        className={`move-san ${active ? 'active' : ''}`}
        onClick={() => onSelectPly(move.ply)}
      >
        {move.san}
      </button>
    );
  };

  return (
    <div className="move-list" onClick={(e) => e.stopPropagation()}>
      <div className="move-list-header">
        <span>Moves</span>
        {!isLive && <span className="reviewing-badge">Reviewing</span>}
      </div>

      <div className="move-list-scroll">
        {rows.length === 0 ? (
          <p className="move-list-empty">No moves yet</p>
        ) : (
          rows.map((row) => (
            <div className="move-row" key={row.number}>
              <span className="move-num">{row.number}.</span>
              {renderMove(row.white)}
              {renderMove(row.black)}
            </div>
          ))
        )}
      </div>

      <div className="move-nav">
        <button title="First move" onClick={onFirst} disabled={currentPly === 0}>
          <MdFirstPage />
        </button>
        <button title="Previous move" onClick={onPrev} disabled={currentPly === 0}>
          <MdChevronLeft />
        </button>
        <button title="Next move" onClick={onNext} disabled={currentPly >= totalPlies}>
          <MdChevronRight />
        </button>
        <button title="Latest move" onClick={onLast} disabled={currentPly >= totalPlies}>
          <MdLastPage />
        </button>
      </div>
    </div>
  );
}

export default MoveList;
