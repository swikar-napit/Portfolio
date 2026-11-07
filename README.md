# 💻 Swikar Napit — Portfolio

> A terminal-themed personal portfolio showcasing my projects, skills, and journey as a developer.

🔗 **Live site:** [swikarnapit.com.np](https://swikarnapit.com.np)

---

## 📖 About

This is my personal developer portfolio — built from scratch with HTML, CSS, and JavaScript,
designed around a terminal/code-editor aesthetic. It highlights who I am, what I can build,
and how to get in touch. It also includes **Pixel**, an AI assistant that answers visitors'
questions about my work.

---

## ✨ Features

- 🖥️ Terminal-style UI with typewriter effect
- 🤖 **Pixel, the AI assistant** — a floating chat that answers questions about my projects, skills, and education, with a mobile-friendly full-size window
- 📱 Fully responsive — works on mobile, tablet, and desktop
- 🧭 Scrollspy navigation that highlights the active section
- 📂 Project cards with live demo and source code links
- 🎓 About, Skills, Education, and Contact sections
- ⚡ No frameworks — pure HTML, CSS & JavaScript

---

## 🛠 Tech Stack

| Technology                | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| HTML5                     | Structure                                 |
| CSS3                      | Styling & layout                          |
| JavaScript                | Interactivity and the chat widget         |
| Node.js (Vercel function) | Secure back end for the AI assistant      |
| Groq API (GPT-OSS 120B)   | Language model behind Pixel                |

---

## 🤖 AI Assistant (Pixel)

Pixel is a chat widget that opens from the round button in the bottom-right corner.

- **Front end:** `chat.js` and `chat.css` build the chat window, keep the conversation for the session, and send messages to the API. The window opens with a smooth transition, never opens the keyboard automatically on mobile, shows suggestion chips, and offers a **Retry** button if a request fails.
- **Back end:** `api/ask.js` is a Vercel serverless function that calls the Groq API. The API key stays on the server and is never exposed in the browser.
- **Knowledge:** `api/_profile.js` holds everything Pixel knows about me. Edit it when the portfolio changes, then push to redeploy.
- **Personality:** Pixel is warm and polite, answers exactly what was asked in a short reply, and offers to go deeper instead of dumping everything.
- **Safeguards:** only my own domains can call the API, message length and history are capped, and Pixel answers only from the portfolio facts. She declines questions about other people and unrelated topics.
- **Spam protection:** the chat pauses for a few seconds (with a live countdown) if someone sends more than 5 messages in 30 seconds. The server also limits each device to 10 messages per minute using an anonymous device id, with a looser per-IP cap, so other devices on the same Wi-Fi keep working.
- **Privacy:** the chat is kept in memory only and clears whenever the page is refreshed.

### Environment variables (set in Vercel, never commit them)

| Variable          | Required | Purpose                                              |
| ----------------- | -------- | ---------------------------------------------------- |
| `GROQ_API_KEY`    | Yes      | Groq API key                                         |
| `GROQ_MODEL`      | No       | Override the default model (`openai/gpt-oss-120b`)   |
| `ALLOWED_ORIGINS` | No       | Extra allowed origins, comma-separated               |

---

## 📁 Project Structure
```text
Portfolio/
│
├── index.html      (Main page structure)
├── style.css       (Styling and responsive design)
├── main.js         (Scrollspy, typewriter effect, menu toggle)
├── chat.js         (Pixel chat widget — front end)
├── chat.css        (Chat widget styling)
├── api/
│   ├── ask.js      (Serverless function that calls the Groq API)
│   └── _profile.js (Pixel's instructions and knowledge about me)
├── Image/          (Images and icons folder)
└── README.md       (Project documentation)
```
---

## 👨‍💻 Author

**Swikar Napit**

- 🌐 Website: [swikarnapit.com.np](https://swikarnapit.com.np)
- 💻 GitHub: [@swikar-napit](https://github.com/swikar-napit)
- 🔗 LinkedIn: [swikar-napit](https://www.linkedin.com/in/swikar-napit-819b9b414/)
- 📧 Email: napit.swikar1@gmail.com

---