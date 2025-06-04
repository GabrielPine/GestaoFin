import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, CommonModule, HttpClientModule]
})
export class LoginComponent {
  email: string = ''
  senha: string = ''

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    console.log('Email digitado:', this.email)
    console.log('Senha digitada:', this.senha)

    this.http.post<any>('http://localhost:5000/login', {
      email: this.email,
      senha: this.senha
    }).subscribe(response => {
      if (response.mensagem === 'Login bem-sucedido') {
        localStorage.setItem('user', response.usuario.username)
        localStorage.setItem('userId', response.usuario.id.toString())
        this.router.navigate(['/dashboard'])
      } else {
        alert('Credenciais inválidas')
      }
    }, error => {
      alert('Erro ao tentar fazer login')
    })
  }

  navigateToRegister() {
    this.router.navigate(['/register'])
  }

  navigateToRecoverPassword() {
    this.router.navigate(['/recover-password'])
  }
}
