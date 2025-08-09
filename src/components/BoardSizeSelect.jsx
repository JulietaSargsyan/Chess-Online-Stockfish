import React from 'react'

const boardSizesDesktop = [
  {label: 'XS', value: '20%'},
  {label: 'S', value: '30%'},
  {label: 'M', value: '35%'},
  {label: 'L', value: '40%'},
  {label: 'XL', value: '45%'}
]

const boardSizesMobile = [
  {label: 'XS', value: '50%'},
  {label: 'S', value: '65%'},
  {label: 'M', value: '75%'},
  {label: 'L', value: '85%'},
  {label: 'XL', value: '95%'}
]

function BoardSizeSelect({ isMobile, boardSize, setBoardSize }) {
  const boardSizesArray = isMobile ? boardSizesMobile : boardSizesDesktop;

  return (
    <select
      title="Set Board Size"
      className="control-btn difficulty-btn"
      value={boardSize.value}
      onChange={(e) =>
        setBoardSize(boardSizesArray[e.target.selectedIndex])
      }
    >
      {boardSizesArray.map((size) => (
        <option key={size.value} value={size.value}>
          {size.label}
        </option>
      ))}
    </select>
  );
}

export default BoardSizeSelect