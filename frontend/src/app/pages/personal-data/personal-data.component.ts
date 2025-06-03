import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './personal-data.component.html',
  styleUrls: ['./personal-data.component.css']
})
export class PersonalDataComponent implements OnInit {
  usuario: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const userId = 1; // Substitua pelo ID real (via serviço ou auth)
    this.http.get(`http://localhost:5000/perfil/${userId}`).subscribe({
      next: (res) => this.usuario = res,
      error: (err) => console.error('Erro ao carregar dados:', err)
    });
  }

  salvarDadosUsuario(): void {
    const userId = this.usuario.id;
    this.http.put(`http://localhost:5000/perfil/${userId}`, this.usuario).subscribe({
      next: () => alert('Dados salvos com sucesso!'),
      error: (err) => console.error('Erro ao salvar dados:', err)
    });
  }
}

