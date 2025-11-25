import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, Router } from '@angular/router'
import { HttpClient, HttpClientModule } from '@angular/common/http'

interface Usuario {
  id?: number
  nomeCompleto?: string
  dataNascimento?: string
  genero?: string
  cpf?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  rendaMensal?: string
  objetivo?: string
  username?: string
  email?: string
}

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './personal-data.component.html',
  styleUrls: ['./personal-data.component.css']
})
export class PersonalDataComponent implements OnInit {
  usuario: Usuario = {
    nomeCompleto: '',
    dataNascimento: '',
    genero: '',
    cpf: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    rendaMensal: '',
    objetivo: '',
    username: '',
    email: ''
  }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('userId')) || 1

    this.http.get<Usuario>(`http://localhost:5000/perfil/${userId}`).subscribe({
      next: (res) => {
        this.usuario = {
          ...res,
          rendaMensal: res.rendaMensal
            ? parseFloat(res.rendaMensal as any).toFixed(2).replace('.', ',')
            : ''
        }
      },
      error: (err) => console.error('Erro ao carregar dados:', err)
    })
  }

  salvarDadosUsuario(): void {
    const userId = this.usuario.id
    const payload = {
      ...this.usuario,
      rendaMensal: parseFloat((this.usuario.rendaMensal || '0').replace(',', '.'))
    }

    this.http.put(`http://localhost:5000/perfil/${userId}`, payload).subscribe({
      next: () => alert('Dados salvos com sucesso!'),
      error: (err) => console.error('Erro ao salvar dados:', err)
    })
  }

  // método chamado pelo botão "Sair" no menu lateral
  logout(): void {
    localStorage.removeItem('userId')
    localStorage.removeItem('token') // se usar JWT
    // ou: localStorage.clear()
    this.router.navigate(['/login'])
  }
}
