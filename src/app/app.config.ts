import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import{initializeApp, provideFirebaseApp} from '@angular/fire/app'
import {getFirestore, provideFirestore} from '@angular/fire/firestore'
import { getAuth, provideAuth } from '@angular/fire/auth';
import { AngularFirestore} from '@angular/fire/compat/firestore';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { HammerModule } from '@angular/platform-browser';

const firebaseConfig =  {
  apiKey: "AIzaSyD0O8kEPksH36N-EKPhUz_idXLvj6FFwKU",
  authDomain: "kscxchange-a703c.firebaseapp.com",
  projectId: "kscxchange-a703c",
  storageBucket: "kscxchange-a703c.firebasestorage.app",
  messagingSenderId: "651848678215",
  appId: "1:651848678215:web:8e8471212f0fff6636aa62",
  measurementId: "G-5DQPQV2DNF"
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom([
      AngularFireModule.initializeApp(firebaseConfig),
      AngularFirestoreModule,
      AngularFireStorageModule,
      AngularFireAuthModule,
      AngularFireMessagingModule,
      HammerModule,
      provideFirebaseApp(() => initializeApp(firebaseConfig)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
    ]),
    provideHttpClient(), 
    HttpClient,
  ]



};
