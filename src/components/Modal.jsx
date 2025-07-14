import React from 'react'

function Modal({ winner, handleNewGame }) {
  return (
    <div className='modal-container'>
       <div className='modal'>
          <h2>{`${winner === 'Draw' ? 'It\'s a Draw!': `The winner is ${winner}` }`}</h2>
          <div className='buttons-container'>
            <button onClick={handleNewGame}>Start New Game</button>
          </div>
       </div>
    </div>
  )
}

export default Modal