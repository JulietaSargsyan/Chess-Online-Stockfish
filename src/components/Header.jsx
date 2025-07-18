import { IoArrowUndo } from "react-icons/io5";
import { TbBulbFilled } from "react-icons/tb";
import { MdRestartAlt } from "react-icons/md";

const levels = [
  { label: 'Beginner', value: 1 },
  { label: 'Novice', value: 3 },
  { label: 'Casual Player', value: 5 },
  { label: 'Intermediate', value: 8 },
  { label: 'Advanced', value: 12 },
  { label: 'Expert', value: 16 },
  { label: 'Master', value: 20 },
];

function Header({ handleLevelChange }) {
  return (
    <header>
        <h1 className='logo'>Chess Online</h1>
        <div className='control-btns'>
            <MdRestartAlt title="Restart game"      className='control-btn restart'/>
            <IoArrowUndo  title="Undo Move"         className='control-btn undo'/>
            <TbBulbFilled title="Hint"              className='control-btn hint'/>
            <select       title="Change Difficulty" className='control-btn difficulty-btn' onChange={(e) => handleLevelChange(e.target.value)}>
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