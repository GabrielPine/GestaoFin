import { Routes } from '@angular/router'
import { LoginComponent } from './pages/login/login.component'
import { RegisterComponent } from './pages/register/register.component'
import { DashboardComponent } from './pages/dashboard/dashboard.component'
import { FooterComponent } from './pages/footer/footer.component'
import { HeaderComponent } from './pages/header/header.component'
import { RecoverPasswordComponent } from './pages/recover-password/recover-password.component'
import { UserProfileComponent } from './pages/user-profile/user-profile.component'
import { PersonalDataComponent } from './pages/personal-data/personal-data.component'
import { DebtsComponent } from './pages/debts/debts.component'
import { BalanceComponent } from './pages/balance/balance.component'
import { DoubtsComponent } from './pages/doubts/doubts.component'
import { ExtratoComponent } from './pages/extrato/extrato.component'

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'footer', component: FooterComponent },
  { path: 'header', component: HeaderComponent },
  { path: 'recover-password', component: RecoverPasswordComponent },
  { path: 'perfil/:id', component: UserProfileComponent },
  { path: 'personal-data', component:PersonalDataComponent},
  { path: 'debts', component: DebtsComponent},
  { path: 'balance', component: BalanceComponent},
  { path:'doubts', component: DoubtsComponent},
  { path: 'extrato', component: ExtratoComponent }
]

