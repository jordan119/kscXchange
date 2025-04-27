import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ApiService } from '../services/api.service';
import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment'; 

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inscription.component.html',
  styleUrl: './inscription.component.scss'
})
export class InscriptionComponent implements OnInit {
  router = inject(Router);
  private supabase: SupabaseClient;

  nom: any = ""; prenom: any; username: any;
  email: any = "";
  password: any = "";
  confirmPassword: any = "";
  cover: any;
  statusLoader = "invisible";
  authService = inject(AuthServiceService);
  messageAlert = "";
  colorAlert = "";
  idUser: any | undefined;
  affCode: any;
  termsAccepted: boolean = false;
  laoding = false;
  listOfPays: any;
  listPays: any;
  fileCover: any;
  etat: any = "";
  type: any = "artiste";
  tel: any; codeTel: any;
  errMessage: any;
  errEmail: any;
  errOrder: any;
  countries: any;

  constructor(
    public firestore: AngularFirestore,
    public storage: AngularFireStorage,
    public route: ActivatedRoute,
    public Auth: AngularFireAuth,
    public apiservice: ApiService,
    private http: HttpClient
  ) {
    this.supabase = createClient(environment.supabase.url , environment.supabase.keys);
  }

  ngOnInit() {
    this.getAuth();
    this.fetchCountryDialCodes();
    this.route.queryParams.subscribe(params => {
      this.affCode = params['affCode'];
    });
  }

  goTo(page: any) {
    this.router.navigate(['/' + page + '']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
  
  getAuth() {
    this.Auth.authState.subscribe(auth => {
      if (!auth) {
        //this.router.navigate(['/acceuil'])
      } else {
        this.idUser = auth?.uid;
        this.email = auth.email;
        this.router.navigate(['/dash']);
      }
    });
  } 
  
  uploadPro(event: any) {
    this.fileCover = event.target.files[0];
  }
  
  addProfile() {
    this.Auth.authState.subscribe(auth => {
      if (!auth) {
        alert('Un problème est survenu lors de l\'authentification.');
      } else {
        this.idUser = auth?.uid;
        if (!this.affCode) {
          this.affCode = "aucun";
        }
        console.log(this.affCode);

        // Tentative d'ajout du profil dans Firestore
        this.firestore.collection('profiles').add({
          idUser: this.idUser,
          email: this.email,
          tel: this.tel,
          codeTel: this.codeTel,
          nom: this.nom,
          prenom: this.prenom,
          username: this.username,
          date: new Date(),
          admin: false,
          affCode: this.affCode,
          points: 0 // Initialiser les points à 0 pour le nouvel utilisateur
        }).then(() => {
          this.laoding = false;
          this.etat = "";
          alert('Inscription réussie');
          this.router.navigate(['/login']);
          this.statusLoader = "invisible";
        }).catch((error) => {
          console.error('Erreur lors de l\'ajout du profil :', error);

          // Logique de récupération
          this.laoding = false;
          this.statusLoader = "invisible";
          this.colorAlert = "alert-danger";
          this.messageAlert = "Une erreur est survenue lors de l'ajout de votre profil. Veuillez réessayer.";

          // Optionnel : Retenter l'ajout du profil après un délai
          setTimeout(() => {
            const retry = confirm('Voulez-vous réessayer d\'ajouter votre profil ?');
            if (retry) {
              this.addProfile(); // Retenter l'ajout
            }
          }, 2000);
        });
      }
    });
  }

  login() {
    let result = this.controlPass();
    if (result === 'valide') {
      this.statusLoader = "";
      this.messageAlert = "";
      this.colorAlert = "";
      this.laoding = true;
      this.etat = "disabled";

      // Vérifier si un code d'affiliation a été utilisé
      if (this.affCode) {
        this.addPointToAffOwner(this.affCode).then(() => {
          console.log('Point ajouté au propriétaire du code d\'affiliation.');
        }).catch((error) => {
          console.error('Erreur lors de l\'ajout du point au propriétaire du code d\'affiliation :', error);
        });
      }

      // Générer le code d'affiliation pour le nouvel utilisateur
      this.affCode = this.generateAffCode();

      // Inscription de l'utilisateur
      this.authService.register(this.email, this.password, this.username).subscribe({
        next: () => {
          this.addProfile();
        },
        error: (err) => {
          this.colorAlert = "alert-danger";
          this.messageAlert = err.code;
          this.statusLoader = "invisible";
          this.laoding = false;
        }
      });
    } else {
      this.messageAlert = this.errMessage;
      this.colorAlert = "alert-danger";
    }
  }

  controlPass() {
    this.errMessage = "";
    this.errEmail = "";
    this.errOrder = "";

    if (!this.nom || !this.prenom || !this.username || !this.email || !this.codeTel || !this.tel || !this.password || !this.confirmPassword) {
      this.errOrder = 'Remplissez tous les champs';
      this.colorAlert = "alert-danger";
      return 'error';
    }

    if (this.password.length < 8) {
      this.errMessage = 'Le mot de passe doit contenir au minimum 8 caractères';
      this.colorAlert = "alert-danger";
      return 'error';
    }

    if (this.password !== this.confirmPassword) {
      this.errMessage = 'Les mots de passe ne correspondent pas.';
      this.colorAlert = "alert-danger";
      return 'error';
    }

    const hasUpperCase = /[A-Z]/.test(this.password);
    const hasDigit = /\d/.test(this.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);

    if (!hasUpperCase || !hasDigit || !hasSpecialChar) {
      this.errMessage = 'Le mot de passe doit contenir une majuscule, un chiffre et un caractère spécial.';
      this.colorAlert = "alert-danger";
      return 'error';
    }

    let emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(this.email)) {
      this.errEmail = 'Veuillez entrer une adresse email valide.';
      this.colorAlert = "alert-danger";
      return 'error';
    }

    return 'valide';
  }

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

  generateAffCode(): string {
    const username = this.username || '';
    const currentSecond = new Date().getSeconds();
    const lastDigitOfPhone = this.tel ? this.tel.toString().slice(-1) : '';
    return `${username}${currentSecond}${lastDigitOfPhone}`;
  }

  addPointToAffOwner(affCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.firestore.collection('profiles', ref => ref.where('affCode', '==', affCode)).get().subscribe({
        next: (profiles) => {
          if (!profiles.empty) {
            profiles.forEach((profile: any) => {
              const profileData = profile.data();
              const newPoints = (profileData.points || 0) + 1;
              this.firestore.collection('profiles').doc(profile.id).update({ points: newPoints }).then(() => {
                console.log('Point ajouté au propriétaire du code d\'affiliation :', affCode);
                resolve();
              }).catch((error) => {
                console.error('Erreur lors de la mise à jour des points :', error);
                reject(error);
              });
            });
          } else {
            console.warn('Aucun profil trouvé pour le code d\'affiliation :', affCode);
            resolve();
          }
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des profils :', error);
          reject(error);
        }
      });
    });
  }
}
