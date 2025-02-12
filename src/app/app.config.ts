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
  apiKey: "AIzaSyC9zqi7yxliobvsBqJOZQUzlPbBLnXgEqE",
  authDomain: "kscxchange-f9e5a.firebaseapp.com",
  projectId: "kscxchange-f9e5a",
  storageBucket: "kscxchange-f9e5a.firebasestorage.app",
  messagingSenderId: "347996611117",
  appId: "1:347996611117:web:5652e5ba403fcc34248ea4",
  measurementId: "G-EWZ5QYQ5R7"
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
