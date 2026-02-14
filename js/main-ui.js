const MESSAGE_KEY = "emi_messages";
const ORDER_KEY = "emi_orders";
const MESSAGE_SOURCE = "data/messages.json";
const REPLY_EMAIL_FALLBACK = "dpdpdp.m@outlook.es";
const EMAILJS_DEFAULTS = {
  publicKey: "",
  serviceId: "",
  templateId: "",
};

const messageList = document.getElementById("messageList");
const messageViewer = document.getElementById("messageViewer");
const messageViewerTitle = document.getElementById("messageViewerTitle");
const messageViewerMeta = document.getElementById("messageViewerMeta");
const messageViewerBody = document.getElementById("messageViewerBody");
const replyInput = document.getElementById("replyInput");
const replyByMailBtn = document.getElementById("replyByMailBtn");
const replyStatus = document.getElementById("replyStatus");
const buyButtons = document.querySelectorAll(".buy-btn");
const purchaseModal = document.getElementById("purchaseModal");
const purchaseMessage = document.getElementById("purchaseMessage");
const closePurchaseModalBtn = document.getElementById("closePurchaseModal");
const tabButtons = document.querySelectorAll(".tab-btn");
const windows = document.querySelectorAll(".window-panel");
const galleryImage = document.getElementById("galleryImage");
const galleryCaption = document.getElementById("galleryCaption");
const carouselButtons = document.querySelectorAll(".carousel-btn");
const carouselTrackImages = document.querySelectorAll(".carousel-track img");
let inboxMessages = [];
let selectedMessage = null;
let replyEmail = REPLY_EMAIL_FALLBACK;
let emailjsConfig = { ...EMAILJS_DEFAULTS };

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function readArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

function normalizeMessage(entry) {
  if (!entry) return null;
  if (typeof entry === "object") {
    const text = String(entry.text || "").trim();
    if (!text) return null;
    return {
      id: String(entry.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      text,
      time: String(entry.time || nowLabel()),
    };
  }
  return null;
}

function openMessage(message) {
  if (!messageViewer || !messageViewerTitle || !messageViewerMeta || !messageViewerBody) return;
  selectedMessage = message;
  messageViewer.hidden = false;
  messageViewerTitle.textContent = "FROM PILI";
  messageViewerMeta.textContent = message.time;
  messageViewerBody.textContent = message.text;
}

function renderMessages(messages) {
  if (!messageList) return;
  messageList.innerHTML = "";

  if (messages.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No messages yet.";
    messageList.appendChild(li);
    return;
  }

  messages.forEach((message) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    const preview = message.text.length > 28 ? `${message.text.slice(0, 28)}...` : message.text;
    button.type = "button";
    button.className = "message-open-btn";
    button.textContent = `from: pili | ${preview}`;
    button.title = "Open message from pili";
    button.addEventListener("click", () => openMessage(message));
    li.appendChild(button);
    messageList.appendChild(li);
  });
}

function setReplyStatus(text, kind = "") {
  if (!replyStatus) return;
  replyStatus.textContent = text;
  replyStatus.className = kind ? `reply-status ${kind}` : "reply-status";
}

function canUseEmailJs() {
  const hasWindow = typeof window !== "undefined";
  const hasLib = hasWindow && window.emailjs && typeof window.emailjs.send === "function";
  const hasConfig =
    emailjsConfig.publicKey &&
    emailjsConfig.serviceId &&
    emailjsConfig.templateId &&
    !emailjsConfig.publicKey.startsWith("YOUR_");
  return Boolean(hasLib && hasConfig);
}

