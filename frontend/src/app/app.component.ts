import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './pages/footer/footer.component';
import { HeaderComponent } from "./pages/header/header.component";
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true, // ✅ ESSENCIAL PARA PROJETOS STANDALONE
  imports: [RouterOutlet, FooterComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // ✅ CORRIGIDO (Array e nome correto)
})
export class AppComponent {
  title = 'frontend';
}
