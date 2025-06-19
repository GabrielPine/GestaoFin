import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doubts',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './doubts.component.html',
  styleUrl: './doubts.component.css'
})
export class DoubtsComponent {
activeIndex: number | null = null;

  duvidas = [
    {
      pergunta: 'Como faço meus lançamentos?',
      resposta: `Na tela inicial, acesse o menu lateral à esquerda e clique em “Início”.
Você verá dois campos disponíveis para lançamentos: Receitas e Despesas.
Preencha os campos com a descrição, valor e data, depois clique em “Salvar” para registrar o lançamento.`
    },
    {
      pergunta: 'Como visualizo meus débitos?',
      resposta: `Na tela inicial, vá até o menu lateral à esquerda e clique em “Débitos”.
Nesta seção, você poderá visualizar todos os seus débitos de forma detalhada, além de acompanhar a estatística mensal dos seus gastos.`
    },
    {
      pergunta: 'Como visualizo meu saldo?',
      resposta: `Acesse o menu lateral à esquerda na tela inicial e clique em “Saldo”.
Aqui, você encontrará o valor atualizado do seu saldo, além de gráficos e estatísticas mensais para facilitar o controle financeiro.`
    },
    {
      pergunta: 'Como altero meus dados cadastrais?',
      resposta: `Na tela inicial, clique no menu lateral à esquerda e selecione “Dados Pessoais”.
Nesta área, você pode visualizar e atualizar suas informações cadastrais de forma rápida e segura.`
    },
    {
      pergunta: 'Meus dados estão seguros?',
      resposta: `Sim. Seus dados estão protegidos conforme as diretrizes da Lei Geral de Proteção de Dados (LGPD).
A plataforma adota medidas de segurança para garantir a confidencialidade e integridade das suas informações.`
    },
    {
    pergunta: 'Consigo acessar de outro dispositivo?',
    resposta: 'Sim. Sua conta pode ser acessada de qualquer dispositivo com conexão à internet, basta entrar com seu e-mail e senha cadastrados.'
  },
  {
    pergunta: 'Esqueci minha senha. E agora?',
    resposta: 'Na tela de login, clique em “Esqueci minha senha”. Você receberá um e-mail com instruções para redefinir sua senha de forma segura.'
  }
  ];

  toggleCard(index: number) {
    this.activeIndex = this.activeIndex === index ? null : index;
  }
}
