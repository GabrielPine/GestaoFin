import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router'

@Component({
  selector: 'app-user-profile',
  standalone: true,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  imports: [CommonModule, FormsModule]
})
export class UserProfileComponent implements OnInit {
  nomeCompleto = ''
  dataNascimento = ''
  genero = ''
  cpf = ''
  telefone = ''
  endereco = ''
  cidade = ''
  estado = ''
  cep = ''
  rendaMensal = ''
  objetivo = ''
  userId: number = 0

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'))
    this.http.get<any>(`http://localhost:5000/perfil/${this.userId}`).subscribe({
      next: (data) => {
        this.nomeCompleto = data.nomeCompleto || ''
        this.dataNascimento = data.dataNascimento || ''
        this.genero = data.genero || ''
        this.cpf = data.cpf || ''
        this.telefone = data.telefone || ''
        this.endereco = data.endereco || ''
        this.cidade = data.cidade || ''
        this.estado = data.estado || ''
        this.cep = data.cep || ''
        this.rendaMensal = data.rendaMensal || ''
        this.objetivo = data.objetivo || ''
      },
      error: (err) => console.error('Erro ao buscar perfil:', err)
    })
  }

  salvarPerfil(): void {
    const perfilAtualizado = {
      nomeCompleto: this.nomeCompleto,
      dataNascimento: this.dataNascimento,
      genero: this.genero,
      cpf: this.cpf,
      telefone: this.telefone,
      endereco: this.endereco,
      cidade: this.cidade,
      estado: this.estado,
      cep: this.cep,
      rendaMensal: this.rendaMensal,
      objetivo: this.objetivo
    }

    this.http.put(`http://localhost:5000/perfil/${this.userId}`, perfilAtualizado).subscribe({
      next: () => {
        alert('Perfil salvo com sucesso!')
        this.router.navigate(['/dashboard'])
      },
      error: (err) => console.error('Erro ao salvar perfil:', err)
    })
  }

  formatarCPF(event: any): void {
    let valor = event.target.value.replace(/\D/g, '')
    if (valor.length > 11) valor = valor.slice(0, 11)

    valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2')

    this.cpf = valor
  }

  formatarTelefone(event: any): void {
    let valor = event.target.value.replace(/\D/g, '')
    if (valor.length > 11) valor = valor.slice(0, 11)

    if (valor.length <= 10) {
      valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else {
      valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    }

    this.telefone = valor.trim()
  }

  formatarMoeda(event: any): void {
    let valor = event.target.value.replace(/\D/g, '')
    valor = (Number(valor) / 100).toFixed(2) + ''
    valor = valor.replace('.', ',')
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    this.rendaMensal = 'R$ ' + valor
  }
}
