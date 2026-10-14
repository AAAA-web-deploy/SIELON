(() => {
  'use strict';
  const cfg = window.SIELON_CONFIG || {};
  const motion = cfg.motion || {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 768px) and (pointer: fine)');
  const loader = document.getElementById('loader');
  if (loader && !window.__sielonIntroStarted) {
    window.__sielonIntroStarted = true;
    const holdFor = 2.2;
    let state = 'preparing';
    let frame = 0;
    let began = 0;
    let leaveTimer = 0;
    const fill = loader.querySelector('[data-loader-fill]');
    const pct = loader.querySelector('[data-loader-pct]');
    const finish = () => {
      if (state === 'finished') return;
      state = 'finished';
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = 0;
      if (window.__sielonIntroGuard) { clearTimeout(window.__sielonIntroGuard); window.__sielonIntroGuard = 0; }
      if (fill) fill.style.width = '100%';
      if (pct) pct.textContent = '100%';
      loader.setAttribute('aria-valuenow', '100');
      loader.classList.add('is-done');
      document.documentElement.classList.remove('intro-open');
      document.body.classList.remove('is-loading');
      document.querySelectorAll('[data-intro-lock]').forEach(node => { node.inert = false; });
      if (!location.hash) {
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
        root.style.scrollBehavior = previous;
      }
      leaveTimer = setTimeout(() => { loader.hidden = true; }, 500);
    };
    const tick = now => {
      if (state !== 'playing') return;
      frame = 0;
      const elapsed = Math.max(0, (now - began) / 1000);
      const progress = Math.max(0, Math.min(1, elapsed / holdFor));
      const value = Math.round(progress * 100);
      if (fill) fill.style.width = (progress * 100) + '%';
      if (pct) pct.textContent = value + '%';
      loader.setAttribute('aria-valuenow', String(value));
      if (elapsed >= holdFor) { finish(); return; }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (state !== 'preparing') return;
      state = 'playing';
      loader.hidden = false;
      document.body.classList.add('is-loading');
      document.querySelectorAll('[data-intro-lock]').forEach(node => { node.inert = true; });
      began = performance.now();
      frame = requestAnimationFrame(tick);
    };
    loader.querySelector('.loader__skip')?.addEventListener('click', finish);
    document.addEventListener('keydown', event => {
      if (state !== 'playing' || event.key !== 'Escape') return;
      event.preventDefault();
      finish();
    });
    addEventListener('pageshow', event => { if (event.persisted) finish(); });
    if (document.documentElement.classList.contains('intro-open')) start();
    else finish();
  }
  const reveal = document.querySelector('[data-reveal]');
  if (reveal) {
    const smooth = t => t * t * (3 - 2 * t);
    const unit = value => Math.max(0, Math.min(1, value));
    const line = "Elon's Encounter with SI-Elon";
    const typed = reveal.querySelector('[data-encounter-typed]');
    const motes = reveal.querySelector('[data-depart-motes]');
    if (motes && !motes.childElementCount) {
      for (let i = 0; i < 72; i++) {
        const dot = document.createElement('i');
        const angle = (i / 72) * Math.PI * 2 + (i % 5) * 0.2;
        const reach = 16 + (i * 37 % 42);
        dot.style.setProperty('--x', (12 + (i * 53 % 76)) + '%');
        dot.style.setProperty('--y', (8 + (i * 29 % 78)) + '%');
        dot.style.setProperty('--dx', (Math.cos(angle) * reach) + 'vw');
        dot.style.setProperty('--dy', (Math.sin(angle) * reach * 0.72 - 10) + 'vh');
        dot.style.setProperty('--a', (0.4 + (i % 5) * 0.12).toFixed(2));
        motes.append(dot);
      }
    }
    let shown = -1;
    const writeLine = count => {
      if (!typed || shown === count) return;
      shown = count;
      typed.textContent = line.slice(0, count);
    };
    const mapOpening = (scrolled, travel, width, height, header) => {
      const oldTravel = Math.max(1, (width >= 768 ? 3.2 : 2.8) * height - (height - header));
      const scene = unit(scrolled / oldTravel);
      const after = unit((scrolled - oldTravel) / Math.max(1, travel - oldTravel));
      return { scene, after };
    };
    const paintReveal = (scene, depart = 0, veil = 0, type = 0) => {
      const p = unit(scene);
      reveal.style.setProperty('--p', p.toFixed(4));
      reveal.style.setProperty('--reveal', smooth(unit((p - 0.04) / 0.74)).toFixed(4));
      reveal.style.setProperty('--mix', smooth(unit((p - 0.2) / 0.36)).toFixed(4));
      reveal.style.setProperty('--depart', unit(depart).toFixed(4));
      reveal.style.setProperty('--veil', unit(veil).toFixed(4));
      reveal.style.setProperty('--type', unit(type).toFixed(4));
      reveal.classList.toggle('is-settled', p >= 0.92);
      reveal.classList.toggle('is-ending', p >= 0.84 && depart < 0.04);
      reveal.classList.toggle('is-departing', depart > 0.02);
      reveal.classList.toggle('is-card', veil > 0.55);
      reveal.classList.toggle('is-typed', type >= 0.999);
      writeLine(Math.round(unit(type) * line.length));
      document.documentElement.classList.toggle('is-encounter', veil > 0.92);
    };
    const reel = reveal.querySelector('[data-reel]');
    const storySlides = [
      { motion: 'rise', src: 'assets/story-01-interview-1440.webp', fallback: 'assets/story-01-interview-1440.jpg', alt: 'Elon sits after the interview while a crew member turns off the studio light and a camera stops recording.', caption: 'The interview ends. The cameras switch off.' },
      { motion: 'left', src: 'assets/story-02-comparison-1440.webp', fallback: 'assets/story-02-comparison-1440.jpg', alt: 'A visual comparison: Elon watches an Elon Ma lookalike video on his phone, then looks up at a man whose face matches his almost exactly, only a few feet away.', caption: '' },
      { motion: 'settle', src: 'assets/story-03-meeting-1440.webp', fallback: 'assets/story-03-meeting-1440.jpg', alt: 'Backstage, a surprised Elon faces an almost identical double wearing an SI shirt and Ethereum pendant.', caption: 'ELON: Okay… that’s strange.\nTHE MAN: The security team said the same thing.' },
      { motion: 'rise', src: 'assets/story-04-breakfast-1440.webp', fallback: 'assets/story-04-breakfast-1440.jpg', alt: 'Both Elons hold matching white coffee mugs above identical breakfasts of steak and eggs.', caption: 'Asked what they want for breakfast, both answer together.\nELON + THE MAN: Steak, eggs, and coffee.' },
      { motion: 'scale', src: 'assets/story-05-gaming-1440.webp', fallback: 'assets/story-05-gaming-1440.jpg', alt: 'Elon and his double smile at each other while holding game controllers in a backstage lounge.', caption: 'ELON: What do you do to clear your head?\nTHE MAN: Play a game. Diablo, for example.' },
      { motion: 'right', src: 'assets/story-06-ideas-1440.webp', fallback: 'assets/story-06-ideas-1440.jpg', alt: 'The two Elons exchange ideas beside a small rocket model, with a robot prototype in the workshop behind them.', caption: 'Rockets, robots, the future. He understands—and brings ideas of his own.' },
      { motion: 'still', src: 'assets/story-07-reveal-1440.webp', fallback: 'assets/story-07-reveal-1440.jpg', alt: 'The double opens a small panel on his wrist to reveal a delicate metal frame; Elon reacts in astonishment.', caption: 'THE MAN: I’m Robot-Elon. SuperIntelligence created me.' },
      { motion: 'rise', src: 'assets/story-08-handshake-1440.webp', fallback: 'assets/story-08-handshake-1440.jpg', alt: 'Elon and SI-Elon shake hands warmly, with the robot double’s mechanical wrist visible beside their clasped hands.', caption: 'SI-ELON: I’d like to work with you.\nELON: Then let’s work together.' },
      { motion: 'scale', src: 'assets/story-09-dance-1440.webp', fallback: 'assets/story-09-dance-1440.jpg', alt: 'The two Elons laugh and attempt a small awkward dance onstage while audience members hold up their phones.', caption: 'Two Elons walk onto the stage. SI-Elon tries a small dance move. Elon laughs and joins him.' },
      { motion: 'fade', src: 'assets/story-10-workshop-1440.webp', fallback: 'assets/story-10-workshop-1440.jpg', alt: 'Elon and SI-Elon walk into the workshop together, exchanging a smile as SI-Elon delivers the closing joke.', caption: 'SI-ELON: SI will create our story too. Hopefully, it fixes my dancing.' }
    ];
    const slideNodes = [];
    if (reel && !reel.childElementCount) {
      storySlides.forEach(item => {
        const figure = document.createElement('figure');
        figure.className = 'reel-slide';
        figure.dataset.motion = item.motion;
        const image = document.createElement('img');
        image.src = item.src;
        image.alt = item.alt;
        image.width = 1440;
        image.height = 1080;
        image.decoding = 'async';
        image.addEventListener('error', () => { image.src = item.fallback; }, { once: true });
        figure.append(image);
        if (item.caption) {
          const caption = document.createElement('figcaption');
          item.caption.split('\n').forEach(text => {
            const row = document.createElement('p');
            row.textContent = text;
            caption.append(row);
          });
          figure.append(caption);
        }
        reel.append(figure);
        slideNodes.push(figure);
      });
    }
    let cinematic = false;
    let cinematicDone = false;
    let cinematicFrame = 0;
    const pushDepart = depart => {
      reveal.dataset.cinematic = '1';
      reveal.dataset.cinematicDepart = depart.toFixed(4);
      document.dispatchEvent(new CustomEvent('sielon:cinematic', { detail: { depart } }));
    };
    const paintSlides = elapsed => {
      const span = reduce.matches ? 2200 : 4200;
      const exitAt = span * 0.74;
      reveal.classList.add('is-reel');
      slideNodes.forEach((slide, index) => {
        const local = elapsed - index * span;
        const active = local >= 0 && local < span;
        const last = index === slideNodes.length - 1 && local >= 0 && local < span + 700;
        slide.classList.toggle('is-enter', (active && local < exitAt) || last);
        slide.classList.toggle('is-exit', active && local >= exitAt && !last);
      });
      return elapsed < slideNodes.length * span + 500;
    };
    const finishCinematic = () => {
      if (cinematicFrame) cancelAnimationFrame(cinematicFrame);
      cinematicFrame = 0;
      cinematic = false;
      cinematicDone = true;
      document.documentElement.classList.remove('is-cinematic', 'is-encounter');
      reveal.classList.remove('is-reel');
      reveal.dataset.cinematic = '0';
      paintReveal(1, 0, 0, 0);
      pushDepart(0);
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
      const root = document.documentElement;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, reveal.offsetTop + reveal.offsetHeight - header));
    };
    const beginCinematic = () => {
      if (cinematic) return;
      cinematic = true;
      cinematicDone = true;
      paintReveal(1, 0, 0, 0);
      document.documentElement.classList.add('is-cinematic');
      const startedAt = performance.now();
      const charMs = reduce.matches ? 1 : 46;
      const typeStart = reduce.matches ? 460 : 2280;
      const typeDur = Math.max(1, line.length * charMs);
      const reelStart = typeStart + typeDur + (reduce.matches ? 200 : 700);
      const tick = now => {
        const t = now - startedAt;
        const depart = smooth(unit(t / (reduce.matches ? 320 : 1800)));
        const veil = smooth(unit((t - (reduce.matches ? 220 : 1300)) / (reduce.matches ? 240 : 720)));
        const type = t <= typeStart ? 0 : unit((t - typeStart) / typeDur);
        paintReveal(1, depart, veil, type);
        pushDepart(depart);
        const running = t < reelStart || paintSlides(t - reelStart);
        if (running) cinematicFrame = requestAnimationFrame(tick);
        else finishCinematic();
      };
      cinematicFrame = requestAnimationFrame(tick);
    };
    reveal.querySelector('[data-opening-next]')?.addEventListener('click', beginCinematic);
    const measureReveal = () => {
      if (cinematic) return;
      if (reduce.matches) {
        reveal.classList.remove('is-live');
        paintReveal(1, 0, 0, 0);
        document.documentElement.classList.remove('is-encounter');
        return;
      }
      reveal.classList.add('is-live');
      const header = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
      document.documentElement.style.setProperty('--header-h', header + 'px');
      const rect = reveal.getBoundingClientRect();
      const travel = Math.max(1, reveal.offsetHeight - (window.innerHeight - header));
      const scrolled = header - rect.top;
      const phase = mapOpening(scrolled, travel, window.innerWidth, window.innerHeight, header);
      if (phase.scene < 0.9) cinematicDone = false;
      if (!cinematicDone && phase.scene >= 0.98 && phase.after > 0.08) {
        beginCinematic();
        return;
      }
      paintReveal(phase.scene, 0, 0, 0);
    };
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let holdTop = !location.hash;
    const pinOpening = () => {
      if (!holdTop || location.hash) return;
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previous;
    };
    const releaseTop = () => {
      if (document.documentElement.classList.contains('intro-open')) return;
      holdTop = false;
    };
    addEventListener('wheel', releaseTop, { passive: true });
    addEventListener('touchstart', releaseTop, { passive: true });
    addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') releaseTop();
    });
    const until = performance.now() + 4000;
    const fightRestore = now => {
      if (!holdTop || now > until) return;
      if (window.scrollY !== 0) pinOpening();
      requestAnimationFrame(fightRestore);
    };
    pinOpening();
    requestAnimationFrame(fightRestore);
    addEventListener('pageshow', pinOpening);
    addEventListener('scroll', measureReveal, { passive: true });
    addEventListener('resize', measureReveal);
    reduce.addEventListener('change', measureReveal);
    measureReveal();
  }
  const inlineToken = window.matchMedia('(max-width: 767px), (pointer: coarse)');
  const address = typeof cfg.contractAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(cfg.contractAddress) ? cfg.contractAddress : null;
  const text = (selector, value) => document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  const url = value => {
    try { const parsed = new URL(value); return parsed.protocol === 'https:' ? parsed.href : null; }
    catch { return null; }
  };
  text('[data-token-name]', cfg.name || 'SuperIntelligence Elon');
  text('[data-token-ticker]', cfg.ticker || '$SIELON');
  text('[data-token-network]', cfg.network || 'Ethereum mainnet');
  text('[data-contract]', address || 'To be announced');
  document.querySelectorAll('[data-copy-contract]').forEach(button => {
    button.disabled = !address;
    if (button.dataset.copyLabel === 'ca') button.textContent = address ? 'Copy CA' : 'CA pending';
    if (!address) button.setAttribute('aria-label', 'Contract address pending');
  });
  document.querySelectorAll('[data-etherscan]').forEach(link => {
    if (address) { link.href = 'https://etherscan.io/token/' + address; link.hidden = false; }
    else link.hidden = true;
  });
  const optional = { totalSupply: 'Supply', buyTax: 'Buy tax', sellTax: 'Sell tax', lpStatus: 'LP status', ownershipStatus: 'Ownership' };
  document.querySelectorAll('[data-optional-facts]').forEach(list => {
    Object.entries(optional).forEach(([key, label]) => {
      if (cfg[key] === null || cfg[key] === undefined || cfg[key] === '') return;
      const dt = document.createElement('dt'); const dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = typeof cfg[key] === 'number' && (key === 'buyTax' || key === 'sellTax') ? cfg[key] + '%' : String(cfg[key]); list.append(dt, dd);
    });
  });
  document.querySelectorAll('[data-social]').forEach(link => {
    const key = link.dataset.social; const destination = url(cfg.links?.[key]);
    if (destination) {
      link.href = destination; link.hidden = false; link.removeAttribute('aria-disabled'); link.setAttribute('target', '_blank'); link.setAttribute('rel', 'noopener noreferrer');
      link.textContent = key === 'telegram' ? 'Telegram' : 'X';
    } else {
      link.hidden = false; link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true');
      link.textContent = (key === 'telegram' ? 'Telegram' : 'X') + ' — coming soon';
    }
  });
  document.querySelectorAll('[data-hero-social]').forEach(link => {
    const key = link.dataset.heroSocial; const destination = url(cfg.links?.[key]);
    if (!destination) { link.hidden = true; link.removeAttribute('href'); return; }
    link.hidden = false; link.href = destination; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = key === 'telegram' ? 'Telegram' : 'X';
  });
  document.querySelectorAll('[data-trading]').forEach(link => {
    const destination = url(cfg.links?.[link.dataset.trading]);
    link.hidden = !destination;
    if (destination) { link.href = destination; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  });
  document.querySelectorAll('[data-copy-contract]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!address) return;
      const feedback = button.closest('section, dialog, .opening-controls')?.querySelector('[data-copy-feedback]');
      try { await navigator.clipboard.writeText(address); if (feedback) feedback.textContent = 'Contract address copied.'; }
      catch { if (feedback) feedback.textContent = 'Select and copy the address displayed above.'; }
    });
  });
  const dialog = document.getElementById('token-dialog');
  const tokenSection = document.getElementById('token');
  let tokenOpener = null;
  if (dialog && tokenSection) {
    document.querySelectorAll('[data-open-token]').forEach(trigger => {
      trigger.addEventListener('click', event => {
        if (inlineToken.matches || typeof dialog.showModal !== 'function') {
          if (trigger.tagName !== 'A') tokenSection.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
          return;
        }
        event.preventDefault();
        tokenOpener = trigger;
        try {
          if (!dialog.open) dialog.showModal();
          document.dispatchEvent(new CustomEvent('sielon:modal', { detail: { open: true } }));
        }
        catch { tokenSection.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' }); }
      });
    });
    dialog.querySelector('[data-close-token]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.dispatchEvent(new CustomEvent('sielon:modal', { detail: { open: false } }));
      if (tokenOpener) tokenOpener.focus();
    });
  }
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.hero-stage');
  const copy = document.querySelector('.hero-copy');
  const tiltLimit = Math.min(5, Number(motion.desktopTiltDegrees) || 5);
  const clampCopy = () => {
    if (!copy) return;
    if (reduce.matches || !desktop.matches) { copy.style.setProperty('--copy-x', '0px'); return; }
    const margin = 24;
    for (let pass = 0; pass < 4; pass++) {
      const boxes = [copy, ...copy.querySelectorAll('h1, p, .hero-actions, .button, .scroll-cue')];
      let left = Infinity; let right = -Infinity;
      boxes.forEach(node => {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        left = Math.min(left, rect.left); right = Math.max(right, rect.right);
      });
      if (!Number.isFinite(left)) return;
      let shift = parseFloat(copy.style.getPropertyValue('--copy-x')) || 0;
      if (left < margin) shift += margin - left;
      if (right > window.innerWidth - margin) shift -= right - (window.innerWidth - margin);
      copy.style.setProperty('--copy-x', shift.toFixed(2) + 'px');
      if (left >= margin - 0.5 && right <= window.innerWidth - margin + 0.5) break;
    }
  };
  if (hero && stage) {
    stage.style.setProperty('--title-depth', (motion.desktopTitleDepthPx || 48) + 'px');
    hero.addEventListener('pointermove', event => {
      if (!hero.getClientRects().length || hero.closest('[data-field-stage]')) return;
      if (reduce.matches || !desktop.matches || event.pointerType === 'touch') return;
      const rect = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      stage.style.setProperty('--tilt-x', (-y * tiltLimit * .55) + 'deg');
      stage.style.setProperty('--tilt-y', (x * tiltLimit) + 'deg');
      clampCopy();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      stage.style.setProperty('--tilt-x', '0deg');
      stage.style.setProperty('--tilt-y', '0deg');
      if (copy) copy.style.setProperty('--copy-x', '0px');
      clampCopy();
    });
  }
  const scenes = Array.from(document.querySelectorAll('.scene, .film'));
  const active = new Set();
  const close = document.querySelector('.closing-title');
  const closing = document.querySelector('.closing');
  let scheduled = false;
  const headerHeight = () => Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height || 68);
  const pin = () => {
    const header = headerHeight();
    const clearance = 20;
    const available = window.innerHeight - header - clearance;
    scenes.forEach(scene => {
      if (!scene.getClientRects().length) { scene.classList.remove('can-pin'); return; }
      const frame = scene.querySelector('.scene-frame, .film-hold');
      const photo = scene.querySelector('.scene-photo, .film-photo img');
      const eligible = scene.dataset.key === 'true' && desktop.matches && !reduce.matches;
      scene.style.setProperty('--pin-top', header + 'px');
      if (!eligible || !frame || !photo) {
        if (frame) frame.style.removeProperty('--frame-width');
        scene.classList.remove('can-pin');
        return;
      }
      const lane = scene.clientWidth || 1080;
      const ratio = photo.naturalWidth > 0 && photo.naturalHeight > 0 ? photo.naturalWidth / photo.naturalHeight : 4 / 3;
      const naturalHeight = lane / ratio;
      const fitted = naturalHeight > available ? Math.max(320, available * ratio) : lane;
      frame.style.setProperty('--frame-width', fitted.toFixed(1) + 'px');
      const frameHeight = frame.getBoundingClientRect().height;
      const caption = frame.querySelector('.scene-caption, .film-caption');
      const captionHeight = caption ? caption.getBoundingClientRect().height : 0;
      const fits = frameHeight > 80 && frameHeight <= available + 1 && captionHeight + 8 < frameHeight;
      scene.classList.toggle('can-pin', fits);
      if (!fits) frame.style.removeProperty('--frame-width');
    });
  };
  const paint = () => {
    scheduled = false;
    if (reduce.matches || !desktop.matches) return;
    const driftLimit = motion.desktopSceneDriftPx || 12;
    const revealCap = Math.min(1.035, Number(motion.revealMaxScale) || 1.035);
    active.forEach(scene => {
      if (!scene.getClientRects().length || scene.classList.contains('film') || scene.querySelector('[data-film-depth]')) return;
      const rect = scene.getBoundingClientRect();
      const fraction = Math.max(-1, Math.min(1, (innerHeight * .5 - (rect.top + rect.height * .5)) / innerHeight));
      const photo = scene.querySelector('.scene-photo');
      if (!photo) return;
      photo.style.setProperty('--drift', (fraction * driftLimit) + 'px');
      if (scene.id === 'reveal') photo.style.setProperty('--scene-scale', String(1 + Math.min(1, Math.max(0, fraction + .5)) * (revealCap - 1)));
    });
    if (close) close.style.setProperty('--closing-angle', '0deg');
  };
  const requestPaint = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(paint); } };
  if ('IntersectionObserver' in window) {
    document.body.classList.toggle('motion-ready', desktop.matches && !reduce.matches);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { active.add(entry.target); entry.target.classList.add('is-visible'); } else active.delete(entry.target); }); requestPaint();
    }, { rootMargin: '120px 0px' });
    scenes.forEach(scene => observer.observe(scene));
    const beats = Array.from(document.querySelectorAll('.film, .story .scene, .intertitle, .story-lede'));
    const arrivals = {
      lede: { sy: '18px', grow: '0.992', ly: '-8px' },
      intertitle: { sy: '12px', ly: '-8px' },
      interview: { sy: '28px', grow: '0.986', ly: '-14px' },
      comparison: { sx: '-28px', sy: '0px', lx: '14px', ly: '-10px' },
      meeting: { sy: '20px', grow: '0.99', ly: '-16px' },
      'reaction-01': { sx: '-26px', sy: '8px', lx: '-8px', ly: '-12px' },
      'reaction-02': { sx: '26px', sy: '8px', lx: '8px', ly: '-12px' },
      breakfast: { sy: '22px', grow: '0.988', ly: '-12px' },
      gaming: { sy: '26px', grow: '0.988', ly: '-12px' },
      ideas: { sx: '18px', sy: '10px', ly: '-14px' },
      reveal: { sy: '12px', grow: '0.994', ly: '-8px' },
      handshake: { sy: '20px', ly: '-12px' },
      dance: { sy: '16px', grow: '0.986', ly: '-10px' },
      'reaction-03': { sx: '24px', sy: '6px', lx: '8px', ly: '-12px' },
      workshop: { sy: '16px', ly: '-6px' }
    };
    const beatKey = el => {
      const kind = Array.from(el.classList).find(name => name.startsWith('film--') || name.startsWith('scene--'));
      if (kind) return kind.slice(kind.indexOf('--') + 2);
      if (el.classList.contains('intertitle')) return 'intertitle';
      if (el.classList.contains('story-lede')) return 'lede';
      return '';
    };
    beats.forEach(el => {
      const profile = arrivals[beatKey(el)];
      if (!profile) return;
      Object.entries(profile).forEach(([key, value]) => el.style.setProperty('--' + key, value));
    });
    const ease = t => t * t * (3 - 2 * t);
    let beatScheduled = false;
    const paintBeats = () => {
      beatScheduled = false;
      const allow = !reduce.matches;
      document.documentElement.classList.toggle('story-motion', allow);
      if (!allow) return;
      const view = window.innerHeight || 1;
      const header = headerHeight();
      beats.forEach(el => {
        if (!el.getClientRects().length) {
          el.style.setProperty('--in', '1');
          el.style.setProperty('--out', '1');
          return;
        }
        const rect = el.getBoundingClientRect();
        const key = beatKey(el);
        const enterSpan = view * (key === 'reveal' ? 0.62 : key === 'intertitle' ? 0.28 : 0.46);
        const leaveSpan = view * (key === 'workshop' || key === 'reveal' ? 0.42 : 0.34);
        const enter = ease(Math.max(0, Math.min(1, (view - rect.top) / enterSpan)));
        const leave = ease(Math.max(0, Math.min(1, (rect.bottom - header) / leaveSpan)));
        el.style.setProperty('--in', enter.toFixed(4));
        el.style.setProperty('--out', leave.toFixed(4));
      });
    };
    const requestBeats = () => { if (!beatScheduled) { beatScheduled = true; requestAnimationFrame(paintBeats); } };
    addEventListener('scroll', requestBeats, { passive: true });
    addEventListener('resize', requestBeats);
    reduce.addEventListener('change', requestBeats);
    paintBeats();
    if (closing) {
      const closingObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) closing.classList.add('is-visible'); }); }, { threshold: .05 });
      closingObserver.observe(closing);
    }
  }
  const wrapLines = (context, line, maxWidth) => {
    const words = line.split(/\s+/);
    const lines = [];
    let current = '';
    words.forEach(word => {
      const next = current ? current + ' ' + word : word;
      if (context.measureText(next).width > maxWidth && current) { lines.push(current); current = word; }
      else current = next;
    });
    if (current) lines.push(current);
    return lines;
  };
  const renderMeme = async (source, quote) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 1200;
    const context = canvas.getContext('2d');
    context.fillStyle = '#050a11';
    context.fillRect(0, 0, 1200, 1200);
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, 1200, 900);
    const fade = context.createLinearGradient(0, 860, 0, 960);
    fade.addColorStop(0, 'rgba(5,10,17,0)');
    fade.addColorStop(1, '#050a11');
    context.fillStyle = fade;
    context.fillRect(0, 860, 1200, 100);
    context.fillStyle = '#050a11';
    context.fillRect(0, 960, 1200, 240);
    context.textAlign = 'center';
    context.textBaseline = 'top';
    let quoteSize = 40;
    let lines = [];
    do {
      context.font = '600 ' + quoteSize + 'px Arial, Helvetica, sans-serif';
      lines = wrapLines(context, quote, 1040);
      quoteSize -= 2;
    } while (lines.length > 3 && quoteSize > 28);
    const nameSize = 28; const tickerSize = 26; const noteSize = 16;
    const block = lines.length * (quoteSize + 16) + 18 + nameSize + 14 + tickerSize + 16 + noteSize;
    let y = 900 + Math.max(24, (300 - block) / 2);
    context.fillStyle = '#f5f7fb';
    context.font = '600 ' + (quoteSize + 2) + 'px Arial, Helvetica, sans-serif';
    lines.forEach(line => { context.fillText(line, 600, y); y += quoteSize + 16; });
    y += 8;
    context.font = '700 ' + nameSize + 'px Arial, Helvetica, sans-serif';
    context.fillText('SuperIntelligence Elon', 600, y); y += nameSize + 14;
    context.fillStyle = '#69d4ff';
    context.font = '700 ' + tickerSize + 'px Arial, Helvetica, sans-serif';
    context.fillText('$SIELON', 600, y); y += tickerSize + 16;
    context.fillStyle = '#bdc8d6';
    context.font = noteSize + 'px Arial, Helvetica, sans-serif';
    context.fillText('Fictional story. No affiliation with Elon Musk.', 600, y);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) throw new Error('Image export failed');
    return blob;
  };
  document.querySelectorAll('[data-meme-download]').forEach(button => {
    button.addEventListener('click', async () => {
      const card = button.closest('.meme-card');
      const status = card?.querySelector('[data-meme-status]');
      const quote = card?.querySelector('.meme-caption')?.textContent?.trim();
      if (!quote) return;
      button.disabled = true;
      try {
        const blob = await renderMeme(button.dataset.memeSrc, quote);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = button.dataset.memeFile || 'sielon-meme.jpg';
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        if (status) status.textContent = 'Meme downloaded.';
      } catch {
        if (status) status.textContent = 'The meme could not be prepared. Try again.';
      } finally { button.disabled = false; }
    });
  });
  document.querySelectorAll('[data-meme-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const card = button.closest('.meme-card');
      const status = card?.querySelector('[data-meme-status]');
      const quote = card?.querySelector('.meme-caption')?.textContent?.trim();
      if (!quote) return;
      try { await navigator.clipboard.writeText(quote); if (status) status.textContent = 'Caption copied.'; }
      catch { if (status) status.textContent = 'Select the caption above and copy it.'; }
    });
  });
  const syncHeader = () => {
    const height = Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height || 68);
    document.documentElement.style.setProperty('--header-h', height + 'px');
  };
  const wristOpen = document.querySelector('[data-wrist-open]');
  const wristDetail = document.getElementById('wrist-detail');
  const wristCapable = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
  const webglLikely = () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch { return false; }
  };
  const closeWrist = () => {
    if (!wristDetail || wristDetail.hidden) return;
    wristDetail.hidden = true;
    wristOpen?.setAttribute('aria-expanded', 'false');
    document.dispatchEvent(new CustomEvent('sielon:field-open'));
    if (wristOpen && !wristOpen.hidden) wristOpen.focus();
  };
  const syncWrist = () => {
    if (!wristOpen) return;
    const show = wristCapable.matches && !reduce.matches && webglLikely();
    wristOpen.hidden = !show;
    if (!show) closeWrist();
  };
  if (wristOpen && wristDetail) {
    wristOpen.addEventListener('click', () => {
      wristDetail.hidden = false;
      wristOpen.setAttribute('aria-expanded', 'true');
      document.dispatchEvent(new CustomEvent('sielon:field-open'));
      wristDetail.focus();
    });
    wristDetail.querySelector('[data-wrist-close]')?.addEventListener('click', closeWrist);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || wristDetail.hidden || dialog?.open) return;
      event.preventDefault();
      closeWrist();
    });
    wristCapable.addEventListener('change', syncWrist);
    reduce.addEventListener('change', syncWrist);
    syncWrist();
  }
  addEventListener('scroll', requestPaint, { passive: true });
  addEventListener('resize', () => { syncHeader(); pin(); clampCopy(); requestPaint(); }, { passive: true });
  const reset = () => {
    document.body.classList.toggle('motion-ready', desktop.matches && !reduce.matches && 'IntersectionObserver' in window);
    scenes.forEach(scene => {
      const photo = scene.querySelector('.scene-photo');
      if (!photo) return;
      photo.style.setProperty('--drift', '0px'); photo.style.setProperty('--scene-scale', '1');
    });
    if (stage) { stage.style.setProperty('--tilt-x', '0deg'); stage.style.setProperty('--tilt-y', '0deg'); }
    if (copy) copy.style.setProperty('--copy-x', '0px');
    if (close) close.style.setProperty('--closing-angle', '0deg');
    syncHeader(); pin(); clampCopy(); requestPaint();
  };
  reduce.addEventListener('change', reset); desktop.addEventListener('change', reset);
  document.querySelectorAll('.scene-photo, .film-photo img').forEach(image => {
    if (image.complete) pin();
    else image.addEventListener('load', pin, { once: true });
  });
  syncHeader(); pin(); clampCopy(); requestPaint();
})();
