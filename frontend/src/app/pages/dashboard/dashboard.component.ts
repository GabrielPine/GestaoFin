import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [RouterModule, FormsModule, CommonModule]
})
export class DashboardComponent implements OnInit {
  usuarioNome: string = 'Usuário';
  objetivo: string = '';
  rendaMensal: number = 0;
  saldoTotal: number = 0;
  dataAtualizacao: string = '';

  descricao: string = '';
  valor: number = 0;
  data: string = '';
  arquivoCSV!: File;

  contasPagar: { descricao: string, valor: number }[] = [];
  get totalContas(): number {
    return this.contasPagar.reduce((soma, conta) => soma + conta.valor, 0);
  }
  
  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');

    if (!user || !userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioNome = user;

    // Buscar perfil
    this.http.get<any>(`http://localhost:5000/perfil/${userId}`).subscribe({
      next: (data) => {
        this.objetivo = data.objetivo;
        this.rendaMensal = (data.rendaMensal);
        this.dataAtualizacao = new Date().toLocaleDateString();
        this.calcularSaldo(); // provisório, atualiza ao carregar
      },
      error: (err) => {
        console.error('Erro ao buscar perfil:', err);
      }
    });

    // Buscar contas a pagar
    this.http.get<any[]>(`http://localhost:5000/contas/${userId}`).subscribe({
      next: (contas) => {
        this.contasPagar = contas;
        this.calcularSaldo();
      },
      error: (err) => {
        console.error('Erro ao buscar contas:', err);
      }
    });
  }

  calcularSaldo(): void {
    const totalContas = this.contasPagar.reduce((soma, conta) => soma + conta.valor, 0);
    this.saldoTotal = this.rendaMensal - totalContas;
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  selecionarArquivo(event: any): void {
    this.arquivoCSV = event.target.files[0];
  }

  enviarCSV(event: Event): void {
    event.preventDefault();
    const formData = new FormData();
    const userId = localStorage.getItem('userId') || '1';

    formData.append('file', this.arquivoCSV);
    formData.append('usuario_id', userId);

    this.http.post('http://localhost:5000/contas/upload', formData).subscribe({
      next: () => {
        alert('CSV enviado com sucesso!');
        this.recarregarContas(); // recarrega após envio
      },
      error: (err) => {
        console.error('Erro ao enviar CSV:', err);
      }
    });
  }

  salvarConta(): void {
    const userId = localStorage.getItem('userId') || '1';

    const novaConta = {
      usuario_id: userId,
      descricao: this.descricao,
      valor: this.valor,
      data: this.data
    };

    this.http.post('http://localhost:5000/conta', novaConta).subscribe({
      next: () => {
        alert('Conta salva com sucesso!');
        this.descricao = '';
        this.valor = 0;
        this.data = '';
        this.recarregarContas();
      },
      error: (err) => {
        console.error('Erro ao salvar conta:', err);
      }
    });
  }

  recarregarContas(): void {
    const userId = localStorage.getItem('userId') || '1';
    this.http.get<any[]>(`http://localhost:5000/contas/${userId}`).subscribe({
      next: (contas) => {
        this.contasPagar = contas;
        this.calcularSaldo();
      },
      error: (err) => {
        console.error('Erro ao recarregar contas:', err);
      }
    });
  }
}


