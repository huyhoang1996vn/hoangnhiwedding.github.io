(function () {
  'use strict';

  const RSVP_API_URL = '/rsvp';
  const WEDDING_DATE = new Date('2026-12-01T17:00:00+07:00');
  const CEREMONY = {
    title: 'Hoang & Nhi Wedding',
    location: 'Da Nang Mikazuki Japanese Resorts & Spa, Da Nang, Vietnam',
    mapsUrl: 'https://maps.app.goo.gl/o9Bp73GJnEgeGNbu8',
    start: '20261201T150000',
    end: '20261201T230000',
  };
  const RECOVERY = {
    title: 'Hoang & Nhi Wedding',
    location: 'Da Nang Mikazuki Japanese Resorts & Spa, Da Nang, Vietnam',
    mapsUrl: 'https://maps.app.goo.gl/fv3Djuvnqcbd2Cs29',
    start: '20261201T150000',
    end: '20261201T230000',
  };

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = Math.max(0, WEDDING_DATE.getTime() - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    if (daysEl) daysEl.textContent = days;
    if (hoursEl) hoursEl.textContent = hours;
    if (minutesEl) minutesEl.textContent = minutes;
  }

  function initRevealAnimations() {
    const items = document.querySelectorAll('.reveal, .reveal-scale');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }

  function initTimelinePearl() {
    const pearl = document.getElementById('timeline-pearl');
    const timeline = document.getElementById('day-program');
    if (!pearl || !timeline) return;

    function onScroll() {
      const rect = timeline.getBoundingClientRect();
      const start = window.innerHeight * 0.2;
      const end = rect.height - window.innerHeight * 0.3;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / end));
      pearl.style.top = `${progress * 100}%`;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initGarlandSway() {
    const garland = document.getElementById('garland');
    if (!garland) return;

    let angle = 0;
    function animate() {
      angle = Math.sin(Date.now() / 2800) * 0.35;
      garland.style.transform = `rotate(${angle}deg)`;
      requestAnimationFrame(animate);
    }
    animate();
  }

  let startBgMusic = null;

  function initIntroVideo() {
    const section = document.getElementById('intro-section');
    const video = document.getElementById('intro-video');
    const introText = document.getElementById('intro-text');
    const playHint = document.getElementById('intro-play-hint');
    if (!video || !section) return;

    video.muted = true;
    video.loop = false;

    let started = false;
    let introTextShown = false;

    function showIntroText() {
      if (introTextShown || !introText) return;
      introTextShown = true;
      introText.classList.add('visible');
    }

    video.addEventListener('timeupdate', () => {
      // Time to show intro text
      if (video.duration && video.currentTime >= video.duration - 4) {
        showIntroText();
      }
    });

    video.addEventListener('ended', () => {
      showIntroText();
      slowScrollToEnd();
    });

    function slowScrollToEnd() {
      const SECTION_PAUSE_MS = 2000;
      const SECTION_SELECTORS = [
        '#hero-invitation',
        '#countdown',
        // '#welcome',
        '#wedding-events',
        '#dress-code',
        '#our-story',
        '#day-program',
        '#recovery-day',
        '#gifts',
        '#rsvp',
        'footer',
      ];

      setTimeout(() => {
        const html = document.documentElement;
        const body = document.body;
        const savedScrollBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';

        // Lock scroll metrics once. On phones, browser chrome show/hide
        // changes innerHeight mid-scroll and makes maxY jump (shake).
        const viewportH =
          (window.visualViewport && window.visualViewport.height) ||
          html.clientHeight ||
          window.innerHeight;
        const maxY = Math.max(0, Math.floor(html.scrollHeight - viewportH));
        const startY = window.scrollY || html.scrollTop || 0;
        const distance = Math.max(0, maxY - startY);

        function currentScrollY() {
          return window.scrollY || html.scrollTop || 0;
        }

        function currentMaxY() {
          const vh =
            (window.visualViewport && window.visualViewport.height) ||
            html.clientHeight ||
            window.innerHeight;
          return Math.max(0, Math.floor(html.scrollHeight - vh));
        }

        function visibleOffset() {
          return (window.visualViewport && window.visualViewport.offsetTop) || 0;
        }

        function documentY(node) {
          return node.getBoundingClientRect().top + currentScrollY();
        }

        // Only these have large top padding / divider art; others snap to section top.
        const CONTENT_SNAP_IDS = new Set([
          'our-story',
          'day-program',
          'recovery-day',
          'gifts',
          'rsvp',
        ]);

        function snapYForSection(el) {
          if (!CONTENT_SNAP_IDS.has(el.id)) {
            return Math.round(documentY(el) - visibleOffset());
          }

          const heading = el.querySelector('h2');
          const firstImg = el.querySelector('img');
          let anchor = heading;
          if ((el.id === 'gifts' || el.id === 'rsvp') && firstImg) {
            anchor = firstImg;
          }
          if (!anchor) {
            const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
            return Math.round(documentY(el) + pad - visibleOffset());
          }
          return Math.round(documentY(anchor) - visibleOffset());
        }

        const sectionTargets = SECTION_SELECTORS.map((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          return { el, top: snapYForSection(el) };
        }).filter(Boolean);
        const paused = new Set();
        sectionTargets.forEach((item) => {
          if (item.top <= startY + 1) paused.add(item.el);
        });

        const duration = 60000;
        let crawlElapsed = 0;
        let lastTime = performance.now();
        let rafId = null;
        let pausing = false;
        let pauseUntil = 0;
        let scrollPos = startY;
        let lastApplied = -1;

        function stopScroll() {
          if (rafId) cancelAnimationFrame(rafId);
          html.style.scrollBehavior = savedScrollBehavior;
          window.removeEventListener('wheel', stopScroll);
          window.removeEventListener('touchstart', stopScroll);
        }

        function applyScroll(y) {
          const top = Math.round(Math.min(Math.max(y, 0), Math.max(maxY, currentMaxY())));
          scrollPos = top;
          if (top === lastApplied) return;
          lastApplied = top;
          html.scrollTop = top;
          if (body) body.scrollTop = top;
          window.scrollTo(0, top);
        }

        function tryPauseAtSection() {
          for (const item of sectionTargets) {
            if (paused.has(item.el)) continue;
            item.top = snapYForSection(item.el);
            if (scrollPos >= item.top) {
              paused.add(item.el);
              applyScroll(item.top);
              pausing = true;
              pauseUntil = performance.now() + SECTION_PAUSE_MS;
              return;
            }
          }
        }

        function step(now) {
          if (pausing) {
            if (now < pauseUntil) {
              rafId = requestAnimationFrame(step);
              return;
            }
            pausing = false;
            lastTime = now;
          }

          const deltaMs = Math.min(now - lastTime, 50);
          lastTime = now;
          crawlElapsed += deltaMs;

          if (crawlElapsed >= duration || scrollPos >= maxY - 0.5) {
            applyScroll(maxY);
            tryPauseAtSection();
            if (pausing && now < pauseUntil) {
              rafId = requestAnimationFrame(step);
              return;
            }
            stopScroll();
            return;
          }

          // Constant-speed scroll from locked start/end (avoids remaining-distance jitter)
          const t = crawlElapsed / duration;
          applyScroll(startY + distance * t);

          tryPauseAtSection();
          rafId = requestAnimationFrame(step);
        }

        window.addEventListener('wheel', stopScroll, { passive: true });
        window.addEventListener('touchstart', stopScroll, { passive: true });
        rafId = requestAnimationFrame(step);
      }, 600);
    }

    function startExperience() {
      if (started) return;
      started = true;
      section.classList.add('started');
      playHint?.classList.add('is-hidden');
      video.play().catch(() => {});
      startBgMusic?.();
    }

    section.addEventListener('click', startExperience);
  }

  function buildCalendarUrl(event) {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${event.start}/${event.end}`,
      location: event.location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function downloadIcs(event, filename) {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wedding Site//EN',
      'BEGIN:VEVENT',
      `DTSTART:${event.start}`,
      `DTEND:${event.end}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function initActionLinks() {
    document.querySelectorAll('[data-maps]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-maps');
        const event = key === 'recovery' ? RECOVERY : CEREMONY;
        window.open(event.mapsUrl, '_blank', 'noopener,noreferrer');
      });
    });

    document.querySelectorAll('[data-calendar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-calendar');
        const event = key === 'recovery' ? RECOVERY : CEREMONY;
        const filename = key === 'recovery' ? 'recovery-day.ics' : 'wedding-day.ics';
        if (window.confirm('Add to Google Calendar in browser, or download .ics file?\n\nOK = Google Calendar\nCancel = Download .ics')) {
          window.open(buildCalendarUrl(event), '_blank', 'noopener,noreferrer');
        } else {
          downloadIcs(event, filename);
        }
      });
    });
  }

  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type || 'success'}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function initBackgroundMusic() {
    const audio = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    if (!audio || !btn) return;

    let userMuted = false;

    function updateButton() {
      btn.classList.toggle('is-muted', userMuted);
      btn.setAttribute('aria-pressed', String(!userMuted));
      btn.setAttribute(
        'aria-label',
        userMuted ? 'Play background music' : 'Mute background music'
      );
    }

    startBgMusic = function () {
      if (userMuted) return;
      audio.play().catch(() => {});
    };

    updateButton();

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (userMuted) {
        userMuted = false;
        updateButton();
        startBgMusic();
      } else {
        userMuted = true;
        audio.pause();
        updateButton();
      }
    });
  }

  function initRsvpForm() {
    const form = document.getElementById('rsvp-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const fullName = String(data.get('fullName') || '').trim();
      const attendees = Number(data.get('attendees'));
      const message = String(data.get('message') || '').trim();
      const website = String(data.get('website') || '');

      if (!fullName || !Number.isInteger(attendees) || attendees < 1 || attendees > 20) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;

      try {
        const response = await fetch(RSVP_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            attendees,
            message: message || null,
            website,
          }),
        });

        if (!response.ok) {
          showToast('Something went wrong. Please try again.', 'error');
          return;
        }

        showToast('Thank you! Your RSVP has been received.', 'success');
        form.reset();
        const attendeesInput = form.querySelector('#attendees');
        if (attendeesInput) attendeesInput.value = '1';
      } catch (err) {
        showToast('Something went wrong. Please try again.', 'error');
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  initRsvpForm();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  initRevealAnimations();
  initTimelinePearl();
  initGarlandSway();
  initBackgroundMusic();
  initIntroVideo(); // uses startBgMusic from initBackgroundMusic
  initActionLinks();
})();
