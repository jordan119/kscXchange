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
  selector: 'app-inscription',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './inscription.component.html',
  styleUrl: './inscription.component.scss'
})
export class InscriptionComponent implements OnInit{
  router = inject(Router)
  nom :any =""; prenom: any; username: any
  email:any =""
  password: any =""
  confirmPassword: any = ""
  cover:  any
  statusLoader = "invisible"
  authService = inject(AuthServiceService)
  messageAlert = ""
  colorAlert = ""
  idUser: any | undefined

  constructor(
    public firestore: AngularFirestore,
    public storage: AngularFireStorage,
    public route: ActivatedRoute,
    public Auth : AngularFireAuth,
    public apiservice: ApiService,
    private http: HttpClient
  ){}

  goTo(page: any){
    this.router.navigate(['/'+page+'']);
  }

  goToLogin(){
    this.router.navigate(['/login'])
  }

  laoding = false
  listOfPays: any
  ngOnInit(){
    this.getAuth()
    this.fetchCountryDialCodes()
  }

  listPays: any
  getAuth(){
    this.Auth.authState.subscribe(auth=>{
      if(!auth){
        //this.router.navigate(['/acceuil'])
      }else{
        this.idUser = auth?.uid
        this.email = auth.email 
        this.router.navigate(['/dash'])
      }
    })
  }
   
  fileCover: any
  uploadPro(event : any){
    this.fileCover =  event.target.files[0]
  }

  etat: any = ""
  type: any = "artiste"
  tel : any; codeTel: any
  addProfile(){
    this.Auth.authState.subscribe(auth=>{
      if(!auth){
        alert('Un probleme est survenu')
      }else{
        this.idUser = auth?.uid
        
        this.firestore.collection('profiles').add({
          idUser: this.idUser,
          email: this.email,
          tel: this.tel,
          codeTel: this.codeTel,
          nom: this.nom,
          prenom: this.prenom,
          username: this.username,
          date: new Date()
        }).then(()=>{
          this.laoding = false
          this.etat=""
          alert('Inscription reussie')
          this.router.navigate(['/login'])
          this.statusLoader = "invisible"
        })
      }
    })
  }

  errMessage: any
  login(){
    let result = this.controlPass()
    if(result == 'valide'){      
      this.statusLoader = ""
      this.messageAlert = ""; this.colorAlert = ""
      this.laoding = true
      this.etat = "disabled"
      this.authService.register(this.email, this.password, this.username).subscribe({
        next: ()=>{          
          this.addProfile()         
        },
        error: (err)=>{
          this.colorAlert = "alert-danger"
          this.messageAlert = err.code
          this.statusLoader = "invisible"
          this.laoding = false
        }        
      })        
    }else{
      this.messageAlert = this.errMessage
      this.colorAlert = "alert-danger"
    }    
  }

  errEmail: any
  errOrder: any
  controlPass(){
    this.errMessage = ""
    this.errEmail = ""
    if(this.password.length < 8){
      this.errMessage = 'le mot de passe doit contenir minimum 8 caratères'
      this.colorAlert = "alert-danger"
      return 'error'
    }
    if(this.password != this.confirmPassword){
      this.errMessage='Les mots de passe ne correspondent pas.'
      this.colorAlert = "alert-danger"
      return 'error'
    }

    const hasUpperCase = /[A-Z]/.test(this.password);
    const hasDigit = /\d/.test(this.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);

    if (!hasUpperCase || !hasDigit || !hasSpecialChar) {
      this.errMessage = 'Le mot de passe doit contenir une majuscule, un chiffre et un caractère spécial.';
      this.colorAlert = "alert-danger"
      return 'error'
    }
    
    let emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(this.email)) {
      this.errEmail ='Veuillez entrer une adresse email valide.'
      this.colorAlert = "alert-danger"
      return 'error'
    }

    if(!this.tel || !this.nom || !this.prenom || !this.username || !this.codeTel || !this.password || !this.confirmPassword){
      this.errOrder='Remplissez tous les champs'
      this.colorAlert = "alert-danger"
      return 'error'
    }
    
    return 'valide'
  }

  isCheked = false
  condition(){
    this.isCheked = !this.isCheked
    if(this.isCheked){
      
    }else{

    }    
  }

  countries:any
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
  
        console.log(this.countries); // Debug : Affiche les pays triés
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des données :', error);
      }
    );
  }

  
}
