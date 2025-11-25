import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type Conta = { id: number; descricao: string; valor: number; data: string };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly API = 'http://localhost:5000';

  // usuário
  userName = 'Usuário';
  rendaMensal: number | null = null;

  // totais gerais
  totalDebitos = 0;
  totalReceitas = 0;
  saldoTotal = 0;

  // metas (reserva de emergência)
  emergenciaAlvo = 0;         // 6 x renda
  emergenciaGuardado = 0;     // aproxima saldo >= 0
  emergenciaPct = 0;          // 0..100

  // visão rápida dívidas do mês
  debitosMes = 0;
  receitasMes = 0;
  saldoMes = 0;
  barraDividasPct = 0;        // 0..100
  dividasQuitadasMes = false; // true = entradas do mês >= saídas do mês

  // estado
  hoje = new Date();
  carregando = false;
  erro: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.erro = 'Sessão expirada ou não iniciada. Faça login novamente.';
      // opcional: já redirecionar
      // this.router.navigate(['/login']);
      return;
    }

    this.carregando = true;

    // 1) Perfil (nome/renda)
    this.http.get<any>(`${this.API}/perfil/${userId}`).subscribe({
      next: (perfil) => {
        this.userName = perfil?.nomeCompleto || perfil?.username || 'Usuário';
        this.rendaMensal = perfil?.rendaMensal != null ? Number(perfil.rendaMensal) : null;
        if (this.rendaMensal && !isNaN(this.rendaMensal)) {
          this.emergenciaAlvo = this.rendaMensal * 6;
        }
      },
      error: () => { /* segue sem travar */ }
    });

    const ymAtual = this.toYM(this.hoje);

    // 2) Débitos
    this.http.get<Conta[]>(`${this.API}/contas/${userId}`).subscribe({
      next: (debitos) => {
        const list = (debitos ?? []).map(d => ({ ...d, valor: Number(d.valor || 0) }));
        this.totalDebitos = list.reduce((s, x) => s + x.valor, 0);

        // débitos do mês atual
        this.debitosMes = list
          .filter(d => this.extractYM(d.data) === ymAtual)
          .reduce((s, x) => s + x.valor, 0);

        this.recalcularSaldoEMetas();
      },
      error: () => {
        this.erro = this.erro ?? 'Não foi possível carregar os débitos.';
        this.carregando = false;
      }
    });

    // 3) Receitas
    this.http.get<Conta[]>(`${this.API}/receber/${userId}`).subscribe({
      next: (receitas) => {
        const list = (receitas ?? []).map(r => ({ ...r, valor: Number(r.valor || 0) }));
        this.totalReceitas = list.reduce((s, x) => s + x.valor, 0);

        // receitas do mês atual
        this.receitasMes = list
          .filter(r => this.extractYM(r.data) === ymAtual)
          .reduce((s, x) => s + x.valor, 0);

        this.recalcularSaldoEMetas();
      },
      error: () => {
        this.erro = this.erro ?? 'Não foi possível carregar as receitas.';
        this.carregando = false;
      }
    });
  }

  // método chamado pelo botão "Sair" do menu
  logout(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('token'); // ajuste se o nome da chave for outro
    // ou: localStorage.clear();
    this.router.navigate(['/login']);
  }

  private recalcularSaldoEMetas(): void {
    // saldo geral
    this.saldoTotal = this.totalReceitas - this.totalDebitos;

    // reserva de emergência (aproximação: considera saldo >= 0 como guardado)
    this.emergenciaGuardado = Math.max(0, this.saldoTotal);
    if (this.emergenciaAlvo > 0) {
      this.emergenciaPct = Math.min(
        100,
        (this.emergenciaGuardado / this.emergenciaAlvo) * 100
      );
    } else {
      this.emergenciaPct = 0;
    }

    // saldo do mês e status das dívidas do mês
    this.saldoMes = this.receitasMes - this.debitosMes;
    this.dividasQuitadasMes = this.saldoMes >= 0;

    // barra: apenas indicador visual (pode manter 100% se houver débitos)
    this.barraDividasPct = this.debitosMes > 0 ? 100 : 0;

    this.carregando = false;
  }

  // helpers de datas
  private toYM(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private extractYM(s: string): string {
    // aceita 'YYYY-MM-DD' ou 'DD/MM/YYYY'
    if (!s) return '';
    if (s.includes('/')) {
      const [dd, mm, yyyy] = s.split('/');
      return `${yyyy}-${mm.padStart(2, '0')}`;
    }
    return s.slice(0, 7); // ISO
  }
}
