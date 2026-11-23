(function () {
  'use strict';
  var KEY = 'wildpark-rallye-v1';
  var daten = {};
  try { daten = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { daten = {}; }
  function sichern() { try { localStorage.setItem(KEY, JSON.stringify(daten)); } catch (e) {} }
  function setze(k, v) { if (v === '' || v === false || v == null) delete daten[k]; else daten[k] = v; sichern(); }

  var seiten = Array.prototype.slice.call(document.querySelectorAll('#blatt > section'));
  var nummern = {}; // Lösungssatz-Nummer -> {key, fest, seite}

  function gross(z) { return z === 'ß' ? 'ß' : z.toUpperCase(); }

  /* ---------- Antwortkästchen aufbauen ---------- */
  document.querySelectorAll('.felder').forEach(function (box) {
    var key = box.dataset.key, len = +box.dataset.len;
    var nums = JSON.parse(box.dataset.nums || '{}'), fest = JSON.parse(box.dataset.fest || '{}');
    var seite = seiten.indexOf(box.closest('section'));
    for (var i = 1; i <= len; i++) {
      var feld = document.createElement('div'); feld.className = 'feld';
      var inp = document.createElement('input');
      inp.type = 'text'; inp.maxLength = 2; inp.autocomplete = 'off'; inp.autocapitalize = 'characters';
      inp.spellcheck = false; inp.setAttribute('autocorrect', 'off'); inp.enterKeyHint = 'next';
      inp.setAttribute('aria-label', 'Buchstabe ' + i + ' von ' + len + (nums[i] ? ', Lösungsbuchstabe ' + nums[i] : ''));
      var k = key + '.' + i;
      if (fest[i]) {
        inp.value = fest[i]; inp.readOnly = true;
        if (nums[i]) { // vorgegebener Lösungsbuchstabe: muss an der Station eingesammelt werden
          inp.className = 'sammel'; inp.dataset.sammel = k; inp.setAttribute('role', 'button');
          inp.setAttribute('aria-label', 'Lösungsbuchstabe ' + nums[i] + ': ' + fest[i] + ' – antippen zum Einsammeln');
          if (daten[k + '.ok']) inp.classList.add('ok');
        } else inp.tabIndex = -1;
      }
      else { inp.dataset.key = k; inp.value = daten[k] || ''; }
      var kl = document.createElement('small'); kl.textContent = nums[i] || '';
      feld.appendChild(inp); feld.appendChild(kl); box.appendChild(feld);
      if (nums[i]) nummern[nums[i]] = { key: k, fest: fest[i] || '', seite: seite };
    }
    if (box.querySelector('.sammel')) {
      var hin = document.createElement('p'); hin.className = 'tipp sammelhinweis';
      var anker = box.parentNode.classList.contains('reihe') ? box.parentNode : box;
      hin.box = box; anker.parentNode.insertBefore(hin, anker.nextSibling);
    }
  });
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!(t.dataset && t.dataset.sammel)) return;
    var k = t.dataset.sammel + '.ok';
    setze(k, !daten[k]); t.classList.toggle('ok', !!daten[k]); t.blur(); aktualisiere();
  });

  function freie(box) { return Array.prototype.slice.call(box.querySelectorAll('input:not([readonly])')); }

  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.closest && t.closest('.felder')) {
      var liste = freie(t.closest('.felder')), pos = liste.indexOf(t);
      var z = t.value.replace(/\s/g, '');
      var neu = z.slice(-1); // letztes getipptes Zeichen ersetzt das alte
      t.value = neu ? gross(neu) : '';
      setze(t.dataset.key, t.value);
      if (neu && liste[pos + 1]) liste[pos + 1].focus();
      aktualisiere();
    } else if (t.matches && t.matches('input.linie')) {
      setze(t.dataset.key, t.value); aktualisiere();
    }
  });
  document.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (!(t.closest && t.closest('.felder'))) return;
    var liste = freie(t.closest('.felder')), pos = liste.indexOf(t);
    if (ev.key === 'Backspace' && !t.value && liste[pos - 1]) {
      liste[pos - 1].value = ''; setze(liste[pos - 1].dataset.key, ''); liste[pos - 1].focus(); aktualisiere(); ev.preventDefault();
    } else if (ev.key === 'ArrowLeft' && liste[pos - 1]) liste[pos - 1].focus();
    else if (ev.key === 'ArrowRight' && liste[pos + 1]) liste[pos + 1].focus();
    else if (ev.key === 'Enter') t.blur();
  });
  document.addEventListener('focusin', function (ev) {
    var t = ev.target;
    if (t.closest && t.closest('.felder') && !t.readOnly && t.select) t.select();
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.type === 'checkbox' && t.dataset.key) { setze(t.dataset.key, t.checked); aktualisiere(); }
  });

  /* gespeicherte Werte in Textfelder / Kreuze */
  document.querySelectorAll('input.linie').forEach(function (i) { i.value = daten[i.dataset.key] || ''; });
  document.querySelectorAll('input[type=checkbox][data-key]').forEach(function (c) { c.checked = !!daten[c.dataset.key]; });

  /* ---------- Antwort a/b/c antippen -> Buchstabe ins Kästchen ---------- */
  document.querySelectorAll('ol.wahl li').forEach(function (li) {
    li.addEventListener('click', function () {
      var k = li.parentNode.dataset.ziel + '.1';
      var inp = document.querySelector('input[data-key="' + k + '"]');
      var wert = inp.value === li.dataset.b ? '' : li.dataset.b;
      inp.value = wert; setze(k, wert); aktualisiere();
    });
  });

  /* ---------- Kopfüber-Lösungen ---------- */
  document.querySelectorAll('.kopfueber').forEach(function (b) {
    b.addEventListener('click', function () { b.classList.toggle('gedreht'); });
  });

  /* ---------- Lösungssatz ---------- */
  var satz = document.getElementById('satz');
  [[[1, 3], [4, 11]], [[12, 14], [15, 22]]].forEach(function (zeile) {
    var z = document.createElement('div'); z.className = 'satzzeile';
    zeile.forEach(function (w) {
      var wort = document.createElement('div'); wort.className = 'wort';
      for (var n = w[0]; n <= w[1]; n++) {
        var feld = document.createElement('div'); feld.className = 'feld';
        var inp = document.createElement('input'); inp.readOnly = true; inp.dataset.nr = n;
        inp.setAttribute('aria-label', 'Lösungsbuchstabe ' + n);
        var kl = document.createElement('small'); kl.textContent = n;
        feld.appendChild(inp); feld.appendChild(kl); wort.appendChild(feld);
      }
      z.appendChild(wort);
    });
    satz.appendChild(z);
  });
  satz.addEventListener('click', function (ev) {
    var nr = ev.target.dataset && ev.target.dataset.nr;
    if (nr && nummern[nr] && !buchstabe(nr)) zeige(nummern[nr].seite);
  });
  function buchstabe(n) { var q = nummern[n]; if (!q) return ''; return q.fest ? (daten[q.key + '.ok'] ? q.fest : '') : (daten[q.key] || ''); }
  function satztext() {
    var s = '';
    for (var n = 1; n <= 22; n++) { s += buchstabe(n) || '_'; if (n === 3 || n === 11 || n === 14) s += ' '; }
    return s;
  }

  /* ---------- Übersicht ---------- */
  function wort(key, len, fest) {
    var s = '';
    for (var i = 1; i <= len; i++) s += (fest && fest[i]) || daten[key + '.' + i] || '_';
    return s;
  }
  function gesammelt(key) { // Station mit vorgegebenem Buchstaben, der an der Station eingesammelt wird
    var e = document.querySelector('[data-sammel="' + key + '.1"]');
    var nr = e ? e.parentNode.querySelector('small').textContent : '';
    return 'Kästchen ' + nr + ': ' + (daten[key + '.1.ok'] ? e.value + ' ✓' : 'noch nicht eingesammelt');
  }
  function uebersicht() {
    var tiere = ['Kaulquappen', 'Frösche', 'Karpfen', 'Wasservögel', 'Libellen'].filter(function (_, i) { return daten['s3.c' + (i + 1)]; });
    var z = [
      ['Station 1', wort('s1', 6)],
      ['Station 2', 'Deine Lösung: ' + (daten['s2.m'] || '___') + ' m · Kästchen 20: ' + wort('s2', 1)],
      ['Station 3', 'Angekreuzt: ' + (tiere.join(', ') || '–') + ' · ' + wort('s3', 7)],
      ['Station 4', wort('s4', 8, { 1: 'P', 2: 'F', 5: 'N' })],
      ['Station 5', wort('s5a', 8) + ' / ' + wort('s5b', 9)],
      ['Station 6', 'Kästchen 13: ' + wort('s6', 1)],
      ['Station 7', gesammelt('s7')],
      ['Station 8', 'Kästchen 15: ' + wort('s8', 1)],
      ['Station 9', wort('s9', 11, { 8: 'Ä' })],
      ['Station 10', gesammelt('s10')],
      ['Station 12', gesammelt('s12')],
      ['Station 13', gesammelt('s13')],
      ['Station 14', wort('s14', 8)],
      ['Station 15', wort('s15', 9)],
      ['Station 16', gesammelt('s16')],
      ['Station 18', wort('s18', 10)],
      ['Station 19', gesammelt('s19')],
      ['Station 20', gesammelt('s20')]
    ];
    var h = z.map(function (r) { return '<div><b>' + r[0] + '</b><span></span></div>'; }).join('') +
      '<div class="satz"><b>Lösungssatz</b><span></span></div>';
    var u = document.getElementById('uebersicht'); u.innerHTML = h;
    var sp = u.querySelectorAll('span');
    z.forEach(function (r, i) { sp[i].textContent = r[1]; });
    sp[z.length].textContent = satztext() + ' und unsere Umwelt!';
  }

  function aktualisiere() {
    satz.querySelectorAll('input').forEach(function (i) { i.value = buchstabe(+i.dataset.nr); });
    document.querySelectorAll('ol.wahl').forEach(function (ol) {
      var v = daten[ol.dataset.ziel + '.1'] || '';
      ol.querySelectorAll('li').forEach(function (li) { li.classList.toggle('gewaehlt', li.dataset.b === v); });
    });
    document.querySelectorAll('.sammelhinweis').forEach(function (p) {
      var ok = p.box.querySelector('.sammel').classList.contains('ok');
      p.textContent = ok ? '✓ Buchstabe eingesammelt – steht jetzt im Lösungssatz' : 'Aufgabe erledigt? Kästchen antippen, um den Buchstaben einzusammeln';
    });
    uebersicht();
  }

  /* ---------- Alles löschen (zweistufig) ---------- */
  var reset = document.getElementById('reset'), resetTimer;
  reset.addEventListener('click', function () {
    if (!reset.classList.contains('warn')) {
      reset.classList.add('warn'); reset.textContent = 'Wirklich löschen? Nochmal tippen';
      resetTimer = setTimeout(function () { reset.classList.remove('warn'); reset.textContent = 'Alle Eingaben löschen'; }, 4000);
      return;
    }
    clearTimeout(resetTimer);
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });

  /* ---------- Seite ohne Scrollen in den Bildschirm einpassen ---------- */
  var blatt = document.getElementById('blatt'), kopf = document.querySelector('.kopf'), leiste = document.querySelector('.leiste');
  // Querformat am Handy: Pfeile als schmale Seitenspalten, Leiste unten entfällt
  var quer = window.matchMedia('(orientation: landscape) and (max-height: 520px)');
  function passe() {
    var s = seiten[aktuell]; if (!s) return;
    var cs = getComputedStyle(blatt);
    var bw = blatt.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var bh = window.innerHeight - kopf.offsetHeight - (quer.matches ? 0 : leiste.offsetHeight) - parseFloat(cs.paddingTop) - 8;
    s.style.transform = 'none'; s.style.margin = '0';
    if (bw < 50 || bh < 120) { s.style.width = ''; return; }
    // breiteres Layout (weniger Zeilen) verkleinert darstellen; beste Kombination suchen
    var best = 0, bestW = bw, bestH = 0;
    for (var f = 1; f <= 3.001; f += 0.125) {
      var w = bw * f; s.style.width = w + 'px';
      var h = s.offsetHeight, m = Math.min(bw / w, bh / h, 1);
      if (m > best + 0.002) { best = m; bestW = w; bestH = h; }
      if (f === 1 && h <= bh) break; // passt schon in Originalgröße
    }
    // im Querformat nicht winzig verkleinern: lieber lesbar lassen und scrollen
    if (quer.matches && best < 0.72) { s.style.width = ''; return; }
    s.style.width = bestW + 'px';
    s.style.transformOrigin = '0 0';
    s.style.transform = best < 1 ? 'scale(' + best + ')' : 'none';
    s.style.marginLeft = Math.max(0, (bw - bestW * best) / 2) + 'px';
    s.style.marginBottom = -(bestH * (1 - best)) + 'px';
    s.style.marginRight = -(bestW - bw) + 'px';
  }
  var passeTimer;
  function passeBald() { clearTimeout(passeTimer); passeTimer = setTimeout(passe, 60); }
  window.addEventListener('resize', function () {
    var a = document.activeElement; // Tastatur offen: nicht neu skalieren
    if (a && a.tagName === 'INPUT' && !a.readOnly) return;
    passeBald();
  });
  window.addEventListener('orientationchange', passeBald);
  document.querySelectorAll('#blatt img').forEach(function (im) { if (!im.complete) im.addEventListener('load', passeBald); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(passeBald);

  /* ---------- Navigation ---------- */
  var aktuell = 0, rueck = -1;
  var hilfeLinks = document.getElementById('hilfelinks'), rueckKnopf = document.getElementById('rueck');
  function index(id) { return seiten.findIndex(function (s) { return s.id === id; }); }
  function istHilfe(i) { return i === index('waldtiere') || i === index('baeume'); }
  hilfeLinks.querySelectorAll('button[data-geh]').forEach(function (b) {
    b.addEventListener('click', function () { if (!istHilfe(aktuell)) rueck = aktuell; zeige(index(b.dataset.geh)); });
  });
  rueckKnopf.addEventListener('click', function () { var z = rueck; rueck = -1; zeige(z); });
  var zurueck = document.getElementById('zurueck'), weiter = document.getElementById('weiter');
  var menue = document.getElementById('menue'), liste = document.getElementById('menueliste');
  function zeige(i, ohneHash) {
    aktuell = Math.max(0, Math.min(seiten.length - 1, i));
    seiten.forEach(function (s, n) { s.classList.toggle('aktiv', n === aktuell); });
    zurueck.disabled = aktuell === 0; weiter.disabled = aktuell === seiten.length - 1;
    document.getElementById('seitenzahl').textContent = (aktuell + 1) + ' / ' + seiten.length;
    menue.hidden = true;
    if (!istHilfe(aktuell)) rueck = -1;
    rueckKnopf.hidden = rueck < 0;
    if (rueck >= 0) rueckKnopf.textContent = '↩ Zurück zu ' + seiten[rueck].dataset.titel.split(' – ')[0];
    hilfeLinks.querySelectorAll('button[data-geh]').forEach(function (b) { b.classList.toggle('hier', index(b.dataset.geh) === aktuell); });
    passe();
    window.scrollTo(0, 0);
    setze('seite', aktuell);
    if (!ohneHash) history.pushState({ s: aktuell }, '', location.pathname + location.search);
  }
  zurueck.addEventListener('click', function () { zeige(aktuell - 1); });
  weiter.addEventListener('click', function () { zeige(aktuell + 1); });
  window.addEventListener('popstate', function (ev) { zeige(ev.state && ev.state.s != null ? ev.state.s : 0, true); });
  document.querySelectorAll('a[data-geh]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!istHilfe(aktuell)) rueck = aktuell;
      zeige(index(a.dataset.geh));
    });
  });

  document.getElementById('menueknopf').addEventListener('click', function () {
    liste.innerHTML = '';
    seiten.forEach(function (s, n) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; if (n === aktuell) b.className = 'hier';
      var t = document.createElement('span'); t.textContent = s.dataset.titel; b.appendChild(t);
      // ✓ wenn alle freien Kästchen ausgefüllt und alle vorgegebenen Buchstaben eingesammelt sind
      var fs = Array.prototype.slice.call(s.querySelectorAll('.felder input[data-key], .felder input.sammel'));
      if (fs.length) {
        var fertig = fs.every(function (f) { return f.classList.contains('sammel') ? f.classList.contains('ok') : !!f.value; });
        var i = document.createElement('i'); i.textContent = fertig ? '✓' : ''; b.appendChild(i);
      }
      b.addEventListener('click', function () { zeige(n); });
      li.appendChild(b); liste.appendChild(li);
    });
    menue.hidden = false;
    var hier = liste.querySelector('.hier'); if (hier) hier.scrollIntoView({ block: 'center' });
  });
  document.getElementById('menuezu').addEventListener('click', function () { menue.hidden = true; });

  /* ---------- Bilder vergrößern ---------- */
  var lupe = document.getElementById('lupe'), lupeBild = lupe.querySelector('img');
  document.querySelectorAll('img.zoom').forEach(function (im) {
    im.addEventListener('click', function () { lupeBild.src = im.src; lupeBild.alt = im.alt; lupe.hidden = false; lupe.scrollTo(0, 0); });
  });
  lupe.addEventListener('click', function () { lupe.hidden = true; });

  /* ---------- Start ---------- */
  aktualisiere();
  // Erster Aufruf: Seite 1. Später: zuletzt geöffnete Seite. Die Seitennummer steht bewusst
  // nicht in der Adresse, damit ein weitergegebener Link immer vorne beginnt.
  var start = +daten.seite || 0;
  zeige(start, true);
  history.replaceState({ s: aktuell }, '', location.pathname + location.search);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
