window.RavineCart = (function () {
  const C = window.RavineCatalog;
  const KEY = "ravine-cart-v1";
  const FKEY = "ravine-fulfill-v1";
  const CODEKEY = "ravine-code-v1";
  const WRAPKEY = "ravine-wrap-v1";
  const STOCKKEY = "ravine-stock-v1";
  const ORDERKEY = "ravine-orders-v1";
  const codes = { CARD10: 0.1, WITHROW10: 0.1, LESLIE10: 0.1, RIVERSIDE10: 0.1, OFFICE: 0.1 };

  function read(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (err) { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function emit() { document.dispatchEvent(new CustomEvent("ravine:cart")); }
  function cents(n) { return Math.round(Number(n) * 100); }
  function money(c) {
    const sign = c < 0 ? "−" : "";
    return sign + "$" + (Math.abs(c) / 100).toFixed(2);
  }
  function stockMap() {
    let map = read(STOCKKEY, null);
    if (!map) {
      map = {};
      C.products.forEach(function (p) { if (typeof p.stock === "number") map[p.sku] = p.stock; });
      write(STOCKKEY, map);
    }
    return map;
  }
  function items() { return read(KEY, []); }
  function save(next) { write(KEY, next); emit(); }
  function fulfillment() {
    const stored = localStorage.getItem(FKEY) || "ship";
    if (stored === "pickup" && !C.nextStall()) return "ship";
    return stored;
  }
  function setFulfillment(value) {
    if (value === "pickup" && !C.nextStall()) value = "ship";
    localStorage.setItem(FKEY, value);
    emit();
  }
  function wrapOn() { return localStorage.getItem(WRAPKEY) === "1"; }
  function setWrap(on) { localStorage.setItem(WRAPKEY, on ? "1" : "0"); emit(); }
  function code() { return read(CODEKEY, null); }
  function setCode(raw) {
    const key = String(raw || "").trim().toUpperCase();
    if (!key) { localStorage.removeItem(CODEKEY); emit(); return { ok: true, cleared: true }; }
    if (!codes[key]) return { ok: false, reason: "That code is not active." };
    write(CODEKEY, { id: key, rate: codes[key] });
    emit();
    return { ok: true };
  }
  function lineId(sku, scents) {
    const list = (scents || []).slice().sort();
    return list.length ? sku + "|" + list.join("|") : sku;
  }
  function needs(item) {
    const p = C.bySku(item.sku);
    if (!p) return [];
    if (p.kind === "set4") return p.includes.map(function (sku) { return { sku: sku, qty: item.qty }; });
    if (p.kind === "set3") return (item.scents || []).map(function (sku) { return { sku: sku, qty: item.qty }; });
    return [{ sku: item.sku, qty: item.qty }];
  }
  function fits(list) {
    const have = stockMap();
    const used = {};
    list.forEach(function (item) {
      needs(item).forEach(function (n) { used[n.sku] = (used[n.sku] || 0) + n.qty; });
    });
    return Object.keys(used).every(function (sku) { return used[sku] <= (have[sku] || 0); });
  }
  function scentLabel(item) {
    if (!item.scents || !item.scents.length) {
      const p = C.bySku(item.sku);
      if (p && p.kind === "set4") return "Seville, Lavender, Black Tea, Ravine Cedar";
      return "";
    }
    return item.scents.map(function (sku) { const p = C.bySku(sku); return p ? p.name : sku; }).join(", ");
  }
  function add(sku, scents, qty) {
    qty = qty || 1;
    const p = C.bySku(sku);
    if (!p) return { ok: false, reason: "Unknown bar." };
    if (p.kind === "set3" && (!scents || scents.length !== 3)) return { ok: false, reason: "Choose three bars." };
    const id = lineId(sku, scents);
    const current = items();
    const existing = current.find(function (i) { return i.id === id; });
    const nextQty = (existing ? existing.qty : 0) + qty;
    if (nextQty > 8) return { ok: false, reason: "Eight is the limit on one line." };
    const next = current.filter(function (i) { return i.id !== id; });
    next.push({ id: id, sku: sku, scents: (scents || []).slice(), qty: nextQty });
    if (!fits(next)) return { ok: false, reason: "Not enough of that bar left." };
    save(next);
    return { ok: true };
  }
  function setQty(id, qty) {
    if (qty > 8) return { ok: false, reason: "Eight is the limit on one line." };
    const next = items().map(function (i) { return i.id === id ? Object.assign({}, i, { qty: qty }) : i; }).filter(function (i) { return i.qty > 0; });
    if (!fits(next)) return { ok: false, reason: "Not enough of that bar left." };
    save(next);
    return { ok: true };
  }
  function remove(id) { save(items().filter(function (i) { return i.id !== id; })); }
  function count() { return items().reduce(function (sum, i) { return sum + i.qty; }, 0); }
  function clear() { save([]); localStorage.removeItem(CODEKEY); localStorage.setItem(WRAPKEY, "0"); }
  function shippingCents(merchAfter, fulfill, province) {
    if (!items().length) return 0;
    if (fulfill === "pickup") return 0;
    if (merchAfter >= cents(C.freeShipAt)) return 0;
    if (!province || province === "ON") return cents(C.shipOn);
    return cents(C.shipRest);
  }
  function totals(province) {
    const fulfill = fulfillment();
    let merch = 0;
    const lines = items().map(function (item) {
      const p = C.bySku(item.sku);
      const unit = cents(fulfill === "pickup" ? p.pickup : p.ship);
      const line = unit * item.qty;
      merch += line;
      return { id: item.id, sku: item.sku, name: p.name, detail: scentLabel(item), qty: item.qty, unit: unit, line: line };
    });
    const applied = code();
    const discount = applied ? Math.round(merch * applied.rate) : 0;
    const after = merch - discount;
    const wrap = wrapOn() ? cents(C.giftWrap) : 0;
    const ship = shippingCents(after, fulfill, province || "ON");
    const total = after + wrap + ship;
    const taxRate = C.taxRates[province || "ON"] || 0.13;
    const tax = Math.round(total * taxRate / (1 + taxRate));
    return { lines: lines, merch: merch, discount: discount, after: after, wrap: wrap, ship: ship, total: total, tax: tax, taxRate: taxRate, taxName: C.taxNames[province || "ON"] || "HST", fulfill: fulfill, code: applied, province: province || "ON" };
  }
  function placeOrder(fields) {
    const list = items();
    if (!list.length) return { ok: false, reason: "The bag is empty." };
    const fulfill = fulfillment();
    if (fulfill === "pickup" && !C.nextStall()) return { ok: false, reason: "Pickup is not open. No stall is confirmed." };
    if (!fits(list)) return { ok: false, reason: "Stock changed. Check the bag." };
    const t = totals(fields.province || "ON");
    const order = { id: "RAV-" + C.todayISO().replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(), placed: new Date().toISOString(), fields: fields, totals: t, lines: t.lines, stall: fulfill === "pickup" ? C.nextStall() : null };
    const have = stockMap();
    list.forEach(function (item) { needs(item).forEach(function (n) { have[n.sku] = (have[n.sku] || 0) - n.qty; }); });
    write(STOCKKEY, have);
    const orders = read(ORDERKEY, []);
    orders.unshift(order);
    write(ORDERKEY, orders);
    clear();
    return { ok: true, order: order };
  }
  function order(id) { return read(ORDERKEY, []).find(function (o) { return o.id === id; }) || null; }
  return { items: items, add: add, setQty: setQty, remove: remove, count: count, clear: clear, fulfillment: fulfillment, setFulfillment: setFulfillment, wrapOn: wrapOn, setWrap: setWrap, code: code, setCode: setCode, totals: totals, stockOf: function (sku) { const map = stockMap(); return map[sku] == null ? null : map[sku]; }, placeOrder: placeOrder, order: order, money: money };
})();
