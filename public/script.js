"use strict";

/* ===== Theme + Accent Settings Module ===== */
(function () {
    const THEME_KEY = "portfolio-theme";
    const ACCENT_KEY = "portfolio-accent";
    const VALID_ACCENTS = ["sky", "green", "purple", "pink", "orange"];
    const ACCENT_NAMES = {
        sky: "Sky Blue",
        green: "Green",
        purple: "Purple",
        pink: "Pink",
        orange: "Orange",
    };
    const DEFAULT_ACCENT = "sky";

    const themeToggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const metaThemeColor = document.getElementById("meta-theme-color");

    const settingsBtn = document.getElementById("settingsBtn");
    const settingsPanel = document.getElementById("settingsPanel");
    const settingsOverlay = document.getElementById("settingsOverlay");
    const settingsClose = document.getElementById("settingsClose");
    const swatches = settingsPanel
        ? Array.from(settingsPanel.querySelectorAll(".swatch"))
        : [];
    const swatchName = document.getElementById("swatchName");
    const modeLightBtn = document.getElementById("modeLight");
    const modeDarkBtn = document.getElementById("modeDark");

    let lastFocused = null;
    let closeTimer = null;

    /** Read from localStorage; fall back to OS preference */
    function getPreferredTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "dark" || saved === "light") return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function getPreferredAccent() {
        const saved = localStorage.getItem(ACCENT_KEY);
        if (VALID_ACCENTS.includes(saved)) return saved;
        return DEFAULT_ACCENT;
    }

    function syncModeButtons(theme) {
        if (modeLightBtn)
            modeLightBtn.setAttribute(
                "aria-pressed",
                String(theme === "light")
            );
        if (modeDarkBtn)
            modeDarkBtn.setAttribute("aria-pressed", String(theme === "dark"));
    }

    /** Apply the given theme — updates body+html class, icon, meta tag, aria-label, localStorage */
    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark-theme", isDark);
        document.documentElement.classList.toggle("dark-theme", isDark);

        /* Icon: sun = light mode, moon = dark mode */
        if (themeIcon) {
            themeIcon.className = isDark ? "fas fa-moon" : "fas fa-sun";
        }

        /* Aria label describes the *action*, not the current state */
        if (themeToggleBtn) {
            themeToggleBtn.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );
        }

        /* Browser toolbar color */
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                "content",
                isDark ? "#0a0a0a" : "#f8f9fa"
            );
        }

        syncModeButtons(theme);

        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            /* storage unavailable — theme still applies for this session */
        }
    }

    /** Apply accent color — updates <html data-accent>, swatches, label, localStorage */
    function applyAccent(accent) {
        const next = VALID_ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT;
        document.documentElement.setAttribute("data-accent", next);

        swatches.forEach((btn) => {
            const active = btn.dataset.color === next;
            btn.setAttribute("aria-checked", String(active));
            btn.tabIndex = 0;
        });

        if (swatchName) {
            swatchName.textContent = ACCENT_NAMES[next] || next;
        }

        try {
            localStorage.setItem(ACCENT_KEY, next);
        } catch (e) {
            /* ignore */
        }
    }

    /** Toggle between dark and light, with icon spin animation */
    function toggleTheme() {
        const current = document.body.classList.contains("dark-theme")
            ? "dark"
            : "light";
        const next = current === "dark" ? "light" : "dark";

        /* Trigger spin animation */
        if (themeIcon) {
            themeIcon.classList.add("spin");
            themeIcon.addEventListener(
                "animationend",
                () => themeIcon.classList.remove("spin"),
                { once: true }
            );
        }

        applyTheme(next);
    }

    function openSettings() {
        if (!settingsPanel || !settingsOverlay) return;
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
        lastFocused = document.activeElement;
        settingsPanel.hidden = false;
        settingsOverlay.hidden = false;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                settingsPanel.classList.add("open");
                settingsOverlay.classList.add("show");
            });
        });
        if (settingsBtn) settingsBtn.setAttribute("aria-expanded", "true");
        if (settingsClose) settingsClose.focus();
        document.addEventListener("keydown", onPanelKeydown);
    }

    function closeSettings() {
        if (!settingsPanel || !settingsOverlay) return;
        settingsPanel.classList.remove("open");
        settingsOverlay.classList.remove("show");
        if (settingsBtn) settingsBtn.setAttribute("aria-expanded", "false");
        document.removeEventListener("keydown", onPanelKeydown);
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            settingsPanel.hidden = true;
            settingsOverlay.hidden = true;
            closeTimer = null;
        }, 300);
        if (lastFocused && typeof lastFocused.focus === "function") {
            lastFocused.focus();
        } else if (settingsBtn) {
            settingsBtn.focus();
        }
    }

    function onPanelKeydown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            closeSettings();
        }
    }

    /* Click handler */
    if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);

    /* Keyboard accessibility: Enter and Space (native buttons already handle this,
       kept for parity with original implementation) */
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleTheme();
            }
        });
    }

    /* Settings panel wiring */
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            const isOpen =
                settingsPanel &&
                !settingsPanel.hidden &&
                settingsPanel.classList.contains("open");
            if (isOpen) closeSettings();
            else openSettings();
        });
    }
    if (settingsClose) settingsClose.addEventListener("click", closeSettings);
    if (settingsOverlay) settingsOverlay.addEventListener("click", closeSettings);

    swatches.forEach((btn) => {
        btn.addEventListener("click", () => applyAccent(btn.dataset.color));
    });

    if (modeLightBtn)
        modeLightBtn.addEventListener("click", () => applyTheme("light"));
    if (modeDarkBtn)
        modeDarkBtn.addEventListener("click", () => applyTheme("dark"));

    /* Listen for OS-level theme changes (if user hasn't manually set a preference) */
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
            try {
                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(e.matches ? "dark" : "light");
                }
            } catch (err) {
                /* ignore */
            }
        });

    /* Initialize on page load */
    applyTheme(getPreferredTheme());
    applyAccent(getPreferredAccent());
})();

