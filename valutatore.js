// ============================================================
//  valutatore.js — riconosce il punto di una mano di poker.
//  Dato un gruppo di carte (fino a 7) trova il miglior punto
//  di 5 carte e gli dà un PUNTEGGIO: più è alto, più il punto
//  è forte. Così confrontare due mani è facile: vince il
//  punteggio più alto, e se sono uguali è pareggio.
//
//  Lo usano: il motore del Calcolatore (motore.js) e, più avanti,
//  i quiz dell'Allenamento.
// ============================================================

// Ogni carta è un numero da 0 a 51:
//   valore = Math.floor(numero / 4)  →  0 = "2", 1 = "3", ... 12 = "A"
//   seme   = numero % 4              →  0 = ♠, 1 = ♥, 2 = ♦, 3 = ♣
// Nel Web Worker del Calcolatore lingua.js non c'è: lì t() lascia il testo com'è
if (typeof t === "undefined") self.t = testo => testo;

const VALORI = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SEMI_CARTE = ["♠", "♥", "♦", "♣"];

// Da numero a testo ("A♠") e viceversa
function codiceDaNumero(n) { return VALORI[n >> 2] + SEMI_CARTE[n & 3]; }
function numeroDaCodice(codice) {
  const seme = codice.slice(-1);
  const valore = codice.slice(0, -1);
  return VALORI.indexOf(valore) * 4 + SEMI_CARTE.indexOf(seme);
}

// Le 9 categorie di punto, dalla più debole (0) alla più forte (8)
const CATEGORIE = [
  t("Carta alta"), t("Coppia"), t("Doppia coppia"), t("Tris"), t("Scala"),
  t("Colore"), t("Full"), t("Poker"), t("Scala colore"),
];

// Il punteggio mette insieme categoria e carte che contano (fino a 5),
// ognuna in una "cifra" da 0 a 15. Esempio: coppia di K con A, 9, 4
// → categoria 1, poi K, A, 9, 4.
function punteggio(categoria, a, b, c, d, e) {
  return categoria * 1048576 + (a || 0) * 65536 + (b || 0) * 4096
       + (c || 0) * 256 + (d || 0) * 16 + (e || 0);
}

// Cerca la scala più alta in una "maschera" di valori
// (bit 0 acceso = c'è un 2, bit 12 acceso = c'è un Asso).
// Restituisce il valore della carta più alta della scala, oppure -1.
function scalaPiuAlta(maschera) {
  // Spostiamo tutto di un posto e mettiamo l'Asso anche in fondo,
  // così vale 1 nella scala A-2-3-4-5.
  const m = (maschera << 1) | ((maschera >> 12) & 1);
  for (let alto = 13; alto >= 4; alto--) {
    // 31 in binario è 11111: cinque valori di fila
    if (((m >> (alto - 4)) & 31) === 31) return alto - 1;
  }
  return -1;
}

// Contenitori riutilizzati a ogni chiamata (più veloce: la funzione
// viene chiamata milioni di volte durante una simulazione).
const _conta = new Int8Array(13);
const _contaSeme = new Int8Array(4);
const _mascheraSeme = new Int32Array(4);

// Calcola il punteggio delle prime n carte dell'elenco "carte".
function valuta(carte, n) {
  _conta.fill(0);
  _contaSeme.fill(0);
  _mascheraSeme.fill(0);
  let maschera = 0; // quali valori ci sono, senza guardare il seme

  for (let i = 0; i < n; i++) {
    const valore = carte[i] >> 2;
    const seme = carte[i] & 3;
    _conta[valore]++;
    _contaSeme[seme]++;
    _mascheraSeme[seme] |= 1 << valore;
    maschera |= 1 << valore;
  }

  // --- Colore e scala colore ---
  // Con 7 carte, se c'è un colore NON possono esserci anche un poker o un
  // full (non restano abbastanza carte), quindi possiamo decidere subito.
  for (let s = 0; s < 4; s++) {
    if (_contaSeme[s] >= 5) {
      const ms = _mascheraSeme[s];
      const sc = scalaPiuAlta(ms);
      if (sc >= 0) return punteggio(8, sc);
      // Le 5 carte più alte di quel seme
      const k = [];
      for (let v = 12; v >= 0 && k.length < 5; v--) if ((ms >> v) & 1) k.push(v);
      return punteggio(5, k[0], k[1], k[2], k[3], k[4]);
    }
  }

  // --- Raggruppiamo i valori: poker, tris, coppie, carte singole ---
  // (dal valore più alto al più basso)
  let poker = -1;
  const tris = [], coppie = [], singole = [];
  for (let v = 12; v >= 0; v--) {
    const c = _conta[v];
    if (c === 4) poker = v;
    else if (c === 3) tris.push(v);
    else if (c === 2) coppie.push(v);
    else if (c === 1) singole.push(v);
  }

  if (poker >= 0) {
    // Il kicker è la carta più alta tra tutte le altre
    const kicker = Math.max(tris[0] ?? 0, coppie[0] ?? 0, singole[0] ?? 0);
    return punteggio(7, poker, kicker);
  }

  if (tris.length > 0 && (tris.length > 1 || coppie.length > 0)) {
    // Full: il tris più alto + la coppia migliore (può venire da un secondo tris)
    const coppia = Math.max(tris[1] ?? -1, coppie[0] ?? -1);
    return punteggio(6, tris[0], coppia);
  }

  const sc = scalaPiuAlta(maschera);
  if (sc >= 0) return punteggio(4, sc);

  if (tris.length > 0) return punteggio(3, tris[0], singole[0], singole[1]);

  if (coppie.length >= 2) {
    // Doppia coppia: le due coppie più alte, il kicker può essere anche una terza coppia
    const kicker = Math.max(coppie[2] ?? -1, singole[0] ?? -1);
    return punteggio(2, coppie[0], coppie[1], kicker);
  }

  if (coppie.length === 1) return punteggio(1, coppie[0], singole[0], singole[1], singole[2]);

  return punteggio(0, singole[0], singole[1], singole[2], singole[3], singole[4]);
}

