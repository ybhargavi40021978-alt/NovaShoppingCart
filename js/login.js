/**
 * NovaCart - Login Page JavaScript (Interface #7)
 * Connected to Django SQLite Backend
 * Real-time inline validation: Username/Email, Password
 * Submits to /api/auth/login/ (or /api/login/)
 * Clean inline error feedback ("Invalid username or password.")
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const passwordToggleBtn = document.getElementById('passwordToggleBtn');
  const emailErrorMsg = document.getElementById('emailErrorMsg');
  const passwordErrorMsg = document.getElementById('passwordErrorMsg');
  const loginAlertBox = document.getElementById('loginAlertBox');
  const loginAlertText = document.getElementById('loginAlertText');

  // Password Visibility Toggle
  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      passwordToggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  // Pre-fill remembered user
  const savedUser = localStorage.getItem('novacart_remembered_email');
  if (savedUser && emailInput) {
    emailInput.value = savedUser;
    if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
  }

  // Real-time error clearing
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailInput.classList.remove('has-error');
      if (emailErrorMsg) {
        emailErrorMsg.textContent = '';
        emailErrorMsg.classList.remove('visible');
      }
      hideAlert();
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      passwordInput.classList.remove('has-error');
      if (passwordErrorMsg) {
        passwordErrorMsg.textContent = '';
        passwordErrorMsg.classList.remove('visible');
      }
      hideAlert();
    });
  }

  function showAlert(message, type = 'danger') {
    if (!loginAlertBox || !loginAlertText) return;
    loginAlertBox.className = `login-alert-box ${type}`;
    loginAlertBox.style.display = 'flex';
    loginAlertText.textContent = message;
  }

  function hideAlert() {
    if (loginAlertBox) {
      loginAlertBox.className = 'login-alert-box';
      loginAlertBox.style.display = 'none';
    }
  }

  // Form Validation
  function validateForm() {
    let isValid = true;
    const userVal = emailInput.value.trim();
    const passwordVal = passwordInput.value;

    if (!userVal) {
      emailInput.classList.add('has-error');
      if (emailErrorMsg) {
        emailErrorMsg.textContent = '✕ Username or email is required';
        emailErrorMsg.classList.add('visible');
      }
      isValid = false;
    } else {
      emailInput.classList.remove('has-error');
      if (emailErrorMsg) {
        emailErrorMsg.textContent = '';
        emailErrorMsg.classList.remove('visible');
      }
    }

    if (!passwordVal) {
      passwordInput.classList.add('has-error');
      if (passwordErrorMsg) {
        passwordErrorMsg.textContent = '✕ Password is required';
        passwordErrorMsg.classList.add('visible');
      }
      isValid = false;
    } else {
      passwordInput.classList.remove('has-error');
      if (passwordErrorMsg) {
        passwordErrorMsg.textContent = '';
        passwordErrorMsg.classList.remove('visible');
      }
    }

    return isValid;
  }

  // Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      if (!validateForm()) {
        return;
      }

      const usernameOrEmail = emailInput.value.trim();
      const password = passwordInput.value;
      const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

      // Loading state
      if (btnLoginSubmit) {
        btnLoginSubmit.disabled = true;
        btnLoginSubmit.textContent = 'Signing in...';
      }

      try {
        const res = await NovaAPI.login({
          username: usernameOrEmail,
          email: usernameOrEmail,
          password: password
        });

        if (res.ok && res.data.success) {
          showAlert("✓ Login successful. Redirecting...", "success");

          if (rememberMe) {
            localStorage.setItem('novacart_remembered_email', usernameOrEmail);
          } else {
            localStorage.removeItem('novacart_remembered_email');
          }

          if (res.data.user) {
            localStorage.setItem('novacart_user', JSON.stringify(res.data.user));
          }

          setTimeout(() => {
            window.location.href = 'index.html';
          }, 600);
        } else {
          const errMsg = (res.data && res.data.error) ? res.data.error : 'Invalid username or password.';
          showAlert(`✕ ${errMsg}`, "danger");
          if (btnLoginSubmit) {
            btnLoginSubmit.disabled = false;
            btnLoginSubmit.textContent = 'Login';
          }
        }
      } catch (err) {
        showAlert("✕ Invalid username or password.", "danger");
        if (btnLoginSubmit) {
          btnLoginSubmit.disabled = false;
          btnLoginSubmit.textContent = 'Login';
        }
      }
    });
  }
});
