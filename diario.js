// ============================================================
//  diario.js — il Diario delle sessioni.
//  Annoti ogni sessione (data, tipo, ore, fiches all'inizio e alla
//  fine, umore, mani da rivedere, note) e il diario calcola le tue
//  statistiche e disegna il grafico dell'andamento.
//  I risultati sono sempre in FICHES (niente soldi veri).
//  Tutto è salvato nel browser (localStorage), su questo dispositivo.
// ============================================================

const CHIAVE_DIARIO = "poker.diario.sessioni";

const TIPI = {
  cash:   { icona: "♠",  nome: t("Cash game") },
  torneo: { icona: "🎟️", nome: t("Torneo") },
  serata: { icona: "🏠", nome: t("Serata tra amici") },
};

// Lo stato d'animo, da 1 (giù di corda) a 5 (in gran forma)
const UMORI = [
  { valore: 1, icona: "😫", nome: t("Stanco o nervoso") },
  { valore: 2, icona: "😕", nome: t("Così così") },
  { valore: 3, icona: "😐", nome: t("Normale") },
  { valore: 4, icona: "🙂", nome: t("Bene") },
  { valore: 5, icona: "😎", nome: t("In gran forma") },
];

let sessioni = leggiSessioni();   // tutte le sessioni salvate
let filtro = "tutte";             // quale tipo mostrare nell'elenco
let umoreScelto = 3;              // umore scelto nel modulo
let daEliminare = null;           // sessione in attesa di conferma per l'eliminazione
let timerEliminazione = null;

// ---------- Salvataggio nel browser ----------
// localStorage può non funzionare (es. finestra anonima): usiamo try/catch.

function leggiSessioni() {
  try {
    const dati = JSON.parse(localStorage.getItem(CHIAVE_DIARIO));
    return Array.isArray(dati) ? dati : [];
  } catch { return []; }
}

function salvaSessioni() {
  try {
    localStorage.setItem(CHIAVE_DIARIO, JSON.stringify(sessioni));
    return true;
  } catch {
    document.getElementById("esito-copia").textContent =
      t("⚠️ Il browser non permette di salvare il diario: salva il diario in un file!");
    return false;
  }
}

// ---------- Piccoli aiutanti ----------

