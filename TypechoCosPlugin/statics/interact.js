/*
 * TypechoCosPlugin 配置面板交互
 * 架构：Shadow DOM 隔离 + CSS 属性选择器分组（data-cos-tab）+ JS 只负责状态切换
 * 分组隐藏完全由 CSS [data-cos-tab][data-cos-group] 控制，JS 不做运行时 DOM 显隐操作
 */
(function () {
  "use strict";

  var COS_CSS = [
    ":host{display:block;box-sizing:border-box;width:100%;max-width:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.6;color:#1f2329;--cos-bg:#fff;--cos-surface:#fff;--cos-surface-2:#f2f3f5;--cos-border:#d0d3d6;--cos-border-light:#e5e6eb;--cos-text:#1f2329;--cos-text-weak:#646a73;--cos-primary:#2b6fff;--cos-primary-hover:#1d5be0;--cos-success:#1f9d55;--cos-warning:#d97706;--cos-danger:#d93636;--cos-danger-hover:#b42b2b;--cos-radius:0px;--cos-shadow:0 1px 3px rgba(0,0,0,.08)}",
    ":host(:not(:root)){color-scheme:light}",
    "@media (prefers-color-scheme:dark){:host{color:#e6e8eb;--cos-bg:#16181c;--cos-surface:#1e2127;--cos-surface-2:#262a31;--cos-border:#3a3f47;--cos-border-light:#2c3037;--cos-text:#e6e8eb;--cos-text-weak:#9aa1ab;--cos-primary:#4d8bff;--cos-primary-hover:#6ba0ff;--cos-success:#3fb950;--cos-warning:#e3a008;--cos-danger:#f06d6d;--cos-danger-hover:#ff8585;--cos-shadow:0 1px 3px rgba(0,0,0,.4)}:host(:not(:root)){color-scheme:dark}}",
    "*,*::before,*::after{box-sizing:border-box}",
    "*{margin:0;padding:0}",
    ".cos-panel{display:flex;align-items:flex-start;gap:16px;background:transparent}",
    ".cos-panel__aside{position:sticky;top:16px;flex:0 0 220px;max-width:220px;background:var(--cos-surface);border:1px solid var(--cos-border);border-radius:var(--cos-radius);box-shadow:var(--cos-shadow);overflow:hidden}",
    ".cos-panel__logo{font-size:18px;font-weight:700;text-align:center;padding:18px 12px;color:var(--cos-text);border-bottom:1px solid var(--cos-border-light);letter-spacing:1px}",
    ".cos-panel__tabs{list-style:none;display:block;padding:10px}",
    ".cos-panel__tab{display:block;height:42px;line-height:42px;text-align:center;color:var(--cos-text-weak);background:transparent;border:1px solid transparent;border-radius:var(--cos-radius);cursor:pointer;user-select:none;transition:background .18s ease,color .18s ease,border-color .18s ease;margin-bottom:8px;font-size:14px}",
    ".cos-panel__tab:last-child{margin-bottom:0}",
    ".cos-panel__tab:hover{background:var(--cos-surface-2);color:var(--cos-text)}",
    ".cos-panel__tab.active{background:var(--cos-primary);color:#fff;border-color:var(--cos-primary)}",
    ".cos-panel__backup{padding:10px;border-top:1px solid var(--cos-border-light);display:flex;flex-direction:column;gap:8px}",
    ".cos-panel__backup input{width:100%;height:38px;line-height:38px;border:none;border-radius:var(--cos-radius);color:#fff;font-size:14px;cursor:pointer;background:var(--cos-primary);transition:background .18s ease,opacity .18s ease}",
    ".cos-panel__backup input:hover{opacity:.9}",
    ".cos-panel__backup input:nth-child(1){background:var(--cos-success)}",
    ".cos-panel__backup input:nth-child(2){background:var(--cos-warning)}",
    ".cos-panel__backup input:nth-child(3){background:var(--cos-danger)}",
    ".cos-panel__backup input:nth-child(3):hover{background:var(--cos-danger-hover)}",

    /* ====== 核心分组切换：由 data-cos-tab 属性驱动，纯 CSS 控制 ====== */
    /* notice 和 fieldForm 默认都显示，由 data-cos-tab 控制谁可见 */
    ".cos-panel__notice{display:none;flex:1;min-width:0;background:var(--cos-surface);border:1px solid var(--cos-border);border-radius:var(--cos-radius);box-shadow:var(--cos-shadow);padding:24px;color:var(--cos-text)}",
    ".cos-field-form{display:flex;flex:1;min-width:0;flex-direction:column;background:var(--cos-surface);border:1px solid var(--cos-border);border-radius:var(--cos-radius);box-shadow:var(--cos-shadow);padding:24px;color:var(--cos-text)}",
    "[data-cos-tab='cos_notice'] .cos-panel__notice{display:block}",
    "[data-cos-tab='cos_notice'] .cos-field-form{display:none}",

    /* 分组显隐：基础 tab 隐藏 advanced，高级 tab 隐藏 base */
    "[data-cos-tab='cos_base'] .typecho-option[data-cos-group='advanced']{display:none}",
    "[data-cos-tab='cos_advanced'] .typecho-option[data-cos-group='base']{display:none}",

    /* notice 内部样式 */
    ".cos-panel__notice .title{font-size:18px;font-weight:700;text-align:center;padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid var(--cos-border-light);color:var(--cos-text)}",
    ".cos-panel__notice ol{padding-left:24px;color:var(--cos-text-weak)}",
    ".cos-panel__notice ol li{margin-bottom:10px;line-height:1.8}",
    ".cos-panel__notice a{color:var(--cos-primary);text-decoration:none}",
    ".cos-panel__notice a:hover{text-decoration:underline}",

    /* 字段表单内部样式（全部限定在 .cos-field-form 下） */
    ".cos-field-form ul{list-style:none}",
    ".cos-field-form>.typecho-option{list-style:none;display:block;width:100%;border:1px solid var(--cos-border-light);border-radius:var(--cos-radius);padding:16px 18px;margin-bottom:16px;background:var(--cos-surface);box-sizing:border-box}",
    ".cos-field-form .typecho-label,.cos-field-form label.typecho-label{display:block;border-left:3px solid var(--cos-primary);background:var(--cos-surface-2);line-height:1.4;padding:8px 12px;margin-bottom:14px;font-weight:600;color:var(--cos-text);font-size:14px;word-break:break-word}",
    ".cos-field-form .required{color:var(--cos-danger);margin-left:4px}",
    ".cos-field-form .multiline{display:flex;align-items:center;color:var(--cos-text-weak)}",
    ".cos-field-form .multiline input[type=checkbox]{margin-right:8px;width:16px;height:16px;accent-color:var(--cos-primary)}",
    ".cos-field-form textarea,.cos-field-form input[type=text],.cos-field-form input[type=password],.cos-field-form input[type=email],.cos-field-form input[type=url],.cos-field-form input[type=number]{width:100%;padding:9px 12px;color:var(--cos-text);background:var(--cos-surface);border:1px solid var(--cos-border);border-radius:var(--cos-radius);font-size:14px;font-family:inherit;-webkit-appearance:none;appearance:none;transition:border-color .18s ease,box-shadow .18s ease}",
    ".cos-field-form textarea{height:120px;resize:vertical}",
    ".cos-field-form textarea:focus,.cos-field-form input[type=text]:focus,.cos-field-form input[type=password]:focus,.cos-field-form input[type=email]:focus,.cos-field-form input[type=url]:focus,.cos-field-form input[type=number]:focus{outline:none;border-color:var(--cos-primary);box-shadow:0 0 0 2px rgba(43,111,255,.18)}",
    ".cos-field-form select{min-width:200px;height:36px;line-height:36px;padding:0 8px;color:var(--cos-text);background:var(--cos-surface);border:1px solid var(--cos-border);border-radius:var(--cos-radius);font-size:14px;font-family:inherit}",
    ".cos-field-form select:focus{outline:none;border-color:var(--cos-primary)}",
    ".cos-field-form .description{display:block;background:var(--cos-surface-2);color:var(--cos-text-weak);padding:10px 14px;margin-top:14px;line-height:1.7;border-radius:var(--cos-radius);word-break:break-all;font-size:13px}",
    ".cos-field-form .description a{color:var(--cos-primary);text-decoration:none}",
    ".cos-field-form .description a:hover{text-decoration:underline}",
    ".cos-field-form .description b{color:var(--cos-text);font-weight:600}",
    ".cos-field-form .typecho-option-submit{border:none;background:transparent;box-shadow:none;padding:20px 0 0;border-top:1px solid var(--cos-border-light);margin-top:4px;text-align:center}",
    ".cos-field-form .typecho-option-submit button,.cos-field-form .typecho-option-submit input[type=submit]{min-width:160px;height:40px;padding:0 24px;background:var(--cos-primary);color:#fff;border:none;border-radius:var(--cos-radius);font-size:14px;cursor:pointer;transition:background .18s ease}",
    ".cos-field-form .typecho-option-submit button:hover,.cos-field-form .typecho-option-submit input[type=submit]:hover{background:var(--cos-primary-hover)}",

    /* 模态弹窗 */
    ".cos-modal-mask{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s ease}",
    ".cos-modal-mask.cos-modal--show{opacity:1;pointer-events:auto}",
    ".cos-modal{background:var(--cos-surface);border:1px solid var(--cos-border);border-top:4px solid var(--cos-primary);border-radius:var(--cos-radius);box-shadow:var(--cos-shadow);padding:20px 24px;max-width:360px;width:90%;color:var(--cos-text);font-size:14px;line-height:1.6;transform:translateY(10px);transition:transform .2s ease}",
    ".cos-modal-mask.cos-modal--show .cos-modal{transform:translateY(0)}",
    ".cos-modal.cos-modal--success{border-top-color:var(--cos-success)}",
    ".cos-modal.cos-modal--error{border-top-color:var(--cos-danger)}",
    ".cos-modal.cos-modal--warning{border-top-color:var(--cos-warning)}",
    ".cos-modal__title{font-weight:600;margin-bottom:8px}",
    ".cos-modal__close{margin-top:14px;text-align:right}",
    ".cos-modal__close button{background:var(--cos-primary);color:#fff;border:none;border-radius:var(--cos-radius);padding:6px 16px;cursor:pointer;font-size:13px}",

    /* ====== 多级响应式：适配原版后台(admin2)与美化后台(BooAdmin)的不同容器 ====== */
    /* 中屏（平板/窄桌面）：侧栏收窄，间距缩小，避免内容区被挤压 */
    "@media (max-width:1100px){.cos-panel{gap:12px}.cos-panel__aside{flex:0 0 180px;max-width:180px}.cos-panel__logo{font-size:16px;padding:14px 10px}.cos-field-form,.cos-panel__notice{padding:18px}}",
    /* 小平板：侧栏进一步收窄 */
    "@media (max-width:900px){.cos-panel__aside{flex:0 0 160px;max-width:160px}.cos-panel__tab{font-size:13px}}",
    /* 移动端：上下堆叠，侧栏横向标签 */
    "@media (max-width:768px){.cos-panel{flex-direction:column;gap:12px}.cos-panel__aside{position:static;flex:1 1 auto;max-width:100%;width:100%}.cos-panel__tabs{display:flex;gap:8px}.cos-panel__tab{flex:1;height:38px;line-height:38px;margin-bottom:0;font-size:13px}.cos-panel__backup{flex-direction:row}.cos-panel__backup input{flex:1}.cos-panel__notice,.cos-field-form{margin-left:0;padding:18px}.cos-field-form>.typecho-option{padding:14px}}",
    /* 超窄屏：进一步收紧内边距，标签/输入全宽 */
    "@media (max-width:480px){.cos-panel__aside{padding-bottom:4px}.cos-panel__logo{font-size:15px;padding:12px 8px}.cos-panel__tabs{gap:6px}.cos-panel__tab{font-size:12px;height:34px;line-height:34px}.cos-field-form,.cos-panel__notice{padding:14px}.cos-field-form>.typecho-option{padding:12px}.cos-field-form .typecho-label,.cos-field-form label.typecho-label{font-size:13px;padding:6px 10px}.cos-field-form .typecho-option-submit button,.cos-field-form .typecho-option-submit input[type=submit]{min-width:120px;height:38px;padding:0 16px;font-size:13px}}",
    /* ====== 超宽屏：覆盖整个可用宽度，字段卡片两列网格排布避免留白 ====== */
    "@media (min-width:1600px){.cos-panel__aside{flex:0 0 260px;max-width:260px}.cos-panel__logo{font-size:20px;padding:22px 14px}.cos-field-form,.cos-panel__notice{padding:32px}.cos-field-form{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}.cos-field-form>.typecho-option{margin-bottom:0}.cos-field-form .typecho-option-submit{grid-column:1 / -1}}",
    "@media (min-width:2200px){.cos-panel__aside{flex:0 0 300px;max-width:300px}.cos-field-form{grid-template-columns:1fr 1fr 1fr;gap:20px}.cos-field-form,.cos-panel__notice{padding:40px}}"
  ].join("");

  function initCosPanel() {
    var panel = document.getElementById("cos-plugin-panel");
    if (!panel || panel.shadowRoot) return;

    // 突破原版后台 .container / 其它限制最大宽度的祖先容器，
    // 让面板在超宽屏下覆盖整个可用宽度（不修改后台核心文件）
    (function breakWidthLimit(el) {
      while (el && el.parentNode && el.parentNode.nodeType === 1) {
        el = el.parentNode;
        var cls = el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className;
        if (typeof cls === "string" && (cls.indexOf("container") !== -1 || cls === "body" || cls === "typecho-page-main")) {
          el.style.maxWidth = "none";
          el.style.width = "100%";
        }
      }
    })(panel);

    // ── 1) Shadow DOM 隔离 ──
    var shadow = panel.attachShadow({ mode: "open" });
    var style = document.createElement("style");
    style.textContent = COS_CSS;
    shadow.appendChild(style);

    // flex 容器，也是 data-cos-tab 状态的载体（CSS 分组选择器的锚点）
    var container = document.createElement("div");
    container.className = "cos-panel";
    container.setAttribute("data-cos-tab", "cos_base"); // 默认基础设置
    shadow.appendChild(container);

    // ── 2) 搬面板自身内容进 shadow ──
    while (panel.firstChild) {
      container.appendChild(panel.firstChild);
    }

    // ── 3) 从 light DOM 找字段表单并搬入 shadow（它由后台模板 config()->render() 输出在 panel 外）──
    var fieldForm = null;
    // 多重 fallback：先按 class 找，再按 form action 特征找
    var candidates = document.querySelectorAll("form");
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].querySelector(".typecho-option") && !candidates[i].classList.contains("cos-panel__backup")) {
        fieldForm = candidates[i];
        break;
      }
    }
    if (fieldForm && fieldForm.parentNode !== container) {
      container.appendChild(fieldForm);
    }
    // 给字段表单加样式钩子（按钮/卡片样式依赖此 class）
    if (fieldForm) fieldForm.classList.add("cos-field-form");

    // ── 4) 绑定元素引用 ──
    var tabs = container.querySelectorAll(".cos-panel__tab");
    var notice = container.querySelector(".cos-panel__notice");

    // ── 5) 模态弹窗 ──
    var mask = document.createElement("div");
    mask.className = "cos-modal-mask";
    var modal = document.createElement("div");
    modal.className = "cos-modal";
    mask.appendChild(modal);
    shadow.appendChild(mask);
    var modalTimer = null;
    function hideModal() { mask.classList.remove("cos-modal--show"); }
    function showModal(msg, type) {
      if (!msg) return;
      modal.className = "cos-modal cos-modal--" + (type || "success");
      var safe = String(msg).replace(/[<>&]/g, function (c) {
        return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c];
      });
      modal.innerHTML =
        '<div class="cos-modal__title">提示</div>' +
        '<div>' + safe + '</div>' +
        '<div class="cos-modal__close"><button type="button">知道了</button></div>';
      modal.querySelector("button").addEventListener("click", hideModal);
      mask.classList.add("cos-modal--show");
      if (modalTimer) clearTimeout(modalTimer);
      modalTimer = setTimeout(hideModal, 3000);
    }
    mask.addEventListener("click", function (e) {
      if (e.target === mask) hideModal();
    });

    // ── 6) Tab 切换：只更新状态属性，CSS 负责所有显隐 ──
    var STORAGE_KEY = "cos_plugin_tab";
    var remembered = null;
    try { remembered = sessionStorage.getItem(STORAGE_KEY); } catch (e) {}

    // 跨页面消息
    try {
      var cosMsg = sessionStorage.getItem("cos_msg");
      if (cosMsg) {
        sessionStorage.removeItem("cos_msg");
        showModal(cosMsg, "success");
      }
    } catch (e) {}

    function switchTab(key) {
      if (key !== "cos_notice" && key !== "cos_base" && key !== "cos_advanced") {
        key = "cos_base";
      }
      // 核心：更新容器属性 → CSS 选择器自动响应 → 分组显隐
      container.setAttribute("data-cos-tab", key);

      // tab 高亮
      for (var t = 0; t < tabs.length; t++) {
        tabs[t].classList.toggle("active", tabs[t].getAttribute("data-current") === key);
      }

      try { sessionStorage.setItem(STORAGE_KEY, key); } catch (e) {}
    }

    for (var t = 0; t < tabs.length; t++) {
      (function (tab) {
        tab.addEventListener("click", function () {
          switchTab(tab.getAttribute("data-current"));
        });
      })(tabs[t]);
    }

    // 初始激活（默认基础设置）
    switchTab(remembered || "cos_base");

    // ── 7) 必填校验 ──
    if (fieldForm) {
      fieldForm.addEventListener("submit", function () {
        var invalid = fieldForm.querySelectorAll("[required]:invalid");
        if (invalid.length > 0) {
          setTimeout(function () { showModal("有必填项未填写！", "error"); }, 0);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCosPanel);
  } else {
    initCosPanel();
  }
})();
