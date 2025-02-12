import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
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
      }
    })
  }

  setInitial(){
    this.monaie = this.pays
  }

  vider(){
    this.pays = ""; this.monaie = ""; this.operateur = ""; this.tVente =""; this.tAchat=""
  }
  msgErr: any = ""
  isadding = false
  async add(){
    this.msgErr = ""
    this.isadding = true
    if(this.pays, this.monaie){
      const users = [
        { pays: this.pays, monaie: this.monaie, operateur: this.operateur},
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
          pays: monaie.data()['pays']
        })    
      })
    })
  }
  
  montantMinim: any
  addTaux(){
    this.msgErr=""
    if(this.tauxChange && this.currencyCode && this.currencyCodeRecept){
      this.isadding= true
      this.firestore.collection('tauxChange').add({
        taux: this.tauxChange,
        sender: this.currencyCode,
        reciever: this.currencyCodeRecept,
        montantMinim: this.montantMinim
      }).then(()=>{
        alert('ajouté avec success')
        this.msgErr=""
        this.isadding = false
        this.currencyCode =""; this.currencyCodeRecept=""; 
        this.tauxChange=""; this.montantMinim = ""
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
        operateur: this.operateur
      }).then(()=>{
        alert('Modifié avec success')
        this.pays = ""; this.monaie = ""; this.operateur = "";
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

  transferts: any = []
  getTransfert(){
    this.transferts = []
    this.firestore.collection('transferts').snapshotChanges(['added']).subscribe(transferts=>{
      let num = 0; let couleur = ""; this.transferts = []
      transferts.forEach((transfert: any)=>{
        
        num++
        if(transfert.payload.doc.data()['etat']=="en cour"){
          couleur="primary"
        }
        if(transfert.payload.doc.data()['etat'] =="success"){
          couleur="success"
        }
        if(transfert.payload.doc.data()['etat'] =="echec"){
          couleur="danger"
        }

        let date = this.formatTimestampToDate(transfert.payload.doc.data()['date'])
        this.transferts.push({
          num: num,
          id: transfert.payload.doc.id,
          etat: transfert.payload.doc.data()['etat'],
          tel: transfert.payload.doc.data()['tel'],
          montant: transfert.payload.doc.data()['montant']+" => "+transfert.payload.doc.data()['montantRecept'],
          couleur: couleur,
          date: date
        })
      })
      
    })
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

  etatTrans: any; numTrans: any; dateTrans: any; status: any
  modifier(transfert: any){
    this.etatTrans = transfert.etat
    this.numTrans = transfert.id
    this.dateTrans = transfert.date
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
      })
    }else{
      alert('Erreur!')
    }
  }
  
  msgOf: any = []; nomOf: any
  listOf(idUser: any){
    this.msgOf = []
    this.firestore.collection('messages', ref=>ref.where('idUser', '==', idUser)).snapshotChanges(['added']).subscribe(messages=>{
      this.msgOf = []
      messages.forEach(async (msg: any)=>{
        this.firestore.collection('profiles', ref=>ref.where('idUser', '==', msg.payload.doc.data()['idUser'])).get().subscribe(users=>{
          users.forEach((user: any)=>{
            this.nomOf = user.data()['tel']
            this.idUserOf = msg.payload.doc.data()['idUser']
            let date = this.formatTimestampToTime(msg.payload.doc.data()['date'])
            this.msgOf.push({
              id: msg.payload.doc.id,
              msg: msg.payload.doc.data()['message'],
              idUser: msg.payload.doc.data()['idUser'],
              date: date, 
              email: user.data()['email'],
              tel: user.data()['tel'],
              nom: user.data()['email'][0],
              admin: msg.payload.doc.data()['admin']
            })
            this.sortMessagesByDate(this.msgOf) 
          })
        })
      })
    })   
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
      const dateA = a.date;
      const dateB = b.date;
  
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
      console.log(tc.id)
      this.taux.push({
        id: tc.id,
        sender: sender,
        reciever: receiver,
        taux: tc.data()['taux'],
      });
    });
  }
  
  async getDecOf(id: any): Promise<string> {
    const deviseDoc: any = await this.firestore.collection('devises').doc(id).get().toPromise();
    const deviseData = deviseDoc!.data();
    return `${deviseData['pays']} (${deviseData['pays']})`;
  }

  verifications: any = []
  getVerification(){
    this.firestore.collection("verifications").get().subscribe(verifications=>{
      verifications.forEach((verif: any)=>{
        
      })
    })
  }
  

}
