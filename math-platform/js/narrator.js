/* StepWise Math — narrated "Watch Explanation" lesson player.
 * Developed by Rajkumar Kuppuswami.
 *
 * No video file is needed: scenes animate the equation and diagrams on a
 * digital whiteboard while captions (and text-to-speech where the browser
 * offers it) explain each scene. When real video lessons exist, a scene can
 * carry a `video` URL and this player can hand off to a <video> element.
 */
(function (SW) {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hasTTS = () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";

  /** Build scenes from a topic and its worked example. */
  function scenesFor(topic, solution, problemText) {
    const scenes = [
      { title: topic.title, board: `<div class="wb-title">${esc(topic.title)}</div>`, say: topic.concept },
      { title: "A real-world story", board: topic.id.includes("fraction") ? `<div class="wb-row">${SW.visuals.pizza(3, 4)}${SW.visuals.pizza(2, 4, "b")}</div>` : `<div class="wb-story">${esc(topic.story)}</div>`, say: topic.story },
      { title: "The problem", board: `<div class="wb-eq">${esc(problemText)} = ?</div>`, say: `Let's solve ${problemText.replace(/\//g, " over ").replace(/−/g, " minus ")}, one step at a time.` },
    ];
    solution.steps.forEach((st, i) => {
      scenes.push({
        title: `Step ${i + 1}: ${st.title}`,
        board: `<div class="wb-eq wb-anim">${esc(st.expr)}</div>${st.visual ? `<div class="wb-viz">${SW.visuals.render(st.visual)}</div>` : ""}<div class="wb-note">${esc(st.what)}</div>`,
        say: `Step ${i + 1}. ${st.title}. ${st.what} ${st.why}`,
      });
    });
    scenes.push({ title: "Answer", board: `<div class="wb-eq wb-answer">${esc(problemText)} = ${esc(solution.answerText)}</div>`, say: `So the answer is ${solution.answerText}. Now it's your turn to try one.` });
    return scenes;
  }

  function spoken(text) {
    return text.replace(/(\d+)\/(\d+)/g, "$1 over $2").replace(/−/g, " minus ").replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/=/g, " equals ");
  }

  /** Mount a player into `root`. Returns { destroy }. */
  function mount(root, scenes) {
    let i = 0, playing = false, speed = 1, captions = true, voice = hasTTS(), timer = null;
    root.innerHTML = `
      <div class="player" role="region" aria-label="Narrated lesson player">
        <div class="wb" aria-live="polite"><div class="wb-inner"></div></div>
        <p class="caption" id="nar-caption"></p>
        <div class="player-bar">
          <button class="btn icon" data-act="prev" aria-label="Previous scene">‹</button>
          <button class="btn primary play" data-act="play" aria-label="Play">Play</button>
          <button class="btn icon" data-act="next" aria-label="Next scene">›</button>
          <div class="scrub" aria-hidden="true"><span></span></div>
          <span class="scene-count tabular"></span>
          <label class="mini">Speed
            <select id="nar-speed" aria-label="Playback speed">
              <option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option>
            </select></label>
          <label class="mini"><input type="checkbox" id="nar-cc" checked> Captions</label>
          <label class="mini" ${hasTTS() ? "" : "hidden"}><input type="checkbox" id="nar-voice" ${voice ? "checked" : ""}> Voice</label>
        </div>
      </div>`;
    const $ = (s) => root.querySelector(s);
    const inner = $(".wb-inner"), cap = $(".caption"), playBtn = $(".play"), bar = $(".scrub span"), count = $(".scene-count");

    function show() {
      const sc = scenes[i];
      inner.innerHTML = `<div class="wb-scene-title">${esc(sc.title)}</div>${sc.board}`;
      inner.classList.remove("enter"); void inner.offsetWidth; inner.classList.add("enter");
      cap.textContent = sc.say;
      cap.hidden = !captions;
      bar.style.width = `${((i + 1) / scenes.length) * 100}%`;
      count.textContent = `${i + 1} / ${scenes.length}`;
    }
    function stopAudio() { clearTimeout(timer); if (hasTTS()) window.speechSynthesis.cancel(); }
    function advance() { if (i < scenes.length - 1) { i++; show(); speak(); } else { playing = false; playBtn.textContent = "Replay"; } }
    function speak() {
      stopAudio();
      if (!playing) return;
      const text = scenes[i].say;
      if (voice && hasTTS()) {
        const u = new SpeechSynthesisUtterance(spoken(text));
        u.rate = speed;
        u.onend = () => { if (playing) timer = setTimeout(advance, 600 / speed); };
        u.onerror = () => { if (playing) timer = setTimeout(advance, readTime(text)); };
        window.speechSynthesis.speak(u);
      } else timer = setTimeout(advance, readTime(text));
    }
    const readTime = (text) => Math.max(2500, text.split(/\s+/).length * 330) / speed;

    root.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act) return;
      if (act === "play") {
        if (playBtn.textContent === "Replay") { i = 0; show(); }
        playing = !playing;
        playBtn.textContent = playing ? "Pause" : "Play";
        playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
        playing ? speak() : stopAudio();
      }
      if (act === "prev" && i > 0) { i--; show(); speak(); }
      if (act === "next" && i < scenes.length - 1) { i++; show(); speak(); }
    });
    $("#nar-speed").addEventListener("change", (e) => { speed = +e.target.value; if (playing) speak(); });
    $("#nar-cc").addEventListener("change", (e) => { captions = e.target.checked; cap.hidden = !captions; });
    const vb = $("#nar-voice"); if (vb) vb.addEventListener("change", (e) => { voice = e.target.checked; if (playing) speak(); });
    show();
    return { destroy() { playing = false; stopAudio(); } };
  }

  SW.narrator = { scenesFor, mount };
})(window.StepWise = window.StepWise || {});
