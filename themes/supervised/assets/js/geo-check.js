(function () {
  var form = document.getElementById("geo-form");
  if (!form) return;

  var input = document.getElementById("geo-domain");
  var button = document.getElementById("geo-submit");
  var results = document.getElementById("geo-results");

  // Maakt een element met optionele class en tekst.
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function setBusy(busy) {
    button.disabled = busy;
    button.textContent = busy ? "Bezig…" : "Scan";
    input.disabled = busy;
  }

  function renderError(message) {
    results.innerHTML = "";
    var box = el("div", "geo-message geo-message-error");
    box.appendChild(el("p", null, message));
    results.appendChild(box);
  }

  function renderResult(data) {
    results.innerHTML = "";

    var head = el("div", "geo-score");
    var num = el("span", "geo-score-num", String(data.score));
    var max = el("span", "geo-score-max", "/100");
    head.appendChild(num);
    head.appendChild(max);
    head.appendChild(el("p", "geo-score-label", "GEO-score voor " + data.domain));

    // Kleur het getal op basis van de score.
    if (data.score >= 80) num.classList.add("is-good");
    else if (data.score >= 50) num.classList.add("is-mid");
    else num.classList.add("is-low");

    results.appendChild(head);

    var list = el("ul", "geo-checks");
    data.checks.forEach(function (c) {
      var item = el("li", "geo-check " + (c.pass ? "is-pass" : "is-fail"));
      var mark = el("span", "geo-check-mark", c.pass ? "✓" : "✕");
      mark.setAttribute("aria-hidden", "true");
      var body = el("div", "geo-check-body");
      body.appendChild(el("span", "geo-check-label", c.label));
      body.appendChild(el("span", "geo-check-detail", c.detail));
      if (c.advice) body.appendChild(el("span", "geo-check-advice", c.advice));
      item.appendChild(mark);
      item.appendChild(body);
      list.appendChild(item);
    });
    results.appendChild(list);

    var cta = el("div", "geo-cta");
    cta.appendChild(el("p", null, "Wil je dit voor jouw bedrijf op orde, of de gaten laten dichten?"));
    var link = el("a", "cta cta-primary", "Neem contact op");
    link.setAttribute("href", "/contact/");
    cta.appendChild(link);
    results.appendChild(cta);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var domain = (input.value || "").trim();
    if (!domain) {
      renderError("Voer een domein in, bijvoorbeeld jouwbedrijf.nl.");
      input.focus();
      return;
    }

    setBusy(true);
    results.innerHTML = "";
    results.appendChild(el("p", "geo-loading", "Bezig met scannen…"));

    fetch("/api/geo-check?domain=" + encodeURIComponent(domain), {
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (r) {
        if (!r.ok || (r.body && r.body.error)) {
          renderError((r.body && r.body.error) || "Er ging iets mis. Probeer het later opnieuw.");
          return;
        }
        renderResult(r.body);
      })
      .catch(function () {
        renderError("Kon de scan niet uitvoeren. Controleer je verbinding en probeer opnieuw.");
      })
      .finally(function () {
        setBusy(false);
      });
  });
})();
