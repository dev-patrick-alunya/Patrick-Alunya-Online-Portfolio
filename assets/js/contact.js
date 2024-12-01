// Contact Form Handler
class ContactFormHandler {
  constructor() {
    this.form = document.getElementById('contactForm');
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.loadingDiv = this.form.querySelector('.loading');
    this.errorDiv = this.form.querySelector('.error-message');
    this.successDiv = this.form.querySelector('.sent-message');
    
    // Bind event listeners
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  // Show/hide loading state
  setLoadingState(isLoading) {
    this.submitButton.disabled = isLoading;
    this.loadingDiv.classList.toggle('d-none', !isLoading);
    this.errorDiv.style.display = 'none';
    this.successDiv.style.display = 'none';
  }

  // Show success message
  showSuccess(message = 'Your message has been sent. Thank you!') {
    // Show success message in the form
    this.successDiv.textContent = message;
    this.successDiv.style.display = 'block';
    this.form.reset();
    
    // Show alert
    alert('Message sent successfully! Thank you for contacting me.');
    
    // Scroll message into view
    this.successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      this.successDiv.style.display = 'none';
    }, 5000);
  }

  // Show error message with specific formatting
  showError(message, type = 'error') {
    let errorIcon, errorTitle, errorDetails;
    
    switch(type) {
      case 'network':
        errorIcon = '🌐';
        errorTitle = 'Network Error';
        errorDetails = 'Unable to connect to server. Please check your internet connection.';
        break;
      case 'server':
        errorIcon = '⚠️';
        errorTitle = 'Server Error';
        errorDetails = 'The server encountered an error. Please try again later.';
        break;
      case 'validation':
        errorIcon = '❌';
        errorTitle = 'Validation Error';
        errorDetails = message;
        break;
      default:
        errorIcon = '❗';
        errorTitle = 'Error';
        errorDetails = message;
    }

    // Format error message with HTML
    this.errorDiv.innerHTML = `
      <div class="error-content">
        <div class="error-icon">${errorIcon}</div>
        <div class="error-title">${errorTitle}</div>
        <div class="error-details">${errorDetails}</div>
        ${message ? `<div class="error-message">${message}</div>` : ''}
      </div>
    `;
    
    this.errorDiv.className = `error-message error-${type}`;
    this.errorDiv.style.display = 'block';
    
    // Scroll error into view
    this.errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add CSS for error styling
    const style = document.createElement('style');
    style.textContent = `
      .error-content {
        padding: 10px;
      }
      .error-icon {
        font-size: 24px;
        margin-bottom: 5px;
      }
      .error-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .error-details {
        margin-bottom: 5px;
      }
      .error-message {
        font-size: 14px;
        opacity: 0.9;
      }
      .error-network { background: #f39c12; }
      .error-server { background: #c0392b; }
      .error-validation { background: #e74c3c; }
    `;
    document.head.appendChild(style);
  }

  // Collect and validate form data
  getFormData() {
    const formData = {
      name: this.form.name.value.trim(),
      email: this.form.email.value.trim(),
      subject: this.form.subject.value.trim(),
      message: this.form.message.value.trim()
    };

    const errors = this.validateForm(formData);
    if (errors.length > 0) {
      throw new Error('validation:' + errors.join('<br>'));
    }

    return formData;
  }

  // Validate form data
  validateForm(data) {
    const errors = [];
    
    if (!data.name) {
      errors.push('Name is required');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!data.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!data.subject) {
      errors.push('Subject is required');
    } else if (data.subject.length < 5) {
      errors.push('Subject must be at least 5 characters');
    }

    if (!data.message) {
      errors.push('Message is required');
    } else if (data.message.length < 10) {
      errors.push('Message must be at least 10 characters');
    }

    return errors;
  }

  // Email validation helper
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Send message to backend
  async sendMessage(data) {
    try {
      const response = await fetch("https://portfoliomessagesapi-k6y3sqwv.b4a.run/api/contact", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        switch(response.status) {
          case 400:
            throw new Error('validation:' + errorData.message);
          case 429:
            throw new Error('server:Rate limit exceeded. Please try again later.');
          case 500:
            throw new Error('server:' + (errorData.message || 'Internal server error'));
          default:
            throw new Error('server:An unexpected error occurred');
        }
      }

      return await response.json();
    } catch (error) {
      if (!window.navigator.onLine) {
        throw new Error('network:Please check your internet connection');
      }
      if (error.name === 'TypeError') {
        throw new Error('network:Unable to connect to server');
      }
      throw error;
    }
  }

  // Handle form submission
  async handleSubmit(event) {
    event.preventDefault();
    
    try {
      this.setLoadingState(true);
      const formData = this.getFormData();
      const response = await this.sendMessage(formData);
      this.showSuccess(response.message);
    } catch (error) {
      const [type, message] = error.message.split(':');
      if (['network', 'server', 'validation'].includes(type)) {
        this.showError(message, type);
      } else {
        this.showError(error.message);
      }
    } finally {
      this.setLoadingState(false);
    }
  }
}

// Initialize contact form handler
document.addEventListener('DOMContentLoaded', () => {
  new ContactFormHandler();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContactFormHandler;
} 