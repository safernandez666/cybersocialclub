/**
 * Cyber Social Club — Landing Page Scripts
 */

(function() {
  'use strict';

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
      this.classList.toggle('active');
      navbarMobile.classList.toggle('active');
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = navbarMobile.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navbarMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        navbarToggle.classList.remove('active');
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
  // Photo Carousel
  // ==========================================================================
  const track = document.querySelector('.carousel-track');
  const images = document.querySelectorAll('.carousel-img');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const dotsContainer = document.querySelector('.carousel-dots');

  if (track && images.length > 0) {
    let current = 0;
    const total = images.length;

    // Create dots
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
      dot.addEventListener('click', function() { goTo(i); });
      dotsContainer.appendChild(dot);
    }

    function goTo(index) {
      current = index;
      if (current < 0) current = total - 1;
      if (current >= total) current = 0;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      document.querySelectorAll('.carousel-dot').forEach(function(d, i) {
        d.classList.toggle('active', i === current);
      });
    }

    prevBtn.addEventListener('click', function() { goTo(current - 1); });
    nextBtn.addEventListener('click', function() { goTo(current + 1); });

    // Auto-advance every 4 seconds
    let autoplay = setInterval(function() { goTo(current + 1); }, 4000);

    // Pause on hover
    track.parentElement.addEventListener('mouseenter', function() { clearInterval(autoplay); });
    track.parentElement.addEventListener('mouseleave', function() {
      autoplay = setInterval(function() { goTo(current + 1); }, 4000);
    });

    // Swipe support
    let touchStartX = 0;
    track.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function(e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); }
    }, { passive: true });
  }

})();
