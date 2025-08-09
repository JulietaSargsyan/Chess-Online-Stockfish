import BoardSizeSelect from "./BoardSizeSelect";
import DifficultySelect from "./DifficultySelect";
import GameButtons from "./GameButtons";

function ControlPanel({ isLoading, isLoadingBestMove, currentLevel, handleLevelChange, handleHintClick, handleTakeBack, handleNewGame, handleBestMove, isMobile, boardSize, setBoardSize }) {
  const handleRestartGameButtonClick = () => {
    const response = confirm('Are you sure you want to restart the game?');
    if (!response) return;
    handleNewGame();
  }

  return (
    <header>
      <div className="control-btns">
        {isMobile ? (
          <div className="mobile-control-btns">
            <BoardSizeSelect
              isMobile={isMobile}
              boardSize={boardSize}
              setBoardSize={setBoardSize}
            />
            <DifficultySelect
              currentLevel={currentLevel}
              handleLevelChange={handleLevelChange}
            />
            <div className="mobile-control-btns-bottom">
              <GameButtons
                handleRestartGameButtonClick={handleRestartGameButtonClick}
                handleTakeBack={handleTakeBack}
                handleBestMove={handleBestMove}
                handleHintClick={handleHintClick}
                isLoadingBestMove={isLoadingBestMove}
                isLoading={isLoading}
              />
            </div>
          </div>
        ) : (
          <>
            <GameButtons
              handleRestartGameButtonClick={handleRestartGameButtonClick}
              handleTakeBack={handleTakeBack}
              handleBestMove={handleBestMove}
              handleHintClick={handleHintClick}
              isLoadingBestMove={isLoadingBestMove}
              isLoading={isLoading}
            />
            <DifficultySelect
              currentLevel={currentLevel}
              handleLevelChange={handleLevelChange}
            />
            <BoardSizeSelect
              isMobile={isMobile}
              boardSize={boardSize}
              setBoardSize={setBoardSize}
            />
          </>
        )}
      </div>
    </header>
  );
}

export default ControlPanel