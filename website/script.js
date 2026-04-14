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
  // Scroll reveal animations
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
    threshold: 0.1,
    rootMargin: '-80px 0px'
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
        const navbarHeight = navbar.offsetHeight;
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
  const heroGlow = document.querySelector('.hero-glow');
  
  if (heroGlow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          const scrollY = window.scrollY;
          const heroHeight = document.querySelector('.hero').offsetHeight;
          const progress = Math.min(scrollY / heroHeight, 1);
          
          // Move glow up and fade out on scroll
          heroGlow.style.transform = `translate(-50%, calc(-50% - ${progress * 100}px))`;
          heroGlow.style.opacity = 1 - progress;
          
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // Photo Carousels (supports multiple)
  // ==========================================================================
  document.querySelectorAll('.carousel-container').forEach(function(container) {
    var track = container.querySelector('.carousel-track');
    var images = container.querySelectorAll('.carousel-img');
    var prevBtn = container.querySelector('.carousel-prev');
    var nextBtn = container.querySelector('.carousel-next');
    var parent = container.parentElement;
    var counterEl = parent ? parent.querySelector('.carousel-counter .carousel-current') : null;
    var totalEl = parent ? parent.querySelector('.carousel-counter .carousel-total') : null;

    if (!track || images.length === 0) return;

    var current = 0;
    var total = images.length;
    var autoplay = null;

    // Set total count dynamically
    if (totalEl) totalEl.textContent = total;

    function goTo(index) {
      current = index;
      if (current < 0) current = total - 1;
      if (current >= total) current = 0;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      if (counterEl) counterEl.textContent = current + 1;
    }

    function startAutoplay() {
      if (autoplay) clearInterval(autoplay);
      autoplay = setInterval(function() { goTo(current + 1); }, 4000);
    }

    function stopAutoplay() {
      if (autoplay) { clearInterval(autoplay); autoplay = null; }
    }

    prevBtn.addEventListener('click', function() { goTo(current - 1); });
    nextBtn.addEventListener('click', function() { goTo(current + 1); });

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
      if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); }
    }, { passive: true });
  });

})();
