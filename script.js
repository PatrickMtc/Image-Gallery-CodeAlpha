/* ── State ────────────────────────────────────────────────── */
let state = {
  current: '0',   // number currently on screen
  prev: null,      // number before the operator
  op: null,        // pending operator
  justCalc: false, // did we just press =?
  exprStr: ''      // expression shown above result
};

/* ── DOM refs ─────────────────────────────────────────────── */
const exprEl   = document.getElementById('expr');
const resultEl = document.getElementById('result');
const btnsEl   = document.getElementById('btns');
const clearBtn = document.querySelector('[data-action="clear"]');

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Format a numeric string with thousand-separators.
 * Preserves decimals and trailing dot.
 */
function fmt(numStr) {
  if (numStr === 'Error') return 'Error';
  const hasTrailingDot = numStr.endsWith('.');
  const n = parseFloat(numStr);
  if (isNaN(n)) return 'Error';
  const formatted = parseFloat(n.toPrecision(10)).toLocaleString('en-US', {
    maximumFractionDigits: 10
  });
  return hasTrailingDot ? formatted + '.' : formatted;
}

/** Core arithmetic */
function calculate(a, op, b) {
  const fa = parseFloat(a);
  const fb = parseFloat(b);
  switch (op) {
    case '+': return fa + fb;
    case '−': return fa - fb;
    case '×': return fa * fb;
    case '÷': return fb === 0 ? NaN : fa / fb;
    default:  return fa;
  }
}

/* ── Render ───────────────────────────────────────────────── */
function render() {
  const display = fmt(state.current);
  resultEl.textContent = display;
  resultEl.className = 'result';
  if (display === 'Error') {
    resultEl.classList.add('error');
  } else if (display.replace(/[^0-9]/g, '').length > 9) {
    resultEl.classList.add('small');
  }

  exprEl.textContent = state.exprStr;

  // Highlight active operator
  document.querySelectorAll('.btn.op').forEach(btn => {
    const isActive = btn.dataset.val === state.op && !state.justCalc;
    btn.classList.toggle('active', isActive);
  });

  // AC vs C label
  const isDirty = state.current !== '0' || state.prev !== null;
  clearBtn.textContent = isDirty ? 'C' : 'AC';
}

/* ── Action handler ───────────────────────────────────────── */
function handle(action, val) {
  switch (action) {

    case 'clear':
      state = { current: '0', prev: null, op: null, justCalc: false, exprStr: '' };
      break;

    case 'num':
      if (state.current === 'Error') { state.current = val; break; }
      if (state.justCalc) { state.current = val; state.justCalc = false; break; }
      if (state.current === '0') { state.current = val; break; }
      if (state.current.replace('.', '').replace('-', '').length >= 12) break; // digit limit
      state.current += val;
      break;

    case 'decimal':
      if (state.current === 'Error') { state.current = '0.'; break; }
      if (state.justCalc) { state.current = '0.'; state.justCalc = false; break; }
      if (!state.current.includes('.')) state.current += '.';
      break;

    case 'sign':
      if (state.current === 'Error' || state.current === '0') break;
      state.current = (parseFloat(state.current) * -1).toString();
      state.justCalc = false;
      break;

    case 'percent':
      if (state.current === 'Error') break;
      state.current = (parseFloat(state.current) / 100).toString();
      state.justCalc = false;
      break;

    case 'op':
      if (state.current === 'Error') break;
      // Chain: evaluate pending op before setting new one
      if (state.op && state.prev !== null && !state.justCalc) {
        const res = calculate(state.prev, state.op, state.current);
        state.current = isNaN(res) ? 'Error' : res.toString();
      }
      state.prev = state.current;
      state.op = val;
      state.exprStr = fmt(state.current) + ' ' + val;
      state.justCalc = false;
      state.current = '0';
      break;

    case 'equals':
      if (!state.op || state.prev === null || state.current === 'Error') break;
      const res = calculate(state.prev, state.op, state.current);
      state.exprStr = fmt(state.prev) + ' ' + state.op + ' ' + fmt(state.current) + ' =';
      state.current = isNaN(res) ? 'Error' : res.toString();
      state.prev = null;
      state.op = null;
      state.justCalc = true;
      break;
  }

  render();
}

/* ── Mouse / touch ────────────────────────────────────────── */
btnsEl.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  handle(btn.dataset.action, btn.dataset.val);
});

/* ── Keyboard support ─────────────────────────────────────── */
document.addEventListener('keydown', e => {
  const k = e.key;

  if (k >= '0' && k <= '9')       handle('num', k);
  else if (k === '.')              handle('decimal');
  else if (k === '+')              handle('op', '+');
  else if (k === '-')              handle('op', '−');
  else if (k === '*')              handle('op', '×');
  else if (k === '/') { e.preventDefault(); handle('op', '÷'); }
  else if (k === 'Enter' || k === '=') handle('equals');
  else if (k === 'Escape')         handle('clear');
  else if (k === '%')              handle('percent');
  else if (k === 'Backspace') {
    e.preventDefault();
    if (state.current === 'Error') { state.current = '0'; }
    else if (!state.justCalc && state.current.length > 1) {
      state.current = state.current.slice(0, -1);
      if (state.current === '-') state.current = '0'; // edge case
    } else {
      state.current = '0';
    }
    state.justCalc = false;
    render();
  }
});

/* ── Init ─────────────────────────────────────────────────── */
render();