// Dal punteggio ricava la categoria (0..8)
function categoriaDa(p) { return Math.floor(p / 1048576); }

// Nome del punto nella lingua scelta, es. "Coppia di K", "Full di 10 con i 4"
function nomePunto(p) {
  const cat = categoriaDa(p);
  const a = VALORI[(p >> 16) & 15];
  const b = VALORI[(p >> 12) & 15];
  switch (cat) {
    case 8: return a === "A" ? t("Scala reale") : t("Scala colore al {a}", { a });
    case 7: return t("Poker di {a}", { a });
    case 6: return t("Full di {a} con i {b}", { a, b });
    case 5: return t("Colore, carta alta {a}", { a });
    case 4: return t("Scala al {a}", { a });
    case 3: return t("Tris di {a}", { a });
    case 2: return t("Doppia coppia, {a} e {b}", { a, b });
    case 1: return t("Coppia di {a}", { a });
    default: return t("Carta alta: {a}", { a });
  }
}

// ============================================================
//  Funzioni in comune tra Calcolatore e Allenamento
// ============================================================

// Combinazioni: in quanti modi si scelgono k carte tra n
function combinazioni(n, k) {
  let r = 1;
  for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
  return r;
}

// Nome della mano iniziale, es. "AKs", "QJo", "77" (come nel file dei dati)
function nomeManoIniziale(c1, c2) {
  const a = Math.max(c1 >> 2, c2 >> 2), b = Math.min(c1 >> 2, c2 >> 2);
  if (a === b) return VALORI[a] + VALORI[b];
  return VALORI[a] + VALORI[b] + ((c1 & 3) === (c2 & 3) ? "s" : "o");
}

// Le 5 carte che formano il punto migliore (provando tutte le scelte
// di 5 carte: 21 su 7 carte). Serve per spiegare "perché" un punto vince.
function migliori5(carte) {
  let migliore = carte.slice(0, 5), punti = -1;
  // Prova ricorsiva: "scelte" sono le carte prese finora, da = da dove continuare
  function prova(scelte, da) {
    if (scelte.length === 5) {
      const p = valuta(scelte, 5);
      if (p > punti) { punti = p; migliore = scelte.slice(); }
      return;
    }
    for (let i = da; i < carte.length; i++) {
      scelte.push(carte[i]);
      prova(scelte, i + 1);
      scelte.pop();
    }
  }
  if (carte.length > 5) prova([], 0);

  // Ordiniamo: prima i gruppi più numerosi (poker, tris, coppie), poi dalla più alta
  const conta = {};
  migliore.forEach(c => conta[c >> 2] = (conta[c >> 2] || 0) + 1);
  return migliore.sort((x, y) =>
    (conta[y >> 2] - conta[x >> 2]) || ((y >> 2) - (x >> 2)));
}

// Gli OUTS: le carte che, se escono, migliorano il TUO punto.
// Non contano quelle che migliorano solo il tavolo (es. una carta che
// fa coppia sul tavolo: la coppia ce l'hanno tutti, non solo tu).
// Restituisce { totale, gruppi } dove gruppi = { categoria: [carte] }.
function contaOuts(mie, tavolo) {
  const n = tavolo.length;
  const catOra = categoriaDa(valuta([...mie, ...tavolo], 2 + n));
  const catTavoloOra = categoriaDa(valuta(tavolo, n));

  const usate = new Set([...mie, ...tavolo]);
  const gruppi = {};
  let totale = 0;
  for (let c = 0; c < 52; c++) {
    if (usate.has(c)) continue;
    const catDopo = categoriaDa(valuta([...mie, ...tavolo, c], 3 + n));
    const catTavoloDopo = categoriaDa(valuta([...tavolo, c], n + 1));
    // È un out se il tuo punto sale E il tuo vantaggio sul tavolo cresce
    if (catDopo > catOra && catDopo - catTavoloDopo > catOra - catTavoloOra) {
      (gruppi[catDopo] ??= []).push(c);
      totale++;
    }
  }
  return { totale, gruppi, catOra };
}

// Probabilità di prendere almeno un out: al flop mancano 2 carte, al turn 1
function probabilitaOuts(outs, carteSulTavolo) {
  const rimaste = 52 - 2 - carteSulTavolo;   // 47 al flop, 46 al turn
  return carteSulTavolo === 3
    ? 1 - combinazioni(rimaste - outs, 2) / combinazioni(rimaste, 2)
    : outs / rimaste;
}
