(async () => {
  const configNode = document.getElementById('site-protection-config');
  const payloadNode = document.getElementById('site-protection-payload');
  const form = document.getElementById('site-protection-form');
  const input = document.getElementById('site-protection-passphrase');
  const error = document.getElementById('site-protection-error');
  const gate = document.getElementById('site-protection-gate');
  const content = document.getElementById('site-protection-content');

  if (!configNode || !payloadNode || !form || !input || !error || !gate || !content) {
    return;
  }

  const config = JSON.parse(configNode.textContent);
  const payload = JSON.parse(payloadNode.textContent);
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

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
    sessionStorage.setItem(config.sessionKey, passphrase);
    content.innerHTML = html;
    runInlineScripts(content);
    gate.hidden = true;
    content.hidden = false;
    document.dispatchEvent(new CustomEvent('site-protection:unlocked'));
  };

  const tryUnlock = async (passphrase, { silent = false } = {}) => {
    try {
      await unlock(passphrase);
      error.hidden = true;
      error.textContent = '';
      return true;
    } catch {
      if (!silent) {
        error.hidden = false;
        error.textContent = 'Invalid passphrase.';
      }

      sessionStorage.removeItem(config.sessionKey);
      return false;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await tryUnlock(input.value);
  });

  const storedPassphrase = sessionStorage.getItem(config.sessionKey);

  if (storedPassphrase) {
    input.value = storedPassphrase;
    const unlocked = await tryUnlock(storedPassphrase, { silent: true });

    if (!unlocked) {
      input.value = '';
      input.focus();
    }
  } else {
    input.focus();
  }
})();
