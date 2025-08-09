import { IoArrowUndo } from "react-icons/io5";
import { TbBulbFilled } from "react-icons/tb";
import { MdRestartAlt } from "react-icons/md";
import { AiOutlineLoading } from "react-icons/ai";
import { RiRobot2Line } from "react-icons/ri";

function GameButtons({
  handleRestartGameButtonClick,
  handleTakeBack,
  handleBestMove,
  handleHintClick,
  isLoadingBestMove,
  isLoading,
}) {
  return (
    <>
      <MdRestartAlt
        title="Restart game"
        className="control-btn restart"
        onClick={handleRestartGameButtonClick}
      />
      <IoArrowUndo
        title="Undo Move"
        className="control-btn undo"
        onClick={handleTakeBack}
      />
      {isLoadingBestMove ? (
        <AiOutlineLoading className="control-btn loadingHint" />
      ) : (
        <RiRobot2Line
          title="Best move"
          className="control-btn"
          onClick={handleBestMove}
        />
      )}
      {isLoading ? (
        <AiOutlineLoading className="control-btn loadingHint" />
      ) : (
        <TbBulbFilled
          title="Hint"
          className="control-btn hint"
          onClick={handleHintClick}
        />
      )}
    </>
  );
}

export default GameButtons