// ============================================================
//  serate.js — le Serate tra amici.
//    1. Timer dei bui: livelli, conto alla rovescia, suono al cambio,
//       schermo intero (per metterlo sulla TV o su un tablet).
//    2. Giocatori e fiches: chi è in gioco, chi è fuori, rientri,
//       controllo che il totale delle fiches torni.
//    3. Tavoli e posti: sorteggio o scelta a mano, proposte per
//       bilanciare i tavoli e chiuderli fino al tavolo finale.
//    4. Struttura dei bui: consigliata in automatico, modificabile.
//    5. Campionato: i punti di ogni serata si sommano.
//  Solo fiches finte: nessun soldo, nessun premio in denaro.
//  Tutto è salvato nel browser: se ricarichi la pagina non perdi niente,
//  e il timer continua a contare anche a pagina chiusa.
// ============================================================

const CHIAVE_SERATA = "poker.serate.stato";
const CHIAVE_CAMPIONATO = "poker.serate.campionato";
const MINUTI_PAUSA = 10;

// ---------- Lo stato della serata ----------

let stato = leggi(CHIAVE_SERATA) || {
  stack: 10000,         // fiches iniziali per giocatore
  ritmo: 15,            // minuti per livello
  livelli: [],          // { sb, bb, ante, minuti, pausa }
  timer: { livello: 0, inCorso: false, fine: null, restante: null },
  suono: true,
  giocatori: [],        // { id, nome, fiches, rientri, uscita, tavolo, posto }
  contatoreUscite: 0,   // per sapere chi è uscito prima e chi dopo
  serataSalvata: false,
};

// Le serate salvate prima dei tavoli non hanno questi dati: li aggiungiamo
stato.posti ??= 9;            // posti per tavolo (da 2 a 10)
stato.tavoli ??= [1];         // i numeri dei tavoli aperti
stato.multitavolo ??= false;  // c'è stato più di un tavolo? (serve per il "tavolo finale")
stato.giocatori.forEach(g => { g.tavolo ??= null; g.posto ??= null; });

let campionato = leggi(CHIAVE_CAMPIONATO) || { serate: 0, giocatori: {} };

// ---------- Salvataggio nel browser ----------
// localStorage può non funzionare (es. finestra anonima): usiamo try/catch.

function leggi(chiave) {
  try { return JSON.parse(localStorage.getItem(chiave)); } catch { return null; }
}

function salva() {
  try {
    localStorage.setItem(CHIAVE_SERATA, JSON.stringify(stato));
    localStorage.setItem(CHIAVE_CAMPIONATO, JSON.stringify(campionato));
  } catch { /* la pagina funziona lo stesso, ma non ricorda */ }
}

// ---------- Piccoli aiutanti ----------

// Il testo scritto dall'utente va "ripulito" prima di metterlo nella pagina
function pulisci(testo) {
  return String(testo ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// 12500 → "12.500" (in italiano; nelle altre lingue come si usa lì)
function numero(n) { return numeroLocale(Math.round(n), { useGrouping: "always" }); }

// Millisecondi → "12:05" (o "1:02:05" sopra l'ora)
function orologio(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
  const due = x => String(x).padStart(2, "0");
  return h ? `${h}:${due(m)}:${due(sec)}` : `${due(m)}:${due(sec)}`;
}

// Pulsanti "pericolosi" (azzerare, eliminare): il primo tocco chiede conferma,
// il secondo esegue. Se non confermi entro 4 secondi, torna tutto normale.
function confermaDoppia(pulsante, azione) {
  if (pulsante.dataset.conferma === "1") {
    clearTimeout(pulsante._timer);
    pulsante.dataset.conferma = "";
    pulsante.textContent = pulsante.dataset.testo;
    pulsante.classList.remove("pericolo");
    return azione();
  }
  pulsante.dataset.testo = pulsante.textContent;
  pulsante.dataset.conferma = "1";
  pulsante.textContent = t("Sicuro? Tocca di nuovo");
  pulsante.classList.add("pericolo");
  pulsante._timer = setTimeout(() => {
    pulsante.dataset.conferma = "";
    pulsante.textContent = pulsante.dataset.testo;
    pulsante.classList.remove("pericolo");
  }, 4000);
}

// ============================================================
//  1. LA STRUTTURA DEI BUI
// ============================================================

// Arrotonda a un valore "da fiche" (10, 20, 50, 100, 200, 500...)
function tondo(x) {
  const potenza = 10 ** Math.floor(Math.log10(x));
  const scelte = [1, 2, 5, 10].map(k => k * potenza);
  return scelte.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a);
}

// La struttura consigliata: si parte con un grande buio pari a circa
// 1/200 delle fiches iniziali (200 grandi bui a testa: si gioca con calma)
// e si sale a poco a poco moltiplicandolo (così i valori restano "puliti",
// es. 50, 100, 150, 200, 300...). Una pausa ogni 4 livelli.
// Il Big Blind Ante (uguale al grande buio) parte dopo la prima pausa.
function strutturaConsigliata(stack, minuti) {
  const base = tondo(stack / 200);
  const moltiplicatori = [1, 2, 3, 4, 6, 8, 10, 15, 20, 30, 40, 50, 60, 80, 100, 150, 200, 300, 400, 500];
  const livelli = [];
  moltiplicatori.forEach((m, i) => {
    const bb = base * m;
    livelli.push({ sb: bb / 2, bb, ante: i >= 4 ? bb : 0, minuti, pausa: false });
    if ((i + 1) % 4 === 0 && i < 12) livelli.push({ sb: 0, bb: 0, ante: 0, minuti: MINUTI_PAUSA, pausa: true });
  });
  return livelli;
}

// Il numero del livello senza contare le pause (Livello 1, 2, 3...)
function numeroLivello(indice) {
  return stato.livelli.slice(0, indice + 1).filter(l => !l.pausa).length;
}

function testoBui(l) {
  if (l.pausa) return "☕ " + t("Pausa");
  return `${numero(l.sb)} / ${numero(l.bb)}${l.ante ? ` · ${t("ante")} ${numero(l.ante)}` : ""}`;
}

function disegnaLivelli() {
  document.getElementById("stack-iniziale").value = stato.stack;
  document.getElementById("scelta-ritmo").value = String(stato.ritmo);

  const attuale = stato.timer.livello;
  document.getElementById("righe-livelli").innerHTML = stato.livelli.map((l, i) => {
    const classe = i === attuale ? "livello-attuale" : i < attuale ? "livello-passato" : "";
    const togli = `<button type="button" class="pulsante-piccolo" data-togli-livello="${i}" aria-label="${t("Togli")}">✖</button>`;
    if (l.pausa) {
      return `<tr class="${classe} riga-pausa"><th>☕</th><td colspan="3">${t("Pausa")}</td>
                <td><input type="number" min="1" max="120" value="${l.minuti}" data-livello="${i}" data-campo="minuti" aria-label="${t("Minuti di pausa")}"></td>
                <td>${togli}</td></tr>`;
    }
    const campo = (nome, etichetta) =>
      `<td><input type="number" min="0" step="any" value="${l[nome]}" data-livello="${i}" data-campo="${nome}" aria-label="${etichetta}"></td>`;
    return `<tr class="${classe}"><th>${numeroLivello(i)}</th>
              ${campo("sb", t("Piccolo buio"))}${campo("bb", t("Grande buio"))}${campo("ante", t("Ante"))}
              <td><input type="number" min="1" max="120" value="${l.minuti}" data-livello="${i}" data-campo="minuti" aria-label="${t("Minuti")}"></td>
              <td>${togli}</td></tr>`;
  }).join("");
}

// ============================================================
//  2. IL TIMER
// ============================================================

let audio = null;            // il "generatore di suoni" del browser
let avvisoFatto = false;     // il bip dell'ultimo minuto è già suonato?
let bloccoSchermo = null;    // tiene acceso lo schermo mentre il timer va

function livelloAttuale() { return stato.livelli[stato.timer.livello]; }

function tempoRestante() {
  const t = stato.timer;
  if (t.inCorso) return t.fine - Date.now();
  return t.restante ?? livelloAttuale().minuti * 60000;
}

// Un bip (o più bip di fila) creato dal browser, senza file audio
function bip(note = [880], durata = 0.18) {
  if (!stato.suono) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    note.forEach((frequenza, i) => {
      const oscillatore = audio.createOscillator();
      const volume = audio.createGain();
      const inizio = audio.currentTime + i * (durata + 0.07);
      oscillatore.frequency.value = frequenza;
      volume.gain.setValueAtTime(0.25, inizio);
      volume.gain.exponentialRampToValueAtTime(0.001, inizio + durata);
      oscillatore.connect(volume).connect(audio.destination);
      oscillatore.start(inizio);
      oscillatore.stop(inizio + durata);
    });
  } catch { /* niente suono, pazienza */ }
}

