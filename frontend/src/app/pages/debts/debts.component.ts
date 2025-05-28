import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; 


@Component({
  selector: 'app-debts',
  imports: [RouterModule],
  templateUrl: './debts.component.html',
  styleUrl: './debts.component.css'
})
export class DebtsComponent {
  debitos = [
    { descricao: 'Cartão de Crédito', valor: 1200.00, vencimento: '15/05/2025' },
    { descricao: 'Financiamento Carro', valor: 850.00, vencimento: '20/05/2025' }
  ];
}
