// ── CV Context for the AI agent ──────────────────────────────────────────────
const CV_CONTEXT = `
You are a helpful AI assistant on Lars's personal website. Answer questions about Lars's CV.
Only answer questions related to Lars and his professional background. Keep answers concise.

--- Lars's CV ---

Name: Lars
Title: Full-Stack Software Engineer
Location: Germany
Email: lars@example.com
GitHub: github.com/Lars263506
LinkedIn: linkedin.com/in/lars

About:
Passionate full-stack software engineer with 5+ years of experience building scalable web applications.
I love turning complex problems into elegant solutions. When I'm not coding, I enjoy hiking and photography.

Experience:
- Senior Software Engineer at TechCorp GmbH (2022–Present)
  Led development of a microservices architecture serving 500K+ daily active users.
  Reduced API response times by 40% through caching strategies.
  Mentored 3 junior engineers.
  Tech: TypeScript, React, Node.js, PostgreSQL, Docker, Kubernetes, AWS

- Software Engineer at StartupXYZ (2020–2022)
  Built and shipped full-stack features for a B2B SaaS platform.
  Integrated third-party payment and analytics APIs.
  Tech: JavaScript, Vue.js, Python, Django, MySQL, Redis

- Junior Developer at WebAgency Berlin (2018–2020)
  Developed client websites and internal tools.
  Tech: HTML, CSS, JavaScript, PHP, WordPress

Education:
- B.Sc. Computer Science, Technical University of Berlin (2014–2018)
  Thesis: "Optimizing Graph Query Performance in Distributed Systems"

Skills:
  Languages: TypeScript, JavaScript, Python, SQL, HTML/CSS
  Frontend: React, Vue.js, Next.js, Tailwind CSS
  Backend: Node.js, Express, Django, REST APIs, GraphQL
  Databases: PostgreSQL, MySQL, MongoDB, Redis
  DevOps: Docker, Kubernetes, GitHub Actions, AWS, CI/CD
  Tools: Git, Jira, Figma, VS Code

Languages:
  German (native), English (fluent)

Certifications:
  AWS Certified Developer – Associate (2023)
`;

// ── State ─────────────────────────────────────────────────────────────────────
let apiKey = localStorage.getItem('openai_api_key') || '';
let isLoading = false;
const messageHistory = [
  { role: 'system', content: CV_CONTEXT }
];

// ── DOM refs ─────────────────────────────────────────────────────────────────
const chatToggle    = document.getElementById('chat-toggle');
const chatPanel     = document.getElementById('chat-panel');
const chatMessages  = document.getElementById('chat-messages');
const chatInput     = document.getElementById('chat-input');
const chatSend      = document.getElementById('chat-send');
const apiKeyInput   = document.getElementById('api-key-input');
const apiKeySave    = document.getElementById('api-key-save');
const apiSetupRow   = document.getElementById('api-setup-row');
const chatSuggestions = document.getElementById('chat-suggestions');

// ── Toggle chat panel ─────────────────────────────────────────────────────────
chatToggle.addEventListener('click', () => {
  chatPanel.classList.toggle('hidden');
  if (!chatPanel.classList.contains('hidden')) {
    chatInput.focus();
  }
});

// ── API key save ──────────────────────────────────────────────────────────────
function applyApiKey(key) {
  apiKey = key.trim();
  if (apiKey) {
    localStorage.setItem('openai_api_key', apiKey);
    apiSetupRow.style.display = 'none';
    addMessage('bot', 'API key saved! Ask me anything about Lars\'s CV 🎉');
  }
}

apiKeySave.addEventListener('click', () => applyApiKey(apiKeyInput.value));
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyApiKey(apiKeyInput.value);
});

// Hide setup row if key already stored
if (apiKey) {
  apiSetupRow.style.display = 'none';
}

// ── Suggestion chips ──────────────────────────────────────────────────────────
document.querySelectorAll('.suggestion-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    const question = btn.textContent;
    chatInput.value = question;
    sendMessage();
    chatSuggestions.style.display = 'none';
  });
});

// ── Send message ──────────────────────────────────────────────────────────────
chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isLoading) return;

  chatSuggestions.style.display = 'none';
  chatInput.value = '';

  if (!apiKey) {
    addMessage('bot', '⚠️ Please enter your OpenAI API key above to enable the AI assistant.');
    apiSetupRow.style.display = 'flex';
    return;
  }

  addMessage('user', text);
  messageHistory.push({ role: 'user', content: text });

  const typingEl = addTypingIndicator();
  isLoading = true;
  chatSend.disabled = true;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messageHistory,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    typingEl.remove();

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err?.error?.message || `Error ${response.status}`;
      addMessage('bot', `❌ ${errMsg}`);
      return;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (reply) {
      messageHistory.push({ role: 'assistant', content: reply });
      addMessage('bot', reply);
    }
  } catch (err) {
    typingEl.remove();
    addMessage('bot', '❌ Network error. Please check your connection and try again.');
  } finally {
    isLoading = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function addMessage(role, text) {
  const el = document.createElement('div');
  el.className = `msg msg-${role}`;
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

function addTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'msg-typing';
  el.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}