// Il testo scritto dall'utente va "ripulito" prima di metterlo nella pagina:
// così un < o un & non rompono l'HTML.
function pulisci(testo) {
  return String(testo ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Numero di fiches scritto come nella lingua scelta, con il segno: +1.250 / −300
function fiches(n, conSegno = true) {
  const testo = numeroLocale(Math.abs(Math.round(n)));
  if (!conSegno) return testo;
  return (n > 0 ? "+" : n < 0 ? "−" : "") + testo;
}

// Classe del colore: verde se positivo, rosso se negativo
function classeSegno(n) { return n > 0 ? "positivo" : n < 0 ? "negativo" : ""; }

// "2026-10-16" → "ven 16 ott 2026" (in italiano; nelle altre lingue come si usa lì)
function dataLeggibile(data, breve = false) {
  const d = new Date(data + "T12:00:00");
  return d.toLocaleDateString(LOCALE, breve
    ? { day: "numeric", month: "short" }
    : { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// La data di oggi nel formato del campo data ("2026-10-16")
function oggi() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Ore e minuti: 3.5 → "3 h 30 min"
function oreLeggibili(ore) {
  const h = Math.floor(ore), m = Math.round((ore - h) * 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

function risultato(s) { return s.uscita - s.entrata; }

// Sessioni dalla più recente alla più vecchia
function ordinate(elenco) {
  return elenco.slice().sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

// ============================================================
//  STATISTICHE E GRAFICO
// ============================================================

function disegnaStatistiche() {
  const box = document.getElementById("statistiche");
  const titolo = `<h2 class="titolo-pannello">${t("📈 Il tuo andamento")}</h2>`;

  if (sessioni.length === 0) {
    box.innerHTML = titolo + `
      <p class="attesa">${t("📝 Il diario è vuoto. Annota la tua prima sessione qui sotto: dopo qualche partita vedrai qui le tue statistiche e il grafico.")}</p>`;
    return;
  }

  const totale = sessioni.reduce((somma, s) => somma + risultato(s), 0);
  const conOre = sessioni.filter(s => s.ore > 0);
  const oreTotali = conOre.reduce((somma, s) => somma + s.ore, 0);
  const risultatoConOre = conOre.reduce((somma, s) => somma + risultato(s), 0);
  const inAttivo = sessioni.filter(s => risultato(s) > 0).length;
  const migliore = sessioni.reduce((a, b) => risultato(b) > risultato(a) ? b : a);
  const peggiore = sessioni.reduce((a, b) => risultato(b) < risultato(a) ? b : a);

  // Le "piastrelle" con i numeri principali
  const piastrelle = [
    { nome: t("Risultato totale"), valore: `${fiches(totale)}`, classe: classeSegno(totale), nota: t("fiches") },
    { nome: t("Sessioni"), valore: sessioni.length, nota: t("{p}% in attivo", { p: Math.round(inAttivo / sessioni.length * 100) }) },
    { nome: t("Ore al tavolo"), valore: numeroLocale(oreTotali, { maximumFractionDigits: 1 }),
      nota: conOre.length < sessioni.length ? t("{n} senza ore", { n: sessioni.length - conOre.length }) : t("ore") },
    { nome: t("Fiches all'ora"), valore: oreTotali > 0 ? fiches(risultatoConOre / oreTotali) : "–",
      classe: oreTotali > 0 ? classeSegno(risultatoConOre) : "", nota: t("media") },
  ];

  let html = titolo + `<div class="piastrelle">` + piastrelle.map(p => `
      <div class="piastrella">
        <span class="nome">${p.nome}</span>
        <span class="valore ${p.classe || ""}">${p.valore}</span>
        <span class="nota">${p.nota}</span>
      </div>`).join("") + `</div>`;

  // Il grafico (servono almeno 2 sessioni per tracciare una linea)
  html += sessioni.length >= 2
    ? `<h3 class="sottotitolo-pannello">${t("Risultato accumulato, sessione dopo sessione")}</h3>
       <div class="grafico" id="grafico"></div>`
    : `<p class="aiuto">${t("Con almeno 2 sessioni comparirà il grafico dell'andamento.")}</p>`;

  // Migliore e peggiore
  html += `<div class="estremi">
      <p>🏆 ${t("Sessione migliore:")} <strong class="positivo">${fiches(risultato(migliore))}</strong>
         <small>(${dataLeggibile(migliore.data)}${migliore.luogo ? " · " + pulisci(migliore.luogo) : ""})</small></p>
      <p>🥶 ${t("Sessione peggiore:")} <strong class="${classeSegno(risultato(peggiore))}">${fiches(risultato(peggiore))}</strong>
         <small>(${dataLeggibile(peggiore.data)}${peggiore.luogo ? " · " + pulisci(peggiore.luogo) : ""})</small></p>
    </div>`;

  // Per tipo di partita
  const righeTipo = Object.entries(TIPI).map(([id, tipo]) => {
    const elenco = sessioni.filter(s => s.tipo === id);
    if (!elenco.length) return "";
    const r = elenco.reduce((a, s) => a + risultato(s), 0);
    return `<tr><th>${tipo.icona} ${tipo.nome}</th><td>${elenco.length}</td>
              <td class="${classeSegno(r)}">${fiches(r)}</td></tr>`;
  }).join("");
  html += `<div class="tabella-scorrevole"><table class="confronto stretta">
      <thead><tr><th>${t("Tipo")}</th><th>${t("Sessioni")}</th><th>${t("Risultato")}</th></tr></thead>
      <tbody>${righeTipo}</tbody></table></div>`;

  // Tornei: miglior piazzamento
  const tornei = sessioni.filter(s => s.tipo === "torneo" && s.posizione);
  if (tornei.length) {
    const top = tornei.reduce((a, b) => b.posizione < a.posizione ? b : a);
    html += `<p>🎟️ ${t("Miglior piazzamento in torneo:")} <strong>${top.posizione}°</strong>${top.iscritti ? " " + t("su {n}", { n: top.iscritti }) : ""}
               <small>(${dataLeggibile(top.data)})</small></p>`;
  }

  // Il consiglio "da campione": l'umore conta?
  html += consiglioUmore();

  box.innerHTML = html;
  if (sessioni.length >= 2) disegnaGrafico();
}

// Confronta come vai quando stai bene e quando sei giù (servono abbastanza sessioni)
function consiglioUmore() {
  const giu = sessioni.filter(s => s.umore <= 2);
  const su = sessioni.filter(s => s.umore >= 4);
  if (giu.length < 3 || su.length < 3) {
    return `<p class="consiglio">💡 ${t("Segna sempre come stavi: dopo qualche sessione ti dirò se giochi meglio riposato o se il nervosismo ti costa fiches (il famoso \"tilt\").")}</p>`;
  }
  const media = elenco => elenco.reduce((somma, s) => somma + risultato(s), 0) / elenco.length;
  const mGiu = media(giu), mSu = media(su);
  const frase = mSu > mGiu
    ? t("Quando stai bene fai in media <strong>{su}</strong> fiches a sessione, quando sei giù <strong>{giu}</strong>. Se sei stanco o nervoso, valuta di non sederti al tavolo!",
        { su: fiches(mSu), giu: fiches(mGiu) })
    : t("Curioso: quando sei giù fai in media <strong>{giu}</strong>, quando stai bene <strong>{su}</strong>. Forse in gran forma rischi troppo?",
        { su: fiches(mSu), giu: fiches(mGiu) });
  return `<p class="consiglio">💡 ${frase}</p>`;
}

// Il grafico a linea del risultato accumulato (disegnato in SVG, da noi)
function disegnaGrafico() {
  const box = document.getElementById("grafico");
  if (!box) return;

  // Dalla sessione più vecchia alla più recente, con il totale progressivo
  const punti = [];
  let somma = 0;
  ordinate(sessioni).reverse().forEach(s => {
    somma += risultato(s);
    punti.push({ s, totale: somma });
  });

  // Misure del disegno (in pixel): si adatta alla larghezza del riquadro
  const larghezza = Math.max(280, box.clientWidth);
  const altezza = 220;
  const margine = { sopra: 14, sotto: 26, sinistra: 58, destra: 14 };
  const w = larghezza - margine.sinistra - margine.destra;
  const h = altezza - margine.sopra - margine.sotto;

  // Scala verticale: comprende sempre lo zero (la linea "in pari")
  let minimo = Math.min(0, ...punti.map(p => p.totale));
  let massimo = Math.max(0, ...punti.map(p => p.totale));
  if (minimo === massimo) { minimo -= 100; massimo += 100; }
  const spazio = (massimo - minimo) * 0.08;
  minimo -= spazio; massimo += spazio;

  // Da "sessione numero i" e "fiches" a coordinate sul disegno
  const x = i => margine.sinistra + (punti.length === 1 ? w / 2 : i / (punti.length - 1) * w);
  const y = v => margine.sopra + (massimo - v) / (massimo - minimo) * h;

  // Linee guida orizzontali a valori "tondi" (es. 0, 500, 1.000, 1.500)
  const grezzo = (massimo - minimo) / 4;
  const potenza = 10 ** Math.floor(Math.log10(grezzo));
  const passo = [1, 2, 5, 10].map(k => k * potenza).find(p => p >= grezzo);
  let guide = "";
  for (let v = Math.ceil(minimo / passo) * passo; v <= massimo; v += passo) {
    guide += `<line class="guida" x1="${margine.sinistra}" x2="${larghezza - margine.destra}" y1="${y(v)}" y2="${y(v)}"/>
              <text class="etichetta-asse" x="${margine.sinistra - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v) < 0 ? "−" : ""}${fiches(v, false)}</text>`;
  }

  const linea = punti.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.totale).toFixed(1)}`).join(" ");

  // Date sull'asse orizzontale: la prima e l'ultima
  const date = `
    <text class="etichetta-asse" x="${x(0)}" y="${altezza - 6}" text-anchor="start">${dataLeggibile(punti[0].s.data, true)}</text>
    <text class="etichetta-asse" x="${x(punti.length - 1)}" y="${altezza - 6}" text-anchor="end">${dataLeggibile(punti.at(-1).s.data, true)}</text>`;

  // I pallini (visibili solo se le sessioni non sono troppe) e le zone "sensibili" al tocco
  const pallini = punti.length <= 40
    ? punti.map((p, i) => `<circle class="pallino-grafico" cx="${x(i)}" cy="${y(p.totale)}" r="4"/>`).join("")
    : "";
  const zone = punti.map((p, i) => `<circle class="zona-tocco" data-i="${i}" cx="${x(i)}" cy="${y(p.totale)}" r="14"/>`).join("");

  box.innerHTML = `
    <svg width="${larghezza}" height="${altezza}" role="img"
         aria-label="${t("Grafico del risultato accumulato: da {da} a {a} fiches in {n} sessioni",
                         { da: fiches(punti[0].totale), a: fiches(punti.at(-1).totale), n: punti.length })}">
      ${guide}
      <line class="linea-zero" x1="${margine.sinistra}" x2="${larghezza - margine.destra}" y1="${y(0)}" y2="${y(0)}"/>
      <path class="linea-grafico" d="${linea}"/>
      <circle class="evidenzia" r="6" visibility="hidden"/>
      ${pallini}
      ${zone}
      ${date}
    </svg>
    <div class="fumetto" hidden></div>`;

  // Fumetto con i dettagli quando passi sopra (o tocchi) un punto
  const fumetto = box.querySelector(".fumetto");
  const evidenzia = box.querySelector(".evidenzia");
  box.querySelectorAll(".zona-tocco").forEach(zona => {
    const mostra = () => {
      const i = Number(zona.dataset.i);
      const p = punti[i];
      const r = risultato(p.s);
      fumetto.innerHTML = `
        <strong>${dataLeggibile(p.s.data)}</strong><br>
        ${TIPI[p.s.tipo].icona} ${TIPI[p.s.tipo].nome}${p.s.luogo ? " · " + pulisci(p.s.luogo) : ""}<br>
        ${t("Sessione")}: <b class="${classeSegno(r)}">${fiches(r)}</b><br>
        ${t("Totale")}: <b class="${classeSegno(p.totale)}">${fiches(p.totale)}</b>`;
      fumetto.hidden = false;
      // Il fumetto sta sopra al punto, senza uscire dal riquadro
      const fx = Math.min(Math.max(x(i) - fumetto.offsetWidth / 2, 0), larghezza - fumetto.offsetWidth);
      const fy = Math.max(y(p.totale) - fumetto.offsetHeight - 12, 0);
      fumetto.style.left = fx + "px";
      fumetto.style.top = fy + "px";
      evidenzia.setAttribute("cx", x(i));
      evidenzia.setAttribute("cy", y(p.totale));
      evidenzia.setAttribute("visibility", "visible");
    };
    zona.addEventListener("mouseenter", mostra);
    zona.addEventListener("click", mostra);
  });
  box.querySelector("svg").addEventListener("mouseleave", () => {
    fumetto.hidden = true;
    evidenzia.setAttribute("visibility", "hidden");
  });
}

// ============================================================
//  ELENCO DELLE SESSIONI
// ============================================================

function disegnaElenco() {
  document.querySelectorAll("#filtro-tipo button").forEach(b =>
    b.setAttribute("aria-pressed", b.dataset.filtro === filtro));

  const box = document.getElementById("elenco-sessioni");
  const elenco = ordinate(sessioni.filter(s => filtro === "tutte" || s.tipo === filtro));

  if (!elenco.length) {
    box.innerHTML = `<p class="aiuto">${sessioni.length ? t("Nessuna sessione di questo tipo.") : t("Ancora nessuna sessione.")}</p>`;
    return;
  }

  box.innerHTML = elenco.map(s => {
    const r = risultato(s);
    const umore = UMORI.find(u => u.valore === s.umore);
    const dettagli = [
      s.ore > 0 ? `⏱️ ${oreLeggibili(s.ore)}` : "",
      `${fiches(s.entrata, false)} → ${fiches(s.uscita, false)}`,
      s.tipo === "torneo" && s.posizione ? `🏁 ${s.posizione}°${s.iscritti ? " " + t("su {n}", { n: s.iscritti }) : ""}` : "",
      umore ? `${umore.icona} ${umore.nome}` : "",
    ].filter(Boolean).join(" · ");

    const confermare = daEliminare === s.id;
    return `
      <article class="sessione">
        <div class="testata-sessione">
          <span class="tipo-sessione" title="${TIPI[s.tipo].nome}">${TIPI[s.tipo].icona}</span>
          <div>
            <strong>${dataLeggibile(s.data)}</strong>${s.luogo ? ` · ${pulisci(s.luogo)}` : ""}
            <small>${dettagli}</small>
          </div>
          <span class="risultato-sessione ${classeSegno(r)}">${fiches(r)}</span>
        </div>
        ${s.mani ? `<p class="testo-sessione"><b>🃏 ${t("Mani da rivedere")}:</b> ${pulisci(s.mani)}</p>` : ""}
        ${s.note ? `<p class="testo-sessione"><b>📝 ${t("Note")}:</b> ${pulisci(s.note)}</p>` : ""}
        <div class="azioni-sessione">
          <button type="button" class="pulsante-piccolo" data-modifica="${s.id}">${t("✏️ Modifica")}</button>
          <button type="button" class="pulsante-piccolo ${confermare ? "pericolo" : ""}" data-elimina="${s.id}">
            ${confermare ? t("Sicuro? Tocca di nuovo per eliminare") : t("🗑️ Elimina")}
          </button>
        </div>
      </article>`;
  }).join("");
}

// ============================================================
//  IL MODULO
// ============================================================

function disegnaUmore() {
  document.getElementById("scelta-umore").innerHTML = UMORI.map(u => `
    <button type="button" data-umore="${u.valore}" aria-pressed="${u.valore === umoreScelto}" title="${u.nome}">
      <span class="emoji-umore">${u.icona}</span><small>${u.nome}</small>
    </button>`).join("");
}

// I campi "posizione" e "iscritti" servono solo per i tornei
function aggiornaCampiTorneo() {
  const torneo = document.getElementById("campo-tipo").value === "torneo";
  document.querySelectorAll(".solo-torneo").forEach(c => c.hidden = !torneo);
}

// Mentre scrivi, mostra il risultato della sessione
function aggiornaAnteprima() {
  const entrata = parseFloat(document.getElementById("campo-entrata").value);
  const uscita = parseFloat(document.getElementById("campo-uscita").value);
  const box = document.getElementById("anteprima-risultato");
  if (isNaN(entrata) || isNaN(uscita)) { box.innerHTML = ""; return; }
  const r = uscita - entrata;
  box.innerHTML = `${t("Risultato della sessione:")} <strong class="${classeSegno(r)}">${fiches(r)} ${t("fiches")}</strong>`;
}

// Svuota il modulo per una nuova sessione
function svuotaModulo() {
  document.getElementById("modulo-sessione").reset();
  document.getElementById("campo-id").value = "";
  document.getElementById("campo-data").value = oggi();
  document.getElementById("titolo-modulo").textContent = t("✍️ Nuova sessione");
  document.getElementById("salva-sessione").textContent = t("💾 Salva sessione");
  document.getElementById("annulla-modifica").hidden = true;
  umoreScelto = 3;
  disegnaUmore();
  aggiornaCampiTorneo();
  aggiornaAnteprima();
}

// Riempie il modulo con una sessione da modificare
function caricaNelModulo(id) {
  const s = sessioni.find(x => x.id === id);
  if (!s) return;
  const metti = (campo, valore) => document.getElementById(campo).value = valore ?? "";
  metti("campo-id", s.id);
  metti("campo-data", s.data);
  metti("campo-tipo", s.tipo);
  metti("campo-luogo", s.luogo);
  metti("campo-ore", s.ore || "");
  metti("campo-entrata", s.entrata);
  metti("campo-uscita", s.uscita);
  metti("campo-posizione", s.posizione || "");
  metti("campo-iscritti", s.iscritti || "");
  metti("campo-mani", s.mani);
  metti("campo-note", s.note);
  umoreScelto = s.umore || 3;
  disegnaUmore();
  aggiornaCampiTorneo();
  aggiornaAnteprima();
  document.getElementById("titolo-modulo").textContent = t("✏️ Modifica sessione");
  document.getElementById("salva-sessione").textContent = t("💾 Salva le modifiche");
  document.getElementById("annulla-modifica").hidden = false;
  document.getElementById("modulo-sessione").scrollIntoView({ behavior: "smooth", block: "center" });
}

// Salva la sessione del modulo (nuova o modificata)
function salvaDalModulo(evento) {
  evento.preventDefault();
  const leggi = campo => document.getElementById(campo).value.trim();
  const numero = campo => { const v = parseFloat(leggi(campo)); return isNaN(v) ? null : v; };

  const tipo = leggi("campo-tipo");
  const idEsistente = Number(leggi("campo-id")) || null;
  const sessione = {
    id: idEsistente || Date.now(),       // un numero unico per ogni sessione
    data: leggi("campo-data") || oggi(),
    tipo,
    luogo: leggi("campo-luogo"),
    ore: numero("campo-ore") || 0,
    entrata: numero("campo-entrata") ?? 0,
    uscita: numero("campo-uscita") ?? 0,
    posizione: tipo === "torneo" ? numero("campo-posizione") : null,
    iscritti: tipo === "torneo" ? numero("campo-iscritti") : null,
    umore: umoreScelto,
    mani: leggi("campo-mani"),
    note: leggi("campo-note"),
  };

  if (idEsistente) sessioni = sessioni.map(s => s.id === idEsistente ? sessione : s);
  else sessioni.push(sessione);
  salvaSessioni();

  svuotaModulo();
  ridisegna();
  document.getElementById("statistiche").scrollIntoView({ behavior: "smooth", block: "start" });
}

// Elimina con doppio tocco: il primo chiede conferma, il secondo elimina
function chiediEliminazione(id) {
  clearTimeout(timerEliminazione);
  if (daEliminare === id) {
    sessioni = sessioni.filter(s => s.id !== id);
    salvaSessioni();
    daEliminare = null;
    if (Number(document.getElementById("campo-id").value) === id) svuotaModulo();
    return ridisegna();
  }
  daEliminare = id;
  disegnaElenco();
  // Se non confermi entro 4 secondi, il pulsante torna normale
  timerEliminazione = setTimeout(() => { daEliminare = null; disegnaElenco(); }, 4000);
}

function ridisegna() {
  disegnaStatistiche();
  disegnaElenco();
}

// ============================================================
//  COPIA DI SICUREZZA (scarica e carica un file)
// ============================================================

function esporta() {
  const dati = { app: "diario-poker", versione: 1, salvato: new Date().toISOString(), sessioni };
  const file = new Blob([JSON.stringify(dati, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `diario-poker-${oggi()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  document.getElementById("esito-copia").textContent = t("✅ Copia scaricata: {n} sessioni.", { n: sessioni.length });
}

// Controlla che una sessione caricata da file sia fatta bene
function sessioneValida(s) {
  return s && typeof s === "object"
    && Number.isFinite(s.id) && /^\d{4}-\d{2}-\d{2}$/.test(s.data)
    && s.tipo in TIPI && Number.isFinite(s.entrata) && Number.isFinite(s.uscita);
}

function importa(file) {
  const esito = document.getElementById("esito-copia");
  const lettore = new FileReader();
  lettore.onload = () => {
    try {
      const dati = JSON.parse(lettore.result);
      const nuove = (Array.isArray(dati) ? dati : dati.sessioni || []).filter(sessioneValida);
      if (!nuove.length) throw new Error("vuoto");
      // Aggiungiamo solo le sessioni che non ci sono già (stesso numero)
      const presenti = new Set(sessioni.map(s => s.id));
      const aggiunte = nuove.filter(s => !presenti.has(s.id));
      sessioni.push(...aggiunte);
      salvaSessioni();
      ridisegna();
      esito.textContent = nuove.length > aggiunte.length
        ? t("✅ Copia caricata: {n} sessioni aggiunte ({gia} c'erano già).", { n: aggiunte.length, gia: nuove.length - aggiunte.length })
        : t("✅ Copia caricata: {n} sessioni aggiunte.", { n: aggiunte.length });
    } catch {
      esito.textContent = t("❌ Questo file non sembra una copia del diario.");
    }
  };
  lettore.readAsText(file);
}

// ---------- Avvio ----------

document.addEventListener("DOMContentLoaded", () => {
  svuotaModulo();
  ridisegna();

  const modulo = document.getElementById("modulo-sessione");
  modulo.addEventListener("submit", salvaDalModulo);
  document.getElementById("campo-tipo").addEventListener("change", aggiornaCampiTorneo);
  document.getElementById("campo-entrata").addEventListener("input", aggiornaAnteprima);
  document.getElementById("campo-uscita").addEventListener("input", aggiornaAnteprima);
  document.getElementById("annulla-modifica").addEventListener("click", svuotaModulo);

  document.getElementById("scelta-umore").addEventListener("click", evento => {
    const b = evento.target.closest("[data-umore]");
    if (!b) return;
    umoreScelto = Number(b.dataset.umore);
    disegnaUmore();
  });

  document.getElementById("filtro-tipo").addEventListener("click", evento => {
    const b = evento.target.closest("[data-filtro]");
    if (!b) return;
    filtro = b.dataset.filtro;
    disegnaElenco();
  });

  document.getElementById("elenco-sessioni").addEventListener("click", evento => {
    const b = evento.target.closest("button");
    if (!b) return;
    if (b.dataset.modifica) caricaNelModulo(Number(b.dataset.modifica));
    if (b.dataset.elimina) chiediEliminazione(Number(b.dataset.elimina));
  });

  document.getElementById("esporta").addEventListener("click", esporta);
  document.getElementById("importa").addEventListener("change", evento => {
    if (evento.target.files[0]) importa(evento.target.files[0]);
    evento.target.value = "";   // così si può ricaricare lo stesso file
  });

  // Se la finestra cambia larghezza, ridisegniamo il grafico
  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(disegnaGrafico, 200);
  });
});
