// ============================================================
//  comune.js — codice condiviso da TUTTE le pagine del sito.
//  Costruisce:
//    1. il menu di navigazione con le 5 sezioni
//    2. il piè di pagina con l'avviso per il giocatore
//  Così menu e piè di pagina sono scritti una volta sola
//  e sono uguali in ogni pagina.
// ============================================================

// Elenco delle 5 sezioni principali dell'app.
// Per aggiungere o rinominare una sezione basta cambiare qui.
// Il nome del sito (scelto dall'utente il 17 ottobre 2026): è un marchio,
// quindi resta uguale in tutte le lingue. Il logo è la sigla "P.C.".
const NOME_SITO = "Poker Compass";

const SEZIONI = [
  { id: "prontuario",  icona: "📖", nome: t("Prontuario"),  pagina: "prontuario.html",
    descrizione: t("Regole del Texas Hold'em e classifica dei punti, sempre a portata di mano.") },
  { id: "calcolatore", icona: "🧮", nome: t("Calcolatore"), pagina: "calcolatore.html",
    descrizione: t("Inserisci le carte e scopri le probabilità di vincere la mano.") },
  { id: "allenamento", icona: "🎯", nome: t("Allenamento"), pagina: "allenamento.html",
    descrizione: t("Quiz ed esercizi per migliorare: chi vince la mano? quante probabilità hai?") },
  { id: "diario",      icona: "📝", nome: t("Diario"),      pagina: "diario.html",
    descrizione: t("Annota le tue sessioni, i risultati e le mani da rivedere.") },
  { id: "serate",      icona: "⏱️", nome: t("Serate"),      pagina: "serate.html",
    descrizione: t("Per le partite tra amici: timer dei bui, tavoli e posti, conto delle fiches e classifica.") },
];

// Questa funzione disegna il menu in cima alla pagina.
function disegnaMenu() {
  // Leggiamo quale pagina siamo (lo scriviamo nel <body data-pagina="...">)
  const paginaAttuale = document.body.dataset.pagina;

  // Cerchiamo nella pagina il posto dove mettere il menu
  const contenitore = document.getElementById("menu");
  if (!contenitore) return; // se non c'è, non facciamo nulla

  // Prima voce: il ritorno alla pagina iniziale
  // Il logo (bussola con l'ago a picche + la sigla P.C.) riporta alla Home
  let html = `<a href="index.html" class="logo" aria-label="${NOME_SITO} – ${t("Home")}">
                <img src="logo.svg" alt="" width="34" height="34"><span class="sigla-logo">P.C.</span>
              </a><nav class="voci">`;

  // Poi una voce per ogni sezione
  for (const sezione of SEZIONI) {
    // La voce della pagina in cui siamo viene evidenziata
    const attiva = sezione.id === paginaAttuale ? ' aria-current="page"' : "";
    html += `<a href="${sezione.pagina}"${attiva}>
               <span class="icona">${sezione.icona}</span>
               <span class="nome">${sezione.nome}</span>
             </a>`;
  }
  html += `</nav>`;

  // In alto a destra: la scelta della lingua
  html += `<label class="scelta-lingua">
             <span class="icona" aria-hidden="true">🌐</span>
             <span class="sigla" aria-hidden="true">${LINGUA.toUpperCase()} ▾</span>
             <select id="scelta-lingua" aria-label="${t("Lingua")}">
               ${LINGUE.map(l => `<option value="${l.codice}"${l.codice === LINGUA ? " selected" : ""}>
                                    ${l.codice.toUpperCase()} · ${l.nome}</option>`).join("")}
             </select>
           </label>`;

  contenitore.innerHTML = html;
  document.getElementById("scelta-lingua")
    .addEventListener("change", evento => cambiaLingua(evento.target.value));
}

// Questa funzione disegna il piè di pagina, con l'avviso deciso insieme.
function disegnaPiede() {
  const contenitore = document.getElementById("piede");
  if (!contenitore) return;

  contenitore.innerHTML = `
    <p><strong>${t("Rispetta sempre le regole del sito o del torneo in cui giochi.")}</strong></p>
    <p>${t("App per studiare, allenarsi e organizzare le partite.")}</p>
    <p><a href="info.html">ℹ️ ${t("Info e privacy")}</a> · © ${new Date().getFullYear()} ${NOME_SITO}</p>`;
}

// Sulla pagina iniziale disegniamo anche le 5 schede delle sezioni.
function disegnaSchedeHome() {
  const contenitore = document.getElementById("schede");
  if (!contenitore) return; // esiste solo nella pagina iniziale

  let html = "";
  for (const sezione of SEZIONI) {
    html += `<a class="scheda" href="${sezione.pagina}">
               <span class="icona-grande">${sezione.icona}</span>
               <h2>${sezione.nome}</h2>
               <p>${sezione.descrizione}</p>
             </a>`;
  }
  contenitore.innerHTML = html;
}

