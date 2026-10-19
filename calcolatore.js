// ============================================================
//  calcolatore.js — l'interfaccia del Calcolatore.
//  L'utente sceglie: le sue carte, quanti giocatori ci sono,
//  a che punto è la mano (pre-flop, flop, turn, river).
//  Appena i dati sono completi, chiediamo al motore (motore.js)
//  di calcolare la percentuale e la mostriamo.
// ============================================================

// Quante carte comuni ci sono in ogni fase
const CARTE_PER_FASE = { preflop: 0, flop: 3, turn: 4, river: 5 };
const NOMI_FASE = { preflop: t("pre-flop"), flop: t("flop"), turn: t("turn"), river: t("river") };

// Lo "stato" del calcolatore: tutto ciò che l'utente ha scelto.
// Le carte sono numeri da 0 a 51 (vedi valutatore.js), null = posto vuoto.
const stato = {
  fase: "preflop",
  giocatori: 9,
  mie: [null, null],
  tavolo: [null, null, null, null, null],
};

// Le mani precedenti (l'ultima è in fondo), per il pulsante "Mano precedente".
// Ne teniamo al massimo 20.
const maniPrecedenti = [];

// Salva la mano attuale tra le precedenti (solo se c'è almeno una carta)
function salvaManoAttuale() {
  const vuota = [...stato.mie, ...stato.tavolo].every(c => c === null);
  if (vuota) return;
  maniPrecedenti.push({
    fase: stato.fase,
    giocatori: stato.giocatori,
    mie: stato.mie.slice(),        // slice() = copia, così non cambia più
    tavolo: stato.tavolo.slice(),
  });
  if (maniPrecedenti.length > 20) maniPrecedenti.shift();
}

// Torna all'ultima mano salvata
function tornaManoPrecedente() {
  const mano = maniPrecedenti.pop();
  if (!mano) return;
  Object.assign(stato, mano);
  ridisegnaTutto();
}

let motore = null;          // il Web Worker che calcola
let ultimaEquity = null;    // l'ultima percentuale calcolata (serve alle pot odds)

// ---------- Disegno delle scelte ----------

// Pulsanti da 2 a 9 giocatori
function disegnaSceltaGiocatori() {
  let html = "";
  for (let n = 2; n <= 9; n++) html += `<button type="button" data-giocatori="${n}">${n}</button>`;
  document.getElementById("scelta-giocatori").innerHTML = html;
}

// Evidenzia i pulsanti scelti (fase e giocatori)
function aggiornaPulsanti() {
  document.querySelectorAll("#scelta-fase button").forEach(b =>
    b.setAttribute("aria-pressed", b.dataset.fase === stato.fase));
  document.querySelectorAll("#scelta-giocatori button").forEach(b =>
    b.setAttribute("aria-pressed", Number(b.dataset.giocatori) === stato.giocatori));
}

// Sotto ogni posto del tavolo scriviamo a quale fase appartiene
const NOMI_POSTI_TAVOLO = [t("Flop"), t("Flop"), t("Flop"), t("Turn"), t("River")];

// Un posto carta: pieno (carta disegnata) o vuoto (riquadro tratteggiato).
// "attivo" = serve nella fase scelta; quelli non ancora attivi sono più tenui,
// ma si riempiono lo stesso: la fase avanza da sola.
function postoHTML(carta, gruppo, indice, attivo, nome = "") {
  const etichetta = nome ? `<small>${nome}</small>` : "";
  if (carta === null) {
    return `<span class="posto-con-nome">
              <span class="posto-carta vuoto ${attivo ? "" : "prossimo"}" aria-label="${t("posto vuoto")}"></span>${etichetta}
            </span>`;
  }
  return `<span class="posto-con-nome">
            <button type="button" class="posto-carta pieno" data-gruppo="${gruppo}" data-indice="${indice}"
                    title="${t("Tocca per togliere")}">${cartaHTML(codiceDaNumero(carta))}</button>${etichetta}
          </span>`;
}

// Disegna i posti: 2 per le tue carte, 5 per il tavolo
function disegnaPosti() {
  document.getElementById("posti-mie").innerHTML =
    stato.mie.map((c, i) => postoHTML(c, "mie", i, true)).join("");

  const attivi = CARTE_PER_FASE[stato.fase];
  document.getElementById("posti-tavolo").innerHTML =
    stato.tavolo.map((c, i) => postoHTML(c, "tavolo", i, i < attivi, NOMI_POSTI_TAVOLO[i])).join("");
}

// La fase giusta per un certo numero di carte comuni
function faseDaCarte(quante) {
  if (quante === 0) return "preflop";
  if (quante <= 3) return "flop";
  return quante === 4 ? "turn" : "river";
}

