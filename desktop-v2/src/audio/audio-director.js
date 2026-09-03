const PATTERNS = Object.freeze({
  reveal: [[392, .07, .045], [523, .09, .05]],
  move: [[330, .055, .035], [440, .075, .04]],
  swap: [[294, .07, .04], [440, .07, .045], [294, .08, .035]],
  fire: [[196, .08, .055], [147, .12, .05]],
  tactic: [[220, .08, .045], [185, .11, .045]],
  treasure: [[523, .07, .045], [659, .08, .05], [784, .12, .055]],
  location: [[392, .06, .04], [494, .08, .045]],
  trump: [[262, .07, .05], [392, .08, .055], [523, .13, .06]],
  discard: [[220, .05, .03]],
  'your-turn': [[440, .05, .035], [554, .08, .04]],
  'ai-turn': [[247, .06, .026]],
  skip: [[196, .08, .04], [165, .09, .035]],
  error: [[147, .09, .035]],
  victory: [[392, .08, .055], [523, .09, .06], [659, .1, .065], [784, .22, .07]],
  defeat: [[247, .1, .045], [196, .12, .04], [147, .24, .035]]
});

export function createAudioDirector({ volume = 0.75 } = {}) {
  let context = null;
  let enabled = true;

  function getContext() {
    if (context) return context;
    const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextCtor) return null;
    context = new AudioContextCtor();
    return context;
  }

  async function unlock() {
    const ctx = getContext();
    if (ctx?.state === 'suspended') {
      try { await ctx.resume(); } catch { /* Browser may require a user gesture. */ }
    }
  }

  async function play(cue) {
    if (!enabled || !cue || !PATTERNS[cue]) return;
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { return; }
    }

    let cursor = ctx.currentTime + 0.012;
    for (const [frequency, duration, gainValue] of PATTERNS[cue]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = cue === 'fire' || cue === 'defeat' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, cursor);
      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue * volume), cursor + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(cursor);
      oscillator.stop(cursor + duration + 0.02);
      cursor += duration * 0.72;
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
  }

  return Object.freeze({ play, unlock, setEnabled, get enabled() { return enabled; } });
}
