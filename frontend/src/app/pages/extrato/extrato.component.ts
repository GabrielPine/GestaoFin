import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type Lancamento = {
  id: number;
  tipo: 'DEBITO' | 'CREDITO';
  descricao: string;
  data: string;   // 'YYYY-MM-DD'
  valor: number;  // número
};

@Component({
  selector: 'app-extrato',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './extrato.component.html',
  styleUrls: ['./extrato.component.css']
})
export class ExtratoComponent {
  private readonly API = 'http://localhost:5000';

  // filtros
  inicio = '';
  fim = '';

  // estado
  carregando = false;
  erro: string | null = null;

  // dados
  lancamentos: Lancamento[] = [];

  constructor(private http: HttpClient) {}

  private getUserIdOrStop(): string | null {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.erro = 'Sessão expirada ou não iniciada. Faça login novamente.';
      return null;
    }
    return userId;
  }

  // normaliza apenas por segurança (input date já gera YYYY-MM-DD)
  private toISO(d: string): string {
    if (!d) return '';
    // aceita também DD/MM/YYYY
    if (d.includes('/')) {
      const [dd, mm, yyyy] = d.split('/');
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return d; // já vem YYYY-MM-DD
  }

  buscar(): void {
    this.erro = null;
    this.lancamentos = [];

    const userId = this.getUserIdOrStop();
    if (!userId) return;

    const start = this.toISO(this.inicio);
    const end = this.toISO(this.fim);
    if (!start || !end) {
      this.erro = 'Selecione a data inicial e final.';
      return;
    }

    this.carregando = true;

    const url = `${this.API}/api/extrato?usuario_id=${encodeURIComponent(
      userId
    )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

    this.http.get<Lancamento[]>(url).subscribe({
      next: (res) => {
        // garante tipos numéricos
        this.lancamentos = (res ?? []).map((l) => ({
          ...l,
          valor: Number(l.valor ?? 0),
        }));
        this.carregando = false;
      },
      error: (e) => {
        console.error('[GET] /api/extrato erro', e);
        this.erro =
          e?.error?.error ||
          e?.error?.mensagem ||
          'Não foi possível carregar o extrato.';
        this.carregando = false;
      },
    });
  }

  totalCreditos(): number {
    return this.lancamentos
      .filter((l) => l.tipo === 'CREDITO')
      .reduce((acc, l) => acc + Number(l.valor || 0), 0);
  }

  totalDebitos(): number {
    return this.lancamentos
      .filter((l) => l.tipo === 'DEBITO')
      .reduce((acc, l) => acc + Number(l.valor || 0), 0);
  }

  saldo(): number {
    return this.totalCreditos() - this.totalDebitos();
  }
}
