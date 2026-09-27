const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");

const OUT = process.argv[2] || "deck.pptx";

// Palette: graphite (dominant), copper (accent, like on-chip interconnect), slate, teal for "governed"
const C = {
  dark: "1B2229",
  dark2: "27303A",
  copper: "C46A2B",
  copperLight: "F6E6DA",
  slate: "5A6672",
  muted: "8A96A3",
  tint: "EEF1F4",
  line: "D5DBE1",
  white: "FFFFFF",
  ink: "1B2229",
  teal: "2F7F7A",
  tealLight: "DDEFEC",
  red: "A63D32",
  redLight: "F6E1DE",
};
const HEAD = "Calibri";
const BODY = "Calibri";

async function icon(Comp, color = "FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Addressing the risks associated with the global semiconductor supply chain";
const W = 13.333;
const MX = 0.6;

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: MX, y: 0.45, w: W - 2 * MX, h: 1.0,
    fontFace: HEAD, fontSize: opts.size || 34, bold: true,
    color: opts.color || C.ink, valign: "top", margin: 0, isTextBox: true,
  });
}
function kicker(slide, text, color = C.copper) {
  slide.addText(text.toUpperCase(), {
    x: MX, y: 0.2, w: 8, h: 0.3, fontFace: BODY, fontSize: 11, bold: true,
    color, charSpacing: 2, margin: 0, isTextBox: true,
  });
}
let SLIDE_NO = 0;
function nextSlide() { const s = pres.addSlide(); s._no = ++SLIDE_NO; return s; }
const NOTES = [];
function notes(s, text, timed = true) { NOTES.push({ s, text, timed }); }
function footer(slide, n, dark = false) {
  slide.addText(`SEMICON West  |  ${slide._no}`, {
    x: W - MX - 3, y: 7.05, w: 3, h: 0.25, fontFace: BODY, fontSize: 9,
    color: dark ? C.muted : C.muted, align: "right", margin: 0, isTextBox: true,
  });
}
// Motif: icon on a copper rounded square ("die")
function die(slide, img, x, y, s = 0.6, fill = C.copper) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w: s, h: s, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08,
  });
  const p = s * 0.22;
  slide.addImage({ data: img, x: x + p, y: y + p, w: s - 2 * p, h: s - 2 * p });
}
function shadow() {
  return { type: "outer", color: "000000", blur: 6, offset: 1.5, angle: 90, opacity: 0.12 };
}

