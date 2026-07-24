const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJECT_ROOT = path.join(__dirname, "..", "..");

function loadFile(relPath) {
  const code = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
  vm.runInThisContext(code, { filename: relPath });
}

function createClassList(initial = []) {
  const set = new Set(initial);
  return {
    add: (...values) => values.forEach((value) => set.add(value)),
    remove: (...values) => values.forEach((value) => set.delete(value)),
    contains: (value) => set.has(value),
    toArray: () => [...set],
  };
}

function createMockElement(tagName = "div") {
  const listeners = Object.create(null);
  const element = {
    tagName: String(tagName).toUpperCase(),
    id: "",
    value: "",
    checked: false,
    disabled: false,
    innerText: "",
    innerHTML: "",
    textContent: "",
    title: "",
    style: {},
    dataset: {},
    className: "",
    classList: createClassList(),
    attributes: {},
    children: [],
    parentNode: null,
    parentElement: null,
    _closest: null,
    appendChild(child) {
      child.parentNode = this;
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      child.parentNode = null;
      child.parentElement = null;
      return child;
    },
    insertBefore(child, before) {
      const idx = this.children.indexOf(before);
      if (idx < 0) return this.appendChild(child);
      child.parentNode = this;
      child.parentElement = this;
      this.children.splice(idx, 0, child);
      return child;
    },
    replaceChild(newChild, oldChild) {
      const idx = this.children.indexOf(oldChild);
      if (idx >= 0) {
        newChild.parentNode = this;
        newChild.parentElement = this;
        this.children[idx] = newChild;
      }
      oldChild.parentNode = null;
      oldChild.parentElement = null;
      return oldChild;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "id") this.id = String(value);
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    addEventListener(type, handler) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(handler);
    },
    dispatchEvent(event) {
      const evt = event || { type: "" };
      if (!evt.target) evt.target = this;
      const handlers = listeners[evt.type] || [];
      handlers.forEach((handler) => handler.call(this, evt));
      return true;
    },
    focus() {},
    click() {
      this.dispatchEvent({ type: "click", target: this });
    },
    cloneNode() {
      const clone = createMockElement(this.tagName);
      clone.id = this.id;
      clone.value = this.value;
      clone.checked = this.checked;
      clone.disabled = this.disabled;
      clone.innerText = this.innerText;
      clone.innerHTML = this.innerHTML;
      clone.textContent = this.textContent;
      clone.style = { ...this.style };
      clone.dataset = { ...this.dataset };
      clone.className = this.className;
      clone.classList = createClassList(this.classList.toArray());
      clone.attributes = { ...this.attributes };
      clone._closest = this._closest;
      return clone;
    },
    querySelector(selector) {
      if (selector === "input") {
        return this.children.find((child) => child.tagName === "INPUT") || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "input") {
        return this.children.filter((child) => child.tagName === "INPUT");
      }
      return [];
    },
    closest() {
      if (!this._closest) this._closest = { style: {} };
      return this._closest;
    },
    _listeners: listeners,
  };
  return element;
}

function createMockDocument() {
  const elements = new Map();
  const selectors = new Map();
  const selectorLists = new Map();

  const document = {
    documentElement: createMockElement("html"),
    body: createMockElement("body"),
    createElement(tag) {
      return createMockElement(tag);
    },
    getElementById(id) {
      if (!elements.has(id)) {
        const el = createMockElement("div");
        el.id = id;
        elements.set(id, el);
      }
      return elements.get(id);
    },
    querySelector(selector) {
      return selectors.get(selector) || null;
    },
    querySelectorAll(selector) {
      return selectorLists.get(selector) || [];
    },
    _setElement(id, element) {
      element.id = id;
      elements.set(id, element);
      return element;
    },
    _setQuerySelector(selector, element) {
      selectors.set(selector, element);
    },
    _setQuerySelectorAll(selector, list) {
      selectorLists.set(selector, list);
    },
    _elements: elements,
  };

  return document;
}

function createStorage() {
  const store = {};
  return {
    store,
    api: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem(key, value) {
        store[key] = String(value);
      },
      removeItem(key) {
        delete store[key];
      },
      clear() {
        Object.keys(store).forEach((key) => delete store[key]);
      },
    },
  };
}

module.exports = {
  PROJECT_ROOT,
  loadFile,
  createMockElement,
  createMockDocument,
  createStorage,
};
