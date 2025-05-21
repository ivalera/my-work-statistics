import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      apiKey: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { apiKey } = this.loginForm.value;
      try {
        this.authService.login(apiKey);
        this.router.navigate(['/tasks']);
      } catch (err) {
        this.error = 'Неверный API ключ';
        console.error('Login error:', err);
      }
    }
  }
} 