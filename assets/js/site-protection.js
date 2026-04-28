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
    records: []
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

  const buildSnippet = (record, phrase, terms) => {
    const source = record.content || '';
    const haystack = record.contentNorm || '';
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
      return source.slice(0, 220).trim();
    }

    const contextRadius = 90;
    const start = Math.max(0, matchIndex - contextRadius);
    const end = Math.min(source.length, matchIndex + matchedLength + contextRadius);
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
        const combined = `${record.titleNorm} ${record.categoriesNorm} ${record.tagsNorm} ${record.contentNorm}`;
        const fullPhraseMatch = combined.includes(phrase);
        const termMatches = terms.filter((term) => combined.includes(term));

        if (!fullPhraseMatch && termMatches.length === 0) {
          return null;
        }

        let score = 0;

        if (record.titleNorm.includes(phrase)) {
          score += 240;
        }

        if (record.categoriesNorm.includes(phrase) || record.tagsNorm.includes(phrase)) {
          score += 140;
        }

        if (record.contentNorm.includes(phrase)) {
          score += 80;
        }

        termMatches.forEach((term) => {
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

        if (termMatches.length === terms.length) {
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
      searchResults.innerHTML = '';
      if (searchHints) {
        searchHints.classList.remove('d-none');
      }
      return;
    }

    if (searchHints) {
      searchHints.classList.add('d-none');
    }

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
        const categories = record.categories
          ? `<div class="me-sm-4"><i class="far fa-folder fa-fw"></i>${highlightMatches(record.categories, terms)}</div>`
          : '';
        const tags = record.tags
          ? `<div><i class="fa fa-tag fa-fw"></i>${highlightMatches(record.tags, terms)}</div>`
          : '';

        return `
          <article class="px-1 px-sm-2 px-lg-4 px-xl-0">
            <header>
              <h2><a href="${escapeHtml(record.url)}">${highlightMatches(record.title, terms)}</a></h2>
              <div class="post-meta d-flex flex-column flex-sm-row text-muted mt-1 mb-1">
                ${categories} ${tags}
              </div>
            </header>
            <p>${highlightMatches(buildSnippet(record, normalizedQuery, terms), terms)}</p>
          </article>
        `;
      })
      .join('');
  };

  const bindProtectedSearch = () => {
    if (searchState.bound || !searchInput || !searchResults) {
      return;
    }

    searchInput.addEventListener('input', () => {
      renderSearchResults(searchInput.value);
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
          titleNorm: normalizeText(record.title),
          categoriesNorm: normalizeText(record.categories),
          tagsNorm: normalizeText(record.tags),
          contentNorm: normalizeText(record.content)
        }));
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
