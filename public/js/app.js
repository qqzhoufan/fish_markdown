(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const html = document.documentElement;
  const sidebar = $('#sidebar');
  const sidebarOverlay = $('#sidebarOverlay');
  const mobileMenuBtn = $('#mobileMenuBtn');
  const themeToggle = $('#themeToggle');
  const progressBar = $('#progressBar');
  const scrollTopBtn = $('#scrollTop');
  const searchInput = $('#searchInput');
  const searchResults = $('#searchResults');
  const playgroundInput = $('#playgroundInput');
  const playgroundOutput = $('#playgroundOutput');
  const playgroundClear = $('#playgroundClear');

  /* ==========================================
     Theme + highlight.js theme sync
     ========================================== */
  const HLJS_LIGHT = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css';
  const HLJS_DARK  = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css';

  function syncHljsTheme(theme) {
    const link = $('#hljs-theme');
    if (link) link.href = theme === 'dark' ? HLJS_DARK : HLJS_LIGHT;
  }

  function initTheme() {
    const saved = localStorage.getItem('fish-md-theme');
    const theme = saved || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    html.setAttribute('data-theme', theme);
    syncHljsTheme(theme);
  }
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('fish-md-theme', next);
    syncHljsTheme(next);
  });
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('fish-md-theme')) {
      const t = e.matches ? 'dark' : 'light';
      html.setAttribute('data-theme', t);
      syncHljsTheme(t);
    }
  });
  initTheme();

  /* ==========================================
     Mobile Sidebar
     ========================================== */
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  mobileMenuBtn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  sidebarOverlay.addEventListener('click', closeSidebar);

  /* ==========================================
     Tabs
     ========================================== */
  const tabBtns = $$('.tab-btn');
  const tabPanels = $$('.tab-panel');
  const sidebarGroups = $$('.sidebar-group');
  let activeTab = 'intro';

  function switchTab(tabId, pushState = true) {
    activeTab = tabId;
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
    tabPanels.forEach((p) => p.classList.toggle('active', p.dataset.tabPanel === tabId));
    sidebarGroups.forEach((g) => g.classList.toggle('active', g.dataset.forTab === tabId));

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Auto-expand first accordion in new tab
    const panel = $(`[data-tab-panel="${tabId}"]`);
    if (panel) {
      const firstItem = panel.querySelector('.accordion-item');
      if (firstItem && !firstItem.classList.contains('open')) {
        toggleAccordion(firstItem, true);
      }
    }

    updateActiveNavLink();
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  /* ==========================================
     Accordion
     ========================================== */
  function toggleAccordion(item, forceOpen) {
    const isOpen = item.classList.contains('open');
    const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;
    const content = item.querySelector('.accordion-content');
    const trigger = item.querySelector('.accordion-trigger');

    if (shouldOpen) {
      item.classList.add('open');
      content.classList.add('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    } else {
      item.classList.remove('open');
      content.classList.remove('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  }

  $$('.accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      toggleAccordion(trigger.closest('.accordion-item'));
    });
  });

  // Initialize: open items with aria-expanded="true"
  $$('.accordion-trigger[aria-expanded="true"]').forEach((t) => {
    const item = t.closest('.accordion-item');
    item.classList.add('open');
    item.querySelector('.accordion-content').classList.add('open');
  });

  /* ==========================================
     Sidebar Navigation
     ========================================== */
  const navLinks = $$('.nav-link');

  function updateActiveNavLink() {
    const panel = $(`[data-tab-panel="${activeTab}"]`);
    if (!panel) return;

    const items = panel.querySelectorAll('.accordion-item, .section');
    let current = '';

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top <= 160) current = item.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }

  // Click sidebar link → switch to correct tab, open accordion, scroll
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      const targetTab = link.closest('.sidebar-group').dataset.forTab;

      if (targetTab !== activeTab) {
        switchTab(targetTab);
        requestAnimationFrame(() => navigateToSection(sectionId));
      } else {
        navigateToSection(sectionId);
      }
      closeSidebar();
    });
  });

  function navigateToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (!el) return;

    if (el.classList.contains('accordion-item')) {
      toggleAccordion(el, true);
    }

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    navLinks.forEach((l) => l.classList.toggle('active', l.dataset.section === sectionId));
  }

  /* ==========================================
     Progress & Scroll
     ========================================== */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0%';
        scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
        updateActiveNavLink();
        ticking = false;
      });
      ticking = true;
    }
  });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ==========================================
     Copy Buttons
     ========================================== */
  $$('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.target);
      if (!el) return;
      navigator.clipboard.writeText(el.textContent).then(() => {
        btn.textContent = '已复制!'; btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied'); }, 1500);
      }).catch(() => {
        const ta = Object.assign(document.createElement('textarea'), { value: el.textContent, style: 'position:fixed;opacity:0' });
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        btn.textContent = '已复制!'; btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied'); }, 1500);
      });
    });
  });

  /* ==========================================
     Search
     ========================================== */
  const searchData = [];
  navLinks.forEach((link) => {
    const group = link.closest('.sidebar-group');
    searchData.push({
      title: link.textContent.trim(),
      section: link.dataset.section,
      tab: group ? group.dataset.forTab : '',
      tabLabel: group ? group.querySelector('.nav-group-title')?.textContent.trim() : '',
    });
  });

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { searchResults.classList.remove('active'); return; }

    const matches = searchData.filter((d) => d.title.toLowerCase().includes(q));
    searchResults.innerHTML = matches.length
      ? matches.map((m) => `<a href="#" class="search-result-item" data-tab="${m.tab}" data-section="${m.section}">${m.title}<span class="result-badge">${m.tabLabel}</span></a>`).join('')
      : '<div class="search-result-item" style="color:var(--text-tertiary);justify-content:center">未找到结果</div>';
    searchResults.classList.add('active');
  });

  searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item[data-section]');
    if (!item) return;
    e.preventDefault();
    const { tab, section } = item.dataset;
    if (tab !== activeTab) switchTab(tab);
    requestAnimationFrame(() => navigateToSection(section));
    searchInput.value = '';
    searchResults.classList.remove('active');
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchInput.value = ''; searchResults.classList.remove('active'); searchInput.blur(); }
    if (e.key === 'Enter') {
      const first = searchResults.querySelector('.search-result-item[data-section]');
      if (first) first.click();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) searchResults.classList.remove('active');
  });

  /* ==========================================
     Keyboard Shortcuts
     ========================================== */
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      searchInput?.focus();
    }
    if (e.key === 't') themeToggle.click();
  });

  /* ==========================================
     Playground — Container & Tabs Preprocessor
     ========================================== */
  const CONTAINER_ICONS = { tip:'💡', warning:'⚠️', danger:'🔴', info:'ℹ️', note:'📝', success:'✅', details:'📂' };
  const CONTAINER_TYPES = new Set(Object.keys(CONTAINER_ICONS));

  function parseMarkdownInner(text) {
    if (typeof marked === 'undefined') return text;
    return marked.parse(text);
  }

  function highlightCode(text, lang) {
    if (lang && typeof hljs !== 'undefined' && hljs.getLanguage(lang)) {
      return hljs.highlight(text, { language: lang }).value;
    }
    if (typeof hljs !== 'undefined') return hljs.highlightAuto(text).value;
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function preprocessContainers(mdText) {
    const lines = mdText.split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // :::: tabs (4 colons)
      if (/^:{4}\s*tabs\s*$/i.test(line)) {
        i++;
        const tabs = [];
        let cur = null;
        while (i < lines.length && !/^:{4}\s*$/.test(lines[i])) {
          const tm = lines[i].match(/^:{3}\s*tab-item\s+(.+)$/i);
          if (tm) {
            if (cur) tabs.push(cur);
            cur = { title: tm[1].trim(), lines: [] };
          } else if (/^:{3}\s*$/.test(lines[i])) {
            /* closing ::: of tab-item */
          } else if (cur) {
            cur.lines.push(lines[i]);
          }
          i++;
        }
        if (cur) tabs.push(cur);
        if (i < lines.length) i++;

        if (tabs.length > 0) {
          let h = '<div class="md-tabs"><div class="md-tabs-bar">';
          tabs.forEach((t, idx) => {
            h += '<button class="md-tab-btn' + (idx === 0 ? ' active' : '') + '" data-idx="' + idx + '">' + t.title + '</button>';
          });
          h += '</div>';
          tabs.forEach((t, idx) => {
            const inner = parseMarkdownInner(t.lines.join('\n'));
            h += '<div class="md-tab-panel' + (idx === 0 ? ' active' : '') + '" data-idx="' + idx + '">' + inner + '</div>';
          });
          h += '</div>';
          out.push(h);
        }
        continue;
      }

      // ::: container (3 colons)
      const cm = line.match(/^:{3}\s*([\w-]+)\s*(.*)$/);
      if (cm && CONTAINER_TYPES.has(cm[1].toLowerCase())) {
        const type = cm[1].toLowerCase();
        const title = cm[2].trim();
        i++;
        const content = [];
        let depth = 1;
        while (i < lines.length && depth > 0) {
          if (/^:{3}\s*[\w-]/.test(lines[i])) depth++;
          else if (/^:{3}\s*$/.test(lines[i])) { depth--; if (depth === 0) { i++; break; } }
          if (depth > 0) content.push(lines[i]);
          i++;
        }

        const parsed = parseMarkdownInner(content.join('\n'));
        const icon = CONTAINER_ICONS[type] || '';
        const displayTitle = title || type.charAt(0).toUpperCase() + type.slice(1);

        if (type === 'details') {
          out.push('<details class="md-container md-details"><summary>' + icon + ' ' + displayTitle + '</summary>' + parsed + '</details>');
        } else {
          out.push('<div class="md-container md-' + type + '"><div class="md-container-title">' + icon + ' ' + displayTitle + '</div>' + parsed + '</div>');
        }
        continue;
      }

      out.push(line);
      i++;
    }
    return out.join('\n');
  }

  /* ==========================================
     Playground — Render
     ========================================== */
  function renderPlayground() {
    if (!playgroundInput || !playgroundOutput || typeof marked === 'undefined') return;
    try {
      const renderer = new marked.Renderer();
      renderer.code = function({ text, lang }) {
        const highlighted = highlightCode(text, lang);
        const langLabel = lang ? '<div class="code-lang-label">' + lang + '</div>' : '';
        return '<pre class="hljs-pre">' + langLabel + '<code class="hljs">' + highlighted + '</code></pre>';
      };
      marked.setOptions({ breaks: true, gfm: true, renderer });

      const preprocessed = preprocessContainers(playgroundInput.value);
      playgroundOutput.innerHTML = marked.parse(preprocessed);
    } catch (e) { playgroundOutput.innerHTML = '<p style="color:red">渲染出错: ' + e.message + '</p>'; }
  }

  if (playgroundInput) {
    playgroundInput.addEventListener('input', renderPlayground);
    playgroundInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = playgroundInput.selectionStart;
        playgroundInput.value = playgroundInput.value.substring(0, s) + '  ' + playgroundInput.value.substring(playgroundInput.selectionEnd);
        playgroundInput.selectionStart = playgroundInput.selectionEnd = s + 2;
        renderPlayground();
      }
    });
    renderPlayground();
  }

  if (playgroundClear) {
    playgroundClear.addEventListener('click', () => {
      playgroundInput.value = '';
      playgroundOutput.innerHTML = '';
      playgroundInput.focus();
    });
  }

  // Tabs click delegation inside playground
  if (playgroundOutput) {
    playgroundOutput.addEventListener('click', (e) => {
      const btn = e.target.closest('.md-tab-btn');
      if (!btn) return;
      const tabs = btn.closest('.md-tabs');
      if (!tabs) return;
      const idx = btn.dataset.idx;
      tabs.querySelectorAll('.md-tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.idx === idx));
      tabs.querySelectorAll('.md-tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.idx === idx));
    });
  }

  /* ==========================================
     Init: Activate sidebar groups for default tab
     ========================================== */
  sidebarGroups.forEach((g) => g.classList.toggle('active', g.dataset.forTab === activeTab));

  /* ==========================================
     Handle URL Hash
     ========================================== */
  function handleHash() {
    const hash = location.hash.replace('#', '');
    if (!hash) return;

    for (const link of navLinks) {
      if (link.dataset.section === hash) {
        const tab = link.closest('.sidebar-group')?.dataset.forTab;
        if (tab && tab !== activeTab) switchTab(tab, false);
        setTimeout(() => navigateToSection(hash), 100);
        return;
      }
    }
  }
  handleHash();

  /* ==========================================
     Emoji Grid: Filter & Copy
     ========================================== */
  const emojiFilterBar = $('#emojiFilterBar');
  const emojiGrid = $('#emojiGrid');
  const emojiToast = $('#emojiToast');

  if (emojiFilterBar) {
    emojiFilterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.emoji-filter-btn');
      if (!btn) return;
      const cat = btn.dataset.cat;
      emojiFilterBar.querySelectorAll('.emoji-filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
      emojiGrid.querySelectorAll('.emoji-item').forEach((item) => {
        item.classList.toggle('hidden', cat !== 'all' && item.dataset.cat !== cat);
      });
    });
  }

  if (emojiGrid) {
    emojiGrid.addEventListener('click', (e) => {
      const item = e.target.closest('.emoji-item');
      if (!item) return;
      const code = item.querySelector('.emoji-code');
      if (!code) return;
      const text = code.textContent;
      navigator.clipboard.writeText(text).catch(() => {});
      if (emojiToast) {
        emojiToast.textContent = '已复制 ' + text;
        emojiToast.classList.add('show');
        setTimeout(() => emojiToast.classList.remove('show'), 1500);
      }
    });
  }
})();
