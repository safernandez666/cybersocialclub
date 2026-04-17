/**
 * Cyber Social Club — Landing Page Scripts
 */

(function() {
  'use strict';

  // ==========================================================================
  // Fetch live member count from socios API
  // ==========================================================================
  fetch('https://socios.cybersocialclub.com.ar/api/members/count')
    .then(function(res) { return res.ok ? res.json() : { count: 0 }; })
    .then(function(data) {
      if (data.count > 0) {
        var el = document.getElementById('member-count');
        if (el) {
          var target = data.count;
          el.dataset.target = target;
          // Animate the counter
          var duration = 2000;
          var step = Math.ceil(target / (duration / 16));
          var current = 0;
          var timer = setInterval(function() {
            current += step;
            if (current >= target) {
              el.textContent = target;
              clearInterval(timer);
            } else {
              el.textContent = current;
            }
          }, 16);
        }
      }
    })
    .catch(function() {});

  // ==========================================================================
  // Navbar scroll effect
  // ==========================================================================
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Check on load

  // ==========================================================================
  // Mobile menu toggle
  // ==========================================================================
  const navbarToggle = document.getElementById('navbarToggle');
  const navbarMobile = document.getElementById('navbarMobile');

  if (navbarToggle && navbarMobile) {
    navbarToggle.addEventListener('click', function() {
      const isExpanded = this.classList.toggle('active');
      navbarMobile.classList.toggle('active');

      // Update ARIA attributes
      this.setAttribute('aria-expanded', isExpanded);
      this.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');

      // Prevent body scroll when menu is open
      document.body.style.overflow = navbarMobile.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navbarMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        navbarToggle.classList.remove('active');
        navbarToggle.setAttribute('aria-expanded', 'false');
        navbarToggle.setAttribute('aria-label', 'Abrir menú');
        navbarMobile.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ==========================================================================
  // Scroll reveal animations (enhanced with stagger and variants)
  // ==========================================================================
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, parseInt(delay));
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '-60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ==========================================================================
  // Animated counters
  // ==========================================================================
  const counters = document.querySelectorAll('.counter');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.target);
        const duration = 2000; // 2 seconds
        const step = Math.ceil(target / (duration / 16)); // 60fps
        let current = 0;

        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
          } else {
            counter.textContent = current;
          }
        }, 16);

        counterObserver.unobserve(counter);
      }
    });
  }, {
    threshold: 0.5
  });

  counters.forEach(counter => counterObserver.observe(counter));

  // ==========================================================================
  // Smooth scroll for anchor links
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==========================================================================
  // Hero parallax effect (subtle)
  // ==========================================================================
  const heroGlows = document.querySelectorAll('.hero-glow');
  const heroGrid = document.querySelector('.hero-grid');

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          const scrollY = window.scrollY;
          const heroHeight = document.querySelector('.hero').offsetHeight;
          const progress = Math.min(scrollY / heroHeight, 1);

          // Move glows up and fade out on scroll
          heroGlows.forEach((glow, index) => {
            const speed = 60 + (index * 30);
            glow.style.transform = 'translateY(-' + (progress * speed) + 'px)';
            glow.style.opacity = 1 - (progress * 0.8);
          });

          if (heroGrid) {
            heroGrid.style.transform = 'perspective(800px) rotateX(10deg) translateY(' + (progress * 40) + 'px)';
            heroGrid.style.opacity = 0.35 - (progress * 0.25);
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // Photo Carousels (supports multiple) + thumbnails + lightbox
  // ==========================================================================
  document.querySelectorAll('.carousel-container').forEach(function(container, albumIndex) {
    var track = container.querySelector('.carousel-track');
    var images = container.querySelectorAll('.carousel-img');
    var prevBtn = container.querySelector('.carousel-prev');
    var nextBtn = container.querySelector('.carousel-next');
    var parent = container.parentElement;
    var counterEl = parent ? parent.querySelector('.carousel-counter .carousel-current') : null;
    var totalEl = parent ? parent.querySelector('.carousel-counter .carousel-total') : null;
    var thumbsContainer = parent ? parent.querySelector('.carousel-thumbs') : null;

    if (!track || images.length === 0) return;

    var current = 0;
    var total = images.length;
    var autoplay = null;

    // Set total count dynamically
    if (totalEl) totalEl.textContent = total;

    // Build thumbnails
    if (thumbsContainer) {
      images.forEach(function(img, idx) {
        var thumb = document.createElement('div');
        thumb.className = 'carousel-thumb' + (idx === 0 ? ' active' : '');
        var thumbImg = document.createElement('img');
        thumbImg.src = img.src;
        thumbImg.alt = '';
        thumb.appendChild(thumbImg);
        thumb.addEventListener('click', function() {
          goTo(idx);
          stopAutoplay();
        });
        thumbsContainer.appendChild(thumb);
      });
    }

    var thumbs = thumbsContainer ? thumbsContainer.querySelectorAll('.carousel-thumb') : [];

    function goTo(index) {
      current = index;
      if (current < 0) current = total - 1;
      if (current >= total) current = 0;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      if (counterEl) counterEl.textContent = current + 1;
      thumbs.forEach(function(t, i) {
        t.classList.toggle('active', i === current);
      });
    }

    function startAutoplay() {
      if (autoplay) clearInterval(autoplay);
      autoplay = setInterval(function() { goTo(current + 1); }, 4000);
    }

    function stopAutoplay() {
      if (autoplay) { clearInterval(autoplay); autoplay = null; }
    }

    prevBtn.addEventListener('click', function() { goTo(current - 1); stopAutoplay(); });
    nextBtn.addEventListener('click', function() { goTo(current + 1); stopAutoplay(); });

    // Start autoplay only when carousel becomes visible
    var carouselObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          startAutoplay();
          carouselObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    carouselObserver.observe(container);

    // Pause on hover
    container.addEventListener('mouseenter', function() { stopAutoplay(); });
    container.addEventListener('mouseleave', function() { startAutoplay(); });

    // Swipe support
    var touchStartX = 0;
    track.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function(e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); stopAutoplay(); }
    }, { passive: true });

    // Lightbox integration
    images.forEach(function(img, idx) {
      img.addEventListener('click', function() {
        openLightbox(albumIndex, idx);
        stopAutoplay();
      });
    });
  });

  // ==========================================================================
  // Lightbox
  // ==========================================================================
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');

  var lightboxAlbumIndex = 0;
  var lightboxImageIndex = 0;
  var allCarouselImages = [];

  function collectCarouselImages() {
    allCarouselImages = [];
    document.querySelectorAll('.event-album').forEach(function(album) {
      var imgs = [];
      album.querySelectorAll('.carousel-img').forEach(function(img) {
        imgs.push({ src: img.src, alt: img.alt });
      });
      allCarouselImages.push(imgs);
    });
  }
  collectCarouselImages();

  function openLightbox(albumIdx, imgIdx) {
    if (!lightbox || !lightboxImg) return;
    lightboxAlbumIndex = albumIdx;
    lightboxImageIndex = imgIdx;
    updateLightboxImage();
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxImage() {
    var album = allCarouselImages[lightboxAlbumIndex];
    if (!album) return;
    var item = album[lightboxImageIndex];
    if (item) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
      if (lightboxCaption) lightboxCaption.textContent = item.alt;
    }
  }

  function lightboxPrev() {
    var album = allCarouselImages[lightboxAlbumIndex];
    if (!album) return;
    lightboxImageIndex--;
    if (lightboxImageIndex < 0) lightboxImageIndex = album.length - 1;
    updateLightboxImage();
  }

  function lightboxNext() {
    var album = allCarouselImages[lightboxAlbumIndex];
    if (!album) return;
    lightboxImageIndex++;
    if (lightboxImageIndex >= album.length) lightboxImageIndex = 0;
    updateLightboxImage();
  }

  if (lightbox) {
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', lightboxPrev);
    lightbox.querySelector('.lightbox-next').addEventListener('click', lightboxNext);

    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    });
  }

  // ==========================================================================
  // Event countdown (placeholder animation when no date is set)
  // ==========================================================================
  var countdownItems = document.querySelectorAll('.countdown-value');
  var eventDateStr = null; // Set to ISO date string when available

  function updateCountdown() {
    if (!eventDateStr) {
      // Show animated dashed placeholder
      var now = Date.now();
      var dash = (Math.floor(now / 500) % 2 === 0) ? '--' : '—';
      countdownItems.forEach(function(el) {
        el.textContent = dash;
      });
      return;
    }

    var eventDate = new Date(eventDateStr);
    var now = new Date();
    var diff = eventDate - now;

    if (diff <= 0) {
      countdownItems.forEach(function(el) { el.textContent = '00'; });
      return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor((diff / (1000 * 60)) % 60);
    var seconds = Math.floor((diff / 1000) % 60);

    if (countdownItems[0]) countdownItems[0].textContent = String(days).padStart(2, '0');
    if (countdownItems[1]) countdownItems[1].textContent = String(hours).padStart(2, '0');
    if (countdownItems[2]) countdownItems[2].textContent = String(minutes).padStart(2, '0');
    if (countdownItems[3]) countdownItems[3].textContent = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 500);
  updateCountdown();

  // ==========================================================================
  // Newsletter form submission
  // ==========================================================================
  var newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var emailInput = document.getElementById('newsletter-email');
      var btn = document.getElementById('newsletter-btn');
      var msg = document.getElementById('newsletter-msg');
      var email = emailInput.value.trim();

      if (!email) return;

      btn.disabled = true;
      btn.textContent = 'Enviando...';
      msg.style.display = 'none';

      fetch('https://socios.cybersocialclub.com.ar/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
        .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
        .then(function(result) {
          msg.style.display = 'block';
          if (result.ok) {
            msg.style.color = '#22c55e';
            msg.textContent = result.data.message || '¡Gracias por suscribirte!';
            emailInput.value = '';
          } else {
            msg.style.color = '#ef4444';
            msg.textContent = result.data.error || 'Error al suscribirse.';
          }
        })
        .catch(function() {
          msg.style.display = 'block';
          msg.style.color = '#ef4444';
          msg.textContent = 'Error de conexión. Intentá de nuevo.';
        })
        .finally(function() {
          btn.disabled = false;
          btn.textContent = 'Suscribirme';
        });
    });
  }

})();
