(function () {
  const C = window.RavineCatalog;
  const Cart = window.RavineCart;

  function prettyDate(iso) {
    const parts = iso.split("-").map(Number);
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return days[dt.getDay()] + " " + parts[2] + " " + months[parts[1] - 1];
  }
  function stallStrip() {
    const next = C.nextStall();
    const holding = C.holdingStall();
    if (next) {
      return "<div class=\"stall-strip\"><div class=\"wrap\"><span><strong>" + prettyDate(next.date) + "</strong> · " + next.neighbourhood + " · " + next.hours + ". Pickup that day is the stall price.</span><a href=\"find.html\">Find us</a></div></div>";
    }
    const hint = holding
      ? "No stall confirmed yet. Next date on the list: " + prettyDate(holding.date) + ", " + holding.neighbourhood + "."
      : "No stall on the calendar. Shop here.";
    return "<div class=\"stall-strip\"><div class=\"wrap\"><span>" + hint + " A single bar does not ship free.</span><a href=\"find.html\">Dates</a></div></div>";
  }
  function header(active) {
    const n = Cart.count();
    function link(href, label, id) {
      const cur = active === id ? " aria-current=\"page\"" : "";
      return "<a href=\"" + href + "\"" + cur + ">" + label + "</a>";
    }
    return stallStrip() +
      "<header class=\"wrap header\"><a class=\"wordmark\" href=\"index.html\">Ravine<small>Toronto bath bars</small></a><nav class=\"nav\" aria-label=\"Primary\">" +
      link("shop.html", "Shop", "shop") + link("find.html", "Find us", "find") +
      link("cart.html", "Bag <span class=\"bag-count\">" + n + "</span>", "cart") +
      "</nav></header>";
  }
  function footer() {
    return "<footer class=\"footer\"><div class=\"wrap footer-grid\">" +
      "<div><strong>Ravine</strong><p class=\"muted\">Designed in Toronto. Made in Ontario. Four scents, plus unscented.</p></div>" +
      "<div><div class=\"kicker\">Shop</div><ul><li><a href=\"shop.html\">All bars</a></li><li><a href=\"product.html?sku=SET-4-SHIP\">The month, shipped</a></li><li><a href=\"product.html?sku=BAR-S5-110\">Unscented</a></li></ul></div>" +
      "<div><div class=\"kicker\">Visit</div><ul><li><a href=\"find.html\">Stalls</a></li><li><a href=\"shipping.html\">Shipping and pickup</a></li><li><a href=\"returns.html\">Returns</a></li></ul></div>" +
      "<div><div class=\"kicker\">The label</div><ul><li><a href=\"about.html\">About</a></li><li><a href=\"contact.html\">Contact</a></li><li><a href=\"privacy.html\">Privacy</a></li></ul></div>" +
      "</div><div class=\"wrap fine\">Ravine Bath · Toronto. Prices include tax. Ingredient lists on this site are specimens until the supplier INCI for the lot is locked — do not treat them as the printed sleeve. Vous pouvez nous écrire en français. <a href=\"contact.html\">" + C.email + "</a></div></footer>";
  }
  function mount(active) {
    const top = document.getElementById("top");
    const bottom = document.getElementById("bottom");
    if (top) top.innerHTML = header(active);
    if (bottom) bottom.innerHTML = footer();
  }
  function say(message) {
    let live = document.getElementById("live");
    if (!live) {
      live = document.createElement("div");
      live.id = "live";
      live.className = "sr-only";
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }
    live.textContent = message;
  }
  function bindAdds() {
    document.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const sku = btn.getAttribute("data-add");
        const result = Cart.add(sku, null, 1);
        const note = btn.parentElement.querySelector(".added");
        if (!result.ok) {
          if (note) note.textContent = result.reason;
          say(result.reason);
          return;
        }
        if (note) note.innerHTML = "Added. <a href=\"cart.html\">View bag</a>";
        say(C.bySku(sku).name + " added to the bag.");
        mount(document.body.getAttribute("data-page"));
      });
    });
  }
  function stockNote(sku) {
    const n = Cart.stockOf(sku);
    if (n == null) return "";
    if (n <= 0) return "Sold out";
    if (n < 8) return "Few left";
    return "";
  }
  document.addEventListener("ravine:cart", function () { mount(document.body.getAttribute("data-page")); });
  window.RavineUI = { mount: mount, say: say, bindAdds: bindAdds, stockNote: stockNote };
})();
