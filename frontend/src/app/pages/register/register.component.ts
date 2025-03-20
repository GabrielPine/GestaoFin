import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule, CommonModule],
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  senha: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  // ✅ Função para cadastrar um novo usuário
  register() {
    if (!this.username || !this.email || !this.senha) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    console.log('Enviando dados:', { username: this.username, email: this.email, senha: this.senha });

    this.http.post<any>('http://localhost:5000/registrar', { 
      username: this.username, 
      email: this.email, 
      senha: this.senha 
    }).subscribe(response => {
      console.log('Cadastro realizado:', response);
      alert('Conta criada com sucesso!');
      this.router.navigate(['/login']);
    }, error => {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao criar conta, tente novamente.');
    });
  }

  // ✅ Redireciona para a tela de login
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
