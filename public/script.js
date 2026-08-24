"use strict";

/* ===== Theme Toggle Module ===== */
(function () {
    const THEME_KEY = "portfolio-theme";
    const themeToggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const metaThemeColor = document.getElementById("meta-theme-color");

    /** Read from localStorage; fall back to OS preference */
    function getPreferredTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "dark" || saved === "light") return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    /** Apply the given theme — updates body class, icon, meta tag, aria-label, localStorage */
    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle("dark-theme", isDark);

        /* Icon: sun = light mode, moon = dark mode */
        themeIcon.className = isDark ? "fas fa-moon" : "fas fa-sun";

        /* Aria label describes the *action*, not the current state */
        themeToggleBtn.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );

        /* Browser toolbar color */
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                "content",
                isDark ? "#0a0a0a" : "#f8f9fa"
            );
        }

        localStorage.setItem(THEME_KEY, theme);
    }

    /** Toggle between dark and light, with icon spin animation */
    function toggleTheme() {
        const current = document.body.classList.contains("dark-theme")
            ? "dark"
            : "light";
        const next = current === "dark" ? "light" : "dark";

        /* Trigger spin animation */
        themeIcon.classList.add("spin");
        themeIcon.addEventListener(
            "animationend",
            () => themeIcon.classList.remove("spin"),
            { once: true }
        );

        applyTheme(next);
    }

    /* Click handler */
    themeToggleBtn.addEventListener("click", toggleTheme);

    /* Keyboard accessibility: Enter and Space */
    themeToggleBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleTheme();
        }
    });

    /* Listen for OS-level theme changes (if user hasn't manually set a preference) */
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? "dark" : "light");
            }
        });

    /* Initialize on page load */
    applyTheme(getPreferredTheme());
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