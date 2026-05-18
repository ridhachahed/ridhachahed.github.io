/* ===================================================================
   Ridha Chahed — interactive terminal + animated background art
   Vanilla JS, no dependencies.
   =================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------
     1. Animated background — drifting constellation of warm particles
     ----------------------------------------------------------------- */
  (function bgArt() {
    var canvas = document.getElementById("bg-art");
    if (!canvas || reduce) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, pts, fieldH;

    // Depth layers: far (small/slow/faint) → near (large/fast/bold).
    function resize() {
      W = canvas.width = innerWidth * dpr;
      H = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      // Field is taller than the viewport so scroll parallax has room.
      fieldH = H + 600 * dpr;
      var n = Math.round(Math.min(120, (innerWidth * innerHeight) / 13000));
      pts = [];
      for (var i = 0; i < n; i++) {
        var z = Math.random();                       // 0 = far, 1 = near
        pts.push({
          x: Math.random() * W,
          y: Math.random() * fieldH,
          vx: (Math.random() - 0.5) * (0.07 + z * 0.20) * dpr,
          vy: (Math.random() - 0.5) * (0.07 + z * 0.20) * dpr,
          z: z,
          r: (0.6 + z * 2.0) * dpr,
          ox: 0, oy: 0,                               // eased mouse offset
          warm: Math.random() > 0.6
        });
      }
    }

    var mx = -9999, my = -9999, tmx = -9999, tmy = -9999;
    var scrollY = 0, sTarget = 0;
    addEventListener("mousemove", function (e) {
      tmx = e.clientX * dpr; tmy = e.clientY * dpr;
    });
    addEventListener("mouseout", function () { tmx = tmy = -9999; });
    addEventListener("scroll", function () {
      sTarget = (window.pageYOffset || 0) * dpr;
    }, { passive: true });

    var LINK = 0;
    function tick() {
      // Smooth followers for buttery interaction.
      mx += (tmx - mx) * 0.12;
      my += (tmy - my) * 0.12;
      scrollY += (sTarget - scrollY) * 0.08;

      ctx.clearRect(0, 0, W, H);
      LINK = 150 * dpr;
      var rep = 130 * dpr;

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = fieldH + 20; else if (p.y > fieldH + 20) p.y = -20;

        // Parallax: nearer layers shift more as you scroll.
        p.sx = p.x;
        p.sy = p.y - scrollY * (0.15 + p.z * 0.55);
        // Wrap the parallaxed Y back into the visible band.
        p.sy = ((p.sy % fieldH) + fieldH) % fieldH;

        // Smooth, eased repulsion around the cursor.
        var dxm = p.sx - mx, dym = p.sy - my;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        var tx = 0, ty = 0;
        if (dm < rep && dm > 0.01) {
          var f = (1 - dm / rep);
          f = f * f * (28 + p.z * 34) * dpr;
          tx = (dxm / dm) * f;
          ty = (dym / dm) * f;
        }
        p.ox += (tx - p.ox) * 0.10;
        p.oy += (ty - p.oy) * 0.10;
        p.dx = p.sx + p.ox;
        p.dy = p.sy + p.oy;
      }

      // Links between nearby points (depth-weighted opacity).
      for (var a = 0; a < pts.length; a++) {
        var pa = pts[a];
        for (var b = a + 1; b < pts.length; b++) {
          var pb = pts[b];
          var lx = pa.dx - pb.dx, ly = pa.dy - pb.dy;
          var d2 = lx * lx + ly * ly;
          if (d2 < LINK * LINK) {
            var d = Math.sqrt(d2);
            var op = 0.07 * (1 - d / LINK) * (0.4 + (pa.z + pb.z) * 0.5);
            ctx.strokeStyle = "rgba(33,29,22," + op + ")";
            ctx.lineWidth = (0.5 + ((pa.z + pb.z) * 0.5)) * dpr;
            ctx.beginPath();
            ctx.moveTo(pa.dx, pa.dy);
            ctx.lineTo(pb.dx, pb.dy);
            ctx.stroke();
          }
        }
      }

      // Faint links from the cursor to nearby points.
      if (mx > -1000) {
        for (var c = 0; c < pts.length; c++) {
          var pc = pts[c];
          var cx = pc.dx - mx, cy = pc.dy - my;
          var cd = Math.sqrt(cx * cx + cy * cy);
          if (cd < rep) {
            ctx.strokeStyle = "rgba(15,122,82," + (0.10 * (1 - cd / rep)) + ")";
            ctx.lineWidth = dpr;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(pc.dx, pc.dy);
            ctx.stroke();
          }
        }
      }

      // Dots last, so they sit on top of the web.
      for (var k = 0; k < pts.length; k++) {
        var p2 = pts[k];
        var alpha = 0.14 + p2.z * 0.30;
        ctx.beginPath();
        ctx.arc(p2.dx, p2.dy, p2.r, 0, 6.2832);
        ctx.fillStyle = p2.warm
          ? "rgba(194,97,31," + alpha + ")"
          : "rgba(15,122,82," + alpha + ")";
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    resize();
    addEventListener("resize", resize);
    tick();
  })();

  /* -----------------------------------------------------------------
     2. Interactive terminal
     ----------------------------------------------------------------- */
  var body = document.getElementById("term-body");
  var input = document.getElementById("term-input");
  if (!body || !input) return;

  var LINKS = {
    github: "https://github.com/ridhachahed",
    twitter: "https://twitter.com/ChahedRidha",
    linkedin: "https://www.linkedin.com/in/ridha-chahed/",
    email: "mailto:ridha.chahed@gmail.com"
  };

  var history = [];
  var hIdx = -1;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function scroll() { body.scrollTop = body.scrollHeight; }

  function print(html, cls) {
    var d = document.createElement("div");
    d.className = "term-out" + (cls ? " " + cls : "");
    d.innerHTML = html;
    body.insertBefore(d, body.lastElementChild);
    scroll();
  }

  function echoCmd(cmd) {
    var d = document.createElement("div");
    d.className = "term-line";
    d.innerHTML =
      '<span class="pmt">ridha@web</span>:<span class="pth">~</span>$ ' +
      '<span class="cmd">' + esc(cmd) + "</span>";
    body.insertBefore(d, body.lastElementChild);
  }

  function goTo(id, label) {
    var el = document.getElementById(id);
    if (!el) { print("section not found: " + id); return; }
    print("→ navigating to <span class=\"hl\">" + label + "</span> …");
    setTimeout(function () {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, 180);
  }

  var COMMANDS = {
    help: function () {
      print(
        "available commands\n" +
        "  <span class='k'>help</span>        this message\n" +
        "  <span class='k'>ls</span>          list site sections\n" +
        "  <span class='k'>whoami</span>      who is this\n" +
        "  <span class='k'>about</span>       jump to bio\n" +
        "  <span class='k'>work</span>        jump to work\n" +
        "  <span class='k'>projects</span>    jump to projects\n" +
        "  <span class='k'>cv</span>          résumé / cv\n" +
        "  <span class='k'>open</span> &lt;x&gt;     open github | twitter | linkedin | email\n" +
        "  <span class='k'>contact</span>     how to reach me\n" +
        "  <span class='k'>banner</span>      print the banner\n" +
        "  <span class='k'>clear</span>       clear the screen\n" +
        "\ntip: use <span class='hl'>Tab</span> to complete, <span class='hl'>↑/↓</span> for history."
      );
    },
    ls: function () {
      print("about/   work/   projects/   cv/   contact/");
    },
    whoami: function () {
      print("Ridha Chahed — Machine Learning engineer (Generative AI &amp; LLMs) at Oracle Zurich, MySQL HeatWave team.");
    },
    about: function () { goTo("about", "about"); },
    bio: function () { goTo("about", "about"); },
    work: function () { goTo("work", "work"); },
    projects: function () { goTo("projects", "projects"); },
    cv: function () {
      print("CV is being polished — meanwhile try <span class='k'>about</span>, or <span class='k'>open linkedin</span>.");
    },
    resume: function () { COMMANDS.cv(); },
    contact: function () {
      print(
        "email    <a href='mailto:ridha.chahed@gmail.com'>ridha.chahed@gmail.com</a>\n" +
        "github   <a href='" + LINKS.github + "'>@ridhachahed</a>\n" +
        "twitter  <a href='" + LINKS.twitter + "'>@ChahedRidha</a>\n" +
        "linkedin <a href='" + LINKS.linkedin + "'>ridha-chahed</a>"
      );
    },
    open: function (args) {
      var t = (args[0] || "").toLowerCase();
      if (LINKS[t]) {
        print("opening <span class='hl'>" + t + "</span> …");
        window.open(LINKS[t], t === "email" ? "_self" : "_blank");
      } else {
        print("open: unknown target '" + esc(t) + "'. try: github, twitter, linkedin, email");
      }
    },
    clear: function () {
      var lines = body.querySelectorAll(".term-line, .term-out");
      for (var i = 0; i < lines.length; i++) lines[i].remove();
    },
    banner: function () { printBanner(); },
    echo: function (a) { print(esc(a.join(" "))); },
    pwd: function () { print("/home/ridha/web"); },
    date: function () { print(new Date().toString()); },
    history: function () {
      print(history.map(function (h, i) { return "  " + (i + 1) + "  " + esc(h); }).join("\n") || "(empty)");
    },
    sudo: function () {
      print("nice try — but you don't have root on my ambitions. 🙂", "hl");
    }
  };

  function printBanner() {
    print(
      "<span class='k ascii'>" +
      "██████╗ ██╗██████╗ ██╗  ██╗ █████╗ \n" +
      "██╔══██╗██║██╔══██╗██║  ██║██╔══██╗\n" +
      "██████╔╝██║██║  ██║███████║███████║\n" +
      "██╔══██╗██║██║  ██║██╔══██║██╔══██║\n" +
      "██║  ██║██║██████╔╝██║  ██║██║  ██║\n" +
      "╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝" +
      "</span>\n" +
      "Machine Learning Engineer · Generative AI &amp; LLMs · Zurich\n" +
      "Type <span class='k'>help</span> to get started."
    );
  }

  function run(raw) {
    var line = raw.trim();
    if (!line) return;
    history.push(line);
    hIdx = history.length;
    var parts = line.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var args = parts.slice(1);
    if (COMMANDS.hasOwnProperty(cmd)) {
      COMMANDS[cmd](args);
    } else {
      print("command not found: <span class='hl'>" + esc(cmd) +
        "</span> — type <span class='k'>help</span>");
    }
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var v = input.value;
      echoCmd(v);
      input.value = "";
      run(v);
      scroll();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hIdx > 0) { hIdx--; input.value = history[hIdx] || ""; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx] || ""; }
      else { hIdx = history.length; input.value = ""; }
    } else if (e.key === "Tab") {
      e.preventDefault();
      var cur = input.value.trim().toLowerCase();
      if (!cur) return;
      var names = Object.keys(COMMANDS);
      var m = names.filter(function (n) { return n.indexOf(cur) === 0; });
      if (m.length === 1) input.value = m[0] + " ";
      else if (m.length > 1) { echoCmd(input.value); print(m.join("   ")); }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      COMMANDS.clear();
    }
  });

  // Focus the prompt when clicking anywhere in the terminal body.
  body.addEventListener("click", function () {
    if (!window.getSelection || String(window.getSelection()) === "") input.focus();
  });

  /* ---- Boot sequence: auto-type a welcome ---- */
  var boot = ["help"];
  printBanner();

  function autoType(cmd, done) {
    var i = 0;
    (function step() {
      if (i <= cmd.length) {
        input.value = cmd.slice(0, i++);
        setTimeout(step, 110);
      } else {
        echoCmd(cmd);
        input.value = "";
        run(cmd);
        setTimeout(done, 650);
      }
    })();
  }

  if (reduce) {
    boot.forEach(function (c) { echoCmd(c); run(c); });
    input.focus();
  } else {
    var bi = 0;
    setTimeout(function next() {
      if (bi < boot.length) autoType(boot[bi++], next);
      else input.focus();
    }, 650);
  }
})();
