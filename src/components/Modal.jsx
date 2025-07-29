import React from 'react'

function Modal({ winner, handleNewGame, handleDismiss }) {
  return (
    <div className='modal-container'>
       <div className='modal'>
          <h2>{`${winner === 'Draw' ? 'It\'s a Draw!': `The winner is ${winner}` }`}</h2>
          <div className='buttons-container'>
            <button onClick={handleNewGame}>Start New Game</button>
            <button onClick={handleDismiss} className='dismiss-btn'>Dismiss</button>
          </div>
       </div>
    </div>
  )
}

export default Modal