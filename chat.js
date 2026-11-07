/* Pixel — Swikar's portfolio AI assistant (front-end). Injects its own markup; no HTML edits needed. */
(() => {
  const CFG = {
    endpoint: "https://www.swikarnapit.com.np/api/ask",
    name: "Pixel",
    greeting: "Hi! I'm Pixel, an AI assistant. Curious about Swikar's work? Feel free to ask!",
    suggestions: ["Tell me about Swikar", "What has Swikar built?", "What's Swikar's tech stack?", "How can I contact Swikar?"],
    maxHistory: 10,
    maxChars: 500,
    storageKey: "swikar-ai-chat"
  };

  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const link = (u, t) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`;

  const inline = s => s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)"]+)\)/g, (_, t, u) => link(u, t))
    .replace(/(^|\s)(https?:\/\/[^\s<)"]+)/g, (_, p, u) => p + link(u, u));

  // Tiny, safe markdown (input is escaped first): paragraphs, lists, bold, code, links.
  function renderMd(text) {
    let html = "", list = false;
    for (const raw of esc(text).split("\n")) {
      const li = raw.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
      if (li) {
        if (!list) { html += "<ul>"; list = true; }
        html += `<li>${inline(li[1])}</li>`;
      } else {
        if (list) { html += "</ul>"; list = false; }
        if (raw.trim()) html += `<p>${inline(raw)}</p>`;
      }
    }
    return html + (list ? "</ul>" : "");
  }

  let messages = [], busy = false;
  try { messages = JSON.parse(sessionStorage.getItem(CFG.storageKey)) || []; } catch (e) {}
  const save = () => { try { sessionStorage.setItem(CFG.storageKey, JSON.stringify(messages)); } catch (e) {} };

  document.body.insertAdjacentHTML("beforeend", `
    <button class="ai-launcher" id="aiLauncher" aria-label="Open AI assistant" aria-expanded="false" aria-controls="aiPanel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path transform="translate(24 0) scale(-1 1)" d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>
      <span class="ai-launcher-tip">Ask ${CFG.name}</span>
    </button>
    <div class="ai-panel" id="aiPanel" role="dialog" aria-label="Chat with ${CFG.name}">
      <div class="ai-head">
        <div class="ai-avatar" aria-hidden="true">&gt;_</div>
        <div class="ai-title"><div class="ai-name">${CFG.name}</div><div class="ai-sub">Swikar's AI assistant</div></div>
        <button class="ai-btn" id="aiClear" type="button">Clear</button>
        <button class="ai-btn" id="aiClose" type="button" aria-label="Close chat">✕</button>
      </div>
      <div class="ai-log" id="aiLog" aria-live="polite"></div>
      <form class="ai-form" id="aiForm" autocomplete="off">
        <input class="ai-input" id="aiInput" type="text" maxlength="${CFG.maxChars}" placeholder="Ask a question..." aria-label="Type a question">
        <button class="ai-send" id="aiSend" type="submit" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>
        </button>
      </form>
      <div class="ai-foot">AI can make mistakes. For anything important, use the contact form.</div>
    </div>`);

  const $ = id => document.getElementById(id);
  const launcher = $("aiLauncher"), panel = $("aiPanel"), log = $("aiLog"), input = $("aiInput"), sendBtn = $("aiSend");
  const scrollDown = () => { log.scrollTop = log.scrollHeight; };

  function button(label, onclick, cls = "ai-btn") {
    const b = document.createElement("button");
    b.className = cls; b.type = "button"; b.textContent = label; b.onclick = onclick;
    return b;
  }

  function addMsg(role, text, opts = {}) {
    const el = document.createElement("div");
    el.className = `ai-msg ${role}${opts.error ? " error" : ""}`;
    el.innerHTML = role === "user" ? `<p>${esc(text)}</p>` : renderMd(text);
    if (opts.actions) {
      const row = document.createElement("div");
      row.className = "ai-acts";
      opts.actions.forEach(a => row.appendChild(button(...a)));
      el.appendChild(row);
    }
    log.appendChild(el);
    scrollDown();
    return el;
  }

  function showIntro() {
    log.innerHTML = "";
    addMsg("bot", CFG.greeting);
    if (messages.length) return messages.forEach(m => addMsg(m.role === "user" ? "user" : "bot", m.content));
    const chips = document.createElement("div");
    chips.className = "ai-chips"; chips.id = "aiChips";
    CFG.suggestions.forEach(q => chips.appendChild(button(q, () => send(q), "ai-chip")));
    log.appendChild(chips);
  }

  async function send(text) {
    text = text.trim().slice(0, CFG.maxChars);
    if (!text || busy) return;
    $("aiChips")?.remove();
    input.value = "";
    messages.push({ role: "user", content: text });
    addMsg("user", text);
    busy = sendBtn.disabled = true;

    const typing = document.createElement("div");
    typing.className = "ai-msg bot ai-typing";
    typing.setAttribute("aria-label", `${CFG.name} is typing`);
    typing.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(typing); scrollDown();

    try {
      const res = await fetch(CFG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-CFG.maxHistory) })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error("rate");
      if (!res.ok || !data.reply) throw new Error("bad");
      typing.remove();
      messages.push({ role: "assistant", content: data.reply });
      addMsg("bot", data.reply);
    } catch (err) {
      typing.remove();
      messages.pop(); // keep the failed question out of the history
      const rate = err.message === "rate";
      const actions = [["Retry", e => { e.target.closest(".ai-msg").remove(); log.lastElementChild?.remove(); send(text); }]];
      if (!rate) actions.push(["Contact form", () => { closePanel(); window.openContactModal?.(); }]);
      addMsg("bot", rate ? "Too many messages in a short time. Wait a minute, then try again."
        : "Couldn't reach the assistant. Try again, or message Swikar directly.", { error: true, actions });
    } finally {
      busy = sendBtn.disabled = false;
      save();
    }
  }

  function openPanel() {
    panel.classList.add("open");
    launcher.classList.add("hidden");
    launcher.setAttribute("aria-expanded", "true");
  }
  function closePanel() {
    panel.classList.remove("open");
    launcher.classList.remove("hidden");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus({ preventScroll: true });
  }

  launcher.onclick = openPanel;
  $("aiClose").onclick = closePanel;
  $("aiClear").onclick = () => { messages = []; save(); showIntro(); };
  $("aiForm").onsubmit = e => { e.preventDefault(); send(input.value); };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && panel.classList.contains("open")) closePanel(); });

  showIntro();
})();