// Chiede al telefono/tablet di non spegnere lo schermo mentre il timer va
async function tieniAcceso(acceso) {
  try {
    if (acceso && "wakeLock" in navigator && !bloccoSchermo) {
      bloccoSchermo = await navigator.wakeLock.request("screen");
      bloccoSchermo.addEventListener("release", () => bloccoSchermo = null);
    } else if (!acceso && bloccoSchermo) {
      await bloccoSchermo.release();
    }
  } catch { /* non supportato: pazienza */ }
}

function avvia() {
  const t = stato.timer;
  if (t.inCorso) return;
  // Se il livello era finito (ultimo livello), ripartiamo da capo con il suo tempo
  const restante = tempoRestante() > 0 ? tempoRestante() : livelloAttuale().minuti * 60000;
  t.fine = Date.now() + restante;
  t.inCorso = true;
  t.restante = null;
  bip([660], 0.08);   // serve anche ad "accendere" l'audio del browser
  tieniAcceso(true);
  salva();
  disegnaTimer();
}

function pausa() {
  const t = stato.timer;
  if (!t.inCorso) return;
  t.restante = t.fine - Date.now();
  t.inCorso = false;
  t.fine = null;
  tieniAcceso(false);
  salva();
  disegnaTimer();
}

// Va al livello "indice", con il tempo pieno
function vaiAlLivello(indice) {
  const t = stato.timer;
  t.livello = Math.min(Math.max(indice, 0), stato.livelli.length - 1);
  const tempo = livelloAttuale().minuti * 60000;
  if (t.inCorso) t.fine = Date.now() + tempo;
  else t.restante = tempo;
  avvisoFatto = false;
  salva();
  disegnaTimer();
  disegnaLivelli();
  disegnaGiocatori();   // lo stack medio in grandi bui cambia
}

function aggiungiMinuto() {
  const t = stato.timer;
  if (t.inCorso) t.fine += 60000;
  else t.restante = tempoRestante() + 60000;
  salva();
  aggiornaTempo();
}

// Ogni 250 millesimi di secondo: aggiorna il tempo e, se serve, cambia livello
function battito() {
  const t = stato.timer;
  if (t.inCorso) {
    let cambiato = false;
    // "while": se la pagina è rimasta chiusa a lungo, possono essere passati più livelli
    while (t.fine <= Date.now()) {
      if (t.livello >= stato.livelli.length - 1) {     // ultimo livello: ci fermiamo
        t.inCorso = false; t.fine = null; t.restante = 0;
        break;
      }
      t.livello++;
      t.fine += livelloAttuale().minuti * 60000;
      cambiato = true;
    }
    if (cambiato || !t.inCorso) {
      avvisoFatto = false;
      bip(livelloAttuale().pausa ? [523, 659, 784] : [988, 988, 1319], 0.22);
      salva();
      disegnaTimer();
      disegnaLivelli();
      disegnaGiocatori();
      return;
    }
    // Bip di avviso quando manca 1 minuto
    const restante = t.fine - Date.now();
    if (restante <= 60000 && !avvisoFatto) { avvisoFatto = true; bip([740], 0.15); }
    else if (restante > 60000) avvisoFatto = false;
  }
  aggiornaTempo();
}

