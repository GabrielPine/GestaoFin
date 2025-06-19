import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-balance',
  standalone: true,
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css'],
  imports: [RouterModule, CommonModule, FormsModule]
})
export class BalanceComponent implements OnInit {
  receber = { descricao: '', valor: 0, data: '' };
  contasReceber: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarContasReceber();
  }

  salvarContaReceber(): void {
    const userId = localStorage.getItem('userId') || '1';
    const entrada = {
      ...this.receber,
      usuario_id: userId
    };

    this.http.post('http://localhost:5000/receber', entrada).subscribe({
      next: () => {
        alert('Entrada salva com sucesso!');
        this.receber = { descricao: '', valor: 0, data: '' };
        this.carregarContasReceber();
      },
      error: (err) => {
        console.error('Erro ao salvar entrada:', err);
      }
    });
  }

  carregarContasReceber(): void {
    const userId = localStorage.getItem('userId') || '1';
    this.http.get<any[]>(`http://localhost:5000/receber/${userId}`).subscribe({
      next: (entradas) => {
        this.contasReceber = entradas;
      },
      error: (err) => {
        alert('Erro ao buscar contas');
        console.error('Erro ao buscar entradas:', err);
      }
    });
  }

  deletarContaReceber(id: number): void {
    this.http.delete(`http://localhost:5000/receber/${id}`).subscribe({
      next: () => {
        alert('Entrada excluída com sucesso!');
        this.carregarContasReceber();
      },
      error: (err) => {
        console.error('Erro ao excluir entrada:', err);
      }
    });
  }

  totalReceitas(): number {
    return this.contasReceber.reduce((soma, entrada) => soma + Number(entrada.valor), 0);
  }
}