// ============================================================
//  CARTE DISEGNATE DA NOI (niente immagini prese da fuori).
//  Una carta si scrive come testo: valore + seme, es. "A♠", "10♥".
//  Nelle pagine basta scrivere:
//     <div class="mano" data-carte="A♠ K♠ Q♠ J♠ 10♠"></div>
//  e questo codice trasforma il testo in carte disegnate.
//  Si usa in tutte le sezioni (Prontuario, Calcolatore, Allenamento...).
// ============================================================

// Restituisce l'HTML di UNA carta
function cartaHTML(codice) {
  const seme = codice.slice(-1);        // ultimo carattere: il seme
  const valore = codice.slice(0, -1);   // tutto il resto: il valore
  const rossa = seme === "♥" || seme === "♦";
  // aria-label: chi usa un lettore di schermo sente "A di picche", ecc.
  const nomiSemi = { "♠": t("picche"), "♥": t("cuori"), "♦": t("quadri"), "♣": t("fiori") };
  return `<span class="carta ${rossa ? "rossa" : "nera"}"
                role="img" aria-label="${t("{valore} di {seme}", { valore, seme: nomiSemi[seme] })}">
            <span class="angolo">${valore}<br>${seme}</span>
            <span class="centro">${seme}</span>
          </span>`;
}

// Trasforma tutti i <div class="mano" data-carte="..."> della pagina in carte
function disegnaCarte() {
  document.querySelectorAll(".mano[data-carte]").forEach(mano => {
    const carte = mano.dataset.carte.trim().split(/\s+/);
    mano.innerHTML = carte.map(cartaHTML).join("");
  });
}

// Nelle pagine delle sezioni scriviamo in automatico il titolo grande
// (icona, nome e descrizione presi dall'elenco SEZIONI qui sopra).
function disegnaTitoloSezione() {
  const contenitore = document.getElementById("titolo-sezione");
  if (!contenitore) return; // esiste solo nelle pagine delle sezioni

  const sezione = SEZIONI.find(s => s.id === document.body.dataset.pagina);
  if (!sezione) return;

  document.title = `${sezione.nome} – ${NOME_SITO}`;
  contenitore.innerHTML = `
    <div class="eroe-testo" data-parallasse="0.35">
      <span class="icona-eroe">${sezione.icona}</span>
      <h1>${sezione.nome}</h1>
      <p class="sottotitolo">${sezione.descrizione}</p>
    </div>`;
}

// ============================================================
//  EFFETTO PARALLASSE (regola fissa del progetto: lo usiamo
//  sempre). Quando scorri la pagina, lo sfondo con i semi
//  delle carte si muove PIÙ LENTO del contenuto, su 3 livelli
//  di profondità: sembra che ci sia uno spazio dietro lo schermo.
//  I semi sono semplici caratteri ♠ ♥ ♦ ♣ disegnati da noi.
// ============================================================

// I 3 livelli: più "velocita" è bassa, più il livello sembra lontano.
// Lo strato lontano è anche sfocato: come una foto con lo sfondo fuori fuoco.
const STRATI = [
  { velocita: 0.15, dimensione: 22, opacita: 0.10, sfocato: true },  // lontano: piccolo, tenue e sfocato
  { velocita: 0.35, dimensione: 40, opacita: 0.08 },                 // in mezzo
  { velocita: 0.60, dimensione: 70, opacita: 0.07 },                 // vicino: grande
];

// Le "luci" colorate dietro a tutto: grandi cerchi sfumati che scorrono
// lentissimi (sono lo strato più lontano di tutti).
const LUCI = [
  { x: 8,  y: 0.10, misura: 420, colore: "rgba(52, 245, 197, 0.22)" },  // menta
  { x: 85, y: 0.35, misura: 380, colore: "rgba(255, 122, 89, 0.18)" },  // corallo
  { x: 20, y: 0.65, misura: 460, colore: "rgba(52, 245, 197, 0.16)" },
  { x: 75, y: 0.90, misura: 400, colore: "rgba(255, 84, 112, 0.14)" },  // corallo rosato
];
const VELOCITA_LUCI = 0.06;

const SEMI = ["♠", "♥", "♦", "♣"];

// Numero "casuale" ma sempre uguale per lo stesso n:
// così i semi stanno sempre negli stessi punti a ogni apertura.
function casualeFisso(n) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x); // un numero tra 0 e 1
}

