import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  router = inject(Router)

  constructor(
    public Auth : AngularFireAuth,
    public apiservice: ApiService,
    public firestore: AngularFirestore,
    private http: HttpClient
  ){}

  ngOnInit(){
    this.getAuth()
    
    this.getMonaie()
    this.fetchCountryDialCodes()
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
  
  admin = false
  getProfile(){
    this.firestore.collection('profiles', ref=>ref.where('idUser', '==', this.idUser)).get().subscribe(profiles=>{
      profiles.forEach((profile: any)=>{
        this.tel = profile.data()['tel']
        //console.log(profile.data()['admin'])
        if(profile.data()['admin']){
          this.admin = true
        }
      })
    })
  }

  cniRecto: any; cniVerso: any; selfie: any
  updateProfile(){
    
  }

  tel: any; opRe: any; opSend: any; montantSend = 0; montantRec: any
  isAddingTrans = false; msgErr: any= ""; nomR: any; telR: any; emailR: any=""
  telRCode: any ="+237"; numECode:any  ="+237"; whatECode : any="+237"
  addTransfert() {
    console.log(this.opRe + " " + this.opSend + " " + this.monaieS + " " + this.monaieR + this.nomR + this.tauxApplicable + this.idUser + this.tel);
    if (this.opRe && this.opSend && this.montantSend && this.nomR && this.telR) {
      this.isAddingTrans = true;
      this.msgErr = "";
  
      // Concaténer les indicatifs téléphoniques avec les numéros de téléphone
      const fullTelR = `${this.telRCode} ${this.telR}`;
      const fullNumE = `${this.numECode} ${this.numE}`;
      const fullWhatE = `${this.whatECode} ${this.whatE}`;
  
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
        telRecepteur: fullTelR,
        emailRecepteur: this.emailR,
        monaieSender: this.monaieS,
        monaieRecepteur: this.monaieR,

        //banque
        nomCompte: this.nomCompte,
        numeroCarte: this.numeroCarte,
        nomBanque: this.nomBanque,

        numeroAlipay: this.numeroAlipay,
        nomCompletAlipay: this.nomCompletAlipay,
        codeQrAlipay: this.codeQrAlipay,
        adresseUsdt: this.adresseUsdt,
        courrierPaypal: this.courrierPaypal,
        nomPaypal: this.nomPaypal,
        telPaypal: this.telPaypal,
        // Informations sur l'expéditeur
        numE: fullNumE,
        whatE: fullWhatE,
        nomTelE: this.nomTelE
      }).then(() => {
        alert('Votre transfert a été reçu. Nous communiquerons avec vous pour la suite');
        this.isAddingTrans = false;
        this.resetForm();
        this.getTransfert();
      });
    } else {
      this.errChange = 'Remplissez toutes les informations';
    }
  }
  
  transferts: any = []; nbreEncour = 0; nbreSuccess = 0; nbreEchec = 0 
  getTransfert(){
    this.firestore.collection('transferts', ref=>ref.where('idUser', '==', this.idUser)).get().subscribe(transferts=>{
      let num = 0; this.transferts = []
      this.nbreEncour = 0; this.nbreSuccess = 0; this.nbreEchec = 0

      transferts.forEach((transfert: any)=>{
        num++; let couleur = ""
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
      //console.log(this.transferts)
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

  monaies: any = [];

  async getMonaie() {
    this.firestore.collection('devises').get().subscribe(monaies => {
      this.monaies = [];
      const promises: any = [];
  
      monaies.forEach((monaie: any) => {
        const data = monaie.data();

        if (data['typeMonaie'] !== undefined && data['priorite'] !== undefined && data['typeMonaie'] !== 'invisible') {
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
        console.log(this.monaies);
      });
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
  monaieS: any; monaieR: any; montantMinim: any; montantMax: any
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
              this.montantMax = doc.data()['montantMax']
            });
            
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
    this.montantRec = ""; this.errChange = ""; this.montantMinim = ""; this.montantMax = ""
    
    this.calcul().then(()=>{
      if(this.opSend && this.tauxApplicable && this.montantSend){
        if(this.montantSend < this.montantMinim ){
          this.errChange = "Le montant minimum est de "+ this.montantMinim
        }else if(this.montantSend > this.montantMax){
          this.errChange = "Le montant maximum est de "+ this.montantMax
        }else{
          this.montantRec = this.montantSend * this.tauxApplicable
        }
        
      }
    })
  }
  
  isConfirming = false;
  confirmTransfert() {
    this.isConfirming = true;
  }

  cancelConfirm() {
    this.isConfirming = false;
  }

  mS: any; mR: any
  updateOperator(type: string, event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const selectedMonaie = this.monaies.find((monaie: any) => monaie.id === selectedValue);
    if (selectedMonaie) {
      if (type === 'send') {
        this.mS = selectedMonaie.operateur+" ("+selectedMonaie.monaie+")";
        this.logoSender = selectedMonaie.logo
        console.log(this.logoSender)
      } else if (type === 'receive') {
        this.mR = selectedMonaie.operateur+" ("+selectedMonaie.monaie+")";
        this.logoReciever = selectedMonaie.logo
      }
    }
  }

  nextStep = false
  bancRMB = "7NZn0gcHASkSocUh7hXs"
  bancGhana = "ReQ4GVzbW9oe7VNejbtR"
  bancCameroun="Z4nwSrOzI5sg5FGKfeD7"
  bancIvoire = "to3Q2WEnJ7GXCuC1UlJF"
  Alipay ="k9O3cjijn1TBdnua14Dr"
  usdt = "0F1YtDLX3SFXUqlM0qUk"
  usdt2 = "QvbrdthSqNmx2LRciIKv"
  paypal = "DSKROAmrIy56knv6F8YS"
  mtnE ="1d1Zy17dJSjMY2YfLRVu"
  orangeE="IbuUrLk48WxegOLOukDU"
  next() {
    console.log(this.step);
    if (this.step === 1) {
      if (this.opSend && this.opRe && this.montantSend && this.nomR && this.telR) {
        this.step = 2;
      } else {
        alert('Veuillez remplir tous les champs');
      }
    }
  
    if (this.step === 2) {
      if (
        (this.opRe === this.bancRMB || this.opRe === this.bancGhana || this.opRe === this.bancCameroun || this.opRe === this.bancIvoire) &&
        (!this.nomCompte || !this.numeroCarte || !this.nomBanque)
      ) {
        alert('Remplissez tous les champs pour le transfert bancaire');
      } else if (this.opRe === this.Alipay && (!this.numeroAlipay || !this.nomCompletAlipay || !this.codeQrAlipay)) {
        alert('Veuillez remplir tous les champs pour Alipay');
      } else if ((this.opRe === this.usdt || this.opRe === this.usdt2) && (!this.adresseUsdt)) {
        alert('Veuillez remplir tous les champs pour adresse USDT');
      } else if (this.opRe === this.paypal && (!this.courrierPaypal || !this.nomPaypal || !this.telPaypal)) {
        alert('Veuillez remplir tous les champs pour PayPal');
      } else {
        this.step = 3;
      }
    }
  }
  
  previousStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  step = 1
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
  resetForm() {
    this.opRe = "";
    this.opSend = "";
    this.montantSend = 0;
    this.nomR = "";
    this.telR = "";
    this.montantRec = 0;
    this.monaieR = "";
    this.monaieS = "";
    this.tauxApplicable = "";
    this.nomCompte = "";
    this.numeroCarte = "";
    this.nomBanque = "";
    this.numeroAlipay = "";
    this.nomCompletAlipay = "";
    this.codeQrAlipay = "";
    this.step = 1;
    this.adresseUsdt = ""
    this.courrierPaypal = ""
    this.nomPaypal = ""
    this.telPaypal = ""
  }

  numE: any = ""; whatE: any = ""; nomTelE: any = ""; 
  countries: any = [];
  fetchCountryDialCodes(): void {
    const url = 'https://restcountries.com/v3.1/all'; // URL de l'API

    this.http.get<any[]>(url).subscribe(
      (response: any) => {
        // Traitement de la réponse
        this.countries = response
          .map((country: any) => ({
            country: country.name.common,
            code: country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : ''),
            flag: country.flags?.svg || country.flags?.png || '', // URL du drapeau
          }))
          .sort((a: any, b: any) => a.country.localeCompare(b.country)); // Tri alphabétique

        //console.log(this.countries); // Debug : Affiche les pays triés
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des données :', error);
      }
    );
  }



}
