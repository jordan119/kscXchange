import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service'
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
@Component({
  selector: 'app-connection',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './connection.component.html',
  styleUrl: './connection.component.scss'
})
export class ConnectionComponent implements OnInit {
  router = inject(Router)
  statusLoader = "invisible"
  authService = inject( AuthServiceService)
  messageAlert = ""
  colorAlert = ""
  email:any =""
  password: any =""
  idUser: any

  constructor(){

  }

  ngOnInit(): void {
    this.idUser = this.authService.currentUserSig()?.id
    if(this.idUser){
      this.messageAlert = "Connectez vous pour ajouter vos chansons"
    }
  }

  goTo(page: any){
    this.router.navigate(['/'+page+'']);
  }

  loading = false
  etat = ""
  connect(){
    let result = this.controlPass()
    if(result == 'valide'){
      if(this.email && this.password){
        this.statusLoader = ""
        this.loading = true
        this.etat = 'disabled'
        this.authService.login(this.email, this.password).subscribe({
          next: ()=>{
            this.router.navigate(['/dash'])
            this.statusLoader = "invisible"
            this.loading = false
          },
          error: (err)=>{
            this.messageAlert = "Email ou mot de passe incorrect"
            this.colorAlert = "alert-danger"
            this.statusLoader = "invisible"
            this.loading = false
            this.etat = ''
          }        
        })
      }else{
        this.messageAlert = "Veillez remplir toutes les informations"
        this.colorAlert = "alert-warning"
      }
    }else{
      this.messageAlert = "Entrer une adresse mail valide"
      this.colorAlert = "alert-warning"
    }
  }

  errEmail: any
  controlPass(){
    let emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(this.email)) {
      this.errEmail ='Veuillez entrer une adresse email valide.'
      console.log('valide')
      return 'error'
    }
    return 'valide'
  }

}
