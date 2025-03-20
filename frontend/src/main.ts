import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app/app.component';
import { FooterComponent } from './app/pages/footer/footer.component';
import { HeaderComponent } from './app/pages/header/header.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    importProvidersFrom(FormsModule) // 🔥 Mantém só os serviços necessários
  ]
}).catch(err => console.error(err));

