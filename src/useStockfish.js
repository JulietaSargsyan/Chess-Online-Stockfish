import { useEffect, useRef, useCallback } from 'react';

export function useStockfish(onMessage) {
  const sfRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window.Stockfish !== 'function') {
      console.error('Stockfish is not loaded. Ensure stockfish.wasm.js is included.');
      onMessageRef.current({ error: 'Stockfish is not loaded' });
      return;
    }

    if (typeof SharedArrayBuffer === 'undefined') {
      console.error('SharedArrayBuffer not available. Check server headers and secure context.');
      onMessageRef.current({ error: 'SharedArrayBuffer not available' });
      return;
    }

    window.Stockfish().then((sf) => {
      sfRef.current = sf;

      sf.addMessageListener((line) => {
        onMessageRef.current(line);
      });

      // Initialize UCI protocol
      sf.postMessage('uci');
      sf.postMessage('isready');
    }).catch((error) => {
      onMessageRef.current({ error: `Stockfish initialization failed: ${error.message}` });
    });

    return () => {
      if (sfRef.current?.terminate) {
        sfRef.current.terminate();
      }
    };
  }, []); 

  const sendCommand = useCallback((cmd) => {
    if (sfRef.current) {
      sfRef.current.postMessage(cmd);
    } else {
      onMessageRef.current({ error: 'Stockfish not initialized' });
    }
  }, []);

  return { sendCommand };
}























// import { useEffect, useRef } from 'react';

// export function useStockfish(onMessage = console.log) {
//   const sfRef = useRef(null);

//   useEffect(() => {
//     if (typeof window.Stockfish !== 'function') {
//       console.error('Stockfish is not loaded.');
//       return;
//     }

//     window.Stockfish().then((sf) => {
//       sfRef.current = sf;

//       sf.addMessageListener(onMessage);
//       sf.postMessage("uci"); 
//     });

//     return () => {
//       if (sfRef.current?.terminate) {
//         sfRef.current.terminate();
//       }
//     };
//   }, []);

//   const sendCommand = (cmd) => {
//     if (sfRef.current) {
//       sfRef.current.postMessage(cmd);
//     }
//   };

//   return { sendCommand };
// }
