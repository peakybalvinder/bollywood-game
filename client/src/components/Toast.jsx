import React from 'react';

export default function Toast({ type = 'info', message }) {
  const classes = {
    success: 'toast toast-success',
    error: 'toast toast-error',
    info: 'toast toast-info',
  };
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div className={classes[type] || classes.info}>
      <span className="mr-2 opacity-80">{icons[type]}</span>
      {message}
    </div>
  );
}
