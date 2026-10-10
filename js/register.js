/**
 * NovaCart - Registration Page JavaScript (Interface #8)
 * Connected to Django SQLite Backend
 * Real-time inline validation: Name/Username, Email, Password (8+ chars), Confirm Password
 * Submits to /api/auth/register/ (or /api/register/)
 * Seamless redirect to login.html on successful registration
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const registerForm = document.getElementById('registerForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsCheckbox = document.getElementById('termsAgree');
  const btnRegisterSubmit = document.getElementById('btnRegisterSubmit');

  const passwordToggleBtn = document.getElementById('passwordToggleBtn');
  const confirmPasswordToggleBtn = document.getElementById('confirmPasswordToggleBtn');

  const firstNameErrorMsg = document.getElementById('firstNameErrorMsg');
  const lastNameErrorMsg = document.getElementById('lastNameErrorMsg');
  const emailErrorMsg = document.getElementById('emailErrorMsg');
  const passwordErrorMsg = document.getElementById('passwordErrorMsg');
  const confirmPasswordErrorMsg = document.getElementById('confirmPasswordErrorMsg');
  const termsErrorMsg = document.getElementById('termsErrorMsg');

  const reqLength = document.getElementById('reqLength');
  const reqUppercase = document.getElementById('reqUppercase');
  const reqLowercase = document.getElementById('reqLowercase');
  const reqNumber = document.getElementById('reqNumber');

  const registerAlertBox = document.getElementById('registerAlertBox');
  const registerAlertText = document.getElementById('registerAlertText');

  // Password Visibility Toggles
  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    });
  }

  if (confirmPasswordToggleBtn && confirmPasswordInput) {
    confirmPasswordToggleBtn.addEventListener('click', () => {
      const isPassword = confirmPasswordInput.getAttribute('type') === 'password';
      confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
    });
  }

  function showAlert(message, type = 'danger') {
    if (!registerAlertBox || !registerAlertText) return;
    registerAlertBox.className = `register-alert-box ${type}`;
    registerAlertBox.style.display = 'flex';
    registerAlertText.textContent = message;
  }

  function hideAlert() {
    if (registerAlertBox) {
      registerAlertBox.className = 'register-alert-box';
      registerAlertBox.style.display = 'none';
    }
  }

  // Real-time password requirement checklist
  function checkPasswordRequirements(pass) {
    const hasLen = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);

    updateReqItem(reqLength, hasLen, 'At least 8 characters');
    updateReqItem(reqUppercase, hasUpper, 'One uppercase letter');
    updateReqItem(reqLowercase, hasLower, 'One lowercase letter');
    updateReqItem(reqNumber, hasNum, 'One number');

    return hasLen;
  }

  function updateReqItem(element, met, text) {
    if (!element) return;
    if (met) {
      element.classList.add('valid');
      element.innerHTML = `<span style="color:#20A464; font-weight:700;">✓</span> <span>${text}</span>`;
    } else {
      element.classList.remove('valid');
      element.innerHTML = `<span style="color:#64748b;">•</span> <span>${text}</span>`;
    }
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      checkPasswordRequirements(passwordInput.value);
      if (passwordErrorMsg) {
        passwordErrorMsg.textContent = '';
        passwordErrorMsg.classList.remove('visible');
      }
      passwordInput.classList.remove('has-error');
      hideAlert();
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      if (confirmPasswordErrorMsg) {
        confirmPasswordErrorMsg.textContent = '';
        confirmPasswordErrorMsg.classList.remove('visible');
      }
      confirmPasswordInput.classList.remove('has-error');
      hideAlert();
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      if (emailErrorMsg) {
        emailErrorMsg.textContent = '';
        emailErrorMsg.classList.remove('visible');
      }
      emailInput.classList.remove('has-error');
      hideAlert();
    });
  }

  if (firstNameInput) {
    firstNameInput.addEventListener('input', () => {
      if (firstNameErrorMsg) {
        firstNameErrorMsg.textContent = '';
        firstNameErrorMsg.classList.remove('visible');
      }
      firstNameInput.classList.remove('has-error');
    });
  }

  if (lastNameInput) {
    lastNameInput.addEventListener('input', () => {
      if (lastNameErrorMsg) {
        lastNameErrorMsg.textContent = '';
        lastNameErrorMsg.classList.remove('visible');
      }
      lastNameInput.classList.remove('has-error');
    });
  }

  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', () => {
      if (termsCheckbox.checked && termsErrorMsg) {
        termsErrorMsg.textContent = '';
        termsErrorMsg.classList.remove('visible');
      }
    });
  }

  // Form Validation
  function validateForm() {
    let isValid = true;

    const firstName = firstNameInput ? firstNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    if (!firstName) {
      if (firstNameErrorMsg) {
        firstNameErrorMsg.textContent = '✕ First name is required';
        firstNameErrorMsg.classList.add('visible');
      }
      if (firstNameInput) firstNameInput.classList.add('has-error');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      if (emailErrorMsg) {
        emailErrorMsg.textContent = '✕ Email is required';
        emailErrorMsg.classList.add('visible');
      }
      if (emailInput) emailInput.classList.add('has-error');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      if (emailErrorMsg) {
        emailErrorMsg.textContent = '✕ Enter a valid email';
        emailErrorMsg.classList.add('visible');
      }
      if (emailInput) emailInput.classList.add('has-error');
      isValid = false;
    }

    if (!password) {
      if (passwordErrorMsg) {
        passwordErrorMsg.textContent = '✕ Password is required';
        passwordErrorMsg.classList.add('visible');
      }
      if (passwordInput) passwordInput.classList.add('has-error');
      isValid = false;
    } else if (password.length < 8) {
      if (passwordErrorMsg) {
        passwordErrorMsg.textContent = '✕ Password must contain at least 8 characters';
        passwordErrorMsg.classList.add('visible');
      }
      if (passwordInput) passwordInput.classList.add('has-error');
      isValid = false;
    }

    if (!confirmPassword) {
      if (confirmPasswordErrorMsg) {
        confirmPasswordErrorMsg.textContent = '✕ Confirm password is required';
        confirmPasswordErrorMsg.classList.add('visible');
      }
      if (confirmPasswordInput) confirmPasswordInput.classList.add('has-error');
      isValid = false;
    } else if (password !== confirmPassword) {
      if (confirmPasswordErrorMsg) {
        confirmPasswordErrorMsg.textContent = '✕ Passwords do not match';
        confirmPasswordErrorMsg.classList.add('visible');
      }
      if (confirmPasswordInput) confirmPasswordInput.classList.add('has-error');
      isValid = false;
    }

    if (termsCheckbox && !termsCheckbox.checked) {
      if (termsErrorMsg) {
        termsErrorMsg.textContent = '✕ Please accept the Terms & Conditions';
        termsErrorMsg.classList.add('visible');
      }
      isValid = false;
    }

    return isValid;
  }

  // Form Submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      if (!validateForm()) {
        return;
      }

      const firstName = firstNameInput ? firstNameInput.value.trim() : '';
      const lastName = lastNameInput ? lastNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

      // Derive username from email or name
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');

      if (btnRegisterSubmit) {
        btnRegisterSubmit.disabled = true;
        btnRegisterSubmit.textContent = 'Creating Account...';
      }

      try {
        const res = await NovaAPI.register({
          username: username,
          email: email,
          password: password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim() || username
        });

        if (res.ok && res.data.success) {
          showAlert("✓ Account created successfully! Redirecting to login...", "success");

          setTimeout(() => {
            window.location.href = 'login.html';
          }, 800);
        } else {
          const errMsg = (res.data && res.data.error) ? res.data.error : 'Registration failed. Please check your details.';
          showAlert(`✕ ${errMsg}`, "danger");

          if (errMsg.toLowerCase().includes('email')) {
            if (emailErrorMsg) {
              emailErrorMsg.textContent = `✕ ${errMsg}`;
              emailErrorMsg.classList.add('visible');
            }
          } else if (errMsg.toLowerCase().includes('username')) {
            if (firstNameErrorMsg) {
              firstNameErrorMsg.textContent = `✕ ${errMsg}`;
              firstNameErrorMsg.classList.add('visible');
            }
          }

          if (btnRegisterSubmit) {
            btnRegisterSubmit.disabled = false;
            btnRegisterSubmit.textContent = 'Create Account';
          }
        }
      } catch (err) {
        showAlert("✕ Unable to create account. Please try again.", "danger");
        if (btnRegisterSubmit) {
          btnRegisterSubmit.disabled = false;
          btnRegisterSubmit.textContent = 'Create Account';
        }
      }
    });
  }
});
