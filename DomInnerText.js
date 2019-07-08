const local = this;
const doms = new Map();
const watcher = function() {
  parseDomExecutes(qs("p")).forEach(dom => dom.update());
};

// DOM 的 textContent 解析器
// ==========================

// 解析文本格式
function parseExecuteMatch(textContent) {
  return textContent.match(/{{[\s\w.'"]*}}/g);
}

function qs(el) {
  return document.querySelectorAll(el);
}

function ParseExecuteToObj(el, executable) {
  const parse = function() {
    const value = { texts: [], variates: [] };
    executable.forEach(exe => {
      value.texts.push(exe);
      value.variates.push(exe.replace(/{{\s+(\w.*)\s+}}/, "$1").split("."));
    });
    return value;
  };
  const values = function() {
    return this.parse()
      .variates.map(v => getScopeValue(local, v))
      .map(v => (v === undefined ? "" : v));
  };
  const update = function() {
    const { texts } = this.parse();
    const values = this.values();
    el.innerText = replaceTextContent(this.premier, texts, values);
  };
  const trigger = {
    el,
    parse,
    values,
    update,
    premier: el.textContent
  };
  return trigger;
}

function parseDomExecutes(els) {
  let result = [];
  els.forEach(el => {
    if (doms.get(el)) {
      result.push(doms.get(el));
    } else {
      const executable = parseExecuteMatch(el.textContent);
      if (executable) {
        const trigger = new ParseExecuteToObj(el, executable);
        doms.set(el, trigger);
        result.push(trigger);
      }
    }
  });
  return result;
}

function getScopeValue(scope, variates) {
  let arr = [...variates];
  while (arr.length > 0 && typeof scope === "object") {
    scope = scope[arr.splice(0, 1)];
  }
  return scope;
}

// 替换文本中的内容
function replaceTextContent(textContent, targets, values) {
  targets.forEach((s, i) => {
    textContent = textContent.replace(s, values[i].toString());
  });
  return textContent;
}

// 监听功能
// ===============================

function Observer(data, key, value) {
  function getter() {
    return value;
  }
  function setter(v) {
    value = v;
    watcher();
  }
  return Object.defineProperty(data, key, {
    get() {
      return getter();
    },
    set(v) {
      setter(v);
    }
  });
}

// Vue 的 $data 实例
// =========================

// 遍历数据监听
function defineProperty(data) {
  Object.keys(data).forEach(k => {
    if (typeof data[k] === "object") {
      defineProperty(data[k]);
    }
    Observer(data, k, data[k]);
  });
  return data;
}

// React 的 HOOK 简单原理
// ===========================

const UseState = function(v, k) {
  this[k] = v;
  if (typeof v !== "object") {
    this.valueOf = () => this[k];
    this.toString = () => this[k];
  }
};

// 创建一个独立数据
function useState(value) {
  const key = Math.random().toString();
  const data = new UseState(value, key);

  Observer(data, key, data[key]);

  const set = function(value) {
    data[key] = value;
    return value;
  };

  // 返回值，和修改函数
  return [
    data,
    function(v) {
      return set(v);
    }
  ];
}
