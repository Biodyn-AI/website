/* ========================================
   BIODYN — Interactive Scripts
   ======================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const DATA_URL = 'content/site-data.json';
  const THEME_STORAGE_KEY = 'biodyn-theme';

  const portfolioList = document.getElementById('portfolioList');
  const articlesList = document.getElementById('articlesList');
  const themeToggle = document.getElementById('themeToggle');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  const observeReveals = (root = document) => {
    root.querySelectorAll('.reveal').forEach((element) => {
      revealObserver.observe(element);
    });
  };

  const normalizeText = (value, fallback = '') => {
    if (typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
  };

  const normalizeStatus = (value) => normalizeText(value, 'Active');

  const normalizeMetaText = (value, fallback = '') => {
    const normalized = normalizeText(value, fallback);
    return normalized.replace(/^[^A-Za-z0-9]+/, '').trim();
  };

  const statusClassFromLabel = (statusLabel) => {
    const status = statusLabel.toLowerCase();

    if (status === 'active') {
      return 'status-active';
    }

    if (status === 'watchlist') {
      return 'status-watchlist';
    }

    if (status === 'completed') {
      return 'status-completed';
    }

    if (status === 'paused') {
      return 'status-paused';
    }

    return 'status-watchlist';
  };

  const createProjectElement = (project, index) => {
    const item = document.createElement('div');
    item.className = `portfolio-item reveal reveal-delay-${(index % 5) + 1}`;

    const rank = document.createElement('span');
    rank.className = 'portfolio-rank';
    rank.textContent = `#${index + 1}`;

    const info = document.createElement('div');
    info.className = 'portfolio-info';

    const title = normalizeText(project.title, `Project ${index + 1}`);
    const summary = normalizeText(project.summary);
    const url = normalizeText(project.url);

    if (url) {
      const titleLink = document.createElement('a');
      titleLink.className = 'portfolio-title-link';
      titleLink.href = url;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener';
      titleLink.textContent = title;
      info.appendChild(titleLink);
    } else {
      const heading = document.createElement('h3');
      heading.textContent = title;
      info.appendChild(heading);
    }

    if (summary) {
      const paragraph = document.createElement('p');
      paragraph.textContent = summary;
      info.appendChild(paragraph);
    }

    const statusLabel = normalizeStatus(project.status);
    const status = document.createElement('span');
    status.className = `portfolio-status ${statusClassFromLabel(statusLabel)}`;
    status.textContent = statusLabel;

    item.append(rank, info, status);
    return item;
  };

  const createArticleElement = (article, index) => {
    const card = document.createElement('div');
    card.className = `pub-card reveal reveal-delay-${(index % 4) + 1}`;

    const type = document.createElement('div');
    type.className = 'pub-type';
    type.textContent = normalizeText(article.type, 'Research Output');

    const titleText = normalizeText(article.title, `Article ${index + 1}`);
    const url = normalizeText(article.url);

    if (url) {
      const titleLink = document.createElement('a');
      titleLink.href = url;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener';
      titleLink.className = 'pub-title-link';
      titleLink.textContent = titleText;

      const heading = document.createElement('h3');
      heading.appendChild(titleLink);
      card.appendChild(type);
      card.appendChild(heading);
    } else {
      const heading = document.createElement('h3');
      heading.textContent = titleText;
      card.appendChild(type);
      card.appendChild(heading);
    }

    const summary = document.createElement('p');
    summary.textContent = normalizeText(article.summary, 'No summary provided.');

    const meta = document.createElement('div');
    meta.className = 'pub-meta';

    const primary = document.createElement('span');
    primary.textContent = normalizeMetaText(article.metaPrimary, 'Draft');

    const tag = document.createElement('span');
    tag.textContent = normalizeMetaText(article.metaTag, 'Research');

    meta.append(primary, tag);

    card.append(summary, meta);

    if (url) {
      const link = document.createElement('a');
      link.className = 'pub-link';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = normalizeText(article.linkText, 'Read article');
      card.appendChild(link);
    }

    return card;
  };

  const renderProjects = (projects) => {
    if (!portfolioList) {
      return;
    }

    portfolioList.innerHTML = '';

    if (!Array.isArray(projects) || projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'content-empty';
      empty.textContent = 'No projects yet. Add one in admin.';
      portfolioList.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    projects.forEach((project, index) => {
      fragment.appendChild(createProjectElement(project, index));
    });

    portfolioList.appendChild(fragment);
    observeReveals(portfolioList);
  };

  const renderArticles = (articles) => {
    if (!articlesList) {
      return;
    }

    articlesList.innerHTML = '';

    if (!Array.isArray(articles) || articles.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'content-empty';
      empty.textContent = 'No articles yet. Add one in admin.';
      articlesList.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    articles.forEach((article, index) => {
      fragment.appendChild(createArticleElement(article, index));
    });

    articlesList.appendChild(fragment);
    observeReveals(articlesList);
  };

  const renderLoadError = () => {
    const errorMessage = 'Unable to load site content. Open admin and verify content/site-data.json.';

    if (portfolioList) {
      portfolioList.innerHTML = `<p class="content-error">${errorMessage}</p>`;
    }

    if (articlesList) {
      articlesList.innerHTML = `<p class="content-error">${errorMessage}</p>`;
    }
  };

  const loadSiteData = async () => {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${DATA_URL}: ${response.status}`);
      }

      const data = await response.json();
      renderProjects(data.projects);
      renderArticles(data.articles);
      return data;
    } catch (error) {
      console.error('Content loading error:', error);
      renderLoadError();
      return null;
    }
  };

  const updateHeroStats = (data) => {
    const statValues = {
      tracks: document.querySelectorAll('.research-grid .research-card').length,
      projects: Array.isArray(data?.projects)
        ? data.projects.filter((project) => normalizeStatus(project.status).toLowerCase() === 'active').length
        : null,
      articles: Array.isArray(data?.articles) ? data.articles.length : null,
      atlases: document.querySelectorAll('#atlases .pub-card').length
    };

    document.querySelectorAll('.hero-stat h3[data-stat]').forEach((element) => {
      const key = element.dataset.stat;
      const value = statValues[key];

      if (typeof value === 'number' && value > 0) {
        element.textContent = String(value);
      }
    });
  };

  observeReveals(document);
  const siteDataPromise = loadSiteData();

  // --- Theme Toggle ---
  const root = document.documentElement;
  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');

  const getSystemTheme = () => (systemThemeQuery.matches ? 'light' : 'dark');

  const getStoredTheme = () => {
    const storedTheme = normalizeText(localStorage.getItem(THEME_STORAGE_KEY));
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : '';
  };

  const updateThemeToggle = (theme) => {
    if (!themeToggle) {
      return;
    }

    const nextTheme = theme === 'light' ? 'dark' : 'light';
    themeToggle.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    updateThemeToggle(theme);
  };

  applyTheme(getStoredTheme() || getSystemTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = root.dataset.theme === 'light' ? 'light' : 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';

      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  const handleSystemThemeChange = (event) => {
    if (!getStoredTheme()) {
      applyTheme(event.matches ? 'light' : 'dark');
    }
  };

  if (typeof systemThemeQuery.addEventListener === 'function') {
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);
  } else if (typeof systemThemeQuery.addListener === 'function') {
    systemThemeQuery.addListener(handleSystemThemeChange);
  }

  // --- Article Links ---
  document.querySelectorAll('.article-summary a[href], .article-prose a[href]').forEach((link) => {
    const href = normalizeText(link.getAttribute('href'));

    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  // --- Nav Scroll Effect ---
  const nav = document.getElementById('nav');

  const handleNavScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // --- Hamburger Menu ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function onAnchorClick(event) {
      event.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = nav.offsetHeight + 20;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Animated Stat Counters ---
  const siteData = await siteDataPromise;
  updateHeroStats(siteData);

  const statElements = document.querySelectorAll('.hero-stat h3');
  let statsAnimated = false;

  const animateCounter = (element) => {
    const text = element.textContent;
    const match = text.match(/(\d+)(\+?)/);

    if (!match) {
      return;
    }

    const target = Number.parseInt(match[1], 10);
    const suffix = match[2] || '';
    const duration = 1500;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      element.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    element.textContent = '0' + suffix;
    requestAnimationFrame(update);
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        statElements.forEach((element) => animateCounter(element));
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  if (statElements.length > 0) {
    statsObserver.observe(statElements[0].closest('.hero-stats'));
  }

  // --- Parallax on Hero Background ---
  const hero = document.querySelector('.hero');

  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;

      if (scrolled < window.innerHeight) {
        const meshBg = hero.querySelector('.mesh-bg');

        if (meshBg) {
          meshBg.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
      }
    }, { passive: true });
  }

  // --- Active Nav Link Highlight ---
  const sections = document.querySelectorAll('section[id]');
  const navLinksAll = document.querySelectorAll('.nav-links a[href^="#"]');

  const highlightNav = () => {
    let current = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - nav.offsetHeight - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinksAll.forEach((link) => {
      link.style.color = '';
      if (link.getAttribute('href') === '#' + current) {
        link.style.color = 'var(--accent-cyan)';
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
});
