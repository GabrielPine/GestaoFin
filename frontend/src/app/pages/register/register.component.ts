import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule, CommonModule],
})
export class RegisterComponent {
  username: string = ''
  email: string = ''
  senha: string = ''

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    if (!this.username || !this.email || !this.senha) {
      alert('Por favor, preencha todos os campos!')
      return
    }
  
    this.http.post<any>('http://localhost:5000/registrar', {
      username: this.username,
      email: this.email,
      senha: this.senha
    }).subscribe({
      next: (response) => {
        console.log('Resposta do backend:', response)
        const userId = response.id
        alert('Conta criada com sucesso!')
        this.router.navigate([`/perfil/${userId}`])
      },
      error: (error) => {
        if (error.status === 400 && error.error?.mensagem) {
          alert(error.error.mensagem)
        } else {
          alert('Erro ao criar conta, tente novamente.')
        }
      }
    })
  }
  

  navigateToLogin() {
    this.router.navigate(['/login'])
  }
}
