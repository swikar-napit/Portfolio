/* Suri — Swikar's portfolio AI assistant (front-end). Injects its own markup; no HTML edits needed. */
(() => {
  const CONFIG = {
    // After deploying api/chat.js to Vercel, put its URL here (or "/api/chat" if the portfolio is on the same Vercel project).
    endpoint: "https://www.swikarnapit.com.np/api/ask",
    name: "Suri",
    greeting: "Hi! I'm Suri, an AI assistant. Curious about Swikar's work? Feel free to ask!",
    suggestions: ["Tell me about Swikar", "What has Swikar built?", "What's Swikar's tech stack?", "How can I contact Swikar?"],
    maxHistory: 10,
    maxChars: 500,
    storageKey: "swikar-ai-chat"
  };

  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)"]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(^|\s)(https?:\/\/[^\s<)"]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  }

  // Tiny, safe markdown: paragraphs, bullet lists, bold, code, links. Input is HTML-escaped first.
  function renderMd(text) {
    let html = "", list = false;
    for (const raw of esc(text).split("\n")) {
      const li = raw.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
      if (li) {
        if (!list) { html += "<ul>"; list = true; }
        html += "<li>" + inline(li[1]) + "</li>";
      } else {
        if (list) { html += "</ul>"; list = false; }
        if (raw.trim()) html += "<p>" + inline(raw) + "</p>";
      }
    }
    return html + (list ? "</ul>" : "");
  }

  let messages = [];
  try { messages = JSON.parse(sessionStorage.getItem(CONFIG.storageKey)) || []; } catch (e) {}
  const save = () => { try { sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(messages)); } catch (e) {} };
  let busy = false;

  document.body.insertAdjacentHTML("beforeend", `
    <button class="ai-launcher" id="aiLauncher" aria-label="Open AI assistant" aria-expanded="false" aria-controls="aiPanel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg><span class="ai-launcher-tip">Ask ${CONFIG.name}</span>
    </button>
    <div class="ai-panel" id="aiPanel" role="dialog" aria-label="Chat with ${CONFIG.name}">
      <div class="ai-head">
        <div class="ai-avatar" aria-hidden="true">&gt;_</div>
        <div class="ai-title"><div class="ai-name">${CONFIG.name}</div><div class="ai-sub">Swikar's AI assistant</div></div>
        <button class="ai-btn" id="aiClear" type="button">Clear</button>
        <button class="ai-btn" id="aiClose" type="button" aria-label="Close chat">✕</button>
      </div>
      <div class="ai-log" id="aiLog" aria-live="polite"></div>
      <form class="ai-form" id="aiForm" autocomplete="off">
        <input class="ai-input" id="aiInput" type="text" maxlength="${CONFIG.maxChars}" placeholder="Type a question..." aria-label="Type a question">
        <button class="ai-send" id="aiSend" type="submit">Send</button>
      </form>
      <div class="ai-foot">AI can make mistakes. For anything important, use the contact form.</div>
    </div>`);

  const $ = id => document.getElementById(id);
  const launcher = $("aiLauncher"), panel = $("aiPanel"), log = $("aiLog"), input = $("aiInput"), sendBtn = $("aiSend");

  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  function addMsg(role, text, opts = {}) {
    const el = document.createElement("div");
    el.className = "ai-msg " + role + (opts.error ? " error" : "");
    el.innerHTML = role === "user" ? "<p>" + esc(text) + "</p>" : renderMd(text);
    if (opts.contactBtn) {
      const b = document.createElement("button");
      b.className = "ai-btn ai-inline-btn";
      b.type = "button";
      b.textContent = "Open contact form";
      b.onclick = () => { closePanel(); if (window.openContactModal) openContactModal(); };
      el.appendChild(b);
    }
    log.appendChild(el);
    scrollDown();
    return el;
  }

  function addTyping() {
    const el = document.createElement("div");
    el.className = "ai-msg bot ai-typing";
    el.setAttribute("aria-label", CONFIG.name + " is typing");
    el.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(el);
    scrollDown();
    return el;
  }

  function showIntro() {
    log.innerHTML = "";
    addMsg("bot", CONFIG.greeting);
    if (messages.length) { messages.forEach(m => addMsg(m.role === "user" ? "user" : "bot", m.content)); return; }
    const chips = document.createElement("div");
    chips.className = "ai-chips";
    chips.id = "aiChips";
    CONFIG.suggestions.forEach(q => {
      const c = document.createElement("button");
      c.className = "ai-chip";
      c.type = "button";
      c.textContent = q;
      c.onclick = () => send(q);
      chips.appendChild(c);
    });
    log.appendChild(chips);
  }

  async function send(text) {
    text = text.trim().slice(0, CONFIG.maxChars);
    if (!text || busy) return;
    $("aiChips")?.remove();
    input.value = "";
    messages.push({ role: "user", content: text });
    addMsg("user", text);
    busy = true; sendBtn.disabled = true;
    const typing = addTyping();
    try {
      if (CONFIG.endpoint.includes("YOUR-VERCEL")) throw new Error("not-configured");
      const res = await fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-CONFIG.maxHistory) })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error("rate");
      if (!res.ok || !data.reply) throw new Error("bad");
      typing.remove();
      messages.push({ role: "assistant", content: data.reply });
      addMsg("bot", data.reply);
    } catch (err) {
      typing.remove();
      messages.pop(); // keep failed question out of the history
      const msg = err.message === "rate" ? "Too many messages in a short time. Wait a minute, then try again."
        : err.message === "not-configured" ? "The assistant isn't connected yet. Set the endpoint in chat.js."
        : "Couldn't reach the assistant. Try again, or send Swikar a message directly.";
      addMsg("bot", msg, { error: true, contactBtn: err.message !== "rate" });
    } finally {
      busy = false; sendBtn.disabled = false; save();
      if (panel.classList.contains("open")) input.focus();
    }
  }

  function openPanel() {
    panel.classList.add("open");
    launcher.classList.add("hidden");
    launcher.setAttribute("aria-expanded", "true");
    setTimeout(() => input.focus(), 250);
  }
  function closePanel() {
    panel.classList.remove("open");
    launcher.classList.remove("hidden");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus({ preventScroll: true });
  }

  launcher.onclick = openPanel;
  $("aiClose").onclick = closePanel;
  $("aiClear").onclick = () => { messages = []; save(); showIntro(); input.focus(); };
  $("aiForm").onsubmit = e => { e.preventDefault(); send(input.value); };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && panel.classList.contains("open")) closePanel(); });

  showIntro();
})();