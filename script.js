(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toast = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  // Feature 1: mobile navigation open/close, including Escape and link activation.
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  const navAnchors = Array.from(document.querySelectorAll(".nav-link"));

  function closeMenu() {
    if (!menuToggle || !navLinks) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    navLinks.classList.remove("is-open");
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
      navLinks.classList.toggle("is-open", isOpen);
    });
    navAnchors.forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  // Feature 2: persistent monochrome theme toggle.
  const themeToggle = document.getElementById("theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function setTheme(theme) {
    root.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      themeToggle.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    }
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#080808" : "#f5f5f5");
  }
  try {
    const storedTheme = window.localStorage.getItem("portfolio-theme");
    if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
  } catch (error) {
    // Theme switching remains functional if local storage is unavailable.
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      try { window.localStorage.setItem("portfolio-theme", nextTheme); } catch (error) {}
    });
  }

  // Feature 3: featured-work slideshow with arrows, slide dots, and automatic rotation.
  const slides = Array.from(document.querySelectorAll(".showcase-slide"));
  const slideDots = Array.from(document.querySelectorAll("[data-slide-to]"));
  const slideCurrent = document.getElementById("slide-current");
  const slideStatus = document.getElementById("slide-status");
  const showcase = document.querySelector(".showcase");
  let currentSlide = 0;
  let carouselTimer = null;
  const slideNames = [
    "Game Design and Development",
    "Digital Illustration",
    "Graphic Design",
    "Animation",
    "Web Design",
    "Programming and Data"
  ];

  function showSlide(index) {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === currentSlide;
      slide.hidden = !active;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    slideDots.forEach((dot, dotIndex) => {
      const active = dotIndex === currentSlide;
      dot.classList.toggle("active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    if (slideCurrent) slideCurrent.textContent = String(currentSlide + 1).padStart(2, "0");
    if (slideStatus) slideStatus.textContent = `Slide ${currentSlide + 1} of ${slides.length}: ${slideNames[currentSlide] || "Work"}`;
  }

  function stopCarousel() {
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  }
  function startCarousel() {
    stopCarousel();
    if (!reduceMotion && slides.length > 1) {
      carouselTimer = window.setInterval(() => showSlide(currentSlide + 1), 5500);
    }
  }

  document.querySelectorAll("[data-slide-step]").forEach((button) => {
    button.addEventListener("click", () => {
      showSlide(currentSlide + Number(button.dataset.slideStep));
      startCarousel();
    });
  });
  slideDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.slideTo));
      startCarousel();
    });
  });
  if (showcase) {
    showcase.addEventListener("mouseenter", stopCarousel);
    showcase.addEventListener("mouseleave", startCarousel);
    showcase.addEventListener("focusin", stopCarousel);
    showcase.addEventListener("focusout", (event) => {
      if (!showcase.contains(event.relatedTarget)) startCarousel();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopCarousel();
      else startCarousel();
    });
  }
  showSlide(0);
  startCarousel();

  // Feature 4: update the active navigation item as page sections enter view.
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
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Feature 5: category filters for the six work placeholders.
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll(".project-card[data-category]"));
  const projectCount = document.getElementById("project-count");
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
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      if (projectCount) projectCount.textContent = `Showing ${visibleCount} categor${visibleCount === 1 ? "y" : "ies"}`;
    });
  });

  // Feature 6: reveal content on scroll; all content remains visible as fallback.
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    root.classList.add("js-reveal");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -25px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Feature 7: copy the contact email address.
  const emailAddress = "102457@unimas.siswa.my";
  const copyButton = document.getElementById("copy-email");
  const copyStatus = document.getElementById("copy-status");
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(emailAddress);
        } else {
          const temporaryInput = document.createElement("textarea");
          temporaryInput.value = emailAddress;
          temporaryInput.setAttribute("readonly", "");
          temporaryInput.style.position = "fixed";
          temporaryInput.style.opacity = "0";
          document.body.appendChild(temporaryInput);
          temporaryInput.select();
          const copied = document.execCommand("copy");
          temporaryInput.remove();
          if (!copied) throw new Error("Clipboard unavailable");
        }
        if (copyStatus) copyStatus.textContent = "Copied";
        showToast("Email address copied.");
      } catch (error) {
        if (copyStatus) copyStatus.textContent = "Copy unavailable";
        showToast("Copy unavailable. Please select the email address manually.");
      }
    });
  }

  // Footer year.
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
