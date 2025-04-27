import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NgClass } from '@angular/common';
import { ApiService } from '../services/api.service';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  router = inject(Router)
  ngOnInit(): void {
    this.getAuth()
  }
  constructor(
    public firestore: AngularFirestore,
    public storage: AngularFireStorage,
    public route: ActivatedRoute,
    public Auth : AngularFireAuth,
    public apiservice: ApiService,
    private http: HttpClient
  ){

  }
  idUser: any; 
  getAuth(){
    this.Auth.authState.subscribe(auth=>{
      if(!auth){
        this.router.navigate(['/acceuil'])
      }else{
        this.idUser = auth?.uid 
        this.email = auth.email
        this.getProfile()
      }
    })
  }
  idProfile: any; isUpdating = false
  updateProf(){
    this.isUpdating = true
    this.firestore.collection('profiles').doc(this.idProfile).update({
      nom: this.nom,
      prenom: this.prenom,
      tel: this.tel,
      username: this.username,
      adresse: this.adresse,
      affCode: this.affCode
    }).then(()=>{
      this.isUpdating = false
      alert('modification réussie')
    })
  }

  deleteProfile(){
    this.firestore.collection('profiles').doc(this.idProfile).delete().then(()=>{
      alert('compte supprimé')
      this.Auth.signOut().then(()=>{
        this.router.navigate(['/acceuil'])
      })
    })
  }
  
  getProfile(){
    this.firestore.collection('profiles', ref=>ref.where('idUser', '==', this.idUser)).get().subscribe(profiles=>{
      profiles.forEach((profile: any)=>{
        this.tel = profile.data()['tel']
        this.idProfile = profile.id;
        this.email = profile.data()['email'],
        this.prenom = profile.data()['prenom'],
        this.nom = profile.data()['nom'],
        this.username = profile.data()['username'],
        this.adresse = profile.data()['adresse'],
        this.affCode = profile.data()['affCode']
        this.generateAffLink()
      })
    })
  }

  nom: any; prenom: any; email: any; 
  username: any; adresse : any; tel: any
  option: any = false
  setNav(objet: any){
    if(objet == "ip"){
      this.option = false
      this.etatI  = "active"
      this.etatV = ""
    }else{
      this.option = true
      this.etatV = "active"
      this.etatI=""
    }
    console.log(this.option)
  }

  selfie: any; idPiece: any; rectoId: any; verseauId: any
  etatI = "active"; etatV = "active"
  sendToVerif(){
    
  }

  affLink: any=""; affCode: any
  generateAffLink() {
    if (this.affCode) {
      const baseUrl = 'https://kscchange-9333b.web.app/inscription'; // Remplacez par l'URL de votre site
      this.affLink = `${baseUrl}?affCode=${this.affCode}`;
      
      console.log('Generated AffLink:', this.affLink);
    }
  }
  
  copyAffLink() {
    const inputElement = document.createElement('input');
    inputElement.setAttribute('value', this.affLink);
    document.body.appendChild(inputElement);
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);
    alert('Lien d\'affiliation copié dans le presse-papiers');
  }
}
