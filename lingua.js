// ============================================================
//  lingua.js — le TRADUZIONI del sito (italiano, inglese,
//  francese, tedesco).
//  Va caricato PER PRIMO, nel <head> di ogni pagina.
//
//  Come funziona:
//  - il testo italiano resta scritto nel codice, come sempre;
//  - nel codice JS si scrive t("Testo italiano") invece di "Testo italiano":
//    t() cerca la traduzione nella lingua scelta; se non la trova,
//    restituisce l'italiano (così il sito non resta mai senza testo);
//  - nelle pagine HTML basta aggiungere l'attributo data-t a un elemento:
//    il suo contenuto italiano viene sostituito con la traduzione.
//    Per i segnaposto dei campi si usa data-t-placeholder,
//    per le etichette per i lettori di schermo data-t-aria.
//  - le traduzioni stanno nella cartella "traduzioni": un file per lingua
//    (en.js, fr.js, de.js). Ogni file è un elenco
//    "testo italiano": "traduzione".
// ============================================================

// Le lingue disponibili: codice, nome scritto nella sua lingua, "locale"
// (serve per scrivere numeri e date nel modo giusto per ogni paese)
const LINGUE = [
  { codice: "it", nome: "Italiano", locale: "it-IT" },
  { codice: "en", nome: "English",  locale: "en-GB" },
  { codice: "fr", nome: "Français", locale: "fr-FR" },
  { codice: "de", nome: "Deutsch",  locale: "de-DE" },
];

const CHIAVE_LINGUA = "poker.lingua";

// Quale lingua usare:
// 1. quella scelta dal giocatore (salvata nel browser);
// 2. altrimenti la lingua del browser, se è una delle nostre;
// 3. altrimenti l'inglese, la lingua più capita nel mondo.
function linguaIniziale() {
  const codici = LINGUE.map(l => l.codice);
  try {
    const salvata = localStorage.getItem(CHIAVE_LINGUA);
    if (codici.includes(salvata)) return salvata;
  } catch (e) { /* localStorage bloccato: andiamo avanti */ }
  for (const l of navigator.languages || [navigator.language || ""]) {
    const codice = l.slice(0, 2).toLowerCase();
    if (codici.includes(codice)) return codice;
  }
  return "en";
}

const LINGUA = linguaIniziale();
const LOCALE = LINGUE.find(l => l.codice === LINGUA).locale;

// Qui ogni file di traduzione aggiunge il suo elenco (TRADUZIONI.en = {...})
const TRADUZIONI = {};

// I testi a cui manca la traduzione (servono solo per i controlli)
const MANCANTI = new Set();

// Diciamo al browser in che lingua è la pagina (serve anche ai lettori di schermo)
document.documentElement.lang = LINGUA;

// Carichiamo SOLO il file della lingua scelta (l'italiano non serve: è già nel codice).
// document.write funziona perché siamo nel <head> mentre la pagina si sta leggendo:
// il file viene caricato subito, prima del resto del codice.
if (LINGUA !== "it") {
  document.write(`<script src="traduzioni/${LINGUA}.js"><\/script>`);
}

// Gli spazi e gli a capo non contano: "Ciao   a\n tutti" = "Ciao a tutti".
function normalizza(testo) {
  return testo.replace(/\s+/g, " ").trim();
}

// LA funzione delle traduzioni.
// t("Domanda {n} di {tot}", { n: 3, tot: 10 }) → "Question 3 of 10"
// Le parti tra graffe {…} vengono sostituite con i valori dati.
function t(testo, valori) {
  const chiave = normalizza(testo);
  const elenco = TRADUZIONI[LINGUA];
  let risultato = elenco && elenco[chiave];
  if (!risultato) {
    // Traduzione mancante: usiamo l'italiano e ce lo segniamo
    // (in prova, MANCANTI ci dice cosa resta da tradurre)
    // (i testi fatti solo di numeri e simboli non serve tradurli)
    if (LINGUA !== "it" && /[A-Za-zÀ-ÿ]/.test(chiave)) MANCANTI.add(chiave);
    risultato = chiave;
  }
  if (valori) {
    risultato = risultato.replace(/\{(\w+)\}/g, (tutto, nome) =>
      nome in valori ? valori[nome] : tutto);
  }
  return risultato;
}

// Traduce le parti fisse delle pagine HTML (quelle con data-t).
// La chiama comune.js appena la pagina è pronta.
function traduciPagina() {
  document.title = t(document.title);
  if (LINGUA === "it") return;
  document.querySelectorAll("[data-t]").forEach(el => {
    el.innerHTML = t(el.innerHTML);
  });
  document.querySelectorAll("[data-t-placeholder]").forEach(el => {
    el.placeholder = t(el.placeholder);
  });
  document.querySelectorAll("[data-t-aria]").forEach(el => {
    el.setAttribute("aria-label", t(el.getAttribute("aria-label")));
  });
  document.querySelectorAll("[data-t-title]").forEach(el => {
    el.title = t(el.title);
  });
}

// Cambia lingua: la salviamo e ricarichiamo la pagina.
function cambiaLingua(codice) {
  try { localStorage.setItem(CHIAVE_LINGUA, codice); } catch (e) { /* pazienza */ }
  location.reload();
}

// Scrive un numero nel modo del paese: 1.250 (it/de), 1,250 (en), 1 250 (fr)
function numeroLocale(n, opzioni) {
  return Number(n).toLocaleString(LOCALE, opzioni);
}
