// input.js — keyboard + mouse state, exposed to the rest of the game.

export function createInput(canvas) {
  const keys = Object.create(null);
  const state = {
    keys,
    mouseX: canvas.width / 2,
    mouseY: canvas.height / 2,
    mouseDown: false,
    justPressed: new Set(),   // keys pressed this frame
    justReleased: new Set(),
  };

  const norm = (key) => key.toLowerCase();

  const onKeyDown = (e) => {
    if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
    const k = norm(e.key);
    if (!keys[k]) state.justPressed.add(k);
    keys[k] = true;
  };
  const onKeyUp = (e) => {
    const k = norm(e.key);
    keys[k] = false;
    state.justReleased.add(k);
  };
  const onMouseMove = (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - r.left;
    state.mouseY = e.clientY - r.top;
  };
  const onMouseDown = (e) => {
    if (e.button === 0) state.mouseDown = true;
  };
  const onMouseUp = (e) => {
    if (e.button === 0) state.mouseDown = false;
  };
  const onBlur = () => {
    for (const k of Object.keys(keys)) keys[k] = false;
    state.mouseDown = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('blur', onBlur);

  // Called at the start of every frame.
  state.begin = () => {
    state.justPressed.clear();
    state.justReleased.clear();
  };

  return state;
}