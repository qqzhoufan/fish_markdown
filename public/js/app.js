(function () {
  'use strict';

  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default' });
  }

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
     Playground — Utility
     ========================================== */
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function highlightCode(text, lang) {
    if (lang && typeof hljs !== 'undefined' && hljs.getLanguage(lang)) {
      return hljs.highlight(text, { language: lang }).value;
    }
    if (typeof hljs !== 'undefined') return hljs.highlightAuto(text).value;
    return escHtml(text);
  }

  function parseMarkdownInner(text) {
    if (typeof marked === 'undefined') return text;
    return marked.parse(text);
  }

  /* ==========================================
     Playground — Code Block Protection
     ========================================== */
  function protectCodeBlocks(text) {
    const saved = [];
    let idx = 0;
    text = text.replace(/(`{3,})([^\n]*)\n([\s\S]*?)\1/g, (m) => {
      const t = '\x00CB' + (idx++) + '\x00';
      saved.push({ t, m });
      return t;
    });
    text = text.replace(/`([^`\n]+)`/g, (m) => {
      const t = '\x00IC' + (idx++) + '\x00';
      saved.push({ t, m });
      return t;
    });
    return { text, saved };
  }
  function restoreCodeBlocks(text, saved) {
    saved.forEach(({ t, m }) => { text = text.split(t).join(m); });
    return text;
  }

  /* ==========================================
     Playground — Inline Syntax Extensions
     ==highlight==  ^superscript^  ~subscript~
     ========================================== */
  function preprocessInlineSyntax(text) {
    const { text: safe, saved } = protectCodeBlocks(text);
    let out = safe;
    out = out.replace(/==(?!\s)([^=\n]+?)(?<!\s)==/g, '<mark>$1</mark>');
    out = out.replace(/\^(?!\s)([^\^\n]+?)(?<!\s)\^/g, '<sup>$1</sup>');
    out = out.replace(/(?<!\~)\~(?!\~)(?!\s)([^\~\n]+?)(?<!\s)(?<!\~)\~(?!\~)/g, '<sub>$1</sub>');
    return restoreCodeBlocks(out, saved);
  }

  /* ==========================================
     Playground — Footnotes [^1]
     ========================================== */
  function preprocessFootnotes(text) {
    const defs = {};
    let counter = 0;
    const cleaned = text.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (_, id, content) => {
      counter++;
      defs[id] = { idx: counter, content: content.trim() };
      return '';
    });
    if (counter === 0) return text;
    let result = cleaned.replace(/\[\^([^\]]+)\]/g, (match, id) => {
      const def = defs[id];
      if (!def) return match;
      return '<sup class="md-fn-ref"><a href="#fn-' + id + '" id="fnref-' + id + '">[' + def.idx + ']</a></sup>';
    });
    if (counter > 0) {
      result += '\n<hr class="md-fn-sep"><section class="md-footnotes"><ol>';
      Object.entries(defs).forEach(([id, d]) => {
        result += '<li id="fn-' + id + '">' + d.content + ' <a href="#fnref-' + id + '">↩</a></li>';
      });
      result += '</ol></section>';
    }
    return result;
  }

  /* ==========================================
     Playground — Definition Lists
     ========================================== */
  function preprocessDefinitionLists(text) {
    const lines = text.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      if (i + 1 < lines.length && /^:\s+/.test(lines[i + 1]) && lines[i].trim() !== '') {
        let html = '<dl class="md-deflist">';
        while (i < lines.length) {
          if (lines[i].trim() === '' && (i + 1 >= lines.length || !/^:\s+/.test(lines[i + 1]))) break;
          if (lines[i].trim() === '') { i++; continue; }
          if (/^:\s+/.test(lines[i])) {
            html += '<dd>' + lines[i].replace(/^:\s+/, '') + '</dd>';
          } else {
            html += '<dt>' + lines[i].trim() + '</dt>';
          }
          i++;
        }
        html += '</dl>';
        out.push(html);
      } else {
        out.push(lines[i]);
        i++;
      }
    }
    return out.join('\n');
  }

  /* ==========================================
     Playground — Abbreviations *[ABBR]: Full
     ========================================== */
  function preprocessAbbreviations(text) {
    const abbrs = {};
    const cleaned = text.replace(/^\*\[([^\]]+)\]:\s*(.+)$/gm, (_, abbr, full) => {
      abbrs[abbr] = full.trim();
      return '';
    });
    if (Object.keys(abbrs).length === 0) return text;
    return { text: cleaned, abbrs };
  }
  function applyAbbreviations(html, abbrs) {
    if (!abbrs || Object.keys(abbrs).length === 0) return html;
    Object.entries(abbrs).forEach(([abbr, full]) => {
      const re = new RegExp('\\b(' + abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'g');
      html = html.replace(re, '<abbr title="' + escHtml(full) + '">$1</abbr>');
    });
    return html;
  }

  /* ==========================================
     Playground — Math (KaTeX)
     ========================================== */
  let mathPlaceholders = [];
  function preprocessMath(text) {
    mathPlaceholders = [];
    const { text: safe, saved } = protectCodeBlocks(text);
    let out = safe;
    let idx = 0;
    out = out.replace(/\$\$([^$]+?)\$\$/gs, (_, math) => {
      const token = '%%MATHBLOCK' + (idx++) + '%%';
      try {
        mathPlaceholders.push({ token, html: katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }) });
      } catch(e) {
        mathPlaceholders.push({ token, html: '<span style="color:red">' + escHtml(e.message) + '</span>' });
      }
      return token;
    });
    out = out.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (_, math) => {
      const token = '%%MATHINLINE' + (idx++) + '%%';
      try {
        mathPlaceholders.push({ token, html: katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }) });
      } catch(e) {
        mathPlaceholders.push({ token, html: '<span style="color:red">' + escHtml(e.message) + '</span>' });
      }
      return token;
    });
    return restoreCodeBlocks(out, saved);
  }
  function restoreMath(html) {
    mathPlaceholders.forEach(({ token, html: rendered }) => {
      html = html.split(token).join(rendered);
    });
    return html;
  }

  /* ==========================================
     Playground — GitHub Alerts
     > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
     ========================================== */
  const ALERT_ICONS = { NOTE:'ℹ️', TIP:'💡', IMPORTANT:'❗', WARNING:'⚠️', CAUTION:'🔴' };
  function preprocessAlerts(text) {
    return text.replace(/^(> *)\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gm, (_, _q, type, body) => {
      const clean = body.replace(/^>\s?/gm, '').trim();
      const icon = ALERT_ICONS[type] || '';
      const parsed = parseMarkdownInner(clean);
      return '<div class="md-alert md-alert-' + type.toLowerCase() + '">'
        + '<div class="md-alert-title">' + icon + ' ' + type + '</div>'
        + '<div class="md-alert-body">' + parsed + '</div></div>\n';
    });
  }

  /* ==========================================
     Playground — TOC  [TOC]
     ========================================== */
  function generateTOC(html) {
    const re = /<h([1-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
    const headings = [];
    let m;
    while ((m = re.exec(html)) !== null) {
      headings.push({ level: +m[1], id: m[2], text: m[3].replace(/<[^>]+>/g, '') });
    }
    if (headings.length === 0) {
      const re2 = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
      while ((m = re2.exec(html)) !== null) {
        const slug = m[2].replace(/<[^>]+>/g, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
        headings.push({ level: +m[1], id: slug, text: m[2].replace(/<[^>]+>/g, '') });
      }
    }
    if (headings.length === 0) return '';
    let toc = '<nav class="md-toc"><div class="md-toc-title">📑 目录</div><ul>';
    headings.forEach(h => {
      toc += '<li style="margin-left:' + ((h.level - 1) * 1) + 'em"><a href="#' + h.id + '">' + h.text + '</a></li>';
    });
    toc += '</ul></nav>';
    return toc;
  }

  /* ==========================================
     Playground — Container & Tabs Preprocessor
     ========================================== */
  const CONTAINER_ICONS = { tip:'💡', warning:'⚠️', danger:'🔴', info:'ℹ️', note:'📝', success:'✅', details:'📂' };
  const CONTAINER_TYPES = new Set(Object.keys(CONTAINER_ICONS));

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
     Playground — Emoji Shortcode Map
     ========================================== */
  const EMOJI_MAP = {
    grinning:'😀',smiley:'😃',smile:'😄',grin:'😁',laughing:'😆',sweat_smile:'😅',
    rofl:'🤣',joy:'😂',slightly_smiling_face:'🙂',wink:'😉',blush:'😊',innocent:'😇',
    heart_eyes:'😍',kissing_heart:'😘',stuck_out_tongue_winking_eye:'😜',thinking:'🤔',
    hugs:'🤗',sunglasses:'😎',star_struck:'🤩',smirk:'😏',cry:'😢',sob:'😭',
    scream:'😱',rage:'😡',pleading_face:'🥺',sleeping:'😴',vomiting_face:'🤮',
    clown_face:'🤡',skull:'💀',poop:'💩',ghost:'👻',alien:'👽',robot:'🤖',
    smiling_face_with_three_hearts:'🥰',yum:'😋',stuck_out_tongue:'😛',
    zipper_mouth_face:'🤐',raised_eyebrow:'🤨',neutral_face:'😐',expressionless:'😑',
    no_mouth:'😶',rolling_eyes:'🙄',grimacing:'😬',lying_face:'🤥',relieved:'😌',
    pensive:'😔',sleepy:'😪',drooling_face:'🤤',cold_sweat:'😰',disappointed:'😞',
    worried:'😟',angry:'😠',cursing_face:'🤬',confused:'😕',flushed:'😳',
    dizzy_face:'😵',exploding_head:'🤯',shushing_face:'🤫',mask:'😷',nerd_face:'🤓',
    monocle_face:'🧐',partying_face:'🥳',woozy_face:'🥴',hot_face:'🥵',cold_face:'🥶',

    thumbsup:'👍','+1':'👍',thumbsdown:'👎','-1':'👎',clap:'👏',raised_hands:'🙌',
    handshake:'🤝',v:'✌️',crossed_fingers:'🤞',ok_hand:'👌',wave:'👋',muscle:'💪',
    pray:'🙏',point_up:'☝️',point_up_2:'👆',point_down:'👇',point_left:'👈',
    point_right:'👉',fist:'✊',raised_hand:'✋',middle_finger:'🖕',
    writing_hand:'✍️',eyes:'👀',eye:'👁️',tongue:'👅',lips:'👄',

    baby:'👶',boy:'👦',girl:'👧',man:'👨',woman:'👩',older_man:'👴',older_woman:'👵',
    cop:'👮',construction_worker:'👷',guardsman:'💂',detective:'🕵️',
    angel:'👼',santa:'🎅',princess:'👸',prince:'🤴',superhero:'🦸',

    dog:'🐶',cat:'🐱',mouse:'🐭',rabbit:'🐰',fox_face:'🦊',bear:'🐻',panda_face:'🐼',
    frog:'🐸',monkey_face:'🐵',see_no_evil:'🙈',hear_no_evil:'🙉',speak_no_evil:'🙊',
    chicken:'🐔',penguin:'🐧',bird:'🐦',eagle:'🦅',duck:'🦆',owl:'🦉',bat:'🦇',
    wolf:'🐺',horse:'🐴',unicorn:'🦄',bee:'🐝',bug:'🐛',butterfly:'🦋',snail:'🐌',
    octopus:'🐙',fish:'🐟',dolphin:'🐬',whale:'🐳',shark:'🦈',turtle:'🐢',
    snake:'🐍',dragon:'🐉',dinosaur:'🦕',crab:'🦀',spider:'🕷️',scorpion:'🦂',

    cherry_blossom:'🌸',rose:'🌹',sunflower:'🌻',tulip:'🌷',seedling:'🌱',
    evergreen_tree:'🌲',deciduous_tree:'🌳',palm_tree:'🌴',cactus:'🌵',
    rainbow:'🌈',sunny:'☀️',cloud:'☁️',snowflake:'❄️',zap:'⚡',fire:'🔥',
    droplet:'💧',ocean:'🌊',star:'⭐',star2:'🌟',crescent_moon:'🌙',
    sun_with_face:'🌞',full_moon:'🌕',earth_africa:'🌍',earth_americas:'🌎',
    earth_asia:'🌏',volcano:'🌋',milky_way:'🌌',

    apple:'🍎',green_apple:'🍏',tangerine:'🍊',lemon:'🍋',watermelon:'🍉',
    grapes:'🍇',strawberry:'🍓',peach:'🍑',cherry:'🍒',banana:'🍌',pineapple:'🍍',
    pizza:'🍕',hamburger:'🍔',fries:'🍟',hotdog:'🌭',taco:'🌮',burrito:'🌯',
    egg:'🥚',cake:'🍰',cookie:'🍪',chocolate_bar:'🍫',candy:'🍬',ice_cream:'🍨',
    coffee:'☕',tea:'🍵',beer:'🍺',wine_glass:'🍷',cocktail:'🍸',cupcake:'🧁',

    soccer:'⚽',basketball:'🏀',football:'🏈',baseball:'⚾',tennis:'🎾',
    volleyball:'🏐',ping_pong:'🏓',badminton:'🏸',golf:'⛳',ski:'🎿',
    video_game:'🎮',dart:'🎯',game_die:'🎲',trophy:'🏆',medal_sports:'🏅',
    '1st_place_medal':'🥇','2nd_place_medal':'🥈','3rd_place_medal':'🥉',
    circus_tent:'🎪',clapper:'🎬',musical_note:'🎵',notes:'🎶',
    tada:'🎉',confetti_ball:'🎊',balloon:'🎈',gift:'🎁',sparkles:'✨',
    art:'🎨',microphone:'🎤',headphones:'🎧',guitar:'🎸',drum:'🥁',

    car:'🚗',taxi:'🚕',bus:'🚌',ambulance:'🚑',fire_engine:'🚒',police_car:'🚓',
    truck:'🚚',bike:'🚲',rocket:'🚀',airplane:'✈️',helicopter:'🚁',
    ship:'🚢',boat:'⛵',anchor:'⚓',house:'🏠',office:'🏢',hospital:'🏥',
    school:'🏫',church:'⛪',mountain:'⛰️',camping:'🏕️',world_map:'🗺️',
    statue_of_liberty:'🗽',japan:'🗾',

    computer:'💻',iphone:'📱',keyboard:'⌨️',desktop_computer:'🖥️',printer:'🖨️',
    bulb:'💡',camera:'📷',video_camera:'📹',key:'🔑',lock:'🔒',unlock:'🔓',
    bell:'🔔',bookmark:'🔖',link:'🔗',memo:'📝',books:'📚',book:'📖',
    package:'📦',postbox:'📮',email:'📧',envelope:'✉️',wrench:'🔧',hammer:'🔨',
    gear:'⚙️',shield:'🛡️',bomb:'💣',hourglass:'⌛',alarm_clock:'⏰',
    mag:'🔍',microscope:'🔬',telescope:'🔭',clipboard:'📋',pushpin:'📌',
    paperclip:'📎',scissors:'✂️',pen:'🖊️',pencil2:'✏️',file_folder:'📁',
    calendar:'📅',chart_with_upwards_trend:'📈',bar_chart:'📊',trophy:'🏆',

    heart:'❤️',orange_heart:'🧡',yellow_heart:'💛',green_heart:'💚',blue_heart:'💙',
    purple_heart:'💜',black_heart:'🖤',broken_heart:'💔',heavy_heart_exclamation:'❣️',
    '100':'💯',white_check_mark:'✅',x:'❌',o:'⭕',exclamation:'❗',question:'❓',
    warning:'⚠️',no_entry_sign:'🚫',recycle:'♻️',red_circle:'🔴',orange_circle:'🟠',
    green_circle:'🟢',blue_circle:'🔵',white_circle:'⚪',black_circle:'⚫',
    arrow_up:'⬆️',arrow_down:'⬇️',arrow_left:'⬅️',arrow_right:'➡️',
    arrow_upper_right:'↗️',arrow_lower_right:'↘️',
    information_source:'ℹ️',heavy_check_mark:'✔️',heavy_multiplication_x:'✖️',
    heavy_plus_sign:'➕',heavy_minus_sign:'➖',wavy_dash:'〰️',
    copyright:'©️',registered:'®️',tm:'™️',

    white_flag:'🏳️',black_flag:'🏴',triangular_flag_on_post:'🚩',
    cn:'🇨🇳',us:'🇺🇸',jp:'🇯🇵',gb:'🇬🇧',kr:'🇰🇷',fr:'🇫🇷',de:'🇩🇪',
    it:'🇮🇹',es:'🇪🇸',ru:'🇷🇺',br:'🇧🇷',au:'🇦🇺',ca:'🇨🇦',in:'🇮🇳',
  };

  function replaceEmojiShortcodes(text) {
    const { text: safe, saved } = protectCodeBlocks(text);
    const out = safe.replace(/:([a-zA-Z0-9_+-]+):/g, (match, code) => {
      return EMOJI_MAP[code] || match;
    });
    return restoreCodeBlocks(out, saved);
  }

  /* ==========================================
     Playground — Render
     ========================================== */
  let mermaidCounter = 0;
  let renderSeq = 0;
  function renderPlayground() {
    mermaidCounter = 0;
    renderSeq++;
    if (!playgroundInput || !playgroundOutput || typeof marked === 'undefined') return;
    try {
      const renderer = new marked.Renderer();
      renderer.code = function({ text, lang }) {
        if (lang === 'mermaid') {
          const id = 'mmd-r' + renderSeq + '-' + (mermaidCounter++);
          return '<div class="md-mermaid" id="' + id + '">' + escHtml(text) + '</div>';
        }
        const highlighted = highlightCode(text, lang);
        const langLabel = lang ? '<div class="code-lang-label">' + lang + '</div>' : '';
        return '<pre class="hljs-pre">' + langLabel + '<code class="hljs">' + highlighted + '</code></pre>';
      };
      marked.setOptions({ breaks: true, gfm: true, renderer });

      let text = playgroundInput.value;
      text = replaceEmojiShortcodes(text);

      const abbrResult = preprocessAbbreviations(text);
      let abbrs = null;
      if (abbrResult && abbrResult.abbrs) { text = abbrResult.text; abbrs = abbrResult.abbrs; }

      const hasMath = typeof katex !== 'undefined' && (/\$\$.+?\$\$/s.test(text) || /\$[^$\n]+?\$/.test(text));
      if (hasMath) text = preprocessMath(text);

      text = preprocessAlerts(text);
      text = preprocessFootnotes(text);
      text = preprocessDefinitionLists(text);
      text = preprocessInlineSyntax(text);
      text = preprocessContainers(text);

      const hasToc = /\[TOC\]/i.test(text);
      text = text.replace(/\[TOC\]/gi, '%%TOC_PLACEHOLDER%%');

      let html = marked.parse(text);

      if (hasMath) html = restoreMath(html);
      if (abbrs) html = applyAbbreviations(html, abbrs);
      if (hasToc) {
        const toc = generateTOC(html);
        html = html.split('%%TOC_PLACEHOLDER%%').join(toc || '<p><em>（未检测到标题）</em></p>');
      }

      playgroundOutput.innerHTML = html;

      if (typeof mermaid !== 'undefined') {
        const mmdEls = playgroundOutput.querySelectorAll('.md-mermaid');
        const seq = renderSeq;
        mmdEls.forEach(async (el, i) => {
          if (seq !== renderSeq) return;
          try {
            const rid = 'mmd-svg-' + seq + '-' + i;
            const { svg } = await mermaid.render(rid, el.textContent);
            if (seq === renderSeq) el.innerHTML = svg;
          } catch (e) {
            if (seq === renderSeq) el.innerHTML = '<p style="color:#ef4444;font-size:.85em">Mermaid 渲染失败: ' + escHtml(e.message) + '</p>';
          }
        });
      }
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
