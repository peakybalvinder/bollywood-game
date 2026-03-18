import React from 'react';

export default function GameOverOverlay({ game, players, onPlayAgain, isHost }) {
  const won = game?.status === 'won';
  const sorted = [...(players || [])].sort((a, b) => b.score - a.score);

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="card-dark rounded-2xl p-8 w-full max-w-lg animate-bounce-in text-center">
        <div className="text-6xl mb-4">{won ? '🎉' : '💔'}</div>
        <h2 className={`font-display font-black text-4xl mb-2 ${won ? 'gold-text' : 'text-crimson-400'}`}>
          {won ? 'Sahi Jawab!' : 'Game Over!'}
        </h2>
        <p className="text-gold-600 font-body text-sm mb-2">
          {won ? 'The movie was correctly guessed!' : 'Better luck next time!'}
        </p>
        <div className="bg-ink-900 border border-gold-800 rounded-xl px-6 py-4 my-6">
          <p className="text-gold-700 text-xs uppercase tracking-widest mb-1">The Movie Was</p>
          <p className="font-display font-bold text-2xl text-gold-300">{game?.movieName}</p>
        </div>
        {sorted.length > 0 && (
          <div className="mb-6">
            <p className="text-gold-700 text-xs uppercase tracking-widest mb-3">Final Scores</p>
            <div className="space-y-2">
              {sorted.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-ink-700 border border-ink-600 rounded-lg px-4 py-2">
                  <span className="text-lg">{['🥇','🥈','🥉'][i] || '🎭'}</span>
                  <span className="flex-1 text-left font-body text-gold-300 text-sm">{p.name}</span>
                  {p.guessedCorrectly && <span className="text-green-400 text-xs">Guessed!</span>}
                  <span className="font-mono font-bold text-gold-500 text-sm">{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          {isHost ? (
            <button onClick={onPlayAgain} className="btn-gold px-8 py-3">🎬 Play Again</button>
          ) : (
            <p className="text-gold-700 text-sm font-body italic">Waiting for host to start a new game…</p>
          )}
        </div>
      </div>
    </div>
  );
}
