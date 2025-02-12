import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.scss'
})
export class AcceuilComponent implements OnInit {
  router = inject(Router)
  goTo(route: any){
    this.router.navigate(['/'+route+'']);
  }

  ngOnInit(): void {
    this.getMonaie()
    this.getAuth()
  }

  constructor( 
    private firestore: AngularFirestore,
    public Auth : AngularFireAuth,
  ){}

  send: any = [
    {}
  ]

  opSend: any
  opRe: any
  monaies: any = []
  async getMonaie(){
    this.firestore.collection('devises').get().subscribe(monaies => {
      this.monaies= []
      monaies.forEach((monaie: any) => {   
        this.monaies.push({
          id: monaie.id,
          monaie: monaie.data()['monaie'],
          pays: monaie.data()['pays'],
          operateur: monaie.data()['operateur'],
          
        })    
      })
      console.log(this.monaies)
    })
  }

  idUser: any; nom: any; hasUser = false
  getAuth(){
    this.Auth.authState.subscribe(auth=>{
      if(!auth){
        this.router.navigate(['/acceuil'])
      }else{
        this.idUser = auth?.uid 
        this.hasUser = true
        this.getTransfert()
        this.getMsg()
      }
    })
  }

  tel: any; montantSend = 0; montantRec: any
  isAddingTrans = false; msgErr: any= ""
  

  transferts: any = []; nbreEncour = 0; nbreSuccess = 0; nbreEchec = 0 
  getTransfert(){
    this.firestore.collection('transferts').get().subscribe(transferts=>{
      let num = 0; let couleur = ""; this.transferts = []
      this.nbreEncour = 0; this.nbreSuccess = 0; this.nbreEchec = 0

      transferts.forEach((transfert: any)=>{
        num++
        if(transfert.data()['etat']=="En cour"){
          couleur="warning"
          this.nbreEncour++
        }
        if(transfert.data()['etat'] =="success"){
          couleur="success"
          this.nbreSuccess++
        }
        if(transfert.data()['etat'] =="echec"){
          couleur="danger"
          this.nbreEchec++
        }
        let date = this.formatTimestampToDate(transfert.data()['date'])
        

        this.transferts.push({
          num: num,
          id: transfert.id,
          etat: transfert.data()['etat'],
          montant: transfert.data()['montant']+" => "+transfert.data()['montantRecept'],
          amount: transfert.data()['montant'],
          amountR: transfert.data()['montantRecept'],
          taux: transfert.data()['taux'],
          couleur: couleur,
          date: date,
          telRecepteur: transfert.data()['telRecepteur'],
          nomRecepteur: transfert.data()['nomRecepteur'],
          monaieRecepteur: transfert.data()['monaieRecepteur'],
          monaieSender: transfert.data()['monaieSender'],   
        })
      })
      console.log(this.transferts)
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
  
  msg: any
  
  sendMsg(){
    if(this.msg && this.idUser){
      this.firestore.collection('messages').add({
        message: this.msg,
        date: new Date(),
        idUser: this.idUser,
        admin: false
      }).then(()=>{
        this.msg = ""
      })
    }
  }
  messages: any = []
  async getMsg(){
    await this.firestore.collection('messages', ref=>ref.where('idUser','==', this.idUser))
    .snapshotChanges(['added']).subscribe(messages=>{
      this.messages = []
      messages.forEach((msg: any)=>{
        this.messages.push({
          message: msg.payload.doc.data()['message'],
          date: msg.payload.doc.data()['date'],
          idUser: msg.payload.doc.data()['idUser'],
          admin: msg.payload.doc.data()['admin'],
        })
        this.messages = this.sortMessagesByDate(this.messages)
      })
      
      
    })
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
  

  async getNameOfMonaie(id: any): Promise<string | null> {
    try {
      const doc: any = await this.firestore.collection('devises').doc(id).get().toPromise();
      return doc.exists ? doc.data()['monaie'] : null; // Vérifie si le document existe
    } catch (error) {
      console.error('Erreur lors de la récupération de la monnaie :', error);
      return null; // Retourne null en cas d'erreur
    }
  }

  errChange: any =""; tauxApplicable: any
  monaieS: any; monaieR: any; montantMinim: any
  async calcul() {
    this.errChange = ""
    if (!this.opSend) {
      this.errChange = "Choisissez l'envoyeur";
      return;
    }else{
      if(!this.opRe){
        this.errChange = "Choisissez le recepteur";
        return;
      }else{
        try {
          // Récupération des monnaies
          this.monaieS = await this.getNameOfMonaie(this.opSend);
          this.monaieR = await this.getNameOfMonaie(this.opRe);
      
          // Vérifier que les monnaies existent
          if (!this.monaieS || !this.monaieR) {
            this.errChange = "Impossible de récupérer les informations des devises.";
            return;
          }
      
          console.log('Monnaie émetteur :', this.monaieS);
          console.log('Monnaie récepteur :', this.monaieR);
      
          // Récupération du taux de change
          const tauxSnapshot:any = await this.firestore
            .collection('tauxChange', ref => 
              ref.where('sender', '==', this.opSend).where('reciever', '==', this.opRe)
            )
            .get()
            .toPromise();
      
          if (tauxSnapshot.empty) {
            this.errChange = "Aucun taux de change trouvé pour ces devises.";
            this.tauxApplicable = null; 
          } else {
            tauxSnapshot.forEach((doc: any) => {
              this.tauxApplicable = doc.data()['taux'];
              this.montantMinim = doc.data()['montantMinim']
              console.log(this.montantMinim)
            });
      
            console.log('Taux applicable :', this.tauxApplicable);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données :', error);
          this.errChange = "Une erreur est survenue lors de la récupération des données.";
        }
      }
    }
    
    
  }

  applyTaux(){
    this.montantRec = ""; this.errChange = ""; this.montantMinim = ""
    
    
    this.calcul().then(()=>{
      if(this.opSend && this.tauxApplicable && this.montantSend){
        console.log('hello')
        if(this.montantSend >= this.montantMinim){
          this.montantRec = this.montantSend * this.tauxApplicable
        }else{
          this.errChange = "Le montant minimum est de "+ this.montantMinim
        } 
        
      }
    })
    
    
      
    
  }
  swapp(){
    if(this.idUser){
      alert('initiez le transfert a partir de votre tableau de bord')
      this.goTo('dash')
    }else{
      alert('Connectez-vous avant de commencer un transfert')
      this.goTo('inscription')
    }
  }
}