// Disegna tutto il riquadro del timer
function disegnaTimer() {
  const box = document.getElementById("timer");
  const tm = stato.timer;
  const l = livelloAttuale();
  const prossimo = stato.livelli[tm.livello + 1];
  const ultimo = tm.livello >= stato.livelli.length - 1;

  box.classList.toggle("in-pausa", !!l.pausa);
  box.innerHTML = `
    <div class="riga-timer">
      <span class="nome-livello-timer">${l.pausa ? "☕ " + t("Pausa") : `${t("Livello")} ${numeroLivello(tm.livello)}`}</span>
      <span class="stato-timer ${tm.inCorso ? "acceso" : ""}">${tm.inCorso ? t("● In corso") : t("❚❚ Fermo")}</span>
    </div>
    <div class="bui-grandi">${l.pausa ? t("Pausa: si contano le fiches!") : `${numero(l.sb)} <span>/</span> ${numero(l.bb)}`}</div>
    ${!l.pausa && l.ante ? `<div class="ante-grande">${t("Ante")} ${numero(l.ante)}</div>` : ""}
    <div class="tempo-grande" id="tempo">${orologio(tempoRestante())}</div>
    <div class="barra-tempo" aria-hidden="true"><span id="barra-tempo"></span></div>
    <p class="prossimo-livello">${prossimo ? `${t("Prossimo:")} <strong>${testoBui(prossimo)}</strong>` : t("🏁 Ultimo livello")}</p>
    <p class="info-tavolo" id="info-tavolo"></p>
    <div class="comandi-timer">
      <button type="button" class="pulsante-secondario" data-timer="indietro" ${tm.livello === 0 ? "disabled" : ""} aria-label="${t("Livello precedente")}">⏮</button>
      ${tm.inCorso
        ? `<button type="button" class="pulsante-principale grande" data-timer="pausa">⏸ ${t("Pausa")}</button>`
        : `<button type="button" class="pulsante-principale grande" data-timer="avvia">▶ ${tm.restante === null || tm.restante === l.minuti * 60000 ? t("Avvia") : t("Riprendi")}</button>`}
      <button type="button" class="pulsante-secondario" data-timer="avanti" ${ultimo ? "disabled" : ""} aria-label="${t("Livello successivo")}">⏭</button>
    </div>
    <div class="comandi-timer piccoli">
      <button type="button" class="pulsante-piccolo" data-timer="minuto">${t("+1 min")}</button>
      <button type="button" class="pulsante-piccolo" data-timer="ricomincia">${t("↺ Ricomincia il livello")}</button>
      <button type="button" class="pulsante-piccolo" data-timer="suono">${stato.suono ? t("🔊 Suono sì") : t("🔇 Suono no")}</button>
      <button type="button" class="pulsante-piccolo" data-timer="schermo">${t("⛶ Schermo intero")}</button>
    </div>`;
  aggiornaTempo();
  aggiornaInfoTavolo();
}

// Aggiorna solo il tempo e la barra (si chiama 4 volte al secondo)
function aggiornaTempo() {
  const tempo = document.getElementById("tempo");
  if (!tempo) return;
  const restante = tempoRestante();
  tempo.textContent = orologio(restante);
  tempo.classList.toggle("ultimo-minuto", restante <= 60000 && restante > 0);
  const totale = livelloAttuale().minuti * 60000;
  document.getElementById("barra-tempo").style.width = `${Math.min(100, Math.max(0, (1 - restante / totale) * 100))}%`;
}

// ============================================================
//  3. I GIOCATORI E LE FICHES
// ============================================================

const attivi = () => stato.giocatori.filter(g => g.uscita === null);
const usciti = () => stato.giocatori.filter(g => g.uscita !== null);

// La posizione di chi è uscito: l'ultimo a uscire è il meglio piazzato tra gli usciti
function posizioni() {
  const mappa = {};
  const quantiAttivi = attivi().length;
  usciti().sort((a, b) => b.uscita - a.uscita).forEach((g, i) => mappa[g.id] = quantiAttivi + 1 + i);
  // Se ne resta uno solo, è lui il vincitore
  if (quantiAttivi === 1 && stato.giocatori.length > 1) mappa[attivi()[0].id] = 1;
  return mappa;
}

// Il grande buio di adesso (durante la pausa, quello del livello dopo)
function grandeBuioAttuale() {
  for (let i = stato.timer.livello; i < stato.livelli.length; i++) if (!stato.livelli[i].pausa) return stato.livelli[i].bb;
  return 0;
}

// Tutte le fiches messe in gioco: fiches iniziali × giocatori, più i rientri
function fichesDistribuite() {
  const rientri = stato.giocatori.reduce((t, g) => t + g.rientri, 0);
  return (stato.giocatori.length + rientri) * stato.stack;
}

// Riga sotto al timer: giocatori in gioco e stack medio
function aggiornaInfoTavolo() {
  const box = document.getElementById("info-tavolo");
  if (!box) return;
  const inGioco = attivi();
  if (!stato.giocatori.length) { box.textContent = t("Aggiungi i giocatori qui sotto 👇"); return; }
  // Come nei timer dei tornei: tutte le fiches diviso chi è rimasto
  // (è giusto anche se non avete ancora riscritto le fiches di ognuno)
  const medio = inGioco.length ? fichesDistribuite() / inGioco.length : 0;
  const bb = grandeBuioAttuale();
  // Con più tavoli: quanti sono e se c'è da bilanciare (si vede anche a schermo intero)
  const p = calcolaProposta();
  const tavoli = stato.tavoli.length > 1 ? ` · 🪑 ${t("<strong>{n}</strong> tavoli", { n: stato.tavoli.length })}` : "";
  const daFare = ["chiudi", "sposta", "attesa"].includes(p.tipo) ? ` · <span class="evidenza">${t("⚖️ Tavoli da sistemare")}</span>` : "";
  box.innerHTML = `👥 ${t("In gioco")} <strong>${inGioco.length}</strong>/${stato.giocatori.length}
    · ${t("Stack medio")} <strong>${numero(medio)}</strong>${bb ? ` (${t("{n} grandi bui", { n: Math.round(medio / bb) })})` : ""}${tavoli}${daFare}`;
}

