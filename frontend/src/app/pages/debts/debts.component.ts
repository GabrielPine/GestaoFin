import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Debito = {
  descricao: string;
  valor: number | string;
  data: string; // 'YYYY-MM-DD'
};

@Component({
  selector: 'app-debts',
  standalone: true,
  templateUrl: './debts.component.html',
  styleUrls: ['./debts.component.css'],
  imports: [RouterModule, CommonModule, FormsModule],
})
export class DebtsComponent implements OnInit {
  conta: Debito = { descricao: '', valor: 0, data: '' };
  contasPagar: any[] = [];
  carregando = false;

  private readonly API = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarContasPagar();
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

  // ---------- API ----------
  salvarConta(): void {
    const userId = this.getUserIdOrStop();
    if (!userId) return;

    if (!this.conta.descricao || !this.conta.data) {
      alert('Preencha descrição e data.');
      return;
    }

    const valor = this.toNumberBR(this.conta.valor);
    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido (ex.: 150,35).');
      return;
    }

    const payload = {
      usuario_id: userId,
      descricao: this.conta.descricao.trim(),
      valor: valor,
      data: this.conta.data, // 'YYYY-MM-DD'
    };

    this.http.post(`${this.API}/conta`, payload).subscribe({
      next: () => {
        alert('Débito salvo com sucesso!');
        this.conta = { descricao: '', valor: 0, data: '' };
        this.carregarContasPagar();
      },
      error: (err) => {
        console.error('Erro ao salvar débito:', err);
        alert(err?.error?.mensagem || 'Erro ao salvar débito.');
      },
    });
  }

  carregarContasPagar(): void {
    const userId = this.getUserIdOrStop();
    if (!userId) return;

    this.carregando = true;
    this.http.get<any[]>(`${this.API}/contas/${userId}`).subscribe({
      next: (res) => {
        this.contasPagar = (res ?? []).map((c) => ({
          ...c,
          valor: Number(c.valor ?? 0),
        }));
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao buscar débitos:', err);
        alert(err?.error?.mensagem || 'Erro ao buscar débitos.');
        this.carregando = false;
      },
    });
  }

  deletarConta(id: number): void {
    this.http.delete(`${this.API}/conta/${id}`).subscribe({
      next: () => {
        alert('Débito excluído com sucesso!');
        this.carregarContasPagar();
      },
      error: (err) => {
        console.error('Erro ao excluir débito:', err);
        alert(err?.error?.mensagem || 'Erro ao excluir débito.');
      },
    });
  }

  totalDebitos(): number {
    return this.contasPagar.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  }
}
