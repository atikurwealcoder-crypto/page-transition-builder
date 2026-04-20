(function () {
  "use strict";

  /* ============================================================
       Easing list — shown in the Easing dropdown
       ============================================================ */
  const EASES = [
    "ease-in",
    "ease-out",
    "power1.inOut",
    "power2.inOut",
    "power3.inOut",
    "power4.inOut",
    "expo.inOut",
    "sine.inOut",
    "circ.inOut",
    "back.inOut(1.7)",
    "power2.out",
    "power3.out",
    "expo.out",
    "power2.in",
    "power3.in",
    "none",
  ];

  /* ============================================================
       Color helper — lighten or darken a hex by N (per channel)
       ============================================================ */
  function tintColor(hex, delta) {
    const h = (hex || "#000000").replace("#", "");
    const num = parseInt(h, 16) || 0;
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + delta));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + delta));
    const b = Math.max(0, Math.min(255, (num & 0xff) + delta));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  /* ============================================================
       Shared timing schema — split across exit & enter phases.
       Each transition composes its schema with TIMING(...).
       ============================================================ */
  /* Shared small vocabulary to avoid repeating literals across schemas */
  const STAGGER_FROM = ["start", "end", "center", "edges", "random"];

  const TIMING = (exitDur, enterDur, defaultEase) => ({
    exitDelay: {
      phase: "exit",
      type: "range",
      label: "Delay",
      min: 0,
      max: 2,
      step: 0.05,
      unit: "s",
      default: 0,
    },
    exitDuration: {
      phase: "exit",
      type: "range",
      label: "Duration",
      min: 0.2,
      max: 2,
      step: 0.05,
      unit: "s",
      default: exitDur,
    },
    exitEase: {
      phase: "exit",
      type: "select",
      label: "Easing",
      options: EASES,
      default: defaultEase,
    },
    exitOpacity: {
      phase: "exit",
      type: "range",
      label: "Opacity",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
    },
    enterDelay: {
      phase: "enter",
      type: "range",
      label: "Delay",
      min: 0,
      max: 2,
      step: 0.05,
      unit: "s",
      default: 0,
    },
    enterDuration: {
      phase: "enter",
      type: "range",
      label: "Duration",
      min: 0.2,
      max: 2,
      step: 0.05,
      unit: "s",
      default: enterDur,
    },
    enterEase: {
      phase: "enter",
      type: "select",
      label: "Easing",
      options: EASES,
      default: defaultEase,
    },
    enterOpacity: {
      phase: "enter",
      type: "range",
      label: "Opacity",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
    },
  });

  /* ============================================================
       Transition registry
       Every schema prop tagged with `phase: 'shared' | 'exit' | 'enter'`
       so the builder can group them into sections.
       ============================================================ */
  const TRANSITIONS = {
    curtain: {
      label: "Curtain Slide",
      schema: {
        direction: {
          phase: "shared",
          type: "select",
          label: "Direction",
          options: ["up", "down", "left", "right"],
          default: "up",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        ...TIMING(0.85, 1.0, "power3.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        o.querySelector(".pt-panel").style.background = c.color;
      },
      _prop(c) {
        return c.direction === "left" || c.direction === "right"
          ? "xPercent"
          : "yPercent";
      },
      _exitFrom(c) {
        return { up: 100, down: -100, left: 100, right: -100 }[c.direction];
      },
      _enterTo(c) {
        return { up: -100, down: 100, left: -100, right: 100 }[c.direction];
      },
      arrive(o) {
        gsap.set(o.querySelector(".pt-panel"), { xPercent: 0, yPercent: 0 });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          [this._prop(c)]: this._enterTo(c),
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        const p = this._prop(c);
        const from = { xPercent: 0, yPercent: 0 };
        from[p] = this._exitFrom(c);
        gsap.set(o.querySelector(".pt-panel"), from);
        return gsap.to(o.querySelector(".pt-panel"), {
          [p]: 0,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    split: {
      label: "Split Reveal",
      schema: {
        axis: {
          phase: "shared",
          type: "select",
          label: "Axis",
          options: ["vertical", "horizontal"],
          default: "vertical",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        ...TIMING(0.9, 1.0, "power3.inOut"),
      },
      build(o, c) {
        o.setAttribute("data-axis", c.axis);
        o.innerHTML =
          '<div class="pt-split-a"></div><div class="pt-split-b"></div>';
        o.querySelectorAll(".pt-split-a, .pt-split-b").forEach(
          (el) => (el.style.background = c.color),
        );
      },
      _prop(c) {
        return c.axis === "horizontal" ? "xPercent" : "yPercent";
      },
      arrive(o) {
        gsap.set(o.querySelectorAll(".pt-split-a, .pt-split-b"), {
          xPercent: 0,
          yPercent: 0,
        });
      },
      enter(o, c) {
        const p = this._prop(c);
        const tl = gsap.timeline();
        tl.to(
          o.querySelector(".pt-split-a"),
          { [p]: -100, duration: c.enterDuration, ease: c.enterEase },
          0,
        ).to(
          o.querySelector(".pt-split-b"),
          { [p]: 100, duration: c.enterDuration, ease: c.enterEase },
          0,
        );
        return tl;
      },
      exit(o, c) {
        const p = this._prop(c);
        const a = { xPercent: 0, yPercent: 0 };
        a[p] = -100;
        const b = { xPercent: 0, yPercent: 0 };
        b[p] = 100;
        gsap.set(o.querySelector(".pt-split-a"), a);
        gsap.set(o.querySelector(".pt-split-b"), b);
        const tl = gsap.timeline();
        tl.to(
          o.querySelector(".pt-split-a"),
          { [p]: 0, duration: c.exitDuration, ease: c.exitEase },
          0,
        ).to(
          o.querySelector(".pt-split-b"),
          { [p]: 0, duration: c.exitDuration, ease: c.exitEase },
          0,
        );
        return tl;
      },
    },

    stagger: {
      label: "Panel Stagger",
      schema: {
        count: {
          phase: "shared",
          type: "range",
          label: "Panel count",
          min: 2,
          max: 12,
          step: 1,
          default: 6,
        },
        direction: {
          phase: "shared",
          type: "select",
          label: "Slide direction",
          options: ["up", "down"],
          default: "up",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        altTint: {
          phase: "shared",
          type: "toggle",
          label: "Alternate tint",
          default: true,
        },
        ...TIMING(0.75, 0.85, "power3.inOut"),
        exitStaggerFrom: {
          phase: "exit",
          type: "select",
          label: "Stagger from",
          options: STAGGER_FROM,
          default: "start",
        },
        exitStaggerEach: {
          phase: "exit",
          type: "range",
          label: "Stagger delay",
          min: 0.02,
          max: 0.2,
          step: 0.01,
          unit: "s",
          default: 0.07,
        },
        enterStaggerFrom: {
          phase: "enter",
          type: "select",
          label: "Stagger from",
          options: STAGGER_FROM,
          default: "start",
        },
        enterStaggerEach: {
          phase: "enter",
          type: "range",
          label: "Stagger delay",
          min: 0.02,
          max: 0.2,
          step: 0.01,
          unit: "s",
          default: 0.07,
        },
      },
      build(o, c) {
        const alt = c.altTint ? tintColor(c.color, 10) : c.color;
        // 1px self-colored box-shadow bleeds over sub-pixel gaps between
        // flex-distributed bars; scales with the bar's transform so it
        // doesn't leave residue during enter/exit animation.
        o.innerHTML = Array.from({ length: c.count })
          .map((_, i) => {
            const bg = i % 2 ? alt : c.color;
            return `<div class="pt-bar" style="background:${bg};box-shadow:0 0 0 1px ${bg}"></div>`;
          })
          .join("");
      },
      _signs(c) {
        return c.direction === "down"
          ? { from: -100, to: 100 }
          : { from: 100, to: -100 };
      },
      arrive(o) {
        gsap.set(o.querySelectorAll(".pt-bar"), { yPercent: 0 });
      },
      enter(o, c) {
        return gsap.to(o.querySelectorAll(".pt-bar"), {
          yPercent: this._signs(c).to,
          duration: c.enterDuration,
          ease: c.enterEase,
          stagger: { each: c.enterStaggerEach, from: c.enterStaggerFrom },
        });
      },
      exit(o, c) {
        gsap.set(o.querySelectorAll(".pt-bar"), {
          yPercent: this._signs(c).from,
        });
        return gsap.to(o.querySelectorAll(".pt-bar"), {
          yPercent: 0,
          duration: c.exitDuration,
          ease: c.exitEase,
          stagger: { each: c.exitStaggerEach, from: c.exitStaggerFrom },
        });
      },
    },

    fade: {
      label: "Fade",
      schema: {
        color: {
          phase: "shared",
          type: "color",
          label: "Overlay color",
          default: "#0a0a0a",
        },
        ...TIMING(0.6, 0.8, "power2.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        o.querySelector(".pt-panel").style.background = c.color;
      },
      arrive(o) {
        gsap.set(o.querySelector(".pt-panel"), { autoAlpha: 1 });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          autoAlpha: 0,
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        gsap.set(o.querySelector(".pt-panel"), { autoAlpha: 0 });
        return gsap.to(o.querySelector(".pt-panel"), {
          autoAlpha: 1,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    diagonal: {
      label: "Diagonal Slice",
      schema: {
        angle: {
          phase: "shared",
          type: "range",
          label: "Angle",
          min: -45,
          max: 45,
          step: 1,
          unit: "°",
          default: -18,
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        ...TIMING(0.95, 1.1, "power3.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        o.querySelector(".pt-panel").style.background = c.color;
      },
      arrive(o, c) {
        gsap.set(o.querySelector(".pt-panel"), {
          xPercent: 0,
          yPercent: 0,
          rotation: c.angle,
        });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          xPercent: -80,
          yPercent: -80,
          rotation: c.angle,
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        gsap.set(o.querySelector(".pt-panel"), {
          xPercent: 80,
          yPercent: 80,
          rotation: c.angle,
        });
        return gsap.to(o.querySelector(".pt-panel"), {
          xPercent: 0,
          yPercent: 0,
          rotation: c.angle,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    circle: {
      label: "Circle Reveal",
      schema: {
        origin: {
          phase: "shared",
          type: "select",
          label: "Origin",
          options: [
            "center",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "top",
            "bottom",
            "left",
            "right",
          ],
          default: "center",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Circle color",
          default: "#0a0a0a",
        },
        ...TIMING(0.9, 1.0, "power3.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-circle"></div>';
        const el = o.querySelector(".pt-circle");
        el.style.background = c.color;
        const positions = {
          center: { top: "50%", left: "50%" },
          "top-left": { top: "0%", left: "0%" },
          "top-right": { top: "0%", left: "100%" },
          "bottom-left": { top: "100%", left: "0%" },
          "bottom-right": { top: "100%", left: "100%" },
          top: { top: "0%", left: "50%" },
          bottom: { top: "100%", left: "50%" },
          left: { top: "50%", left: "0%" },
          right: { top: "50%", left: "100%" },
        };
        const p = positions[c.origin] || positions.center;
        el.style.top = p.top;
        el.style.left = p.left;
      },
      arrive(o) {
        gsap.set(o.querySelector(".pt-circle"), { scale: 35 });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-circle"), {
          scale: 0,
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        gsap.set(o.querySelector(".pt-circle"), { scale: 0 });
        return gsap.to(o.querySelector(".pt-circle"), {
          scale: 35,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    scale: {
      label: "Scale / Zoom",
      schema: {
        origin: {
          phase: "shared",
          type: "select",
          label: "Origin",
          options: [
            "center",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "top",
            "bottom",
            "left",
            "right",
          ],
          default: "center",
        },
        startScale: {
          phase: "shared",
          type: "range",
          label: "Start scale",
          min: 0,
          max: 0.6,
          step: 0.02,
          default: 0,
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        ...TIMING(0.85, 1.0, "power3.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        const panel = o.querySelector(".pt-panel");
        panel.style.background = c.color;
        const origins = {
          center: "50% 50%",
          "top-left": "0% 0%",
          "top-right": "100% 0%",
          "bottom-left": "0% 100%",
          "bottom-right": "100% 100%",
          top: "50% 0%",
          bottom: "50% 100%",
          left: "0% 50%",
          right: "100% 50%",
        };
        panel.style.transformOrigin = origins[c.origin] || "50% 50%";
      },
      arrive(o) {
        gsap.set(o.querySelector(".pt-panel"), { scale: 1 });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          scale: c.startScale,
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        gsap.set(o.querySelector(".pt-panel"), { scale: c.startScale });
        return gsap.to(o.querySelector(".pt-panel"), {
          scale: 1,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    flip: {
      label: "Flip 3D",
      schema: {
        axis: {
          phase: "shared",
          type: "select",
          label: "Axis",
          options: ["y", "x"],
          default: "y",
        },
        perspective: {
          phase: "shared",
          type: "range",
          label: "Perspective",
          min: 400,
          max: 2400,
          step: 50,
          unit: "px",
          default: 1200,
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        ...TIMING(0.85, 1.0, "power3.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        o.style.perspective = c.perspective + "px";
        o.querySelector(".pt-panel").style.background = c.color;
      },
      _prop(c) {
        return c.axis === "x" ? "rotationX" : "rotationY";
      },
      arrive(o) {
        gsap.set(o.querySelector(".pt-panel"), { rotationX: 0, rotationY: 0 });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          [this._prop(c)]: -90,
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        const start = { rotationX: 0, rotationY: 0 };
        start[this._prop(c)] = 90;
        gsap.set(o.querySelector(".pt-panel"), start);
        return gsap.to(o.querySelector(".pt-panel"), {
          [this._prop(c)]: 0,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    clip: {
      label: "Clip Wipe",
      schema: {
        direction: {
          phase: "shared",
          type: "select",
          label: "Direction",
          options: [
            "from-top",
            "from-bottom",
            "from-left",
            "from-right",
            "inset-horizontal",
            "inset-vertical",
            "inset-center",
          ],
          default: "from-top",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        ...TIMING(0.9, 1.0, "power3.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        o.querySelector(".pt-panel").style.background = c.color;
      },
      _clips(c) {
        const SHOW = "inset(0% 0% 0% 0%)";
        const map = {
          "from-top": {
            hide: "inset(0% 0% 100% 0%)",
            out: "inset(100% 0% 0% 0%)",
          },
          "from-bottom": {
            hide: "inset(100% 0% 0% 0%)",
            out: "inset(0% 0% 100% 0%)",
          },
          "from-left": {
            hide: "inset(0% 100% 0% 0%)",
            out: "inset(0% 0% 0% 100%)",
          },
          "from-right": {
            hide: "inset(0% 0% 0% 100%)",
            out: "inset(0% 100% 0% 0%)",
          },
          "inset-horizontal": {
            hide: "inset(0% 50% 0% 50%)",
            out: "inset(0% 50% 0% 50%)",
          },
          "inset-vertical": {
            hide: "inset(50% 0% 50% 0%)",
            out: "inset(50% 0% 50% 0%)",
          },
          "inset-center": {
            hide: "inset(50% 50% 50% 50%)",
            out: "inset(50% 50% 50% 50%)",
          },
        };
        const d = map[c.direction] || map["from-top"];
        return { hide: d.hide, show: SHOW, out: d.out };
      },
      arrive(o, c) {
        gsap.set(o.querySelector(".pt-panel"), {
          clipPath: this._clips(c).show,
        });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          clipPath: this._clips(c).out,
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        gsap.set(o.querySelector(".pt-panel"), {
          clipPath: this._clips(c).hide,
        });
        return gsap.to(o.querySelector(".pt-panel"), {
          clipPath: this._clips(c).show,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    crossfade: {
      label: "Crossfade",
      schema: {
        opacity: {
          phase: "shared",
          type: "range",
          label: "Overlay opacity",
          min: 0.3,
          max: 1,
          step: 0.05,
          default: 1.0,
        },
        blur: {
          phase: "shared",
          type: "range",
          label: "Backdrop blur",
          min: 0,
          max: 24,
          step: 1,
          unit: "px",
          default: 6,
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Overlay color",
          default: "#0a0a0a",
        },
        ...TIMING(0.55, 0.75, "power1.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        const p = o.querySelector(".pt-panel");
        p.style.background = c.color;
        p.style.backdropFilter = "blur(" + c.blur + "px)";
        p.style.webkitBackdropFilter = "blur(" + c.blur + "px)";
      },
      arrive(o, c) {
        gsap.set(o.querySelector(".pt-panel"), { autoAlpha: c.opacity });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          autoAlpha: 0,
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        gsap.set(o.querySelector(".pt-panel"), { autoAlpha: 0 });
        return gsap.to(o.querySelector(".pt-panel"), {
          autoAlpha: c.opacity,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    tileGrid: {
      label: "Tile Grid",
      schema: {
        rows: {
          phase: "shared",
          type: "range",
          label: "Rows",
          min: 2,
          max: 10,
          step: 1,
          default: 5,
        },
        cols: {
          phase: "shared",
          type: "range",
          label: "Columns",
          min: 2,
          max: 12,
          step: 1,
          default: 7,
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Tile color",
          default: "#0a0a0a",
        },
        ...TIMING(0.45, 0.5, "power3.inOut"),
        exitStaggerFrom: {
          phase: "exit",
          type: "select",
          label: "Stagger from",
          options: STAGGER_FROM,
          default: "center",
        },
        exitStaggerEach: {
          phase: "exit",
          type: "range",
          label: "Stagger delay",
          min: 0.01,
          max: 0.12,
          step: 0.005,
          unit: "s",
          default: 0.035,
        },
        enterStaggerFrom: {
          phase: "enter",
          type: "select",
          label: "Stagger from",
          options: STAGGER_FROM,
          default: "edges",
        },
        enterStaggerEach: {
          phase: "enter",
          type: "range",
          label: "Stagger delay",
          min: 0.01,
          max: 0.12,
          step: 0.005,
          unit: "s",
          default: 0.035,
        },
      },
      build(o, c) {
        const rows = Math.max(2, Math.min(12, parseInt(c.rows, 10) || 5));
        const cols = Math.max(2, Math.min(12, parseInt(c.cols, 10) || 7));
        o.setAttribute("data-rows", rows);
        o.setAttribute("data-cols", cols);
        let html = "";
        for (let i = 0; i < rows * cols; i++)
          html += '<div class="pt-tile"></div>';
        o.innerHTML = html;
        o.style.setProperty("--pt-grid-rows", rows);
        o.style.setProperty("--pt-grid-cols", cols);
        // 1px box-shadow in the same color bleeds over sub-pixel gaps
        // between 1fr grid cells. It scales with the tile's transform,
        // so it vanishes cleanly when tiles animate away.
        const bleed = `0 0 0 1px ${c.color}`;
        o.querySelectorAll(".pt-tile").forEach((t) => {
          t.style.background = c.color;
          t.style.boxShadow = bleed;
        });
      },
      arrive(o) {
        gsap.set(o.querySelectorAll(".pt-tile"), { scale: 1, autoAlpha: 1 });
      },
      enter(o, c) {
        const rows = parseInt(o.getAttribute("data-rows"), 10);
        const cols = parseInt(o.getAttribute("data-cols"), 10);
        return gsap.to(o.querySelectorAll(".pt-tile"), {
          scale: 0,
          autoAlpha: 0,
          duration: c.enterDuration,
          ease: c.enterEase,
          stagger: {
            grid: [rows, cols],
            from: c.enterStaggerFrom,
            each: c.enterStaggerEach,
          },
        });
      },
      exit(o, c) {
        const rows = parseInt(o.getAttribute("data-rows"), 10);
        const cols = parseInt(o.getAttribute("data-cols"), 10);
        gsap.set(o.querySelectorAll(".pt-tile"), { scale: 0, autoAlpha: 0 });
        return gsap.to(o.querySelectorAll(".pt-tile"), {
          scale: 1,
          autoAlpha: 1,
          duration: c.exitDuration,
          ease: c.exitEase,
          stagger: {
            grid: [rows, cols],
            from: c.exitStaggerFrom,
            each: c.exitStaggerEach,
          },
        });
      },
    },

    shutter: {
      label: "Shutter",
      schema: {
        slats: {
          phase: "shared",
          type: "range",
          label: "Slat count",
          min: 3,
          max: 15,
          step: 1,
          default: 8,
        },
        axis: {
          phase: "shared",
          type: "select",
          label: "Axis",
          options: ["horizontal", "vertical"],
          default: "horizontal",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Slat color",
          default: "#0a0a0a",
        },
        ...TIMING(0.6, 0.55, "power3.inOut"),
        exitStaggerFrom: {
          phase: "exit",
          type: "select",
          label: "Stagger from",
          options: STAGGER_FROM,
          default: "start",
        },
        exitStaggerEach: {
          phase: "exit",
          type: "range",
          label: "Stagger delay",
          min: 0.01,
          max: 0.15,
          step: 0.005,
          unit: "s",
          default: 0.04,
        },
        enterStaggerFrom: {
          phase: "enter",
          type: "select",
          label: "Stagger from",
          options: STAGGER_FROM,
          default: "end",
        },
        enterStaggerEach: {
          phase: "enter",
          type: "range",
          label: "Stagger delay",
          min: 0.01,
          max: 0.15,
          step: 0.005,
          unit: "s",
          default: 0.04,
        },
      },
      build(o, c) {
        const n = Math.max(3, Math.min(15, parseInt(c.slats, 10) || 8));
        o.setAttribute("data-axis", c.axis);
        const bleed = `0 0 0 1px ${c.color}`;
        let html = "";
        for (let i = 0; i < n; i++) {
          html += `<div class="pt-slat" style="background:${c.color};box-shadow:${bleed}"></div>`;
        }
        o.innerHTML = html;
      },
      _prop(c) {
        return c.axis === "vertical" ? "scaleX" : "scaleY";
      },
      arrive(o) {
        gsap.set(o.querySelectorAll(".pt-slat"), { scaleX: 1, scaleY: 1 });
      },
      enter(o, c) {
        return gsap.to(o.querySelectorAll(".pt-slat"), {
          [this._prop(c)]: 0,
          duration: c.enterDuration,
          ease: c.enterEase,
          stagger: { each: c.enterStaggerEach, from: c.enterStaggerFrom },
        });
      },
      exit(o, c) {
        gsap.set(o.querySelectorAll(".pt-slat"), { [this._prop(c)]: 0 });
        return gsap.to(o.querySelectorAll(".pt-slat"), {
          [this._prop(c)]: 1,
          duration: c.exitDuration,
          ease: c.exitEase,
          stagger: { each: c.exitStaggerEach, from: c.exitStaggerFrom },
        });
      },
    },

    iris: {
      label: "Iris",
      schema: {
        shape: {
          phase: "shared",
          type: "select",
          label: "Shape",
          options: ["diamond", "hexagon", "square"],
          default: "diamond",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        ...TIMING(0.9, 1.0, "power3.inOut"),
      },
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        o.querySelector(".pt-panel").style.background = c.color;
      },
      _clips(c) {
        // Each entry: [collapsed-at-center, fully-covering]
        // Same point count on both so GSAP can interpolate cleanly.
        const SHAPES = {
          diamond: [
            "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
            "polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%)",
          ],
          square: [
            "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
            "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          ],
          hexagon: [
            "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)",
            "polygon(25% -25%, 75% -25%, 125% 50%, 75% 125%, 25% 125%, -25% 50%)",
          ],
        };
        return SHAPES[c.shape] || SHAPES.diamond;
      },
      arrive(o, c) {
        gsap.set(o.querySelector(".pt-panel"), { clipPath: this._clips(c)[1] });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-panel"), {
          clipPath: this._clips(c)[0],
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        const clips = this._clips(c);
        gsap.set(o.querySelector(".pt-panel"), { clipPath: clips[0] });
        return gsap.to(o.querySelector(".pt-panel"), {
          clipPath: clips[1],
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    layers: {
      label: "Layers Slide",
      schema: {
        direction: {
          phase: "shared",
          type: "select",
          label: "Direction",
          options: ["up", "down", "left", "right"],
          default: "up",
        },
        color1: {
          phase: "shared",
          type: "color",
          label: "Layer 1",
          default: "#c6f432",
        },
        color2: {
          phase: "shared",
          type: "color",
          label: "Layer 2",
          default: "#1a1a1a",
        },
        color3: {
          phase: "shared",
          type: "color",
          label: "Layer 3",
          default: "#0a0a0a",
        },
        ...TIMING(0.75, 0.85, "power3.inOut"),
        exitStaggerEach: {
          phase: "exit",
          type: "range",
          label: "Layer offset",
          min: 0.02,
          max: 0.25,
          step: 0.01,
          unit: "s",
          default: 0.08,
        },
        enterStaggerEach: {
          phase: "enter",
          type: "range",
          label: "Layer offset",
          min: 0.02,
          max: 0.25,
          step: 0.01,
          unit: "s",
          default: 0.08,
        },
      },
      build(o, c) {
        o.innerHTML =
          '<div class="pt-layer"></div><div class="pt-layer"></div><div class="pt-layer"></div>';
        const layers = o.querySelectorAll(".pt-layer");
        layers[0].style.background = c.color1;
        layers[1].style.background = c.color2;
        layers[2].style.background = c.color3;
      },
      _prop(c) {
        return c.direction === "left" || c.direction === "right"
          ? "xPercent"
          : "yPercent";
      },
      _exitFrom(c) {
        return { up: 100, down: -100, left: 100, right: -100 }[c.direction];
      },
      _enterTo(c) {
        return { up: -100, down: 100, left: -100, right: 100 }[c.direction];
      },
      arrive(o) {
        gsap.set(o.querySelectorAll(".pt-layer"), { xPercent: 0, yPercent: 0 });
      },
      enter(o, c) {
        return gsap.to(o.querySelectorAll(".pt-layer"), {
          [this._prop(c)]: this._enterTo(c),
          duration: c.enterDuration,
          ease: c.enterEase,
          stagger: c.enterStaggerEach,
        });
      },
      exit(o, c) {
        const prop = this._prop(c);
        const from = { xPercent: 0, yPercent: 0 };
        from[prop] = this._exitFrom(c);
        gsap.set(o.querySelectorAll(".pt-layer"), from);
        return gsap.to(o.querySelectorAll(".pt-layer"), {
          [prop]: 0,
          duration: c.exitDuration,
          ease: c.exitEase,
          stagger: c.exitStaggerEach,
        });
      },
    },

    push: {
      label: "Push Slide",
      schema: {
        direction: {
          phase: "shared",
          type: "select",
          label: "Direction",
          options: ["left", "right", "up", "down"],
          default: "left",
        },
        color: {
          phase: "shared",
          type: "color",
          label: "Panel color",
          default: "#0a0a0a",
        },
        accentColor: {
          phase: "shared",
          type: "color",
          label: "Lead color",
          default: "#c6f432",
        },
        accentWidth: {
          phase: "shared",
          type: "range",
          label: "Lead thickness",
          min: 0,
          max: 120,
          step: 2,
          unit: "px",
          default: 14,
        },
        ...TIMING(0.75, 0.85, "power3.inOut"),
      },
      build(o, c) {
        o.setAttribute("data-direction", c.direction);
        o.innerHTML =
          '<div class="pt-push-wrap"><div class="pt-push-accent"></div><div class="pt-push-panel"></div></div>';
        const wrap = o.querySelector(".pt-push-wrap");
        const accent = o.querySelector(".pt-push-accent");
        const panel = o.querySelector(".pt-push-panel");
        panel.style.background = c.color;
        accent.style.background = c.accentColor;

        const isHorizontal = c.direction === "left" || c.direction === "right";
        wrap.style.display = "flex";
        if (isHorizontal) {
          wrap.style.flexDirection =
            c.direction === "left" ? "row" : "row-reverse";
          accent.style.width = c.accentWidth + "px";
          accent.style.height = "100%";
        } else {
          wrap.style.flexDirection =
            c.direction === "up" ? "column" : "column-reverse";
          accent.style.height = c.accentWidth + "px";
          accent.style.width = "100%";
        }
        accent.style.flexShrink = "0";
        panel.style.flex = "1";
      },
      _prop(c) {
        return c.direction === "up" || c.direction === "down"
          ? "yPercent"
          : "xPercent";
      },
      _exitFrom(c) {
        return { left: 100, right: -100, up: 100, down: -100 }[c.direction];
      },
      _enterTo(c) {
        return { left: -100, right: 100, up: -100, down: 100 }[c.direction];
      },
      arrive(o) {
        gsap.set(o.querySelector(".pt-push-wrap"), {
          xPercent: 0,
          yPercent: 0,
        });
      },
      enter(o, c) {
        return gsap.to(o.querySelector(".pt-push-wrap"), {
          [this._prop(c)]: this._enterTo(c),
          duration: c.enterDuration,
          ease: c.enterEase,
        });
      },
      exit(o, c) {
        const p = this._prop(c);
        const from = { xPercent: 0, yPercent: 0 };
        from[p] = this._exitFrom(c);
        gsap.set(o.querySelector(".pt-push-wrap"), from);
        return gsap.to(o.querySelector(".pt-push-wrap"), {
          [p]: 0,
          duration: c.exitDuration,
          ease: c.exitEase,
        });
      },
    },

    /* --- Custom: user-built via the Custom tab -------------------
           The config shape is bespoke (not schema-driven):
               { enter: { method, time, props }, exit: { ... } }
           The panel is a simple full-viewport div — GSAP operates on
           whatever props the user configured.                        */
    custom: {
      label: "Custom",
      hidden: true, // don't show in the Preset dropdown
      schema: {}, // no schema — editor is bespoke
      build(o, c) {
        o.innerHTML = '<div class="pt-panel"></div>';
        const p = o.querySelector(".pt-panel");
        p.style.position = "absolute";
        p.style.inset = "0";
        p.style.background = (c && c.color) || "#0a0a0a";
        p.style.willChange = "transform, opacity, filter";
      },
      arrive(o) {
        // Reset to a neutral "covering" state before the enter animation.
        gsap.set(o.querySelector(".pt-panel"), {
          clearProps: "all",
        });
        // Reapply the structural styling that clearProps would wipe.
        const p = o.querySelector(".pt-panel");
        p.style.position = "absolute";
        p.style.inset = "0";
      },
      enter(o, c) {
        return runCustomBlock(
          o.querySelector(".pt-panel"),
          (c && c.enter) || {},
        );
      },
      exit(o, c) {
        return runCustomBlock(
          o.querySelector(".pt-panel"),
          (c && c.exit) || {},
        );
      },
    },
  };

  /* Wrap a transition's exit/enter call with the per-phase delay and
       opacity tween. Transitions themselves stay unchanged — the wrapper
       applies the two universal fields on top of whatever each transition
       already animates.

       Important: we invoke the transition SYNCHRONOUSLY so its internal
       gsap.set (which snaps the panel to its "off" position) fires
       immediately. We then pause(0) the resulting tween until the delay
       elapses, instead of deferring the whole call — otherwise the panel
       would sit at its default CSS position (fully covering) during the
       delay and flash the overlay color. */
  function playPhase(transition, phase, overlay, cfg) {
    const delay = cfg[phase + "Delay"] || 0;
    const duration = cfg[phase + "Duration"] || 1;
    const ease = cfg[phase + "Ease"] || "power3.inOut";
    const opacityVal = cfg[phase + "Opacity"];

    // Reset overlay opacity before each phase so a previous phase's
    // fade doesn't leak into the next run.
    gsap.set(overlay, { opacity: 1 });

    // Run transition NOW — sets the panel to its initial state and
    // creates the animation tween/timeline.
    const tween = transition[phase](overlay, cfg);

    // Layer an opacity fade on the overlay when the user set < 1.
    // fromTo's immediateRender applies the starting value instantly,
    // so the overlay stays invisible (or at opacityVal) during delay.
    let opacityTween = null;
    if (opacityVal !== undefined && opacityVal !== 1) {
      if (phase === "exit") {
        opacityTween = gsap.fromTo(
          overlay,
          { opacity: 0 },
          { opacity: opacityVal, duration, ease, overwrite: "auto" },
        );
      } else {
        opacityTween = gsap.fromTo(
          overlay,
          { opacity: opacityVal },
          { opacity: 0, duration, ease, overwrite: "auto" },
        );
      }
    }

    if (delay > 0) {
      // Hold both tweens at time 0 until the delay elapses.
      if (tween && tween.pause) tween.pause(0);
      if (opacityTween && opacityTween.pause) opacityTween.pause(0);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (tween && tween.resume) tween.resume();
            if (opacityTween && opacityTween.resume) opacityTween.resume();
            if (tween && typeof tween.then === "function") {
              tween.then(resolve, reject);
            } else {
              resolve();
            }
          } catch (e) {
            reject(e);
          }
        }, delay * 1000);
      });
    }
    return tween;
  }

  /* Execute a user-built block (method + props + optional time) against
       a target element. Used by the `custom` transition above and by the
       Preview button when the Custom tab is active. */
  function runCustomBlock(target, block) {
    if (!block || !target) return gsap.to(target || {}, { duration: 0 });
    const rawMethod = (block.method || "to").toLowerCase();
    const gsapFn =
      { from: "from", to: "to", fromto: "fromTo", set: "set" }[rawMethod] ||
      "to";
    const props = Object.assign({}, block.props || {});
    if (gsapFn !== "set") {
      if (props.duration === undefined) props.duration = 1;
      if (props.ease === undefined) props.ease = "power3.inOut";
      if (block.time > 0 && props.delay === undefined) props.delay = block.time;
    }
    if (gsapFn === "fromTo") {
      return gsap.fromTo(target, {}, props);
    }
    return gsap[gsapFn](target, props);
  }

  /* ============================================================
       Storage helpers (fail-safe)
       ============================================================ */
  const LS = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
    remove: (k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
  };

  const DEFAULT_NAME = "curtain";
  const KEY_SELECTED = "pt:selected";
  const KEY_CONFIG = (n) => "pt:cfg:" + n;

  function getSelected() {
    const s = LS.get(KEY_SELECTED);
    return TRANSITIONS[s] ? s : DEFAULT_NAME;
  }
  function setSelected(n) {
    LS.set(KEY_SELECTED, n);
  }

  /* ------------------------------------------------------------
       Config storage — each transition writes THREE localStorage keys,
       one per phase, so exit / enter / shared can evolve independently:
           pt:cfg:<name>:shared
           pt:cfg:<name>:exit
           pt:cfg:<name>:enter
       In-memory we still expose a flat object for ease of use.
       ------------------------------------------------------------ */
  const KEY_CFG_SHARED = (n) => "pt:cfg:" + n + ":shared";
  const KEY_CFG_EXIT = (n) => "pt:cfg:" + n + ":exit";
  const KEY_CFG_ENTER = (n) => "pt:cfg:" + n + ":enter";

  function getDefaults(name) {
    const d = {};
    Object.entries(TRANSITIONS[name].schema).forEach(
      ([k, v]) => (d[k] = v.default),
    );
    return d;
  }

  function phaseOf(name, key) {
    const spec = TRANSITIONS[name] && TRANSITIONS[name].schema[key];
    return spec && spec.phase ? spec.phase : "shared";
  }

  function getConfig(name) {
    // The custom transition stores a bespoke { enter, exit, shared } shape.
    if (name === "custom") {
      const read = (k) => {
        try {
          return JSON.parse(LS.get(k) || "null") || {};
        } catch (e) {
          return {};
        }
      };
      return {
        shared: read(KEY_CFG_SHARED("custom")),
        enter: read(KEY_CFG_ENTER("custom")),
        exit: read(KEY_CFG_EXIT("custom")),
      };
    }
    const defaults = getDefaults(name);
    try {
      const shared = LS.get(KEY_CFG_SHARED(name));
      const exit = LS.get(KEY_CFG_EXIT(name));
      const enter = LS.get(KEY_CFG_ENTER(name));
      if (shared !== null || exit !== null || enter !== null) {
        return Object.assign(
          {},
          defaults,
          shared ? JSON.parse(shared) : {},
          exit ? JSON.parse(exit) : {},
          enter ? JSON.parse(enter) : {},
        );
      }
      // One-time migration from the legacy single-key format
      const legacy = LS.get(KEY_CONFIG(name));
      if (legacy) return Object.assign({}, defaults, JSON.parse(legacy));
    } catch (e) {}
    return defaults;
  }

  function setConfig(name, cfg) {
    if (name === "custom") {
      if (cfg.shared)
        LS.set(KEY_CFG_SHARED("custom"), JSON.stringify(cfg.shared));
      if (cfg.enter) LS.set(KEY_CFG_ENTER("custom"), JSON.stringify(cfg.enter));
      if (cfg.exit) LS.set(KEY_CFG_EXIT("custom"), JSON.stringify(cfg.exit));
      return;
    }

    const shared = {},
      exit = {},
      enter = {};
    Object.entries(cfg).forEach(([k, v]) => {
      const bucket = phaseOf(name, k);
      if (bucket === "exit") exit[k] = v;
      else if (bucket === "enter") enter[k] = v;
      else shared[k] = v;
    });
    LS.set(KEY_CFG_SHARED(name), JSON.stringify(shared));
    LS.set(KEY_CFG_EXIT(name), JSON.stringify(exit));
    LS.set(KEY_CFG_ENTER(name), JSON.stringify(enter));
  }

  function resetConfig(name) {
    LS.remove(KEY_CFG_SHARED(name));
    LS.remove(KEY_CFG_EXIT(name));
    LS.remove(KEY_CFG_ENTER(name));
    LS.remove(KEY_CONFIG(name)); // also clear legacy single-key
  }

  /* ------------------------------------------------------------
       Global config — applies across ALL transitions. Stored under
       a single `pt:global` key. Holds the body-effect settings and
       the hold-duration (dwell time in the covered state).
       ------------------------------------------------------------ */
  const KEY_GLOBAL = "pt:global";
  const GLOBAL_DEFAULTS = {
    bodyEffect: "none", // none | scale | fade | blur | slideUp | slideDown
    bodyStrength: 1, // 0..1 — how intense the effect is
    holdDuration: 0, // seconds to dwell in the covered state
    overlayLogo: "", // URL, data-URL, or inline <svg> markup
    overlayLogoSize: 72, // logo height in px
    overlayLabel: "", // brand text shown while covering (empty = no label)
  };
  function getGlobalConfig() {
    try {
      return Object.assign(
        {},
        GLOBAL_DEFAULTS,
        JSON.parse(LS.get(KEY_GLOBAL) || "{}"),
      );
    } catch (e) {
      return Object.assign({}, GLOBAL_DEFAULTS);
    }
  }
  function setGlobalConfig(cfg) {
    LS.set(KEY_GLOBAL, JSON.stringify(cfg));
  }

  /* Body-effect helpers — animate the page's visible elements so the
       outgoing page recedes while the overlay covers, then return on enter.
       We operate on each non-builder top-level body child independently
       (rather than a wrapper) so that .navbar's `position: fixed` stays
       anchored to the viewport instead of a transformed ancestor. */
  function getPageTargets() {
    return Array.from(document.body.children).filter((c) => {
      if (!c || !c.tagName) return false;
      if (c.tagName === "SCRIPT") return false;
      if (isPreserved(c)) return false;
      return true;
    });
  }

  function bodyOutVars(effect, strength) {
    const s = Math.max(0, Math.min(1, strength));
    switch (effect) {
      case "scale":
        return { scale: 1 - s * 0.12 };
      case "fade":
        return { opacity: 1 - s * 0.7 };
      case "blur":
        return { filter: `blur(${s * 12}px)` };
      case "slideUp":
        return { yPercent: -s * 10 };
      case "slideDown":
        return { yPercent: s * 10 };
      default:
        return null;
    }
  }

  function bodyInVars(effect) {
    switch (effect) {
      case "scale":
        return { scale: 1 };
      case "fade":
        return { opacity: 1 };
      case "blur":
        return { filter: "blur(0px)" };
      case "slideUp":
      case "slideDown":
        return { yPercent: 0 };
      default:
        return null;
    }
  }

  function playBodyOut(global) {
    const vars = bodyOutVars(global.bodyEffect, global.bodyStrength);
    const targets = getPageTargets();
    if (!vars || !targets.length) return Promise.resolve();
    return gsap.to(
      targets,
      Object.assign({ duration: 0.55, ease: "power2.inOut" }, vars),
    );
  }

  function playBodyIn(global) {
    const vars = bodyInVars(global.bodyEffect);
    const targets = getPageTargets();
    if (!vars || !targets.length) return Promise.resolve();
    return gsap.to(
      targets,
      Object.assign({ duration: 0.55, ease: "power2.inOut" }, vars),
    );
  }

  function snapBodyOut(global) {
    const vars = bodyOutVars(global.bodyEffect, global.bodyStrength);
    const targets = getPageTargets();
    if (!vars || !targets.length) return;
    gsap.set(targets, vars);
  }

  /* Overlay UI — the brand label shown while the overlay is fully
       covering. Attached to every overlay rebuild so it survives
       transition-type switches. */
  function appendOverlayUI(overlay) {
    const g = getGlobalConfig();
    const logoRaw = (g.overlayLogo || "").trim();
    const hasLogo = !!logoRaw;
    const hasLabel = !!(g.overlayLabel && g.overlayLabel.trim());
    if (!hasLogo && !hasLabel) return;

    const ui = document.createElement("div");
    ui.className = "pt-overlay-ui";

    let html = "";
    if (hasLogo) {
      const size = Math.max(16, parseInt(g.overlayLogoSize, 10) || 72);
      const isInlineSvg = logoRaw.toLowerCase().startsWith("<svg");
      if (isInlineSvg) {
        // Inline SVG — inject markup as-is so the user can style/animate it
        html += `<div class="pt-overlay-logo pt-overlay-logo-svg" style="height:${size}px">${logoRaw}</div>`;
      } else {
        // URL / data-URL — render as <img>
        html += `<img class="pt-overlay-logo" src="${esc(logoRaw)}" alt="" style="height:${size}px">`;
      }
    }
    if (hasLabel)
      html += `<div class="pt-overlay-label">${esc(g.overlayLabel)}</div>`;
    ui.innerHTML = html;
    overlay.appendChild(ui);
  }

  function showOverlayUI() {
    const ui = document.querySelector(".pt-overlay-ui");
    if (!ui) return;
    // Kill any in-flight fade so the new tween wins — otherwise a
    // zero-hold path leaves the previous fade-in to re-show the label
    // after our fade-out has already finished.
    gsap.killTweensOf(ui);
    gsap.to(ui, {
      autoAlpha: 1,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto",
    });
  }
  function hideOverlayUI() {
    const ui = document.querySelector(".pt-overlay-ui");
    if (!ui) return;
    gsap.killTweensOf(ui);
    gsap.to(ui, {
      autoAlpha: 0,
      duration: 0.18,
      ease: "power2.in",
      overwrite: "auto",
    });
  }

  /* ============================================================
       Overlay management
       ============================================================ */
  let isTransitioning = false;

  function buildOverlay(name, cfg) {
    let o = document.querySelector(".pt-overlay");
    if (!o) {
      o = document.createElement("div");
      o.className = "pt-overlay";
      document.body.appendChild(o);
    }
    o.setAttribute("data-transition", name);
    o.innerHTML = "";
    TRANSITIONS[name].build(o, cfg || getConfig(name));
    appendOverlayUI(o);
    return o;
  }

  /* ============================================================
       SPA navigation — fetch new page HTML and swap into the current
       DOM (no browser reload). The overlay, fonts, and scripts stay
       loaded, so the transition plays without a flash.
       ============================================================ */
  const pageCache = new Map();

  async function fetchPage(href) {
    if (pageCache.has(href)) return pageCache.get(href);
    const res = await fetch(href, { credentials: "same-origin" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    pageCache.set(href, text);
    return text;
  }

  // Classes the builder injects into <body> — must survive SPA swaps.
  const PT_PRESERVE = ["pt-overlay", "pt-modal", "pt-trigger", "pt-pop"];
  const isPreserved = (el) =>
    el && el.classList && PT_PRESERVE.some((c) => el.classList.contains(c));

  function swapPageContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (doc.title) document.title = doc.title;

    const overlay = document.querySelector(".pt-overlay");

    // Remove old body children (keep preserved builder elements + <script>)
    Array.from(document.body.children).forEach((child) => {
      if (isPreserved(child)) return;
      if (child.tagName === "SCRIPT") return;
      child.remove();
    });

    // Insert fetched body children before the overlay
    const anchor = overlay || null;
    Array.from(doc.body.children).forEach((child) => {
      if (child.tagName === "SCRIPT") return;
      if (isPreserved(child)) return;
      document.body.insertBefore(document.importNode(child, true), anchor);
    });
  }

  async function navigate(href, push) {
    if (isTransitioning) return;
    isTransitioning = true;

    const name = getSelected();
    const cfg = getConfig(name);
    const global = getGlobalConfig();
    let overlay = document.querySelector(".pt-overlay");
    if (!overlay || overlay.getAttribute("data-transition") !== name) {
      overlay = buildOverlay(name, cfg);
    }

    console.log({ name, cfg, global });

    overlay.classList.add("is-active");

    // Kick off exit animation + body-out effect + fetch in parallel.
    const exitPromise = playPhase(TRANSITIONS[name], "exit", overlay, cfg);
    const bodyOutPromise = playBodyOut(global);
    let html = null;
    let fetchErr = null;
    try {
      html = await fetchPage(href);
    } catch (e) {
      fetchErr = e;
    }

    // Let both exit and body-out settle before we swap or hard-nav.
    await Promise.all([exitPromise, bodyOutPromise]);

    // Show the brand label now that the overlay is fully covering.
    showOverlayUI();

    // Optional dwell time in the fully-covered state.
    if (global.holdDuration > 0) {
      await new Promise((r) => setTimeout(r, global.holdDuration * 1000));
    }

    if (fetchErr) {
      // Fetch failed (network error, file:// protocol, etc). Abort the
      // transition and fall back to a plain browser navigation so the
      // user still reaches the page.
      console.warn(
        "[pt] fetch failed — falling back to plain navigation.",
        fetchErr,
      );
      overlay.classList.remove("is-active");
      isTransitioning = false;
      window.location.href = href;
      return;
    }

    // SPA path: swap DOM and play enter animation.
    try {
      swapPageContent(html);
      if (push) history.pushState({ pt: true, href }, "", href);
      window.scrollTo(0, 0);

      // New page content is fresh — snap it into the "out" state so the
      // enter animation starts from the same visual baseline.
      snapBodyOut(global);

      TRANSITIONS[name].arrive(overlay, cfg);
      await new Promise((r) => requestAnimationFrame(r));

      // Hide the brand label before the enter animation starts
      hideOverlayUI();

      // Enter animation + body-in effect in parallel.
      await Promise.all([
        playPhase(TRANSITIONS[name], "enter", overlay, cfg),
        playBodyIn(global),
      ]);
    } finally {
      overlay.classList.remove("is-active");
      isTransitioning = false;
    }
  }

  function isInternalLink(a) {
    if (!a) return false;
    const href = a.getAttribute("href");
    if (!href) return false;
    if (a.target === "_blank") return false;
    if (a.hasAttribute("download")) return false;
    if (href.startsWith("#")) return false;
    if (
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    )
      return false;
    try {
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ============================================================
       Builder UI — modal with Custom / Preset tabs
       ============================================================ */

  const PROP_CATEGORIES = {
    Animation: ["duration", "ease", "delay"],
    Transform: [
      "x",
      "y",
      "z",
      "xPercent",
      "yPercent",
      "rotation",
      "rotationX",
      "rotationY",
    ],
    Scale: ["scale", "scaleX", "scaleY"],
    Skew: ["skewX", "skewY"],
    Style: ["opacity", "backgroundColor", "color", "borderRadius"],
    Filter: ["filter"],
  };

  /* Per-property input spec — drives the field type in the Custom prop rows.
       If a property isn't listed, it falls back to a plain text input. */
  const PROP_SPECS = {
    duration: {
      type: "number",
      min: 0,
      max: 10,
      step: 0.05,
      placeholder: "seconds",
      default: 1,
    },
    ease: { type: "select", options: EASES, default: "power3.inOut" },
    delay: {
      type: "number",
      min: 0,
      max: 10,
      step: 0.05,
      placeholder: "seconds",
      default: 0,
    },

    x: { type: "text", placeholder: 'e.g. 100 or "50%"' },
    y: { type: "text", placeholder: 'e.g. 100 or "50%"' },
    z: { type: "text", placeholder: "e.g. 100" },
    xPercent: {
      type: "number",
      min: -200,
      max: 200,
      step: 1,
      placeholder: "-100 to 100",
    },
    yPercent: {
      type: "number",
      min: -200,
      max: 200,
      step: 1,
      placeholder: "-100 to 100",
    },
    rotation: { type: "number", step: 1, placeholder: "degrees" },
    rotationX: { type: "number", step: 1, placeholder: "degrees" },
    rotationY: { type: "number", step: 1, placeholder: "degrees" },

    scale: { type: "number", min: 0, max: 5, step: 0.05, default: 1 },
    scaleX: { type: "number", min: 0, max: 5, step: 0.05, default: 1 },
    scaleY: { type: "number", min: 0, max: 5, step: 0.05, default: 1 },

    skewX: {
      type: "number",
      min: -90,
      max: 90,
      step: 1,
      placeholder: "degrees",
    },
    skewY: {
      type: "number",
      min: -90,
      max: 90,
      step: 1,
      placeholder: "degrees",
    },

    opacity: { type: "number", min: 0, max: 1, step: 0.05, default: 1 },

    backgroundColor: { type: "color", default: "#000000" },
    color: { type: "color", default: "#ffffff" },
    borderRadius: { type: "text", placeholder: "e.g. 8px or 50%" },
    filter: { type: "text", placeholder: "e.g. blur(10px)" },
  };

  function esc(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  /* Generic row renderer for the Preset pane — used by both the
       meta "Transition Type" control and every schema-driven prop. */
  function presetField(label, type, propName, options, value, attrs) {
    const labelHtml = `<div class="pt-row-label">${esc(label)}</div>`;

    if (type === "toggle") {
      return `<div class="pt-row">
                <div class="pt-row-label">${esc(label)}</div>
                <label class="pt-switch">
                    <input type="checkbox" data-prop="${propName}"${value ? " checked" : ""}>
                    <span class="pt-switch-track"></span>
                </label>
            </div>`;
    }

    if (type === "color") {
      const hex = value || "#000000";
      return `<div class="pt-row">
                ${labelHtml}
                <div class="pt-row-input pt-color-wrap">
                    <input type="color" class="pt-color-swatch" data-prop="${propName}" value="${esc(hex)}">
                    <span class="pt-color-hex" data-hex-for="${propName}">${esc(hex)}</span>
                </div>
            </div>`;
    }

    let input;
    if (type === "select") {
      input = `<select class="pt-input" data-prop="${propName}">${options
        .map(
          (o) =>
            `<option value="${esc(o.value)}"${o.value === value ? " selected" : ""}>${esc(o.label)}</option>`,
        )
        .join("")}</select>`;
    } else {
      const a = attrs || {};
      const aStr = Object.entries(a)
        .filter(([k, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      const v = value === null || value === undefined ? "" : value;
      input = `<input class="pt-input" type="${type}" data-prop="${propName}" value="${esc(v)}" ${aStr}>`;
    }

    return `<div class="pt-row">${labelHtml}<div class="pt-row-input">${input}</div></div>`;
  }

  function customBlock(title, phase) {
    return `
            <div class="pt-block" data-phase="${phase}">
                <h4 class="pt-block-title">${esc(title)}</h4>
                <div class="pt-row">
                    <div class="pt-row-label">Title</div>
                    <div class="pt-row-input">
                        <input class="pt-input" type="text" placeholder="Animation Title" data-field="title">
                    </div>
                </div>
                <div class="pt-row">
                    <div class="pt-row-label">Absolute Time</div>
                    <div class="pt-row-input">
                        <input class="pt-input" type="number" value="0" step="0.1" data-field="time">
                    </div>
                </div>
                <div class="pt-row">
                    <div class="pt-row-label">Method</div>
                    <div class="pt-row-input">
                        <select class="pt-input" data-field="method">
                            <option>From</option>
                            <option selected>To</option>
                            <option>FromTo</option>
                            <option>Set</option>
                        </select>
                    </div>
                </div>
                <div class="pt-row pt-row-between">
                    <div class="pt-row-label">Add Properties</div>
                    <button class="pt-add-btn" type="button" data-action="add-property" aria-label="Add property">+</button>
                </div>
                <div class="pt-prop-list"></div>
                <button class="pt-add-wide" type="button" data-action="add-property">
                    <span class="pt-add-icon">+</span> Add
                </button>
            </div>
        `;
  }

  function buildPropInputHtml(spec, initial) {
    if (spec.type === "select") {
      return `<select class="pt-prop-value" data-type="select">${spec.options
        .map(
          (o) =>
            `<option value="${esc(o)}"${String(o) === String(initial) ? " selected" : ""}>${esc(o)}</option>`,
        )
        .join("")}</select>`;
    }
    if (spec.type === "color") {
      const hex = initial || spec.default || "#000000";
      return `<input type="color" class="pt-prop-value" data-type="color" value="${esc(hex)}">
                    <span class="pt-prop-color-label">${esc(hex)}</span>`;
    }
    if (spec.type === "number") {
      const parts = ['type="number"', 'data-type="number"'];
      if (spec.min !== undefined) parts.push(`min="${spec.min}"`);
      if (spec.max !== undefined) parts.push(`max="${spec.max}"`);
      if (spec.step !== undefined) parts.push(`step="${spec.step}"`);
      if (spec.placeholder)
        parts.push(`placeholder="${esc(spec.placeholder)}"`);
      return `<input class="pt-prop-value" ${parts.join(" ")} value="${esc(initial)}">`;
    }
    // text fallback
    return `<input class="pt-prop-value" type="text" data-type="text" placeholder="${esc(spec.placeholder || "value")}" value="${esc(initial)}">`;
  }

  function addPropRow(list, propName, value) {
    const spec = PROP_SPECS[propName] || { type: "text" };
    const initial =
      value !== undefined && value !== null && value !== ""
        ? value
        : spec.default !== undefined
          ? spec.default
          : "";

    const row = document.createElement("div");
    row.className = "pt-prop-row";
    row.dataset.propType = spec.type;
    row.innerHTML = `
            <span class="pt-prop-name">${esc(propName)}</span>
            ${buildPropInputHtml(spec, initial)}
            <button class="pt-prop-remove" type="button" aria-label="Remove">✕</button>
        `;
    list.appendChild(row);

    row.querySelector(".pt-prop-remove").addEventListener("click", () => {
      row.remove();
      list.dispatchEvent(new CustomEvent("pt:dirty", { bubbles: true }));
    });

    // Live-update the hex label next to the color swatch
    const colorInput = row.querySelector('input[type="color"]');
    const colorLabel = row.querySelector(".pt-prop-color-label");
    if (colorInput && colorLabel) {
      colorInput.addEventListener("input", () => {
        colorLabel.textContent = colorInput.value;
      });
    }
  }

  function openPropertyPicker(btn) {
    document.querySelectorAll(".pt-pop").forEach((p) => p.remove());

    const pop = document.createElement("div");
    pop.className = "pt-pop";
    pop.innerHTML = `
            <div class="pt-pop-search">
                <span class="pt-pop-search-icon">⌕</span>
                <input type="text" placeholder="Search property">
            </div>
            <div class="pt-pop-body">
                ${Object.entries(PROP_CATEGORIES)
                  .map(
                    ([cat, props]) => `
                    <div class="pt-pop-category">${esc(cat)}</div>
                    ${props
                      .map(
                        (p) => `
                        <div class="pt-pop-option" data-prop="${esc(p)}">
                            <span class="pt-pop-dot">i</span>
                            <span>${esc(p)}</span>
                        </div>
                    `,
                      )
                      .join("")}
                `,
                  )
                  .join("")}
            </div>
        `;
    document.body.appendChild(pop);

    // Position near the button
    const rect = btn.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.right - 260;
    if (left < 8) left = 8;
    if (top + 340 > window.innerHeight) top = Math.max(8, rect.top - 340 - 6);
    pop.style.top = top + "px";
    pop.style.left = left + "px";

    const input = pop.querySelector("input");
    setTimeout(() => input.focus(), 20);

    input.addEventListener("input", () => {
      const q = input.value.toLowerCase();
      pop.querySelectorAll(".pt-pop-option").forEach((opt) => {
        const match = opt.dataset.prop.toLowerCase().includes(q);
        opt.style.display = match ? "" : "none";
      });
      pop.querySelectorAll(".pt-pop-category").forEach((cat) => {
        let next = cat.nextElementSibling;
        let any = false;
        while (next && next.classList.contains("pt-pop-option")) {
          if (next.style.display !== "none") {
            any = true;
            break;
          }
          next = next.nextElementSibling;
        }
        cat.style.display = any ? "" : "none";
      });
    });

    const resolveList = () => {
      if (btn.classList.contains("pt-add-wide")) {
        return btn.previousElementSibling;
      }
      // small + button is inside .pt-row-between
      const row = btn.closest(".pt-row-between");
      return row ? row.nextElementSibling : null;
    };

    pop.querySelectorAll(".pt-pop-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        const list = resolveList();
        if (list && list.classList.contains("pt-prop-list")) {
          addPropRow(list, opt.dataset.prop);
          list.dispatchEvent(new CustomEvent("pt:dirty", { bubbles: true }));
        }
        pop.remove();
      });
    });

    setTimeout(() => {
      const handler = (e) => {
        if (!pop.contains(e.target) && e.target !== btn) {
          pop.remove();
          document.removeEventListener("mousedown", handler);
        }
      };
      document.addEventListener("mousedown", handler);
    }, 20);
  }

  /* Read a block's current DOM state into a plain object.
       Numeric-looking values are coerced to numbers so GSAP treats them
       correctly; anything else (e.g. "100%", "-50vh", "power3.inOut")
       stays a string. */
  function collectCustomBlock(block) {
    if (!block) return null;
    const titleEl = block.querySelector('[data-field="title"]');
    const timeEl = block.querySelector('[data-field="time"]');
    const methodEl = block.querySelector('[data-field="method"]');
    const props = {};
    block.querySelectorAll(".pt-prop-row").forEach((row) => {
      const nameEl = row.querySelector(".pt-prop-name");
      const valEl = row.querySelector(".pt-prop-value");
      if (!nameEl || !valEl) return;
      const key = nameEl.textContent.trim();
      const raw = String(valEl.value == null ? "" : valEl.value).trim();
      if (!key || raw === "") return;
      const vType = valEl.dataset.type || "text";
      if (vType === "number") {
        const num = parseFloat(raw);
        if (!Number.isNaN(num)) props[key] = num;
      } else if (vType === "select" || vType === "color") {
        props[key] = raw;
      } else {
        // text — coerce to number when purely numeric so GSAP gets the right type
        const num = Number(raw);
        props[key] = !Number.isNaN(num) && raw !== "" ? num : raw;
      }
    });
    return {
      title: titleEl ? titleEl.value : "",
      time: timeEl ? parseFloat(timeEl.value) || 0 : 0,
      method: methodEl ? methodEl.value : "To",
      props,
    };
  }

  /* Populate a block's DOM from a saved config object. */
  function populateCustomBlock(block, data) {
    if (!block || !data) return;
    const titleEl = block.querySelector('[data-field="title"]');
    const timeEl = block.querySelector('[data-field="time"]');
    const methodEl = block.querySelector('[data-field="method"]');
    const list = block.querySelector(".pt-prop-list");
    if (titleEl && data.title !== undefined) titleEl.value = data.title;
    if (timeEl && data.time !== undefined) timeEl.value = data.time;
    if (methodEl && data.method) methodEl.value = data.method;
    if (list && data.props) {
      Object.entries(data.props).forEach(([key, value]) =>
        addPropRow(list, key, value),
      );
    }
  }

  function saveCustomPane(pane) {
    const enter = collectCustomBlock(
      pane.querySelector('[data-phase="enter"]'),
    );
    const exit = collectCustomBlock(pane.querySelector('[data-phase="exit"]'));
    setConfig("custom", { enter, exit });
    // If the custom transition is currently active, rebuild overlay so the
    // new panel config (color etc.) is applied for the next transition.
    if (getSelected() === "custom") buildOverlay("custom");
  }

  function renderCustomPane(pane) {
    pane.innerHTML =
      customBlock("Enter", "enter") + customBlock("Exit", "exit");

    const cfg = getConfig("custom");
    populateCustomBlock(pane.querySelector('[data-phase="enter"]'), cfg.enter);
    populateCustomBlock(pane.querySelector('[data-phase="exit"]'), cfg.exit);

    pane.querySelectorAll('[data-action="add-property"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPropertyPicker(btn);
      });
    });

    // Persist on every edit (input, change, dirty from row removal)
    const debouncedSave = (() => {
      let timer = null;
      return () => {
        clearTimeout(timer);
        timer = setTimeout(() => saveCustomPane(pane), 80);
      };
    })();
    pane.addEventListener("input", debouncedSave);
    pane.addEventListener("change", debouncedSave);
    pane.addEventListener("pt:dirty", debouncedSave);
  }

  /* ============================================================
       Export — two formats:
         1. JSON config (shared / exit / enter buckets, matches storage)
         2. Runnable JS with transition methods baked in + config frozen
       The Export view lets the user toggle between them.
       ============================================================ */

  function generateTransitionConfig() {
    const name = getSelected();
    const cfg = getConfig(name);

    const shared = {},
      exit = {},
      enter = {};
    Object.entries(cfg).forEach(([k, v]) => {
      const phase = phaseOf(name, k);
      if (phase === "exit") exit[k] = v;
      else if (phase === "enter") enter[k] = v;
      else shared[k] = v;
    });

    return JSON.stringify(
      {
        transition: name,
        shared,
        exit,
        enter,
      },
      null,
      2,
    );
  }

  /* Inlined helper — emitted into the JS export when a transition
       references it (currently only the `stagger` build uses it). */
  const TINT_COLOR_SRC = `  function tintColor(hex, delta) {
    const h = (hex || '#000000').replace('#', '');
    const num = parseInt(h, 16) || 0;
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + delta));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + delta));
    const b = Math.max(0, Math.min(255, (num & 0xff) + delta));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }`;

  /* CSS that every exported overlay needs, regardless of transition. */
  const CSS_BASE = `.pt-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  pointer-events: none;
  overflow: hidden;
  visibility: hidden;
}
.pt-overlay.is-active {
  pointer-events: auto;
  visibility: visible;
}`;

  /* CSS specific to each transition's internal DOM layout. */
  const CSS_BY_TRANSITION = {
    curtain: `.pt-overlay[data-transition="curtain"] .pt-panel {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}`,
    fade: `.pt-overlay[data-transition="fade"] .pt-panel {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}`,
    diagonal: `.pt-overlay[data-transition="diagonal"] .pt-panel {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  will-change: transform;
}`,
    split: `.pt-overlay[data-transition="split"] .pt-split-a,
.pt-overlay[data-transition="split"] .pt-split-b {
  position: absolute;
  will-change: transform;
}
.pt-overlay[data-transition="split"][data-axis="vertical"] .pt-split-a { top: 0; left: 0; right: 0; height: 50%; }
.pt-overlay[data-transition="split"][data-axis="vertical"] .pt-split-b { bottom: 0; left: 0; right: 0; height: 50%; }
.pt-overlay[data-transition="split"][data-axis="horizontal"] .pt-split-a { top: 0; bottom: 0; left: 0; width: 50%; }
.pt-overlay[data-transition="split"][data-axis="horizontal"] .pt-split-b { top: 0; bottom: 0; right: 0; width: 50%; }`,
    stagger: `.pt-overlay[data-transition="stagger"] {
  display: flex;
}
.pt-overlay[data-transition="stagger"] .pt-bar {
  flex: 1;
  will-change: transform;
}`,
    circle: `.pt-overlay[data-transition="circle"] .pt-circle {
  position: absolute;
  width: 12vmax;
  height: 12vmax;
  margin-top: -6vmax;
  margin-left: -6vmax;
  border-radius: 50%;
  will-change: transform;
}`,
    scale: `.pt-overlay[data-transition="scale"] .pt-panel {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}`,
    flip: `.pt-overlay[data-transition="flip"] .pt-panel {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  will-change: transform;
}`,
    clip: `.pt-overlay[data-transition="clip"] .pt-panel {
  position: absolute;
  inset: 0;
  will-change: transform, opacity, clip-path;
}`,
    crossfade: `.pt-overlay[data-transition="crossfade"] .pt-panel {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}`,
    iris: `.pt-overlay[data-transition="iris"] .pt-panel {
  position: absolute;
  inset: 0;
  will-change: clip-path;
}`,
    tileGrid: `.pt-overlay[data-transition="tileGrid"] {
  display: grid;
  grid-template-rows:    repeat(var(--pt-grid-rows, 5), 1fr);
  grid-template-columns: repeat(var(--pt-grid-cols, 7), 1fr);
}
.pt-overlay[data-transition="tileGrid"] .pt-tile {
  width: 100%;
  height: 100%;
  will-change: transform, opacity;
}`,
    push: `.pt-overlay[data-transition="push"] .pt-push-wrap {
  position: absolute;
  inset: 0;
  will-change: transform;
}`,
    shutter: `.pt-overlay[data-transition="shutter"] {
  display: flex;
}
.pt-overlay[data-transition="shutter"][data-axis="horizontal"] {
  flex-direction: column;
}
.pt-overlay[data-transition="shutter"][data-axis="vertical"] {
  flex-direction: row;
}
.pt-overlay[data-transition="shutter"] .pt-slat {
  flex: 1;
  will-change: transform;
}`,
    layers: `.pt-overlay[data-transition="layers"] .pt-layer {
  position: absolute;
  inset: 0;
  will-change: transform;
}`,
    custom: `/* Custom transition — the target's layout is whatever GSAP props you set. */`,
  };

  function generateTransitionCSS() {
    const name = getSelected();
    const specific = CSS_BY_TRANSITION[name] || "";
    return `/* ${(TRANSITIONS[name] && TRANSITIONS[name].label) || name} — exported from Transition Builder */

${CSS_BASE}${specific ? "\n\n" + specific : ""}`;
  }

  function indent(str, spaces) {
    const pad = " ".repeat(spaces);
    return str.split("\n").join("\n" + pad);
  }

  function generateCustomJS(cfg) {
    const buildCall = (block) => {
      if (!block) return "() => null";
      const method = (block.method || "to").toLowerCase();
      const fn =
        { from: "from", to: "to", fromto: "fromTo", set: "set" }[method] ||
        "to";
      const props = Object.assign({}, block.props || {});
      if (fn !== "set") {
        if (props.duration === undefined) props.duration = 1;
        if (props.ease === undefined) props.ease = "power3.inOut";
        if (block.time > 0 && props.delay === undefined)
          props.delay = block.time;
      }
      const propsStr = indent(JSON.stringify(props, null, 2), 4);
      if (fn === "fromTo") return `gsap.fromTo(target, {}, ${propsStr})`;
      return `gsap.${fn}(target, ${propsStr})`;
    };
    const enter = cfg.enter || {};
    const exit = cfg.exit || {};
    const header = [
      "// Custom — exported from Transition Builder",
      "// Requires GSAP 3+ loaded as `gsap`.",
      "//",
      "// Usage:",
      "//   const t = new Function('return ' + codeFromDB)();",
      "//   await t.exit(element);",
      "//   await t.enter(element);",
      "",
    ].join("\n");
    return (
      header +
      `({
  exit(target) {
    return ${buildCall(exit)};
  },
  enter(target) {
    return ${buildCall(enter)};
  }
})`
    );
  }

  function generatePresetJS(name, transition, cfg) {
    const PUBLIC = ["build", "arrive", "exit", "enter"];
    const methodSources = [];
    const publicWrappers = [];
    let usesTintColor = false;

    Object.entries(transition).forEach(([key, value]) => {
      if (typeof value !== "function") return;
      const src = value.toString();
      if (src.includes("tintColor")) usesTintColor = true;

      if (PUBLIC.includes(key)) {
        // Rename `build(o, c) {...}` → `_build(o, c) {...}` so the
        // public wrapper can inject `this.config` as `c`.
        const renamed = src.replace(
          /^(\s*)(async\s+)?(\w+)\s*\(/,
          (m, ws, asyncK) => {
            return ws + (asyncK || "") + "_" + key + "(";
          },
        );
        methodSources.push("    " + indent(renamed, 4));
      } else {
        // Helpers (_prop, _exitFrom, _clips, …) stay as-is.
        methodSources.push("    " + indent(src, 4));
      }
    });

    // Public wrappers bind the frozen config + set up overlay state/class
    publicWrappers.push(`    build(target) {
      ensureStyles();
      target.classList.add('pt-overlay');
      target.setAttribute('data-transition', ${JSON.stringify(name)});
      return this._build(target, this.config);
    }`);
    publicWrappers.push(
      `    arrive(target) { return this._arrive(target, this.config); }`,
    );
    publicWrappers.push(
      `    exit(target)   { return this._exit(target, this.config); }`,
    );
    publicWrappers.push(
      `    enter(target)  { return this._enter(target, this.config); }`,
    );

    const header = [
      `// ${transition.label} — exported from Transition Builder`,
      "// Requires GSAP 3+ loaded as `gsap`. CSS is auto-injected on first build().",
      "//",
      "// Usage:",
      "//   const t = new Function('return ' + codeFromDB)();",
      '//   const overlay = document.createElement("div");',
      "//   document.body.appendChild(overlay);",
      "//   t.build(overlay);          // tags element as .pt-overlay + injects styles",
      '//   overlay.classList.add("is-active");',
      "//   await t.exit(overlay);     // play exit (cover viewport)",
      "//   t.arrive(overlay);         // snap to the covering state",
      "//   await t.enter(overlay);    // play enter (uncover)",
      '//   overlay.classList.remove("is-active");',
      "",
    ].join("\n");

    const css = `${CSS_BASE}${CSS_BY_TRANSITION[name] ? "\n\n" + CSS_BY_TRANSITION[name] : ""}`;
    const cssConst = `  const CSS = ${JSON.stringify(css)};
  const STYLE_ID = 'pt-exported-${name}';
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }`;

    const configLine = "    config: " + indent(JSON.stringify(cfg, null, 2), 4);
    const prelude =
      (usesTintColor ? TINT_COLOR_SRC + "\n\n" : "") + cssConst + "\n\n";
    const body = [configLine, ...methodSources, ...publicWrappers].join(",\n");

    return (
      header +
      "(function () {\n" +
      prelude +
      "  return {\n" +
      body +
      "\n  };\n})()"
    );
  }

  function generateTransitionJS() {
    const name = getSelected();
    const transition = TRANSITIONS[name];
    if (!transition) return "/* transition not found */";
    const cfg = getConfig(name);
    if (name === "custom") return generateCustomJS(cfg);
    return generatePresetJS(name, transition, cfg);
  }

  function openExportView(modal) {
    const main = modal.querySelector(".pt-main");
    const existing = main.querySelector(".pt-export-view");
    if (existing) existing.remove();

    const name = getSelected();
    const label = (TRANSITIONS[name] && TRANSITIONS[name].label) || name;

    const view = document.createElement("div");
    view.className = "pt-export-view";
    view.innerHTML = `
            <div class="pt-export-head">
                <h3 class="pt-export-title">Export: ${esc(label)}</h3>
                <span class="pt-export-sub">
                    <span data-export-sub="js">Runnable JS. CSS is auto-injected on <code>build()</code> — drop and run.</span>
                    <span data-export-sub="json" hidden>JSON config — matches <code>pt:cfg:${esc(name)}:shared | :exit | :enter</code> in localStorage.</span>
                    <span data-export-sub="css"  hidden>Standalone CSS — paste into your stylesheet if you prefer not to auto-inject.</span>
                </span>
            </div>
            <div class="pt-export-tabs">
                <button class="pt-export-tab active" type="button" data-export-mode="js">Code (JS)</button>
                <button class="pt-export-tab"        type="button" data-export-mode="css">CSS</button>
                <button class="pt-export-tab"        type="button" data-export-mode="json">Config (JSON)</button>
            </div>
            <textarea class="pt-export-code" readonly spellcheck="false"></textarea>
            <div class="pt-export-foot">
                <button class="pt-foot-btn pt-foot-btn-primary" type="button" data-export-action="copy">
                    <span class="pt-foot-btn-icon">⧉</span> Copy
                </button>
                <button class="pt-foot-btn" type="button" data-export-action="back">
                    <span class="pt-foot-btn-icon">←</span> Back
                </button>
            </div>
        `;
    main.appendChild(view);

    const textarea = view.querySelector(".pt-export-code");
    const GENERATORS = {
      js: generateTransitionJS,
      css: generateTransitionCSS,
      json: generateTransitionConfig,
    };
    const setMode = (mode) => {
      const gen = GENERATORS[mode] || GENERATORS.js;
      textarea.value = gen();
      view.querySelectorAll(".pt-export-tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.exportMode === mode);
      });
      view.querySelectorAll("[data-export-sub]").forEach((el) => {
        el.hidden = el.dataset.exportSub !== mode;
      });
    };
    setMode("js");
    view.querySelectorAll(".pt-export-tab").forEach((t) => {
      t.addEventListener("click", () => setMode(t.dataset.exportMode));
    });

    view
      .querySelector('[data-export-action="back"]')
      .addEventListener("click", () => view.remove());

    const btnCopy = view.querySelector('[data-export-action="copy"]');
    btnCopy.addEventListener("click", async () => {
      const ta = view.querySelector(".pt-export-code");
      try {
        await navigator.clipboard.writeText(ta.value);
      } catch (e) {
        // Fallback to execCommand
        ta.select();
        try {
          document.execCommand("copy");
        } catch (_) {}
      }
      const orig = btnCopy.innerHTML;
      btnCopy.innerHTML = '<span class="pt-foot-btn-icon">✓</span> Copied';
      setTimeout(() => {
        btnCopy.innerHTML = orig;
      }, 1200);
    });
  }

  /* Render a single schema prop as a Preset row (select/range/color/toggle). */
  function presetSchemaField(key, spec, val) {
    const label = spec.label || key;
    if (spec.type === "range") {
      return presetField(label, "number", key, null, val, {
        min: spec.min,
        max: spec.max,
        step: spec.step,
      });
    }
    if (spec.type === "select") {
      const opts = [
        { value: "", label: "Select One" },
        ...spec.options.map((o) => ({ value: o, label: o })),
      ];
      return presetField(label, "select", key, opts, val);
    }
    if (spec.type === "color")
      return presetField(label, "color", key, null, val);
    if (spec.type === "toggle")
      return presetField(label, "toggle", key, null, val);
    return "";
  }

  function renderPresetPane(pane) {
    const name = getSelected();
    const cfg = getConfig(name);
    const schema = TRANSITIONS[name].schema;
    const global = getGlobalConfig();

    // Group every schema prop by its phase tag
    const shared = [],
      exit = [],
      enter = [];
    Object.entries(schema).forEach(([key, spec]) => {
      const phase = spec.phase || "shared";
      if (phase === "exit") exit.push([key, spec]);
      else if (phase === "enter") enter.push([key, spec]);
      else shared.push([key, spec]);
    });

    const transitionOptions = [
      { value: "", label: "Select One" },
      ...Object.entries(TRANSITIONS)
        .filter(([, v]) => !v.hidden)
        .map(([k, v]) => ({ value: k, label: v.label })),
    ];
    const bodyEffectOptions = [
      { value: "none", label: "None" },
      { value: "scale", label: "Scale down" },
      { value: "fade", label: "Fade" },
      { value: "blur", label: "Blur" },
      { value: "slideUp", label: "Slide up" },
      { value: "slideDown", label: "Slide down" },
    ];

    let html = "";
    html += `<div class="pt-block" data-phase="global">
            <h4 class="pt-block-title">Global</h4>
            ${presetField("Body Effect", "select", "__bodyEffect", bodyEffectOptions, global.bodyEffect)}
            ${presetField("Effect Strength", "number", "__bodyStrength", null, global.bodyStrength, { min: 0, max: 1, step: 0.05 })}
            ${presetField("Hold Duration", "number", "__holdDuration", null, global.holdDuration, { min: 0, max: 3, step: 0.05 })}
            ${presetField("Overlay Logo", "text", "__overlayLogo", null, global.overlayLogo || "", { placeholder: "URL, data-URL, or inline <svg>" })}
            ${presetField("Logo Size", "number", "__overlayLogoSize", null, global.overlayLogoSize || 72, { min: 16, max: 240, step: 2 })}
            ${presetField("Overlay Label", "text", "__overlayLabel", null, global.overlayLabel || "", { placeholder: "Brand text" })}
        </div>`;
    html += presetField(
      "Transition Type",
      "select",
      "__type",
      transitionOptions,
      name,
    );
    html += shared.map(([k, s]) => presetSchemaField(k, s, cfg[k])).join("");

    if (exit.length) {
      html += `<div class="pt-block" data-phase="exit">
                <h4 class="pt-block-title">Exit</h4>
                ${exit.map(([k, s]) => presetSchemaField(k, s, cfg[k])).join("")}
            </div>`;
    }
    if (enter.length) {
      html += `<div class="pt-block" data-phase="enter">
                <h4 class="pt-block-title">Enter</h4>
                ${enter.map(([k, s]) => presetSchemaField(k, s, cfg[k])).join("")}
            </div>`;
    }

    pane.innerHTML = html;

    // Transition-type is a meta control (not a schema prop)
    const typeSel = pane.querySelector('[data-prop="__type"]');
    typeSel.addEventListener("change", () => {
      if (!typeSel.value) return;
      setSelected(typeSel.value);
      buildOverlay(typeSel.value);
      renderPresetPane(pane);
    });

    // Global controls — persist to pt:global
    const GLOBAL_KEYS = {
      __bodyEffect: "bodyEffect",
      __bodyStrength: "bodyStrength",
      __holdDuration: "holdDuration",
      __overlayLogo: "overlayLogo",
      __overlayLogoSize: "overlayLogoSize",
      __overlayLabel: "overlayLabel",
    };
    const OVERLAY_DOM_KEYS = new Set([
      "overlayLogo",
      "overlayLogoSize",
      "overlayLabel",
    ]);
    Object.entries(GLOBAL_KEYS).forEach(([attr, key]) => {
      const el = pane.querySelector(`[data-prop="${attr}"]`);
      if (!el) return;
      const commit = () => {
        const g = getGlobalConfig();
        if (el.type === "checkbox") g[key] = el.checked;
        else if (el.type === "number") g[key] = parseFloat(el.value) || 0;
        else g[key] = el.value;
        setGlobalConfig(g);
        // Any key that changes the overlay DOM requires a rebuild
        if (OVERLAY_DOM_KEYS.has(key)) {
          buildOverlay(getSelected());
        }
      };
      const evt =
        el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input";
      el.addEventListener(evt, commit);
    });

    // Every other input binds straight back to the schema-keyed config
    pane.querySelectorAll("[data-prop]").forEach((input) => {
      const key = input.dataset.prop;
      if (key === "__type" || !(key in schema)) return;

      const commit = () => {
        const n = getSelected();
        const c = getConfig(n);
        let value;
        if (input.type === "checkbox") value = input.checked;
        else if (input.type === "number") value = parseFloat(input.value) || 0;
        else value = input.value;
        c[key] = value;
        setConfig(n, c);
        buildOverlay(n, c);

        // Keep the hex label in sync with the color swatch
        if (input.type === "color") {
          const hex = pane.querySelector(`[data-hex-for="${key}"]`);
          if (hex) hex.textContent = value;
        }
      };

      if (input.tagName === "SELECT" || input.type === "checkbox") {
        input.addEventListener("change", commit);
      } else {
        input.addEventListener("input", commit);
      }
    });
  }

  function buildBuilderUI() {
    // Floating trigger button
    const trigger = document.createElement("button");
    trigger.className = "pt-trigger";
    trigger.type = "button";
    trigger.innerHTML =
      '<span class="pt-trigger-dot"></span><span>Page Transition Builder</span>';
    document.body.appendChild(trigger);

    // Modal root
    const modal = document.createElement("div");
    modal.className = "pt-modal";
    modal.innerHTML = `
            <div class="pt-modal-inner">
                <aside class="pt-side">
                    <div class="pt-side-item" data-disabled>Scroll Smoother</div>
                    <div class="pt-side-item" data-disabled>Import / Export</div>
                    <div class="pt-side-item active">Page Transition</div>
                    <div class="pt-side-item" data-disabled>Pre Loader</div>
                    <div class="pt-side-item" data-disabled>GSAP Plugin</div>
                    <div class="pt-side-item" data-disabled>Devices Config</div>
                </aside>
                <div class="pt-main">
                    <div class="pt-tabs">
                        <button class="pt-tab" type="button" data-tab="custom">Custom</button>
                        <button class="pt-tab active" type="button" data-tab="preset">Preset</button>
                    </div>
                    <div class="pt-panes">
                        <div class="pt-pane pt-pane-preset active" data-pane="preset"></div>
                        <div class="pt-pane pt-pane-custom" data-pane="custom"></div>
                    </div>
                    <div class="pt-foot">
                        <button class="pt-foot-btn pt-foot-btn-primary" type="button" data-action="complete">
                            <span class="pt-foot-btn-icon">✓</span> Complete
                        </button>
                        <button class="pt-foot-btn" type="button" data-action="preview">
                            <span class="pt-foot-btn-icon">▶</span> Preview
                        </button>
                        <button class="pt-foot-btn" type="button" data-action="export">
                            <span class="pt-foot-btn-icon">⇪</span> Export
                        </button>
                        <button class="pt-foot-btn" type="button" data-action="close">
                            <span class="pt-foot-btn-icon">✕</span> Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(modal);

    const presetPane = modal.querySelector(".pt-pane-preset");
    const customPane = modal.querySelector(".pt-pane-custom");
    const btnComplete = modal.querySelector('[data-action="complete"]');
    const btnPreview = modal.querySelector('[data-action="preview"]');
    const btnExport = modal.querySelector('[data-action="export"]');
    const btnClose = modal.querySelector('[data-action="close"]');
    const tabs = modal.querySelectorAll(".pt-tab");
    const panes = modal.querySelectorAll(".pt-pane");

    // Open / close
    const openModal = () => modal.classList.add("open");
    const closeModal = () => modal.classList.remove("open");
    trigger.addEventListener("click", openModal);
    btnClose.addEventListener("click", closeModal);
    btnComplete.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    // Tabs — switching tabs activates the matching transition so that
    // the next Preview / navigation uses it.
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const which = tab.dataset.tab;
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        panes.forEach((p) =>
          p.classList.toggle("active", p.dataset.pane === which),
        );

        if (which === "custom") {
          setSelected("custom");
          buildOverlay("custom");
        } else {
          // Restore whatever transition is picked in the Preset dropdown
          const typeSel = presetPane.querySelector('[data-prop="__type"]');
          const name = (typeSel && typeSel.value) || "curtain";
          setSelected(name);
          buildOverlay(name);
        }
      });
    });

    // If we opened with custom already selected (persisted from last session),
    // sync the tab state before rendering.
    if (getSelected() === "custom") {
      tabs.forEach((t) =>
        t.classList.toggle("active", t.dataset.tab === "custom"),
      );
      panes.forEach((p) =>
        p.classList.toggle("active", p.dataset.pane === "custom"),
      );
    }

    // Panes
    renderPresetPane(presetPane);
    renderCustomPane(customPane);

    // Export — shows generated code in an overlay view
    btnExport.addEventListener("click", () => openExportView(modal));

    // Preview — plays the current transition on the page behind the modal
    btnPreview.addEventListener("click", async () => {
      if (isTransitioning) return;
      isTransitioning = true;
      btnPreview.disabled = true;
      const name = getSelected();
      const cfg = getConfig(name);
      const global = getGlobalConfig();
      const overlay = buildOverlay(name, cfg);
      overlay.classList.add("is-active");
      try {
        await Promise.all([
          playPhase(TRANSITIONS[name], "exit", overlay, cfg),
          playBodyOut(global),
        ]);
        showOverlayUI();
        const hold = global.holdDuration > 0 ? global.holdDuration * 1000 : 200;
        await new Promise((r) => setTimeout(r, hold));
        TRANSITIONS[name].arrive(overlay, cfg);
        hideOverlayUI();
        await Promise.all([
          playPhase(TRANSITIONS[name], "enter", overlay, cfg),
          playBodyIn(global),
        ]);
      } finally {
        overlay.classList.remove("is-active");
        isTransitioning = false;
        btnPreview.disabled = false;
      }
    });
  }

  /* ============================================================
       Init — SPA navigation only. No reload-based replay.
       ============================================================ */
  function init() {
    if (typeof gsap === "undefined") {
      console.error("[transitions] GSAP not loaded.");
      return;
    }

    const selected = getSelected();
    buildOverlay(selected, getConfig(selected));

    try {
      history.replaceState(
        { pt: true, href: window.location.href },
        "",
        window.location.href,
      );
    } catch (e) {}

    // Intercept internal link clicks
    document.addEventListener("click", async (e) => {
      if (isTransitioning) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest("a");
      if (!isInternalLink(a)) return;
      e.preventDefault();
      await navigate(a.href, true);
    });

    // Back / forward buttons
    window.addEventListener("popstate", () => {
      if (isTransitioning) return;
      navigate(window.location.href, false);
    });

    // bfcache restore
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        isTransitioning = false;
        const o = document.querySelector(".pt-overlay");
        if (o) {
          o.classList.remove("is-active");
          buildOverlay(getSelected());
        }
      }
    });

    buildBuilderUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
