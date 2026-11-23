// Offline-Cache: App funktioniert nach dem ersten Laden auch ohne Netz im Wildpark
// Bei jeder Änderung an Bildern oder Dateien die Versionsnummer hochzählen, sonst behalten Geräte alte Bilder.
const CACHE = 'wildpark-rallye-v5';
const DATEIEN = [
 "./",
 "index.html",
 "style.css",
 "app.js",
 "manifest.webmanifest",
 "img/b1.jpg",
 "img/b2.jpg",
 "img/b3.jpg",
 "img/b4.jpg",
 "img/b5.jpg",
 "img/b6.jpg",
 "img/b7.jpg",
 "img/b8.jpg",
 "img/b9.jpg",
 "img/ende-falter.jpg",
 "img/falter-seite.jpg",
 "img/falter-vorn.jpg",
 "img/icon-192.png",
 "img/icon-512.png",
 "img/kamera.jpg",
 "img/karte.jpg",
 "img/logo-bne.jpg",
 "img/logo-bz-klein.jpg",
 "img/logo-bz.jpg",
 "img/logo-duelmen.jpg",
 "img/logo-marketing.jpg",
 "img/logo-nrw.jpg",
 "img/mat-blase.jpg",
 "img/mat-falter.jpg",
 "img/qr.jpg",
 "img/s1-falter-l.jpg",
 "img/s1-falter-r.jpg",
 "img/s10-zapfen.jpg",
 "img/s11-blume.jpg",
 "img/s13-schild.jpg",
 "img/s14-code.jpg",
 "img/s14-tiere.jpg",
 "img/s16-falter.jpg",
 "img/s17-falter.jpg",
 "img/s18-leckstein.jpg",
 "img/s2-foerster.jpg",
 "img/s3-larve.jpg",
 "img/s3-libelle.jpg",
 "img/s3-seerose.jpg",
 "img/s4-falter.jpg",
 "img/s4-schild.jpg",
 "img/s5-laub.jpg",
 "img/s5-nadel.jpg",
 "img/s6-holzpolter.jpg",
 "img/s6-schild.jpg",
 "img/s6-text.jpg",
 "img/s7-schild.jpg",
 "img/s8-labyrinth.jpg",
 "img/s9-falter.jpg",
 "img/sdg13.jpg",
 "img/sdg15.jpg",
 "img/sdg3.jpg",
 "img/sdg4.jpg",
 "img/t1.jpg",
 "img/t2.jpg",
 "img/t3.jpg",
 "img/t4.jpg",
 "img/t5.jpg",
 "img/t6.jpg",
 "img/t7.jpg",
 "img/t8.jpg",
 "img/t9.jpg"
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const bild = /\/img\//.test(e.request.url);
  e.respondWith(caches.open(CACHE).then(async c => {
    const alt = await c.match(e.request, { ignoreSearch: true });
    if (bild && alt) return alt; // Bilder ändern sich nicht: direkt aus dem Cache
    try { // Seite, Stil, Skript: erst Netz (aktuelle Version), ohne Netz aus dem Cache
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    } catch (err) { if (alt) return alt; throw err; }
  }));
});
