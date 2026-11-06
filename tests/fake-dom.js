// Minimalny atrapowy DOM — wystarczający do testów src/ui.js bez zależności.
class ClassList {
  constructor() { this.set = new Set(); }
  toggle(c, force) { const on = force ?? !this.set.has(c); on ? this.set.add(c) : this.set.delete(c); return on; }
  contains(c) { return this.set.has(c); }
  add(c) { this.set.add(c); }
  remove(c) { this.set.delete(c); }
}
export class FakeElement {
  constructor(doc, tag) {
    this.doc = doc; this.tagName = tag; this.children = []; this.attrs = {};
    this.classList = new ClassList(); this.listeners = {};
    this.hidden = false; this.disabled = false; this.textContent = '';
  }
  set id(v) { this._id = v; this.doc.ids[v] = this; }
  get id() { return this._id; }
  set className(v) { v.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c)); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  click() { if (this.disabled) return; (this.listeners.click || []).forEach(f => f()); }
  focus() { this.doc.activeElement = this; }
}
export function fakeDocument(ids) {
  const doc = { ids: {}, activeElement: null };
  doc.createElement = tag => new FakeElement(doc, tag);
  doc.getElementById = id => doc.ids[id] || null;
  const props = {};
  doc.documentElement = { style: { props, setProperty: (k, v) => (props[k] = v) } };
  ids.forEach(id => { doc.createElement('div').id = id; });
  return doc;
}
