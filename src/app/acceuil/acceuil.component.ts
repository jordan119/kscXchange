import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
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
    this.getFaqs()
    this.getTransfert()
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
  async getMonaie() {
    this.firestore.collection('devises').get().subscribe(monaies => {
      this.monaies = [];
      const promises: any = [];
  
      monaies.forEach((monaie: any) => {
        const data = monaie.data();
        if (data['typeMonaie'] !== undefined && data['priorite'] !== undefined) {
          const promise = new Promise<void>((resolve) => {
            this.monaies.push({
              id: monaie.id,
              monaie: data['monaie'],
              pays: data['pays'],
              operateur: data['operateur'],
              logo: data['logo'],
              typeMonaie: data['typeMonaie'],
              priorite: data['priorite']
            });
            resolve();
          });
          promises.push(promise);
        }
      });
  
      Promise.all(promises).then(() => {
        // Trier les devises par priorité après avoir ajouté toutes les devises au tableau
        this.monaies.sort((a: any, b: any) => a.priorite - b.priorite);
      });
    });
  }
  

  idUser: any; nom: any; hasUser = false
  getAuth(){
    this.Auth.authState.subscribe(auth=>{
      if(!auth){
        this.router.navigate(['/acceuil'])
      }else{
        this.idUser = auth?.uid 
        this.hasUser = true
        this.getMsg()
      }
    })
  }

  tel: any; montantSend = 0; montantRec: any
  isAddingTrans = false; msgErr: any= ""
  

  transferts: any = []; nbreEncour = 0; nbreSuccess = 0; nbreEchec = 0 
  getTransfert(){
    this.firestore.collection('transferts', ref => ref.limit(10)).get().subscribe(transferts=>{
      let num = 0;  this.transferts = []
      this.nbreEncour = 0; this.nbreSuccess = 0; this.nbreEchec = 0

      transferts.forEach((transfert: any)=>{
        num++; let couleur = "";
        if(transfert.data()['etat']=="en cour"){
          couleur="warning"
          this.nbreEncour++

        }else if(transfert.data()['etat'] =="success"){
          couleur="success"
          this.nbreSuccess++
        }else if(transfert.data()['etat'] =="echec"){
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
          id: msg.payload.doc.id,
          message: msg.payload.doc.data()['message'],
          date: msg.payload.doc.data()['date'],
          idUser: msg.payload.doc.data()['idUser'],
          admin: msg.payload.doc.data()['admin'],
          time: this.getTimeMsg(msg.payload.doc.data()['date']),
        })
        this.messages = this.sortMessagesByDate(this.messages)
      })
    })
  }

  getTimeMsg(date: any): string {
    const messageDate = this.parseDate(date); // Convertir la date en objet Date
    const now = new Date(); // Date actuelle
    const diffInMs = now.getTime() - messageDate.getTime(); // Différence en millisecondes
    const diffInSeconds = Math.floor(diffInMs / 1000); // Différence en secondes
    const diffInMinutes = Math.floor(diffInSeconds / 60); // Différence en minutes
    const diffInHours = Math.floor(diffInMinutes / 60); // Différence en heures
    const diffInDays = Math.floor(diffInHours / 24); // Différence en jours
  
    // Conditions pour afficher le temps écoulé
    if (diffInSeconds < 60) {
      return "à l'instant";
    } else if (diffInMinutes === 1) {
      return "il y a une minute";
    } else if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} minutes`;
    } else if (diffInHours === 1) {
      return "il y a une heure";
    } else if (diffInHours < 24) {
      return `il y a ${diffInHours} heures`;
    } else if (diffInDays === 1) {
      return "il y a un jour";
    } else if (diffInDays < 7) {
      return `il y a ${diffInDays} jours`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `il y a ${months} mois`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `il y a ${years} an${years > 1 ? "s" : ""}`;
    }
  }
  
  sortMessagesByDate(messages: any) {
    return messages.sort((a: any, b: any) => {
      const dateA = this.parseDate(a.date).getTime(); // Convertir la date du message A en millisecondes
      const dateB = this.parseDate(b.date).getTime(); // Convertir la date du message B en millisecondes
  
      return dateA - dateB; // Tri croissant : négatif si a < b, 0 si a == b, positif si a > b
    });
  }

  parseDate(dateString: any): Date {
    if (typeof dateString === 'string') {
      // Remplacer "à" par une virgule pour rendre la chaîne compatible avec le constructeur Date
      const formattedDate = dateString.replace(' à ', ', ');
      return new Date(formattedDate);
    } else if (dateString && typeof dateString === 'object' && dateString.seconds) {
      // Si c'est un Timestamp Firestore, le convertir en Date
      return new Date(dateString.seconds * 1000);
    } else {
      throw new Error('Le format de la date est invalide : ' + JSON.stringify(dateString));
    }
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
  logoSender: any; logoReciever: any
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
  mS: any; mR: any
  updateOperator(type: string, event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const selectedMonaie = this.monaies.find((monaie: any) => monaie.id === selectedValue);
    if (selectedMonaie) {
      if (type === 'send') {
        this.mS = selectedMonaie.operateur+" ("+selectedMonaie.monaie+")";
        this.logoSender = selectedMonaie.logo
      } else if (type === 'receive') {
        this.mR = selectedMonaie.operateur+" ("+selectedMonaie.monaie+")";
        this.logoReciever = selectedMonaie.logo
      }
    }
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

  faqs: any[] = [];

  getFaqs() {
    this.firestore.collection('faqs').valueChanges().subscribe((data: any[]) => {
      this.faqs = data.map(faq => ({
        question: faq.question,
        reponse: faq.reponse,
        date: faq.date
      }));
      
    }, error => {
      console.error('Erreur lors de la récupération des FAQs:', error);
    });
  }

                                 
  @ViewChild('staticBackdrop') messageContainer!: ElementRef;

  // Méthode pour défiler vers le bas
  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Erreur lors du défilement :', err);
    }
  }

  // Appelé lorsque la modale est ouverte
  onModalOpen(): void {
    this.scrollToBottom();
  }
  goToWhatsapp(){
    let phoneNumber = "+237691681051"
    const cleanedNumber = phoneNumber.replace(/\D/g, ''); 

    // Générer l'URL de WhatsApp
    const url = `https://wa.me/${cleanedNumber}`;

    // Ouvrir dans une nouvelle fenêtre
    window.open(url, '_blank');
  }
}