(async () => {
  const I = {
    chip: await icon(fa.FaMicrochip),
    industry: await icon(fa.FaIndustry),
    flask: await icon(fa.FaFlask),
    gears: await icon(fa.FaGears),
    boxes: await icon(fa.FaBoxesStacked),
    truck: await icon(fa.FaTruckFast),
    users: await icon(fa.FaUsers),
    pencil: await icon(fa.FaPenRuler),
    link: await icon(fa.FaLinkSlash),
    globe: await icon(fa.FaEarthAmericas),
    bolt: await icon(fa.FaBolt),
    chart: await icon(fa.FaChartLine),
    shield: await icon(fa.FaShieldHalved),
    lock: await icon(fa.FaLock),
    db: await icon(fa.FaDatabase),
    robot: await icon(fa.FaRobot),
    person: await icon(fa.FaUserCheck),
    eye: await icon(fa.FaEye),
    search: await icon(fa.FaMagnifyingGlass),
    scale: await icon(fa.FaScaleBalanced),
    play: await icon(fa.FaPlay),
    warn: await icon(fa.FaTriangleExclamation),
    check: await icon(fa.FaCircleCheck, C.teal),
    xmark: await icon(fa.FaCircleXmark, C.red),
    one: await icon(fa.FaMapLocationDot),
    two: await icon(fa.FaUserTie),
    three: await icon(fa.FaClipboardCheck),
    comments: await icon(fa.FaComments),
    fileSig: await icon(fa.FaFileSignature),
    layer: await icon(fa.FaLayerGroup),
  };

  // ---------- 1. Title ----------
  {
    const s = nextSlide();
    s.background = { color: C.dark };
    // chip grid motif on the right
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const hot = (r === 1 && c === 3) || (r === 3 && c === 1) || (r === 2 && c === 2);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x: 8.55 + c * 0.82, y: 1.3 + r * 0.82, w: 0.64, h: 0.64,
          fill: { color: hot ? C.copper : C.dark2 },
          line: { color: hot ? C.copper : "3A4552", width: 1 }, rectRadius: 0.06,
        });
      }
    }
    s.addText("SEMICON WEST", {
      x: MX, y: 1.3, w: 7.4, h: 0.35, fontFace: BODY, fontSize: 13, bold: true,
      color: C.copper, charSpacing: 3, margin: 0, isTextBox: true,
    });
    s.addText("Addressing the risks associated with the global semiconductor supply chain", {
      x: MX, y: 1.8, w: 7.5, h: 2.4, fontFace: HEAD, fontSize: 38, bold: true,
      color: C.white, valign: "top", margin: 0, isTextBox: true,
    });
    s.addText("Leveraging Data and AI Governance", {
      x: MX, y: 4.3, w: 7.4, h: 0.6, fontFace: HEAD, fontSize: 24, italic: true,
      color: "E8B48F", margin: 0, isTextBox: true,
    });
    s.addText([
      { text: "[Your Name]", options: { bold: true, color: C.white, breakLine: true } },
      { text: "[Title, Company]", options: { color: C.muted } },
    ], {
      x: MX, y: 5.6, w: 7, h: 0.8, fontFace: BODY, fontSize: 16, margin: 0, isTextBox: true,
    });
    notes(s, 
      "Good morning, everyone. I'm [your name], [your role] at [your company]. " +
      "My argument today is simple. Good data and AI governance lets you see your bills of materials in close to real time, track your single points of failure, and stay compliant as trade rules split along geopolitical lines. " +
      "I'll cover where the chain is fragile, why data alone hasn't fixed it, and what governance adds, then leave about five minutes for your questions."
    );
  }

  // ---------- 2. Hook ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Illustrative scenario");
    title(s, "One missing input can stall output downstream");
    const steps = [
      [I.bolt, "Sub-tier site goes down", "A sole-source supplier two tiers below you loses a plant"],
      [I.flask, "Material goes on allocation", "Your tier 1 learns late and rations what is left"],
      [I.industry, "Production plans get cut", "Planners scramble with lead times that no longer hold"],
      [I.users, "Customer commits slip", "The first you hear of it is a missed ship date"],
    ];
    const bw = 2.75, gap = 0.3, y = 2.0;
    steps.forEach(([img, h, d], i) => {
      const x = MX + i * (bw + gap);
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: bw, h: 3.2, fill: { color: i === 3 ? C.copperLight : C.tint }, line: { color: i === 3 ? C.copperLight : C.tint }, shadow: shadow(),
      });
      die(s, img, x + 0.3, y + 0.35, 0.7, i === 3 ? C.copper : C.dark);
      s.addText(`${i + 1}`, {
        x: x + bw - 0.8, y: y + 0.35, w: 0.5, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true,
        color: C.muted, align: "right", margin: 0, isTextBox: true,
      });
      s.addText(h, {
        x: x + 0.3, y: y + 1.3, w: bw - 0.6, h: 0.8, fontFace: HEAD, fontSize: 18, bold: true,
        color: C.ink, valign: "top", margin: 0, isTextBox: true,
      });
      s.addText(d, {
        x: x + 0.3, y: y + 2.1, w: bw - 0.6, h: 0.95, fontFace: BODY, fontSize: 14,
        color: C.slate, valign: "top", margin: 0, isTextBox: true,
      });
      if (i < 3) {
        s.addShape(pres.shapes.CHEVRON, {
          x: x + bw + 0.07, y: y + 1.45, w: 0.16, h: 0.3, fill: { color: C.copper }, line: { color: C.copper },
        });
      }
    });
    s.addText("The failure starts where most of us have the least visibility.", {
      x: MX, y: 5.75, w: W - 2 * MX, h: 0.5, fontFace: HEAD, fontSize: 18, italic: true,
      color: C.copper, margin: 0, isTextBox: true,
    });
    footer(s);
    notes(s, 
      "Picture a supplier two tiers below you. You don't have a contract with them, and you may not know their name. " +
      "Their plant goes down. Your tier 1 supplier finds out days later and puts the material on allocation. " +
      "By the time it reaches your planners, the lead times in the system are already wrong, and the first signal many of us get is a customer ship date we're about to miss. " +
      "This is an illustrative scenario, but most people in this room have lived some version of it. " +
      "[Optional: swap in a real disruption you can speak to.] " +
      "The pattern is what matters. The failure starts where we can see the least, and the delay comes from data we either don't have or don't trust. " +
      "Keep this picture in mind, because I'll come back to it near the end and show how it plays out differently."
    );
  }

  // ---------- 3. Chain ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "The risk map");
    title(s, "Specialization made the chain efficient and fragile");
    const stages = [
      [I.pencil, "Design & IP"],
      [I.flask, "Materials & gases"],
      [I.gears, "Equipment"],
      [I.chip, "Wafer fab"],
      [I.boxes, "Assembly & test"],
      [I.truck, "Customers"],
    ];
    const n = stages.length, sw = 1.75, gap = (W - 2 * MX - n * sw) / (n - 1), y = 2.3;
    // connector line
    s.addShape(pres.shapes.LINE, {
      x: MX + sw / 2, y: y + 0.55, w: (n - 1) * (sw + gap), h: 0, line: { color: C.line, width: 3 },
    });
    stages.forEach(([img, label], i) => {
      const x = MX + i * (sw + gap);
      die(s, img, x + sw / 2 - 0.55, y, 1.1, i === 3 ? C.copper : C.dark);
      s.addText(label, {
        x, y: y + 1.25, w: sw, h: 0.5, fontFace: HEAD, fontSize: 15, bold: true,
        color: C.ink, align: "center", margin: 0, isTextBox: true,
      });
    });
    // two takeaways
    const boxes = [
      ["Each step is specialized", "Few qualified sources exist for many inputs, and qualifying a new one takes months to years."],
      ["Each hand-off can cross a border", "Parts and materials often move through several countries before a finished chip ships, so trade policy, logistics, and local events all add risk."],
    ];
    boxes.forEach(([h, d], i) => {
      const x = MX + i * 6.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 4.45, w: 5.9, h: 1.9, fill: { color: C.tint }, line: { color: C.tint } });
      s.addText(h, { x: x + 0.3, y: 4.65, w: 5.3, h: 0.45, fontFace: HEAD, fontSize: 18, bold: true, color: C.ink, margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.3, y: 5.15, w: 5.3, h: 1.05, fontFace: BODY, fontSize: 15, color: C.slate, valign: "top", margin: 0, isTextBox: true });
    });
    footer(s);
    notes(s, 
      "Here's the chain at a very high level: design, materials and gases, equipment, the fab, assembly and test, and then our customers. " +
      "Over decades we've optimized each of these steps for cost and performance, and that specialization is why the industry works. " +
      "It's also why it's fragile. For a lot of inputs there are only a few qualified sources, and qualifying a new one can take months or longer. " +
      "And each hand-off can cross a border, so a single product may carry exposure to several countries' policies, ports, and local events. " +
      "Efficiency and fragility came from the same choices. " +
      "And right now, three pressures are pushing on the weakest points."
    );
  }

  // ---------- 3b. Three pressures now ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "The risk map");
    title(s, "Three pressures are tightening the chain right now");
    const cols = [
      ["90%+", "Advanced logic in one place", "Most leading-edge (sub-10 nm) logic capacity sits in Taiwan. A regional conflict or blockade would hit nearly every advanced product at once.", "Source: Synergy (2025)"],
      ["Ga · Ge", "Materials as trade leverage", "China is the dominant supplier of gallium, germanium, and many rare earths, and has restricted their export in response to trade measures.", "Sources: Exiger; Wiley Online Library"],
      ["HBM", "AI demand absorbs capacity", "Demand for high-bandwidth memory and AI hardware has stretched lead times and strained sub-10 nm fab capacity.", "Source: Altium"],
    ];
    const cw = 3.85, gx = 0.3, y = 1.8, ch = 4.2;
    cols.forEach(([big, h, d, src], i) => {
      const x = MX + i * (cw + gx);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: ch, fill: { color: i === 0 ? C.dark : C.tint }, line: { color: i === 0 ? C.dark : C.tint } });
      s.addText(big, { x: x + 0.35, y: y + 0.3, w: cw - 0.7, h: 1.1, fontFace: HEAD, fontSize: 54, bold: true, color: C.copper, valign: "middle", margin: 0, isTextBox: true });
      s.addText(h, { x: x + 0.35, y: y + 1.5, w: cw - 0.7, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: i === 0 ? C.white : C.ink, margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.35, y: y + 2.05, w: cw - 0.7, h: 1.55, fontFace: BODY, fontSize: 14, color: i === 0 ? "D5DBE1" : C.slate, valign: "top", margin: 0, isTextBox: true });
      s.addText(src, { x: x + 0.35, y: y + ch - 0.5, w: cw - 0.7, h: 0.3, fontFace: BODY, fontSize: 10, italic: true, color: C.muted, margin: 0, isTextBox: true });
    });
    s.addText("Each one lands on a node most companies can't see well today.", {
      x: MX, y: 6.3, w: W - 2 * MX, h: 0.45, fontFace: HEAD, fontSize: 16, italic: true, color: C.copper, margin: 0, isTextBox: true,
    });
    footer(s);
    notes(s,
      "Three pressures make this urgent now. " +
      "First, concentration. By the most widely cited estimates, more than 90 percent of the most advanced logic capacity, below 10 nanometers, is in Taiwan. " +
      "So a regional conflict or blockade wouldn't hit one product line. It would hit nearly all of them at once. " +
      "Second, materials. China is the dominant supplier of gallium, germanium, and many rare earths, and it has restricted exports of them in response to trade measures. " +
      "These are small-volume inputs that most of us have never had to trace. " +
      "Third, AI demand. The rush for high-bandwidth memory and AI hardware is stretching lead times and leading-edge capacity, which leaves less slack for everyone else. " +
      "Each of these lands on a node most companies can't see well today."
    );
  }

  // ---------- 4. Risk grid ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "The risk map");
    title(s, "Six kinds of risk tend to hit the same few nodes");
    const risks = [
      [I.warn, "Concentration", "Sole- and single-source inputs, and sites that serve many products at once"],
      [I.globe, "Geopolitics & trade", "Export controls, entity lists, tariffs, and shifting rules of origin"],
      [I.bolt, "Natural hazards & utilities", "Earthquakes, storms, drought, and power or water outages at key sites"],
      [I.truck, "Logistics", "Port, air freight, and customs delays for time-critical materials"],
      [I.chart, "Demand swings", "Forecast whiplash that turns into over-ordering, then shortages"],
      [I.lock, "Cyber & IP", "Attacks on suppliers and leaks of sensitive design or process data"],
    ];
    const cw = 3.85, ch = 2.1, gx = 0.3, gy = 0.3, y0 = 1.8;
    risks.forEach(([img, h, d], i) => {
      const r = Math.floor(i / 3), c = i % 3;
      const x = MX + c * (cw + gx), y = y0 + r * (ch + gy);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: ch, fill: { color: i === 0 ? C.copperLight : C.tint }, line: { color: i === 0 ? C.copperLight : C.tint } });
      die(s, img, x + 0.3, y + 0.3, 0.6, i === 0 ? C.copper : C.dark);
      s.addText(h, { x: x + 1.1, y: y + 0.3, w: cw - 1.3, h: 0.6, fontFace: HEAD, fontSize: 18, bold: true, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.3, y: y + 1.05, w: cw - 0.6, h: 0.9, fontFace: BODY, fontSize: 14, color: C.slate, valign: "top", margin: 0, isTextBox: true });
    });
    s.addText("When several of these overlap at one node, that node is where to look first.", {
      x: MX, y: 6.55, w: W - 2 * MX, h: 0.4, fontFace: HEAD, fontSize: 16, italic: true, color: C.copper, margin: 0, isTextBox: true,
    });
    footer(s);
    notes(s, 
      "When I map risk, I group it into six types. " +
      "Concentration comes first, because it multiplies everything else: sole-source inputs, or one site that feeds many of your products. " +
      "Then geopolitics and trade, which covers export controls, entity lists, and tariffs. " +
      "Natural hazards and utilities, meaning earthquakes, storms, drought, and power or water at key sites. " +
      "Logistics delays for time-critical materials. " +
      "Demand swings, where forecast whiplash turns into over-ordering and then shortages. " +
      "And cyber and IP risk, both attacks on suppliers and leaks of the very data we'd need to share to manage the rest. " +
      "None of these is new. What matters is that they tend to pile up on the same few nodes. " +
      "A sole-source supplier in a region with trade exposure and seismic risk is a very different problem from any one of those alone. " +
      "So the practical question is how we find those nodes before they find us.  Usually each of these has a different owner, so nobody sees the overlap."
    );
  }

  // ---------- 5. Tier visibility ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "The risk map");
    title(s, "Most exposure sits below tier 1, where visibility drops off");
    const tiers = [
      ["Tier 1", "Direct suppliers", "Contracts, POs, scorecards, regular reviews", "Good visibility", C.dark, 11.9],
      ["Tier 2", "Their suppliers", "What tier 1 chooses to disclose, often partial", "Partial visibility", C.slate, 9.6],
      ["Tier 3+", "Raw materials, gases, sub-components", "Little or no direct data. Often where sole sources hide", "Mostly dark", C.copper, 7.3],
    ];
    tiers.forEach(([t, who, what, vis, col, w], i) => {
      const y = 1.9 + i * 1.5;
      const x = MX + (11.9 - w) / 2 + 0.2;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 1.25, fill: { color: col }, line: { color: col } });
      s.addText(t, { x: x + 0.3, y, w: 1.4, h: 1.25, fontFace: HEAD, fontSize: 22, bold: true, color: C.white, valign: "middle", margin: 0, isTextBox: true });
      s.addText([
        { text: who, options: { bold: true, breakLine: true } },
        { text: what, options: {} },
      ], { x: x + 1.8, y, w: w - 4.1, h: 1.25, fontFace: BODY, fontSize: 14, color: C.white, valign: "middle", margin: 0, isTextBox: true });
      s.addText(vis, { x: x + w - 2.2, y, w: 2.0, h: 1.25, fontFace: HEAD, fontSize: 15, italic: true, color: C.white, align: "right", valign: "middle", margin: 0, isTextBox: true });
    });
    s.addText("You can't govern data you never collect. The first job is deciding which sub-tier nodes you need to see.", {
      x: MX, y: 6.4, w: W - 2 * MX, h: 0.5, fontFace: HEAD, fontSize: 16, italic: true, color: C.copper, margin: 0, isTextBox: true,
    });
    footer(s);
    notes(s, 
      "Here's the uncomfortable part. We manage tier 1 well: contracts, purchase orders, scorecards, quarterly reviews. " +
      "Tier 2 is whatever tier 1 chooses to tell us, and it's usually partial. " +
      "Tier 3 and below, the raw materials, specialty gases, and sub-components, is mostly dark. And that's often exactly where the sole sources are. " +
      "You don't need to map the whole tree. You need to decide which sub-tier nodes sit under your most critical parts, and then go get that data on purpose. " +
      "That's a scoping decision before it's a technology decision. Start with the parts where a shortage would stop a line or break a customer commitment, and work down from there. " +
      "A short, accurate map beats a complete one that nobody maintains. " +
      "Which brings me to data."
    );
  }

  // ---------- 6. Data silos ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Why data is the gap");
    title(s, "Risk data exists, but it's scattered across systems");
    const silos = [
      [I.db, "ERP / MRP"],
      [I.users, "Supplier portals"],
      [I.truck, "Logistics feeds"],
      [I.chip, "MES & quality"],
      [I.globe, "News & trade data"],
    ];
    silos.forEach(([img, label], i) => {
      const x = MX, y = 1.85 + i * 0.95;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.3, h: 0.75, fill: { color: C.tint }, line: { color: C.tint } });
      die(s, img, x + 0.15, y + 0.12, 0.5, C.dark);
      s.addText(label, { x: x + 0.85, y, w: 3.3, h: 0.75, fontFace: HEAD, fontSize: 16, bold: true, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
    });
    die(s, I.link, 5.25, 3.6, 0.8, C.copper);
    const issues = [
      ["Different IDs for the same thing", "Part numbers, supplier codes, and site names don't match across systems."],
      ["No lineage", "Nobody can say where a lead time or risk score came from, or when it was last true."],
      ["Stale master data", "Planned lead times and approved sources drift from reality between reviews."],
      ["No terms for sharing", "Partners hold back data because use, access, and retention were never agreed."],
    ];
    issues.forEach(([h, d], i) => {
      const y = 1.85 + i * 1.18;
      s.addText(h, { x: 6.55, y, w: 6.2, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: C.ink, margin: 0, isTextBox: true });
      s.addText(d, { x: 6.55, y: y + 0.4, w: 6.2, h: 0.62, fontFace: BODY, fontSize: 14, color: C.slate, valign: "top", margin: 0, isTextBox: true });
    });
    footer(s);
    notes(s, 
      "When I talk to supply chain teams, the problem is rarely a total lack of data. " +
      "It sits in ERP and MRP, supplier portals, logistics feeds, MES and quality systems, and outside sources like news and trade data. " +
      "The trouble is joining it up. The same part or supplier has different IDs in different systems. " +
      "Nobody can say where a lead time came from or when it was last accurate. " +
      "Master data like planned lead times and approved sources drifts away from reality between reviews. " +
      "And partners hold back, because nobody ever agreed how shared data would be used, who could see it, or how long it would be kept. " +
      "Every one of those is a governance problem more than a technology problem. " +
      "Buying another tool won't fix mismatched IDs or missing agreements. Someone has to decide which ID is the master, who owns it, and what we promise partners about their data."
    );
  }

  // ---------- 7. AI on ungoverned data ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Why data is the gap");
    title(s, "AI on ungoverned data scales the error, not the insight");
    const cols = [
      ["Without governance", C.red, C.redLight, I.xmark, [
        "Risk scores built on mismatched part and supplier IDs",
        "A clean dashboard hides stale lead times",
        "No one can explain why a supplier was flagged",
        "Planners stop trusting it and go back to spreadsheets",
      ]],
      ["With governance", C.teal, C.tealLight, I.check, [
        "Scores trace back to named, quality-checked sources",
        "Input confidence is shown next to every output",
        "Models are validated against past disruptions",
        "A named person owns each decision the model informs",
      ]],
    ];
    cols.forEach(([h, col, bg, img, items], i) => {
      const x = MX + i * 6.2, w = 5.9;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.85, w, h: 4.25, fill: { color: bg }, line: { color: bg } });
      s.addText(h, { x: x + 0.35, y: 2.05, w: w - 0.7, h: 0.55, fontFace: HEAD, fontSize: 22, bold: true, color: col, margin: 0, isTextBox: true });
      items.forEach((t, j) => {
        const y = 2.85 + j * 0.88;
        s.addImage({ data: img, x: x + 0.35, y: y + 0.06, w: 0.34, h: 0.34 });
        s.addText(t, { x: x + 0.9, y, w: w - 1.2, h: 0.75, fontFace: BODY, fontSize: 15, color: C.ink, valign: "top", margin: 0, isTextBox: true });
      });
    });
    footer(s);
    notes(s, 
      "This is why I worry about adding AI too early. " +
      "If you train a risk model on mismatched IDs and stale lead times, you don't get insight. You get the same errors, faster, on a nicer dashboard. " +
      "And when nobody can explain why a supplier was flagged, planners quietly go back to their spreadsheets. " +
      "With governance, every score traces back to named sources, you can see how confident the inputs are, the model has been tested against disruptions you've already lived through, and a named person owns the decision. " +
      "That's the difference between a tool people use and one they work around. " +
      "So the order matters. Fix the data and the decision rights first, then scale the AI."
    );
  }

  // ---------- 8. Governance layers ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Governance as the lever");
    title(s, "Four layers turn risk data into decisions you can defend");
    const layers = [
      [I.person, "Human oversight", "Decision rights, escalation paths, and a named owner for every action the data or model informs"],
      [I.robot, "AI model risk", "Validation against known events, drift monitoring, explainable outputs, and logged prompts for generative tools"],
      [I.lock, "Access & sharing", "Least-privilege access, data-use agreements with suppliers, and audit trails on sensitive maps"],
      [I.db, "Data foundation", "Common part and supplier IDs, lineage, quality checks, and an owner for each critical record"],
    ];
    layers.forEach(([img, h, d], i) => {
      const y = 1.8 + i * 1.18;
      const indent = (3 - i) * 0.0;
      const col = i === 3 ? C.copper : C.dark;
      s.addShape(pres.shapes.RECTANGLE, { x: MX + indent, y, w: 12.1, h: 1.02, fill: { color: i === 3 ? C.copperLight : C.tint }, line: { color: i === 3 ? C.copperLight : C.tint } });
      die(s, img, MX + 0.25, y + 0.2, 0.62, col);
      s.addText(h, { x: MX + 1.1, y, w: 3.1, h: 1.02, fontFace: HEAD, fontSize: 19, bold: true, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
      s.addText(d, { x: MX + 4.3, y, w: 7.6, h: 1.02, fontFace: BODY, fontSize: 15, color: C.slate, valign: "middle", margin: 0, isTextBox: true });
    });
    s.addText("Build from the bottom up. Each layer depends on the one below it.", {
      x: MX, y: 6.6, w: W - 2 * MX, h: 0.4, fontFace: HEAD, fontSize: 16, italic: true, color: C.copper, margin: 0, isTextBox: true,
    });
    footer(s);
    notes(s, 
      "So what do I mean by data and AI governance? I think of it as four layers, and you build from the bottom. " +
      "The data foundation is common IDs for parts and suppliers, lineage so you know where a number came from, quality checks on the fields that drive risk decisions, and an owner for each critical record. " +
      "On top of that, access and sharing: least-privilege access, data-use agreements with suppliers, and audit trails, because a map of your sole sources is sensitive data in its own right. " +
      "Then AI model risk: validate models against events you've already lived through, monitor for drift, make outputs explainable, and log prompts and outputs for generative tools. " +
      "And at the top, human oversight. Who decides, who gets escalated to, and who owns each action. " +
      "If you skip a layer, the ones above it don't hold. " +
      "Most teams want to start at the AI layer because that's where the excitement is. The work that pays off first is usually at the bottom, in the master data."
    );
  }

  // ---------- 9. Risk to control table ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Governance as the lever");
    title(s, "Map each control to the risk it reduces, and measure it");
    const hdr = { bold: true, color: C.white, fill: { color: C.dark }, fontFace: HEAD, fontSize: 15, valign: "middle" };
    const cell = (t, shade, extra = {}) => ({ text: t, options: { fontFace: BODY, fontSize: 13.5, color: C.ink, fill: { color: shade ? C.tint : C.white }, valign: "middle", ...extra } });
    const rows = [
      ["Single points of failure", "AI-assisted multi-tier BOM mapping down to raw materials, with an owner per critical part", "Share of critical parts traced to raw material"],
      ["Export controls and sanctions", "Automated screening of items, parties, and end uses against current control lists", "Hours from rule change to exposure report"],
      ["Allocation crunch (HBM, advanced nodes)", "ML monitoring of lead-time and capacity signals at known choke points", "Weeks of warning before allocation hits"],
      ["AI misranks a risk", "Validation on past disruptions, drift monitoring", "Planner override rate, and why"],
      ["Suppliers won't share", "Data-use agreements, least-privilege access, audit logs", "Critical suppliers sharing sub-tier data"],
    ];
    const data = [[
      { text: "Risk", options: hdr },
      { text: "Governance control", options: hdr },
      { text: "Evidence it works", options: hdr },
    ]];
    rows.forEach((r, i) => data.push([
      cell(r[0], i % 2 === 1, { bold: true }),
      cell(r[1], i % 2 === 1),
      cell(r[2], i % 2 === 1, { color: C.copper, bold: true }),
    ]));
    s.addTable(data, {
      x: MX, y: 1.75, w: 12.1, colW: [3.3, 5.0, 3.8], rowH: [0.55, 0.85, 0.85, 0.85, 0.85, 0.85],
      border: { type: "solid", pt: 0.75, color: C.line }, margin: [0.08, 0.15, 0.08, 0.15],
    });
    footer(s);
    notes(s, 
      "Governance only earns its keep if you can tie each control to a risk it reduces and a number that shows it's working. " +
      "For single points of failure, AI tools can now parse a product into a multi-tier bill of materials and trace components down to raw materials. Governance adds an owner for each critical part, and the measure is how many of those parts you can actually trace. " +
      "For export controls and sanctions, the control is automated screening of items, parties, and end uses against current lists. The measure is how many hours it takes to go from a rule change to a report of what's affected. " +
      "For an allocation crunch like the one in HBM, machine learning can watch lead-time and capacity signals at known choke points. The measure is how many weeks of warning you get. " +
      "For AI, validate against past disruptions and monitor drift, then watch how often planners override the model and why. " +
      "And for suppliers who won't share, data-use agreements and audit logs, measured by how many critical suppliers actually share sub-tier data. " +
      "[Swap in any metric your organization already tracks.]"
    );
  }

  // ---------- 10. Frameworks ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Governance as the lever");
    title(s, "Use an established framework rather than inventing one");
    s.addText("NIST AI Risk Management Framework: four functions", {
      x: MX, y: 1.7, w: 8, h: 0.45, fontFace: HEAD, fontSize: 18, bold: true, color: C.ink, margin: 0, isTextBox: true,
    });
    const fns = [
      [I.scale, "Govern", "Policies, roles, and accountability across the AI lifecycle"],
      [I.one, "Map", "Context: where the model is used and what it could affect"],
      [I.chart, "Measure", "Test, evaluate, and track the risks you mapped"],
      [I.shield, "Manage", "Prioritize and act on those risks, and keep monitoring"],
    ];
    fns.forEach(([img, h, d], i) => {
      const x = MX + i * 2.05, y = 2.35;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.85, h: 3.2, fill: { color: i === 0 ? C.copperLight : C.tint }, line: { color: i === 0 ? C.copperLight : C.tint } });
      die(s, img, x + 0.2, y + 0.25, 0.62, i === 0 ? C.copper : C.dark);
      s.addText(h, { x: x + 0.2, y: y + 1.0, w: 1.5, h: 0.45, fontFace: HEAD, fontSize: 18, bold: true, color: C.ink, margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.2, y: y + 1.5, w: 1.5, h: 1.6, fontFace: BODY, fontSize: 13, color: C.slate, valign: "top", margin: 0, isTextBox: true });
    });
    // ISO panel
    const px = 9.0, pw = W - MX - px;
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.7, w: pw, h: 3.85, fill: { color: C.dark }, line: { color: C.dark } });
    die(s, I.fileSig, px + 0.3, 1.95, 0.62, C.copper);
    s.addText("ISO/IEC 42001", { x: px + 0.3, y: 2.75, w: pw - 0.6, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: C.white, margin: 0, isTextBox: true });
    s.addText("A certifiable AI management system standard. Useful when customers or regulators ask for proof, not just a policy.", {
      x: px + 0.3, y: 3.25, w: pw - 0.6, h: 2.1, fontFace: BODY, fontSize: 14, color: "D5DBE1", valign: "top", margin: 0, isTextBox: true,
    });
    s.addText("Common pattern: design the practice with NIST, certify it with ISO. Pick one and apply it to a real use case first.", {
      x: MX, y: 5.85, w: W - 2 * MX, h: 0.7, fontFace: HEAD, fontSize: 16, italic: true, color: C.copper, margin: 0, isTextBox: true,
    });
    footer(s);
    notes(s, 
      "You don't need to invent a governance model. Two are worth knowing. " +
      "The NIST AI Risk Management Framework is voluntary and practical. It has four functions: Govern, Map, Measure, and Manage. " +
      "Govern sets policies and accountability. Map is understanding where a model is used and what it could affect. Measure is testing and tracking those risks, and Manage is acting on them and continuing to monitor. " +
      "ISO/IEC 42001 is a certifiable management system standard for AI, which matters when customers or regulators want proof rather than a policy document. " +
      "A pattern I see often is to design the practice with NIST and certify it with ISO. " +
      "Either way, the worst outcome is a framework on a shelf. Apply it to one real use case first. [Mention the framework your organization uses, if any.] " +
      "A supplier risk score is a good candidate, because it touches every layer we just talked about and the people using it will tell you quickly whether it helps."
    );
  }

  // ---------- 11. Example ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Example  |  Illustrative, replace with your case");
    title(s, "Governed data turns a scramble into a same-day decision");
    const steps = [
      [I.search, "Detect", "An external signal flags an outage at a specialty gas supplier. The model scores it high because the site is a sole source."],
      [I.layer, "Assess", "The governed sub-tier map shows which parts, products, and customers depend on that site, with confidence on each link."],
      [I.person, "Decide", "The part owner reviews the evidence, confirms exposure with tier 1, and approves an allocation plan."],
      [I.play, "Act", "Buyers start alternate-source qualification and account teams warn affected customers early."],
    ];
    const bw = 2.85, gap = 0.2, y = 1.95;
    steps.forEach(([img, h, d], i) => {
      const x = MX + i * (bw + gap);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: bw, h: 3.3, fill: { color: C.tint }, line: { color: C.tint }, shadow: shadow() });
      die(s, img, x + 0.3, y + 0.3, 0.7, i === 2 ? C.copper : C.dark);
      s.addText(`Step ${i + 1}`, { x: x + 1.15, y: y + 0.3, w: 1.5, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: C.muted, margin: 0, isTextBox: true });
      s.addText(h, { x: x + 1.15, y: y + 0.58, w: 1.6, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.3, y: y + 1.3, w: bw - 0.6, h: 2.45, fontFace: BODY, fontSize: 14, color: C.slate, valign: "top", margin: 0, isTextBox: true });
    });
    s.addText("The human decision stays in the loop. Governance makes it faster, not optional.", {
      x: MX, y: 5.6, w: W - 2 * MX, h: 0.45, fontFace: HEAD, fontSize: 16, italic: true, color: C.copper, margin: 0, isTextBox: true,
    });
    footer(s);
    notes(s, 
      "[Replace this with your own case if you can share one. If you keep it, say that it's illustrative.] " +
      "Let me walk through what this looks like when it works. This is an illustrative example. " +
      "An outside signal flags an outage at a specialty gas supplier. The model ranks it high, and it can say why: that site is a sole source for material we use. " +
      "Because the sub-tier map is governed, with common IDs, lineage, and an owner, we can see within hours which parts, products, and customers depend on that site, and how confident we are in each link. " +
      "Then a person decides. The part owner looks at the evidence, confirms exposure with the tier 1 supplier, and approves an allocation plan. " +
      "From there buyers start qualifying an alternate source, and account teams tell affected customers early instead of at the missed ship date. " +
      "Notice what didn't change. A human still makes the call. Governance made that call faster and easier to defend. " +
      "Compare that with the scenario I opened with, where the first signal was the missed ship date."
    );
  }

  // ---------- 12. Takeaways ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Takeaways");
    title(s, "Three things you can start next quarter");
    const items = [
      [I.one, "Map your riskiest input", "Pick one sole- or single-source material and trace it as far down the tiers as you can."],
      [I.two, "Give every critical record an owner", "Name who keeps each critical part and supplier record accurate, and agree data-use terms with your key suppliers."],
      [I.three, "Put AI behind validation and a person", "Test any risk model against past disruptions, and keep a named human decision point for actions it informs."],
    ];
    items.forEach(([img, h, d], i) => {
      const y = 1.85 + i * 1.6;
      s.addText(`${i + 1}`, { x: MX, y, w: 0.8, h: 1.3, fontFace: HEAD, fontSize: 54, bold: true, color: C.copper, valign: "middle", margin: 0, isTextBox: true });
      s.addShape(pres.shapes.RECTANGLE, { x: MX + 0.95, y, w: 11.15, h: 1.3, fill: { color: C.tint }, line: { color: C.tint } });
      die(s, img, MX + 1.2, y + 0.33, 0.64, C.dark);
      s.addText(h, { x: MX + 2.1, y: y + 0.15, w: 9.7, h: 0.45, fontFace: HEAD, fontSize: 19, bold: true, color: C.ink, margin: 0, isTextBox: true });
      s.addText(d, { x: MX + 2.1, y: y + 0.6, w: 9.7, h: 0.6, fontFace: BODY, fontSize: 15, color: C.slate, valign: "top", margin: 0, isTextBox: true });
    });
    footer(s);
    notes(s, 
      "If you take three things back, make them these. " +
      "First, pick your single riskiest input, one sole- or single-source material, and trace it as far down the tiers as you can. It's small enough to finish in a quarter, and it will show you exactly where your data gaps are. " +
      "Second, give every critical part and supplier record an owner, and agree on data-use terms with your key suppliers so they have a reason to share. " +
      "Third, before you trust an AI risk score, test it against disruptions you've already lived through, and keep a named person in the decision. " +
      "None of these needs a new budget line to start. They need someone with the authority to say this data matters and this person owns it."
    );
  }

  // ---------- 13. Close / Q&A ----------
  {
    const s = nextSlide();
    s.background = { color: C.dark };
    die(s, I.comments, MX, 1.4, 1.0, C.copper);
    s.addText("Questions", {
      x: MX, y: 2.65, w: 8, h: 1.1, fontFace: HEAD, fontSize: 54, bold: true, color: C.white, margin: 0, isTextBox: true,
    });
    s.addText("See your risk sooner. Act on it with data you can defend.", {
      x: MX, y: 3.85, w: 9, h: 0.6, fontFace: HEAD, fontSize: 22, italic: true, color: "E8B48F", margin: 0, isTextBox: true,
    });
    s.addText([
      { text: "[Your Name]", options: { bold: true, color: C.white, breakLine: true } },
      { text: "[email or LinkedIn URL]", options: { color: C.muted } },
    ], { x: MX, y: 5.3, w: 7, h: 0.8, fontFace: BODY, fontSize: 16, margin: 0, isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 10.2, y: 4.6, w: 2.5, h: 2.1, fill: { color: C.dark2 }, line: { color: "3A4552", width: 1, dashType: "dash" }, rectRadius: 0.08,
    });
    s.addText("[QR code]", { x: 10.2, y: 4.6, w: 2.5, h: 2.1, fontFace: BODY, fontSize: 14, color: C.muted, align: "center", valign: "middle", margin: 0, isTextBox: true });
    notes(s, 
      "The goal is simple: see your risk sooner, and act on it with data you can defend. " +
      "Our industry is very good at controlling variation inside the fab. I think we can bring that same discipline to the data about our supply chain. " +
      "Thank you. I'm happy to take questions. [See qa-prep.md for prepared answers. If time runs out, point people to the QR code.]"
    );
  }


  // ---------- Appendix: sources ----------
  {
    const s = nextSlide();
    s.background = { color: C.white };
    kicker(s, "Appendix");
    title(s, "Sources");
    const src = [
      ["Synergy (2025). Strengthening the global semiconductor supply chain: challenges and opportunities in 2025.", "https://synergy-inc.com/blogs/strengthening-the-global-semiconductor-supply-chain-challenges-and-opportunities-in-2025-2"],
      ["Video on semiconductor concentration (YouTube).", "https://www.youtube.com/watch?v=L89vznHYGdQ"],
      ["Exiger. Chip challenges: semiconductors and supply chain risks.", "https://www.exiger.com/perspectives/chip-challenges-semiconductors-and-supply-chain-risks/"],
      ["Wiley Online Library, article app5.70046.", "https://onlinelibrary.wiley.com/doi/full/10.1002/app5.70046"],
      ["Altium. Supply chain resilience, AI demand, and the semiconductor shortage.", "https://resources.altium.com/p/supply-chain-resilience-ai-demand-semiconductor-shortage"],
      ["Fox Business video on AI-driven supply chain mapping.", "https://www.foxbusiness.com/video/6394872288112"],
      ["NIST AI Risk Management Framework.", "https://www.nist.gov/itl/ai-risk-management-framework"],
      ["ISO/IEC 42001: AI management systems.", "https://www.iso.org/standard/81230.html"],
    ];
    const runs = [];
    src.forEach(([t, url], i) => {
      runs.push({ text: t + " ", options: { color: C.ink } });
      runs.push({ text: url, options: { color: C.teal, hyperlink: { url }, breakLine: i < src.length - 1 } });
    });
    s.addText(runs, { x: MX, y: 1.7, w: W - 2 * MX, h: 5.0, fontFace: BODY, fontSize: 12, valign: "top", paraSpaceAfter: 8, margin: 0, isTextBox: true });
    footer(s);
    notes(s, "Appendix. Not presented; keep it for reference and when sharing the deck.", false);
  }

  const fmt = (sec) => { sec = Math.round(sec / 5) * 5; return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; };
  const timed = NOTES.filter((n) => n.timed);
  let cum = 0;
  timed.forEach((n, i) => {
    const words = n.text.replace(/\[[^\]]*\]/g, " ").split(/\s+/).filter(Boolean).length;
    const start = cum;
    cum += (words / 130) * 60;
    const end = i === timed.length - 1 ? ", buffer to 15:00, then Q&A to 20:00" : "";
    n.s.addNotes(`[${fmt(start)} to ${fmt(cum)}${end}] ${n.text}`);
    console.log(`slide ${n.s._no}: ${words} words, ends ${fmt(cum)}`);
  });
  NOTES.filter((n) => !n.timed).forEach((n) => n.s.addNotes(n.text));

  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
})();
