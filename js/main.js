(function () {
  "use strict";

  /* ============================================================
     CONFIG — quote form delivery
     ------------------------------------------------------------
     Submissions post to /api/quote, a Cloudflare Pages Function
     (functions/api/quote.js) that writes each lead to a D1
     database. See that file's header comment for how photo
     storage (R2) and future email notifications plug in.
  ============================================================ */
  var QUOTE_ENDPOINT = "/api/quote";

  var MAX_PHOTOS = 5;
  var MAX_PHOTO_MB = 8;

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------- Header scroll state ---------------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  var navToggleIcon = navToggle.querySelector("use");
  function setNavIcon(open) {
    navToggleIcon.setAttribute("href", open ? "#icon-close" : "#icon-menu");
  }
  function closeNav() {
    mainNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    setNavIcon(false);
  }
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    setNavIcon(open);
  });
  mainNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeNav);
  });

  /* ---------------- Scroll reveal (staggered within grids) ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  var STAGGER_PARENTS = ".service-grid, .why-grid, .pricing-row, .work-grid, .subservice-grid";

  function applyStagger(el) {
    var parent = el.closest(STAGGER_PARENTS);
    if (!parent) return;
    var siblings = Array.prototype.filter.call(parent.children, function (c) {
      return c.classList && c.classList.contains("reveal");
    });
    var idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = Math.min(idx * 80, 400) + "ms";
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            applyStagger(entry.target);
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------------- Cursor-glow cards ---------------- */
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".glow-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
      });
    });
  }

  /* ---------------- Scroll-spy nav ---------------- */
  var spySections = document.querySelectorAll("main section[id]");
  var navLinksByHash = {};
  document.querySelectorAll(".nav-link").forEach(function (a) {
    navLinksByHash[a.getAttribute("href")] = a;
  });
  if (spySections.length && "IntersectionObserver" in window) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = navLinksByHash["#" + entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            document.querySelectorAll(".nav-link.is-active").forEach(function (a) {
              a.classList.remove("is-active");
            });
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    spySections.forEach(function (s) {
      if (navLinksByHash["#" + s.id]) spyObserver.observe(s);
    });
  }

  /* ---------------- Hero parallax ---------------- */
  var heroArt = document.querySelector(".hero-art img");
  if (heroArt && window.matchMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var parallaxTicking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (parallaxTicking) return;
        parallaxTicking = true;
        requestAnimationFrame(function () {
          var offset = Math.min(window.scrollY * 0.12, 60);
          heroArt.style.transform = "translateY(" + offset + "px)";
          parallaxTicking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------------- Count-up price numbers ---------------- */
  if ("IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);
          var el = entry.target;
          var raw = el.textContent.trim();
          var match = raw.match(/^([^\d]*)([\d,]+)(.*)$/);
          if (!match) return;
          var prefix = match[1],
            target = parseInt(match[2].replace(/,/g, ""), 10),
            suffix = match[3];
          if (isNaN(target)) return;
          var start = performance.now();
          var duration = 900;
          function tick(now) {
            var p = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            var value = Math.round(target * eased);
            el.textContent = prefix + value.toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll(".price strong").forEach(function (el) {
      countObserver.observe(el);
    });
  }


  /* ---------------- Gallery lightbox ---------------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxClose = document.getElementById("lightboxClose");

  document.querySelectorAll(".gallery-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      lightboxImg.src = btn.getAttribute("data-full");
      lightboxImg.alt = btn.querySelector("img").alt;
      lightboxCaption.textContent = btn.getAttribute("data-caption") || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeLightbox();
      closeNav();
      if (quoteModal && quoteModal.classList.contains("is-open")) closeQuoteModal();
    }
  });

  /* ============================================================
     MULTI-STEP QUOTE FORM
  ============================================================ */
  var form = document.getElementById("quoteForm");
  if (!form) return;

  var TOTAL_STEPS = 4;
  var currentStep = 1;
  var photoFiles = []; // array of File

  var stepsEls = form.querySelectorAll(".q-step");
  var qpSteps = document.querySelectorAll(".qp-step");
  var qpFill = document.getElementById("qpFill");
  var qBack = document.getElementById("qBack");
  var qNext = document.getElementById("qNext");
  var qSubmit = document.getElementById("qSubmit");
  var qCurrentStep = document.getElementById("qCurrentStep");
  var qSuccess = document.getElementById("qSuccess");
  var submitError = document.getElementById("submitError");

  function showStep(n, opts) {
    var scroll = opts && opts.scroll;
    stepsEls.forEach(function (el) {
      el.classList.toggle("is-active", Number(el.getAttribute("data-step")) === n);
    });
    qpSteps.forEach(function (el) {
      var s = Number(el.getAttribute("data-step"));
      el.classList.toggle("is-active", s === n);
      el.classList.toggle("is-done", s < n);
    });
    qpFill.style.width = ((n - 1) / (TOTAL_STEPS - 1)) * 100 + "%";
    qCurrentStep.textContent = n;
    qBack.classList.toggle("is-step-one", n === 1);
    if (n === TOTAL_STEPS) {
      qNext.hidden = true;
      qSubmit.hidden = false;
      buildReview();
    } else {
      qNext.hidden = false;
      qSubmit.hidden = true;
    }
    submitError.style.display = "none";
    if (scroll) {
      var scrollEl = form.closest(".quote-modal-scroll");
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function fieldWrap(el) {
    return el.closest(".field");
  }

  function setError(el, show) {
    var wrap = fieldWrap(el);
    if (wrap) wrap.classList.toggle("has-error", show);
  }

  function validateStep(n) {
    var ok = true;
    var firstInvalid = null;

    if (n === 1) {
      var serviceGrid = document.querySelector(".service-choice-grid");
      var anyService = form.querySelectorAll('input[name="service"]:checked').length > 0;
      document.getElementById("serviceError").style.display = anyService ? "none" : "block";
      if (!anyService) {
        ok = false;
        firstInvalid = serviceGrid;
      }

      var photoErr = document.getElementById("photoError");
      photoErr.style.display = "none";
    }

    if (n === 3) {
      ["fullName", "phone", "email"].forEach(function (id) {
        var el = document.getElementById(id);
        var valid = el.checkValidity() && el.value.trim() !== "";
        setError(el, !valid);
        if (!valid) {
          ok = false;
          if (!firstInvalid) firstInvalid = el;
        }
      });
    }

    if (n === 4) {
      var consent = document.getElementById("consentCheck");
      var consentErr = document.getElementById("consentError");
      var valid = consent.checked;
      consentErr.style.display = valid ? "none" : "block";
      if (!valid) {
        ok = false;
        firstInvalid = consent;
      }
    }

    if (!ok && firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return ok;
  }

  qNext.addEventListener("click", function () {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      showStep(currentStep, { scroll: true });
    }
  });

  qBack.addEventListener("click", function () {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep, { scroll: true });
    }
  });

  // live-clear field errors as the user types/checks
  form.addEventListener("input", function (e) {
    if (e.target.matches("input, textarea")) setError(e.target, false);
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "service") {
      var any = form.querySelectorAll('input[name="service"]:checked').length > 0;
      if (any) document.getElementById("serviceError").style.display = "none";
    }
    if (e.target.id === "consentCheck" && e.target.checked) {
      document.getElementById("consentError").style.display = "none";
    }
  });

  /* ---------------- Photo attachment ---------------- */
  var dropzone = document.getElementById("dropzone");
  var photoInput = document.getElementById("photoInput");
  var photoPreviews = document.getElementById("photoPreviews");
  var photoError = document.getElementById("photoError");

  dropzone.addEventListener("click", function () {
    photoInput.click();
  });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      photoInput.click();
    }
  });
  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("is-dragover");
  });
  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
    addPhotos(e.dataTransfer.files);
  });
  photoInput.addEventListener("change", function () {
    addPhotos(photoInput.files);
  });

  function addPhotos(fileList) {
    var errors = [];
    Array.prototype.forEach.call(fileList, function (file) {
      if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
        errors.push(file.name + " isn't a JPG or PNG.");
        return;
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        errors.push(file.name + " is over " + MAX_PHOTO_MB + "MB.");
        return;
      }
      if (photoFiles.length >= MAX_PHOTOS) {
        errors.push("You can attach up to " + MAX_PHOTOS + " photos.");
        return;
      }
      photoFiles.push(file);
    });

    if (errors.length) {
      photoError.textContent = errors[0];
      photoError.style.display = "block";
    } else {
      photoError.style.display = "none";
    }

    syncPhotoInput();
    renderPreviews();
  }

  function removePhoto(index) {
    photoFiles.splice(index, 1);
    syncPhotoInput();
    renderPreviews();
  }

  function syncPhotoInput() {
    var dt = new DataTransfer();
    photoFiles.forEach(function (f) {
      dt.items.add(f);
    });
    photoInput.files = dt.files;
  }

  function renderPreviews() {
    photoPreviews.innerHTML = "";
    photoFiles.forEach(function (file, i) {
      var url = URL.createObjectURL(file);
      var div = document.createElement("div");
      div.className = "photo-thumb";
      div.innerHTML =
        '<img src="' + url + '" alt="' + file.name.replace(/"/g, "") + '">' +
        '<button type="button" aria-label="Remove photo"><svg class="icon"><use href="#icon-trash"/></svg></button>';
      div.querySelector("button").addEventListener("click", function () {
        removePhoto(i);
      });
      photoPreviews.appendChild(div);
    });
  }

  /* ---------------- Review step ---------------- */
  var reviewGrid = document.getElementById("reviewGrid");

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function checkedValues(name) {
    return Array.prototype.map
      .call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (el) {
        return el.value;
      })
      .join(", ");
  }
  function radioValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "—";
  }

  function reviewRow(label, value) {
    return (
      '<div class="review-item"><dt>' +
      label +
      "</dt><dd>" +
      (value && value.trim() ? value : "—") +
      "</dd></div>"
    );
  }

  function buildReview() {
    var rows = "";
    rows += reviewRow("Service(s)", checkedValues("service"));
    rows += reviewRow("Project Notes", val("projectNotes"));

    var vehicleBits = [val("vehicleMake"), val("vehicleModel"), val("vehicleYear")].filter(Boolean).join(" ");
    rows += reviewRow("Vehicle", vehicleBits || (val("vehicleColour") ? val("vehicleColour") : ""));
    if (val("vehicleColour")) rows += reviewRow("Colour", val("vehicleColour"));
    rows += reviewRow("Package Preference", radioValue("package"));
    rows += reviewRow("Timeframe", radioValue("timeframe"));

    rows += reviewRow("Name", val("fullName"));
    rows += reviewRow("Phone", val("phone"));
    rows += reviewRow("Email", val("email"));
    if (val("suburb")) rows += reviewRow("Suburb", val("suburb"));
    rows += reviewRow("Preferred Contact", radioValue("contactMethod"));
    if (val("extraNotes")) rows += reviewRow("Additional Notes", val("extraNotes"));

    reviewGrid.innerHTML = rows;

    if (photoFiles.length) {
      var photosHtml = '<div class="review-item"><dt>Photos</dt><dd><div class="review-photos">';
      photoFiles.forEach(function (f) {
        photosHtml += '<img src="' + URL.createObjectURL(f) + '" alt="">';
      });
      photosHtml += "</div></dd></div>";
      reviewGrid.insertAdjacentHTML("beforeend", photosHtml);
    }
  }

  /* ---------------- Submit ---------------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(4)) return;

    qSubmit.disabled = true;
    qSubmit.textContent = "Sending…";

    var fd = new FormData(form);

    fetch(QUOTE_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: fd,
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
          return data;
        });
      })
      .then(function () {
        form.classList.add("is-submitted");
        qSuccess.classList.add("is-active");
      })
      .catch(function (err) {
        var prefix = err && err.message ? err.message + " " : "Something went wrong sending your request — ";
        submitError.innerHTML = prefix + 'please call us on <a href="tel:+61431338149">0431 338 149</a> instead.';
        submitError.style.display = "block";
        qSubmit.disabled = false;
        qSubmit.innerHTML = 'Send Quote Request <svg class="icon"><use href="#icon-arrow-right"/></svg>';
      });
  });

  showStep(1, { scroll: false });

  /* ============================================================
     QUOTE MODAL
  ============================================================ */
  var quoteModal = document.getElementById("quoteModal");
  var quoteModalBackdrop = document.getElementById("quoteModalBackdrop");
  var quoteModalCloseBtn = document.getElementById("quoteModalClose");
  var quoteModalScroll = document.querySelector(".quote-modal-scroll");
  var quoteModalTrigger = null;

  function openQuoteModal(trigger) {
    quoteModalTrigger = trigger || null;

    if (trigger) {
      var svc = trigger.getAttribute("data-quote-service");
      if (svc) {
        var box = form.querySelector('input[name="service"][value="' + svc + '"]');
        if (box) {
          box.checked = true;
          document.getElementById("serviceError").style.display = "none";
        }
      }
      var pkg = trigger.getAttribute("data-quote-package");
      if (pkg) {
        var radio = form.querySelector('input[name="package"][value="' + pkg + '"]');
        if (radio) radio.checked = true;
      }
      var note = trigger.getAttribute("data-quote-note");
      var notesEl = document.getElementById("projectNotes");
      if (note && notesEl && !notesEl.value.trim()) notesEl.value = note;
    }

    currentStep = 1;
    showStep(1, { scroll: false });
    if (quoteModalScroll) quoteModalScroll.scrollTop = 0;

    quoteModal.classList.add("is-open");
    quoteModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    window.setTimeout(function () {
      var firstField = form.querySelector('input[name="service"]');
      if (firstField) firstField.focus();
    }, 350);
  }

  function closeQuoteModal() {
    quoteModal.classList.remove("is-open");
    quoteModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (quoteModalTrigger && typeof quoteModalTrigger.focus === "function") {
      quoteModalTrigger.focus();
    }
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest('a[href="#quote"]');
    if (trigger) {
      e.preventDefault();
      openQuoteModal(trigger);
    }
  });
  quoteModalCloseBtn.addEventListener("click", closeQuoteModal);
  quoteModalBackdrop.addEventListener("click", closeQuoteModal);
})();
