import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient
  constructor() { 
    this.supabase = createClient(environment.supabase.url, environment.supabase.keys);
  }
   // Inscription d'un nouvel utilisateur
  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({email, password})
  }

  //connexion
  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({email, password})
  }
  
  
  async signOut() {
    const message = await this.supabase.auth.signOut();
    console.log(message);
  }


}