/* ===== Mobile nav toggle ===== */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
});
navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
    });
});

/* ===== Header shadow + scroll progress ===== */
const header = document.querySelector("header");
const progress = document.getElementById("scroll-progress");
const backToTop = document.getElementById("back-to-top");

function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 10);
    backToTop.classList.toggle("show", y > 400);

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = docH > 0 ? `${(y / docH) * 100}%` : "0%";
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ===== Back to top ===== */
backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ===== Scroll reveal (staggered) ===== */
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const groupDelay = entry.target.parentElement
                    ? Array.from(entry.target.parentElement.children).indexOf(
                          entry.target
                      )
                    : 0;
                entry.target.style.transitionDelay = `${Math.min(groupDelay, 4) * 90}ms`;
                entry.target.classList.add("in");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach((el) => revealObserver.observe(el));

/* ===== Animated stat counters ===== */
const counters = document.querySelectorAll(".stat-num");
const counterObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10) || 0;
            const duration = 1200;
            const start = performance.now();
            function tick(now) {
                const p = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(eased * target);
                if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
        });
    },
    { threshold: 0.5 }
);
counters.forEach((c) => counterObserver.observe(c));

/* ===== Active nav link on scroll (scrollspy) ===== */
const sections = document.querySelectorAll("section[id]");
const navAnchors = navLinks.querySelectorAll("a");
const spy = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navAnchors.forEach((a) =>
                    a.classList.toggle(
                        "active",
                        a.getAttribute("href") === `#${id}`
                    )
                );
            }
        });
    },
    { threshold: 0.4 }
);
sections.forEach((s) => spy.observe(s));

/* ===== Contact form validation ===== */
const fields = {
    name: {
        el: document.getElementById("name"),
        err: document.getElementById("r_name"),
    },
    email: {
        el: document.getElementById("email"),
        err: document.getElementById("r_mail"),
    },
    subject: {
        el: document.getElementById("subject"),
        err: document.getElementById("r_subject"),
    },
    message: {
        el: document.getElementById("message"),
        err: document.getElementById("r_message"),
    },
};

function setError(field, msg) {
    field.err.textContent = msg;
    field.el.classList.toggle("invalid", Boolean(msg));
    return !msg;
}

function validateName() {
    return setError(
        fields.name,
        fields.name.el.value.trim().length < 3 ? "At least 3 characters" : ""
    );
}
function validateEmail() {
    const v = fields.email.el.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return setError(fields.email, ok ? "" : "Enter a valid email address");
}
function validateSubject() {
    return setError(
        fields.subject,
        fields.subject.el.value.trim().length < 3 ? "At least 3 characters" : ""
    );
}
function validateMessage() {
    return setError(
        fields.message,
        fields.message.el.value.trim().length < 5 ? "At least 5 characters" : ""
    );
}

fields.name.el.addEventListener("input", validateName);
fields.email.el.addEventListener("input", validateEmail);
fields.subject.el.addEventListener("input", validateSubject);
fields.message.el.addEventListener("input", validateMessage);

const form = document.getElementById("form");
const sendBtn = document.getElementById("sendBtn");
const formSuccess = document.getElementById("formSuccess");

/* ===== EmailJS ===== */
emailjs.init("5puN63s5wiSnXbp3p");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const valid = [
        validateName(),
        validateEmail(),
        validateSubject(),
        validateMessage(),
    ].every(Boolean);

    if (!valid) return;

    const original = sendBtn.innerHTML;

    sendBtn.disabled = true;
    sendBtn.innerHTML = "Sending...";

    try {
        await emailjs.send("service_iwrah5p", "template_0no30vq", {
            from_name: fields.name.el.value.trim(),
            from_email: fields.email.el.value.trim(),
            subject: fields.subject.el.value.trim(),
            message: fields.message.el.value.trim(),
            to_email: "yb109324@gmail.com",
        });

        formSuccess.textContent = "Message sent successfully!";
        formSuccess.classList.add("show");

        form.reset();

        setTimeout(() => {
            formSuccess.classList.remove("show");
        }, 4000);
    } catch (error) {
        console.error("EmailJS Error:", error);

        formSuccess.textContent = "Failed to send message!";
        formSuccess.classList.add("show");

        setTimeout(() => {
            formSuccess.classList.remove("show");
        }, 4000);
    }

    sendBtn.disabled = false;
    sendBtn.innerHTML = original;
});