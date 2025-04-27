import { Component, inject, OnInit } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';

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
  user$ = new BehaviorSubject<any>(null);

  constructor(private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe(user => {
      this.user$.next(user);
    });
  }
  
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

  closeNav() {
    const navbarNavDropdown = document.getElementById('navbarNavDropdown');
    const navbarLogoTitle = document.getElementById('navbarLogoTitle');
    if (navbarNavDropdown) {
      const bsCollapse = new bootstrap.Collapse(navbarNavDropdown, {
        toggle: true
      });
      bsCollapse.hide();
      if (navbarLogoTitle) {
        navbarLogoTitle.classList.remove('rotate');
      }
    }
  }

  toggleLogoAnimation() {
    const navbarLogoTitle = document.getElementById('navbarLogoTitle');
    if (navbarLogoTitle) {
      navbarLogoTitle.classList.toggle('rotate');
    }
  }

  disconnect(){
    console.log('disconnect')
    this.afAuth.signOut().then(()=>{
      this.authService.currentUserSig.set(null)
      this.firstLetterName = undefined
      this.idUser = undefined      
      
    });
    this.connectVisible = "d-bloc"
  }

}
