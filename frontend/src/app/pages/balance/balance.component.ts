import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-balance',
  imports: [RouterModule],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.css'
})
export class BalanceComponent {
  saldoTotal = 2650.00;
  ultimaAtualizacao = '10/05/2025';
}
