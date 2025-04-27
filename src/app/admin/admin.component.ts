import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit{
  router = inject(Router)
  goTo(route: any){
    this.router.navigate(['/'+route+'']);
  }

  selectedCountry: string = '';  // Le pays sélectionné
  pays: string = ""; operateur: any
  monaie: any; photoDevise: any; tVente: any; tAchat: any;
  constructor(
    private http: HttpClient,
    private apiService : ApiService,
    public storage: AngularFireStorage,
    public Auth : AngularFireAuth,
    public firestore: AngularFirestore
  ) {} 
  countries: { name: string; currency: string; phoneCode: string }[] = [];

  async ngOnInit(): Promise<void> {
    this.getAuth()
    this.getMonaie()
    this.getTransfert()
    this.getAffiliations()
    this.getFaqs()
    await this.getMsg()

    this.getTaux()
  }

  
  idUser: any; nom: any;
  hasUser: any = false;
  getAuth(){
    this.Auth.authState.subscribe(auth=>{
      if(!auth){
        //this.router.navigate(['/acceuil'])
      }else{
        this.idUser = auth?.uid 
        this.nom = auth.email![0]
        this.hasUser = true

        this.getProfile()
      }
    })
  }

  profiles: any = []
  getProfile(){
    this.firestore.collection('profiles').get().subscribe(profiles=>{
      profiles.forEach((profile: any)=>{
        this.profiles.push({
          id: profile.id,
          nom: profile.data()['nom']+" "+profile.data()['prenom'],
          tel: profile.data()['codeTel']+" "+profile.data()['tel'],
          email: profile.data()['email'],
          points: profile.data()['points'],
          affCode: profile.data()['affCode']
        })
      
      })
      
    })
  }

  setInitial(){
    this.monaie = this.pays
  }

  vider(){
    this.pays = ""; this.monaie = ""; this.operateur = ""; this.tVente =""; 
    this.tAchat=""; this.typeMonaie="emetteur"; this.priorite = 3
  }

  msgErr: any = ""
  isadding = false
  typeMonaie: string = 'emetteur';
  priorite: Number = 3;
  async add(){
    this.msgErr = ""
    this.isadding = true
    if(this.pays, this.monaie, this.operateur, this.typeMonaie, this.priorite){
      const users = [
        { pays: this.pays, monaie: this.monaie, operateur: this.operateur, typeMonaie: this.typeMonaie, priorite: this.priorite },
      ];
      try {
        await this.apiService.addDocuments('devises', users).then(()=>{
          this.msgErr = "ajouté avec success"
          this.isadding = false;
          this.vider()
        });
       
      } catch (error) {
        this.msgErr = 'Erreur lors de l’ajoutde la devise'
        console.error( error);
        this.isadding = false
      }
    }else{
      this.msgErr = "Entrez toute les informations"
      this.isadding = false
    }
  }

  monaies: any = []
  async getMonaie(){
    this.firestore.collection('devises').get().subscribe(monaies => {
      this.monaies= []
      monaies.forEach((monaie: any) => { 
        
        this.monaies.push({
          id: monaie.id,
          monaie: monaie.data()['monaie'],
          operateur: monaie.data()['operateur'],
          pays: monaie.data()['pays'],
          typeMonaie: monaie.data()['typeMonaie'],
          priorite: monaie.data()['priorite'],
        }) 
          
      })
    })
  }
  
  montantMinim: any; montantMax: any
  addTaux(){
    this.msgErr=""
    if(this.tauxChange && this.currencyCode && this.currencyCodeRecept){
      this.isadding= true
      this.firestore.collection('tauxChange').add({
        taux: this.tauxChange,
        sender: this.currencyCode,
        reciever: this.currencyCodeRecept,
        montantMinim: this.montantMinim,
        montantMax: this.montantMax
      }).then(()=>{
        alert('ajouté avec success')
        this.msgErr=""
        this.isadding = false
        this.currencyCode =""; this.currencyCodeRecept=""; 
        this.tauxChange=""; this.montantMinim = ""; this.montantMax =""
      })
    }else{
      this.msgErr = "Remplir les champs obligatoire"
    }
    
  }

  deleteMonaie(id: any){
    let x = confirm('cette suppression est definitive')
    if(x){
      this.firestore.collection('devises').doc(id).delete().then(()=>{
        alert('Cette devise a été supprimé')
        this.getMonaie()
      })
    }
    
  }

  isSaved = false
  saveMonaie(id: any){
    try {
      this.isSaved = true
      this.firestore.collection('devises').doc(id).update({
        pays: this.pays,
        monaie: this.monaie,
        operateur: this.operateur,
        typeMonaie: this.typeMonaie,
        priorite: this.priorite
      }).then(()=>{
        alert('Modifié avec success')
        this.pays = ""; this.monaie = ""; this.operateur = ""; this.typeMonaie = "emetteur", this.priorite = 3
        this.getMonaie()
        this.isSaved = false
      })
    } catch (error) {
      this.isSaved = false
    }
    
  }

  fileSCover: any
  upload($event: any){
    this.fileSCover =  $event.target.files[0]
  }

  nbreTransfert = 0
  transferts: any = [];
  getTransfert() {
    this.transferts = [];
    this.firestore.collection('transferts').snapshotChanges(['added']).subscribe(transferts => {
      let num = 0;
      
      this.transferts = [];
      transferts.forEach(async (transfert: any) => {
        num++; let couleur = "";
        console.log(transfert.payload.doc.data()['etat'])
        if (transfert.payload.doc.data()['etat'] == "en cour") {
          couleur = "primary";
        }
        if (transfert.payload.doc.data()['etat'] == "success") {
          couleur = "success";
        }
        if (transfert.payload.doc.data()['etat'] == "echec") {
          couleur = "danger";
        }

        let date = this.formatTimestampToDate(transfert.payload.doc.data()['date']);
        const monaieSender = await this.getMonaieDescription(transfert.payload.doc.data()['initiateur']);
        const monaieRecepteur = await this.getMonaieDescription(transfert.payload.doc.data()['recepteur']);
        console.log(couleur)
        this.transferts.push({
          num: num,
          id: transfert.payload.doc.id,
          etat: transfert.payload.doc.data()['etat'],
          tel: transfert.payload.doc.data()['tel'],
          montant: transfert.payload.doc.data()['montant'] + " " + monaieSender,
          couleur: couleur,
          date: date,
          recepteur: transfert.payload.doc.data()['recepteur'],
          initiateur: transfert.payload.doc.data()['initiateur'],
          montantRecept: transfert.payload.doc.data()['montantRecept'] + " " + monaieRecepteur,
          taux: transfert.payload.doc.data()['taux'],
          idUser: transfert.payload.doc.data()['idUser'],
          nomRecepteur: transfert.payload.doc.data()['nomRecepteur'],
          telRecepteur: transfert.payload.doc.data()['telRecepteur'],
          emailRecepteur: transfert.payload.doc.data()['emailRecepteur'],
          monaieSender: monaieSender,
          monaieRecepteur: monaieRecepteur,

          nomCompte: transfert.payload.doc.data()['nomCompte'],
          numeroCarte: transfert.payload.doc.data()['numeroCarte'],
          nomBanque: transfert.payload.doc.data()['nomBanque'],

          numeroAlipay: transfert.payload.doc.data()['numeroAlipay'],
          nomCompletAlipay: transfert.payload.doc.data()['nomCompletAlipay'],
          codeQrAlipay: transfert.payload.doc.data()['codeQrAlipay'],
          adresseUsdt: transfert.payload.doc.data()['adresseUsdt'],
          courrierPaypal: transfert.payload.doc.data()['courrierPaypal'],
          nomPaypal: transfert.payload.doc.data()['nomPaypal'],
          telPaypal: transfert.payload.doc.data()['telPaypal'],

          // Informations sur l'expéditeur
          numE: transfert.payload.doc.data()['numE'],
          whatE: transfert.payload.doc.data()['whatE'],
          nomTelE: transfert.payload.doc.data()['nomTelE']          
        });
        this.filterTransfertsByDate(date)
      });
    });
  }

  formatTimestampToDate(timestamp: { seconds: number; nanoseconds: number }): string {
    if (!timestamp || typeof timestamp.seconds !== 'number') {
      throw new Error('Le timestamp est invalide.');
    }
  
    // Convertir le timestamp en millisecondes et créer un objet Date
    const date = new Date(timestamp.seconds * 1000);
  
    // Extraire les composants de la date
    const day = String(date.getDate()).padStart(2, '0'); // Jour
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mois (0-indexé)
    const year = date.getFullYear(); // Année
  
    const hours = String(date.getHours()).padStart(2, '0'); // Heures
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Minutes
  
    // Retourner la date formatée
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  extractTimestampValues(timestamp: string): { seconds: number, nanoseconds: number } | null {
    // Utilisation d'une expression régulière pour extraire les valeurs de secondes et nanosecondes
    const regex = /Timestamp\(seconds=(\d+), nanoseconds=(\d+)\)/;
    const match = timestamp.match(regex);
  
    if (match) {
      // Si la chaîne correspond à l'expression régulière, on retourne un objet avec les valeurs extraites
      const seconds = parseInt(match[1], 10);
      const nanoseconds = parseInt(match[2], 10);
      return { seconds, nanoseconds };
    }
  
    // Si la chaîne ne correspond pas au format attendu, on retourne null
    return null;
  }

  async getMonaieById(id: string): Promise<{ monaie: string, operateur: string, pays: string } | null> {
    try {
      const deviseDoc = await this.firestore.collection('devises').doc(id).get().toPromise();
      if (deviseDoc?.exists) {
        const data: any = deviseDoc.data();
        return {
          monaie: data['monaie'],
          operateur: data['operateur'],
          pays: data['pays']
        };
      } else {
        console.error('Aucune devise trouvée avec cet ID');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la devise:', error);
      return null;
    }
  }

  async getMonaieDescription(id: string): Promise<string> {
    const monaieData = await this.getMonaieById(id);
    
    if (monaieData) {
      return `${monaieData.monaie}, ${monaieData.operateur} (${monaieData.pays})`;
    } else {
      return 'Informations indisponibles';
    }
  }
  etatTrans: any; numTrans: any; dateTrans: any; status: any
  montantEnvoye: string = '';
  montantRecu: string = '';
  nomRecepteur: string = '';
  telRecepteur: string = '';
  nomCompte: string = '';
  numeroCarte: string = '';
  nomBanque: string = '';
  numeroAlipay: string = '';
  nomCompletAlipay: string = '';
  codeQrAlipay: string = '';
  adresseUsdt: string = '';
  courrierPaypal: string = '';
  nomPaypal: string = '';
  telPaypal: string = '';
  numE: any= ""; whatE: any=""; nomTelE: any=""
  modifier(transfert: any) {
    this.numTrans = transfert.id;
    this.dateTrans = transfert.date;
    this.etatTrans = transfert.etat;
    this.montantEnvoye = transfert.montant;
    this.montantRecu = transfert.montantRecept;
    this.nomRecepteur = transfert.nomRecepteur;
    this.telRecepteur = transfert.telRecepteur;

    this.nomCompte = transfert.nomCompte;
    this.numeroCarte = transfert.numeroCarte;
    this.nomBanque = transfert.nomBanque;

    this.numeroAlipay = transfert.numeroAlipay;
    this.nomCompletAlipay = transfert.nomCompletAlipay;
    this.codeQrAlipay = transfert.codeQrAlipay;
    this.adresseUsdt = transfert.adresseUsdt;
    this.courrierPaypal = transfert.courrierPaypal;
    this.nomPaypal = transfert.nomPaypal;
    this.telPaypal = transfert.telPaypal;
    this.numE = transfert.numE;
    this.whatE = transfert.whatE;
    this.nomTelE = transfert.nomTelE;
  }

  modifierEtat(){
    let c = confirm('le client sera notifier du changement de statut. Voulez vous continuer?')
    if(c){
      this.firestore.collection('transferts').doc(this.numTrans).update({
        etat: this.status
      }).then(()=>{
        this.getTransfert()
      })
    }
  }
  endTrans(id: any){
    
  }
  
  toUp: any
  setMonaie(monaie: any){
    this.toUp = monaie.id
    this.monaie = monaie.monaie; this.operateur = monaie.operateur; 
    this.tAchat = monaie.tAchat; this.tVente = monaie.tVente
    this.pays = monaie.pays
    this.typeMonaie = monaie.typeMonaie;
    this.priorite = monaie.priorite
  }

  deleteTaux(taux: any){
    let c = confirm('Cette supression est définitive. Voulez vous continuer?')
    if(c){
      this.firestore.collection('tauxChange').doc(taux).delete().then(()=>{
        this.getTaux()
        alert('supprimé avec success')
      })
    }
    
  }

  annulerTrans(id: any){
    let c = confirm('Voulez vous confirmer la suppression de ce transfert? cette suppression est definitive')
    if(c){
      this.firestore.collection('transferts').doc(id).delete().then(()=>{
        alert('suppression reussie')
        this.getTransfert()
      })
    }
  }


  modifierTaux() {
    if (this.tauxToUp && this.currencyCode && this.currencyCodeRecept && this.montantMinim) {
      this.isSaved = true
      this.firestore.collection('tauxChange').doc(this.tauxToUp).update({
        taux: this.tauxChange,
        sender: this.currencyCode,
        reciever: this.currencyCodeRecept,
        montantMinim: this.montantMinim,
        montantMax: this.montantMax
      }).then(() => {
        alert('Taux de change modifié avec succès');
        this.isSaved = false
        this.tauxToUp = null;
        this.tauxChange = '';
        this.currencyCode = '';
        this.currencyCodeRecept = '';
        this.montantMinim = '';
        this.montantMax = ''
        this.getTaux(); // Recharger les taux de change après la modification
      }).catch((error) => {
        console.error('Erreur lors de la modification du taux de change:', error);
        alert('Erreur lors de la modification du taux de change');
      });
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  tauxToUp: any
  setTaux(taux: any){
    this.tauxToUp = taux.id
    this.tauxChange = taux.taux
    this.currencyCode = taux.idSender
    this.currencyCodeRecept = taux.idReceiver
    this.montantMinim = taux.montantMinim
    this.montantMax = taux.montantMax
  }

  writeToWhat(phoneNumber: string){
    // Remplacez les espaces ou caractères spéciaux dans le numéro
    const cleanedNumber = phoneNumber.replace(/\D/g, ''); 

    // Générer l'URL de WhatsApp
    const url = `https://wa.me/${cleanedNumber}`;

    // Ouvrir dans une nouvelle fenêtre
    window.open(url, '_blank');
  }

  currencyCode: any
  currencyCodeRecept: any
  tauxChange: any
  messages: any = []
  msg: any; isSending = false; idUserOf: any
  sendMsg(){
    if(this.msg && this.idUserOf){
      this.isSending = true
      this.firestore.collection('messages').add({
        message: this.msg,
        date: new Date(),
        idUser: this.idUserOf,
        admin: true
      }).then(()=>{
        this.msg = ""
        this.isSending = false
        this.listOf(this.idUserOf);
      })
    }else{
      alert('Erreur!')
    }
  }

  msgOf: any = []; nomOf: any
  listOf(idUser: any) {
    this.msgOf = [];
    this.firestore.collection('messages', ref => ref.where('idUser', '==', idUser)).snapshotChanges(['added']).subscribe(messages => {
      this.msgOf = [];
      messages.forEach(async (msg: any) => {
        this.firestore.collection('profiles', ref => ref.where('idUser', '==', msg.payload.doc.data()['idUser'])).get().subscribe(users => {
          users.forEach((user: any) => {
            this.nomOf = user.data()['tel'];
            this.idUserOf = msg.payload.doc.data()['idUser'];
            let date = this.formatTimestampToTime(msg.payload.doc.data()['date']);
            
            // Vérifier si le message existe déjà dans msgOf
            const exists = this.msgOf.some((existingMsg: any) => existingMsg.id === msg.payload.doc.id);
            if (!exists) {
              this.msgOf.push({
                id: msg.payload.doc.id,
                msg: msg.payload.doc.data()['message'],
                idUser: msg.payload.doc.data()['idUser'],
                date: date,
                email: user.data()['email'],
                tel: user.data()['tel'],
                nom: user.data()['email'][0],
                admin: msg.payload.doc.data()['admin']
              });
            }
  
            // Trier les messages par date après les avoir tous ajoutés
            this.msgOf = this.sortMessagesByDate(this.msgOf);
          });
        });
      });
    });
  }

  getUser(id: any){
    
    this.firestore.collection('profiles', ref=>ref.where('idUser', '==', id)).get().subscribe(users=>{
      users.forEach((user: any)=>{
        return user.data()['tel']
      })
    })
  }

  getMsg() {
    this.messages =[]
    this.firestore.collection('messages').snapshotChanges(['added']).subscribe(messages => {
      this.messages = [];
      
      messages.forEach(async (msg: any) => {
        const userId = msg.payload.doc.data()['idUser']; // Récupérer l'ID utilisateur du message
       
        // Attendre la fin de la récupération du profil de l'utilisateur avant d'ajouter le message
        this.firestore.collection('profiles', ref => ref.where('idUser', '==', userId)).get().subscribe(users => {
          users.forEach((user: any) => {
            let date = this.formatTimestampToTime(msg.payload.doc.data()['date'])
            this.messages.push({
              id: msg.payload.doc.id,
              msg: msg.payload.doc.data()['message'],
              idUser: userId,
              date: date,
              email: user.data()['email'],
              tel: user.data()['tel'],
              nom: user.data()['email'][0] // Prendre la première lettre de l'email pour le nom
            })
            
            this.messages = this.filterMessagesByUser(this.messages) 
          })
        }) 
        
      })
    });

    this.listOf(this.idUser)
    
  }
  
  // Fonction qui trie le tableau pour ne garder qu'un seul message par idUser
  filterMessagesByUser(messages: any) {
    let uniqueMessages: any = [];  // Tableau pour stocker les messages uniques
    const seenUserIds = new Map();  // Map pour suivre les idUser et leurs messages les plus récents
  
    messages.forEach((msg: any) => {
      const userId = msg.idUser;  // Récupérer l'idUser du message
      const timestamp = msg.date;  // Récupérer le timestamp de la date (assurez-vous que c'est un timestamp)
  
      // Vérifier si l'idUser a déjà été rencontré
      if (!seenUserIds.has(userId)) {
        // Si l'ID utilisateur n'a pas encore été vu, on l'ajoute au tableau unique
        seenUserIds.set(userId, msg);  // Ajouter le message au Map
      } else {
        // Si l'idUser existe déjà, comparer les timestamps pour garder le plus récent
        const existingMessage = seenUserIds.get(userId);
        const existingTimestamp = existingMessage.date;
  
        // Si le timestamp du message actuel est plus récent, on remplace le message
        if (timestamp > existingTimestamp) {
          seenUserIds.set(userId, msg);
        }
      }
    });
  
    // Convertir les valeurs du Map en tableau pour les retourner
    uniqueMessages = Array.from(seenUserIds.values());
  
    return uniqueMessages;  // Retourner le tableau filtré avec les messages uniques et les plus récents
  }
  
  sortMessagesByDate(messages: any) {
    return messages.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (dateA < dateB) {
        return -1;  // Si dateA est plus ancienne, mettre a avant b
      }
      if (dateA > dateB) {
        return 1;   // Si dateA est plus récente, mettre b avant a
      }
      return 0;
    });
  }
  
  formatTimestampToTime(timestamp: any): string {
    // Convertir le timestamp Firebase en millisecondes
    const date : any = new Date(timestamp.seconds * 1000);  // seconds est en secondes, on le convertit en millisecondes
  
    // Récupérer l'heure actuelle
    const currentDate : any = new Date();
    
    // Calculer la différence en millisecondes
    const diffInMilliseconds = currentDate - date;
  
    // Convertir cette différence en jours (1 jour = 86400000 millisecondes)
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 3600 * 24));
  
    // Si la différence est supérieure à 1 jour, afficher le nombre de jours
    if (diffInDays > 0) {
      return diffInDays === 1 ? 'Plus tôt il y a 1 jour' : `Plus tôt il y a ${diffInDays} jours`;
    }
  
    // Si la différence est inférieure à 1 jour, afficher l'heure et la minute
    const hours = date.getHours().toString().padStart(2, '0');   // Ajoute un zéro devant si l'heure est inférieure à 10
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Ajoute un zéro devant si les minutes sont inférieures à 10
    
    // Retourner l'heure au format "HH:mm"
    return `${hours}:${minutes}`;
  }
  
  taux: any = []
  async getTaux(): Promise<void> {
    this.taux = []
    const tauxSnapshot : any = await this.firestore.collection('tauxChange').get().toPromise();
    const tauxPromises = tauxSnapshot.docs.map(async (tc: any) => {
      const sender = await this.getDecOf(tc.data()['sender']);
      const receiver = await this.getDecOf(tc.data()['reciever']);
      
      const tauxData = {
        id: tc.id,
        idSender: tc.data()['sender'],
        idReceiver: tc.data()['reciever'],
        sender: sender,
        reciever: receiver,
        montantMinim: tc.data()['montantMinim'],
        montantMax: tc.data()['montantMax'],
        taux: tc.data()['taux']
      };

      this.taux.push(tauxData);
      this.allTaux.push(tauxData);
    })
  }


  async getTauxOf(id: any): Promise<void> {
    this.taux = []
    const tauxSnapshot : any = await this.firestore.collection('tauxChange').doc(id).get().toPromise();
    const tauxPromises = tauxSnapshot.docs.map(async (tc: any) => {
      const sender = await this.getDecOf(tc.data()['sender']);
      const receiver = await this.getDecOf(tc.data()['reciever']);
      
      this.taux.push({
        id: tc.id,
        sender: sender,
        reciever: receiver,
        taux: tc.data()['taux'],
        montantMinim: tc.data()['montantMinim']
      });
    });
  }

  
  async getDecOf(id: any): Promise<string> {
    const deviseDoc: any = await this.firestore.collection('devises').doc(id).get().toPromise();
    const deviseData = deviseDoc!.data( );
    return `${deviseData['pays']}, ${deviseData['monaie']} (${deviseData['operateur']})`;
  }
  
  search: any; allTaux: any = []; 
  searchTaux(){
    console.log(this.search)
    if(this.search.trim() === ''){
      this.taux = this.allTaux
    }else{
      this.taux = this.allTaux.filter((taux: any)=>{
        return taux.sender.toLowerCase().includes(this.search.toLowerCase()) || taux.reciever.toLowerCase().includes(this.search.toLowerCase())
      })
    }
    
  }

  verifications: any = []
  getVerification(){
    this.firestore.collection("verifications").get().subscribe(verifications=>{
      verifications.forEach((verif: any)=>{
        
      })
    })
  }
  
  affiliations: any = []
  getAffiliations() {
    this.firestore.collection('profiles').valueChanges().subscribe((data: any[]) => {
      this.affiliations = data
        .filter(profile => profile.points && profile.points >= 1) // Filtrer les profils avec des points >= 1
        .map(profile => ({
          nom: profile.nom,
          telephone: profile.tel,
          points: profile.points || 0
        }));
      console.log('Affiliations:', this.affiliations);
    }, error => {
      console.error('Erreur lors de la récupération des affiliations:', error);
    });
  }

  question: any; reponse: any
  addFaqs() {
    if (this.question && this.reponse) {
      this.firestore.collection('faqs').add({
        question: this.question,
        reponse: this.reponse,
        date: new Date()
      }).then(() => {
        console.log('FAQ ajoutée avec succès');
        this.question = '';
        this.reponse = '';
      }).catch((error) => {
        console.error('Erreur lors de l\'ajout de la FAQ:', error);
      });
    } else {
      console.error('Veuillez remplir tous les champs');
    }
  }

  faqs: any[] = [];
  getFaqs() {
    this.firestore.collection('faqs').valueChanges().subscribe((data: any[]) => {
      this.faqs = data.map(faq => ({
        question: faq.question,
        reponse: faq.reponse,
        date: faq.date
      }));
      console.log('FAQs:', this.faqs);
    }, error => {
      console.error('Erreur lors de la récupération des FAQs:', error);
    });
  }

  openBody() {
    document.querySelector('.list')?.classList.add('d-none');
    document.querySelector('.body-msg')?.classList.add('d-block');
  }
  
  closeBody() {
    document.querySelector('.list')?.classList.remove('d-none');
    document.querySelector('.body-msg')?.classList.remove('d-block');
  }

  faqToUpdate: any
  editFaq(faq: any) {
    this.faqToUpdate = faq.id;
    this.question = faq.question;
    this.reponse = faq.reponse;
  }

  updateFaq() {
    if (this.faqToUpdate && this.question && this.reponse) {
      this.firestore.collection('faqs').doc(this.faqToUpdate).update({
        question: this.question,
        reponse: this.reponse,
        date: new Date()
      }).then(() => {
        console.log('FAQ modifiée avec succès');
        this.faqToUpdate = null;
        this.question = '';
        this.reponse = '';
        this.getFaqs();
      }).catch((error) => {
        console.error('Erreur lors de la modification de la FAQ:', error);
      });
    } else {
      console.error('Veuillez remplir tous les champs');
    }
  }

  deleteFaq(id: string) {
    let c = confirm('Cette suppression est définitive. Voulez-vous continuer?');
    if (c) {
      this.firestore.collection('faqs').doc(id).delete().then(() => {
        console.log('FAQ supprimée avec succès');
        this.getFaqs();
      }).catch((error) => {
        console.error('Erreur lors de la suppression de la FAQ:', error);
      });
    }
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  filterTransfertsByDate(dateParam: string) {
    // Convertir la date paramètre en objet Date
    const [day, month, yearAndTime] = dateParam.split('/');
    const [year, time] = yearAndTime.split(' ');
    const [hours, minutes] = time.split(':');
    const dateToCompare = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Les mois sont indexés à partir de 0
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10)
    );
  
    // Trier les transferts par ordre décroissant de date
    this.transferts.sort((a: any, b: any) => {
      const dateA = this.parseDate(a.date).getTime();
      const dateB = this.parseDate(b.date).getTime();
  
      return dateB - dateA; // Tri décroissant
    });
  
    console.log('Transferts triés par date décroissante :', this.transferts);
  }
  
  // Fonction utilitaire pour convertir une date au format "21/03/2025 05:49" en objet Date
  parseDate(dateString: string): Date {
    const [day, month, yearAndTime] = dateString.split('/');
    const [year, time] = yearAndTime.split(' ');
    const [hours, minutes] = time.split(':');
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Les mois sont indexés à partir de 0
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10)
    );
  }

  
  onFileSelected($event: any){
    this.fileSCover = $event.target.files[0];
  }

}
