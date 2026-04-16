/**
 * Runner — picks a random solution and renders it.
 * Each drawing passes an array of { strategy, draw } objects.
 * opts.noClick: don't add click-to-reload on the holder (for 3D orbit controls)
 */
export function run(solutions, opts = {}) {
  if (!document.documentElement.classList.contains('embedded')) {
    const back = document.createElement('a');
    back.href = '../index.html';
    back.className = 'back';
    back.textContent = '\u2190 index';
    document.body.insertBefore(back, document.body.firstChild);
  }
  const chosen = solutions[Math.floor(Math.random() * solutions.length)];
  const el = document.getElementById('strategy');
  if (el) el.textContent = chosen.strategy ? '\u2192 ' + chosen.strategy : '';
  const holder = document.getElementById('h');

  // Click card or holder to reload
  const reload = () => location.reload();
  document.addEventListener('click', (e) => {
    if (e.target.closest('.card')) reload();
    if (!opts.noClick && e.target.closest('.holder')) reload();
  });

  chosen.draw(holder);
}