// Disegna il mazzo da cui scegliere: 4 file (una per seme) da 13 carte
function disegnaMazzo() {
  const usate = new Set([...stato.mie, ...stato.tavolo].filter(c => c !== null));
  let html = "";
  for (let seme = 0; seme < 4; seme++) {
    for (let valore = 12; valore >= 0; valore--) {   // dall'Asso al 2
      const n = valore * 4 + seme;
      const rossa = seme === 1 || seme === 2;
      html += `<button type="button" class="mini-carta ${rossa ? "rossa" : "nera"}"
                       data-carta="${n}" ${usate.has(n) ? "disabled" : ""}
                       aria-label="${codiceDaNumero(n)}">
                 ${VALORI[valore]}<span>${SEMI_CARTE[seme]}</span>
               </button>`;
    }
  }
  document.getElementById("mazzo-scelta").innerHTML = html;
}

function ridisegnaTutto() {
  aggiornaPulsanti();
  // "Mano precedente" si può usare solo se c'è una mano salvata
  document.getElementById("mano-precedente").disabled = maniPrecedenti.length === 0;
  disegnaPosti();
  disegnaMazzo();
  disegnaOuts();
  disegnaTabella();
  calcola();
}

// ---------- Azioni dell'utente ----------

// Aggiunge una carta nel primo posto libero: prima le tue 2,
// poi le carte comuni. Se servono più carte di quelle della fase
// scelta, la fase avanza da sola (pre-flop → flop → turn → river).
function aggiungiCarta(n) {
  const i = stato.mie.indexOf(null);
  if (i >= 0) { stato.mie[i] = n; return ridisegnaTutto(); }

  const j = stato.tavolo.indexOf(null);
  if (j >= 0) {
    stato.tavolo[j] = n;
    const quante = stato.tavolo.filter(c => c !== null).length;
    if (quante > CARTE_PER_FASE[stato.fase]) stato.fase = faseDaCarte(quante);
    return ridisegnaTutto();
  }

  // Tutti i 7 posti sono pieni: avvisiamo con un piccolo "scossone"
  const posti = document.querySelector(".posti-carte");
  posti.classList.remove("scossa");
  void posti.offsetWidth;            // trucco per far ripartire l'animazione
  posti.classList.add("scossa");
}

// Cambia la fase: se si torna indietro, le carte comuni in più si tolgono
function cambiaFase(fase) {
  stato.fase = fase;
  const attivi = CARTE_PER_FASE[fase];
  for (let i = attivi; i < 5; i++) stato.tavolo[i] = null;
  ridisegnaTutto();
}

// ---------- Il calcolo ----------

function calcola() {
  const box = document.getElementById("risultato");

  // Fermiamo un eventuale calcolo precedente (i dati sono cambiati)
  if (motore) { motore.terminate(); motore = null; }
  ultimaEquity = null;
  aggiornaPotOdds();

  // Controlliamo che le scelte siano complete
  const mieScelte = stato.mie.filter(c => c !== null).length;
  const servono = CARTE_PER_FASE[stato.fase];
  const tavoloScelte = stato.tavolo.slice(0, servono).filter(c => c !== null).length;

  if (mieScelte < 2) {
    box.innerHTML = `<p class="attesa">🃏 ${mieScelte === 0
      ? t("Scegli le tue 2 carte per vedere la percentuale.")
      : t("Scegli ancora 1 carta per vedere la percentuale.")}</p>`;
    return;
  }
  if (tavoloScelte < servono) {
    const mancano = servono - tavoloScelte;
    box.innerHTML = `<p class="attesa">🃏 ${mancano === 1
      ? t("Per il {fase} scegli ancora 1 carta comune.", { fase: NOMI_FASE[stato.fase] })
      : t("Per il {fase} scegli ancora {n} carte comuni.", { fase: NOMI_FASE[stato.fase], n: mancano })}</p>`;
    return;
  }

  const mie = stato.mie.slice();
  const tavolo = stato.tavolo.slice(0, servono);

  // Facciamo partire il motore
  motore = new Worker("motore.js");
  motore.onmessage = evento => mostraRisultato(evento.data, mie, tavolo);
  motore.postMessage({ mie, tavolo, avversari: stato.giocatori - 1 });
}

