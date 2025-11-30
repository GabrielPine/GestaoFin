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

  // Critérios de validação da senha
  hasUpper: boolean = false;
  hasLower: boolean = false;
  hasNumber: boolean = false;
  hasSpecial: boolean = false;
  hasMinLength: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  // Atualiza critérios conforme o usuário digita
  validatePassword(): void {
    const senha = this.senha || '';

    this.hasUpper = /[A-Z]/.test(senha);
    this.hasLower = /[a-z]/.test(senha);
    this.hasNumber = /[0-9]/.test(senha);
    this.hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
    this.hasMinLength = senha.length >= 8;
  }

  // Verifica se todos os critérios foram atendidos
  private isPasswordValid(): boolean {
    return (
      this.hasUpper &&
      this.hasLower &&
      this.hasNumber &&
      this.hasSpecial &&
      this.hasMinLength
    );
  }

  register(): void {

    // Atualiza as regras antes de validar
    this.validatePassword();

    if (!this.username || !this.email || !this.senha) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    if (!this.isPasswordValid()) {
      alert('A senha não atende todos os requisitos abaixo do campo.');
      return;
    }

    this.http.post<any>('http://localhost:5000/registrar', {
      username: this.username,
      email: this.email,
      senha: this.senha
    }).subscribe({
      next: (response) => {
        console.log('Resposta do backend:', response);

        const userId = response.id;
        alert('Conta criada com sucesso!');
        this.router.navigate([`/perfil/${userId}`]);
      },
      error: (error) => {
        if (error.status === 400 && error.error?.mensagem) {
          alert(error.error.mensagem);
        } else {
          alert('Erro ao criar conta, tente novamente.');
        }
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/dashboard']);
  }
}
