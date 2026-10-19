// ============================================================
//  motore.js — il "motore" che calcola le percentuali.
//  Gira in un Web Worker: un aiutante che lavora in parallelo
//  alla pagina, così la pagina resta fluida mentre lui calcola.
//
//  Metodo: SIMULAZIONE (detto "Monte Carlo").
//  Giochiamo la tua situazione decine di migliaia di volte:
//  ogni volta diamo carte a caso agli avversari e completiamo
//  il tavolo a caso, poi vediamo chi vince. La percentuale di
//  volte in cui vinci è la tua probabilità di vincere.
// ============================================================

importScripts("valutatore.js"); // ci serve la funzione valuta()

// La pagina ci manda: le tue 2 carte, le carte comuni già uscite,
// il numero di avversari. Noi rispondiamo con i risultati,
// anche più volte mentre calcoliamo (così la pagina si aggiorna dal vivo).
onmessage = evento => {
  const { mie, tavolo, avversari } = evento.data;

  // Il mazzo: tutte le carte che NON sono già sul tavolo o in mano a te
  const note = new Set([...mie, ...tavolo]);
  const mazzo = [];
  for (let c = 0; c < 52; c++) if (!note.has(c)) mazzo.push(c);

  const mancanti = 5 - tavolo.length;          // carte comuni ancora da girare
  const servono = mancanti + 2 * avversari;    // carte da pescare a ogni prova

  // Spazi di lavoro: le tue 7 carte e quelle di un avversario
  const manoMia = new Int32Array(7);
  const manoAvv = new Int32Array(7);
  manoMia[0] = mie[0];
  manoMia[1] = mie[1];
  for (let i = 0; i < tavolo.length; i++) {
    manoMia[2 + i] = tavolo[i];
    manoAvv[2 + i] = tavolo[i];
  }

  // I contatori
  let prove = 0;
  let vittorie = 0;
  let pareggi = 0;
  let quota = 0;                              // la tua parte di piatto (pareggi divisi)
  const puntiFinali = new Array(9).fill(0);   // che punto fai al river, per categoria

  const inizio = Date.now();
  const PROVE_MASSIME = 300000;   // oltre non serve: la precisione è già altissima
  const TEMPO_MASSIMO = 1500;     // millisecondi
  const BLOCCO = 4000;            // ogni 4000 prove mandiamo un aggiornamento

  function blocco() {
    for (let b = 0; b < BLOCCO; b++) {
      // Mescoliamo solo le carte che ci servono (Fisher-Yates parziale)
      for (let i = 0; i < servono; i++) {
        const j = i + Math.floor(Math.random() * (mazzo.length - i));
        const t = mazzo[i]; mazzo[i] = mazzo[j]; mazzo[j] = t;
      }

      // Completiamo il tavolo con le carte mancanti
      for (let k = 0; k < mancanti; k++) {
        manoMia[2 + tavolo.length + k] = mazzo[k];
        manoAvv[2 + tavolo.length + k] = mazzo[k];
      }

      const mio = valuta(manoMia, 7);
      puntiFinali[categoriaDa(mio)]++;

      // Confrontiamo con ogni avversario
      let perso = false;
      let pariMerito = 0; // quanti avversari hanno esattamente il mio stesso punto
      for (let a = 0; a < avversari; a++) {
        manoAvv[0] = mazzo[mancanti + 2 * a];
        manoAvv[1] = mazzo[mancanti + 2 * a + 1];
        const suo = valuta(manoAvv, 7);
        if (suo > mio) { perso = true; break; }   // basta uno più forte e ho perso
        if (suo === mio) pariMerito++;
      }

      if (!perso) {
        if (pariMerito === 0) { vittorie++; quota += 1; }
        else { pareggi++; quota += 1 / (pariMerito + 1); } // piatto diviso
      }
      prove++;
    }

    // Mandiamo i risultati parziali alla pagina
    const finito = prove >= PROVE_MASSIME || Date.now() - inizio > TEMPO_MASSIMO;
    postMessage({ prove, vittorie, pareggi, quota, puntiFinali, finito });

    // Se non abbiamo finito, continuiamo (setTimeout lascia "respirare" il worker)
    if (!finito) setTimeout(blocco, 0);
  }

  blocco();
};
