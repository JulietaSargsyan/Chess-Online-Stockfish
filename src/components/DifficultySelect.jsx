import React from 'react'

const LEVELS = [
  { label: 'Beginner',       value: 1,  depth: 4 },
  { label: 'Novice',         value: 3,  depth: 6 },
  { label: 'Casual Player',  value: 5,  depth: 8 },
  { label: 'Intermediate',   value: 8,  depth: 10 },
  { label: 'Advanced',       value: 12, depth: 12 },
  { label: 'Master',         value: 16, depth: 16 },
  { label: 'Expert',         value: 20, depth: 20 },
];

function DifficultySelect({ currentLevel, handleLevelChange }) {
  return (
    <select
      title="Set Difficulty"
      className="control-btn difficulty-btn"
      value={currentLevel}
      onChange={(e) =>
        handleLevelChange(LEVELS[e.target.selectedIndex])
      }
    >
      {LEVELS.map((level) => (
        <option key={level.value} value={level.value}>
          {level.label}
        </option>
      ))}
    </select>
  );
}

export default DifficultySelect