// Il controllo delle fiches: la somma di quelle scritte deve essere uguale
// a quelle distribuite. Quando qualcuno esce, le sue fiches passano a chi
// l'ha battuto: finché non le riscrivete il conto non torna (è normale).
function disegnaContoFiches() {
  const box = document.getElementById("conto-fiches");
  if (!stato.giocatori.length) { box.innerHTML = ""; return; }
  const rientri = stato.giocatori.reduce((t, g) => t + g.rientri, 0);
  const attese = fichesDistribuite();
  const scritte = stato.giocatori.reduce((t, g) => t + g.fiches, 0);
  const esito = scritte === attese
    ? `<span class="positivo">${t("✅ I conti tornano")}</span>`
    : `<span class="evidenza">${scritte < attese
        ? t("✍️ Le fiches scritte sono {scritte}: aggiornatele quando le contate (mancano {n})",
            { scritte: numero(scritte), n: numero(attese - scritte) })
        : t("✍️ Le fiches scritte sono {scritte}: aggiornatele quando le contate (ce ne sono in più {n})",
            { scritte: numero(scritte), n: numero(scritte - attese) })}</span>`;
  box.innerHTML = `${t("Fiches in gioco")} <strong>${numero(attese)}</strong>
    <small>(${stato.giocatori.length} × ${numero(stato.stack)}${rientri ? ` + ${rientri === 1 ? t("1 rientro") : t("{n} rientri", { n: rientri })}` : ""})</small>
    · ${esito}`;
}

function disegnaGiocatori() {
  const box = document.getElementById("elenco-giocatori");
  const pos = posizioni();
  const bb = grandeBuioAttuale();

  // In gioco (dal più ricco), poi gli usciti in ordine di classifica
  const ordine = [
    ...attivi().sort((a, b) => b.fiches - a.fiches),
    ...usciti().sort((a, b) => pos[a.id] - pos[b.id]),
  ];

  if (!ordine.length) {
    box.innerHTML = `<p class="attesa">${t("🪑 Nessuno al tavolo. Aggiungi i giocatori della serata!")}</p>`;
  } else {
    box.innerHTML = ordine.map((g, i) => {
      const fuori = g.uscita !== null;
      const vincitore = pos[g.id] === 1;
      const medaglia = vincitore ? "🏆" : pos[g.id] === 2 ? "🥈" : pos[g.id] === 3 ? "🥉" : "";
      return `
        <div class="giocatore ${fuori ? "fuori" : ""} ${vincitore ? "vincitore" : ""}">
          <span class="posizione-giocatore">${pos[g.id] ? `${medaglia || pos[g.id] + "°"}` : i + 1}</span>
          <span class="nome-giocatore">${pulisci(g.nome)}
            ${!fuori && seduto(g) ? `<small>🪑 ${t("Tavolo {t} · posto {p}", { t: g.tavolo, p: g.posto })}</small>` : ""}
            ${g.rientri ? `<small>🔁 ${g.rientri === 1 ? t("1 rientro") : t("{n} rientri", { n: g.rientri })}</small>` : ""}
            ${vincitore ? `<small class="positivo">${t("Vince la serata!")}</small>` : ""}</span>
          ${fuori
            ? `<span class="fiches-giocatore">${t("{n}° posto", { n: pos[g.id] })}</span>
               <span class="azioni-giocatore">
                 <button type="button" class="pulsante-piccolo" data-annulla="${g.id}" title="${t("Era un errore: torna in gioco")}">${t("↩️ Annulla")}</button>
                 <button type="button" class="pulsante-piccolo" data-rientro="${g.id}" title="${t("Rientra con {n} fiches", { n: numero(stato.stack) })}">${t("🔁 Rientro")}</button>
               </span>`
            : `<label class="fiches-giocatore">
                 <input type="number" min="0" step="any" class="campo-testo" value="${g.fiches}" data-fiches="${g.id}" aria-label="${t("Fiches di {nome}", { nome: pulisci(g.nome) })}">
                 ${bb ? `<small>${Math.round(g.fiches / bb)} BB</small>` : ""}
               </label>
               <span class="azioni-giocatore">
                 ${attivi().length > 1 ? `<button type="button" class="pulsante-piccolo" data-fuori="${g.id}">${t("💀 Fuori")}</button>` : ""}
                 <button type="button" class="pulsante-piccolo" data-togli="${g.id}" aria-label="${t("Togli {nome}", { nome: pulisci(g.nome) })}">✖</button>
               </span>`}
        </div>`;
    }).join("");
  }
  disegnaContoFiches();
  aggiornaInfoTavolo();
  disegnaTavoli();     // chi esce libera un posto: i tavoli cambiano
}

function aggiungiGiocatore(nome) {
  nome = nome.trim();
  if (!nome) return;
  // Il nuovo arrivato aspetta un posto: lo si fa sedere dal riquadro dei tavoli
  stato.giocatori.push({ id: Date.now() + Math.random(), nome, fiches: stato.stack, rientri: 0, uscita: null, tavolo: null, posto: null });
  salva();
  disegnaGiocatori();
}

function trova(id) { return stato.giocatori.find(g => String(g.id) === String(id)); }

function eliminaGiocatore(id) {
  const g = trova(id);
  g.uscita = ++stato.contatoreUscite;
  g.fiches = 0;
  bip([392, 330], 0.15);
  salva();
  disegnaGiocatori();
}

// ============================================================
//  3b. I TAVOLI E I POSTI
// ============================================================
// Ogni giocatore in gioco ha un tavolo e un posto (g.tavolo, g.posto),
// oppure aspetta di sedersi (null). Chi esce libera il suo posto.
// Come nei tornei, i tavoli devono restare il più possibile pari:
//  - se tutti stanno in un tavolo in meno, se ne chiude uno;
//  - se un tavolo ha 2 o più giocatori in più di un altro, se ne sposta uno.
// L'app propone, voi confermate.

