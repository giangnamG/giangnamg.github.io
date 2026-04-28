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

  if (!configNode || !payloadNode || !form || !input || !error || !gate || !content || !shell) {
    return;
  }

  const config = JSON.parse(configNode.textContent);
  const payload = JSON.parse(payloadNode.textContent);
  const cacheTtlMs = Number(config.cacheTtlMs) || 3600000;
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  const now = () => Date.now();

  const finishLoading = () => {
    shell.classList.remove('is-loading');
    if (loading) {
      loading.hidden = true;
    }
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

  const decryptPayload = async (passphrase) => {
    const salt = decodeBase64(payload.salt);
    const iv = decodeBase64(payload.iv);
    const ciphertext = decodeBase64(payload.ct);
    const tag = decodeBase64(payload.tag);
    const encrypted = new Uint8Array(ciphertext.length + tag.length);

    encrypted.set(ciphertext, 0);
    encrypted.set(tag, ciphertext.length);

    const key = await deriveKey(passphrase, salt, payload.iter);
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

  const unlock = async (passphrase) => {
    const html = await decryptPayload(passphrase);
    content.innerHTML = html;
    runInlineScripts(content);
    gate.hidden = true;
    content.hidden = false;
    document.dispatchEvent(new CustomEvent('site-protection:unlocked'));
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
    finishLoading();
    input.focus();
  }
})();
