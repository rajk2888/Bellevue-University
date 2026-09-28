const Module = require("module");
const fs = require("fs");
const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
class Pres {
  constructor() {
    this.slides = [];
    this.shapes = new Proxy({}, { get: (t, k) => k });
    this.charts = new Proxy({}, { get: (t, k) => k });
  }
  addSlide() {
    const s = { items: [] };
    s.addText = (t, o) => s.items.push({ k: "text", t: clone(t), o: clone(o) });
    s.addShape = (type, o) => s.items.push({ k: "shape", type, o: clone(o) });
    s.addImage = (o) => s.items.push({ k: "image", o: clone(o) });
    s.addChart = (type, data, o) => s.items.push({ k: "chart", type, data: clone(data), o: clone(o) });
    s.addTable = (rows, o) => s.items.push({ k: "table", rows: clone(rows), o: clone(o) });
    s.addNotes = (t) => (s.notes = t);
    this.slides.push(s);
    return s;
  }
  async writeFile({ fileName }) {
    fs.writeFileSync(fileName, JSON.stringify(this.slides.map((s) => ({ no: s._no, items: s.items, notes: s.notes }))));
  }
}
const orig = Module._load;
Module._load = function (req, ...rest) {
  if (req === "pptxgenjs") return Pres;
  return orig.call(this, req, ...rest);
};
