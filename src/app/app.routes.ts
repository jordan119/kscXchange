import { Routes } from '@angular/router';
import { AcceuilComponent } from './acceuil/acceuil.component';
import { ContactComponent } from './contact/contact.component';
import { ProposComponent } from './propos/propos.component';
import { TauxComponent } from './taux/taux.component';
import { FaqComponent } from './faq/faq.component';
import { ConnectionComponent } from './connection/connection.component';
import { InscriptionComponent } from './inscription/inscription.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminComponent } from './admin/admin.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
    { path: '', component: AcceuilComponent},
    { path: 'acceuil', component: AcceuilComponent},
    { path: 'about', component: ProposComponent},
    { path: 'rate', component: TauxComponent},
    { path: 'faq', component: FaqComponent},
    { path: 'contact', component: ContactComponent},
    { path: 'login', component: ConnectionComponent},
    { path: 'inscription', component: InscriptionComponent},
    { path: 'dash', component: DashboardComponent},
    { path: 'admin', component: AdminComponent},
    { path: 'profil', component: ProfileComponent},
];
