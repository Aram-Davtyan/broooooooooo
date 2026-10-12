/* BRODAY — всё работает локально: без библиотек, API и интернета. */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const intro = $('#intro');
  const openSite = $('#openSite');
  const soundToggle = $('#soundToggle');
  const soundLabel = $('#soundLabel');
  const progress = $('#topProgress');
  const toast = $('#toast');
  let soundOn = false;
  let audioContext = null;
  let toastTimeout;

  function message(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function playTone(freq, at, duration, volume, wave = 'sine') {
    if (!soundOn) return;
    try {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return;
      if (!audioContext) audioContext = new AudioEngine();
      if (audioContext.state === 'suspended') audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + at);
      gain.gain.setValueAtTime(0.001, audioContext.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + at + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + at);
      oscillator.stop(audioContext.currentTime + at + duration + 0.01);
    } catch (_error) {
      // Страница всегда продолжает работать даже при отключённом Web Audio.
    }
  }

  function sound(kind = 'tap') {
    if (kind === 'win') {
      [392, 494, 587, 784, 988].forEach((note, i) => playTone(note, i * 0.095, 0.43, 0.048));
    } else if (kind === 'open') {
      [294, 392, 494].forEach((note, i) => playTone(note, i * 0.11, 0.32, 0.035));
    } else {
      playTone(650, 0, 0.09, 0.016, 'triangle');
    }
  }


  // Original, locally packaged birthday beat, never a remote stream.
  const soundtrack = new Audio('assets/broday-beat.mp3');
  soundtrack.loop = true;
  soundtrack.preload = 'auto';
  soundtrack.volume = 0.40;
  function syncMusicControl() {
    if (!soundToggle) return;
    soundToggle.setAttribute('aria-pressed', String(soundOn));
    soundToggle.setAttribute('aria-label', soundOn ? 'Pause birthday music' : 'Play birthday music');
    if (soundLabel) soundLabel.textContent = soundOn ? 'MUSIC ON / PAUSE' : 'MUSIC OFF / PLAY';
  }
  function setMusic(shouldPlay) {
    soundOn = shouldPlay;
    syncMusicControl();
    if (soundOn) {
      const playback = soundtrack.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {
          soundOn = false;
          syncMusicControl();
          message('MUSIC PAUSED / PRESS PLAY');
        });
      }
      sound('open');
    } else {
      soundtrack.pause();
    }
  }
  soundToggle?.addEventListener('click', () => setMusic(!soundOn));
  syncMusicControl();

  openSite?.addEventListener('click', () => {
    document.body.classList.remove('intro-locked');
    document.body.classList.add('started');
    intro?.classList.add('is-gone');
    intro?.setAttribute('aria-hidden', 'true');
    setMusic(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => { if (intro) intro.hidden = true; }, 1100);
  });

  function updateScrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // Анимации появляются только тогда, когда человек долистал до блока.
  const revealBlocks = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
    const observer = new IntersectionObserver((entries, watcher) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          watcher.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealBlocks.forEach(block => observer.observe(block));
  } else {
    revealBlocks.forEach(block => block.classList.add('is-visible'));
  }

  // Восемь тщательно отобранных снимков вместо всего фотоархива.
  const photoAlt = {
    '01': 'Илюша на прогулке', '02': 'Илюша в красной шапке',
    '03': 'Илюша в необычных очках', '04': 'Илюша в юности',
    '05': 'Памятный портрет', '06': 'Илюша на природе',
    '07': 'Друзья вместе', '08': 'Зеркальный портрет'
  };
  $$('.photo-slot[data-photo]').forEach(slot => {
    const index = slot.dataset.photo;
    const image = new Image();
    image.alt = photoAlt[index] || 'Фотография';
    image.className = 'slot-image';
    image.decoding = 'async';
    if (Number(index) > 3) image.loading = 'lazy';
    image.onload = () => slot.classList.add('has-photo');
    image.src = `assets/photos/${index}.webp`;
    slot.appendChild(image);
  });


  // Five physical-style wish posters. Tap to reveal the personal wish behind each.
  const wishTiles = $$('.wish-tile');
  wishTiles.forEach(tile => tile.addEventListener('click', () => {
    const opened = tile.classList.toggle('is-open');
    tile.setAttribute('aria-pressed', String(opened));
    const reveal = tile.querySelector('.wish-tile-reveal');
    if (reveal) reveal.setAttribute('aria-hidden', String(!opened));
    sound(opened ? 'open' : 'tap');
  }));
  $('#wishAllBtn')?.addEventListener('click', (event) => {
    wishTiles.forEach(tile => {
      tile.classList.add('is-open');
      tile.setAttribute('aria-pressed', 'true');
      const reveal = tile.querySelector('.wish-tile-reveal');
      if (reveal) reveal.setAttribute('aria-hidden', 'false');
    });
    const panel = $('#wishCelebration');
    if (panel) panel.hidden = false;
    event.currentTarget.classList.add('is-done');
    sound('win');
    sprinkleWishes();
  });
  function sprinkleWishes() {
    if (prefersReducedMotion.matches) return;
    const layer = $('#wishes');
    if (!layer) return;
    for (let i = 0; i < 38; i++) {
      const star = document.createElement('span');
      star.className = 'wish-falling-star';
      star.textContent = ['*', '+', '*'][i % 3];
      star.style.left = (Math.random() * 100) + '%';
      const anchor = $('#wishAllBtn').getBoundingClientRect();
      star.style.top = (anchor.top + anchor.height / 2 - layer.getBoundingClientRect().top) + 'px';
      star.style.setProperty('--star-delay', (Math.random() * .7) + 's');
      star.style.setProperty('--star-drift', ((Math.random() - .5) * 150) + 'px');
      layer.appendChild(star);
      star.addEventListener('animationend', () => star.remove(), {once:true});
    }
  }

  // Мини-интерактив: от легендарности не отвертеться.
  const yesButton = $('#yesBtn');
  const noButton = $('#noBtn');
  const testActions = $('#testActions');
  const testResult = $('#testResult');

  let escapes = 0;
  const escapesTo = [
    {x: -92, y: 55}, {x: 106, y: 39}, {x: -45, y: -35},
    {x: 91, y: -12}, {x: 11, y: 54}, {x: -117, y: 14}
  ];
  function dodgeNo() {
    if (!noButton || !testActions || (testResult && !testResult.hidden)) return;
    const delta = escapesTo[escapes++ % escapesTo.length];
    const startX = noButton.offsetLeft;
    const startY = noButton.offsetTop;
    const maxX = Math.max(0, testActions.clientWidth - noButton.offsetWidth);
    const maxY = Math.max(0, testActions.clientHeight - noButton.offsetHeight);
    const targetX = Math.min(maxX, Math.max(0, startX + delta.x));
    const targetY = Math.min(maxY, Math.max(0, startY + delta.y));
    noButton.style.transform = `translate3d(${targetX - startX}px, ${targetY - startY}px,0) rotate(${escapes % 2 ? -3 : 4}deg)`;
    if (escapes === 2 || escapes % 5 === 0) {
      message('НЕТ / СТАТУС ЛЕГЕНДЫ ЯВЛЯЕТСЯ ОБЯЗАТЕЛЬНЫМ');
      sound('tap');
    }
  }
  noButton?.addEventListener('pointerenter', ev => {
    if (ev.pointerType === 'mouse' || ev.pointerType === 'pen') dodgeNo();
  });
  noButton?.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    dodgeNo();
  });
  noButton?.addEventListener('focus', dodgeNo);
  noButton?.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); dodgeNo(); }
  });
  function finishTest() {
    if (testResult) testResult.hidden = false;
    if (testActions) testActions.hidden = true;
    sound('win');
    message('ПОЗДРАВЛЯЕМ! УРОВЕНЬ: БРООООО ✳');
  }
  yesButton?.addEventListener('click', finishTest);
  noButton?.addEventListener('click', ev => { ev.preventDefault(); ev.stopImmediatePropagation(); dodgeNo(); });

  // Последнее письмо: настоящее поздравление и праздничные конфетти.
  const revealButton = $('#revealLetter');
  const envelopeWrap = $('#envelopeWrap');
  const letterPaper = $('#letterPaper');
  const confettiLayer = $('#confettiLayer');
  const letterSection = $('#letter');
  function rainConfetti() {
    if (!confettiLayer || !letterSection || prefersReducedMotion.matches) return;
    const startY = Math.max(0, -letterSection.getBoundingClientRect().top) + 16;
    const palette = ['#e8b777', '#d57c53', '#f1e6d0', '#d2a065', '#a14d38', '#f7d7a6'];
    for (let i = 0; i < 75; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.top = `${startY}px`;
      piece.style.setProperty('--left', `${Math.random() * 100}%`);
      piece.style.setProperty('--delay', `${Math.random() * .85}s`);
      piece.style.setProperty('--duration', `${3.1 + Math.random() * 2.6}s`);
      piece.style.setProperty('--spin', `${Math.random() * 180}deg`);
      piece.style.setProperty('--drift', `${(Math.random() - .5) * 240}px`);
      piece.style.setProperty('--color', palette[i % palette.length]);
      piece.style.width = `${5 + Math.random() * 9}px`;
      piece.style.height = `${7 + Math.random() * 15}px`;
      piece.addEventListener('animationend', () => piece.remove(), { once: true });
      confettiLayer.appendChild(piece);
    }
  }
  revealButton?.addEventListener('click', () => {
    if (!letterPaper || !letterPaper.hidden) return;
    if (envelopeWrap) envelopeWrap.hidden = true;
    letterPaper.hidden = false;
    sound('win');
    rainConfetti();
    setTimeout(() => {
      letterPaper.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
      letterPaper.focus({ preventScroll: true });
    }, 110);
  });

  // Скрытая пасхалка для тех, кто упорно нажимает на логотип.
  let logoHits = 0;
  let logoTime = 0;
  $('#brand')?.addEventListener('click', () => {
    const now = Date.now();
    logoHits = now - logoTime < 1400 ? logoHits + 1 : 1;
    logoTime = now;
    if (logoHits === 5) {
      message('СЕКРЕТНЫЙ СТАТУС: БРАТ ПО ЖИЗНИ. ТУТ БЕЗ ВОПРОСОВ. ❤️');
      sound('win');
      logoHits = 0;
    }
  });
})();
