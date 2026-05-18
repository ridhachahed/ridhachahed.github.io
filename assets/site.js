/* ===================================================================
   Ridha Chahed — interactive terminal
   Vanilla JS, no dependencies.
   =================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------
     Interactive terminal
     ----------------------------------------------------------------- */
  var body = document.getElementById("term-body");
  var input = document.getElementById("term-input");
  if (!body || !input) return;

  /* ---- Blinking block cursor that tracks the caret ---- */
  var measure = document.getElementById("term-measure");
  var cursor = document.getElementById("term-cursor");
  var wrap = input.parentNode;
  var typingTimer;

  function updateCursor() {
    if (!measure || !cursor) return;
    var pos = input.selectionStart;
    if (pos === null || pos === undefined) pos = input.value.length;
    measure.textContent = input.value.slice(0, pos);
    cursor.style.left = measure.offsetWidth + "px";
  }

  // Hold the block steady while actively typing, then resume blinking.
  function markTyping() {
    if (wrap) wrap.classList.add("typing");
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      if (wrap) wrap.classList.remove("typing");
    }, 500);
  }

  function syncCursor(typing) {
    if (typing) markTyping();
    // Defer so selectionStart reflects the post-key state.
    requestAnimationFrame(updateCursor);
  }

  input.addEventListener("input", function () { syncCursor(true); });
  input.addEventListener("keydown", function () { syncCursor(true); });
  input.addEventListener("keyup", function () { syncCursor(false); });
  input.addEventListener("click", function () { syncCursor(false); });
  input.addEventListener("select", function () { syncCursor(false); });
  input.addEventListener("focus", function () { syncCursor(false); });
  window.addEventListener("resize", updateCursor);

  var LINKS = {
    github: "https://github.com/ridhachahed",
    twitter: "https://twitter.com/ChahedRidha",
    linkedin: "https://www.linkedin.com/in/ridha-chahed/",
    email: "mailto:ridha.chahed@gmail.com",
    cv: "/pdfs/CV_Ridha_Chahed.pdf"
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

  /* ---- Session persistence (survives page navigation) ---- */
  var STORE = "ridha-term-v1";

  function saveState() {
    try {
      var nodes = body.querySelectorAll(".term-line, .term-out");
      var html = "";
      for (var i = 0; i < nodes.length; i++) html += nodes[i].outerHTML;
      sessionStorage.setItem(STORE, JSON.stringify({ html: html, hist: history }));
    } catch (e) { /* storage unavailable — ignore */ }
  }

  function restoreState() {
    try {
      var raw = sessionStorage.getItem(STORE);
      if (!raw) return false;
      var s = JSON.parse(raw);
      if (!s) return false;
      var tmp = document.createElement("div");
      tmp.innerHTML = s.html || "";
      while (tmp.firstChild) body.insertBefore(tmp.firstChild, body.lastElementChild);
      if (s.hist && s.hist.length) { history = s.hist; hIdx = history.length; }
      scroll();
      return true;
    } catch (e) { return false; }
  }

  var ROUTES = {
    home: "/",
    about: "/#about",
    work: "/work/",
    cv: "/cv/",
    projects: "/projects/",
    conferences: "/conferences/"
  };

  function nav(name) {
    var dest = ROUTES[name];
    if (!dest) { print("no such page: <span class='hl'>" + esc(name) + "</span>"); return; }
    var path = dest.split("#")[0] || "/";
    var hash = dest.indexOf("#") > -1 ? dest.split("#")[1] : "";
    var here = location.pathname.replace(/index\.html$/, "") || "/";
    if (here === path) {
      var el = hash ? document.getElementById(hash) : document.body;
      print("→ <span class='hl'>" + name + "</span>");
      if (el) setTimeout(function () {
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }, 160);
      return;
    }
    print("→ navigating to <span class='hl'>" + name + "</span> …");
    setTimeout(function () { location.href = dest; }, 340);
  }

  var COMMANDS = {
    help: function () {
      print(
        "available commands\n" +
        "  <span class='k'>help</span>        this message\n" +
        "  <span class='k'>ls</span>          list pages\n" +
        "  <span class='k'>whoami</span>      who is this\n" +
        "  <span class='k'>cd</span> &lt;page&gt;    go to a page (work, cv, projects, conferences, home)\n" +
        "  <span class='k'>work</span>        go to work\n" +
        "  <span class='k'>cv</span>          go to the cv / résumé\n" +
        "  <span class='k'>projects</span>    go to projects\n" +
        "  <span class='k'>conferences</span> go to conferences\n" +
        "  <span class='k'>about</span>       about me\n" +
        "  <span class='k'>open</span> &lt;x&gt;     open cv | github | linkedin | twitter | email\n" +
        "  <span class='k'>contact</span>     how to reach me\n" +
        "  <span class='k'>banner</span>      print the banner\n" +
        "  <span class='k'>clear</span>       clear the screen\n" +
        "\ntip: use <span class='hl'>Tab</span> to complete, <span class='hl'>↑/↓</span> for history."
      );
    },
    ls: function () {
      print("home/   work/   cv/   projects/   conferences/   — plus <span class='k'>open github</span>, <span class='k'>contact</span>");
    },
    cd: function (a) {
      var t = (a[0] || "home").toLowerCase().replace(/[\/~.]/g, "");
      if (t === "") t = "home";
      if (!ROUTES[t]) {
        print("cd: no such page: <span class='hl'>" + esc(a[0] || "") +
          "</span> — try home, work, cv, projects");
        return;
      }
      nav(t);
    },
    whoami: function () {
      print("Ridha Chahed — Senior Member of Technical Staff at Oracle Zurich, leading LLM &amp; Generative AI in MySQL HeatWave.");
    },
    home: function () { nav("home"); },
    about: function () { nav("about"); },
    bio: function () { nav("about"); },
    work: function () { nav("work"); },
    projects: function () { nav("projects"); },
    conferences: function () { nav("conferences"); },
    talks: function () { nav("conferences"); },
    cv: function () {
      print("résumé · <a href='" + LINKS.cv + "'>download pdf ↗</a>");
      nav("cv");
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
        print("open: unknown target '" + esc(t) + "'. try: cv, github, linkedin, twitter, email");
      }
    },
    clear: function () {
      var lines = body.querySelectorAll(".term-line, .term-out");
      for (var i = 0; i < lines.length; i++) lines[i].remove();
      saveState();
    },
    banner: function () { printBanner(); },
    echo: function (a) { print(esc(a.join(" "))); },
    pwd: function () { print("~" + (location.pathname.replace(/\/$/, "") || "")); },
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
    saveState();
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

  /* ---- Boot: restore a prior session, or auto-type a welcome ---- */
  var boot = ["help"];

  if (restoreState()) {
    input.focus();
    return;
  }
  printBanner();
  saveState();

  function autoType(cmd, done) {
    var i = 0;
    (function step() {
      if (i <= cmd.length) {
        input.value = cmd.slice(0, i++);
        markTyping();
        updateCursor();
        setTimeout(step, 110);
      } else {
        echoCmd(cmd);
        input.value = "";
        updateCursor();
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
