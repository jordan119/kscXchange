import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { count, map, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ApiService  implements OnInit{

  constructor(
    public firestore: AngularFirestore,
    public storage: AngularFireStorage,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    
  }
  async addDocuments(collectionName: string, dataArray: any[]): Promise<void> {
    try {
      const promises = dataArray.map((data) => {
        return this.firestore.collection(collectionName).add(data); // Retourne la promesse
      });
      
      await Promise.all(promises); // Attendre que toutes les promesses soient résolues
      console.log('Ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l’ajout des documents :', error);
    }
  }
  


}
