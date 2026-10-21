(function () {
  'use strict';

  const WEDDING_DATE = new Date('2027-01-09T17:00:00+07:00');
  const CEREMONY = {
    title: 'Hoang & Nhi Wedding',
    location: 'Château de Belvent, Gevrey-Chambertin, France',
    mapsUrl: 'https://maps.google.com/?q=Château+de+Belvent+Gevrey-Chambertin',
    start: '20270109T150000',
    end: '20270109T230000',
  };
  const RECOVERY = {
    title: 'Hoang & Nhi Recovery Day',
    location: 'Le Comptoir des Halles, 4 Rue Monge, Beaune, France',
    mapsUrl: 'https://maps.google.com/?q=Le+Comptoir+des+Halles+Beaune',
    start: '20270613T120000',
    end: '20270613T180000',
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

  function initIntroVideo() {
    const video = document.getElementById('intro-video');
    const introText = document.getElementById('intro-text');
    if (!video) return;

    video.muted = true;
    video.loop = false;

    let introTextShown = false;

    function showIntroText() {
      if (introTextShown || !introText) return;
      introTextShown = true;
      introText.classList.add('visible');
    }

    video.addEventListener('timeupdate', () => {
      if (video.duration && video.currentTime >= video.duration - 3) {
        showIntroText();
      }
    });

    video.addEventListener('ended', () => {
      showIntroText();
      slowScrollToEnd();
    });

    function slowScrollToEnd() {
      setTimeout(() => {
        const html = document.documentElement;
        const savedScrollBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';

        const duration = 100000;
        const startTime = performance.now();
        let lastTime = startTime;
        let rafId = null;

        function stopScroll() {
          if (rafId) cancelAnimationFrame(rafId);
          html.style.scrollBehavior = savedScrollBehavior;
          window.removeEventListener('wheel', stopScroll);
          window.removeEventListener('touchstart', stopScroll);
        }

        function step(now) {
          const maxY = html.scrollHeight - window.innerHeight;
          const elapsed = now - startTime;
          const timeLeft = Math.max(duration - elapsed, 1);
          const delta = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;

          if (elapsed >= duration || window.scrollY >= maxY - 1) {
            window.scrollTo(0, maxY);
            stopScroll();
            return;
          }

          const remaining = maxY - window.scrollY;
          const stepSize = remaining * (delta / (timeLeft / 1000));
          window.scrollTo(0, Math.min(window.scrollY + stepSize, maxY));
          rafId = requestAnimationFrame(step);
        }

        window.addEventListener('wheel', stopScroll, { passive: true });
        window.addEventListener('touchstart', stopScroll, { passive: true });
        rafId = requestAnimationFrame(step);
      }, 600);
    }

    const play = () => video.play().catch(() => {});
    play();
    document.addEventListener('click', play, { once: true });
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

  function initRsvpForm() {
    const form = document.getElementById('rsvp-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const honeypot = form.querySelector('#website');
      if (honeypot && honeypot.value.trim()) return;

      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());

      if (!payload.fullName || !payload.attending) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      console.log('RSVP submitted:', payload);
      showToast('Thank you! Your RSVP has been received.', 'success');
      form.reset();
    });
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
  initRevealAnimations();
  initTimelinePearl();
  initGarlandSway();
  initIntroVideo();
  initActionLinks();
  initRsvpForm();
})();
