import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000'; // ✅ Certifique-se de que o back-end Flask está rodando nesta porta!

  constructor(private http: HttpClient) {}

  //Login do usuário
  login(email: string, senha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, senha });
  }

  //Registro de novo usuário
  register(username: string, email: string, senha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrar`, { username, email, senha });
  }

  //Solicitação de redefinição de senha
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email });
  }

  //Redefinição da senha com token
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/${token}`, { password });
  }
}
