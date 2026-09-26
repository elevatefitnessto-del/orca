/* Prices are tax-included CAD. Stall prices apply only when a date status is "confirmed". */
window.RavineCatalog = (function () {
  const products = [
    { sku: "BAR-S1-110", kind: "single", name: "Seville", slot: "Daily", french: "Savon pour les mains et le corps", color: "seville", ship: 15, pickup: 13, weight: "110 g", stock: 48, image: "images/seville.jpg", line: "Bitter orange. The one we hand you first.", notes: "Bitter orange peel, a clean finish, no candy sweetness.", lasts: "Most people get three to four weeks of daily showers from this bar, on a dry dish." },
    { sku: "BAR-S2-110", kind: "single", name: "Lavender", slot: "Classic", french: "Savon pour les mains et le corps", color: "lavender", ship: 15, pickup: 13, weight: "110 g", stock: 36, image: "images/lavender.jpg", line: "Lavender, kept quiet. Not a candle.", notes: "Lavender, and not much else. If the market already smells like a drawer of sachets, start with Seville.", lasts: "Most people get three to four weeks of daily showers from this bar, on a dry dish." },
    { sku: "BAR-S3-110", kind: "single", name: "Black Tea", slot: "Signature", french: "Savon pour les mains et le corps", color: "tea", ship: 15, pickup: 13, weight: "110 g", stock: 28, image: "images/black-tea.jpg", line: "Black tea and a dry finish. The Toronto bar.", notes: "Black tea. Unsweetened. This is the one that does not smell like a gift shop.", lasts: "Most people get three to four weeks of daily showers from this bar, on a dry dish." },
    { sku: "BAR-S4-110", kind: "single", name: "Ravine Cedar", slot: "Cold weather", french: "Savon pour les mains et le corps", color: "cedar", ship: 15, pickup: 13, weight: "110 g", stock: 36, image: "images/cedar.jpg", line: "Cedar, unsweetened. The November bar.", notes: "Eastern cedar, no vanilla, no fireplace candle. The cold-weather bar.", lasts: "Most people get three to four weeks of daily showers from this bar, on a dry dish." },
    { sku: "BAR-S5-110", kind: "single", name: "Unscented", slot: "No fragrance", french: "Savon non parfumé", color: "plain", ship: 15, pickup: 13, weight: "110 g", stock: 24, image: "images/unscented.jpg", line: "No fragrance, no essential oil, no colour.", notes: "For the person who can't do scent, and for the office order. Nothing hidden under the word unscented.", lasts: "Most people get three to four weeks of daily showers from this bar, on a dry dish." },
    { sku: "SET-3", kind: "set3", name: "The three", slot: "Set", french: "Ensemble de trois savons", color: "plain", ship: 39, pickup: 36, weight: "3 × 110 g", image: "images/set.jpg", line: "Three bars. You choose, or take the usual.", notes: "The usual three is Seville, Lavender, and Black Tea. Swap in cedar if the gift is for winter.", lasts: "A set is about two to three months for one person, or a month if the household shares." },
    { sku: "SET-4-SHIP", kind: "set4", name: "The month", slot: "Set", french: "Ensemble de quatre savons", color: "cedar", ship: 58, pickup: 48, weight: "4 × 110 g", image: "images/hero.jpg", includes: ["BAR-S1-110", "BAR-S2-110", "BAR-S3-110", "BAR-S4-110"], line: "One of each scented bar. Shipping included in Canada.", notes: "Seville, Lavender, Black Tea, Ravine Cedar. This is the only offer that ships free. Pickup is $48, the stall price for four.", lasts: "About a month if you use one bar at a time, longer if you rotate." },
    { sku: "MINI-S5", kind: "mini", name: "Guest bar", slot: "Add-on", french: "Savon invité, non parfumé", color: "plain", ship: 5, pickup: 5, weight: "40 g", stock: 40, image: "images/unscented.jpg", line: "A small unscented bar. Not the hero.", notes: "For a guest bathroom or to put next to a full bar so the order is worth the parcel.", lasts: "A few showers, not a month." }
  ];

  const stalls = [
    { date: "2026-11-15", hours: "11–4", name: "Leslieville studio pop-up", neighbourhood: "Leslieville", where: "Queen East. The door is emailed the morning of the stall.", status: "holding", note: "Holding this date. Change status to confirmed in js/catalog.js when the host says yes. That is what turns on pickup prices." },
    { date: "2026-11-28", hours: "10–4", name: "Riverside holiday market", neighbourhood: "Riverside", where: "Published here when the organizer confirms the table.", status: "applying", note: "Application out. Not a promise." },
    { date: "2026-12-12", hours: "10–3", name: "Last stall before the Christmas ship cutoff", neighbourhood: "Leslieville", where: "Same corner as 15 Nov, if the host has the table.", status: "applying", note: "Pickup orders for this day are bagged under the name on the order." }
  ];

  const taxRates = { AB: 0.05, BC: 0.05, MB: 0.05, NB: 0.15, NL: 0.15, NT: 0.05, NS: 0.14, NU: 0.05, ON: 0.13, PE: 0.15, QC: 0.05, SK: 0.05, YT: 0.05 };
  const taxNames = { AB: "GST", BC: "GST", MB: "GST", NB: "HST", NL: "HST", NT: "GST", NS: "HST", NU: "GST", ON: "HST", PE: "HST", QC: "GST", SK: "GST", YT: "GST" };
  const provinces = [["ON", "Ontario"], ["QC", "Quebec"], ["BC", "British Columbia"], ["AB", "Alberta"], ["MB", "Manitoba"], ["SK", "Saskatchewan"], ["NS", "Nova Scotia"], ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"], ["PE", "Prince Edward Island"], ["NT", "Northwest Territories"], ["NU", "Nunavut"], ["YT", "Yukon"]];

  function bySku(sku) { return products.find(function (p) { return p.sku === sku; }) || null; }
  function todayISO() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  function upcomingStalls() {
    const t = todayISO();
    return stalls.filter(function (s) { return s.date >= t; });
  }
  function nextStall() { return upcomingStalls().filter(function (s) { return s.status === "confirmed"; })[0] || null; }
  function holdingStall() { return upcomingStalls()[0] || null; }

  return {
    brand: "Ravine", legal: "Ravine Bath", city: "Toronto", email: "hello@ravinebath.ca",
    freeShipAt: 58, shipOn: 8, shipRest: 14, giftWrap: 4,
    products: products, stalls: stalls, taxRates: taxRates, taxNames: taxNames, provinces: provinces,
    bySku: bySku, todayISO: todayISO, upcomingStalls: upcomingStalls, nextStall: nextStall, holdingStall: holdingStall
  };
})();
