(async () => {
  const configNode = document.getElementById('site-protection-config');
  const payloadNode = document.getElementById('site-protection-payload');
  const shell = document.getElementById('site-protection-shell');
  const loading = document.getElementById('site-protection-loading');
  const form = document.getElementById('site-protection-form');
  const input = document.getElementById('site-protection-passphrase');
  const toggle = document.getElementById('site-protection-toggle');
  const error = document.getElementById('site-protection-error');
  const gate = document.getElementById('site-protection-gate');
  const content = document.getElementById('site-protection-content');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchHints = document.getElementById('search-hints');
  const searchTrigger = document.getElementById('search-trigger');
  const searchCancel = document.getElementById('search-cancel');
  const searchBox = document.getElementById('search');
  const searchResultWrapper = document.getElementById('search-result-wrapper');
  const sidebarTrigger = document.getElementById('sidebar-trigger');
  const topbarTitle = document.getElementById('topbar-title');
  const mainRows = document.querySelectorAll('#main-wrapper > .container > .row');

  if (!configNode || !payloadNode || !form || !input || !error || !gate || !content || !shell) {
    return;
  }

  const config = JSON.parse(configNode.textContent);
  const payload = JSON.parse(payloadNode.textContent);
  const cacheTtlMs = Number(config.cacheTtlMs) || 3600000;
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  const now = () => Date.now();
  const searchState = {
    bound: false,
    initialized: false,
    loadingPromise: null,
    records: [],
    recordsByUrl: new Map(),
    uiOpen: false
  };
  const searchableBlockSelector = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre code, td, th';
  const classNames = {
    hidden: 'd-none',
    visible: 'd-block',
    flex: 'd-flex'
  };

  const finishLoading = () => {
    shell.classList.remove('is-loading');
    if (loading) {
      loading.hidden = true;
    }
  };

  const escapeHtml = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const normalizeText = (value) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const hashNormalizedText = (value) => {
    const normalized = normalizeText(value);
    let hash = 0x811c9dc5;

    for (let index = 0; index < normalized.length; index += 1) {
      hash ^= normalized.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }

    return hash.toString(16).padStart(8, '0');
  };

  const buildSearchTargetHash = (query, record) => {
    const params = new URLSearchParams();
    params.set('spq', query.trim());
    params.set('spm', record.blockHash);
    params.set('spb', String(record.blockIndex));
    return `#${params.toString()}`;
  };

  const parseSearchTargetHash = () => {
    if (!window.location.hash || !window.location.hash.startsWith('#')) {
      return null;
    }

    const params = new URLSearchParams(window.location.hash.slice(1));
    const query = params.get('spq') || '';
    const matchHash = params.get('spm') || '';
    const blockIndexValue = params.get('spb');
    const blockIndex =
      blockIndexValue !== null && blockIndexValue !== '' && Number.isFinite(Number(blockIndexValue))
        ? Number(blockIndexValue)
        : null;

    if (!query && !matchHash && blockIndex === null) {
      return null;
    }

    return { query, matchHash, blockIndex };
  };

  const getCachedPassphrase = () => {
    try {
      const raw = localStorage.getItem(config.sessionKey);
      if (!raw) {
        return null;
      }

      const cached = JSON.parse(raw);
      if (!cached.passphrase || !cached.expiresAt || cached.expiresAt <= now()) {
        localStorage.removeItem(config.sessionKey);
        return null;
      }

      return cached.passphrase;
    } catch {
      localStorage.removeItem(config.sessionKey);
      return null;
    }
  };

  const setCachedPassphrase = (passphrase) => {
    const payloadValue = {
      passphrase,
      expiresAt: now() + cacheTtlMs
    };

    localStorage.setItem(config.sessionKey, JSON.stringify(payloadValue));
  };

  const clearCachedPassphrase = () => {
    localStorage.removeItem(config.sessionKey);
  };

  const decodeBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

  const runInlineScripts = (root) => {
    root.querySelectorAll('script').forEach((oldScript) => {
      const newScript = document.createElement('script');

      for (const attribute of oldScript.attributes) {
        newScript.setAttribute(attribute.name, attribute.value);
      }

      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  };

  const deriveKey = async (passphrase, salt, iterations) => {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['decrypt']
    );
  };

  const decryptSerializedPayload = async (serializedPayload, passphrase) => {
    const salt = decodeBase64(serializedPayload.salt);
    const iv = decodeBase64(serializedPayload.iv);
    const ciphertext = decodeBase64(serializedPayload.ct);
    const tag = decodeBase64(serializedPayload.tag);
    const encrypted = new Uint8Array(ciphertext.length + tag.length);

    encrypted.set(ciphertext, 0);
    encrypted.set(tag, ciphertext.length);

    const key = await deriveKey(passphrase, salt, serializedPayload.iter);
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encrypted
    );

    return textDecoder.decode(decrypted);
  };

  const setSearchMessage = (message) => {
    if (!searchResults) {
      return;
    }

    searchResults.innerHTML = `<p class="mt-3 text-muted">${escapeHtml(message)}</p>`;
  };

  const openProtectedSearchUi = () => {
    if (searchState.uiOpen) {
      return;
    }

    if (searchResultWrapper) {
      searchResultWrapper.classList.remove(classNames.hidden);
    }

    mainRows.forEach((row) => {
      if (searchResultWrapper && row.contains(searchResultWrapper)) {
        return;
      }

      row.classList.add(classNames.hidden);
    });

    if (sidebarTrigger) {
      sidebarTrigger.classList.add(classNames.hidden);
    }

    if (topbarTitle) {
      topbarTitle.classList.add(classNames.hidden);
    }

    if (searchTrigger) {
      searchTrigger.classList.add(classNames.hidden);
    }

    if (searchBox) {
      searchBox.classList.add(classNames.flex);
    }

    if (searchCancel) {
      searchCancel.classList.add(classNames.visible);
    }

    searchState.uiOpen = true;
  };

  const closeProtectedSearchUi = () => {
    if (searchResultWrapper) {
      searchResultWrapper.classList.add(classNames.hidden);
    }

    mainRows.forEach((row) => {
      row.classList.remove(classNames.hidden);
    });

    if (sidebarTrigger) {
      sidebarTrigger.classList.remove(classNames.hidden);
    }

    if (topbarTitle) {
      topbarTitle.classList.remove(classNames.hidden);
    }

    if (searchTrigger) {
      searchTrigger.classList.remove(classNames.hidden);
    }

    if (searchBox) {
      searchBox.classList.remove(classNames.flex);
    }

    if (searchCancel) {
      searchCancel.classList.remove(classNames.visible);
    }

    searchState.uiOpen = false;
  };

  const highlightMatches = (value, terms) => {
    if (!terms.length) {
      return escapeHtml(value);
    }

    let output = escapeHtml(value);

    terms
      .filter((term) => term.length > 1)
      .sort((left, right) => right.length - left.length)
      .forEach((term) => {
        const pattern = new RegExp(`(${escapeRegex(term)})`, 'ig');
        output = output.replace(pattern, '<mark>$1</mark>');
      });

    return output;
  };

  const getSearchableBlocks = () =>
    Array.from(content.querySelectorAll(searchableBlockSelector)).filter(
      (element) => normalizeText(element.textContent).length > 0
    );

  const blockMatchesQuery = (text, phrase, terms) => {
    const haystack = normalizeText(text);
    if (!haystack) {
      return false;
    }

    if (phrase && haystack.includes(phrase)) {
      return true;
    }

    return terms.length > 0 && terms.every((term) => haystack.includes(term));
  };

  const clearSearchTargetHighlights = () => {
    content.querySelectorAll('.site-search-target').forEach((element) => {
      element.classList.remove('site-search-target');
    });

    content.querySelectorAll('mark.site-search-hit').forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) {
        return;
      }

      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    });
  };

  const highlightTextNodes = (root, terms) => {
    const filteredTerms = Array.from(new Set(terms.filter(Boolean))).sort((left, right) => right.length - left.length);
    if (!filteredTerms.length) {
      return;
    }

    const pattern = new RegExp(`(${filteredTerms.map(escapeRegex).join('|')})`, 'ig');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent || !node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        if (node.parentElement && node.parentElement.closest('mark.site-search-hit')) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const text = node.textContent || '';
      if (!pattern.test(text)) {
        pattern.lastIndex = 0;
        return;
      }

      pattern.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      text.replace(pattern, (match, _group, offset) => {
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const mark = document.createElement('mark');
        mark.className = 'site-search-hit';
        mark.textContent = match;
        fragment.appendChild(mark);
        lastIndex = offset + match.length;
        return match;
      });

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode.replaceChild(fragment, node);
    });
  };

  const resolveSearchTargetElement = ({ query, matchHash, blockIndex }) => {
    const phrase = normalizeText(query);
    const terms = Array.from(new Set(phrase.split(/\s+/).filter(Boolean)));
    const blocks = getSearchableBlocks();

    if (!blocks.length) {
      return null;
    }

    if (Number.isInteger(blockIndex) && blockIndex >= 0 && blockIndex < blocks.length) {
      const indexedBlock = blocks[blockIndex];
      if (
        !matchHash ||
        hashNormalizedText(indexedBlock.textContent) === matchHash ||
        blockMatchesQuery(indexedBlock.textContent, phrase, terms)
      ) {
        return indexedBlock;
      }

      const searchRadius = 4;
      for (let offset = 1; offset <= searchRadius; offset += 1) {
        const candidates = [blockIndex - offset, blockIndex + offset];

        for (const candidateIndex of candidates) {
          if (candidateIndex < 0 || candidateIndex >= blocks.length) {
            continue;
          }

          const candidate = blocks[candidateIndex];
          if (
            (matchHash && hashNormalizedText(candidate.textContent) === matchHash) ||
            blockMatchesQuery(candidate.textContent, phrase, terms)
          ) {
            return candidate;
          }
        }
      }
    }

    if (matchHash) {
      const exactMatch = blocks.find((element) => hashNormalizedText(element.textContent) === matchHash);
      if (exactMatch) {
        return exactMatch;
      }
    }

    const contentMatches = blocks.filter((element) => blockMatchesQuery(element.textContent, phrase, terms));
    if (!contentMatches.length) {
      return null;
    }

    return contentMatches[0];
  };

  const revealSearchTargetFromLocation = () => {
    const target = parseSearchTargetHash();
    if (!target) {
      return;
    }

    const searchTargetElement = resolveSearchTargetElement(target);
    if (!searchTargetElement) {
      return;
    }

    clearSearchTargetHighlights();
    searchTargetElement.classList.add('site-search-target');
    highlightTextNodes(
      searchTargetElement,
      Array.from(new Set(normalizeText(target.query).split(/\s+/).filter(Boolean)))
    );

    const scrollTarget =
      searchTargetElement.closest('figure.highlight') ||
      searchTargetElement.closest('.highlight') ||
      searchTargetElement.closest('pre') ||
      searchTargetElement;

    requestAnimationFrame(() => {
      scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const buildSnippet = (record, phrase, terms) => {
    const neighbors = searchState.recordsByUrl.get(record.url) || [];
    const currentIndex = neighbors.findIndex(
      (candidate) => candidate.blockIndex === record.blockIndex && candidate.content === record.content
    );
    const snippetParts = [];
    const seen = new Set();
    const targetLength = 640;
    const minimumLength = 420;

    const insertPart = (value, position = 'end') => {
      const cleaned = String(value || '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned || seen.has(cleaned)) {
        return;
      }

      seen.add(cleaned);

      if (position === 'start') {
        snippetParts.unshift(cleaned);
        return;
      }

      snippetParts.push(cleaned);
    };

    const currentLength = () => snippetParts.join(' ').length;

    insertPart(record.content);

    if (currentIndex !== -1) {
      for (let offset = 1; offset <= 8; offset += 1) {
        const next = neighbors[currentIndex + offset];
        if (next) {
          insertPart(next.content, 'end');
        }

        if (currentLength() >= targetLength) {
          break;
        }

        const previous = neighbors[currentIndex - offset];
        if (previous) {
          insertPart(previous.content, 'start');
        }

        if (currentLength() >= targetLength) {
          break;
        }
      }
    }

    const source = snippetParts.join(' ').replace(/\s+/g, ' ').trim() || record.content || '';
    const haystack = normalizeText(source);
    const matchNeedles = [phrase, ...terms].filter(Boolean);
    let matchIndex = -1;
    let matchedLength = 0;

    for (const needle of matchNeedles) {
      const currentIndex = haystack.indexOf(needle);
      if (currentIndex !== -1) {
        matchIndex = currentIndex;
        matchedLength = needle.length;
        break;
      }
    }

    if (matchIndex === -1) {
      return source.slice(0, 520).trim();
    }

    const beforeContext = 200;
    const afterContext = 280;
    let start = Math.max(0, matchIndex - beforeContext);
    let end = Math.min(source.length, matchIndex + matchedLength + afterContext);

    if (end - start < minimumLength) {
      const missing = minimumLength - (end - start);
      const extendBefore = Math.floor(missing / 2);
      const extendAfter = missing - extendBefore;
      start = Math.max(0, start - extendBefore);
      end = Math.min(source.length, end + extendAfter);
    }

    let snippet = source.slice(start, end).trim();

    if (start > 0) {
      snippet = `...${snippet}`;
    }

    if (end < source.length) {
      snippet = `${snippet}...`;
    }

    return snippet;
  };

  const rankRecords = (query) => {
    const phrase = normalizeText(query);
    const terms = Array.from(new Set(phrase.split(/\s+/).filter(Boolean)));

    if (!phrase || !terms.length) {
      return [];
    }

    return searchState.records
      .map((record) => {
        const contentMatchesPhrase = phrase && record.contentNorm.includes(phrase);
        const contentTermMatches = terms.filter((term) => record.contentNorm.includes(term));

        if (!contentMatchesPhrase && contentTermMatches.length === 0) {
          return null;
        }

        let score = 0;

        if (record.titleNorm.includes(phrase)) {
          score += 240;
        }

        if (record.categoriesNorm.includes(phrase) || record.tagsNorm.includes(phrase)) {
          score += 140;
        }

        if (contentMatchesPhrase) {
          score += 160;
        }

        contentTermMatches.forEach((term) => {
          if (record.titleNorm.includes(term)) {
            score += 55;
          }

          if (record.categoriesNorm.includes(term) || record.tagsNorm.includes(term)) {
            score += 30;
          }

          if (record.contentNorm.includes(term)) {
            score += 12;
          }
        });

        if (contentTermMatches.length === terms.length) {
          score += 45;
        }

        if (record.url === window.location.pathname) {
          score -= 10;
        }

        return {
          score,
          record
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score)
      .slice(0, 50);
  };

  const renderSearchResults = (query) => {
    if (!searchResults) {
      return;
    }

    const normalizedQuery = normalizeText(query);
    const terms = Array.from(new Set(normalizedQuery.split(/\s+/).filter(Boolean)));

    if (!normalizedQuery) {
      closeProtectedSearchUi();
      searchResults.innerHTML = '';
      if (searchHints) {
        searchHints.classList.remove('d-none');
      }
      return;
    }

    if (searchHints) {
      searchHints.classList.add('d-none');
    }

    openProtectedSearchUi();

    if (!searchState.initialized) {
      setSearchMessage('Loading encrypted search index...');
      return;
    }

    const ranked = rankRecords(query);

    if (!ranked.length) {
      searchResults.innerHTML = '<p class="mt-5">Oops! No results found.</p>';
      return;
    }

    searchResults.innerHTML = ranked
      .map(({ record }) => {
        const href = `${record.url}${buildSearchTargetHash(query, record)}`;
        const categories = record.categories
          ? `<div class="me-sm-4"><i class="far fa-folder fa-fw"></i>${highlightMatches(record.categories, terms)}</div>`
          : '';
        const tags = record.tags
          ? `<div><i class="fa fa-tag fa-fw"></i>${highlightMatches(record.tags, terms)}</div>`
          : '';

        return `
          <article class="site-search-result px-1 px-sm-2 px-lg-4 px-xl-0">
            <a class="site-search-result-link" data-protected-search-result="true" href="${escapeHtml(href)}">
              <header>
                <h2 class="site-search-result-title">${highlightMatches(record.title, terms)}</h2>
              </header>
              <div class="post-meta d-flex flex-column flex-sm-row text-muted mt-1 mb-1">
                ${categories} ${tags}
              </div>
              <p class="site-search-result-snippet mb-0">${highlightMatches(buildSnippet(record, normalizedQuery, terms), terms)}</p>
            </a>
          </article>
        `;
      })
      .join('');
  };

  const bindProtectedSearch = () => {
    if (searchState.bound || !searchInput || !searchResults) {
      return;
    }

    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => {
        openProtectedSearchUi();
        searchInput.focus();
      });
    }

    if (searchCancel) {
      searchCancel.addEventListener('click', () => {
        searchInput.value = '';
        if (searchResults) {
          searchResults.innerHTML = '';
        }
        if (searchHints) {
          searchHints.classList.remove(classNames.hidden);
        }
        closeProtectedSearchUi();
      });
    }

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim() !== '') {
        openProtectedSearchUi();
      }
    });

    searchInput.addEventListener('input', () => {
      renderSearchResults(searchInput.value);
    });

    searchResults.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-protected-search-result="true"]');
      if (!link) {
        return;
      }

      const targetUrl = new URL(link.href, window.location.origin);
      if (targetUrl.pathname !== window.location.pathname) {
        return;
      }

      event.preventDefault();
      closeProtectedSearchUi();
      window.location.hash = targetUrl.hash;
      revealSearchTargetFromLocation();
    });

    window.addEventListener('hashchange', () => {
      if (document.body.classList.contains('site-unlocked')) {
        revealSearchTargetFromLocation();
      }
    });

    searchState.bound = true;
  };

  const initializeProtectedSearch = async (passphrase) => {
    if (!config.searchIndexPath || !searchInput || !searchResults) {
      return;
    }

    bindProtectedSearch();

    if (searchState.initialized) {
      renderSearchResults(searchInput.value);
      return;
    }

    if (!searchState.loadingPromise) {
      searchState.loadingPromise = (async () => {
        const response = await fetch(config.searchIndexPath, { credentials: 'same-origin' });
        if (!response.ok) {
          throw new Error(`Failed to fetch search index: ${response.status}`);
        }

        const encryptedIndex = await response.json();
        const decryptedIndex = await decryptSerializedPayload(encryptedIndex, passphrase);
        const records = JSON.parse(decryptedIndex);

        searchState.records = records.map((record) => ({
          ...record,
          blockHash: record.block_hash || record.blockHash || '',
          blockIndex: Number(record.block_index ?? record.blockIndex ?? -1),
          titleNorm: normalizeText(record.title),
          categoriesNorm: normalizeText(record.categories),
          tagsNorm: normalizeText(record.tags),
          contentNorm: normalizeText(record.content)
        }));
        searchState.recordsByUrl = searchState.records.reduce((map, record) => {
          const collection = map.get(record.url) || [];
          collection.push(record);
          map.set(record.url, collection);
          return map;
        }, new Map());
        searchState.recordsByUrl.forEach((collection, url) => {
          collection.sort((left, right) => left.blockIndex - right.blockIndex);
          searchState.recordsByUrl.set(url, collection);
        });
        searchState.initialized = true;
      })();
    }

    try {
      await searchState.loadingPromise;
      renderSearchResults(searchInput.value);
    } catch (searchError) {
      console.error(searchError);
      setSearchMessage('Search index could not be loaded.');
    }
  };

  const unlock = async (passphrase) => {
    const html = await decryptSerializedPayload(payload, passphrase);
    content.innerHTML = html;
    runInlineScripts(content);
    gate.hidden = true;
    content.hidden = false;
    document.body.classList.add('site-unlocked');
    await initializeProtectedSearch(passphrase);
    revealSearchTargetFromLocation();
    document.dispatchEvent(
      new CustomEvent('site-protection:unlocked', {
        detail: { passphrase }
      })
    );
  };

  const tryUnlock = async (passphrase, { silent = false, persist = true } = {}) => {
    try {
      await unlock(passphrase);
      if (persist) {
        setCachedPassphrase(passphrase);
      } else {
        clearCachedPassphrase();
      }
      error.hidden = true;
      error.textContent = '';
      finishLoading();
      return true;
    } catch {
      if (!silent) {
        error.hidden = false;
        error.textContent = 'Invalid passphrase.';
      }

      clearCachedPassphrase();
      return false;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await tryUnlock(input.value, { persist: true });
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      const nextType = input.type === 'password' ? 'text' : 'password';
      input.type = nextType;
      const isVisible = nextType === 'text';
      toggle.textContent = isVisible ? 'Hide' : 'Show';
      toggle.setAttribute('aria-label', isVisible ? 'Hide passphrase' : 'Show passphrase');
      toggle.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
    });
  }

  const storedPassphrase = getCachedPassphrase();

  if (storedPassphrase) {
    input.value = storedPassphrase;
    const unlocked = await tryUnlock(storedPassphrase, { silent: true, persist: true });

    if (!unlocked) {
      input.value = '';
      input.focus();
      finishLoading();
    }
  } else {
    bindProtectedSearch();
    finishLoading();
    input.focus();
  }
})();
