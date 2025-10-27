(function(){
      const css = '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}';
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    })();

    const addPassive = (el, evt, handler) => el.addEventListener(evt, handler, { passive: true });
    let shimmer = false;
    let currentSection = 'inicio';
    let isScrolling = false;
    let scrollTimeout;
    let sectionPositions = null;
    const enlaces = document.querySelectorAll('.enlace_navegacion, .contacto-item');
    const enlaceContacto = document.querySelector('.barra_lateral .enlace_navegacion.more');
    const secciones = [
      document.getElementById('inicio'),
      document.getElementById('habilidades'),
      document.getElementById('experiencia'),
      document.getElementById('educacion'),
      document.getElementById('proyectos'),
      document.getElementById('extras'),
      document.getElementById('contacto')
    ].filter(Boolean);
    const seccionPorId = new Map(secciones.map(s => ['#' + s.id, s]));

    // Caché de posiciones de secciones
    function cacheSectionPositions(){
  if (sectionPositions && sectionPositions.size > 0) return;
  
  requestAnimationFrame(() => {
    sectionPositions = new Map();
    secciones.forEach(section => {
      const rect = section.getBoundingClientRect();
      sectionPositions.set(section.id, {
        top: rect.top + window.pageYOffset,
        height: rect.height,
        middle: rect.top + window.pageYOffset + rect.height / 2
      });
    });
  });
}

    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        cacheSectionPositions();
      });
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          cacheSectionPositions();
        });
      }, 250);
    });

    // Actualizar enlace activo
    const actualizarActiva = hash => {
      if(currentSection === hash.replace('#', '')) return;
      currentSection = hash.replace('#', '');
      enlaces.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
    };

    // Observador de intersección para navegación
    const obsNav = new IntersectionObserver(entries => {
      if(isScrolling) return;
      let mejor = null;
      let mejorRatio = 0;
      for(const en of entries){
        if(!en.isIntersecting) continue;
        if(en.intersectionRatio > mejorRatio){
          mejor = en;
          mejorRatio = en.intersectionRatio;
        }
      }
      if(mejor && mejorRatio > 0.1){
        actualizarActiva('#' + mejor.target.id);
        history.replaceState(null, '', '#' + mejor.target.id);
      }
    }, {
      rootMargin: window.innerWidth > 1200 ? '-30% 0px -50% 0px' : '-20% 0px -60% 0px',
      threshold: [0.1, 0.2, 0.3, 0.5, 0.7, 0.9]
    });

    secciones.forEach(s => obsNav.observe(s));

    // Observador para enlace de contacto
    if(enlaceContacto){
      const contactoSec = document.getElementById('contacto');
      const obsContacto = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const visible = en.isIntersecting && en.intersectionRatio > 0.05;
          enlaceContacto.classList.toggle('active', visible);
        });
      }, { root: null, rootMargin: '0px', threshold: [0, 0.05, 0.25, 0.5, 0.75, 1] });
      if(contactoSec) obsContacto.observe(contactoSec);
    }

    // Estados hover para elementos táctiles
    document.querySelectorAll('.contacto-item').forEach(item => {
      item.addEventListener('touchstart', () => item.classList.add('hover'), { passive: true });
      item.addEventListener('touchend', () => item.classList.remove('hover'), { passive: true });
    });

    // Navegación inicial basada en hash
    window.addEventListener('load', () => {
      const hash = window.location.hash || '#inicio';
      actualizarActiva(hash);
      if(window.location.hash){
        setTimeout(() => {
          const objetivo = seccionPorId.get(window.location.hash);
          if(objetivo){
            isScrolling = true;
            objetivo.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => { isScrolling = false; }, 800);
          }
        }, 100);
      }
    });

    // Navegación por clic
    enlaces.forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if(!href || !href.startsWith('#')) return;
        e.preventDefault();
        const objetivo = seccionPorId.get(href);
        if(objetivo){
          isScrolling = true;
          objetivo.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', href);
          setTimeout(() => { isScrolling = false; }, 800);
        }
      });
    });

    // Detección de sección activa durante scroll
    window.addEventListener('scroll', () => {
      if(isScrolling) return;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if(!sectionPositions) return;
        const scrollPos = window.scrollY + window.innerHeight * 0.3;
        let current = 'inicio';
        let minDistance = Infinity;
        for(const [sectionId, position] of sectionPositions){
          const distance = Math.abs(position.middle - scrollPos);
          if(distance < minDistance){
            minDistance = distance;
            current = sectionId;
          }
        }
        if(current !== currentSection){
          actualizarActiva('#' + current);
          history.replaceState(null, '', '#' + current);
        }
      }, 50);
    });

    // Animación de barras de habilidades
    const barras = document.querySelectorAll('.barra > span');
    const obsBarras = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(en.isIntersecting){
          requestAnimationFrame(() => {
            const w = getComputedStyle(en.target).getPropertyValue('--w') || '0%';
            en.target.style.width = w.trim();
            obsBarras.unobserve(en.target);
          });
        }
      });
    }, { threshold: 0.4 });

    barras.forEach(b => obsBarras.observe(b));

    // Modal para certificados
    const modal = document.getElementById('modal');
    const imagen_modal = document.getElementById('modalImg');
    document.querySelectorAll('[data-img]').forEach(boton => {
      boton.addEventListener('click', () => {
        requestAnimationFrame(() => {
          imagen_modal.loading = 'lazy';
          imagen_modal.decoding = 'async';
          imagen_modal.src = boton.dataset.img;
          modal.style.display = 'flex';
        });
      });
    });

    document.getElementById('closeModal').addEventListener('click', () => {
      requestAnimationFrame(() => {
        modal.style.display = 'none';
        imagen_modal.src = '';
      });
    });

    modal.addEventListener('click', e => {
      if(e.target === modal){
        requestAnimationFrame(() => {
          modal.style.display = 'none';
          imagen_modal.src = '';
        });
      }
    });

    // Botón volver arriba
    const volver_arriba = document.getElementById('toTop');
    let scrollRafId;
    addPassive(window, 'scroll', () => {
      if(scrollRafId) cancelAnimationFrame(scrollRafId);
      scrollRafId = requestAnimationFrame(() => {
        if(window.scrollY > 300) volver_arriba.classList.add('show');
        else volver_arriba.classList.remove('show');
      });
    });

    volver_arriba.addEventListener('click', () => {
      isScrolling = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { isScrolling = false; }, 800);
    });

    // Cambio de tema
    const darkModeBtn = document.getElementById('darkModeBtn');
    const lightModeBtn = document.getElementById('lightModeBtn');
    const darkTheme = {
      '--bg': '#0d1117',
      '--surface': '#161b22',
      '--elev': '#21262d',
      '--text': '#f0f6fc',
      '--muted': '#c9d1d9',
      '--primary': '#e91e63',
      '--secondary': '#ba68c8',
      '--accent': '#ffb74d',
      '--ring': 'rgba(233,30,99,.35)',
      '--glow': '0 0 30px rgba(233,30,99,.45)',
      '--chip-border-color': 'rgba(255,255,255,.15)'
    };
    const lightTheme = {
      '--bg': '#F8F9FA',
      '--surface': '#f8f9fa',
      '--elev': '#e9ecef',
      '--text': '#212529',
      '--muted': '#6c757d',
      '--primary': '#007bff',
      '--secondary': '#ba68c8',
      '--accent': '#28a745',
      '--ring': 'rgba(0,123,255,.35)',
      '--glow': '0 0 30px rgba(0,123,255,.25)',
      '--chip-border-color': 'rgba(0,0,0,.2)'
    };
    let isDarkMode = true;

    requestAnimationFrame(() => {
      Object.entries(darkTheme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
      document.body.classList.remove('light-mode');
      updateButtonStates();
    });

    darkModeBtn.addEventListener('click', () => {
      isDarkMode = true;
      requestAnimationFrame(() => {
        Object.entries(darkTheme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
        document.body.classList.remove('light-mode');
        updateButtonStates();
      });
    });

    lightModeBtn.addEventListener('click', () => {
      isDarkMode = false;
      requestAnimationFrame(() => {
        Object.entries(lightTheme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
        document.body.classList.add('light-mode');
        updateButtonStates();
      });
    });

    function updateButtonStates(){
      if(isDarkMode){
        darkModeBtn.classList.add('active');
        lightModeBtn.classList.remove('active');
      } else {
        lightModeBtn.classList.add('active');
        darkModeBtn.classList.remove('active');
      }
    }

    // Modal de contacto
    const contactModal = document.getElementById('contactModal');
    const contactForm = document.getElementById('contactForm');
    const openContactBtn = document.getElementById('openContactForm');
    if(openContactBtn){
      openContactBtn.addEventListener('click', () => {
        requestAnimationFrame(() => {
          contactModal.style.display = 'flex';
        });
      });
    }

    document.getElementById('closeContactModal').addEventListener('click', () => {
      requestAnimationFrame(() => {
        contactModal.style.display = 'none';
      });
    });

    contactModal.addEventListener('click', e => {
      if(e.target === contactModal){
        requestAnimationFrame(() => {
          contactModal.style.display = 'none';
        });
      }
    });

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');
      const mailtoLink = `mailto:sarasolera16@gmail.com?subject=Mensaje de ${name}&body=Nombre: ${name}%0AEmail: ${email}%0A%0A${message}`;
      window.location.href = mailtoLink;
      requestAnimationFrame(() => {
        contactModal.style.display = 'none';
        contactForm.reset();
      });
    });

    // Animaciones de entrada
    const observerOptions = { threshold: .1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          requestAnimationFrame(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          });
        }
      });
    }, observerOptions);

    document.querySelectorAll('.tarjeta, .proyecto-card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });

    // Efecto de brillo al mover el ratón
    let rafId;
    const onMove = (x, y) => {
      document.documentElement.style.setProperty('--spot-x', x + 'px');
      document.documentElement.style.setProperty('--spot-y', y + 'px');
    };

    addPassive(window, 'mousemove', e => {
      if(!shimmer) return;
      if(rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => onMove(e.clientX, e.clientY));
    });

    /*addPassive(window, 'keydown', e => {
      if(e.key.toLowerCase() === 's'){
        shimmer = !shimmer;
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--spot-intensity', shimmer ? '0.28' : '0');
        });
      }
    });*/

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      shimmer = false;
    }

    // Partículas de fondo
    /*function crearParticulas(){
      const contenedor = document.getElementById('particulas');
      const cantidad = Math.max(16, Math.min(28, Math.round(window.innerWidth / 80)));
      const frag = document.createDocumentFragment();
      for(let i = 0; i < cantidad; i++){
        const p = document.createElement('div');
        p.className = 'particula';
        p.style.left = `${Math.random() * 100}vw`;
        p.style.top = `${Math.random() * 100}vh`;
        const size = Math.random() * 4 + 1;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.opacity = (Math.random() * 0.4 + 0.1).toFixed(2);
        const dur = (Math.random() * 25 + 15).toFixed(1);
        const dx = (Math.random() * 150 - 75).toFixed(0);
        const dy = (Math.random() * 150 - 75).toFixed(0);
        p.style.animation = `flotar-${i} ${dur}s ease-in-out infinite`;
        const style = document.createElement('style');
        style.textContent = `@keyframes flotar-${i} { 0%,100%{ transform: translate(0,0) } 50%{ transform: translate(${dx}px, ${dy}px) } }`;
        document.head.appendChild(style);
        frag.appendChild(p);
      }
      requestAnimationFrame(() => {
        contenedor.appendChild(frag);
      });
    }*/

    /*if('requestIdleCallback' in window){
      requestIdleCallback(() => crearParticulas(), { timeout: 2000 });
    } else {
      window.addEventListener('load', crearParticulas, { once: true });
    }*/