async function sendReplyByEmail() {
  const replyText = (replyInput?.value || "").trim();
  if (!selectedMessage || !replyText) {
    setReplyStatus("Write a reply first.", "is-error");
    return;
  }

  if (!canUseEmailJs()) {
    setReplyStatus("EmailJS is not configured yet.", "is-error");
    return;
  }

  replyByMailBtn.disabled = true;
  setReplyStatus("Sending...", "is-pending");

  try {
    const params = {
      to_email: replyEmail,
      reply_text: replyText,
      original_message: selectedMessage.text,
      original_time: selectedMessage.time,
      source: "EMI BOY console",
    };

    await window.emailjs.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      params
    );

    setReplyStatus("Message sent.", "is-ok");
    if (replyInput) replyInput.value = "";
  } catch (err) {
    const detail =
      (err && typeof err === "object" && "text" in err && err.text) ||
      (err && typeof err === "object" && "message" in err && err.message) ||
      "Unknown error";
    setReplyStatus(`Could not send: ${detail}`, "is-error");
    console.error("EmailJS send error:", err);
  } finally {
    replyByMailBtn.disabled = false;
  }
}

async function initMessages() {
  localStorage.removeItem(MESSAGE_KEY);
  if (messageViewer) messageViewer.hidden = true;

  replyByMailBtn?.addEventListener("click", sendReplyByEmail);
  replyInput?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") sendReplyByEmail();
  });

  try {
    const response = await fetch(MESSAGE_SOURCE, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load messages.json");
    const data = await response.json();
    const rawMessages = Array.isArray(data) ? data : data.messages;
    const normalized = (Array.isArray(rawMessages) ? rawMessages : []).map(normalizeMessage).filter(Boolean);
    inboxMessages = normalized;
    if (!Array.isArray(data) && typeof data.replyEmail === "string" && data.replyEmail.trim()) {
      replyEmail = data.replyEmail.trim();
    }
    if (!Array.isArray(data) && data.emailjs && typeof data.emailjs === "object") {
      emailjsConfig = {
        publicKey: String(data.emailjs.publicKey || "").trim(),
        serviceId: String(data.emailjs.serviceId || "").trim(),
        templateId: String(data.emailjs.templateId || "").trim(),
      };
    }
  } catch {
    inboxMessages = [];
  }

  if (canUseEmailJs()) {
    window.emailjs.init({ publicKey: emailjsConfig.publicKey });
    setReplyStatus("Ready to send.", "is-ok");
  } else {
    setReplyStatus("Set EmailJS keys in data/messages.json.", "is-pending");
  }

  renderMessages(inboxMessages);
  if (inboxMessages[0]) openMessage(inboxMessages[0]);
}

function initStore() {
  buyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.getAttribute("data-item") || "item";
      const note = btn.getAttribute("data-note") || "pedido confirmado";
      const next = [...readArray(ORDER_KEY), `${nowLabel()} - ${item}: ${note}`];
      writeArray(ORDER_KEY, next);
      openPurchaseModal(`${item}: ${note}`);
    });
  });
}

function openPurchaseModal(text) {
  if (!purchaseModal || !purchaseMessage) return;
  purchaseMessage.textContent = text;
  purchaseModal.hidden = false;
}

function closePurchaseModal() {
  if (!purchaseModal) return;
  purchaseModal.hidden = true;
}

function initPurchaseModal() {
  closePurchaseModalBtn?.addEventListener("click", closePurchaseModal);
  purchaseModal?.addEventListener("click", (ev) => {
    if (ev.target === purchaseModal) closePurchaseModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closePurchaseModal();
  });
}

function initWindows() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-window");
      if (!targetId) return;

      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      windows.forEach((w) => {
        const show = w.id === targetId;
        w.hidden = !show;
        w.classList.toggle("active-window", show);
      });
    });
  });
}

function initCarousel() {
  if (!galleryImage || carouselTrackImages.length === 0) return;
  let idx = 0;
  const images = [...carouselTrackImages].map((img) => ({
    src: img.getAttribute("src") || "",
    alt: img.getAttribute("alt") || "galeria",
  }));

  function render() {
    const current = images[idx];
    galleryImage.src = current.src;
    galleryImage.alt = current.alt;
    if (galleryCaption) galleryCaption.textContent = `${idx + 1} / ${images.length}`;
  }

  carouselButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.getAttribute("data-dir") || 0);
      idx = (idx + dir + images.length) % images.length;
      render();
    });
  });

  render();
}

initCarousel();
initWindows();
initMessages();
initStore();
initPurchaseModal();

