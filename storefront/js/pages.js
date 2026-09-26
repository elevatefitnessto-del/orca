(function () {
  const C = window.RavineCatalog;
  const Cart = window.RavineCart;
  const UI = window.RavineUI;
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function money(cents) { return Cart.money(cents); }
  function specimenInci(sku) {
    const map = {
      "BAR-S1-110": "Sodium Olivate, Sodium Cocoate, Sodium Shea Butterate, Aqua, Glycerin, Citrus Aurantium Peel Oil, Parfum, Limonene, Linalool",
      "BAR-S2-110": "Sodium Olivate, Sodium Cocoate, Sodium Shea Butterate, Aqua, Glycerin, Lavandula Angustifolia Oil, Parfum, Linalool, Limonene",
      "BAR-S3-110": "Sodium Olivate, Sodium Cocoate, Sodium Shea Butterate, Aqua, Glycerin, Camellia Sinensis Leaf Powder, Parfum, Linalool",
      "BAR-S4-110": "Sodium Olivate, Sodium Cocoate, Sodium Shea Butterate, Aqua, Glycerin, Juniperus Virginiana Oil, Parfum, Limonene",
      "BAR-S5-110": "Sodium Olivate, Sodium Cocoate, Sodium Shea Butterate, Aqua, Glycerin",
      "MINI-S5": "Sodium Olivate, Sodium Cocoate, Sodium Shea Butterate, Aqua, Glycerin"
    };
    return map[sku] || "Printed from the lot sheet for the bars in the set.";
  }
  function row(label, value) {
    return "<tr><th scope=\"row\">" + esc(label) + "</th><td>" + esc(value) + "</td></tr>";
  }
  function totalBlock(t) {
    const pst = ["BC", "SK", "MB", "QC"].indexOf(t.province) !== -1
      ? "<p class=\"muted\">Provincial sales tax, where it applies to an out-of-province seller, is not in this total yet. GST/HST shown is the included amount.</p>" : "";
    return "<div class=\"total-line\"><span>Bars</span><strong>" + money(t.merch) + "</strong></div>" +
      (t.discount ? "<div class=\"total-line\"><span>Code " + esc(t.code.id) + "</span><strong>−" + money(t.discount) + "</strong></div>" : "") +
      (t.wrap ? "<div class=\"total-line\"><span>Gift wrap and a handwritten card</span><strong>" + money(t.wrap) + "</strong></div>" : "") +
      "<div class=\"total-line\"><span>" + (t.fulfill === "pickup" ? "Pickup" : "Shipping") + "</span><strong>" + (t.ship === 0 ? "Included" : money(t.ship)) + "</strong></div>" +
      "<div class=\"total-line\"><span>Total, tax included</span><strong>" + money(t.total) + "</strong></div>" +
      "<p class=\"muted\">Includes " + money(t.tax) + " " + esc(t.taxName) + ".</p>" + pst;
  }
  function productPage() {
    const root = document.getElementById("product-root");
    if (!root) return;
    const sku = new URLSearchParams(location.search).get("sku") || "BAR-S1-110";
    const p = C.bySku(sku);
    if (!p) {
      root.innerHTML = "<div class=\"page-head\"><h1>That bar is not on the list.</h1><p><a href=\"shop.html\">Back to the shop</a></p></div>";
      return;
    }
    document.title = p.name + " — Ravine";
    const stock = Cart.stockOf(p.sku);
    const sold = stock === 0;
    const few = UI.stockNote(p.sku);
    const shipTruth = p.sku === "SET-4-SHIP"
      ? "Shipping included in Canada at this price. Pickup, when a stall is confirmed, is " + money(p.pickup * 100) + "."
      : "Shipped, you pay the parcel unless the bag is " + money(C.freeShipAt * 100) + " or more. Pickup is the stall price.";
    let chooser = "";
    if (p.kind === "set3") {
      const options = C.products.filter(function (x) { return x.kind === "single"; }).map(function (x) {
        return "<option value=\"" + x.sku + "\">" + esc(x.name) + "</option>";
      }).join("");
      chooser = "<div class=\"selects\" id=\"set-picks\"><label class=\"field\">First<select>" + options + "</select></label><label class=\"field\">Second<select>" + options + "</select></label><label class=\"field\">Third<select>" + options + "</select></label></div>";
    }
    const gallery = [p.image, "images/hand.jpg", "images/dish.jpg"].map(function (src, i) {
      const alt = i === 0 ? p.name + " bath bar" : i === 1 ? "A bar in a hand, for scale" : "A bar after several showers, on a dry dish";
      return "<img src=\"" + src + "\" alt=\"" + esc(alt) + "\">";
    }).join("");
    root.innerHTML = "<article class=\"product\"><div class=\"gallery\">" + gallery + "</div><div class=\"buy-box\">" +
      "<p class=\"kicker\">" + esc(p.slot) + (few ? " · " + esc(few) : "") + "</p><div class=\"tick " + p.color + "\"></div><h1>" + esc(p.name) + "</h1>" +
      "<p class=\"bilingual\">" + esc(p.french) + " · " + esc(p.weight) + "</p><p>" + esc(p.line) + "</p>" +
      "<p class=\"price\">" + money(p.ship * 100) + " shipped · " + money(p.pickup * 100) + " at the stall</p>" +
      "<p class=\"ship-note\">" + esc(shipTruth) + "</p>" + chooser +
      "<div class=\"btn-row\"><button class=\"btn\" id=\"add-product\" " + (sold ? "disabled" : "") + ">" + (sold ? "Sold out" : "Add to bag") + "</button></div>" +
      "<p class=\"added\" id=\"add-note\"></p><table class=\"spec\"><tbody>" +
      row("Scent", p.notes) + row("Lasts", p.lasts) + row("Weight", p.weight + ". Keep it on a dry dish, not in a puddle.") +
      row("Origin", "Designed in Toronto. Made in Ontario.") +
      row("Lot", "Every bar is lot-coded on the sleeve. If something is off, send the code and we replace it.") +
      row("Use", "For external use only. Stop use if irritation occurs. / Pour usage externe seulement. Cesser l'utilisation en cas d'irritation.") +
      "</tbody></table><p class=\"inci\"><strong>Ingredients / Ingrédients.</strong> Specimen, not the lot sheet: " + esc(specimenInci(p.sku)) + ". Allergens above 0.01% print after parfum on the sleeve.</p></div></article>";
    if (p.kind === "set3") {
      const defaults = ["BAR-S1-110", "BAR-S2-110", "BAR-S3-110"];
      document.querySelectorAll("#set-picks select").forEach(function (sel, i) { sel.value = defaults[i]; });
    }
    const button = document.getElementById("add-product");
    if (button && !sold) {
      button.addEventListener("click", function () {
        let scents = null;
        if (p.kind === "set3") scents = Array.from(document.querySelectorAll("#set-picks select")).map(function (s) { return s.value; });
        const result = Cart.add(p.sku, scents, 1);
        const note = document.getElementById("add-note");
        if (!result.ok) { note.textContent = result.reason; UI.say(result.reason); return; }
        note.innerHTML = "Added. <a href=\"cart.html\">View bag</a>";
        UI.say(p.name + " added to the bag.");
        UI.mount(document.body.getAttribute("data-page"));
      });
    }
  }
  function cartPage() {
    const root = document.getElementById("cart-root");
    if (!root) return;
    const fulfill = Cart.fulfillment();
    const t = Cart.totals("ON");
    const pickupOpen = !!C.nextStall();
    const stall = C.nextStall();
    const lines = t.lines.length ? t.lines.map(function (line) {
      return "<div class=\"cart-line\"><div><strong>" + esc(line.name) + "</strong>" +
        (line.detail ? "<div class=\"muted\">" + esc(line.detail) + "</div>" : "") +
        "<div class=\"qty\"><button type=\"button\" data-dec=\"" + esc(line.id) + "\" aria-label=\"Fewer\">−</button><span>" + line.qty + "</span><button type=\"button\" data-inc=\"" + esc(line.id) + "\" aria-label=\"More\">+</button></div> " +
        "<button class=\"remove\" type=\"button\" data-remove=\"" + esc(line.id) + "\">Remove</button></div><div>" + money(line.line) + "</div></div>";
    }).join("") : "<p>The bag is empty. <a href=\"shop.html\">Four bars are on the shop page.</a></p>";
    root.innerHTML = "<div class=\"page-head\"><p class=\"kicker\">Bag</p><h1>What you're taking.</h1></div>" +
      "<div class=\"fulfill\" role=\"group\" aria-label=\"How you get it\">" +
      "<button type=\"button\" id=\"ful-ship\" aria-pressed=\"" + (fulfill === "ship") + "\"><strong>Ship it</strong><div class=\"muted\">You pay the parcel under $58.</div></button>" +
      "<button type=\"button\" id=\"ful-pick\" aria-pressed=\"" + (fulfill === "pickup") + "\"" + (pickupOpen ? "" : " disabled") + "><strong>Pick it up</strong><div class=\"muted\">" + (pickupOpen ? esc(stall.neighbourhood) + " · " + esc(stall.date) : "Opens when a stall is confirmed.") + "</div></button></div>" +
      lines + "<div class=\"totals\">" + totalBlock(t) + "</div>" +
      "<form id=\"code-form\" class=\"btn-row\" style=\"margin-top:16px\"><label class=\"sr-only\" for=\"code\">Code</label><input id=\"code\" type=\"text\" name=\"code\" placeholder=\"Code\" autocomplete=\"off\" style=\"max-width:180px\"><button class=\"btn ghost\" type=\"submit\">Apply</button></form><p class=\"added\" id=\"code-note\"></p>" +
      (t.lines.length ? "<p style=\"margin-top:18px\"><a class=\"btn\" href=\"checkout.html\">Checkout</a></p>" : "");
    document.getElementById("ful-ship").addEventListener("click", function () { Cart.setFulfillment("ship"); cartPage(); });
    const pick = document.getElementById("ful-pick");
    if (pickupOpen) pick.addEventListener("click", function () { Cart.setFulfillment("pickup"); cartPage(); });
    root.querySelectorAll("[data-dec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-dec");
        const item = Cart.items().find(function (i) { return i.id === id; });
        const result = Cart.setQty(id, item.qty - 1);
        if (!result.ok) UI.say(result.reason);
        cartPage();
      });
    });
    root.querySelectorAll("[data-inc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-inc");
        const item = Cart.items().find(function (i) { return i.id === id; });
        const result = Cart.setQty(id, item.qty + 1);
        if (!result.ok) UI.say(result.reason);
        cartPage();
      });
    });
    root.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () { Cart.remove(btn.getAttribute("data-remove")); cartPage(); });
    });
    document.getElementById("code-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const result = Cart.setCode(document.getElementById("code").value);
      if (!result.ok) { document.getElementById("code-note").textContent = result.reason; return; }
      cartPage();
    });
  }
  function checkoutPage() {
    const root = document.getElementById("checkout-root");
    if (!root) return;
    if (!Cart.items().length) {
      root.innerHTML = "<div class=\"page-head\"><h1>Nothing to check out.</h1><p><a href=\"shop.html\">Shop</a></p></div>";
      return;
    }
    const fulfill = Cart.fulfillment();
    const stall = C.nextStall();
    const provinces = C.provinces.map(function (pair) {
      return "<option value=\"" + pair[0] + "\"" + (pair[0] === "ON" ? " selected" : "") + ">" + esc(pair[1]) + "</option>";
    }).join("");
    root.innerHTML = "<div class=\"page-head\"><p class=\"kicker\">Checkout</p><h1>" + (fulfill === "pickup" ? "Pickup." : "Ship it.") + "</h1></div><div class=\"layout\"><form id=\"checkout-form\" novalidate>" +
      "<label class=\"field\">Name<input name=\"name\" type=\"text\" autocomplete=\"name\" required></label>" +
      "<label class=\"field\">Email<input name=\"email\" type=\"email\" autocomplete=\"email\" required></label>" +
      "<label class=\"field\">Phone, optional<input name=\"phone\" type=\"tel\" autocomplete=\"tel\"></label>" +
      (fulfill === "pickup"
        ? "<div class=\"notice\"><strong>Pickup · " + esc(stall.neighbourhood) + " · " + esc(stall.date) + "</strong><br>" + esc(stall.hours) + ". " + esc(stall.where) + " Pay at the stall. The bag is under your name.</div>"
        : "<label class=\"field\">Address<input name=\"line1\" type=\"text\" autocomplete=\"address-line1\" required></label><label class=\"field\">City<input name=\"city\" type=\"text\" autocomplete=\"address-level2\" required></label><label class=\"field\">Province<select name=\"province\" id=\"province\">" + provinces + "</select></label><label class=\"field\">Postal code<input name=\"postal\" type=\"text\" autocomplete=\"postal-code\" required></label>") +
      "<label class=\"field\">Gift note, 200 characters<textarea name=\"giftnote\" maxlength=\"200\" id=\"giftnote\"></textarea></label><p class=\"muted\" id=\"note-count\">0 / 200</p>" +
      "<label class=\"check\"><input type=\"checkbox\" name=\"giftwrap\" id=\"giftwrap\"" + (Cart.wrapOn() ? " checked" : "") + "> Gift wrap and a handwritten card, $4.</label>" +
      "<label class=\"check\"><input type=\"checkbox\" name=\"consent\" id=\"consent\"> Send me reorder notes and stall dates from Ravine Bath, Toronto. I can unsubscribe any time. Consent is optional and is not required to buy.</label>" +
      "<div class=\"notice\">No card number on this page. Pickup is paid at the stall. A shipped order is held for an e-transfer, noted on the confirmation.</div>" +
      "<p class=\"added\" id=\"form-error\"></p><button class=\"btn\" type=\"submit\">Place the order</button></form><aside><div class=\"kicker\">The bag</div><div id=\"side-totals\"></div><p><a href=\"cart.html\">Edit the bag</a></p></aside></div>";
    function paint() {
      const province = fulfill === "pickup" ? "ON" : (document.getElementById("province") ? document.getElementById("province").value : "ON");
      document.getElementById("side-totals").innerHTML = totalBlock(Cart.totals(province));
    }
    paint();
    const province = document.getElementById("province");
    if (province) province.addEventListener("change", paint);
    const wrap = document.getElementById("giftwrap");
    wrap.addEventListener("change", function () { Cart.setWrap(wrap.checked); paint(); });
    const note = document.getElementById("giftnote");
    note.addEventListener("input", function () { document.getElementById("note-count").textContent = note.value.length + " / 200"; });
    document.getElementById("checkout-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fields = {
        name: String(fd.get("name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        line1: String(fd.get("line1") || "").trim(),
        city: String(fd.get("city") || "").trim(),
        province: fulfill === "pickup" ? "ON" : String(fd.get("province") || "ON"),
        postal: String(fd.get("postal") || "").trim().toUpperCase(),
        giftnote: String(fd.get("giftnote") || "").slice(0, 200),
        giftwrap: wrap.checked,
        consent: document.getElementById("consent").checked,
        fulfill: fulfill
      };
      const error = document.getElementById("form-error");
      function fail(message) { error.textContent = message; UI.say(message); }
      if (fields.name.length < 2) return fail("A name, so the bag has somewhere to go.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return fail("An email we can actually write to.");
      if (fulfill === "ship") {
        if (!fields.line1 || !fields.city) return fail("An address, including the city.");
        if (!/^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/.test(fields.postal)) return fail("A Canadian postal code.");
      }
      const result = Cart.placeOrder(fields);
      if (!result.ok) return fail(result.reason);
      location.href = "confirmed.html?id=" + encodeURIComponent(result.order.id);
    });
  }
  function confirmedPage() {
    const root = document.getElementById("receipt-root");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const order = id ? Cart.order(id) : null;
    if (!order) {
      root.innerHTML = "<div class=\"page-head\"><h1>No order under that number.</h1><p><a href=\"shop.html\">Shop</a></p></div>";
      return;
    }
    const t = order.totals;
    const f = order.fields;
    const lines = order.lines.map(function (line) {
      return "<div>" + line.qty + " × " + esc(line.name) + (line.detail ? " — " + esc(line.detail) : "") + " · " + money(line.line) + "</div>";
    }).join("");
    const pay = f.fulfill === "pickup"
      ? "<p>Pay at the stall. " + esc(order.stall.neighbourhood) + ", " + esc(order.stall.date) + ", " + esc(order.stall.hours) + ". " + esc(order.stall.where) + " The bag is under " + esc(f.name) + ".</p>"
      : "<p>Send an e-transfer for " + money(t.total) + " to " + esc(C.email) + ", note " + esc(order.id) + " in the message. We hold the bars for 48 hours, then ship within two business days of the transfer.</p>";
    root.innerHTML = "<div class=\"page-head\"><p class=\"kicker\">Order</p><h1>We have it.</h1></div><div class=\"receipt\"><div class=\"kicker\">" + esc(order.id) + "</div><p>" + esc(f.name) + "<br>" + esc(f.email) + "</p>" + lines +
      "<p>Total " + money(t.total) + ", including " + money(t.tax) + " " + esc(t.taxName) + ".</p>" +
      (f.giftnote ? "<p>Note: " + esc(f.giftnote) + "</p>" : "") +
      (f.giftwrap ? "<p>Gift wrap: yes.</p>" : "") +
      "<p>Reorder notes: " + (f.consent ? "yes. You can unsubscribe any time." : "no. Buying did not sign you up.") + "</p>" + pay +
      "<p>Store the bar on a dry dish. A puddle finishes it faster than the four weeks.</p></div>";
  }
  function findPage() {
    const root = document.getElementById("find-root");
    if (!root) return;
    const statusLabel = { confirmed: "Confirmed", holding: "Held, not confirmed", applying: "Application out" };
    const list = C.upcomingStalls();
    const items = list.length ? list.map(function (s) {
      const when = new Date(s.date + "T12:00:00");
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = days[when.getDay()] + " " + when.getDate() + " " + months[when.getMonth()];
      return "<li><div><div class=\"status\">" + esc(statusLabel[s.status] || s.status) + "</div><strong>" + esc(label) + "</strong><div class=\"muted\">" + esc(s.hours) + "</div></div><div><strong>" + esc(s.name) + "</strong><div>" + esc(s.neighbourhood) + " · " + esc(s.where) + "</div><p class=\"muted\">" + esc(s.note) + "</p></div></li>";
    }).join("") : "<li><div>None</div><div>No upcoming dates. Shop from here.</div></li>";
    root.innerHTML = "<ul class=\"dates\">" + items + "</ul><h2>If it rains</h2><p>We cancel when the weather is unsafe, not when it is merely grey. The note goes out that morning. If you are already on the way, write " + esc(C.email) + ".</p><h2>Christmas</h2><p>Last ground ship for a Christmas arrival we will promise: 15 December 2026. Last Ontario expedited: 18 December. After that, pickup only, and only if a window on this page says confirmed.</p>";
  }
  window.RavinePages = { product: productPage, cart: cartPage, checkout: checkoutPage, confirmed: confirmedPage, find: findPage };
})();
