/*!
 * contact-form.js — Paradoks aloqa formasi
 * Xabar, rasm, video va fayllarni Cloudflare Worker orqali Telegramga yuboradi.
 *
 * Ishlatish:
 *   <div data-contact-form data-endpoint="https://WORKER.workers.dev" data-accent="#FF6B3D"></div>
 *   <script src="contact-form.js"></script>
 *
 * Shadow DOM ishlatadi, sayt CSS i bilan aralashmaydi.
 */
(() => {
  "use strict";

  const DEFAULT_MB = 19;
  const DEFAULT_FILES = 5;
  const MAX_TEXT = 3500;
  const SERVICES = ["Telegram bot", "Veb-sayt", "Android ilova", "Boshqa"];

  const CSS = (accent) => `
    :host { display: block; }
    *, *::before, *::after { box-sizing: border-box; }
    .card {
      position: relative; overflow: hidden;
      background: #17181C; border: 1px solid #2A2C33; border-radius: 28px;
      padding: 28px; color: #F3EFE7;
      font-family: 'Instrument Sans', system-ui, sans-serif; font-size: 16px; line-height: 1.5;
    }
    .card::before {
      content: ""; position: absolute; inset: -40% -20% auto auto; width: 320px; height: 320px;
      background: radial-gradient(closest-side, ${accent}26, transparent); pointer-events: none;
    }
    .head {
      position: relative; display: flex; align-items: center; gap: 12px;
      padding-bottom: 18px; margin-bottom: 22px; border-bottom: 1px solid #2A2C33;
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: ${accent}; box-shadow: 0 0 0 4px ${accent}33; }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .head .mono { font-size: 13px; color: #A5A39B; }
    form { position: relative; display: grid; gap: 20px; margin: 0; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: grid; gap: 8px; min-width: 0; }
    .lbl {
      display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
      font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px;
      letter-spacing: .04em; text-transform: uppercase; color: #A5A39B;
    }
    .lbl i { font-style: normal; text-transform: none; letter-spacing: 0; color: #6E6C66; }
    input[type=text], textarea {
      width: 100%; min-height: 52px; padding: 14px 16px;
      background: #101114; color: #F3EFE7; border: 1px solid #2A2C33; border-radius: 16px;
      font: inherit; font-size: 16px; outline: none;
      transition: border-color .18s, box-shadow .18s, background .18s;
    }
    textarea { min-height: 140px; resize: vertical; line-height: 1.5; }
    input::placeholder, textarea::placeholder { color: #6E6C66; }
    input[type=text]:hover, textarea:hover { border-color: #3A3D46; }
    input[type=text]:focus, textarea:focus {
      border-color: ${accent}; box-shadow: 0 0 0 4px ${accent}26;
    }
    .invalid { border-color: #FF5A5A !important; box-shadow: 0 0 0 4px #FF5A5A22 !important; }
    .count { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: #6E6C66; text-align: right; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { position: relative; cursor: pointer; }
    .chip input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
    .chip span {
      display: inline-flex; align-items: center; min-height: 40px; padding: 0 16px;
      border: 1px solid #3A3D46; border-radius: 999px; color: #D9D5CB; font-weight: 500; font-size: 15px;
      transition: background .18s, color .18s, border-color .18s, transform .12s;
    }
    .chip:hover span { border-color: #6E6C66; }
    .chip input:checked + span { background: ${accent}; border-color: ${accent}; color: #101114; font-weight: 600; }
    .chip input:focus-visible + span { outline: 2px solid ${accent}; outline-offset: 3px; }
    .chip:active span { transform: scale(.97); }
    .drop {
      display: flex; align-items: center; gap: 14px; padding: 16px; cursor: pointer;
      border: 1px dashed #3A3D46; border-radius: 16px; color: #A5A39B; background: transparent;
      transition: border-color .18s, background .18s, color .18s; width: 100%; text-align: left; font: inherit;
    }
    .drop:hover, .drop.over { border-color: ${accent}; background: ${accent}12; color: #F3EFE7; }
    .drop:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
    .drop svg { flex: none; }
    .drop b { display: block; font-weight: 600; color: #F3EFE7; font-size: 15px; }
    .drop small { display: block; font-size: 13px; color: #6E6C66; }
    .files { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .file {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      background: #101114; border: 1px solid #2A2C33; border-radius: 14px;
      animation: pop .22s ease-out;
    }
    .file .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
    .file .sz { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: #6E6C66; flex: none; }
    .file button {
      flex: none; width: 32px; height: 32px; display: grid; place-items: center; cursor: pointer;
      background: transparent; border: 0; border-radius: 50%; color: #A5A39B;
      transition: background .15s, color .15s;
    }
    .file button:hover { background: #2A2C33; color: #F3EFE7; }
    .file button:focus-visible { outline: 2px solid ${accent}; }
    .total { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: #6E6C66; }
    .err {
      display: none; padding: 12px 14px; border-radius: 14px; font-size: 14px;
      background: #FF5A5A1A; border: 1px solid #FF5A5A55; color: #FFB4B4;
    }
    .err.show { display: block; animation: pop .2s ease-out; }
    .submit { display: grid; gap: 12px; }
    .btn {
      position: relative; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      min-height: 56px; padding: 0 28px; border: 0; border-radius: 999px; cursor: pointer;
      background: ${accent}; color: #101114; font: inherit; font-weight: 700; font-size: 17px;
      transition: transform .12s, box-shadow .2s, opacity .2s;
      box-shadow: 0 10px 30px -10px ${accent}99;
    }
    .btn:hover { box-shadow: 0 14px 36px -10px ${accent}cc; transform: translateY(-1px); }
    .btn:active { transform: translateY(0) scale(.99); }
    .btn:focus-visible { outline: 2px solid #F3EFE7; outline-offset: 3px; }
    .btn[disabled] { opacity: .75; cursor: progress; transform: none; }
    .btn .bar { position: absolute; left: 0; bottom: 0; height: 4px; width: 0; background: #101114; opacity: .35; transition: width .15s linear; }
    .spin { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid #10111440; border-top-color: #101114; animation: rot .7s linear infinite; display: none; }
    .btn.busy .spin { display: inline-block; }
    .btn.busy .arr { display: none; }
    .note { font-size: 13px; color: #6E6C66; text-align: center; }
    .hp { position: absolute !important; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
    .ok { position: relative; display: none; text-align: center; padding: 28px 8px 12px; }
    .card.done form { display: none; }
    .card.done .ok { display: grid; justify-items: center; gap: 14px; animation: pop .35s ease-out; }
    .card.done .head { display: none; }
    .ok .ring { width: 84px; height: 84px; }
    .ok .ring circle { fill: ${accent}1f; stroke: ${accent}; stroke-width: 2; }
    .ok .ring path { fill: none; stroke: ${accent}; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 40; stroke-dashoffset: 40; animation: draw .5s .15s ease-out forwards; }
    .ok h3 { margin: 0; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 30px; letter-spacing: -0.02em; }
    .ok p { margin: 0; max-width: 340px; color: #A5A39B; }
    .ghost {
      margin-top: 8px; min-height: 48px; padding: 0 22px; border-radius: 999px; cursor: pointer;
      background: transparent; border: 1px solid #3A3D46; color: #F3EFE7; font: inherit; font-weight: 600;
      transition: border-color .15s, background .15s;
    }
    .ghost:hover { border-color: #6E6C66; background: #ffffff0a; }
    .ghost:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
    @keyframes pop { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: none; } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes rot { to { transform: rotate(360deg); } }
    @media (max-width: 560px) {
      .card { padding: 20px; border-radius: 24px; }
      .row { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
      .ok .ring path { stroke-dashoffset: 0; }
    }
  `;

  const ICON_CLIP =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.4 11.6l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/></svg>';
  const ICON_X =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const ICON_ARROW =
    '<svg class="arr" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';

  const fmt = (b) =>
    b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(1) + " MB";

  function mount(host) {
    const endpoint = (host.getAttribute("data-endpoint") || "").trim().replace(/\/$/, "");
    const accentAttr = (host.getAttribute("data-accent") || "").trim();
    const accent = /^#[0-9a-f]{3,8}$/i.test(accentAttr) ? accentAttr : "#FF6B3D";
    const root = host.attachShadow({ mode: "open" });

    let maxMb = DEFAULT_MB;
    let maxFiles = DEFAULT_FILES;
    let files = [];
    let sending = false;

    root.innerHTML = `
      <style>${CSS(accent)}</style>
      <div class="card">
        <div class="head"><span class="dot"></span><span class="mono">Yangi xabar</span></div>
        <form novalidate>
          <div class="hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>

          <div class="field">
            <span class="lbl" id="svc-l">Qanday xizmat kerak? <i>ixtiyoriy</i></span>
            <div class="chips" role="group" aria-labelledby="svc-l">
              ${SERVICES.map(
                (s) => `<label class="chip"><input type="checkbox" name="svc" value="${s}"><span>${s}</span></label>`
              ).join("")}
            </div>
          </div>

          <div class="row">
            <label class="field"><span class="lbl">Ismingiz <i>ixtiyoriy</i></span>
              <input type="text" name="name" autocomplete="name" maxlength="100" placeholder="Ism"></label>
            <label class="field"><span class="lbl">Aloqa</span>
              <input type="text" name="contact" maxlength="150" placeholder="@username yoki telefon" autocomplete="off"></label>
          </div>

          <label class="field"><span class="lbl">Xabar</span>
            <textarea name="message" maxlength="${MAX_TEXT}" placeholder="Qanday bot yoki sayt kerak? Qisqacha yozing."></textarea>
            <span class="count" aria-hidden="true">0 / ${MAX_TEXT}</span></label>

          <div class="field">
            <span class="lbl">Fayllar <i>ixtiyoriy</i></span>
            <button type="button" class="drop">${ICON_CLIP}<span><b>Fayl tashlang yoki tanlang</b><small class="hint"></small></span></button>
            <input type="file" multiple hidden>
            <ul class="files"></ul>
            <div class="total"></div>
          </div>

          <div class="err" role="alert" aria-live="assertive"></div>

          <div class="submit">
            <button class="btn" type="submit"><span class="bar"></span><span class="spin"></span><span class="txt">Yuborish</span>${ICON_ARROW}</button>
            <div class="note">Xabar to'g'ridan-to'g'ri Telegramimga boradi. Ctrl + Enter bilan ham yuborish mumkin.</div>
          </div>
        </form>

        <div class="ok" role="status" aria-live="polite">
          <svg class="ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="40"/><path d="M26 43l11 11 21-23"/></svg>
          <h3>Xabar yuborildi</h3>
          <p>Rahmat! Ko'rsatgan aloqangiz orqali tez orada bog'lanaman.</p>
          <button type="button" class="ghost">Yana xabar yozish</button>
        </div>
      </div>`;

    const $ = (s) => root.querySelector(s);
    const card = $(".card");
    const form = $("form");
    const fileInput = $('input[type=file]');
    const drop = $(".drop");
    const list = $(".files");
    const total = $(".total");
    const errBox = $(".err");
    const btn = $(".btn");
    const bar = $(".bar");
    const txt = $(".txt");
    const msg = form.elements.message;
    const contact = form.elements.contact;
    const count = $(".count");
    const hint = $(".hint");

    const setHint = () => {
      hint.textContent = `Jami ${maxMb} MB gacha, ${maxFiles} tagacha fayl`;
    };
    setHint();

    // Worker limitlarini olish (xato bo'lsa standart qiymatlar qoladi)
    if (endpoint) {
      fetch(endpoint, { method: "GET" })
        .then((r) => r.json())
        .then((d) => {
          if (d && d.ok) {
            if (Number(d.maxMb) > 0) maxMb = Number(d.maxMb);
            if (Number(d.maxFiles) > 0) maxFiles = Number(d.maxFiles);
            setHint();
          }
        })
        .catch(() => {});
    }

    const showErr = (t) => {
      errBox.textContent = t || "";
      errBox.classList.toggle("show", !!t);
    };

    const totalBytes = () => files.reduce((s, f) => s + f.size, 0);

    function renderFiles() {
      list.textContent = "";
      files.forEach((f, i) => {
        const li = document.createElement("li");
        li.className = "file";
        const nm = document.createElement("span");
        nm.className = "nm";
        nm.textContent = f.name;
        nm.title = f.name;
        const sz = document.createElement("span");
        sz.className = "sz";
        sz.textContent = fmt(f.size);
        const rm = document.createElement("button");
        rm.type = "button";
        rm.setAttribute("aria-label", `${f.name} ni olib tashlash`);
        rm.innerHTML = ICON_X;
        rm.addEventListener("click", () => {
          files.splice(i, 1);
          renderFiles();
          showErr("");
        });
        li.append(nm, sz, rm);
        list.append(li);
      });
      total.textContent = files.length ? `${files.length} ta fayl · ${fmt(totalBytes())} / ${maxMb} MB` : "";
    }

    function addFiles(incoming) {
      showErr("");
      for (const f of Array.from(incoming)) {
        if (files.length >= maxFiles) {
          showErr(`Maksimum ${maxFiles} ta fayl biriktirish mumkin`);
          break;
        }
        if (totalBytes() + f.size > maxMb * 1048576) {
          showErr(`Jami hajm ${maxMb} MB dan oshmasligi kerak`);
          break;
        }
        files.push(f);
      }
      renderFiles();
    }

    drop.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      addFiles(fileInput.files);
      fileInput.value = "";
    });
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add("over");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.remove("over");
      })
    );
    drop.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    msg.addEventListener("input", () => {
      count.textContent = `${msg.value.length} / ${MAX_TEXT}`;
      msg.classList.remove("invalid");
    });
    contact.addEventListener("input", () => contact.classList.remove("invalid"));

    // Ctrl/Cmd + Enter — yuborish. Enter va Shift + Enter — yangi qator.
    msg.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter" || e.keyCode === 13) && (e.ctrlKey || e.metaKey) && !e.isComposing) {
        e.preventDefault();
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });

    const setBusy = (on) => {
      sending = on;
      btn.disabled = on;
      btn.classList.toggle("busy", on);
      txt.textContent = on ? "Yuborilmoqda..." : "Yuborish";
      if (!on) bar.style.width = "0";
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (sending) return;
      showErr("");

      const message = msg.value.trim();
      const contactVal = contact.value.trim();
      let bad = null;
      if (!message && !files.length) {
        msg.classList.add("invalid");
        bad = msg;
        showErr("Xabar yozing yoki fayl biriktiring");
      }
      if (!contactVal) {
        contact.classList.add("invalid");
        bad = contact;
        showErr("Sizga qanday javob yozay? Telegram yoki telefoningizni kiriting");
      }
      if (bad) {
        bad.focus();
        return;
      }
      if (!endpoint) {
        showErr("Forma sozlanmagan (endpoint yo'q)");
        return;
      }

      const svc = Array.from(form.querySelectorAll('input[name="svc"]:checked')).map((i) => i.value).join(", ");
      const fd = new FormData();
      fd.append("website", form.elements.website.value);
      fd.append("name", form.elements.name.value.trim());
      fd.append("contact", contactVal);
      fd.append("message", (svc ? `🛠 Xizmat: ${svc}\n\n` : "") + message);
      files.forEach((f) => fd.append("files", f, f.name));

      setBusy(true);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);
      xhr.timeout = 180000;
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && files.length) bar.style.width = Math.round((ev.loaded / ev.total) * 100) + "%";
      };
      xhr.onload = () => {
        let d = {};
        try {
          d = JSON.parse(xhr.responseText);
        } catch (_) {}
        setBusy(false);
        if (xhr.status >= 200 && xhr.status < 300 && d.ok) {
          card.classList.add("done");
          form.reset();
          files = [];
          renderFiles();
          count.textContent = `0 / ${MAX_TEXT}`;
          host.dispatchEvent(new CustomEvent("contact-form:sent", { bubbles: true }));
        } else {
          showErr(d.error || "Xatolik yuz berdi, qayta urinib ko'ring");
        }
      };
      xhr.onerror = () => {
        setBusy(false);
        showErr("Tarmoq xatosi, qayta urinib ko'ring");
      };
      xhr.ontimeout = () => {
        setBusy(false);
        showErr("Vaqt tugadi, qayta urinib ko'ring");
      };
      xhr.send(fd);
    });

    $(".ghost").addEventListener("click", () => {
      card.classList.remove("done");
      showErr("");
      msg.focus();
    });
  }

  function scan() {
    document.querySelectorAll("[data-contact-form]").forEach((el) => {
      if (!el.shadowRoot) mount(el);
    });
  }

  scan();
  // Sahifa keyinroq chizilsa (yoki qayta chizilsa) ham formani ulaydi
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
