// ============================================================
//  allenamento.js — i quiz della sezione Allenamento.
//  5 allenamenti:
//    🏆 Chi vince?           2 o 3 mani e un tavolo: chi porta a casa il piatto?
//    🃏 Che punto è?         7 carte: riconosci il punto migliore
//    🎲 Quante probabilità?  percentuale pre-flop, outs, pot odds
//    📖 Regole e posizioni   domande sulle regole (domande-regole.js)
//    🔀 Misto                un po' di tutto
//  Ogni partita è di 10 domande. Dopo ogni risposta c'è la spiegazione.
//  Le carte sono numeri da 0 a 51 (vedi valutatore.js).
// ============================================================

const MODI = [
  { id: "chi-vince",   icona: "🏆", nome: t("Chi vince?"),
    descrizione: t("Due o tre mani e un tavolo: chi porta a casa il piatto?") },
  { id: "che-punto",   icona: "🃏", nome: t("Che punto è?"),
    descrizione: t("Sette carte: riconosci al volo il punto migliore.") },
  { id: "probabilita", icona: "🎲", nome: t("Quante probabilità?"),
    descrizione: t("Percentuali pre-flop, outs e pot odds: allena l'occhio del campione.") },
  { id: "regole",      icona: "📖", nome: t("Regole e posizioni"),
    descrizione: t("Rilanci, showdown, casi speciali e novità TDA 2026.") },
  { id: "misto",       icona: "🔀", nome: t("Misto"),
    descrizione: t("Un po' di tutto, come al tavolo vero.") },
];

const DOMANDE_PER_PARTITA = 10;

// I 10 punti, dal più debole al più forte (la Scala reale qui è separata)
const PUNTI_10 = [...CATEGORIE, t("Scala reale")];

// La partita in corso (null = nessuna partita)
let partita = null;

// ---------- Il record (salvato nel browser) ----------
// localStorage può non funzionare (es. finestra anonima): usiamo try/catch,
// così la pagina funziona lo stesso, solo senza ricordare il record.
const CHIAVE_RECORD = "poker.allenamento.record";

function leggiRecord() {
  try { return JSON.parse(localStorage.getItem(CHIAVE_RECORD)) || {}; }
  catch { return {}; }
}

function salvaRecord(record) {
  try { localStorage.setItem(CHIAVE_RECORD, JSON.stringify(record)); } catch { /* niente */ }
}

// ---------- Piccoli aiutanti ----------

// Numero intero a caso da 0 a n-1
function aCaso(n) { return Math.floor(Math.random() * n); }

