import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})


export class NavbarComponent implements OnInit {

  router = inject(Router)
  firstLetterName: string | undefined
  authService = inject(AuthServiceService)
  connectVisible = "d-bloc"
  idUser: any

  constructor(){}
  goTo(page: any){    
    this.router.navigate(['/'+page+'']);
    console.log('heee')
  }

  ngOnInit(){
    this.authService.user$.subscribe(user=>{
      if(user){
        this.authService.currentUserSig.set({
          email: user.email!,
          nom: user.displayName!,
          id: user.uid!
        })
        this.idUser = user.uid
        this.connectVisible = "d-none"
        this.firstLetterName = user.displayName![0]
        
      }else{
        this.authService.currentUserSig.set(null)
      }
    })

  }
}
