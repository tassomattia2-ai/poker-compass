// ============================================================
//  sw.js — il "service worker": un piccolo aiutante che il browser
//  tiene acceso dietro le quinte. Fa due cose:
//  1. al primo avvio mette da parte una copia di tutti i file
//     dell'app (il "magazzino", in inglese cache);
//  2. quando l'app chiede un file, prova prima a prenderlo da
//     internet (così vedi sempre la versione nuova); se internet
//     non c'è, lo prende dal magazzino. Così l'app funziona
//     anche in aereo o senza campo.
//
//  IMPORTANTE: quando aggiungi o rinomini un file del sito,
//  aggiungilo all'elenco FILE qui sotto e aumenta VERSIONE
//  (es. "v2"): così i telefoni rifanno il magazzino.
// ============================================================

const VERSIONE = "v1";
const MAGAZZINO = "poker-compass-" + VERSIONE;

// Tutti i file che servono all'app per funzionare senza internet
const FILE = [
  "./",
  "index.html",
  "prontuario.html",
  "calcolatore.html",
  "allenamento.html",
  "diario.html",
  "serate.html",
  "info.html",
  "style.css",
  "lingua.js",
  "comune.js",
  "prontuario.js",
  "calcolatore.js",
  "motore.js",
  "valutatore.js",
  "dati-mani-iniziali.js",
  "allenamento.js",
  "domande-regole.js",
  "diario.js",
  "serate.js",
  "traduzioni/en.js",
  "traduzioni/fr.js",
  "traduzioni/de.js",
  "caratteri/outfit-latin.woff2",
  "caratteri/outfit-latin-ext.woff2",
  "logo.svg",
  "manifest.webmanifest",
  "icone/icona-192.png",
  "icone/icona-512.png",
  "icone/icona-maskable-192.png",
  "icone/icona-maskable-512.png",
  "icone/apple-touch-icon.png"
];

// 1. Installazione: riempiamo il magazzino con tutti i file
self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(MAGAZZINO)
      .then(magazzino => magazzino.addAll(FILE.map(f => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())   // la versione nuova parte subito
  );
});

// 2. Attivazione: buttiamo i magazzini delle versioni vecchie
self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomi => Promise.all(
        nomi.filter(nome => nome.startsWith("poker-compass-") && nome !== MAGAZZINO)
            .map(nome => caches.delete(nome))))
      .then(() => self.clients.claim())
  );
});

// 3. Ogni richiesta di un file: prima internet, se manca il magazzino
self.addEventListener("fetch", evento => {
  const richiesta = evento.request;
  // Ci occupiamo solo dei file del nostro sito (non di altri siti)
  if (richiesta.method !== "GET" || new URL(richiesta.url).origin !== location.origin) return;

  evento.respondWith(
    fetch(richiesta)
      .then(risposta => {
        // Arrivato da internet: aggiorniamo anche la copia nel magazzino
        if (risposta.ok) {
          const copia = risposta.clone();
          caches.open(MAGAZZINO).then(magazzino => magazzino.put(richiesta, copia));
        }
        return risposta;
      })
      .catch(() =>
        // Niente internet: usiamo la copia (ignorando le parti dopo "?")
        caches.match(richiesta, { ignoreSearch: true }).then(copia =>
          copia || (richiesta.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