// Crea i 3 livelli di sfondo e li riempie di semi.
function creaSfondoParallasse() {
  // Togliamo un eventuale sfondo vecchio (serve quando la finestra cambia misura)
  document.querySelector(".sfondo-parallasse")?.remove();

  const sfondo = document.createElement("div");
  sfondo.className = "sfondo-parallasse";
  sfondo.setAttribute("aria-hidden", "true"); // è solo decorazione

  // Quanto si può scorrere la pagina, in pixel
  const scorrimentoMassimo = Math.max(
    0, document.documentElement.scrollHeight - window.innerHeight);

  // Prima lo strato delle luci (il più lontano)
  const luci = document.createElement("div");
  luci.className = "strato";
  luci.dataset.velocita = VELOCITA_LUCI;
  const altezzaLuci = window.innerHeight + scorrimentoMassimo * VELOCITA_LUCI + 100;
  luci.style.height = altezzaLuci + "px";
  luci.innerHTML = LUCI.map(l => `<span class="luce" style="
      left:calc(${l.x}% - ${l.misura / 2}px);
      top:${Math.round(l.y * altezzaLuci - l.misura / 2)}px;
      width:${l.misura}px; height:${l.misura}px;
      background:radial-gradient(circle, ${l.colore}, transparent 70%);"></span>`).join("");
  sfondo.appendChild(luci);

  STRATI.forEach((strato, numeroStrato) => {
    const livello = document.createElement("div");
    livello.className = strato.sfocato ? "strato sfocato" : "strato";
    livello.dataset.velocita = strato.velocita;

    // Il livello deve essere alto abbastanza da non "finire" mentre scorri
    const altezza = window.innerHeight + scorrimentoMassimo * strato.velocita + 100;
    livello.style.height = altezza + "px";

    // Circa un seme ogni 180x180 pixel (meno semi se sono grandi)
    const quanti = Math.round((window.innerWidth * altezza) / (180 * 180)
                              * (30 / strato.dimensione));

    let html = "";
    for (let i = 0; i < quanti; i++) {
      const n = numeroStrato * 1000 + i;
      const seme = SEMI[i % 4];
      const rosso = seme === "♥" || seme === "♦";
      html += `<span style="
        left:${(casualeFisso(n) * 100).toFixed(2)}%;
        top:${Math.round(casualeFisso(n + 0.5) * altezza)}px;
        font-size:${strato.dimensione}px;
        opacity:${strato.opacita};
        transform:rotate(${Math.round(casualeFisso(n + 0.7) * 60 - 30)}deg);
        color:${rosso ? "var(--seme-rosso)" : "var(--seme-nero)"};
      ">${seme}</span>`;
    }
    livello.innerHTML = html;
    sfondo.appendChild(livello);
  });

  document.body.prepend(sfondo);
}

// Sposta i livelli e gli elementi con data-parallasse in base allo scorrimento.
function aggiornaParallasse() {
  const scorrimento = window.scrollY;

  // Sfondo: ogni livello sale più lentamente della pagina
  document.querySelectorAll(".strato").forEach(livello => {
    const v = parseFloat(livello.dataset.velocita);
    livello.style.transform = `translate3d(0, ${-scorrimento * v}px, 0)`;
  });

  // Elementi del contenuto (es. i titoli grandi): scendono un po'
  // mentre scorri e si dissolvono, così restano "indietro".
  document.querySelectorAll("[data-parallasse]").forEach(elemento => {
    const v = parseFloat(elemento.dataset.parallasse);
    const trasparenza = Math.max(0, 1 - scorrimento / 500);
    elemento.style.transform = `translate3d(0, ${scorrimento * v}px, 0)`;
    elemento.style.opacity = trasparenza;
  });
}

function avviaParallasse() {
  // Chi ha chiesto al sistema di ridurre le animazioni non vede il movimento
  // (lo sfondo resta, ma fermo).
  const menoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  creaSfondoParallasse();
  if (menoMovimento) return;

  // requestAnimationFrame: aggiorniamo al massimo una volta per fotogramma,
  // così lo scorrimento resta fluido anche sul telefono.
  let inAttesa = false;
  window.addEventListener("scroll", () => {
    if (inAttesa) return;
    inAttesa = true;
    requestAnimationFrame(() => { aggiornaParallasse(); inAttesa = false; });
  }, { passive: true });

  // Se la finestra cambia misura (es. telefono girato) rifacciamo lo sfondo
  let timerMisura;
  window.addEventListener("resize", () => {
    clearTimeout(timerMisura);
    timerMisura = setTimeout(() => { creaSfondoParallasse(); aggiornaParallasse(); }, 200);
  });

  // Se la pagina diventa più lunga o più corta (es. apri una scheda
  // del Prontuario) rifacciamo lo sfondo, così i semi non "finiscono".
  let altezzaPrecedente = document.documentElement.scrollHeight;
  let timerAltezza;
  new ResizeObserver(() => {
    const altezza = document.documentElement.scrollHeight;
    if (Math.abs(altezza - altezzaPrecedente) < 50) return; // cambi piccoli: ignoriamo
    altezzaPrecedente = altezza;
    clearTimeout(timerAltezza);
    timerAltezza = setTimeout(() => { creaSfondoParallasse(); aggiornaParallasse(); }, 100);
  }).observe(document.body);

  aggiornaParallasse();
}

// Quando la pagina è pronta, disegniamo tutto.
document.addEventListener("DOMContentLoaded", () => {
  traduciPagina();   // per primo: traduce le parti fisse della pagina (lingua.js)
  disegnaMenu();
  disegnaPiede();
  disegnaSchedeHome();
  disegnaTitoloSezione();
  disegnaCarte();
  avviaParallasse(); // per ultimo: deve conoscere l'altezza finale della pagina
});
