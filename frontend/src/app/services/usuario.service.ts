import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:4200/perfil'; // ajuste se sua API estiver em outro endereço

  constructor(private http: HttpClient) {}

  obterPerfil(usuarioId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${usuarioId}`);
  }
}
