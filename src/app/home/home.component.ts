import { Component, AfterViewInit, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface ScatterEl {
  el: HTMLElement;
  tx: number; // target X offset (scattered position)
  ty: number;
  tz: number; // target Z depth offset
  tr: number; // target rotation
  ts: number; // target scale
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private rafId = 0;
  private listeners: Array<{ t: EventTarget; e: string; h: EventListenerOrEventListenerObject; o?: AddEventListenerOptions }> = [];

  galleries = [{
    title: 'Photography & Visuals',
    photos: [
      { url: 'https://imgur.com/fc3mYxP.jpg', title: 'Moody Skies', category: 'Photography / Landscape' },
      { url: 'https://imgur.com/wBKAkPZ.jpg', title: 'Verdant Fields', category: 'Nature / Greenery' },
      { url: 'https://imgur.com/ra3wS0Z.jpg', title: 'Urban Explorations', category: 'Street / Architectural' },
      { url: 'https://imgur.com/l9bGiOX.jpg', title: 'Silent Forest', category: 'Nature / Wildlife' },
      { url: 'https://imgur.com/8OS5Dwg.jpg', title: 'Warm Solitude', category: 'Visual Art / Conceptual' },
      { url: 'https://imgur.com/Xr7Mzav.jpg', title: 'Emerald Meadows', category: 'Landscape / Outdoor' },
      { url: 'https://imgur.com/0q7H1zB.jpg', title: 'Retro Nights', category: 'Street / Cinematography' },
      { url: 'https://imgur.com/P38eyA7.jpg', title: 'Group Assembly', category: 'Street / Editorial' },
      { url: 'https://imgur.com/dtq9fya.jpg', title: 'Quiet Corners', category: 'Street / Urban' },
      { url: 'https://imgur.com/wfop4XG.jpg', title: 'Summer Breeze', category: 'Nature / Sky' },
      { url: 'https://imgur.com/ZqMkeiK.jpg', title: 'Golden Hour', category: 'Landscape / Sun' },
      { url: 'https://imgur.com/biAXpSX.jpg', title: 'Rotiboy Bistro', category: 'Commercial / Street' },
      { url: 'https://imgur.com/TzG4Eww.jpg', title: 'Mist & Shadows', category: 'Atmospheric / Moody' },
      { url: 'https://imgur.com/qCSvfUK.jpg', title: 'Infinite Green', category: 'Nature / Landscape' }
    ]
  }];

  activePhotoIndex = 0;
  currentFormattedTime = '';
  currentFormattedDate = '';
  private clockIntervalId: any;

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.clockIntervalId) clearInterval(this.clockIntervalId);
      this.listeners.forEach(({ t, e, h, o }) => t.removeEventListener(e, h, o));
      document.querySelector('.particle-field')?.remove();
    }
  }

  private on(target: EventTarget, event: string, handler: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions) {
    target.addEventListener(event, handler, opts);
    this.listeners.push({ t: target, e: event, h: handler, o: opts });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initClock();
    this.initParticles();
    this.initTiltCards();
    this.initScrollEngine();
  }

  private initClock() {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      this.currentFormattedTime = `${hours}:${minutes} ${ampm} [WIB]`;
      
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      this.currentFormattedDate = now.toLocaleDateString('en-US', options).toUpperCase();
    };
    updateTime();
    this.clockIntervalId = setInterval(updateTime, 1000);
  }

  // ─── SCROLL ENGINE ──────────────────────────────────────────────
  private initScrollEngine() {
    let ticking = false;
    let lastScrollY = 0;

    // ── Cache DOM refs ──
    const progressBar     = document.getElementById('scroll-progress');
    const progressCircle  = document.getElementById('progress-circle');
    const backToTop       = document.getElementById('back-to-top');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const heroTextCol     = document.getElementById('hero-text-col');
    const heroPhotoCol    = document.getElementById('hero-photo-col');
    const heroDesc        = document.getElementById('hero-description');
    const parallaxBlobs   = document.querySelectorAll<HTMLElement>('.parallax-blob');
    const marquee1        = document.getElementById('marquee-1');
    const marquee2        = document.getElementById('marquee-2');

    // ── Scatter systems: each section has elements that scatter/assemble (all devices) ──
    let scatterGroups = this.buildScatterGroups();

    this.on(window, 'resize', () => {
      scatterGroups = this.buildScatterGroups();
      handleScroll();
    }, { passive: true });

    // ── Section hidden-until-visible (non-scatter sections like gallery) ──
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal-active'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-fade').forEach(el => revealObserver.observe(el));

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const velocity = scrollY - lastScrollY;
      lastScrollY = scrollY;
      const H = window.innerHeight;
      const docH = document.documentElement.scrollHeight - H;
      const pct = docH > 0 ? (scrollY / docH) * 100 : 0;

      // Progress bar
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressCircle) progressCircle.setAttribute('stroke-dashoffset', String(100 - pct));

      // Back-to-top
      if (backToTop) {
        const show = scrollY > 300;
        backToTop.classList.toggle('translate-y-20', !show);
        backToTop.classList.toggle('opacity-0', !show);
        backToTop.classList.toggle('pointer-events-none', !show);
      }

      // Scroll indicator fade
      if (scrollIndicator) {
        scrollIndicator.style.opacity = String(Math.max(0, 1 - scrollY / 250));
      }

      // ── HERO layout morphing (Side-by-side on desktop -> Centered stack) ──
      const isMobile = window.innerWidth < 768;
      // Pin range: 1.6x viewport height scroll distance on desktop, 1.0x on mobile
      const pinScrollLimit = isMobile ? H * 1.0 : H * 1.6;
      const scrollRatio = pinScrollLimit > 0 ? Math.min(1, scrollY / pinScrollLimit) : 0;

      // Morphing completes in the first 45% of the pinning range, remaining 55% is "hold/dwell" phase
      const morphLimit = 0.45;
      const rawProgress = Math.min(1, scrollRatio / morphLimit);
      
      // Apply smooth easeInOut for a ultra-fluid organic motion
      const progress = this.easeInOut(rawProgress);

      if (heroTextCol && heroPhotoCol) {
        const W = window.innerWidth;
        const rev = 1 - progress;

        if (isMobile) {
          // Reset styles on mobile to act as a standard non-animated layout flow
          heroPhotoCol.style.transform = '';
          heroTextCol.style.transform = '';
          heroTextCol.style.textAlign = '';
          heroTextCol.style.alignItems = '';
        } else {
          // Horizontal offsets (at scroll=0, photo is left, text is right)
          // We shift both columns slightly to the left to optimize visual balance on wide viewports.
          const baseOffset = Math.min(60, W * 0.04);
          const tx = (Math.min(240, W * 0.19) - baseOffset) * rev;
          const px = (-Math.min(290, W * 0.23) - baseOffset) * rev;

          // Vertical offsets to align their centers horizontally at scroll=0
          const ty = -Math.min(75, H * 0.08) * rev;
          const py = Math.min(165, H * 0.18) * rev; // Lowered photo vertical offset

          heroTextCol.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          heroPhotoCol.style.transform = `translate3d(${px}px, ${py}px, 0)`;

          // Align text dynamically based on morph progress
          if (progress > 0.4) {
            heroTextCol.style.textAlign = 'center';
            heroTextCol.style.alignItems = 'center';
          } else {
            heroTextCol.style.textAlign = 'left';
            heroTextCol.style.alignItems = 'flex-start';
          }
        }
      }

      // Description reveal logic
      if (heroDesc) {
        if (isMobile) {
          // Always fully visible on mobile
          heroDesc.style.opacity = '1';
          heroDesc.style.transform = '';
        } else {
          // Appears smoothly mapping to the morph progress (starts after 15% of morphing, fully visible by 90%)
          const descProgress = Math.max(0, Math.min(1, (rawProgress - 0.15) / 0.75));
          const easedDesc = this.easeInOut(descProgress);
          heroDesc.style.opacity = String(easedDesc);
          heroDesc.style.transform = `translate3d(0, ${(1 - easedDesc) * 20}px, 0)`;
        }
      }

      // ── Parallax and skew effects (all devices) ──
      parallaxBlobs.forEach(b => {
        const speed = parseFloat(b.dataset['speed'] || '0.1');
        b.style.transform = `translateY(${scrollY * speed}px)`;
      });

      const skew = Math.max(-3, Math.min(3, velocity * 0.15));
      if (marquee1) marquee1.style.transform = `skewY(${skew * 0.4}deg)`;
      if (marquee2) marquee2.style.transform = `skewY(${-skew * 0.4}deg)`;

      // ── Scatter / Assemble each section (all devices) ──
      scatterGroups.forEach(group => this.updateScatterGroup(group, H));

      // ── Project image inner parallax & text details parallax (all devices, responsive travel) ──
      const imgTravelDist = isMobile ? 35 : 55;
      const textTravelDist = isMobile ? 12 : 24;

      document.querySelectorAll<HTMLElement>('.img-parallax-inner').forEach(img => {
        const wrap = img.parentElement;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const rel = (rect.top / H - 0.5);
        img.style.setProperty('--parallax-y', `${-rel * imgTravelDist}px`);
      });

      document.querySelectorAll<HTMLElement>('.img-parallax-text').forEach(text => {
        const wrap = text.closest('.scatter-item');
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const rel = (rect.top / H - 0.5);
        text.style.transform = `translate3d(0, ${-rel * textTravelDist}px, 0)`;
      });

      // ── Space-Tech Projects Parallax (Selected Works) ──
      document.querySelectorAll<HTMLElement>('.project-parallax-item').forEach(item => {
        const parent = item.parentElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.bottom >= 0 && parentRect.top <= H) {
          const parentCenter = parentRect.top + parentRect.height / 2;
          const centerDiff = parentCenter - (H / 2);
          const speed = parseFloat(item.dataset['speed'] || '0');
          
          // Calculate entrance & exit opacity fade based on distance from viewport center
          const distFromCenter = Math.abs(centerDiff);
          const fadeStart = H * 0.35; // Fully visible within 35% of center
          const fadeEnd = H * 0.65;   // Fully faded out when beyond 65% of center
          
          let opacity = 1;
          if (distFromCenter > fadeStart) {
            const ratio = (distFromCenter - fadeStart) / (fadeEnd - fadeStart);
            opacity = Math.max(0, 1 - ratio);
          }
          
          item.style.opacity = String(opacity);
          
          if (speed !== 0) {
            // Apply a premium, noticeable parallax scroll travel
            const baseMultiplier = 3.5;
            const activeSpeed = isMobile ? speed * 0.3 * baseMultiplier : speed * baseMultiplier;
            const translateY = centerDiff * activeSpeed;
            
            // Subtle scale-up from 0.95 (far) to 1.0 (centered) matching the fade opacity
            const scale = 0.95 + 0.05 * opacity;
            item.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          } else {
            item.style.transform = `scale(${0.95 + 0.05 * opacity})`;
          }
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
        }
      });

      // ── Jordan Gilroy Pinned Slider activeIndex & Float Tracking (Gallery) ──
      const gallerySec = document.getElementById('visuals-gallery');
      if (gallerySec) {
        const rect = gallerySec.getBoundingClientRect();
        const totalScrollDist = rect.height - H;
        if (totalScrollDist > 0) {
          const progress = Math.max(0, Math.min(1, -rect.top / totalScrollDist));
          const photoCount = this.galleries[0].photos.length;
          
          // Calculate active index
          const activeIndex = Math.min(photoCount - 1, Math.floor(progress * photoCount));
          if (this.activePhotoIndex !== activeIndex) {
            this.activePhotoIndex = activeIndex;
          }

          // Desktop-only smooth inner photo floating scroll parallax (using high-performance CSS custom properties)
          if (!isMobile) {
            const indexProgress = (progress * photoCount) % 1.0;
            const yOffset = (indexProgress - 0.5) * -35;
            gallerySec.style.setProperty('--gallery-float-y', `${yOffset}px`);
          }
        }
      }

      // ── Connect/Contact Section Sticky Parallax Pinning (Desktop only) ──
      const contactWrapper = document.getElementById('contact-pin-wrapper');
      const contactSec = document.getElementById('contact');
      if (contactWrapper && contactSec) {
        if (isMobile) {
          // Reset styling on mobile
          contactSec.style.position = '';
          contactSec.style.top = '';
          contactSec.style.height = '';
          
          const header = contactSec.querySelector<HTMLElement>('.contact-header');
          if (header) {
            header.style.opacity = '';
            header.style.transform = '';
          }
          const card = contactSec.querySelector<HTMLElement>('.contact-card');
          if (card) {
            card.style.opacity = '';
            card.style.transform = '';
          }
          const buttons = contactSec.querySelectorAll<HTMLElement>('.contact-pill');
          buttons.forEach(btn => {
            btn.style.opacity = '';
            btn.style.transform = '';
          });
        } else {
          // Sticky/pin on desktop
          contactSec.style.position = 'sticky';
          contactSec.style.top = '0';
          contactSec.style.height = '100vh';

          const rect = contactWrapper.getBoundingClientRect();
          const totalDist = rect.height - H;
          if (totalDist > 0) {
            const pinRatio = Math.max(0, Math.min(1, -rect.top / totalDist));
            
            // Entry phase: 0.0 -> 0.3
            // Hold/Dwell phase: 0.3 -> 0.7
            // Exit phase: 0.7 -> 1.0
            let progress = 0;
            if (pinRatio < 0.3) {
              // Fade in
              progress = this.easeInOut(pinRatio / 0.3);
            } else if (pinRatio <= 0.7) {
              // Fully visible
              progress = 1.0;
            } else {
              // Fade out
              progress = this.easeInOut((1.0 - pinRatio) / 0.3);
            }

            // Apply animation progress
            // 1. Header
            const header = contactSec.querySelector<HTMLElement>('.contact-header');
            if (header) {
              header.style.opacity = String(progress);
              header.style.transform = `translate3d(0, ${(1 - progress) * -30}px, 0)`;
            }

            // 2. Glassmorphic Card
            const card = contactSec.querySelector<HTMLElement>('.contact-card');
            if (card) {
              card.style.opacity = String(progress);
              const scale = 0.92 + 0.08 * progress;
              const translateY = (1 - progress) * 50;
              card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
            }

            // 3. Staggered Social Buttons
            const buttons = contactSec.querySelectorAll<HTMLElement>('.contact-pill');
            buttons.forEach((btn, idx) => {
              const btnStagger = Math.max(0, Math.min(1, (progress - idx * 0.12) / 0.64));
              const btnProgress = this.easeOut(btnStagger);
              btn.style.opacity = String(btnProgress);
              btn.style.transform = `translate3d(0, ${(1 - btnProgress) * 25}px, 0)`;
            });
          }
        }
      }

      ticking = false;
    };

    this.on(window, 'scroll', () => {
      if (!ticking) { this.rafId = requestAnimationFrame(handleScroll); ticking = true; }
    }, { passive: true });

    handleScroll();

    // Mouse glow
    const glow = document.getElementById('cursor-glow');
    if (glow) {
      this.on(window, 'mousemove', (e: Event) => {
        const me = e as MouseEvent;
        glow.style.setProperty('--x', `${me.clientX}px`);
        glow.style.setProperty('--y', `${me.clientY}px`);
        glow.classList.replace('opacity-0', 'opacity-100');
      }, { passive: true });
      this.on(document, 'mouseleave', () => glow.classList.replace('opacity-100', 'opacity-0'));
    }
  }

  private buildScatterGroups() {
    const isMobile = window.innerWidth < 768;
    const mag    = isMobile ? 70 : 160;
    const rotMag = isMobile ? 25 : 60;

    type Group = { section: HTMLElement; items: ScatterEl[]; headerEl: HTMLElement | null };
    const groups: Group[] = [];

    // 'kodealab-section' is nested inside 'projects', so it's already processed there.
    const ids = ['expertise', 'stats-section', 'tech-stack', 'projects'];

    ids.forEach(id => {
      const section = document.getElementById(id) as HTMLElement | null;
      if (!section) return;

      const headerEl = section.querySelector<HTMLElement>('.section-header');
      const items: ScatterEl[] = [];

      const isStats = id === 'stats-section';
      const isTechStack = id === 'tech-stack';
      const isExpertise = id === 'expertise';
      const isProjects = id === 'projects';

      let sectionMag = mag; // mag is 160
      let sectionRotMag = rotMag; // rotMag is 60

      if (isStats) {
        sectionMag = isMobile ? 80 : 180;
        sectionRotMag = isMobile ? 40 : 90;
      } else if (isTechStack) {
        sectionMag = isMobile ? 160 : 380; // High-chaos magnitude restored
        sectionRotMag = isMobile ? 60 : 180; // High-chaos rotation restored
      } else if (isExpertise) {
        sectionMag = 350;
        sectionRotMag = 40;
      } else if (isProjects) {
        sectionMag = isMobile ? 60 : 120; // Refined magnitude for clean slide-up
        sectionRotMag = isMobile ? 8 : 12; // Refined rotation magnitude
      }

      section.querySelectorAll<HTMLElement>('.scatter-item').forEach((el, i) => {
        const angle = (i * 137.5) % 360;
        
        let distMult;
        if (isStats) {
          distMult = 0.6 + (i % 4) * 0.3;
        } else if (isTechStack) {
          distMult = 0.6 + (i % 6) * 0.35; // Wider distribution range restored
        } else if (isExpertise) {
          distMult = 0.8 + i * 0.3;
        } else if (isProjects) {
          distMult = 0.8 + i * 0.25; // Staggered offsets for cards
        } else {
          distMult = 0.4 + (i % 4) * 0.2;
        }
        
        const dist = sectionMag * distMult;
        // Project cards slide vertically only (no horizontal skew/overlapping on desktop)
        let tx = isProjects ? 0 : Math.cos(angle * Math.PI / 180) * dist;
        let ty = isProjects ? dist : Math.sin(angle * Math.PI / 180) * dist * (isStats ? 0.85 : (isTechStack ? 0.85 : (isExpertise ? 0.65 : 0.5)));
        
        let tz = 0;
        if (isStats) {
          tz = (i % 2 === 0 ? 1 : -1) * ((i * 37) % 80 + 20);
        } else if (isTechStack) {
          tz = (i % 2 === 0 ? 1 : -1) * ((i * 37) % 180 + 30); // 3D depth variation restored
        } else if (isExpertise) {
          tz = i === 0 ? -300 : (i === 1 ? 250 : -200); // Dynamic 3D depth layers
        } else if (isProjects) {
          tz = -80 - i * 40; // Push back slightly in 3D perspective space
        }

        // Slight rotation tilt:
        let tr = isProjects ? (i % 2 === 0 ? 1 : -1) * (3 + (i % 3) * 2) : (i % 2 === 0 ? 1 : -1) * ((i * 23) % sectionRotMag + 15);
        
        let ts = 1;
        if (isStats) {
          ts = 0.5 + (i % 3) * 0.25;
        } else if (isTechStack) {
          ts = 0.35 + (i % 3) * 0.35; // Start scale range restored
        } else if (isExpertise) {
          ts = 0.55; // Expertise starts smaller and zooms to natural size
        } else if (isProjects) {
          ts = 0.92; // Slight zoom in from 0.92 to 1.0 for premium finish
        } else {
          ts = 0.72 + (i % 3) * 0.08;
        }

        // Scale down mobile transformations to prevent viewport overflow and visual chaos
        if (isMobile) {
          tx = tx * 0.15; // Limit horizontal translation to prevent horizontal scrolling
          ty = ty * 0.40; // Limit vertical translation to keep within the container bounds
          tz = tz * 0.40; // Limit 3D depth translation
          tr = tr * 0.35; // Limit rotation to prevent clipping and text overlap
          ts = 0.82 + (ts - 0.82) * 0.5; // Bring start scale closer to 1.0 (prevents items disappearing)
        }

        items.push({ el, tx, ty, tz, tr, ts });
        // Start scattered + invisible
        el.style.opacity = '0';
        el.style.transform = `translate3d(${tx}px, ${ty}px, ${tz}px) rotate(${tr}deg) scale(${ts})`;
      });

      groups.push({ section, items, headerEl });
    });

    return groups;
  }

  // ─── Update one scatter group based on scroll position ───────────
  // Progress: 0 = fully scattered, 1 = fully assembled
  // Logic: based on section center distance from viewport center
  private updateScatterGroup(
    group: { section: HTMLElement; items: ScatterEl[]; headerEl: HTMLElement | null },
    H: number
  ) {
    const isMobile = window.innerWidth < 768;
    const rect = group.section.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = H / 2;
    const dist = sectionCenter - viewportCenter;

    let progress: number = 0;
    let pinRatio: number = 0;
    const isExpertise = group.section.id === 'expertise';
    const isStats = group.section.id === 'stats-section';

    if (isExpertise && !isMobile) {
      const parent = group.section.parentElement;
      if (parent && parent.id === 'expertise-pin-wrapper') {
        const parentRect = parent.getBoundingClientRect();
        const totalPinDistance = parentRect.height - H;
        pinRatio = totalPinDistance > 0 ? Math.max(0, Math.min(1, -parentRect.top / totalPinDistance)) : 0;
        
        // Cards fully assemble within the first 50% of the pin range, remaining 50% is hold phase
        const assembleLimit = 0.50;
        const rawProgress = Math.min(1, pinRatio / assembleLimit);
        progress = this.easeInOut(rawProgress);
      } else {
        progress = 1;
      }
    } else if (isStats && !isMobile) {
      const parent = group.section.parentElement;
      if (parent && parent.id === 'stats-pin-wrapper') {
        const parentRect = parent.getBoundingClientRect();
        const totalPinDistance = parentRect.height - H;
        pinRatio = totalPinDistance > 0 ? Math.max(0, Math.min(1, -parentRect.top / totalPinDistance)) : 0;
        
        // Stats fully assemble in Phase 1 (0 to 0.35)
        if (pinRatio <= 0.35) {
          const rawProgress = pinRatio / 0.35;
          progress = this.easeInOut(rawProgress);
        } else {
          progress = 1;
        }
      } else {
        progress = 1;
      }
    } else {
      // Standard viewport center-based scatter assembly for other sections
      const assembleZone = H * 0.4;
      const scatterZone  = H * 0.95;
      if (Math.abs(dist) <= assembleZone) {
        progress = 1;
      } else if (Math.abs(dist) >= scatterZone) {
        progress = 0;
      } else {
        const t = 1 - (Math.abs(dist) - assembleZone) / (scatterZone - assembleZone);
        progress = this.easeInOut(Math.max(0, Math.min(1, t)));
      }
    }

    // Header reveal logic
    if (group.headerEl) {
      if (isExpertise && !isMobile) {
        // Header fades in early during the first 30% of pinning
        const hp = Math.min(1, pinRatio / 0.30);
        const easedHp = this.easeInOut(hp);
        group.headerEl.style.opacity = String(easedHp);
        group.headerEl.style.transform = `translate3d(0, ${(1 - easedHp) * 20}px, 0)`;
      } else {
        const scatterZone = H * 0.95;
        const hdist = Math.abs(dist);
        const hp = hdist <= H * 0.65
          ? 1
          : hdist >= scatterZone
            ? 0
            : this.easeInOut(1 - (hdist - H * 0.65) / (scatterZone - H * 0.65));
        group.headerEl.style.opacity = String(Math.max(0, Math.min(1, hp)));
        group.headerEl.style.transform = `translate3d(0, ${(1 - Math.min(1, hp * 2)) * 25}px, 0)`;
      }
    }

    // Scatter items assembly
    group.items.forEach((item, i) => {
      let p: number;
      const iconEl = item.el.querySelector<HTMLElement>('.w-12, .w-14');
      const titleEl = item.el.querySelector<HTMLElement>('h3');
      const listItems = item.el.querySelectorAll<HTMLElement>('ul > li');
      const statNumEl = item.el.querySelector<HTMLElement>('.stat-number');
      const sealEl = item.el.querySelector<SVGElement>('.magic-card-seal');

      if (isExpertise && !isMobile) {
        // Custom stagger based on the shared section progress
        const stagger = Math.max(0, Math.min(1, progress - i * 0.15));
        p = this.easeOut(stagger);

        // Apply scroll-driven parallax offsets to inner elements
        const scrollOffset = pinRatio - 0.5;
        if (iconEl) {
          iconEl.style.transform = `translate3d(0, ${scrollOffset * -40}px, 0)`;
        }
        if (titleEl) {
          titleEl.style.transform = `translate3d(0, ${scrollOffset * -20}px, 0)`;
        }
        listItems.forEach((li, idx) => {
          li.style.transform = `translate3d(0, ${scrollOffset * (-10 + idx * 8)}px, 0)`;
          li.style.opacity = String(Math.max(0.6, 1 - Math.abs(scrollOffset) * 0.8));
        });

        item.el.style.opacity = String(p);
        item.el.style.transform = `translate3d(${item.tx * (1 - p)}px, ${item.ty * (1 - p)}px, ${item.tz * (1 - p)}px) rotate(${item.tr * (1 - p)}deg) scale(${item.ts + (1 - item.ts) * p})`;

      } else if (isStats && !isMobile) {
        let textVal = '';
        let sealRotation = 0;
        let sealScale = 0.6;
        let sealOpacity = 0;

        if (pinRatio <= 0.35) {
          textVal = this.getStatValue(i, 0);
          p = this.easeOut(pinRatio / 0.35);
          item.el.style.opacity = String(p);
          item.el.style.transform = `translate3d(${item.tx * (1 - p)}px, ${item.ty * (1 - p)}px, ${item.tz * (1 - p)}px) rotate(${item.tr * (1 - p)}deg) scale(${item.ts + (1 - item.ts) * p})`;
          item.el.style.boxShadow = '';

          // Seal animation values
          const p_seal = pinRatio / 0.35;
          sealRotation = p_seal * 120 * (i % 2 === 0 ? 1 : -1);
          sealScale = 0.6 + 0.4 * p_seal;
          sealOpacity = p_seal * 0.8;

        } else if (pinRatio <= 0.70) {
          const matchRatio = (pinRatio - 0.35) / 0.35;
          textVal = this.getStatValue(i, matchRatio);
          
          // Magic Match Pulse & Neon Glow
          const scaleBump = 1 + Math.sin(matchRatio * Math.PI) * 0.08;
          const glowSpread = Math.sin(matchRatio * Math.PI) * 45;
          const glowColor = i === 0 ? '56,189,248' : (i === 1 ? '129,140,248' : (i === 2 ? '244,114,182' : '245,158,11'));
          
          item.el.style.opacity = '1';
          item.el.style.transform = `translate3d(0, 0, 0) scale(${scaleBump})`;
          item.el.style.boxShadow = `0 0 ${glowSpread}px rgba(${glowColor}, ${glowSpread / 90})`;

          // Seal animation values
          sealRotation = (120 + matchRatio * 240) * (i % 2 === 0 ? 1 : -1);
          sealScale = 1.0 + Math.sin(matchRatio * Math.PI) * 0.08;
          sealOpacity = 0.8 + Math.sin(matchRatio * Math.PI) * 0.2;

        } else {
          textVal = this.getStatValue(i, 1);
          const p_out = (pinRatio - 0.70) / 0.30;
          const ep = this.easeInOut(p_out);
          
          item.el.style.opacity = String(Math.max(0, 1 - ep));
          item.el.style.transform = `translate3d(0, ${ep * -180}px, ${ep * 350}px) rotate(${ep * (i % 2 === 0 ? 12 : -12)}deg) scale(${1 + ep * 0.8})`;
          item.el.style.boxShadow = '';

          // Seal animation values
          sealRotation = (360 + p_out * 180) * (i % 2 === 0 ? 1 : -1);
          sealScale = 1.0 + p_out * 1.5;
          sealOpacity = (1 - p_out) * 0.8;
        }

        // Apply seal styles
        if (sealEl) {
          sealEl.style.opacity = String(sealOpacity);
          sealEl.style.transform = `scale(${sealScale})`;
          const rClock = sealEl.querySelector<SVGElement>('.rotating-ring-clockwise');
          const rCounter = sealEl.querySelector<SVGElement>('.rotating-ring-counter');
          if (rClock) {
            rClock.style.transformOrigin = 'center';
            rClock.style.transform = `rotate(${sealRotation}deg)`;
          }
          if (rCounter) {
            rCounter.style.transformOrigin = 'center';
            rCounter.style.transform = `rotate(${-sealRotation}deg)`;
          }
        }

        if (statNumEl && statNumEl.innerText !== textVal) {
          statNumEl.innerText = textVal;
        }

      } else {
        const isTechStack = group.section.id === 'tech-stack';
        // On mobile, use the card itself (item.el) as anchor for expertise, stats, and projects so they assemble individually relative to their own position
        const anchor = (isMobile && !isTechStack)
          ? item.el
          : (item.el.closest('.tech-card') || item.el.parentElement || item.el);

        const arect = anchor.getBoundingClientRect();
        const anchorCenter = arect.top + arect.height / 2;
        const adist = anchorCenter - viewportCenter;

        const isHighChaos = anchor.closest('.tech-card') !== null || anchor.closest('#stats-section') !== null;
        
        let assembleZone = isHighChaos ? H * 0.15 : H * 0.35;
        let ascatterZone = isHighChaos ? H * 0.95 : H * 0.85;

        // Expand assembly zone on mobile to make sure elements are fully assembled while visible on screen
        if (isMobile) {
          assembleZone = isHighChaos ? H * 0.45 : H * 0.70;
          ascatterZone = isHighChaos ? H * 1.10 : H * 1.30;
        }

        let itemProgress: number;
        if (Math.abs(adist) <= assembleZone) {
          itemProgress = 1;
        } else if (Math.abs(adist) >= ascatterZone) {
          itemProgress = 0;
        } else {
          const t = 1 - (Math.abs(adist) - assembleZone) / (ascatterZone - assembleZone);
          itemProgress = this.easeInOut(Math.max(0, Math.min(1, t)));
        }

        const isProjects = group.section.id === 'projects';
        const staggerVal = isProjects ? (i * 0.05) : ((i % 8) * 0.025);
        const stagger = Math.max(0, Math.min(1, itemProgress - staggerVal));
        p = isProjects ? this.easeInOut(stagger) : this.easeOut(stagger);

        // Reset child transforms on other items or mobile
        if (isExpertise) {
          if (iconEl) iconEl.style.transform = '';
          if (titleEl) titleEl.style.transform = '';
          listItems.forEach(li => {
            li.style.transform = '';
            li.style.opacity = '';
          });
        }

        // Animate stats numbers and seals on mobile/reset based on progress p
        if (isStats) {
          if (statNumEl) {
            const finalVal = i === 3 ? '∞' : (i === 0 ? '20+' : (i === 1 ? '3+' : '10+'));
            statNumEl.innerText = finalVal;
          }
          item.el.style.boxShadow = '';
          
          if (sealEl) {
            const sealOpacity = p * 0.8;
            const sealScale = 0.6 + 0.4 * p;
            const sealRotation = p * 180 * (i % 2 === 0 ? 1 : -1);

            sealEl.style.opacity = String(sealOpacity);
            sealEl.style.transform = `scale(${sealScale})`;
            const rClock = sealEl.querySelector<SVGElement>('.rotating-ring-clockwise');
            const rCounter = sealEl.querySelector<SVGElement>('.rotating-ring-counter');
            if (rClock) {
              rClock.style.transformOrigin = 'center';
              rClock.style.transform = `rotate(${sealRotation}deg)`;
            }
            if (rCounter) {
              rCounter.style.transformOrigin = 'center';
              rCounter.style.transform = `rotate(${-sealRotation}deg)`;
            }
          }
        }
        if (isTechStack && !isMobile) {
          // Supernova explosion and spring-settle formula
          const mult = (1 - p) + Math.sin(p * 2.5 * Math.PI) * (1 - p) * 1.5;
          const currentRotation = item.tr * mult * 1.8;
          const currentScale = item.ts + (1 - item.ts) * p + Math.sin(p * Math.PI) * 0.25;
          
          item.el.style.opacity = String(p);
          item.el.style.transform = `translate3d(${item.tx * mult}px, ${item.ty * mult}px, ${item.tz * mult}px) rotate(${currentRotation}deg) scale(${currentScale})`;
        } else {
          item.el.style.opacity = String(p);
          item.el.style.transform = `translate3d(${item.tx * (1 - p)}px, ${item.ty * (1 - p)}px, ${item.tz * (1 - p)}px) rotate(${item.tr * (1 - p)}deg) scale(${item.ts + (1 - item.ts) * p})`;
        }
      }
    });
  }

  private getStatValue(i: number, matchRatio: number): string {
    if (matchRatio <= 0) {
      return i === 3 ? '0' : '0+';
    }
    if (matchRatio >= 1) {
      return i === 3 ? '∞' : (i === 0 ? '20+' : (i === 1 ? '3+' : '10+'));
    }
    
    if (i === 0) {
      return Math.floor(20 * matchRatio) + '+';
    } else if (i === 1) {
      return Math.floor(3 * matchRatio) + '+';
    } else if (i === 2) {
      return Math.floor(10 * matchRatio) + '+';
    } else {
      // Passion (index 3): count up to 99 and then morph to infinity symbol
      if (matchRatio < 0.95) {
        const val = Math.floor(99 * (matchRatio / 0.95));
        return String(val);
      } else {
        return '∞';
      }
    }
  }


  private easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
  private easeInOut(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // ─── PARTICLES ──────────────────────────────────────────────────
  private initParticles() {
    const c = document.createElement('div');
    c.className = 'particle-field';
    document.body.appendChild(c);
    const colors = ['rgba(56,189,248,0.5)','rgba(168,85,247,0.4)','rgba(244,114,182,0.4)','rgba(99,102,241,0.3)'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 3 + 1;
      const color = colors[i % colors.length];
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:-10px;background:${color};box-shadow:0 0 ${size*3}px ${color};--duration:${15+Math.random()*18}s;--drift-x:${(Math.random()-0.5)*80}px;animation-delay:-${Math.random()*20}s`;
      c.appendChild(p);
    }
  }

  // ─── 3D TILT CARDS ──────────────────────────────────────────────
  private initTiltCards() {
    document.querySelectorAll<HTMLElement>('.tilt-card').forEach(el => {
      const shine = el.querySelector<HTMLElement>('.tilt-card-shine');
      el.addEventListener('mousemove', (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const rx = ((y - r.height/2) / r.height) * -12;
        const ry = ((x - r.width/2) / r.width) * 12;
        el.style.transition = 'transform 0.08s ease-out';
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
        if (shine) { shine.style.setProperty('--mouse-x',`${(x/r.width)*100}%`); shine.style.setProperty('--mouse-y',`${(y/r.height)*100}%`); }
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      });
    });
  }
}
