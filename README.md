# ♟️ Chess Online

A modern **online chess game** built with **React** and powered by the WebAssembly port of the **Stockfish engine**. Play against a smart AI with customizable difficulty levels, undo your last move, or get helpful hints when you're stuck!

[Play Online](https://chess-online-tan.vercel.app/)

![React](https://img.shields.io/badge/React-18+-blue?logo=react)
![Stockfish](https://img.shields.io/badge/Engine-Stockfish-brightgreen?logo=chess)
![Status](https://img.shields.io/badge/Status-Active-success)

## 🔥 Features

- 🎯 **Customizable Difficulty**  
  Choose from beginner to master level with varying engine skill levels and search depths.

- 🧠 **Powered by Stockfish**  
  The world's strongest open-source chess engine is integrated using WebAssembly.

- 🔁 **Undo Last Move**  
  Made a mistake? No worries! Take back your most recent move and try again.

- 💡 **Hint Mode**  
  Need help? Get the best next move suggestion from Stockfish.

- 🕹️ **Responsive Chessboard**  
  Play seamlessly across devices with an interactive and animated chessboard UI.

## 🎮 Difficulty Levels

You can change the AI skill level during the game. Here's how the levels are structured:

| Level            | Skill Value | Depth |
|------------------|-------------|-------|
| Beginner         | 1           | 2     |
| Novice           | 3           | 4     |
| Casual Player    | 5           | 6     |
| Intermediate     | 8           | 10    |
| Advanced         | 12          | 14    |
| Master           | 16          | 18    |
| Expert           | 20          | 20    |

> **Skill** affects the AI's ability to pick moves smartly, while **Depth** defines how many moves ahead it thinks.
