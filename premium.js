/*!
 * premium.js — Paradoks: scroll effektlar va premium his
 * Sahifa tuzilmasiga tegmaydi: elementlarni topib, klass va animatsiya qo'shadi.
 */
(() => {
  "use strict";
  const doc = document;
  const html = doc.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = doc) => r.querySelector(s);

  function findTop() {
    return Array.from(doc.querySelectorAll("#top")).find(
      (el) => !el.closest("sc-if") && el.hasAttribute("data-canvas-width")
    );
  }

  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              frag.appendChild(doc.createTextNode(" "));
            } else {
              const w = doc.createElement("span");
              w.className = "pw";
              const inner = doc.createElement("span");
              inner.className = "pwi";
              inner.style.setProperty("--i", String(i++));
              inner.textContent = p;
              w.appendChild(inner);
              frag.appendChild(w);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add("pwrap");
  }

  function countUp(el) {
    const m = (el.dataset.final || "").match(/^(\d+)(.*)$/);
    if (!m) return;
    const n = Number(m[1]);
    const suf = m[2];
    const t0 = performance.now();
    const dur = 1700;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      el.textContent = Math.round(n * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function decorate(top) {
    const kids = Array.from(top.children);
    const header = kids[0];
    const hero = kids[1];
    const stats = kids[2];
    const projects = top.querySelector("#projects");
    const services = top.querySelector("#services");
    const contact = top.querySelector("#contact");
    const footer = top.querySelector("footer");
    if (!header || !hero || !stats || !projects || !services || !contact) return false;

    // Aksent rangini sahifadan olish
    const accEl = hero.querySelector("h1 span");
    if (accEl) {
      const m = getComputedStyle(accEl).color.match(/\d+/g);
      if (m && m.length >= 3) html.style.setProperty("--acc-rgb", m.slice(0, 3).join(", "));
    }

    const targets = [];
    const rv = (el, o = {}) => {
      if (!el || reduce) return;
      el.classList.add("rv");
      if (o.type) el.classList.add("rv-" + o.type);
      el.style.setProperty("--d", (o.d || 0) + "ms");
      el._pd = o.d || 0;
      targets.push(el);
    };
    const words = (el, d = 0) => {
      if (!el || reduce) return;
      splitWords(el);
      el.style.setProperty("--d", d + "ms");
      el._pd = d + 900;
      targets.push(el);
    };
    const hooks = new Map();

    // ---------- Header ----------
    rv(header, { type: "down" });

    // ---------- Hero ----------
    const heroL = hero.children[0];
    const heroR = hero.children[1];
    hero.classList.add("phero");
    const glow = doc.createElement("div");
    glow.className = "pglow";
    glow.setAttribute("aria-hidden", "true");
    hero.prepend(glow);

    if (heroL) {
      const [eyebrow, h1, p, btns] = Array.from(heroL.children);
      rv(eyebrow, { d: 100 });
      words(h1, 200);
      rv(p, { d: 700 });
      rv(btns, { d: 850 });
      if (btns) Array.from(btns.querySelectorAll("a")).forEach((a) => a.classList.add("mag"));
    }

    if (heroR) {
      heroR.classList.add("pchat");
      const bubs = Array.from(heroR.children).slice(1, 3);
      const typing = doc.createElement("div");
      typing.className = "ptyping";
      typing.setAttribute("aria-hidden", "true");
      typing.innerHTML = "<span></span><span></span><span></span>";
      if (!reduce) {
        bubs.forEach((b) => b.classList.add("pbub"));
        rv(heroR, { type: "scale", d: 500 });
        hooks.set(heroR, () => {
          const [b1, b2] = bubs;
          setTimeout(() => b1 && b1.classList.add("in"), 1000);
          setTimeout(() => {
            if (!b2) return;
            typing.style.bottom = heroR.clientHeight - b2.offsetTop - b2.offsetHeight + "px";
            heroR.appendChild(typing);
            requestAnimationFrame(() => typing.classList.add("in"));
          }, 2000);
          setTimeout(() => {
            typing.classList.remove("in");
            b2 && b2.classList.add("in");
            setTimeout(() => typing.remove(), 500);
          }, 3300);
        });
      }
    }

    if (fine && !reduce) {
      // Silliq (lerp) harakat: qiymatlar nishonga sekin yetib boradi, shuning uchun
      // karta va yorug'lik "sichqoncha izidan" emas, jonli suyuq harakatlanadi.
      const cur = { x: 0, y: 0, a: 0 };
      const tgt = { x: 0, y: 0, a: 0 };
      let raf = 0;
      const apply = () => {
        if (!heroR) return;
        heroR.style.setProperty("--tx", cur.x.toFixed(4));
        heroR.style.setProperty("--ty", cur.y.toFixed(4));
        heroR.style.setProperty("--ta", cur.a.toFixed(4));
      };
      const tick = () => {
        const k = 0.11;
        cur.x += (tgt.x - cur.x) * k;
        cur.y += (tgt.y - cur.y) * k;
        cur.a += (tgt.a - cur.a) * k;
        if (Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) + Math.abs(tgt.a - cur.a) > 0.002) {
          apply();
          raf = requestAnimationFrame(tick);
        } else {
          cur.x = tgt.x;
          cur.y = tgt.y;
          cur.a = tgt.a;
          apply();
          raf = 0;
        }
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };
      hero.addEventListener(
        "pointermove",
        (e) => {
          const r = hero.getBoundingClientRect();
          hero.style.setProperty("--hx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          hero.style.setProperty("--hy", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
          if (heroR) {
            // Karta joylashuvi egilmagan (layout) holatdan olinadi, shuning uchun qiymat "titramaydi"
            const w = heroR.offsetWidth;
            const h = heroR.offsetHeight;
            const left = r.left + heroR.offsetLeft;
            const topY = r.top + heroR.offsetTop;
            const pad = 90;
            const near = e.clientX > left - pad && e.clientX < left + w + pad && e.clientY > topY - pad && e.clientY < topY + h + pad;
            const cl = (v) => Math.max(-1, Math.min(1, v));
            tgt.x = near ? cl((e.clientX - (left + w / 2)) / (w * 0.5)) : 0;
            tgt.y = near ? cl((e.clientY - (topY + h / 2)) / (h * 0.5)) : 0;
            tgt.a = near ? 1 : 0;
            kick();
          }
        },
        { passive: true }
      );
      hero.addEventListener("pointerleave", () => {
        hero.style.setProperty("--hx", "0");
        hero.style.setProperty("--hy", "0");
        tgt.x = tgt.y = tgt.a = 0;
        kick();
      });
    }

    // ---------- Statistika ----------
    const statWrap = stats.firstElementChild;
    if (statWrap) {
      Array.from(statWrap.children).forEach((item, i) => {
        rv(item, { d: i * 130 });
        const num = Array.from(item.querySelectorAll("span")).find((s) => /^\d+/.test(s.textContent.trim()));
        if (num && !reduce) {
          const final = num.textContent.trim();
          num.dataset.final = final;
          num.classList.add("pnum");
          num.textContent = final.replace(/^\d+/, "0");
          hooks.set(item, () => countUp(num));
        }
      });
    }

    // ---------- Marquee ----------
    if (!doc.querySelector(".pmq")) {
      const items = ["Python", "aiogram 3", "Pyrogram", "JavaScript", "Cloudflare Workers", "Telegram Mini App", "AI agent", "OCR", "TGS"];
      const mq = doc.createElement("section");
      mq.className = "pmq";
      mq.setAttribute("aria-hidden", "true");
      const track = doc.createElement("div");
      track.className = "pmq-track";
      for (let k = 0; k < 2; k++) {
        items.forEach((t) => {
          const s = doc.createElement("span");
          s.className = "pmq-item";
          s.textContent = t;
          track.appendChild(s);
        });
      }
      mq.appendChild(track);
      stats.after(mq);
      rv(mq, { type: "fade" });
    }

    // ---------- Loyihalar ----------
    const pHead = projects.children[0];
    if (pHead) {
      rv(pHead.children[0]);
      words(pHead.children[1], 80);
    }
    const pGrid = projects.children[1];
    if (pGrid) {
      Array.from(pGrid.children).forEach((card, i) => {
        card.classList.add("pcard");
        rv(card, { d: (i % 2) * 140 });
        if (fine) {
          card.addEventListener(
            "pointermove",
            (e) => {
              const r = card.getBoundingClientRect();
              card.style.setProperty("--mx", e.clientX - r.left + "px");
              card.style.setProperty("--my", e.clientY - r.top + "px");
            },
            { passive: true }
          );
        }
      });
    }

    // ---------- Xizmatlar ----------
    const sWrap = services.firstElementChild;
    if (sWrap) {
      const sHead = sWrap.children[0];
      if (sHead) {
        rv(sHead.children[0]);
        words(sHead.children[1], 80);
      }
      const sGrid = sWrap.children[1];
      if (sGrid) {
        Array.from(sGrid.children).forEach((col, i) => {
          col.classList.add("psvc");
          rv(col, { d: i * 140 });
        });
      }
    }

    // ---------- Aloqa ----------
    const cL = contact.children[0];
    const cR = contact.children[1];
    if (cL) {
      const [eb, h2, p, btns] = Array.from(cL.children);
      rv(eb);
      words(h2, 80);
      rv(p, { d: 500 });
      rv(btns, { d: 650 });
      if (btns) Array.from(btns.querySelectorAll("a")).forEach((a) => a.classList.add("mag"));
    }
    if (cR) rv(cR, { type: "right", d: 250 });
    rv(footer, { type: "fade" });

    // ---------- Magnit tugmalar ----------
    if (fine && !reduce) {
      Array.from(top.querySelectorAll(".mag")).forEach((a) => {
        a.addEventListener(
          "pointermove",
          (e) => {
            const r = a.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            a.style.transform = `translate(${(dx * 0.22).toFixed(1)}px, ${(dy * 0.32).toFixed(1)}px)`;
          },
          { passive: true }
        );
        a.addEventListener("pointerleave", () => (a.style.transform = ""));
      });
    }

    return { header, hero, projects, services, contact, targets, hooks };
  }

  function chrome(parts) {
    // Progress chizig'i
    const prog = doc.createElement("div");
    prog.className = "pprog";
    prog.setAttribute("aria-hidden", "true");
    doc.body.appendChild(prog);

    // Grain
    const grain = doc.createElement("div");
    grain.className = "pgrain";
    grain.setAttribute("aria-hidden", "true");
    doc.body.appendChild(grain);

    // Floating nav
    const nav = doc.createElement("nav");
    nav.className = "pnav";
    nav.setAttribute("aria-label", "Tezkor menyu");
    nav.innerHTML =
      '<a class="pn-logo" href="#top"><i></i>Paradoks</a>' +
      '<div class="pn-links"><span class="pn-ind" aria-hidden="true"></span><a href="#projects">Loyihalar</a><a href="#services">Xizmatlar</a><a href="#contact" class="pn-cta mag">Bog\'lanish</a></div>';
    doc.body.appendChild(nav);

    const links = Array.from(nav.querySelectorAll(".pn-links a:not(.pn-cta)"));
    const linksWrap = nav.querySelector(".pn-links");
    const ind = nav.querySelector(".pn-ind");
    let activeEl = null;
    let hoverEl = null;
    const place = (el) => {
      if (!el) {
        ind.style.opacity = "0";
        return;
      }
      const hidden = ind.style.opacity !== "1";
      if (hidden) ind.style.transition = "none"; // birinchi marta "sirpanib" kelmasin
      ind.style.width = el.offsetWidth + "px";
      ind.style.transform = "translateX(" + el.offsetLeft + "px)";
      ind.style.opacity = "1";
      if (hidden) {
        void ind.offsetWidth;
        ind.style.transition = "";
      }
    };
    links.forEach((a) =>
      a.addEventListener("pointerenter", () => {
        hoverEl = a;
        place(a);
      })
    );
    linksWrap.addEventListener("pointerleave", () => {
      hoverEl = null;
      place(activeEl);
    });
    nav.addEventListener("pointerdown", () => nav.classList.add("press"));
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => nav.addEventListener(ev, () => nav.classList.remove("press")));
    if (fine) {
      nav.addEventListener(
        "pointermove",
        (e) => {
          const r = nav.getBoundingClientRect();
          nav.style.setProperty("--lx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        },
        { passive: true }
      );
    }
    const sections = [
      ["#projects", parts.projects],
      ["#services", parts.services],
      ["#contact", parts.contact],
    ];
    const showAt = () => Math.max(320, parts.header.offsetHeight + 200);

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY || html.scrollTop;
      const max = html.scrollHeight - window.innerHeight;
      prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
      nav.classList.toggle("show", y > showAt());
      parts.hero.style.setProperty("--py", String(Math.round(y)));
      let cur = null;
      sections.forEach(([id, el]) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = id;
      });
      links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === cur));
      const next = links.find((a) => a.getAttribute("href") === cur) || null;
      if (next !== activeEl) {
        activeEl = next;
        if (!hoverEl) place(activeEl);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      onScroll();
      place(hoverEl || activeEl);
    }, { passive: true });
    update();

    // Magnit (nav tugmasi)
    if (fine && !reduce) {
      const a = nav.querySelector(".pn-cta");
      a.addEventListener(
        "pointermove",
        (e) => {
          const r = a.getBoundingClientRect();
          a.style.transform = `translate(${((e.clientX - (r.left + r.width / 2)) * 0.2).toFixed(1)}px, ${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px)`;
        },
        { passive: true }
      );
      a.addEventListener("pointerleave", () => (a.style.transform = ""));
    }
  }

  function start(parts) {
    const { targets, hooks } = parts;
    if (reduce || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("in"));
      hooks.forEach((fn) => fn());
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          io.unobserve(el);
          el.classList.add("in");
          const h = hooks.get(el);
          if (h) setTimeout(h, el._pd || 0);
          // Kirish tugagach kechikishni olib tashlaymiz (hover sekinlashmasin)
          setTimeout(() => el.style.setProperty("--d", "0ms"), (el._pd || 0) + 1300);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    targets.forEach((el) => io.observe(el));
  }

  let done = false;
  function tryInit() {
    if (done) return;
    const top = findTop();
    if (!top || top.dataset.pz) return;
    if (top.innerHTML.indexOf("{{") !== -1) return; // shablon hali chizilmagan
    const parts = decorate(top);
    if (!parts) return;
    top.dataset.pz = "1";
    done = true;
    chrome(parts);
    // Sahifani ochamiz, keyin animatsiyalarni boshlaymiz
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        html.classList.remove("pre");
        html.classList.add("ready");
        setTimeout(() => start(parts), reduce ? 0 : 160);
      })
    );
    mo.disconnect();
  }

  const mo = new MutationObserver(() => requestAnimationFrame(tryInit));
  mo.observe(html, { childList: true, subtree: true });
  tryInit();
  // Ehtiyot: 6 soniyada ham tayyor bo'lmasa, sahifani ochib qo'yamiz
  setTimeout(() => {
    html.classList.remove("pre");
    tryInit();
  }, 6000);
})();
