import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  router = inject(Router)

  constructor(
    public Auth : AngularFireAuth,
    public apiservice: ApiService,
    public firestore: AngularFirestore
  ){}

  ngOnInit(){
    this.getAuth()
    
    this.getMonaie()
    
  }
  goTo(route: any){
    this.router.navigate(['/'+route+'']);
  }

  
  idUser: any; nom: any
  getAuth(){
    this.Auth.authState.subscribe(auth=>{
      if(!auth){
        this.router.navigate(['/acceuil'])
      }else{
        this.idUser = auth?.uid 
        //this.nom = auth.displayName
        this.getProfile()
        this.getTransfert()
      }
    })
  }
  
  
  getProfile(){
    this.firestore.collection('profiles', ref=>ref.where('idUser', '==', this.idUser)).get().subscribe(profiles=>{
      profiles.forEach((profile: any)=>{
        this.tel = profile.data()['tel']
        console.log(this.tel)
      })
    })
  }

  

  cniRecto: any; cniVerso: any; selfie: any
  updateProfile(){
    
  }
  tel: any; opRe: any; opSend: any; montantSend = 0; montantRec: any
  isAddingTrans = false; msgErr: any= ""; nomR: any; telR: any
  addTransfert(){
    console.log(this.opRe+" "+this.opSend+" "+this.monaieS+" "+this.monaieR+this.nomR+this.tauxApplicable+this.idUser+this.tel)
    if(this.opRe && this.opSend && this.montantSend && this.nomR && this.telR){
      console
      this.isAddingTrans = true
      this.msgErr = ""
      this.firestore.collection('transferts').add({
        tel: this.tel,
        recepteur: this.opRe,
        initiateur: this.opSend,
        etat: 'en cour',
        date: new Date(),
        montant: this.montantSend,
        montantRecept: this.montantRec,
        taux: this.tauxApplicable,
        idUser: this.idUser,
        nomRecepteur: this.nomR,
        telRecepteur: this.telR,
        monaieSender: this.monaieS,
        monaieRecepteur: this.monaieR
      }).then(()=>{
        alert('Votre transfert a été recut. Nous communiquerons avec vous pour la suite')
        this.isAddingTrans = false
        this.opRe =""; this.opSend = ""; this.montantSend=0; this.nomR = ""; this.telR=""; 
        this.montantRec =0; this.monaieR = ""; this.monaieS = ""; this.tauxApplicable = ""
        this.getTransfert()
      })
    }else{
      this.errChange = 'remplissez toutes les informations'
    }
  }
  
  transferts: any = []; nbreEncour = 0; nbreSuccess = 0; nbreEchec = 0 
  getTransfert(){
    this.firestore.collection('transferts', ref=>ref.where('idUser', '==', this.idUser)).get().subscribe(transferts=>{
      let num = 0; let couleur = ""; this.transferts = []
      this.nbreEncour = 0; this.nbreSuccess = 0; this.nbreEchec = 0

      transferts.forEach((transfert: any)=>{
        num++
        if(transfert.data()['etat']=="en cour"){
          couleur="primary"
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
          montant: transfert.data()['montant']+" "+transfert.data()['monaieSender']+" => "+transfert.data()['montantRecept']+" "+transfert.data()['monaieRecepteur'],
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

  deleteTransfert(id: any){
    let c = confirm('voulez supprimer ce transfert?')
    if(c){
      this.firestore.collection('transferts').doc(id).delete().then(()=>{
        alert('Suppression reussie')
        this.getTransfert()
      })
    }
  }
  
  generateInvoice(transfertDetails: any) {

    let x = prompt('A quel nom devons nous faire le recut?')
    if(x){

      // Construire le contenu HTML de la facture
      const invoiceHTML = `
        <html>
          <head>
            <title>Facture - Transfert Réussi</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
              }
              .invoice-header {
                text-align: center;
                margin-bottom: 20px;
              }
              .invoice-header h1 {
                margin: 0;
                font-size: 24px;
              }
              .invoice-details {
                margin-bottom: 20px;
              }
              .details-row {
                margin-bottom: 10px;
              }
              .table-recut {
                width: 100%;
                border-collapse: collapse;
              }
              .table-recut, th, td {
                border: 1px solid black;
              }
              .table-recut th, td {
                padding: 10px;
                text-align: left;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
              }
              .img-logo{
                  width: 10rem;
                  height: 5rem;
                  object-fit: contain;
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <img src="../../assets/logo ksc xchange t.png" class="img-logo">
              <h1>Facture</h1>
              <p>kscXchange</p>
            </div>
            <div class="invoice-details">
              <div class="details-row"><strong>Nom de l'expéditeur :</strong> ${x}</div>
              <div class="details-row"><strong>Nom du destinataire :</strong> ${transfertDetails.nomRecepteur}</div>
              <div class="details-row"><strong>Nom du destinataire :</strong> ${transfertDetails.telRecepteur}</div>
              <div class="details-row"><strong>Montant transféré :</strong> ${transfertDetails.amount} ${transfertDetails.monaieSender}</div>
              <div class="details-row"><strong>Taux de change :</strong> ${transfertDetails.taux} </div>
              <div class="details-row"><strong>Date :</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
              <div class="details-row"><strong>ID de la transaction :</strong> ${transfertDetails.id}</div>
            </div>
            <table class="table-recut">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Montant transféré</td>
                  <td>${transfertDetails.amount} ${transfertDetails.monaieSender}</td>
                </tr>
                <tr>
                  <td>Taux de change</td>
                  <td>${transfertDetails.taux} </td>
                </tr>
                <tr>
                  <td><strong>Total Montant recut</strong></td>
                  <td><strong>${transfertDetails.amountR} ${transfertDetails.monaieRecepteur}</strong></td>
                </tr>
              </tbody>
            </table>
            <div class="footer">
              Merci d'avoir utilisé notre service. À bientôt !
            </div>
          </body>
        </html>
      ` ;

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close(); // Nécessaire pour IE/Edge
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        console.error('Impossible d\'ouvrir une fenêtre pour l\'impression.');
      }
    }
    
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
        if(this.montantSend >= this.montantMinim){
          this.montantRec = this.montantSend * this.tauxApplicable
        }else{
          this.errChange = "Le montant minimum est de "+ this.montantMinim
        } 
        
      }
    })
    
    
      
    
  }
  

}