// Mescola un elenco (metodo di Fisher-Yates: ogni ordine ha la stessa probabilità)
function mescola(elenco) {
  const a = elenco.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = aCaso(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pesca n carte diverse da un mazzo mescolato
const MAZZO = Array.from({ length: 52 }, (_, i) => i);
function pesca(n) {
  // Basta mescolare le prime n posizioni (più veloce di mescolare tutto)
  for (let i = 0; i < n; i++) {
    const j = i + aCaso(52 - i);
    [MAZZO[i], MAZZO[j]] = [MAZZO[j], MAZZO[i]];
  }
  return MAZZO.slice(0, n);
}

// Carte disegnate (da numeri). "piccole" = versione ridotta per le spiegazioni
function carteHTML(carte, piccole = false) {
  return `<div class="mano ${piccole ? "piccola" : ""}">${carte.map(c => cartaHTML(codiceDaNumero(c))).join("")}</div>`;
}

// Percentuale scritta come si usa nella lingua scelta: 0.254 → "25,4" (it) o "25.4" (en)
function percento(x, decimali = 1) {
  return numeroLocale(x * 100, { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
}

// Nome del punto con la Scala reale separata (indice da 0 a 9)
function indicePunto(p) {
  const cat = categoriaDa(p);
  // Scala reale = scala colore con l'Asso come carta più alta (valore 12)
  return cat === 8 && ((p >> 16) & 15) === 12 ? 9 : cat;
}

// 4 risposte numeriche: la giusta + 3 sbagliate vicine, in ordine crescente.
// "trappola" = una risposta sbagliata tipica (es. l'errore più comune), se c'è.
function opzioniNumeriche(giusta, passo, minimo, massimo, unita = "", trappola = null) {
  const sbagliate = new Set();
  if (trappola !== null && trappola !== giusta && trappola >= minimo && trappola <= massimo) sbagliate.add(trappola);
  const spostamenti = mescola([-3, -2, -1, 1, 2, 3]);
  for (const k of spostamenti) {
    if (sbagliate.size >= 3) break;
    const v = giusta + k * passo;
    // Le risposte devono stare nei limiti ed essere ben distinte tra loro
    if (v < minimo || v > massimo) continue;
    if ([...sbagliate].some(s => Math.abs(s - v) < passo * 0.75)) continue;
    sbagliate.add(v);
  }
  return [giusta, ...sbagliate]
    .sort((a, b) => a - b)
    .map(v => ({ testo: numeroLocale(v) + unita, giusta: v === giusta }));
}

// ============================================================
//  I GENERATORI DELLE DOMANDE
//  Ognuno restituisce: { tipo, testo, opzioni: [{testo, giusta}],
//                        spiegazione, disposizione }
// ============================================================

// ---------- 🏆 Chi vince? ----------
function domandaChiVince() {
  // Spesso (60%) cerchiamo mani "tirate", con lo stesso tipo di punto:
  // sono quelle in cui si sbaglia, perché decidono le carte più alte (kicker).
  const vogliamoTirata = Math.random() < 0.6;
  let tavolo, mani, punti;
  for (let tentativo = 0; tentativo < 300; tentativo++) {
    const quanti = Math.random() < 0.6 ? 2 : 3;
    const carte = pesca(5 + quanti * 2);
    tavolo = carte.slice(0, 5);
    mani = [];
    for (let g = 0; g < quanti; g++) mani.push(carte.slice(5 + g * 2, 7 + g * 2));
    punti = mani.map(m => valuta([...m, ...tavolo], 7));
    const ordinati = punti.slice().sort((a, b) => b - a);
    const tirata = categoriaDa(ordinati[0]) === categoriaDa(ordinati[1]);
    if (!vogliamoTirata || tirata) break;
  }

  const massimo = Math.max(...punti);
  const vincitori = punti.map((p, i) => p === massimo ? i : -1).filter(i => i >= 0);

  // Le risposte: un pulsante per giocatore + "Pareggio"
  const opzioni = mani.map((_, i) => ({ testo: t("Giocatore {n}", { n: i + 1 }), giusta: vincitori.length === 1 && vincitori[0] === i }));
  opzioni.push({ testo: t("Pareggio (piatto diviso)"), giusta: vincitori.length > 1 });

  const testo = `
    <p class="domanda">${t("Chi vince la mano?")}</p>
    <p class="etichetta">${t("Carte comuni")}</p>${carteHTML(tavolo)}
    <div class="giocatori-quiz">
      ${mani.map((m, i) => `<div><p class="etichetta">${t("Giocatore {n}", { n: i + 1 })}</p>${carteHTML(m)}</div>`).join("")}
    </div>`;

  // Spiegazione: il punto di ognuno con le sue 5 carte migliori
  let righe = mani.map((m, i) => `
    <div class="riga-spiegazione ${vincitori.includes(i) ? "vincente" : ""}">
      <span>${vincitori.includes(i) ? "🏆" : "✖"} <strong>${t("Giocatore {n}", { n: i + 1 })}</strong>: ${nomePunto(punti[i])}</span>
      ${carteHTML(migliori5([...m, ...tavolo]), true)}
    </div>`).join("");

  const ordinati = punti.slice().sort((a, b) => b - a);
  let nota;
  if (vincitori.length > 1) {
    nota = t("Le 5 carte migliori hanno gli stessi valori: il piatto si divide. I semi non contano mai.");
  } else if (categoriaDa(ordinati[0]) === categoriaDa(ordinati[1])) {
    nota = t("Stessa combinazione: decidono le carte più alte, in ordine, fino alla quinta (il kicker).");
  } else {
    nota = t("Vince la combinazione più alta in classifica.");
  }

  return { tipo: "🏆 " + t("Chi vince?"), testo, opzioni, disposizione: "riga",
           spiegazione: righe + `<p class="consiglio">💡 ${nota}</p>` };
}

// ---------- 🃏 Che punto è? ----------
// Quanto spesso esce ogni punto nel quiz (i punti rari li facciamo uscire
// più spesso che nella realtà, sennò la scala reale non la vedresti mai)
const PESI_PUNTI = [1, 1.2, 1.2, 1, 1, 1, 1, 0.6, 0.4, 0.25];

function domandaChePunto() {
  // Scegliamo prima il punto da far uscire, poi peschiamo finché non esce
  const totalePesi = PESI_PUNTI.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalePesi, obiettivo = 0;
  while (r > PESI_PUNTI[obiettivo]) { r -= PESI_PUNTI[obiettivo]; obiettivo++; }

  let carte, p;
  for (let tentativo = 0; tentativo < 400000; tentativo++) {
    carte = pesca(7);
    p = valuta(carte, 7);
    if (indicePunto(p) === obiettivo) break;
  }

  const giusto = indicePunto(p);
  const mie = carte.slice(0, 2), tavolo = carte.slice(2);
  const migliori = migliori5(carte);
  const usate = migliori.filter(c => mie.includes(c)).length;

  // Le 10 risposte, dalla più forte alla più debole (come nella classifica)
  const opzioni = PUNTI_10.map((nome, i) => ({ testo: nome, giusta: i === giusto })).reverse();

  const testo = `
    <p class="domanda">${t("Qual è il tuo punto migliore?")}</p>
    <div class="giocatori-quiz">
      <div><p class="etichetta">${t("Le tue carte")}</p>${carteHTML(mie)}</div>
      <div><p class="etichetta">${t("Carte comuni")}</p>${carteHTML(tavolo)}</div>
    </div>`;

  const quante = usate === 0 ? t("usi nessuna delle tue carte: giochi il board")
               : usate === 1 ? t("usi 1 delle tue carte") : t("usi entrambe le tue carte");
  const spiegazione = `
    <div class="riga-spiegazione vincente">
      <span>🃏 <strong>${nomePunto(p)}</strong> · ${quante}</span>
      ${carteHTML(migliori, true)}
    </div>
    <p class="consiglio">💡 ${t("Conta solo il punto migliore di 5 carte, scelte tra le tue 2 e le 5 comuni.")}</p>`;

  return { tipo: "🃏 " + t("Che punto è?"), testo, opzioni, disposizione: "griglia", spiegazione };
}

// ---------- 🎲 Quante probabilità? ----------
// Tre tipi di domanda, a caso: percentuale pre-flop, outs, pot odds
function domandaProbabilita() {
  const r = Math.random();
  if (r < 0.4) return domandaPreflop();
  if (r < 0.75) return domandaOuts();
  return domandaPotOdds();
}

// Percentuale di vincita pre-flop (dalla tabella delle 169 mani)
function domandaPreflop() {
  const giocatori = [2, 3, 4, 6, 9][aCaso(5)];
  const mie = pesca(2);
  const nome = nomeManoIniziale(mie[0], mie[1]);
  const valore = MANI_INIZIALI[nome][giocatori - 2];      // es. 85.2
  const giusta = Math.round(valore);
  const media = 100 / giocatori;

  // Più giocatori → percentuali più piccole → risposte più vicine tra loro
  const passo = Math.max(4, Math.round(giusta * 0.25));
  const opzioni = opzioniNumeriche(giusta, passo, 1, 99, "%");

  const rapporto = valore / media;
  const giudizio = rapporto >= 2 ? t("🔥 più del doppio della media: mano da giocare forte")
                 : rapporto >= 1.2 ? t("👍 sopra la media del tavolo")
                 : rapporto >= 0.8 ? t("🤔 nella media del tavolo")
                 : t("⚠️ sotto la media del tavolo: spesso è un fold");

  const testo = `
    <p class="domanda">${t("Pre-flop, con <strong>{n} giocatori</strong> al tavolo: quante probabilità hai di vincere la mano?", { n: giocatori })}</p>
    <p class="etichetta">${t("Le tue carte")} (${nome})</p>${carteHTML(mie)}`;

  const spiegazione = `
    <p>${t("Con <strong>{mano}</strong> e {n} giocatori vinci il <strong>{p}%</strong> delle volte (avversari con carte casuali).",
           { mano: nome, n: giocatori, p: numeroLocale(valore) })}</p>
    <p>${t("La media del tavolo è {p}%: {giudizio}.", { p: percento(1 / giocatori), giudizio })}</p>
    <p class="consiglio">💡 ${t("Più avversari ci sono, più le percentuali scendono: una mano che è ottima testa a testa può diventare normale a tavolo pieno.")}</p>`;

  return { tipo: t("🎲 Percentuale pre-flop"), testo, opzioni, disposizione: "riga", spiegazione };
}

// Quanti outs hai? (al flop o al turn)
function domandaOuts() {
  const alFlop = Math.random() < 0.65;
  const comuni = alFlop ? 3 : 4;
  let mie, tavolo, outs;
  for (let tentativo = 0; tentativo < 500; tentativo++) {
    const carte = pesca(2 + comuni);
    mie = carte.slice(0, 2);
    tavolo = carte.slice(2);
    outs = contaOuts(mie, tavolo);
    // Cerchiamo situazioni interessanti: un progetto con un buon numero di outs
    if (outs.totale >= 4 && outs.totale <= 21) break;
  }

  const giusta = outs.totale;
  const opzioni = opzioniNumeriche(giusta, 2, 0, 30);
  const prob = probabilitaOuts(giusta, comuni);
  const moltiplica = alFlop ? 4 : 2;

  const testo = `
    <p class="domanda">${alFlop ? t("Al <strong>flop</strong>: quanti outs hai?") : t("Al <strong>turn</strong>: quanti outs hai?")}
       <small>${t("(carte che migliorano il tuo punto, non solo il tavolo)")}</small></p>
    <div class="giocatori-quiz">
      <div><p class="etichetta">${t("Le tue carte")}</p>${carteHTML(mie)}</div>
      <div><p class="etichetta">${t("Carte comuni")}</p>${carteHTML(tavolo)}</div>
    </div>`;

  let gruppi = "";
  for (const cat of Object.keys(outs.gruppi).sort((a, b) => b - a)) {
    gruppi += `<div class="riga-spiegazione">
                 <span>${CATEGORIE[cat]} · ${outs.gruppi[cat].length === 1 ? t("1 carta") : t("{n} carte", { n: outs.gruppi[cat].length })}</span>
                 ${carteHTML(outs.gruppi[cat], true)}
               </div>`;
  }

  const spiegazione = `
    <p>${t("Ora hai <strong>{punto}</strong>. Gli outs sono <strong>{n}</strong>:", { punto: CATEGORIE[outs.catOra], n: giusta })}</p>
    ${gruppi}
    <p>${alFlop
      ? t("Probabilità di prenderne almeno uno tra turn e river: <strong>{p}%</strong>.", { p: percento(prob) })
      : t("Probabilità di prenderne almeno uno al river: <strong>{p}%</strong>.", { p: percento(prob) })}</p>
    <p class="consiglio">💡 ${t("Regola del {x}: {n} outs × {x} ≈ {r}%.", { x: moltiplica, n: giusta, r: giusta * moltiplica })}</p>`;

  return { tipo: t("🎲 Outs"), testo, opzioni, disposizione: "riga", spiegazione };
}

// Pot odds: che percentuale ti serve per vedere?
function domandaPotOdds() {
  const piatto = (2 + aCaso(19)) * 50;                       // da 100 a 1.000
  const frazione = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1][aCaso(6)];
  const puntata = Math.max(50, Math.round(piatto * frazione / 50) * 50);
  const serve = puntata / (piatto + puntata);
  const giusta = Math.round(serve * 100);
  // L'errore classico: dividere per il solo piatto, dimenticando la tua chiamata
  const trappola = Math.round(puntata / piatto * 100);
  const opzioni = opzioniNumeriche(giusta, 5, 5, 95, "%", trappola);

  const pi = numeroLocale(piatto), pu = numeroLocale(puntata);
  const testo = `
    <p class="domanda">${t("Nel piatto ci sono <strong>{piatto} fiches</strong> (puntata dell'avversario compresa). Per vedere devi pagare <strong>{puntata}</strong>.",
                           { piatto: pi, puntata: pu })}</p>
    <p class="domanda">${t("Quale percentuale di vincita ti serve, come minimo, perché ti convenga vedere?")}</p>`;

  const spiegazione = `
    <p>${t("Rischi {puntata} per vincere un piatto finale di {totale}:", { puntata: pu, totale: numeroLocale(piatto + puntata) })}</p>
    <p class="formula">${pu} ÷ (${pi} + ${pu})
       = <strong>${percento(serve)}%</strong></p>
    <p class="consiglio">💡 ${t("Attenzione all'errore più comune: dividere solo per il piatto ({puntata} ÷ {piatto} = {p}%). Il piatto finale comprende anche la tua chiamata!",
                               { puntata: pu, piatto: pi, p: trappola })}</p>`;

  return { tipo: t("🎲 Pot odds"), testo, opzioni, disposizione: "riga", spiegazione };
}

// ---------- 📖 Regole e posizioni ----------
function domandaRegole() {
  // Evitiamo di ripetere la stessa domanda nella stessa partita
  const libere = DOMANDE_REGOLE.filter(d => !partita.usate.has(d.domanda));
  const d = (libere.length ? libere : DOMANDE_REGOLE)[aCaso(libere.length || DOMANDE_REGOLE.length)];
  partita.usate.add(d.domanda);

  // Le domande sono scritte in italiano in domande-regole.js:
  // t() le traduce nella lingua scelta (come tutti gli altri testi)
  const opzioni = mescola([
    { testo: t(d.giusta), giusta: true },
    ...d.sbagliate.map(s => ({ testo: t(s), giusta: false })),
  ]);
  return { tipo: "📖 " + t("Regole e posizioni"), testo: `<p class="domanda">${t(d.domanda)}</p>`,
           opzioni, disposizione: "colonna", spiegazione: `<p>${t(d.spiega)}</p>` };
}

const GENERATORI = {
  "chi-vince": domandaChiVince,
  "che-punto": domandaChePunto,
  "probabilita": domandaProbabilita,
  "regole": domandaRegole,
};

// ============================================================
//  LO SVOLGIMENTO DELLA PARTITA
// ============================================================

// Disegna le schede di scelta dell'allenamento, con il record di ognuno
function disegnaScelta() {
  const record = leggiRecord();
  document.getElementById("scelta-quiz").innerHTML = MODI.map(m => `
    <button type="button" class="scheda-quiz ${partita && partita.modo === m.id ? "scelta" : ""}" data-modo="${m.id}">
      <span class="icona-grande">${m.icona}</span>
      <strong>${m.nome}</strong>
      <small>${m.descrizione}</small>
      <span class="record">${record[m.id] !== undefined ? `🏅 ${t("Record")}: ${record[m.id]}/${DOMANDE_PER_PARTITA}` : t("Mai giocato")}</span>
    </button>`).join("");
}

// Prima di iniziare: un invito a scegliere
function disegnaAttesa() {
  document.getElementById("quiz").innerHTML = `
    <p class="attesa">👆 ${t("Scegli un allenamento per sederti al tavolo.")}</p>`;
}

function iniziaPartita(modo) {
  partita = { modo, numero: 0, giuste: 0, serie: 0, serieMassima: 0, usate: new Set(), domanda: null, risposto: false };
  disegnaScelta();
  prossimaDomanda();
  document.getElementById("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
}

function prossimaDomanda() {
  if (partita.numero >= DOMANDE_PER_PARTITA) return finePartita();

  // Nel "Misto" ogni domanda è di un tipo diverso, a caso
  const modo = partita.modo === "misto"
    ? Object.keys(GENERATORI)[aCaso(4)]
    : partita.modo;

  partita.domanda = GENERATORI[modo]();
  partita.numero++;
  partita.risposto = false;
  disegnaDomanda();
}

// La testata del quiz: domanda N di 10, risposte giuste, serie
function testataHTML() {
  const fatte = partita.numero - (partita.risposto ? 0 : 1);
  return `
    <div class="testata-quiz">
      <span class="tipo-domanda">${partita.domanda.tipo}</span>
      <span>${t("Domanda")} <strong>${partita.numero}</strong>/${DOMANDE_PER_PARTITA}</span>
      <span>✅ <strong>${partita.giuste}</strong></span>
      <span class="${partita.serie >= 3 ? "in-serie" : ""}">🔥 ${t("Serie")} ${partita.serie}</span>
    </div>
    <div class="avanzamento" aria-hidden="true"><span style="width:${fatte / DOMANDE_PER_PARTITA * 100}%"></span></div>`;
}

function disegnaDomanda() {
  const d = partita.domanda;
  document.getElementById("quiz").innerHTML = `
    <div id="testata">${testataHTML()}</div>
    <div class="testo-domanda">${d.testo}</div>
    <div class="opzioni ${d.disposizione}">
      ${d.opzioni.map((o, i) => `
        <button type="button" class="opzione" data-risposta="${i}">
          <span class="tasto">${i < 9 ? i + 1 : ""}</span>${o.testo}
        </button>`).join("")}
    </div>
    <div id="spiegazione"></div>`;
}

function rispondi(indice) {
  if (!partita || partita.risposto) return;
  partita.risposto = true;
  const d = partita.domanda;
  const giusta = d.opzioni[indice].giusta;

  if (giusta) {
    partita.giuste++;
    partita.serie++;
    partita.serieMassima = Math.max(partita.serieMassima, partita.serie);
  } else {
    partita.serie = 0;
  }

  // Coloriamo i pulsanti: verde la risposta giusta, rosso quella sbagliata scelta
  document.querySelectorAll(".opzione").forEach((b, i) => {
    b.disabled = true;
    if (d.opzioni[i].giusta) b.classList.add("giusta");
    else if (i === indice) b.classList.add("sbagliata");
  });

  // Aggiorniamo la testata (punteggio e barra)
  document.getElementById("testata").innerHTML = testataHTML();

  // Frasi "di gioco" per la risposta
  const brava = [t("Bel colpo! 🎯"), t("Da vero squalo! 🦈"), t("Esatto, piatto tuo! 💰"), t("Giusto! Occhio da campione 👀")];
  const sbagliata = [t("Ahi, bad beat! 😬"), t("Non questa volta… 🃏"), t("Ti hanno letto il bluff! 🙈")];
  const frase = giusta ? brava[aCaso(brava.length)] : sbagliata[aCaso(sbagliata.length)];
  const ultima = partita.numero >= DOMANDE_PER_PARTITA;

  const box = document.getElementById("spiegazione");
  box.innerHTML = `
    <div class="spiegazione ${giusta ? "si" : "no"}">
      <p class="esito-risposta">${frase}</p>
      ${d.spiegazione}
      <button type="button" class="pulsante-principale" id="prossima">
        ${ultima ? t("Vedi il risultato 🏁") : t("Prossima domanda ➜")}
      </button>
    </div>`;
  disegnaCarte();
  document.getElementById("prossima").focus({ preventScroll: true });
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Fine della partita: punteggio, livello raggiunto, record
function finePartita() {
  const punti = partita.giuste;
  const record = leggiRecord();
  const precedente = record[partita.modo];
  const nuovoRecord = precedente === undefined || punti > precedente;
  if (nuovoRecord) { record[partita.modo] = punti; salvaRecord(record); }

  let livello;
  if (punti === 10)     livello = { icona: "🏆", nome: t("Campione"),  frase: t("Partita perfetta: il tavolo è tuo!") };
  else if (punti >= 8)  livello = { icona: "🦈", nome: t("Squalo"),    frase: t("Gioco solido: gli avversari ti temono.") };
  else if (punti >= 5)  livello = { icona: "♣",  nome: t("Regolare"),  frase: t("Buona base: ancora qualche mano e sali di livello.") };
  else                  livello = { icona: "🐟", nome: t("Pesciolino"), frase: t("Tutti partono da qui: rigioca e vedrai che migliori!") };

  const modo = MODI.find(m => m.id === partita.modo);
  document.getElementById("quiz").innerHTML = `
    <div class="finale">
      <p class="etichetta">${modo.icona} ${modo.nome} · ${t("fine partita")}</p>
      <div class="icona-livello">${livello.icona}</div>
      <p class="punteggio-finale"><strong>${punti}</strong>/${DOMANDE_PER_PARTITA}</p>
      <p class="nome-livello">${t("Livello")}: <strong>${livello.nome}</strong></p>
      <p>${livello.frase}</p>
      <p class="aiuto">${t("Serie migliore")}: 🔥 ${partita.serieMassima} ·
        ${nuovoRecord ? `🏅 <strong>${t("Nuovo record!")}</strong>` : `${t("Record")}: ${precedente}/${DOMANDE_PER_PARTITA}`}</p>
      <div class="pulsanti-mano centrati">
        <button type="button" class="pulsante-principale" id="rigioca">${t("↺ Rigioca")}</button>
        <button type="button" class="pulsante-secondario" id="cambia">${t("Cambia allenamento")}</button>
      </div>
    </div>`;
  disegnaScelta();
  document.getElementById("rigioca").focus({ preventScroll: true });
}

// ---------- Avvio ----------

document.addEventListener("DOMContentLoaded", () => {
  disegnaScelta();
  disegnaAttesa();

  document.getElementById("scelta-quiz").addEventListener("click", evento => {
    const b = evento.target.closest("[data-modo]");
    if (b) iniziaPartita(b.dataset.modo);
  });

  document.getElementById("quiz").addEventListener("click", evento => {
    const b = evento.target.closest("button");
    if (!b) return;
    if (b.dataset.risposta !== undefined) return rispondi(Number(b.dataset.risposta));
    if (b.id === "prossima") return prossimaDomanda();
    if (b.id === "rigioca") return iniziaPartita(partita.modo);
    if (b.id === "cambia") {
      partita = null;
      disegnaScelta();
      disegnaAttesa();
      document.getElementById("scelta-quiz").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Tastiera, per chi gioca dal computer: 1-9 per rispondere.
  // (Invio funziona già da solo: il pulsante "Prossima" è selezionato)
  document.addEventListener("keydown", evento => {
    if (!partita || evento.target.matches("input, textarea")) return;
    const n = Number(evento.key);
    if (!partita.risposto && n >= 1 && n <= partita.domanda.opzioni.length) rispondi(n - 1);
  });
});
