import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common'; // *ngIf e [ngClass]
import { FormsModule } from '@angular/forms';  

@Component({
  selector: 'app-recover-password',
  standalone: true,
  templateUrl: './recover-password.component.html',
  imports: [CommonModule, FormsModule]
})
export class RecoverPasswordComponent {
  email: string = '';
  mensagem: string = '';
  sucesso: boolean = false;

  constructor(private authService: AuthService) {}

  requestReset() {
    if (!this.email) {
      this.mensagem = 'Por favor, insira um e-mail válido!';
      this.sucesso = false;
      return;
    }

    this.authService.requestPasswordReset(this.email).subscribe(
      response => {
        this.mensagem = 'E-mail enviado! Verifique sua caixa de entrada.';
        this.sucesso = true;
      },
      error => {
        this.mensagem = 'Erro ao enviar e-mail! Verifique se o e-mail está correto.';
        this.sucesso = false;
      }
    );
  }
}
