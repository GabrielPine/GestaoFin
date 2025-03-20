import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [],
})
export class DashboardComponent {
  usuarioNome: string = 'Usuário';
  
  constructor(private router: Router) {
    const user = localStorage.getItem('user');
    if (user) {
      this.usuarioNome = JSON.parse(user);
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
