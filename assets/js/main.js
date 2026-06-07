/* Lustre Nail Bar — interactions */
(function () {
  "use strict";

  /* Year in footer */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile nav toggle */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  function closeNav() {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
  }

  /* Header shadow on scroll */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Booking form: set min date to today + validation + friendly confirm */
  var form = document.getElementById("bookingForm");
  var status = document.getElementById("formStatus");
  var dateInput = document.getElementById("date");
  if (dateInput) {
    var today = new Date();
    var iso = today.toISOString().split("T")[0];
    dateInput.setAttribute("min", iso);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      status.className = "form-status";

      var required = form.querySelectorAll("[required]");
      var firstInvalid = null;
      required.forEach(function (field) {
        var ok = field.value.trim() !== "";
        field.classList.toggle("invalid", !ok);
        if (!ok && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        status.textContent = "Please complete the highlighted fields so we can confirm your booking.";
        status.classList.add("error");
        firstInvalid.focus();
        return;
      }

      var name = form.querySelector("#name").value.trim().split(" ")[0];
      status.textContent =
        "Thank you, " + name + "! Your request is in — we'll call or text shortly to confirm your appointment.";
      status.classList.add("success");
      form.reset();
      status.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    form.querySelectorAll("[required]").forEach(function (field) {
      field.addEventListener("input", function () {
        if (field.value.trim() !== "") field.classList.remove("invalid");
      });
    });
  }
})();
