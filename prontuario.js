// ============================================================
//  prontuario.js — codice della sola pagina Prontuario.
//  Contiene le voci del glossario e la ricerca tra le voci.
// ============================================================

// Le voci del glossario: [parola, spiegazione], tradotte con t() (lingua.js).
// Per aggiungerne una basta scrivere una nuova riga (l'ordine
// alfabetico lo sistema il codice da solo).
const GLOSSARIO = [
  [t("All-in"), t("Puntare tutte le fiches che hai davanti.")],
  [t("Ante"), t("Piccola quota obbligatoria in aggiunta ai bui, usata soprattutto nei tornei.")],
  [t("Big Blind Ante"), t("L'ante pagata per tutto il tavolo dal giocatore di grande buio. Oggi è lo standard nei tornei.")],
  [t("Board"), t("Le carte comuni scoperte al centro del tavolo (fino a 5).")],
  [t("Bolla"), t("Nei tornei, il momento in cui manca un'eliminazione per entrare nei premi.")],
  [t("Bottone (Button, BTN)"), t("Il segnalino del mazziere. Chi lo ha parla per ultimo dal flop in poi: è la posizione migliore.")],
  [t("Bruciare (Burn)"), t("Scartare coperta la prima carta del mazzo prima di flop, turn e river, per evitare che qualcuno l'abbia vista.")],
  [t("Buio (Blind)"), t("Puntata obbligatoria prima di vedere le carte: piccolo buio (SB) e grande buio (BB).")],
  [t("Bet"), t("Fare la prima puntata in un giro.")],
  [t("Call"), t("Pareggiare la puntata più alta (\"vedo\").")],
  [t("Cash game"), t("Partita in cui le fiches corrispondono a un valore e i bui restano fissi. Si entra e si esce quando si vuole.")],
  [t("Check"), t("Passare la parola senza puntare (\"busso\"). Possibile solo se nessuno ha puntato.")],
  [t("Colore (Flush)"), t("5 carte dello stesso seme.")],
  [t("Cutoff (CO)"), t("Il posto subito a destra del bottone: la seconda posizione migliore.")],
  [t("Draw (Progetto)"), t("Mano incompleta che ha bisogno di una carta per diventare forte, es. 4 carte a colore.")],
  [t("Equity"), t("La parte di piatto che ti spetta \"in media\", in base alle probabilità di vincere la mano.")],
  [t("Flop"), t("Le prime 3 carte comuni, girate insieme.")],
  [t("Fold"), t("Passare: buttare le carte e rinunciare al piatto.")],
  [t("Full (Full house)"), t("Un tris più una coppia.")],
  [t("Heads-up"), t("Testa a testa: mano o partita tra soli 2 giocatori.")],
  [t("Hijack (HJ)"), t("Il posto a destra del cutoff.")],
  [t("Hole cards"), t("Le tue 2 carte personali coperte.")],
  [t("Kicker"), t("La carta che non fa parte della combinazione ma spareggia a parità di punto.")],
  [t("Limp"), t("Entrare nel piatto pre-flop solo pagando il grande buio, senza rilanciare.")],
  [t("Lojack (LJ)"), t("Il posto a destra dell'hijack: la prima delle posizioni intermedie.")],
  [t("Middle position (MP)"), t("Posizione centrale del tavolo, tra le iniziali e quelle finali.")],
  [t("Muck"), t("Buttare le carte senza mostrarle; anche il mucchio delle carte scartate.")],
  [t("Nuts"), t("Il punto migliore possibile in quel momento con quelle carte comuni.")],
  [t("Outs"), t("Le carte ancora nel mazzo che migliorano la tua mano fino a farti vincere.")],
  [t("Piatto (Pot)"), t("Tutte le fiches puntate nella mano, che andranno al vincitore.")],
  [t("Piatto laterale (Side pot)"), t("Piatto separato che si crea quando un giocatore è all-in e gli altri continuano a puntare.")],
  [t("Pot odds"), t("Il rapporto tra quanto devi pagare e quanto c'è nel piatto: ti dice se conviene vedere.")],
  [t("Pre-flop"), t("Il primo giro di puntate, prima che escano le carte comuni.")],
  [t("Raise"), t("Rilanciare: aumentare la puntata più alta.")],
  [t("Re-raise (3-bet)"), t("Rilanciare sopra un rilancio.")],
  [t("River"), t("La 5ª e ultima carta comune.")],
  [t("Slow roll"), t("Mostrare lentamente la mano vincente per illudere l'avversario: gesto antisportivo.")],
  [t("Soft play"), t("Giocare \"morbido\" contro un amico al tavolo: vietato, ognuno gioca per sé.")],
  [t("Set"), t("Tris formato da una coppia in mano più una carta uguale sul board.")],
  [t("Showdown"), t("Il momento in cui, finite le puntate, si mostrano le carte.")],
  [t("Split pot"), t("Piatto diviso in parti uguali tra giocatori con lo stesso punto.")],
  [t("Stack"), t("Le fiches che un giocatore ha davanti.")],
  [t("String bet"), t("Rilancio fatto in più movimenti senza dichiararlo: non è permesso.")],
  [t("Tilt"), t("Quando la frustrazione fa giocare male. Il nemico numero uno di ogni giocatore!")],
  [t("Torneo"), t("Tutti partono con le stesse fiches, i bui salgono a intervalli e chi le perde tutte è eliminato.")],
  [t("Tris (Three of a kind)"), t("3 carte dello stesso valore.")],
  [t("Turn"), t("La 4ª carta comune.")],
  [t("UTG (Under the gun)"), t("Il primo a parlare pre-flop, subito a sinistra del grande buio.")],
  [t("UTG+1"), t("Il posto subito a sinistra di UTG: secondo a parlare pre-flop.")],
];

// Disegna le voci del glossario che contengono il testo cercato
function mostraGlossario(testoCercato) {
  const elenco = document.getElementById("voci-glossario");
  const avviso = document.getElementById("nessun-risultato");
  const cerca = testoCercato.trim().toLowerCase();

  // Teniamo le voci in cui la parola O la spiegazione contengono il testo
  const trovate = GLOSSARIO
    .filter(([parola, spiegazione]) =>
      parola.toLowerCase().includes(cerca) || spiegazione.toLowerCase().includes(cerca))
    .sort((a, b) => a[0].localeCompare(b[0], LINGUA)); // ordine alfabetico

  elenco.innerHTML = trovate
    .map(([parola, spiegazione]) => `<dt>${parola}</dt><dd>${spiegazione}</dd>`)
    .join("");

  // Se non c'è nulla, mostriamo il messaggio "nessuna parola trovata"
  avviso.hidden = trovate.length > 0;
}

document.addEventListener("DOMContentLoaded", () => {
  mostraGlossario(""); // all'inizio mostriamo tutte le voci

  // Ogni volta che scrivi nel campo di ricerca, aggiorniamo l'elenco
  document.getElementById("cerca-glossario")
    .addEventListener("input", evento => mostraGlossario(evento.target.value));
});
