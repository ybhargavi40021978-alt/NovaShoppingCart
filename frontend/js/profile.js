/**
 * NovaCart - Interface #14: Profile Page JavaScript
 * Connected to Django SQLite Backend
 * Loads authenticated user profile data from database
 * Inline validation with error messages (no alert() popups)
 * Updates profile via Django backend (/api/auth/profile/ or /api/profile/)
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const profileForm = document.getElementById('profileForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const profileImage = document.getElementById('profileImage');
  const changePhotoBtn = document.getElementById('changePhotoBtn');
  const profilePhotoInput = document.getElementById('profilePhotoInput');
  const photoErrorMessage = document.getElementById('photoErrorMessage');
  const saveChangesBtn = document.getElementById('saveChangesBtn');
  const profileSuccessMessage = document.getElementById('profileSuccessMessage');

  const firstNameError = document.getElementById('firstNameError');
  const lastNameError = document.getElementById('lastNameError');
  const emailError = document.getElementById('emailError');
  const phoneError = document.getElementById('phoneError');

  // Load Profile from Backend
  async function loadProfile() {
    try {
      const res = await NovaAPI.getProfile();
      if (res.ok && res.data.profile) {
        const p = res.data.profile;
        if (firstNameInput) firstNameInput.value = p.first_name || '';
        if (lastNameInput) lastNameInput.value = p.last_name || '';
        if (emailInput) emailInput.value = p.email || '';
        if (phoneInput) phoneInput.value = p.phone || '';
        if (profileImage && p.profile_picture) {
          profileImage.src = p.profile_picture;
        }
      }
    } catch (err) {
      console.warn('Failed to load profile:', err);
    }
  }

  // Photo upload preview
  if (changePhotoBtn && profilePhotoInput) {
    changePhotoBtn.addEventListener('click', () => {
      profilePhotoInput.click();
    });

    profilePhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        if (photoErrorMessage) photoErrorMessage.textContent = '✕ Please select a JPG, PNG, or WebP image under 5MB.';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        if (photoErrorMessage) photoErrorMessage.textContent = '✕ Image size must be under 5MB.';
        return;
      }

      if (photoErrorMessage) photoErrorMessage.textContent = '';

      const reader = new FileReader();
      reader.onload = (event) => {
        if (profileImage) profileImage.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Field error helpers
  function setFieldError(input, errorEl, msg) {
    if (input) input.classList.add('invalid');
    if (errorEl) {
      errorEl.textContent = `✕ ${msg}`;
      errorEl.style.display = 'block';
    }
  }

  function clearFieldError(input, errorEl) {
    if (input) input.classList.remove('invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  // Real-time clearance
  [firstNameInput, lastNameInput, emailInput, phoneInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', () => {
        inp.classList.remove('invalid');
        const err = document.getElementById(`${inp.id}Error`);
        if (err) err.style.display = 'none';
        if (profileSuccessMessage) profileSuccessMessage.textContent = '';
      });
    }
  });

  function validateForm() {
    let isValid = true;

    const firstName = firstNameInput ? firstNameInput.value.trim() : '';
    if (!firstName) {
      setFieldError(firstNameInput, firstNameError, 'First name is required.');
      isValid = false;
    } else {
      clearFieldError(firstNameInput, firstNameError);
    }

    const email = emailInput ? emailInput.value.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setFieldError(emailInput, emailError, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearFieldError(emailInput, emailError);
    }

    const phone = phoneInput ? phoneInput.value.trim() : '';
    if (phone && !/^[\d\s+\-()]{7,}$/.test(phone)) {
      setFieldError(phoneInput, phoneError, 'Please enter a valid phone number.');
      isValid = false;
    } else {
      clearFieldError(phoneInput, phoneError);
    }

    return isValid;
  }

  // Submit Profile
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      const updatedData = {
        first_name: firstNameInput.value.trim(),
        last_name: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
      };

      if (saveChangesBtn) {
        saveChangesBtn.disabled = true;
        saveChangesBtn.textContent = 'Saving...';
      }
      if (profileSuccessMessage) profileSuccessMessage.textContent = '';

      try {
        const res = await NovaAPI.updateProfile(updatedData);

        if (saveChangesBtn) {
          saveChangesBtn.disabled = false;
          saveChangesBtn.textContent = 'Save Changes';
        }

        if (res.ok && res.data.success) {
          if (profileSuccessMessage) {
            profileSuccessMessage.textContent = '✓ Profile updated successfully.';
            profileSuccessMessage.style.color = '#20A464';
            setTimeout(() => {
              if (profileSuccessMessage) profileSuccessMessage.textContent = '';
            }, 3000);
          }
        } else {
          if (profileSuccessMessage) {
            const err = (res.data && res.data.error) ? res.data.error : 'Failed to update profile.';
            profileSuccessMessage.textContent = `✕ ${err}`;
            profileSuccessMessage.style.color = '#e11d48';
          }
        }
      } catch (err) {
        if (saveChangesBtn) {
          saveChangesBtn.disabled = false;
          saveChangesBtn.textContent = 'Save Changes';
        }
        if (profileSuccessMessage) {
          profileSuccessMessage.textContent = '✕ An error occurred while saving profile.';
          profileSuccessMessage.style.color = '#e11d48';
        }
      }
    });
  }

  await loadProfile();
});