// Percentuale scritta come si usa nella lingua scelta: 0,61234 → "61,2" (it) o "61.2" (en)
function percento(x, decimali = 1) {
  return numeroLocale(x * 100, { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
}

function mostraRisultato(r, mie, tavolo) {
  const box = document.getElementById("risultato");
  const equity = r.quota / r.prove;       // la tua parte di piatto in media
  const vinci = r.vittorie / r.prove;
  const pari = r.pareggi / r.prove;
  const perdi = 1 - vinci - pari;

  // Le pot odds usano questa percentuale: aggiorniamole
  ultimaEquity = equity;
  aggiornaPotOdds();

  // Margine di errore della simulazione (al 95%)
  const margine = 1.96 * Math.sqrt(equity * (1 - equity) / r.prove);

  // La "quota media": se tutti fossero uguali, ognuno vincerebbe 1 volta su N
  const media = 1 / stato.giocatori;
  let giudizio, classe;
  if (equity >= media * 2)        { giudizio = t("🔥 Mano fortissima: più del doppio della media del tavolo"); classe = "ottima"; }
  else if (equity >= media * 1.2) { giudizio = t("👍 Sopra la media del tavolo"); classe = "buona"; }
  else if (equity >= media * 0.8) { giudizio = t("🤔 Nella media del tavolo"); classe = "media"; }
  else                            { giudizio = t("⚠️ Sotto la media del tavolo"); classe = "debole"; }

  // Il tuo punto in questo momento (solo se ci sono carte comuni)
  let puntoAttuale = "";
  if (tavolo.length >= 3) {
    puntoAttuale = `<p class="punto-attuale">${t("Il tuo punto ora:")} <strong>${nomePunto(valuta([...mie, ...tavolo], mie.length + tavolo.length))}</strong></p>`;
  }

  // Che punto farai al river (inutile al river: lo sai già)
  let distribuzione = "";
  if (tavolo.length < 5) {
    let righe = "";
    for (let cat = 8; cat >= 0; cat--) {
      const p = r.puntiFinali[cat] / r.prove;
      if (p < 0.0005) continue;  // sotto lo 0,05% non lo mostriamo
      righe += `<div class="riga-punto">
                  <span class="nome">${CATEGORIE[cat]}</span>
                  <span class="barra"><span style="width:${Math.max(p * 100, 0.5)}%"></span></span>
                  <span class="valore">${percento(p)}%</span>
                </div>`;
    }
    distribuzione = `<h3>${t("Che punto avrai al river?")}</h3><div class="distribuzione">${righe}</div>`;
  }

  box.innerHTML = `
    <p class="etichetta">${t("Le tue probabilità di vincere la mano")}</p>
    <div class="percentuale-grande ${classe}">${percento(equity)}<span>%</span></div>
    <div class="barra-esito" aria-hidden="true">
      <span class="vinci" style="width:${vinci * 100}%"></span>
      <span class="pari"  style="width:${pari * 100}%"></span>
      <span class="perdi" style="width:${perdi * 100}%"></span>
    </div>
    <p class="dettaglio-esito">
      <span class="pallino vinci"></span>${t("Vinci")} ${percento(vinci)}%
      <span class="pallino pari"></span>${t("Pareggi")} ${percento(pari)}%
      <span class="pallino perdi"></span>${t("Perdi")} ${percento(perdi)}%
    </p>
    <p class="giudizio ${classe}">${giudizio} (${t("{p}% con {n} giocatori", { p: percento(media), n: stato.giocatori })})</p>
    ${puntoAttuale}
    ${distribuzione}
    <p class="nota-calcolo">
      ${r.finito ? "✓" : "⏳"} ${t("{n} mani simulate · precisione ±{p}%", { n: numeroLocale(r.prove), p: percento(margine, 2) })}<br>
      ${t("Gli avversari hanno carte casuali. Se qualcuno passa, abbassa il numero dei giocatori.")}
    </p>`;
}

// ---------- Gli outs ----------
// Un "out" è una carta che, se esce, migliora il TUO punto.
// Il conto lo fa contaOuts() in valutatore.js (lo usa anche l'Allenamento).

function disegnaOuts() {
  const box = document.getElementById("outs");
  const titolo = `<h2 class="titolo-pannello">${t("🎯 I tuoi outs")}</h2>`;
  const n = CARTE_PER_FASE[stato.fase];

  if (stato.fase === "preflop" || stato.fase === "river") {
    box.innerHTML = titolo + `<p class="aiuto">${t("Gli outs si contano al <strong>flop</strong> e al <strong>turn</strong>: sono le carte che, se escono, migliorano il tuo punto.")}</p>`;
    return;
  }

  const mie = stato.mie;
  const tavolo = stato.tavolo.slice(0, n);
  if (mie.includes(null) || tavolo.includes(null)) {
    box.innerHTML = titolo + `<p class="aiuto">${t("Completa le carte per scoprire i tuoi outs.")}</p>`;
    return;
  }

  // Proviamo una per una tutte le carte che possono ancora uscire
  const { totale, gruppi, catOra } = contaOuts(mie, tavolo);

  if (totale === 0) {
    box.innerHTML = titolo + `<p class="aiuto">${t("Nessuna carta migliora il tuo punto in modo utile.")}
      ${catOra >= 4 ? t("Hai già un punto forte: proteggilo! 💪") : t("Mano da valutare con prudenza.")}</p>`;
    return;
  }

  // Probabilità di prendere almeno un out
  const prob = probabilitaOuts(totale, n);
  const regola = stato.fase === "flop" ? totale * 4 : totale * 2;

  // Le carte, raggruppate per il punto che ti danno (dal più forte)
  let elenco = "";
  for (const cat of Object.keys(gruppi).sort((a, b) => b - a)) {
    const carte = gruppi[cat].map(codiceDaNumero).join(" ");
    elenco += `<div class="gruppo-outs">
                 <p class="etichetta">${CATEGORIE[cat]} · ${gruppi[cat].length === 1 ? t("1 carta") : t("{n} carte", { n: gruppi[cat].length })}</p>
                 <div class="mano" data-carte="${carte}"></div>
               </div>`;
  }

  box.innerHTML = titolo + `
    <p><span class="numero-outs">${totale}</span> ${stato.fase === "flop"
       ? t("outs · <strong>{p}%</strong> di prenderne almeno uno tra turn e river", { p: percento(prob) })
       : t("outs · <strong>{p}%</strong> di prenderne almeno uno al river", { p: percento(prob) })}</p>
    ${elenco}
    <p class="consiglio">💡 ${t("<strong>Trucco da campione:</strong> la regola del {x}. Moltiplica gli outs per {x} e hai la percentuale a occhio: {n} × {x} ≈ {r}%.",
       { x: stato.fase === "flop" ? 4 : 2, n: totale, r: regola })}</p>`;
  disegnaCarte(); // trasforma i data-carte appena scritti in carte disegnate
}

// ---------- Le pot odds ----------
// Se devi pagare 100 per vincere un piatto di 300, rischi 100 per vincerne 400 in totale:
// ti conviene se vinci almeno 100 / 400 = 25% delle volte.
function aggiornaPotOdds() {
  const esito = document.getElementById("pot-esito");
  const piatto = parseFloat(document.getElementById("pot-piatto").value);
  const puntata = parseFloat(document.getElementById("pot-puntata").value);

  if (!(piatto >= 0) || !(puntata > 0)) { esito.innerHTML = ""; return; }

  const serve = puntata / (piatto + puntata);   // percentuale minima per guadagnarci

  if (ultimaEquity === null) {
    esito.innerHTML = `<div class="verdetto"><strong>${t("Ti serve almeno {p}%", { p: percento(serve) })}</strong>
      <p>${t("Scegli le carte per sapere se ce l'hai.")}</p></div>`;
    return;
  }

  const conviene = ultimaEquity >= serve;
  // Valore atteso: quanto guadagni (o perdi) in media ogni volta che vedi
  const valoreAtteso = ultimaEquity * (piatto + puntata) - puntata;
  const fiches = numeroLocale(Math.abs(valoreAtteso), { maximumFractionDigits: 1 });

  esito.innerHTML = `
    <div class="verdetto ${conviene ? "si" : "no"}">
      <strong>${conviene ? t("✅ Sì, conviene vedere") : t("❌ No, meglio passare")}</strong>
      <p>${t("Ti serve almeno <b>{serve}%</b>, tu hai <b>{hai}%</b>.", { serve: percento(serve), hai: percento(ultimaEquity) })}</p>
      <p>${valoreAtteso >= 0
        ? t("In media guadagni <b>{n} fiches</b> ogni volta che vedi.", { n: fiches })
        : t("In media perdi <b>{n} fiches</b> ogni volta che vedi.", { n: fiches })}</p>
    </div>
    <p class="nota-calcolo">${t("Il calcolo non tiene conto delle puntate future: è la base, poi contano anche la lettura degli avversari e la posizione.")}</p>`;
}

// ---------- La tabella delle 169 mani iniziali ----------

// Colore della cella: rosso sotto la media del tavolo, giallo nella media, verde sopra
function coloreCella(equity, media) {
  const rapporto = equity / media;
  // log2: 0,5× la media → -1, la media → 0, il doppio → +1
  const quota = Math.min(1, Math.max(0, (Math.log2(rapporto) + 1) / 2.5));
  return `hsl(${Math.round(quota * 130)}, 70%, 58%)`;
}

function disegnaTabella() {
  if (typeof MANI_INIZIALI === "undefined") return;   // dati non ancora pronti
  const g = stato.giocatori;
  const media = 100 / g;
  const attuale = stato.mie.includes(null) ? "" : nomeManoIniziale(stato.mie[0], stato.mie[1]);

  document.getElementById("spiega-tabella").innerHTML =
    t("Percentuale di vincita di ogni mano iniziale con <strong>{n} giocatori</strong> (avversari con carte casuali). Media del tavolo: <strong>{p}%</strong>. Cambia il numero di giocatori qui sopra e la tabella si aggiorna.",
      { n: g, p: percento(media / 100) });

  let html = "";
  for (let riga = 12; riga >= 0; riga--) {
    for (let colonna = 12; colonna >= 0; colonna--) {
      // Sopra la diagonale stesso seme, sotto semi diversi
      let alta, bassa, tipo;
      if (riga === colonna)    { alta = riga;    bassa = riga;    tipo = "p"; }
      else if (colonna < riga) { alta = riga;    bassa = colonna; tipo = "s"; }
      else                     { alta = colonna; bassa = riga;    tipo = "o"; }

      const nome = VALORI[alta] + VALORI[bassa] + (tipo === "p" ? "" : tipo);
      const equity = MANI_INIZIALI[nome][g - 2];
      html += `<button type="button" class="cella-mano ${tipo} ${nome === attuale ? "attuale" : ""}"
                       style="background:${coloreCella(equity, media)}"
                       data-alta="${alta}" data-bassa="${bassa}" data-tipo="${tipo}"
                       title="${nome}: ${numeroLocale(equity)}%">
                 <b>${nome}</b><span>${Math.round(equity)}%</span>
               </button>`;
    }
  }
  document.getElementById("griglia-mani").innerHTML = html;
}

// Tocco su una cella: mettiamo quella mano nel calcolatore,
// scegliendo semi liberi (che non siano già sul tavolo)
function scegliManoIniziale(alta, bassa, tipo) {
  const occupate = new Set(stato.tavolo.filter(c => c !== null));
  for (let s1 = 0; s1 < 4; s1++) {
    for (let s2 = 0; s2 < 4; s2++) {
      if (tipo === "s" && s1 !== s2) continue;          // stesso seme
      if (tipo !== "s" && s1 === s2) continue;          // semi diversi (anche le coppie)
      const c1 = alta * 4 + s1, c2 = bassa * 4 + s2;
      if (occupate.has(c1) || occupate.has(c2)) continue;
      salvaManoAttuale();   // così si può tornare alla mano di prima
      stato.mie = [c1, c2];
      ridisegnaTutto();
      document.querySelector(".calcolatore").scrollIntoView({ behavior: "smooth" });
      return;
    }
  }
}

// ---------- Avvio ----------

document.addEventListener("DOMContentLoaded", () => {
  disegnaSceltaGiocatori();

  // Un solo "ascoltatore" per tutti i clic della pagina del calcolatore
  document.querySelector(".calcolatore").addEventListener("click", evento => {
    const b = evento.target.closest("button");
    if (!b) return;

    if (b.dataset.fase) return cambiaFase(b.dataset.fase);
    if (b.dataset.giocatori) { stato.giocatori = Number(b.dataset.giocatori); return ridisegnaTutto(); }
    if (b.dataset.carta) return aggiungiCarta(Number(b.dataset.carta));
    if (b.dataset.gruppo) {                     // tocco su una carta già scelta: la togliamo
      stato[b.dataset.gruppo][Number(b.dataset.indice)] = null;
      return ridisegnaTutto();
    }
    if (b.id === "mano-precedente") return tornaManoPrecedente();
    if (b.id === "nuova-mano") {
      salvaManoAttuale();   // la mano di adesso diventa la "precedente"
      stato.mie = [null, null];
      stato.tavolo = [null, null, null, null, null];
      stato.fase = "preflop";
      return ridisegnaTutto();
    }
  });

  // Tocco su una cella della tabella delle mani iniziali
  document.getElementById("griglia-mani").addEventListener("click", evento => {
    const cella = evento.target.closest(".cella-mano");
    if (cella) scegliManoIniziale(Number(cella.dataset.alta), Number(cella.dataset.bassa), cella.dataset.tipo);
  });

  // Pot odds: ricalcoliamo mentre scrivi
  document.getElementById("pot-piatto").addEventListener("input", aggiornaPotOdds);
  document.getElementById("pot-puntata").addEventListener("input", aggiornaPotOdds);

  ridisegnaTutto();
});
