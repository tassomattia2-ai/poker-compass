// ============================================================
//  domande-regole.js — le domande del quiz "Regole e posizioni".
//  Sono prese da REGOLE-TEXAS-HOLDEM.md (regole TDA, aggiornate
//  al Summit di giugno 2026).
//
//  Per aggiungere una domanda basta copiare un blocco { ... }:
//    domanda:   il testo della domanda
//    giusta:    la risposta giusta
//    sbagliate: 2 o 3 risposte sbagliate (vengono mescolate)
//    spiega:    la spiegazione che compare dopo la risposta
// ============================================================

const DOMANDE_REGOLE = [
  // ---------- I punti ----------
  {
    domanda: "Nel Texas Hold'em, chi vince tra un full e un colore?",
    giusta: "Il full",
    sbagliate: ["Il colore", "Pareggio: si divide il piatto"],
    spiega: "Nel Texas Hold'em il full batte il colore. Nel poker all'italiana (mazzo corto) è il contrario: non confonderli!",
  },
  {
    domanda: "Q-K-A-2-3 è una scala?",
    giusta: "No, non si \"gira l'angolo\"",
    sbagliate: ["Sì, l'Asso unisce le due parti", "Sì, ma solo se le carte sono dello stesso seme"],
    spiega: "L'Asso vale 1 solo nella scala più bassa (A-2-3-4-5). Q-K-A-2-3 non è una scala.",
  },
  {
    domanda: "Qual è la scala più bassa possibile?",
    giusta: "A-2-3-4-5 (la \"ruota\")",
    sbagliate: ["2-3-4-5-6", "K-A-2-3-4"],
    spiega: "Nella scala A-2-3-4-5 l'Asso vale 1: è la scala più bassa, detta \"ruota\".",
  },
  {
    domanda: "Due giocatori hanno lo stesso colore, uno di cuori e uno di picche, con le stesse carte. Chi vince?",
    giusta: "Pareggio: il piatto si divide",
    sbagliate: ["Vince il cuori", "Vince il picche"],
    spiega: "Nel Texas Hold'em i semi hanno tutti lo stesso valore e non servono mai a spareggiare.",
  },
  {
    domanda: "Tu hai K K 5 5 A, l'avversario K K 5 5 Q. Chi vince?",
    giusta: "Tu, grazie al kicker",
    sbagliate: ["Pareggio: stessa doppia coppia", "L'avversario"],
    spiega: "Con la stessa doppia coppia decide la quinta carta, il kicker: l'Asso batte la Donna.",
  },
  {
    domanda: "Un giocatore annuncia \"ho colore\" ma in realtà ha una scala. Cosa conta?",
    giusta: "Il punto vero: \"le carte parlano\"",
    sbagliate: ["Quello che ha annunciato", "La mano è annullata"],
    spiega: "Allo showdown conta il punto reale delle carte mostrate. Per vincere però vanno mostrate entrambe le carte.",
  },
  {
    domanda: "Con quante delle tue carte personali puoi formare il punto?",
    giusta: "2, 1 o anche nessuna",
    sbagliate: ["Sempre esattamente 2", "Almeno 1"],
    spiega: "Il punto è il migliore di 5 carte scelte tra le tue 2 e le 5 comuni. Se non usi nessuna delle tue \"giochi il board\".",
  },

  // ---------- Posizioni e ordine di parola ----------
  {
    domanda: "Al tavolo da 9, chi parla per primo prima del flop?",
    giusta: "UTG, il giocatore a sinistra del grande buio",
    sbagliate: ["Il piccolo buio", "Il bottone", "Il grande buio"],
    spiega: "Pre-flop parla per primo \"under the gun\" (UTG), subito a sinistra del grande buio. Il grande buio parla per ultimo.",
  },
  {
    domanda: "Dal flop in poi, chi parla per primo?",
    giusta: "Il primo giocatore ancora in gioco a sinistra del bottone",
    sbagliate: ["Sempre UTG", "Chi ha rilanciato per ultimo prima del flop"],
    spiega: "Dal flop in poi si parte dal primo giocatore ancora in gioco a sinistra del bottone. Per questo il bottone è la posizione migliore.",
  },
  {
    domanda: "Testa a testa (solo 2 giocatori): chi paga il piccolo buio?",
    giusta: "Il bottone",
    sbagliate: ["Il giocatore che non ha il bottone", "Si alternano a caso"],
    spiega: "In heads-up il bottone paga il piccolo buio, l'altro il grande buio.",
  },
  {
    domanda: "Testa a testa: chi parla per primo prima del flop?",
    giusta: "Il bottone",
    sbagliate: ["Il grande buio", "Chi ha più fiches"],
    spiega: "In heads-up il bottone (che è anche piccolo buio) parla per primo pre-flop e per ultimo dopo il flop.",
  },
  {
    domanda: "Come si chiama il posto subito a destra del bottone?",
    giusta: "Cutoff (CO)",
    sbagliate: ["Hijack (HJ)", "Lojack (LJ)", "Under the gun (UTG)"],
    spiega: "Andando in senso antiorario dal bottone: Cutoff (CO), Hijack (HJ), Lojack (LJ).",
  },
  {
    domanda: "Quale posizione è la migliore dopo il flop?",
    giusta: "Il bottone",
    sbagliate: ["Il grande buio", "UTG"],
    spiega: "Il bottone parla per ultimo in tutti i giri dopo il flop: vede cosa fanno gli altri prima di decidere.",
  },
  {
    domanda: "Pre-flop tutti vedono il grande buio senza rilanciare. Cosa può fare il grande buio?",
    giusta: "Bussare oppure rilanciare",
    sbagliate: ["Solo bussare", "Deve per forza rilanciare"],
    spiega: "È \"l'opzione del grande buio\": se nessuno ha rilanciato, può ancora rilanciare.",
  },

  // ---------- Puntate ----------
  {
    domanda: "Buio 100. A punta 300. A quanto deve arrivare B, come minimo, per rilanciare?",
    giusta: "500",
    sbagliate: ["400", "600", "301"],
    spiega: "A ha rilanciato di 200 (da 100 a 300). Il rilancio minimo è almeno uguale: 300 + 200 = 500.",
  },
  {
    domanda: "Buio 200. A rilancia a 600. Qual è il rilancio minimo di B?",
    giusta: "1.000",
    sbagliate: ["800", "1.200", "601"],
    spiega: "A ha rilanciato di 400 (da 200 a 600). B deve rilanciare almeno di 400: 600 + 400 = 1.000.",
  },
  {
    domanda: "Metti una sola fiche più grande della puntata, senza dire nulla. Cosa vale?",
    giusta: "Una chiamata",
    sbagliate: ["Un rilancio del valore della fiche", "Un rilancio minimo"],
    spiega: "Regola TDA: una fiche singola più grande, senza dichiarazione, vale come chiamata.",
  },
  {
    domanda: "Cos'è uno \"string bet\"?",
    giusta: "Mettere le fiches del rilancio in più movimenti: è vietato",
    sbagliate: ["Una puntata minima", "Una puntata fatta a voce"],
    spiega: "Le fiches di un rilancio vanno messe in un solo movimento, oppure si dichiara la cifra a voce prima.",
  },
  {
    domanda: "Dici \"rilancio a 500\" e poi cambi idea. Cosa succede?",
    giusta: "Devi rilanciare a 500: la dichiarazione è vincolante",
    sbagliate: ["Puoi cambiare idea se non hai ancora messo le fiches", "Puoi solo passare"],
    spiega: "La dichiarazione verbale è vincolante: se lo dici, lo devi fare.",
  },
  {
    domanda: "Quando puoi bussare (check)?",
    giusta: "Solo se nessuno ha ancora puntato in quel giro",
    sbagliate: ["Sempre", "Solo dopo il river"],
    spiega: "Il check passa la parola senza puntare: si può solo se nessuno ha già puntato in quel giro.",
  },
  {
    domanda: "Un giocatore va all-in con meno di un rilancio completo. Chi aveva già parlato può rilanciare di nuovo?",
    giusta: "No, può solo vedere o passare",
    sbagliate: ["Sì, sempre", "Sì, ma solo del minimo"],
    spiega: "Un all-in \"corto\" non riapre le puntate per chi ha già parlato (a meno che non si sia accumulato almeno un rilancio completo).",
  },
  {
    domanda: "A metà mano puoi aggiungere fiches dalla tasca?",
    giusta: "No, si gioca solo con le fiches sul tavolo",
    sbagliate: ["Sì, se sei all-in", "Sì, se gli altri sono d'accordo"],
    spiega: "È la regola del \"table stakes\": durante una mano contano solo le fiches che hai davanti.",
  },
  {
    domanda: "Con il \"Big Blind Ante\", chi paga l'ante?",
    giusta: "Il grande buio, per tutto il tavolo",
    sbagliate: ["Ognuno paga il suo", "Il bottone"],
    spiega: "Il giocatore del grande buio paga l'ante per tutti. Se non gli bastano le fiches, paga prima il grande buio e poi l'ante.",
  },
  {
    domanda: "Chi può vincere un piatto laterale (side pot)?",
    giusta: "Solo chi ha messo fiches in quel piatto",
    sbagliate: ["Tutti i giocatori arrivati allo showdown", "Il giocatore all-in"],
    spiega: "Il giocatore all-in può vincere solo il piatto principale. I piatti laterali se li giocano gli altri.",
  },

  // ---------- Showdown e casi speciali ----------
  {
    domanda: "Al river nessuno ha puntato. Chi mostra le carte per primo?",
    giusta: "Il primo giocatore a sinistra del bottone",
    sbagliate: ["L'ultimo che ha puntato al turn", "Il bottone"],
    spiega: "Se al river non ci sono puntate, si mostra a partire dal primo giocatore a sinistra del bottone, in senso orario.",
  },
  {
    domanda: "Al river c'è stata una puntata. Chi mostra per primo?",
    giusta: "L'ultimo che ha puntato o rilanciato",
    sbagliate: ["Chi ha chiamato", "Il primo a sinistra del bottone"],
    spiega: "Se al river si è puntato, mostra per primo l'ultimo giocatore che ha puntato o rilanciato.",
  },
  {
    domanda: "Il piatto si divide in due ma resta una fiche dispari. A chi va?",
    giusta: "Al vincitore più vicino alla sinistra del bottone",
    sbagliate: ["Al dealer", "Si tira a sorte"],
    spiega: "Regola TDA: la fiche dispari va al giocatore in gioco più vicino alla sinistra del bottone.",
  },
  {
    domanda: "Cosa vuol dire fare \"muck\"?",
    giusta: "Buttare le carte senza mostrarle",
    sbagliate: ["Mostrare una sola carta", "Rilanciare all-in"],
    spiega: "Chi pensa di aver perso allo showdown può buttare le carte coperte (muck).",
  },
  {
    domanda: "Quante carte si \"bruciano\" in una mano che arriva al river?",
    giusta: "3",
    sbagliate: ["1", "5", "Nessuna"],
    spiega: "Se ne brucia una prima del flop, una prima del turn e una prima del river.",
  },
  {
    domanda: "Durante la distribuzione una delle prime due carte esce scoperta. Cosa succede?",
    giusta: "Misdeal: si rifà la mano",
    sbagliate: ["Il giocatore la tiene scoperta", "Si cambia solo quella carta"],
    spiega: "Una delle prime due carte scoperte è un caso classico di misdeal: la mano si rifà.",
  },

  // ---------- Novità TDA 2026 ----------
  {
    domanda: "Novità TDA 2026: il dealer ti mette il segnalino all-in, ma non sei all-in. Cosa devi fare?",
    giusta: "Dirlo subito, senza nascondere le fiches",
    sbagliate: ["Niente: è un errore del dealer", "Aspettare lo showdown"],
    spiega: "Dal Summit TDA di giugno 2026 il giocatore deve dire che non è all-in e non può nascondere le sue fiches.",
  },
  {
    domanda: "Novità TDA 2026: gli occhiali smart al tavolo sono…",
    giusta: "Vietati",
    sbagliate: ["Permessi se spenti", "Permessi solo nelle pause"],
    spiega: "Il TDA 2026 vieta gli occhiali smart e aumenta i controlli sui dispositivi elettronici.",
  },
  {
    domanda: "Novità TDA 2026: oltre allo \"stare fuori per un giro\", com'è possibile essere penalizzati?",
    giusta: "Anche con penalità in fiches",
    sbagliate: ["Solo con l'espulsione", "Con una multa in denaro"],
    spiega: "Dal 2026 le penalità possono essere anche in fiches, oltre al classico giro di stop.",
  },

  // ============================================================
  //  Domande aggiunte il 16 ottobre 2026 (da 32 a 100)
  // ============================================================

  // ---------- I punti (altre) ----------
  {
    domanda: "Chi è più forte: una scala colore o un poker d'Assi?",
    giusta: "La scala colore",
    sbagliate: ["Il poker d'Assi", "Pareggio"],
    spiega: "Anche la scala colore più bassa (A-2-3-4-5 dello stesso seme) batte qualsiasi poker.",
  },
  {
    domanda: "Che cos'è la scala reale?",
    giusta: "A-K-Q-J-10 tutte dello stesso seme",
    sbagliate: ["A-K-Q-J-10 di semi diversi", "Quattro Assi e un Re"],
    spiega: "La scala reale è la scala colore più alta possibile: il punto più forte del poker.",
  },
  {
    domanda: "Quante sono le combinazioni (i punti) del Texas Hold'em, dalla carta alta alla scala reale?",
    giusta: "10",
    sbagliate: ["8", "9", "12"],
    spiega: "Carta alta, coppia, doppia coppia, tris, scala, colore, full, poker, scala colore, scala reale: 10 in tutto.",
  },
  {
    domanda: "Full 8-8-8-K-K contro full 7-7-7-A-A: chi vince?",
    giusta: "Il full di 8",
    sbagliate: ["Il full di 7 con gli Assi", "Pareggio"],
    spiega: "Tra due full si guarda prima il tris: 8-8-8 batte 7-7-7. La coppia conta solo se il tris è uguale.",
  },
  {
    domanda: "Scala 2-3-4-5-6 contro scala A-2-3-4-5: chi vince?",
    giusta: "La scala al 6",
    sbagliate: ["La scala con l'Asso", "Pareggio"],
    spiega: "Nella ruota (A-2-3-4-5) l'Asso vale 1: la carta più alta è il 5. La scala al 6 vince.",
  },
  {
    domanda: "Colore A-J-8-6-2 contro colore K-Q-J-10-8: chi vince?",
    giusta: "Il colore all'Asso",
    sbagliate: ["Il colore al Re, perché le carte sono più alte in totale", "Pareggio"],
    spiega: "Tra due colori si confronta la carta più alta, poi la seconda e così via. Non si sommano i valori.",
  },
  {
    domanda: "Sul tavolo A♠ A♥ K♦ K♣ Q♠. Tu hai 2♣ 3♦, l'avversario 4♥ 5♠. Chi vince?",
    giusta: "Pareggio: giocate entrambi il board",
    sbagliate: ["Tu", "L'avversario, perché ha carte più alte"],
    spiega: "Il punto migliore per tutti e due è A-A-K-K-Q, tutto sul tavolo: il piatto si divide.",
  },
  {
    domanda: "Sul tavolo A A K K 7. Tu hai Q 2, l'avversario J 3. Chi vince?",
    giusta: "Tu",
    sbagliate: ["L'avversario", "Pareggio: giocate il board"],
    spiega: "Tu hai A-A-K-K-Q, l'avversario A-A-K-K-J: la tua Donna come kicker batte il suo Fante.",
  },
  {
    domanda: "Sul tavolo 7♠ 7♦ 7♣ 2♥ 4♠. Tu hai A♠ 3♦, l'avversario K♥ Q♣. Chi vince?",
    giusta: "Tu, con il kicker Asso",
    sbagliate: ["L'avversario, con due carte alte", "Pareggio: il tris è uguale"],
    spiega: "Tutti e due avete tris di 7. Tu giochi 7-7-7-A-4, lui 7-7-7-K-Q: l'Asso batte il Re.",
  },
  {
    domanda: "Sul tavolo 9♠ 9♥ 9♦ 9♣ K♠. Tu hai A♦ 2♣, l'avversario Q♥ Q♣. Chi vince?",
    giusta: "Tu",
    sbagliate: ["L'avversario, grazie alla coppia di Q", "Pareggio"],
    spiega: "Tutti e due avete poker di 9: decide la quinta carta. Tu hai l'Asso, lui al massimo il Re del tavolo.",
  },
  {
    domanda: "Sul tavolo A-K-Q-J-10 di semi diversi. Tu hai 2♣ 2♦. Qual è il tuo punto?",
    giusta: "Scala all'Asso (giochi il board)",
    sbagliate: ["Coppia di 2", "Doppia coppia"],
    spiega: "La scala del tavolo è più forte della tua coppia: giochi il board, come tutti gli altri.",
  },
  {
    domanda: "Nelle tue 7 carte ci sono A-A, 9-9, 4-4 e un K. Qual è il tuo punto?",
    giusta: "Doppia coppia A e 9 con kicker K",
    sbagliate: ["Tripla coppia", "Doppia coppia A e 9 con kicker 4"],
    spiega: "La \"tripla coppia\" non esiste: usi le due coppie più alte e la carta migliore rimasta, il Re.",
  },
  {
    domanda: "Nelle tue 7 carte ci sono K-K-K e 5-5-5. Qual è il tuo punto?",
    giusta: "Full di K con i 5",
    sbagliate: ["Doppio tris", "Poker"],
    spiega: "Il punto è di 5 carte: K-K-K-5-5. Il terzo 5 resta fuori.",
  },

  // ---------- Posizioni e distribuzione (altre) ----------
  {
    domanda: "Chi siede subito a sinistra del bottone?",
    giusta: "Il piccolo buio",
    sbagliate: ["Il grande buio", "UTG"],
    spiega: "In senso orario: bottone, piccolo buio, grande buio, poi UTG.",
  },
  {
    domanda: "Come si sposta il bottone?",
    giusta: "Di un posto in senso orario a ogni mano",
    sbagliate: ["Va a chi ha vinto la mano", "Resta fermo per tutta la serata"],
    spiega: "Il bottone gira di un posto a ogni mano: così tutti pagano i bui e tutti hanno la posizione migliore a turno.",
  },
  {
    domanda: "Da chi parte la distribuzione delle carte?",
    giusta: "Dal piccolo buio, una carta alla volta in senso orario",
    sbagliate: ["Dal bottone, due carte alla volta", "Da UTG, una carta alla volta"],
    spiega: "Si parte dal piccolo buio e si dà una carta a testa in senso orario, poi il secondo giro.",
  },
  {
    domanda: "Testa a testa: chi parla per primo dopo il flop?",
    giusta: "Il grande buio",
    sbagliate: ["Il bottone", "Chi ha rilanciato pre-flop"],
    spiega: "In heads-up il bottone parla per primo pre-flop ma per ultimo dal flop in poi: dopo il flop parla per primo il grande buio.",
  },
  {
    domanda: "Al tavolo da 9, quale posizione è due posti a destra del bottone?",
    giusta: "Hijack (HJ)",
    sbagliate: ["Cutoff (CO)", "UTG+1", "Piccolo buio"],
    spiega: "Andando a destra dal bottone: prima il Cutoff, poi l'Hijack, poi il Lojack.",
  },
  {
    domanda: "Perché le posizioni \"in ritardo\" (Cutoff e bottone) sono un vantaggio?",
    giusta: "Parli dopo gli altri e vedi le loro mosse prima di decidere",
    sbagliate: ["Ricevi carte migliori", "Paghi i bui più spesso"],
    spiega: "Più tardi parli, più informazioni hai. Le carte sono casuali per tutti: la posizione no.",
  },
  {
    domanda: "Nei casinò, chi ha il bottone distribuisce davvero le carte?",
    giusta: "No: c'è un dealer, il bottone indica solo il distributore \"di fatto\"",
    sbagliate: ["Sì, sempre", "Sì, ma solo nei tornei"],
    spiega: "Il bottone è un segnalino: serve a stabilire bui e ordine di parola, anche quando le carte le dà un croupier.",
  },

  // ---------- Il mazzo e i numeri ----------
  {
    domanda: "Quante carte ha il mazzo del Texas Hold'em?",
    giusta: "52, senza jolly",
    sbagliate: ["54, con due jolly", "40", "36"],
    spiega: "Si usa il mazzo francese da 52 carte. Il mazzo corto è un'altra variante.",
  },
  {
    domanda: "Quanti giri di puntate ci sono in una mano che arriva allo showdown?",
    giusta: "4",
    sbagliate: ["3", "5", "2"],
    spiega: "Pre-flop, flop, turn e river: quattro giri di puntate.",
  },
  {
    domanda: "Quante mani iniziali diverse ci sono, se non contiamo i semi (AKs, AKo, 72o…)?",
    giusta: "169",
    sbagliate: ["52", "1.326", "100"],
    spiega: "13 coppie + 78 mani dello stesso seme + 78 di semi diversi = 169. È la griglia 13×13 del Calcolatore.",
  },
  {
    domanda: "Quante combinazioni esatte di due carte puoi ricevere in tutto?",
    giusta: "1.326",
    sbagliate: ["169", "2.652", "52"],
    spiega: "52 × 51 ÷ 2 = 1.326 coppie di carte diverse (contando anche i semi).",
  },
  {
    domanda: "Quante combinazioni ci sono di una coppia, per esempio A-A?",
    giusta: "6",
    sbagliate: ["4", "12", "16"],
    spiega: "Con 4 Assi si possono formare 6 coppie diverse di semi.",
  },
  {
    domanda: "Quante combinazioni ci sono di A-K dello stesso seme (AKs)?",
    giusta: "4",
    sbagliate: ["6", "12", "16"],
    spiega: "Una per seme: ♠, ♥, ♦, ♣. AKo (semi diversi) invece ne ha 12, per un totale di 16 A-K.",
  },

  // ---------- Puntate e piatti (altre) ----------
  {
    domanda: "Nel No-Limit, qual è la puntata minima?",
    giusta: "Il grande buio",
    sbagliate: ["Il piccolo buio", "Metà del piatto"],
    spiega: "In ogni giro la puntata più piccola consentita è pari al grande buio.",
  },
  {
    domanda: "Nel No-Limit, qual è la puntata massima?",
    giusta: "Tutte le fiches che hai davanti",
    sbagliate: ["Il valore del piatto", "Dieci volte il grande buio"],
    spiega: "È il \"No-Limit\": puoi andare all-in in qualsiasi momento.",
  },
  {
    domanda: "Quando finisce un giro di puntate?",
    giusta: "Quando tutti hanno parlato e hanno messo la stessa cifra (o sono all-in)",
    sbagliate: ["Dopo che ognuno ha parlato una volta", "Quando qualcuno rilancia"],
    spiega: "Ogni rilancio riapre la parola: il giro si chiude solo quando le puntate sono pareggiate.",
  },
  {
    domanda: "Dopo il flop A punta 200. Qual è il rilancio minimo di B?",
    giusta: "400",
    sbagliate: ["300", "201", "600"],
    spiega: "La puntata di A è di 200: il rilancio deve essere di almeno altri 200, quindi B deve arrivare a 400.",
  },
  {
    domanda: "Buio 50. A rilancia a 150, B rilancia a 400. Qual è il rilancio minimo di C?",
    giusta: "650",
    sbagliate: ["550", "800", "500"],
    spiega: "Conta il rilancio più grande del giro: quello di B, di 250 (da 150 a 400). Quindi 400 + 250 = 650.",
  },
  {
    domanda: "Tutti passano tranne un giocatore. Cosa succede?",
    giusta: "Vince subito il piatto, senza mostrare le carte",
    sbagliate: ["Deve mostrare le carte per vincere", "Si gira comunque tutto il board"],
    spiega: "Se resta un solo giocatore la mano finisce lì: non serve lo showdown.",
  },
  {
    domanda: "Il check-raise (bussare e poi rilanciare sulla puntata di un altro) è permesso?",
    giusta: "Sì, è una giocata regolare",
    sbagliate: ["No, è vietato", "Solo al river"],
    spiega: "Nel Texas Hold'em il check-raise è legale e molto usato per far crescere il piatto.",
  },
  {
    domanda: "Agisci prima che sia il tuo turno. Cosa rischi?",
    giusta: "Che l'azione sia vincolante o che tu venga penalizzato",
    sbagliate: ["Niente: si ripete l'azione", "Di perdere subito la mano"],
    spiega: "Si parla a turno: agire fuori turno può valere come azione vera ed essere penalizzato.",
  },
  {
    domanda: "Big Blind Ante: il grande buio non ha abbastanza fiches per pagare tutto. Cosa paga prima?",
    giusta: "Il grande buio, poi l'ante con quello che resta",
    sbagliate: ["L'ante, poi il grande buio", "Metà e metà"],
    spiega: "Regola TDA: prima si paga il grande buio, poi l'ante con le fiches rimaste.",
  },
  {
    domanda: "Sei all-in con 300. A e B vanno avanti e mettono 1.000 a testa. Quanto vale il piatto principale?",
    giusta: "900",
    sbagliate: ["2.300", "300", "1.300"],
    spiega: "Nel piatto principale entrano 300 fiches da ognuno dei 3 giocatori: 300 × 3 = 900.",
  },
  {
    domanda: "Sei all-in con 300. A e B vanno avanti e mettono 1.000 a testa. Quanto vale il piatto laterale?",
    giusta: "1.400",
    sbagliate: ["2.000", "700", "1.700"],
    spiega: "A e B hanno messo 700 a testa oltre i tuoi 300: 700 × 2 = 1.400, che si giocano solo loro due.",
  },
  {
    domanda: "Allo showdown, quale piatto si assegna per primo?",
    giusta: "I piatti laterali",
    sbagliate: ["Il piatto principale", "Si assegnano tutti insieme"],
    spiega: "Si assegnano prima i piatti laterali, poi quello principale.",
  },
  {
    domanda: "Sei all-in e hai il punto migliore di tutti. Cosa vinci?",
    giusta: "Solo il piatto principale",
    sbagliate: ["Tutti i piatti", "Solo il piatto laterale"],
    spiega: "Puoi vincere solo le fiches che hai potuto coprire. Il piatto laterale va al migliore tra gli altri.",
  },

  // ---------- Showdown, misdeal e comportamento (altre) ----------
  {
    domanda: "Per vincere il piatto allo showdown, quante carte devi mostrare?",
    giusta: "Entrambe le tue carte",
    sbagliate: ["Basta una", "Nessuna, basta dire il punto"],
    spiega: "\"Le carte parlano\", ma per vincere vanno mostrate tutte e due.",
  },
  {
    domanda: "Durante la distribuzione un giocatore riceve 3 carte. Cosa succede?",
    giusta: "Misdeal: si rifà la mano",
    sbagliate: ["Sceglie lui quale scartare", "Il dealer toglie l'ultima carta e si continua"],
    spiega: "Un numero sbagliato di carte a un giocatore è uno dei casi di misdeal.",
  },
  {
    domanda: "All'inizio della mano le carte vengono date anche a un posto vuoto. Cosa succede?",
    giusta: "Misdeal: si rifà la mano",
    sbagliate: ["Si tolgono quelle carte e si continua", "Le prende il bottone"],
    spiega: "Carte distribuite a un posto vuoto o al giocatore sbagliato all'inizio: è misdeal.",
  },
  {
    domanda: "Si scopre un errore di distribuzione quando le puntate sono già andate avanti parecchio. Di solito…",
    giusta: "La mano non si annulla",
    sbagliate: ["Si annulla sempre", "Vince chi ha più fiches nel piatto"],
    spiega: "Una volta iniziate le puntate in modo significativo, di solito la mano va avanti.",
  },
  {
    domanda: "Durante una mano puoi chiedere consiglio al tuo vicino che ha già passato?",
    giusta: "No: \"una mano a giocatore\"",
    sbagliate: ["Sì, se ha già passato", "Sì, ma solo a bassa voce"],
    spiega: "È vietato aiutarsi o discutere la mano in corso con altri, anche con chi ha già passato.",
  },
  {
    domanda: "Novità TDA 2026: cosa è cambiato sul linguaggio offensivo al tavolo?",
    giusta: "Le regole sono diventate più severe",
    sbagliate: ["È permesso se non è rivolto a un giocatore", "Non è cambiato nulla"],
    spiega: "Il Summit TDA 2026 ha inasprito le regole contro il linguaggio offensivo.",
  },
  {
    domanda: "Novità TDA 2026: cosa cambia per i dispositivi elettronici?",
    giusta: "Più controlli",
    sbagliate: ["Sono permessi tutti", "Si possono usare solo per calcolare le probabilità"],
    spiega: "Oltre al divieto di occhiali smart, il TDA 2026 prevede più controlli sui dispositivi elettronici.",
  },

  // ---------- Cash game e torneo ----------
  {
    domanda: "In un torneo, cosa succede ai bui?",
    giusta: "Salgono a intervalli di tempo (livelli)",
    sbagliate: ["Restano sempre uguali", "Li decide chi vince la mano"],
    spiega: "Nei tornei i bui crescono livello dopo livello: è quello che fa il timer della sezione Serate.",
  },
  {
    domanda: "In un cash game, cosa succede ai bui?",
    giusta: "Restano fissi",
    sbagliate: ["Salgono ogni 15 minuti", "Raddoppiano a ogni pausa"],
    spiega: "Nel cash game i bui non cambiano: si gioca sempre allo stesso livello.",
  },
  {
    domanda: "In un torneo, chi resta senza fiches…",
    giusta: "È eliminato",
    sbagliate: ["Può ricomprare quando vuole", "Resta seduto e gioca solo i bui"],
    spiega: "Nel torneo chi perde tutte le fiches esce. In alcuni tornei c'è il rientro, ma solo se previsto dal regolamento.",
  },
  {
    domanda: "In un cash game, quando si possono aggiungere fiches?",
    giusta: "Tra una mano e l'altra",
    sbagliate: ["In qualsiasi momento, anche a metà mano", "Mai"],
    spiega: "Nel cash game si può ricomprare, ma solo tra una mano e l'altra (regola del \"table stakes\").",
  },
  {
    domanda: "Chi vince un torneo?",
    giusta: "Chi prende tutte le fiches",
    sbagliate: ["Chi ha più fiches a un'ora stabilita", "Chi vince più mani"],
    spiega: "Il torneo finisce quando un solo giocatore ha tutte le fiches. Gli altri si classificano in base all'ordine di uscita.",
  },

  // ---------- Il gergo del tavolo ----------
  {
    domanda: "Cosa vuol dire \"suited\" (per esempio AKs)?",
    giusta: "Le due carte sono dello stesso seme",
    sbagliate: ["Le due carte sono una coppia", "Le due carte sono in sequenza"],
    spiega: "\"s\" sta per suited (stesso seme), \"o\" per offsuit (semi diversi).",
  },
  {
    domanda: "Cos'è il \"kicker\"?",
    giusta: "La carta che spareggia due punti uguali",
    sbagliate: ["La carta più alta del tavolo", "La carta bruciata"],
    spiega: "Se due giocatori hanno lo stesso punto, decidono le carte rimanenti delle 5: i kicker.",
  },
  {
    domanda: "Cosa vuol dire \"split pot\"?",
    giusta: "Il piatto si divide tra chi pareggia",
    sbagliate: ["Il piatto laterale", "Il piatto va raddoppiato"],
    spiega: "Se due o più giocatori hanno lo stesso punto di 5 carte, il piatto si divide in parti uguali.",
  },
  {
    domanda: "Cosa sono le \"nuts\"?",
    giusta: "Il punto migliore possibile in quel momento",
    sbagliate: ["Una mano molto debole", "Le fiches di valore più basso"],
    spiega: "Avere le nuts significa che con quel board nessuno può batterti.",
  },
  {
    domanda: "Cosa vuol dire \"limp\"?",
    giusta: "Entrare pre-flop pagando solo il grande buio",
    sbagliate: ["Passare subito", "Rilanciare il minimo"],
    spiega: "Chi fa limp vede il grande buio senza rilanciare.",
  },
  {
    domanda: "Cos'è un \"3-bet\" pre-flop?",
    giusta: "Il rilancio sopra un primo rilancio",
    sbagliate: ["Puntare tre volte il piatto", "Tre giocatori all-in"],
    spiega: "Il grande buio conta come prima \"puntata\", il primo rilancio è il 2-bet, il rilancio successivo è il 3-bet.",
  },
  {
    domanda: "Che differenza c'è tra un \"set\" e un \"trips\"?",
    giusta: "Set: coppia in mano + 1 sul tavolo. Trips: 1 in mano + coppia sul tavolo",
    sbagliate: ["Nessuna, sono sinonimi", "Il set è un poker, il trips un tris"],
    spiega: "Sono entrambi tris, ma il set è più nascosto (e di solito più forte, perché il kicker è meno un problema).",
  },
  {
    domanda: "Cos'è una \"overpair\"?",
    giusta: "Una coppia in mano più alta di tutte le carte del tavolo",
    sbagliate: ["Due coppie sul tavolo", "Una coppia sul tavolo"],
    spiega: "Esempio: hai Q-Q e il flop è 9-6-2. La tua coppia è più alta di ogni carta del board.",
  },
  {
    domanda: "Cosa vuol dire un flop \"rainbow\"?",
    giusta: "Le 3 carte sono di semi diversi",
    sbagliate: ["Le 3 carte sono dello stesso seme", "Le 3 carte sono in scala"],
    spiega: "Rainbow = arcobaleno: nessun progetto di colore possibile al flop.",
  },
  {
    domanda: "Cosa vuol dire essere \"in tilt\"?",
    giusta: "Giocare male perché sei nervoso o arrabbiato",
    sbagliate: ["Avere il punto migliore", "Essere l'ultimo a parlare"],
    spiega: "Il tilt fa perdere lucidità. Il Diario ti aiuta a vedere se l'umore influisce sui tuoi risultati.",
  },

  // ---------- Probabilità di base ----------
  {
    domanda: "Al flop hai 4 carte di cuori (progetto colore). Quanti outs hai?",
    giusta: "9",
    sbagliate: ["13", "4", "8"],
    spiega: "I cuori sono 13: 4 li vedi già, ne restano 9 nel mazzo.",
  },
  {
    domanda: "Hai 8-9 e il flop è 7-10-2 (scala aperta da due lati). Quanti outs hai per la scala?",
    giusta: "8",
    sbagliate: ["4", "9", "6"],
    spiega: "Ti servono un 6 o un J: 4 + 4 = 8 outs.",
  },
  {
    domanda: "Hai 8-9 e il flop è J-7-2: ti serve un 10 per la scala (\"gutshot\"). Quanti outs hai?",
    giusta: "4",
    sbagliate: ["8", "2", "6"],
    spiega: "Solo un 10 completa la scala 7-8-9-10-J: i 10 sono 4.",
  },
  {
    domanda: "Al flop hai 9 outs. Con la regola del 4, che probabilità hai di chiudere entro il river?",
    giusta: "Circa 36%",
    sbagliate: ["Circa 18%", "Circa 9%", "Circa 50%"],
    spiega: "Al flop, con due carte da girare: outs × 4 = 36%. Il valore esatto è circa 35%.",
  },
  {
    domanda: "Al turn hai 9 outs. Con la regola del 2, che probabilità hai di chiudere al river?",
    giusta: "Circa 18%",
    sbagliate: ["Circa 36%", "Circa 9%", "Circa 27%"],
    spiega: "Con una sola carta da girare: outs × 2 = 18%. Il valore esatto è 9 su 46, circa 19,6%.",
  },
  {
    domanda: "Nel piatto ci sono 300 fiches (compresa la puntata dell'avversario) e devi pagare 100. Che probabilità minima ti serve per vedere?",
    giusta: "25%",
    sbagliate: ["33%", "50%", "10%"],
    spiega: "Paghi 100 per un piatto finale di 400: 100 ÷ 400 = 25%. Sono i pot odds del Calcolatore.",
  },
];
