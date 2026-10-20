/* Vanilla JavaScript features: mobile navigation, theme switch, active section,
   typing headline, project filtering, reveal animations, clipboard, and mailto form. */
(function () {
  "use strict";

  const root = document.documentElement;
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const navAnchors = Array.from(document.querySelectorAll(".nav-link"));
  const themeToggle = document.getElementById("theme-toggle");
  const projectCards = Array.from(document.querySelectorAll(".project-card"));
  const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
  const projectCount = document.getElementById("project-count");
  const toast = document.getElementById("toast");
  const emailAddress = "your.email@example.com"; // Replace with your real email address.
  let toastTimer;

  // Update the small status message without interrupting the user's workflow.
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2800);
  }

  // Feature 1: accessible mobile navigation with Escape-to-close support.
  function closeMenu() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    navLinks.classList.toggle("open", !isOpen);
  });
  navAnchors.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });

  // Feature 2: persistent light/dark theme. Respect system preference on first visit.
  const savedTheme = safelyReadTheme();
  const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  setTheme(initialTheme);
  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try { localStorage.setItem("portfolio-theme", nextTheme); } catch (error) { /* Storage may be disabled. */ }
  });
  function safelyReadTheme() {
    try {
      const stored = localStorage.getItem("portfolio-theme");
      return stored === "light" || stored === "dark" ? stored : null;
    } catch (error) {
      return null;
    }
  }
  function setTheme(theme) {
    root.dataset.theme = theme;
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#101311" : "#f4f5ef");
  }

  // Feature 3: highlight the navigation item for the section currently in view.
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((link) => {
          const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", isCurrent);
          if (isCurrent) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Feature 4: animated role text, with reduced-motion support.
  const typedRole = document.getElementById("typed-role");
  const roles = ["web developer", "creative problem-solver", "lifelong learner"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typedRole && !reduceMotion) {
    let roleIndex = 0;
    let characterIndex = roles[0].length;
    let deleting = true;
    function typeNext() {
      const currentRole = roles[roleIndex];
      if (deleting) {
        characterIndex -= 1;
        typedRole.textContent = currentRole.slice(0, Math.max(0, characterIndex));
        if (characterIndex <= 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          window.setTimeout(typeNext, 300);
          return;
        }
        window.setTimeout(typeNext, 38);
      } else {
        const nextRole = roles[roleIndex];
        characterIndex += 1;
        typedRole.textContent = nextRole.slice(0, characterIndex);
        if (characterIndex >= nextRole.length) {
          deleting = true;
          window.setTimeout(typeNext, 1800);
          return;
        }
        window.setTimeout(typeNext, 62);
      }
    }
    window.setTimeout(typeNext, 1900);
  }

  // Feature 5: filter the project gallery and announce the resulting count.
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const shouldShow = filter === "all" || card.dataset.category === filter;
        card.hidden = !shouldShow;
        if (shouldShow) visibleCount += 1;
      });
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      projectCount.textContent = `Showing ${visibleCount} project${visibleCount === 1 ? "" : "s"}`;
    });
  });

  // Feature 6: reveal sections as they enter the viewport; keep content visible as fallback.
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Feature 7: copy the portfolio email address with a sensible browser fallback.
  const copyButton = document.getElementById("copy-email");
  const copyStatus = document.getElementById("copy-status");
  copyButton.addEventListener("click", async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(emailAddress);
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = emailAddress;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "absolute";
        temporaryInput.style.left = "-9999px";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        temporaryInput.remove();
        if (!copied) throw new Error("Clipboard operation was unavailable.");
      }
      copyStatus.textContent = "Email copied.";
      showToast("Email address copied to clipboard.");
    } catch (error) {
      copyStatus.textContent = "Copy unavailable — select the email address manually.";
      showToast("Copy unavailable. Please select the email address manually.");
    }
  });

  // Feature 8: validate the front-end form, then create a pre-filled email draft.
  // A static site cannot deliver/store form submissions without a backend or form service.
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const name = document.getElementById("name").value.trim();
    const senderEmail = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    if (name.length < 2 || message.length < 10) {
      formStatus.textContent = "Please enter a name and a message of at least 10 characters.";
      showToast("Please check the name and message fields.");
      return;
    }
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nReply to: ${senderEmail}\n\n${message}`);
    formStatus.textContent = "Opening your email app. If nothing opens, use the email address shown beside this form.";
    window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
  });

  // Small polish details.
  document.getElementById("year").textContent = String(new Date().getFullYear());
  const emailLink = document.getElementById("email-link");
  emailLink.textContent = emailAddress;
  emailLink.href = `mailto:${emailAddress}`;
})();
