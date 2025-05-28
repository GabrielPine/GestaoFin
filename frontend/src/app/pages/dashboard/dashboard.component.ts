import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [RouterModule]
})
export class DashboardComponent implements OnInit {
  usuarioNome: string = 'Usuário'
  objetivo: string = ''
  rendaMensal: string = ''

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user')
    const userId = localStorage.getItem('userId')

    if (!user || !userId) {
      this.router.navigate(['/login'])
      return
    }

    this.usuarioNome = user

    this.http.get<any>(`http://localhost:5000/perfil/${userId}`).subscribe({
      next: (data) => {
        this.objetivo = data.objetivo
        this.rendaMensal = data.rendaMensal
      },
      error: (err) => {
        console.error('Erro ao buscar perfil:', err)
      }
    })
  }

  logout(): void {
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
    this.router.navigate(['/login'])
  }
}
