import { useState, useCallback, useEffect, useRef } from 'react';

const LIVES_WORD = 'BOLLYWOOD';
const MAX_LIVES  = LIVES_WORD.length; // 9

/**
 * Core solo game engine — shared by Daily Challenge and vs Computer modes.
 * Pure in-memory, no server, no socket.
 */
export default function useSoloGame(movieName) {
  const [blanks, setBlanks]             = useState([]);
  const [guessedLetters, setGuessed]    = useState([]);
  const [wrongLetters, setWrong]        = useState([]);
  const [livesLeft, setLives]           = useState(MAX_LIVES);
  const [status, setStatus]             = useState('idle'); // idle|playing|won|lost
  const [lastLetter, setLastLetter]     = useState(null);
  const [lastCorrect, setLastCorrect]   = useState(null);
  const [lastRevealed, setLastRevealed] = useState(new Set());
  const timerRef = useRef(null);

  // Initialise blanks when movieName is set
  useEffect(() => {
    if (!movieName) return;
    const initial = movieName.split('').map(ch =>
      /[a-zA-Z0-9]/.test(ch) ? '_' : ch
    );
    setBlanks(initial);
    setGuessed([]);
    setWrong([]);
    setLives(MAX_LIVES);
    setStatus('playing');
    setLastLetter(null);
    setLastCorrect(null);
    setLastRevealed(new Set());
  }, [movieName]);

  const guess = useCallback((letter) => {
    if (status !== 'playing') return false;
    const l = letter.toLowerCase();
    if (guessedLetters.includes(l)) return false;

    clearTimeout(timerRef.current);
    setGuessed(prev => [...prev, l]);
    setLastLetter(letter.toUpperCase());

    const lower     = movieName.toLowerCase();
    const positions = [];
    const newBlanks = [...blanks];

    for (let i = 0; i < lower.length; i++) {
      if (lower[i] === l) {
        positions.push(i);
        newBlanks[i] = movieName[i];
      }
    }

    if (positions.length > 0) {
      setLastCorrect(true);
      setBlanks(newBlanks);
      setLastRevealed(new Set(positions));
      // Check win
      if (!newBlanks.includes('_')) setStatus('won');
    } else {
      setLastCorrect(false);
      setLastRevealed(new Set());
      setWrong(prev => {
        const next = [...prev, letter.toUpperCase()];
        if (next.length >= MAX_LIVES) setStatus('lost');
        return next;
      });
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) setStatus('lost');
        return next;
      });
    }

    timerRef.current = setTimeout(() => {
      setLastLetter(null);
      setLastCorrect(null);
    }, 2000);

    return true;
  }, [status, guessedLetters, movieName, blanks]);

  return {
    blanks, guessedLetters, wrongLetters, livesLeft,
    status, lastLetter, lastCorrect, lastRevealed,
    guess,
    livesWord: LIVES_WORD,
  };
}
