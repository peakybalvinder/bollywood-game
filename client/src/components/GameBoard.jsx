import React, { useState, useEffect } from 'react';
import socket from '../socket';
import MovieBlanks from './MovieBlanks';
import BollywoodLives from './BollywoodLives';
import Keyboard from './Keyboard';

export default function GameBoard({ game, players, myId, isHost, showToast }) {
  const [newPositions, setNewPositions] = useState([]);
  const [shakeWrong, setShakeWrong]     = useState(false);
  const [lastGuessInfo, setLastGuessInfo] = useState(null); // { letter, correct, by }

  // ── Guess result event ─────────────────────────────────────────────────
  useEffect(() => {
    function onGuessResult({ letter, correct, positions, guessedBy }) {
      setLastGuessInfo({ letter, correct, by: guessedBy });

      if (correct) {
        setNewPositions(positions);
        setTimeout(() => setNewPositions([]), 600);
      } else {
        setShakeWrong(true);
        setTimeout(() => setShakeWrong(false), 600);
      }
    }
    socket.on('guess_result', onGuessResult);
    return () => socket.off('guess_result', onGuessResult);
  }, []);

  function handleGuess(letter) {
    socket.emit('guess_letter', { letter }, ({ success, error }) => {
      if (!success && error) showToast(error, 'error');
    });
  }

  const isGameOver = game.status !== 'playing';
  // All non-host players can guess (or everyone — depends on your preference).
  // Here: anyone who hasn't correctly guessed yet can still press keys.
  const myPlayer = players.find((p) => p.id === myId);
  const canGuess = !isGameOver && !isHost && !(myPlayer?.guessedCorrectly);

  return (
    <div className="flex flex-col items-center gap-8 w-full">

      {/* Last guess notification */}
      {lastGuessInfo && (
        <div
          key={`${lastGuessInfo.letter}-${lastGuessInfo.correct}`}
          className={`text-sm font-body px-5 py-2 rounded-full border animate-fade-in
            ${lastGuessInfo.correct
              ? 'bg-green-900 border-green-700 text-green-300'
              : 'bg-crimson-900 border-crimson-700 text-red-300'
            }`}
        >
          <span className="font-mono font-bold">{lastGuessInfo.by}</span>
          &nbsp;guessed&nbsp;
          <span className="font-mono font-bold text-base">"{lastGuessInfo.letter}"</span>
          &nbsp;—&nbsp;
          {lastGuessInfo.correct ? '✓ Correct!' : '✕ Wrong!'}
        </div>
      )}

      {/* BOLLYWOOD lives */}
      <BollywoodLives livesLeft={game.livesLeft} />

      {/* Blanks */}
      <div className={shakeWrong ? 'animate-shake' : ''}>
        <MovieBlanks blanks={game.blanks} newPositions={newPositions} />
      </div>

      {/* Hint badge */}
      {game.hint && (
        <div className="flex items-center gap-2">
          <span className="text-gold-700 text-xs uppercase tracking-widest">Hint:</span>
          <span className="font-mono font-bold text-gold-400 bg-ink-700 border border-ink-600 rounded px-2 py-0.5">
            {game.hint.toUpperCase()}
          </span>
          <span className="text-gold-700 text-xs">is pre-revealed</span>
        </div>
      )}

      {/* Wrong letters strip */}
      {game.wrongLetters.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {game.wrongLetters.map((l) => (
            <span
              key={l}
              className="font-mono font-bold text-sm text-ink-500 line-through bg-ink-800 border border-ink-700 rounded px-2 py-0.5"
            >
              {l}
            </span>
          ))}
        </div>
      )}

      {/* Keyboard */}
      {!isGameOver && (
        <div className="w-full mt-2">
          {isHost ? (
            <p className="text-gold-700 text-sm text-center font-body italic">
              You're the host — watch the others guess! 🎬
            </p>
          ) : myPlayer?.guessedCorrectly ? (
            <p className="text-green-400 text-sm text-center font-body">
              🎉 You've already guessed this one! Cheer for the others!
            </p>
          ) : (
            <Keyboard
              guessedLetters={game.guessedLetters}
              wrongLetters={game.wrongLetters}
              onGuess={handleGuess}
              disabled={!canGuess}
            />
          )}
        </div>
      )}
    </div>
  );
}
