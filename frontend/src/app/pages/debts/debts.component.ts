import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-debts',
  standalone: true,
  templateUrl: './debts.component.html',
  styleUrls: ['./debts.component.css'],
  imports: [RouterModule, CommonModule, FormsModule]
})
export class DebtsComponent implements OnInit {
  descricao: string = '';
  valor: number = 0;
  data: string = '';
  contasPagar: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarContas();
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
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao salvar conta:', err);
      }
    });
  }

  carregarContas(): void {
    const userId = localStorage.getItem('userId') || '1';
    this.http.get<any[]>(`http://localhost:5000/contas/${userId}`).subscribe({
      next: (contas) => {
        this.contasPagar = contas;
      },
      error: (err) => {
        console.error('Erro ao buscar contas:', err);
      }
    });
  }

  deletarConta(id: number): void {
    this.http.delete(`http://localhost:5000/conta/${id}`).subscribe({
      next: () => {
        alert('Conta excluída com sucesso!');
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao excluir conta:', err);
      }
    });
  }

  get totalContas(): number {
    return this.contasPagar.reduce((soma, conta) => soma + Number(conta.valor), 0);
  }
}

