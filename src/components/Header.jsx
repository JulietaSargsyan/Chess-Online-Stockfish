import { IoArrowUndo } from "react-icons/io5";
import { TbBulbFilled } from "react-icons/tb";
import { MdRestartAlt } from "react-icons/md";

const levels = [
  { label: 'Beginner',       value: 1,  depth: 4 },
  { label: 'Novice',         value: 3,  depth: 6 },
  { label: 'Casual Player',  value: 5,  depth: 8 },
  { label: 'Intermediate',   value: 8,  depth: 10 },
  { label: 'Advanced',       value: 12, depth: 12 },
  { label: 'Expert',         value: 16, depth: 16 },
  { label: 'Master',         value: 20, depth: 20 },
];

function Header({ currentLevel, handleLevelChange }) {
  return (
    <header>
        <h1 className='logo'>Chess Online</h1>
        <div className='control-btns'>
            <MdRestartAlt title="Restart game" className='control-btn restart'/>
            <IoArrowUndo  title="Undo Move"    className='control-btn undo'/>
            <TbBulbFilled title="Hint"         className='control-btn hint'/>
            <select       
              title="Set Difficulty" 
              className='control-btn difficulty-btn' 
              value={currentLevel} 
              onChange={(e) => handleLevelChange(levels[e.target.selectedIndex])}
            >
                {levels.map(level => (
                    <option key={level.value} value={level.value}>
                        {level.label}
                    </option>
                ))}
            </select>
        </div>
    </header>
  )
}

export default Header