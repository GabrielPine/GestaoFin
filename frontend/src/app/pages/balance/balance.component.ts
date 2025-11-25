import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Receita = {
  descricao: string;
  valor: number;
  data: string; // 'YYYY-MM-DD'
};

@Component({
  selector: 'app-balance',
  standalone: true,
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css'],
  imports: [RouterModule, CommonModule, FormsModule]
})
export class BalanceComponent implements OnInit {
  receber: Receita = { descricao: '', valor: 0, data: '' };
  contasReceber: any[] = [];
  carregando = false;

  private readonly API = 'http://localhost:5000';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarContasReceber();
  }

  // ---------- Utils ----------
  private getUserIdOrStop(): string | null {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Sessão expirada ou não iniciada. Faça login novamente.');
      return null;
    }
    return userId;
  }

  private toNumberBR(n: number | string): number {
    // aceita "1.234,56" e "1234.56"
    const s = String(n).trim();
    if (s.includes(',')) {
      return Number(s.replace(/\./g, '').replace(',', '.'));
    }
    return Number(s);
  }

  // ---------- LOGOUT ----------
  logout(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('token'); // se tiver token
    // ou: localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ---------- API ----------
  salvarContaReceber(): void {
    const userId = this.getUserIdOrStop();
    if (!userId) return;

    if (!this.receber.descricao || !this.receber.data) {
      alert('Preencha descrição e data.');
      return;
    }

    const valor = this.toNumberBR(this.receber.valor);
    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido (ex.: 150,35).');
      return;
    }

    const payload = {
      usuario_id: userId,
      descricao: this.receber.descricao.trim(),
      valor: valor,
      data: this.receber.data, // 'YYYY-MM-DD'
    };

    this.http.post(`${this.API}/receber`, payload).subscribe({
      next: () => {
        alert('Entrada salva com sucesso!');
        this.receber = { descricao: '', valor: 0, data: '' };
        this.carregarContasReceber();
      },
      error: (err) => {
        console.error('Erro ao salvar entrada:', err);
        alert(err?.error?.mensagem || 'Erro ao salvar entrada.');
      }
    });
  }

  carregarContasReceber(): void {
    const userId = this.getUserIdOrStop();
    if (!userId) return;

    this.carregando = true;
    this.http.get<any[]>(`${this.API}/receber/${userId}`).subscribe({
      next: (entradas) => {
        this.contasReceber = (entradas ?? []).map((e) => ({
          ...e,
          valor: Number(e.valor ?? 0)
        }));
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao buscar entradas:', err);
        alert(err?.error?.mensagem || 'Erro ao buscar receitas.');
        this.carregando = false;
      }
    });
  }

  deletarContaReceber(id: number): void {
    this.http.delete(`${this.API}/receber/${id}`).subscribe({
      next: () => {
        alert('Entrada excluída com sucesso!');
        this.carregarContasReceber();
      },
      error: (err) => {
        console.error('Erro ao excluir entrada:', err);
        alert(err?.error?.mensagem || 'Erro ao excluir entrada.');
      }
    });
  }

  totalReceitas(): number {
    return this.contasReceber.reduce((soma, entrada) => soma + Number(entrada.valor || 0), 0);
  }
}