// Mescola un elenco (metodo di Fisher-Yates: ogni ordine ha la stessa probabilità)
function mescola(elenco) {
  const copia = [...elenco];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const unoACaso = elenco => elenco[Math.floor(Math.random() * elenco.length)];

// È seduto a un tavolo ancora aperto?
const seduto = g => g.tavolo !== null && g.posto !== null && stato.tavoli.includes(g.tavolo);
const alTavolo = t => attivi().filter(g => seduto(g) && g.tavolo === t).sort((a, b) => a.posto - b.posto);
const inAttesa = () => attivi().filter(g => !seduto(g));

function postiLiberi(t) {
  const occupati = new Set(alTavolo(t).map(g => g.posto));
  const liberi = [];
  for (let p = 1; p <= stato.posti; p++) if (!occupati.has(p)) liberi.push(p);
  return liberi;
}

// Il tavolo con meno giocatori che ha ancora un posto libero (a parità, il numero più basso)
function tavoloPiuVuoto() {
  let migliore = null;
  stato.tavoli.forEach(t => {
    if (!postiLiberi(t).length) return;
    if (migliore === null || alTavolo(t).length < alTavolo(migliore).length) migliore = t;
  });
  return migliore;
}

// 🎲 Sorteggio: servono tanti tavoli quanti bastano, e i giocatori si
// distribuiscono a giro come le carte (tavolo 1, 2, 3, 1, 2, 3...),
// così i tavoli restano pari. Il posto al tavolo è a caso.
function sorteggiaTutti() {
  const giocatori = mescola(attivi());
  const quanti = Math.max(1, Math.ceil(giocatori.length / stato.posti));
  stato.tavoli = Array.from({ length: quanti }, (_, i) => i + 1);
  if (quanti > 1) stato.multitavolo = true;
  giocatori.forEach(g => { g.tavolo = null; g.posto = null; });
  giocatori.forEach((g, i) => {
    g.tavolo = stato.tavoli[i % quanti];
    g.posto = unoACaso(postiLiberi(g.tavolo));
  });
  salva();
  disegnaGiocatori();
}

// Fa sedere chi aspetta (nuovi arrivati, rientri) ai tavoli più vuoti
function siediChiAspetta() {
  mescola(inAttesa()).forEach(g => {
    const t = tavoloPiuVuoto();
    if (t === null) return;          // tutti i tavoli sono pieni
    g.tavolo = t;
    g.posto = unoACaso(postiLiberi(t));
  });
  salva();
  disegnaGiocatori();
}

// La proposta resta in memoria finché i posti non cambiano:
// così i posti scelti a caso non cambiano a ogni ridisegno della pagina.
let proposta = null;

function calcolaProposta() {
  const chiave = JSON.stringify([stato.posti, stato.tavoli, attivi().map(g => [g.id, g.tavolo, g.posto])]);
  if (!proposta || proposta.chiave !== chiave) proposta = { ...nuovaProposta(), chiave };
  return proposta;
}

function nuovaProposta() {
  const aspettano = inAttesa();
  const seduti = attivi().length - aspettano.length;
  if (!attivi().length) return { tipo: "vuoto" };
  // Nessuno è ancora seduto: si comincia (non è un avviso)
  if (!seduti) return { tipo: "inizio" };
  if (aspettano.length) {
    const liberi = stato.tavoli.reduce((somma, t) => somma + postiLiberi(t).length, 0);
    return { tipo: "attesa", quanti: aspettano.length, liberi };
  }
  if (stato.tavoli.length < 2) return { tipo: "ok" };

  const conteggi = stato.tavoli.map(t => ({ t, n: alTavolo(t).length }));

  // 1. Tutti ci stanno in un tavolo in meno? Si chiude il tavolo più vuoto
  //    (a parità, quello con il numero più alto).
  if (seduti <= (stato.tavoli.length - 1) * stato.posti) {
    const daChiudere = [...conteggi].sort((a, b) => a.n - b.n || b.t - a.t)[0].t;
    // Proviamo gli spostamenti: ognuno va al tavolo rimasto più vuoto, in un posto libero a caso
    const occupati = {};
    stato.tavoli.filter(t => t !== daChiudere).forEach(t => occupati[t] = new Set(alTavolo(t).map(g => g.posto)));
    const spostamenti = alTavolo(daChiudere).map(g => {
      const t = Object.keys(occupati).map(Number)
        .filter(x => occupati[x].size < stato.posti)
        .sort((a, b) => occupati[a].size - occupati[b].size || a - b)[0];
      const liberi = [];
      for (let p = 1; p <= stato.posti; p++) if (!occupati[t].has(p)) liberi.push(p);
      const posto = unoACaso(liberi);
      occupati[t].add(posto);
      return { id: g.id, tavolo: t, posto };
    });
    return { tipo: "chiudi", tavolo: daChiudere, spostamenti, finale: stato.tavoli.length === 2 };
  }

  // 2. Un tavolo ha 2 o più giocatori in più di un altro? Se ne sposta uno.
  const ordinati = [...conteggi].sort((a, b) => a.n - b.n || a.t - b.t);
  const vuoto = ordinati[0], pieno = ordinati[ordinati.length - 1];
  if (pieno.n - vuoto.n >= 2) {
    return { tipo: "sposta", da: pieno.t, nDa: pieno.n, a: vuoto.t, nA: vuoto.n, posto: unoACaso(postiLiberi(vuoto.t)) };
  }
  return { tipo: "ok" };
}

// Il menu "tavolo e posto" accanto a ogni nome (per la scelta a mano):
// mostra i posti liberi di ogni tavolo, più quello dove il giocatore è già seduto
function sceltaPosto(g) {
  let opzioni = `<option value="">${t("⏳ In attesa")}</option>`;
  stato.tavoli.forEach(tv => {
    const lista = postiLiberi(tv);
    if (seduto(g) && g.tavolo === tv) lista.push(g.posto);
    lista.sort((a, b) => a - b);
    opzioni += `<optgroup label="${t("Tavolo {t}", { t: tv })}">${lista.map(p =>
      `<option value="${tv}:${p}" ${seduto(g) && g.tavolo === tv && g.posto === p ? "selected" : ""}>${t("Tavolo {t} · posto {p}", { t: tv, p })}</option>`).join("")}</optgroup>`;
  });
  return `<select data-sposta="${g.id}" aria-label="${t("Tavolo e posto di {nome}", { nome: pulisci(g.nome) })}">${opzioni}</select>`;
}

function disegnaTavoli() {
  document.getElementById("posti-tavolo").value = String(stato.posti);
  const p = calcolaProposta();
  const nome = id => pulisci(trova(id).nome);
  const finale = stato.tavoli.length === 1 && stato.multitavolo;

  // --- L'avviso: cosa c'è da fare ---
  let avviso = "";
  if (p.tipo === "vuoto") {
    avviso = t("👆 Aggiungi i giocatori qui sopra, poi tocca <strong>🎲 Sorteggia tutti i posti</strong> (o scegli tavolo e posto a mano). Servono più tavoli? Tocca <strong>+ Tavolo</strong>.");
  } else if (p.tipo === "inizio") {
    avviso = t("🎲 Tocca <strong>Sorteggia tutti i posti</strong>, oppure scegli tavolo e posto a mano per ogni giocatore.");
  } else if (p.tipo === "attesa") {
    avviso = `🪑 ${p.quanti === 1 ? t("<strong>1</strong> giocatore aspetta un posto.") : t("<strong>{n}</strong> giocatori aspettano un posto.", { n: p.quanti })}
      ${p.liberi < p.quanti ? `<br>${t("I posti liberi sono solo {n}: aggiungi un tavolo (<strong>+ Tavolo</strong>) o aumenta i posti per tavolo.", { n: p.liberi })}` : ""}
      ${p.liberi ? `<div class="pulsanti-mano"><button type="button" class="pulsante-principale" data-tavoli="siedi">${t("🎲 Dai un posto a chi aspetta")}</button></div>` : ""}`;
  } else if (p.tipo === "chiudi") {
    avviso = `⚖️ <strong>${t("Si può chiudere il Tavolo {t}", { t: p.tavolo })}</strong>:
      ${p.finale ? t("tutti ci stanno in un tavolo solo, si passa al <strong>🏆 tavolo finale</strong>!") : t("gli altri tavoli hanno posto per tutti.")}
      <ul>${p.spostamenti.map(s => `<li>${nome(s.id)} → ${t("Tavolo {t}, posto {p}", { t: s.tavolo, p: s.posto })}</li>`).join("")}</ul>
      <div class="pulsanti-mano"><button type="button" class="pulsante-principale" data-tavoli="chiudi">${t("✅ Fatto: chiudi il tavolo e sposta")}</button></div>`;
  } else if (p.tipo === "sposta") {
    avviso = `⚖️ ${t("<strong>Tavoli da bilanciare</strong>: il Tavolo {da} ha {nDa} giocatori, il Tavolo {a} solo {nA}.", p)}
      ${t("Sposta un giocatore al <strong>Tavolo {a}, posto {posto}</strong>.", p)}
      <br><small>${t("Nei tornei di solito si sposta il giocatore che sarà il prossimo grande buio al tavolo più pieno.")}</small>
      <div class="pulsanti-mano">
        <select id="chi-sposta" aria-label="${t("Chi si sposta")}">${alTavolo(p.da).map(g =>
          `<option value="${g.id}">${t("Posto {p}", { p: g.posto })} · ${pulisci(g.nome)}</option>`).join("")}</select>
        <button type="button" class="pulsante-principale" data-tavoli="sposta">${t("✅ Sposta")}</button>
      </div>`;
  } else if (p.tipo === "ok" && finale) {
    avviso = `${t("🏆 <strong>Tavolo finale!</strong> Se volete, ri-sorteggiate i posti.")}
      <div class="pulsanti-mano"><button type="button" class="pulsante-secondario" data-tavoli="sorteggia">${t("🎲 Sorteggia i posti del tavolo finale")}</button></div>`;
  } else if (p.tipo === "ok") {
    avviso = stato.tavoli.length > 1 ? t("✅ Tavoli in equilibrio.") : t("✅ Tutti seduti.");
  }
  const box = document.getElementById("avviso-tavoli");
  box.innerHTML = avviso;
  box.classList.toggle("da-fare", ["chiudi", "sposta", "attesa"].includes(p.tipo));

  // --- Le schede dei tavoli, posto per posto ---
  const riga = (numeroPosto, g) => g
    ? `<div class="posto"><span class="numero-posto">${numeroPosto}</span>
         <span class="nome-al-posto">${pulisci(g.nome)}</span>${sceltaPosto(g)}</div>`
    : `<div class="posto libero"><span class="numero-posto">${numeroPosto}</span><span>${t("libero")}</span><span></span></div>`;

  let html = stato.tavoli.map(tv => {
    const seduti = alTavolo(tv);
    const righe = [];
    for (let n = 1; n <= stato.posti; n++) righe.push(riga(n, seduti.find(g => g.posto === n)));
    return `
      <div class="scheda-tavolo ${finale ? "finale" : ""}">
        <div class="testata-tavolo">
          <strong>${finale ? t("🏆 Tavolo finale") : `🪑 ${t("Tavolo {t}", { t: tv })}`}</strong>
          <span class="conto-posti">${seduti.length}/${stato.posti}</span>
          ${!seduti.length && stato.tavoli.length > 1
            ? `<button type="button" class="pulsante-piccolo" data-togli-tavolo="${tv}" aria-label="${t("Chiudi il tavolo {t}", { t: tv })}">✖</button>` : ""}
        </div>
        ${righe.join("")}
      </div>`;
  }).join("");

  // Chi aspetta un posto ha la sua scheda, con lo stesso menu per sceglierlo a mano
  const aspettano = inAttesa();
  if (aspettano.length) {
    html += `
      <div class="scheda-tavolo in-attesa">
        <div class="testata-tavolo"><strong>${t("⏳ In attesa di posto")}</strong><span class="conto-posti">${aspettano.length}</span></div>
        ${aspettano.map(g => `<div class="posto"><span class="numero-posto">–</span>
          <span class="nome-al-posto">${pulisci(g.nome)}</span>${sceltaPosto(g)}</div>`).join("")}
      </div>`;
  }
  document.getElementById("elenco-tavoli").innerHTML = html;
}

// ============================================================
//  5. IL CAMPIONATO
// ============================================================

function chiudiSerata() {
  const esito = document.getElementById("esito-campionato");
  if (stato.giocatori.length < 2) { esito.textContent = t("Servono almeno 2 giocatori per salvare la serata."); return; }
  if (stato.serataSalvata) { esito.textContent = t("Questa serata è già nel campionato. Per giocarne un'altra tocca \"Nuova serata\"."); return; }

  // Classifica finale: chi è ancora in gioco viene ordinato per fiches
  const pos = posizioni();
  const inGioco = attivi().sort((a, b) => b.fiches - a.fiches);
  inGioco.forEach((g, i) => pos[g.id] = i + 1);

  const n = stato.giocatori.length;
  stato.giocatori.forEach(g => {
    const scheda = campionato.giocatori[g.nome] ??= { punti: 0, serate: 0, vittorie: 0 };
    scheda.punti += n - pos[g.id] + 1;
    scheda.serate += 1;
    if (pos[g.id] === 1) scheda.vittorie += 1;
  });
  campionato.serate += 1;
  stato.serataSalvata = true;
  salva();

  const vincitore = stato.giocatori.find(g => pos[g.id] === 1);
  esito.innerHTML = `${t("✅ Serata salvata! Vince <strong>{nome}</strong>", { nome: pulisci(vincitore.nome) })}
    ${inGioco.length > 1 ? t("(classifica decisa dalle fiches di chi era ancora in gioco)") : ""} 🏆`;
  disegnaCampionato();
}

// Nuova serata con gli stessi giocatori: fiches iniziali, timer da capo
function nuovaSerata() {
  // Nuova serata = nuovo sorteggio dei posti
  stato.giocatori.forEach(g => { g.fiches = stato.stack; g.rientri = 0; g.uscita = null; g.tavolo = null; g.posto = null; });
  stato.tavoli = [1];
  stato.multitavolo = false;
  stato.contatoreUscite = 0;
  stato.serataSalvata = false;
  stato.timer = { livello: 0, inCorso: false, fine: null, restante: null };
  tieniAcceso(false);
  salva();
  document.getElementById("esito-campionato").textContent = t("🃏 Nuova serata pronta: mescolate le carte!");
  ridisegnaTutto();
}

function disegnaCampionato() {
  const box = document.getElementById("classifica-campionato");
  const righe = Object.entries(campionato.giocatori)
    .sort((a, b) => b[1].punti - a[1].punti || b[1].vittorie - a[1].vittorie);
  if (!righe.length) {
    box.innerHTML = `<p class="aiuto">${t("Il campionato è ancora vuoto: salva la prima serata!")}</p>`;
    return;
  }
  box.innerHTML = `
    <div class="tabella-scorrevole">
      <table class="confronto stretta">
        <thead><tr><th>#</th><th>${t("Giocatore")}</th><th>${t("Punti")}</th><th>${t("Serate")}</th><th>${t("Vittorie")}</th></tr></thead>
        <tbody>${righe.map(([nome, s], i) => `
          <tr><th>${["🥇", "🥈", "🥉"][i] || i + 1}</th><td>${pulisci(nome)}</td>
              <td><strong>${s.punti}</strong></td><td>${s.serate}</td><td>${s.vittorie}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p class="aiuto">${t("Serate giocate:")} ${campionato.serate}</p>
    <button type="button" class="pulsante-piccolo" id="azzera-campionato">${t("🗑️ Azzera il campionato")}</button>`;
}

// ---------- Avvio ----------

function ridisegnaTutto() {
  disegnaTimer();
  disegnaLivelli();
  disegnaGiocatori();
  disegnaCampionato();
}

document.addEventListener("DOMContentLoaded", () => {
  // Prima volta: creiamo la struttura consigliata
  if (!stato.livelli.length) stato.livelli = strutturaConsigliata(stato.stack, stato.ritmo);
  ridisegnaTutto();
  if (stato.timer.inCorso) tieniAcceso(true);
  setInterval(battito, 250);

  // --- Timer ---
  document.getElementById("timer").addEventListener("click", evento => {
    const b = evento.target.closest("[data-timer]");
    if (!b) return;
    const azione = b.dataset.timer;
    if (azione === "avvia") avvia();
    if (azione === "pausa") pausa();
    if (azione === "avanti") vaiAlLivello(stato.timer.livello + 1);
    if (azione === "indietro") vaiAlLivello(stato.timer.livello - 1);
    if (azione === "ricomincia") vaiAlLivello(stato.timer.livello);
    if (azione === "minuto") aggiungiMinuto();
    if (azione === "suono") { stato.suono = !stato.suono; salva(); disegnaTimer(); }
    if (azione === "schermo") {
      const timer = document.getElementById("timer");
      if (document.fullscreenElement) document.exitFullscreen();
      else timer.requestFullscreen?.().catch(() => {});
    }
  });

  // Tastiera: spazio = avvia/pausa (se non stai scrivendo in un campo)
  document.addEventListener("keydown", evento => {
    if (evento.code !== "Space" || evento.target.matches("input, textarea, select, button")) return;
    evento.preventDefault();
    stato.timer.inCorso ? pausa() : avvia();
  });

  // --- Giocatori ---
  document.getElementById("aggiungi-giocatore").addEventListener("submit", evento => {
    evento.preventDefault();
    const campo = document.getElementById("nome-giocatore");
    aggiungiGiocatore(campo.value);
    campo.value = "";
    campo.focus();
  });

  const elenco = document.getElementById("elenco-giocatori");
  elenco.addEventListener("change", evento => {
    const campo = evento.target.closest("[data-fiches]");
    if (!campo) return;
    trova(campo.dataset.fiches).fiches = Math.max(0, parseFloat(campo.value) || 0);
    salva();
    disegnaGiocatori();
  });
  elenco.addEventListener("click", evento => {
    const b = evento.target.closest("button");
    if (!b) return;
    if (b.dataset.fuori) eliminaGiocatore(b.dataset.fuori);
    if (b.dataset.annulla) {            // era un errore: torna in gioco
      const g = trova(b.dataset.annulla);
      // Se intanto il suo posto è stato preso, aspetterà un posto nuovo
      const preso = attivi().some(a => seduto(a) && a.tavolo === g.tavolo && a.posto === g.posto);
      if (preso) { g.tavolo = null; g.posto = null; }
      g.uscita = null;
      salva(); disegnaGiocatori();
    }
    if (b.dataset.rientro) {            // rientra con le fiches iniziali e un posto nuovo
      const g = trova(b.dataset.rientro);
      g.uscita = null; g.rientri++; g.fiches = stato.stack;
      g.tavolo = null; g.posto = null;
      salva(); disegnaGiocatori();
    }
    if (b.dataset.togli) {
      confermaDoppia(b, () => {
        stato.giocatori = stato.giocatori.filter(g => String(g.id) !== b.dataset.togli);
        salva(); disegnaGiocatori();
      });
    }
  });

  // --- Tavoli e posti ---
  document.getElementById("posti-tavolo").addEventListener("change", evento => {
    stato.posti = Number(evento.target.value);
    // Chi era seduto in un posto che non esiste più aspetta un posto nuovo
    stato.giocatori.forEach(g => { if (g.posto > stato.posti) { g.tavolo = null; g.posto = null; } });
    salva();
    disegnaGiocatori();
  });
  document.getElementById("sorteggia-posti").addEventListener("click", evento => {
    // Se qualcuno è già seduto chiediamo conferma: il sorteggio rimescola tutti
    if (attivi().some(seduto)) confermaDoppia(evento.currentTarget, sorteggiaTutti);
    else sorteggiaTutti();
  });
  document.getElementById("aggiungi-tavolo").addEventListener("click", () => {
    stato.tavoli.push(Math.max(0, ...stato.tavoli) + 1);
    stato.multitavolo = true;
    salva();
    disegnaGiocatori();
  });

  const pannelloTavoli = document.getElementById("pannello-tavoli");
  pannelloTavoli.addEventListener("change", evento => {
    const scelta = evento.target.closest("[data-sposta]");
    if (!scelta) return;
    const g = trova(scelta.dataset.sposta);
    const [t, p] = scelta.value ? scelta.value.split(":").map(Number) : [null, null];
    g.tavolo = t; g.posto = p;
    salva();
    disegnaGiocatori();
  });
  pannelloTavoli.addEventListener("click", evento => {
    const togli = evento.target.closest("[data-togli-tavolo]");
    if (togli) {                         // solo i tavoli vuoti si possono togliere
      stato.tavoli = stato.tavoli.filter(t => t !== Number(togli.dataset.togliTavolo));
      salva(); disegnaGiocatori();
      return;
    }
    const b = evento.target.closest("[data-tavoli]");
    if (!b) return;
    const p = calcolaProposta();
    const azione = b.dataset.tavoli;
    if (azione === "siedi") return siediChiAspetta();
    if (azione === "sorteggia") return sorteggiaTutti();
    if (azione === "chiudi" && p.tipo === "chiudi") {
      p.spostamenti.forEach(s => { const g = trova(s.id); g.tavolo = s.tavolo; g.posto = s.posto; });
      stato.tavoli = stato.tavoli.filter(t => t !== p.tavolo);
      if (stato.tavoli.length === 1) bip([523, 659, 784, 1047], 0.18);   // 🏆 tavolo finale!
    }
    if (azione === "sposta" && p.tipo === "sposta") {
      const g = trova(document.getElementById("chi-sposta").value);
      g.tavolo = p.a; g.posto = p.posto;
    }
    salva();
    disegnaGiocatori();
  });

  // --- Struttura dei bui ---
  document.getElementById("applica-ritmo").addEventListener("click", evento => {
    confermaDoppia(evento.currentTarget, () => {
      stato.ritmo = Number(document.getElementById("scelta-ritmo").value);
      stato.livelli = strutturaConsigliata(stato.stack, stato.ritmo);
      vaiAlLivello(0);
    });
  });
  document.getElementById("scelta-ritmo").addEventListener("change", evento => {
    stato.ritmo = Number(evento.target.value);
    salva();
  });
  document.getElementById("stack-iniziale").addEventListener("change", evento => {
    const nuovo = Math.max(100, parseFloat(evento.target.value) || 10000);
    // Chi non ha ancora giocato riceve il nuovo numero di fiches
    stato.giocatori.forEach(g => { if (g.fiches === stato.stack && g.uscita === null) g.fiches = nuovo; });
    stato.stack = nuovo;
    salva();
    ridisegnaTutto();
  });

  const tabella = document.getElementById("righe-livelli");
  tabella.addEventListener("change", evento => {
    const campo = evento.target.closest("[data-livello]");
    if (!campo) return;
    const l = stato.livelli[Number(campo.dataset.livello)];
    const valore = Math.max(0, parseFloat(campo.value) || 0);
    l[campo.dataset.campo] = campo.dataset.campo === "minuti" ? Math.max(1, valore) : valore;
    salva();
    disegnaTimer();
  });
  tabella.addEventListener("click", evento => {
    const b = evento.target.closest("[data-togli-livello]");
    if (!b || stato.livelli.length <= 1) return;
    const i = Number(b.dataset.togliLivello);
    stato.livelli.splice(i, 1);
    if (stato.timer.livello >= stato.livelli.length) stato.timer.livello = stato.livelli.length - 1;
    salva();
    disegnaLivelli();
    disegnaTimer();
  });
  document.getElementById("aggiungi-livello").addEventListener("click", () => {
    // Il nuovo livello raddoppia l'ultimo livello di gioco
    const ultimo = [...stato.livelli].reverse().find(l => !l.pausa) || { bb: 100, ante: 0 };
    const bb = ultimo.bb * 2;
    stato.livelli.push({ sb: bb / 2, bb, ante: ultimo.ante ? bb : 0, minuti: stato.ritmo, pausa: false });
    salva();
    disegnaLivelli();
    disegnaTimer();
  });
  document.getElementById("aggiungi-pausa").addEventListener("click", () => {
    stato.livelli.push({ sb: 0, bb: 0, ante: 0, minuti: MINUTI_PAUSA, pausa: true });
    salva();
    disegnaLivelli();
    disegnaTimer();
  });

  // --- Campionato ---
  document.getElementById("chiudi-serata").addEventListener("click", chiudiSerata);
  document.getElementById("nuova-serata").addEventListener("click", evento =>
    confermaDoppia(evento.currentTarget, nuovaSerata));
  document.getElementById("classifica-campionato").addEventListener("click", evento => {
    const b = evento.target.closest("#azzera-campionato");
    if (!b) return;
    confermaDoppia(b, () => {
      campionato = { serate: 0, giocatori: {} };
      salva();
      document.getElementById("esito-campionato").textContent = t("Campionato azzerato.");
      disegnaCampionato();
    });
  });
});
