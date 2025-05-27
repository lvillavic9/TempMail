/**
 * TempMail Pro - Correos Temporales
 * Pedir siempre el alias al cargar/refrescar
 * Fondo y botón principal #0b626a
 * Desarrollado por @lvillavic9
 */

class TempMailApp {
    constructor() {
        this.API_KEY = 'e769cbfe-db59-4af7-97d3-74703239d385';
        this.NAMESPACE = 'wjlcs';
        this.BASE_URL = 'https://api.testmail.app/api/json';

        this.currentTag = null;
        this.currentEmail = null;
        this.refreshInterval = null;
        this.emails = [];

        this.elements = {
            tagInput: document.getElementById('tagInput'),
            generateBtn: document.getElementById('generateBtn'),
            tagError: document.getElementById('tagError'),
            emailSection: document.getElementById('emailSection'),
            generatedEmail: document.getElementById('generatedEmail'),
            copyBtn: document.getElementById('copyBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            refreshInterval: document.getElementById('refreshInterval'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            inboxSection: document.getElementById('inboxSection'),
            emailList: document.getElementById('emailList'),
            deleteAllBtn: document.getElementById('deleteAllBtn'),
            emailModal: document.getElementById('emailModal'),
            closeModal: document.getElementById('closeModal'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            toastContainer: document.getElementById('toastContainer')
        };

        this.initializeEventListeners();
        this.reset(); // Siempre pide el alias al cargar
    }

    initializeEventListeners() {
        this.elements.generateBtn.addEventListener('click', () => this.generateEmail());
        this.elements.tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateEmail();
        });
        this.elements.tagInput.addEventListener('input', () => this.validateTag());
        this.elements.copyBtn.addEventListener('click', () => this.copyEmail());
        this.elements.refreshBtn.addEventListener('click', () => this.fetchEmails());
        this.elements.refreshInterval.addEventListener('change', () => this.updateRefreshInterval());

        // Nuevo: Botón Aleatorio
        this.elements.randomBtn.addEventListener('click', () => this.generateRandomAlias());

        // Nuevo: Botón Nuevo y Eliminar (los dos resetean la app)
        this.elements.newBtn.addEventListener('click', () => this.reset());
        this.elements.deleteBtn.addEventListener('click', () => this.reset());

        this.elements.closeModal.addEventListener('click', () => this.closeModal());
        this.elements.emailModal.addEventListener('click', (e) => {
            if (e.target === this.elements.emailModal) this.closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    validateTag() {
        const tag = this.elements.tagInput.value.trim();
        const regex = /^[a-zA-Z0-9._-]+$/;
        this.clearError();
        if (!tag) return false;
        if (tag.length > 30) {
            this.showError('El alias no puede exceder 30 caracteres');
            return false;
        }
        if (!regex.test(tag)) {
            this.showError('Solo se permiten letras, números, puntos, guiones y guiones bajos');
            return false;
        }
        if (tag.startsWith('.') || tag.endsWith('.') || tag.includes('..')) {
            this.showError('Los puntos no pueden estar al inicio, final o ser consecutivos');
            return false;
        }
        return true;
    }

    async generateEmail() {
        const tag = this.elements.tagInput.value.trim();
        if (!this.validateTag()) {
            this.elements.tagInput.focus();
            return;
        }
        this.showLoading(true);
        try {
            this.currentTag = tag;
            this.currentEmail = `${this.NAMESPACE}.${tag}@inbox.testmail.app`;
            this.elements.generatedEmail.textContent = this.currentEmail;
            this.elements.emailSection.classList.remove('hidden');
            this.elements.inboxSection.classList.remove('hidden');
            this.emails = [];
            this.renderEmails();
            this.startRefreshInterval();
            await this.fetchEmails();
            this.showToast('¡Email temporal generado exitosamente!', 'success');

        setTimeout(() => {
    // 1. Forzar scroll en todo el documento (html/body)
    const emailSection = this.elements.emailSection;
    // Intenta scrollIntoView en el documento principal
    if (typeof emailSection.scrollIntoView === "function") {
        emailSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // 2. Como refuerzo, para navegadores de escritorio, usar window.scrollTo
    const rect = emailSection.getBoundingClientRect();
    window.scrollTo({
        top: window.scrollY + rect.top - 24, // 24px de margen visual arriba
        behavior: "smooth"
    });
}, 150);
            
        } catch (error) {
            this.showToast('Error al generar el email temporal', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async copyEmail() {
        if (!this.currentEmail) return;
        try {
            await navigator.clipboard.writeText(this.currentEmail);
            this.showToast('Email copiado al portapapeles', 'success');
            this.elements.copyBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.elements.copyBtn.style.transform = '';
            }, 150);
        } catch (error) {
            this.showToast('Error al copiar el email', 'error');
            this.fallbackCopyEmail();
        }
    }

    fallbackCopyEmail() {
        const textArea = document.createElement('textarea');
        textArea.value = this.currentEmail;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast('Email copiado al portapapeles', 'success');
        } catch (error) {
            this.showToast('No se pudo copiar el email', 'error');
        }
        document.body.removeChild(textArea);
    }

    async fetchEmails() {
        if (!this.currentTag) return;
        try {
            this.updateStatus('Buscando correos...', false);
            const response = await fetch(
              `https://api.testmail.app/api/json?apikey=${this.API_KEY}&namespace=${this.NAMESPACE}&tag=${this.currentTag}`
            );
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.emails = data.emails || [];
            this.renderEmails();
            if (this.emails.length) {
                this.updateStatus(`Activo - ${this.emails.length} correo(s) recibido(s)`, true);
            } else {
                this.updateStatus('Activo - Esperando correos...', true);
            }
        } catch (error) {
            this.updateStatus('Error al conectar con el servidor', false);
            this.showToast('Error al buscar correos', 'error');
        }
    }

    renderEmails() {
        if (this.emails.length === 0) {
            this.elements.emailList.innerHTML = `
                <div class="no-emails">
                    <i class="fas fa-inbox"></i>
                    <p>No hay correos recibidos aún</p>
                    <small>Los nuevos mensajes aparecerán aquí automáticamente</small>
                </div>
            `;
            return;
        }
        this.elements.emailList.innerHTML = this.emails.map(email => `
            <div class="email-item" onclick="tempMailApp.openEmailModal('${email.id}')">
                <div class="email-header">
                    <div class="email-subject">${this.escapeHtml(email.subject || 'Sin asunto')}</div>
                    <div class="email-date">${this.formatDate(email.timestamp)}</div>
                </div>
                <div class="email-from">De: ${this.escapeHtml(email.from || 'Desconocido')}</div>
                <div class="email-preview">${this.getEmailPreview(email)}</div>
            </div>
        `).join('');
    }

    openEmailModal(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (!email) return;
        document.getElementById('modalSubject').textContent = email.subject || 'Sin asunto';
        document.getElementById('modalFrom').textContent = email.from || 'Desconocido';
        document.getElementById('modalTo').textContent = email.to || this.currentEmail;
        document.getElementById('modalDate').textContent = this.formatDate(email.timestamp, true);
        const contentDiv = document.getElementById('modalContent');
        if (email.html) {
            const iframe = document.createElement('iframe');
            iframe.srcdoc = email.html;
            iframe.style.width = '100%';
            iframe.style.minHeight = '400px';
            iframe.style.border = '1px solid var(--gray-200)';
            iframe.style.borderRadius = 'var(--radius)';
            contentDiv.innerHTML = '';
            contentDiv.appendChild(iframe);
        } else if (email.text) {
            contentDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${this.escapeHtml(email.text)}</pre>`;
        } else {
            contentDiv.innerHTML = '<p style="color: var(--gray-500); font-style: italic;">Este email no tiene contenido.</p>';
        }
        this.elements.emailModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.elements.emailModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    async deleteAllEmails() {
        if (!this.currentTag || this.emails.length === 0) return;
        if (!confirm('¿Estás seguro de que quieres eliminar todos los correos?')) return;
        this.showLoading(true);
        try {
            const response = await fetch(
                `${this.BASE_URL}?apikey=${this.API_KEY}&namespace=${this.NAMESPACE}&tag=${this.currentTag}&action=delete`
            );
            if (response.ok) {
                this.emails = [];
                this.renderEmails();
                this.showToast('Todos los correos han sido eliminados', 'success');
            } else {
                throw new Error('Error al eliminar correos');
            }
        } catch (error) {
            this.showToast('Error al eliminar los correos', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateRefreshInterval() {
        const interval = parseInt(this.elements.refreshInterval.value);
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        if (this.currentTag) {
            this.refreshInterval = setInterval(() => this.fetchEmails(), interval);
        }
    }

    startRefreshInterval() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        const interval = parseInt(this.elements.refreshInterval.value);
        this.refreshInterval = setInterval(() => this.fetchEmails(), interval);
    }

    updateStatus(text, isActive) {
        this.elements.statusText.textContent = text;
        if (isActive) {
            this.elements.statusDot.classList.add('active');
        } else {
            this.elements.statusDot.classList.remove('active');
        }
    }

    showLoading(show) {
        if (show) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    showError(message) {
        this.elements.tagError.textContent = message;
        this.elements.tagInput.style.borderColor = 'var(--danger-color)';
    }

    clearError() {
        this.elements.tagError.textContent = '';
        this.elements.tagInput.style.borderColor = '';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                     type === 'error' ? 'fas fa-exclamation-circle' : 
                     'fas fa-info-circle';
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        this.elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    }

    getEmailPreview(email) {
        let preview = '';
        if (email.text) {
            preview = email.text.replace(/\s+/g, ' ').trim();
        } else if (email.html) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = email.html;
            preview = tempDiv.textContent || tempDiv.innerText || '';
            preview = preview.replace(/\s+/g, ' ').trim();
        }
        if (preview.length > 120) {
            preview = preview.substring(0, 120) + '...';
        }
        return this.escapeHtml(preview) || '<em>Sin contenido de vista previa</em>';
    }

    formatDate(timestamp, detailed = false) {
        if (!timestamp) return 'Fecha desconocida';
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (detailed) {
            return date.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        if (diffDays === 0) {
            return date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // ¡Ahora reset no usa localStorage!
    reset() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.currentTag = null;
        this.currentEmail = null;
        this.emails = [];
        this.elements.tagInput.value = '';
        this.elements.emailSection.classList.add('hidden');
        this.elements.inboxSection.classList.add('hidden');
        this.closeModal();
        this.clearError();
    }
}

let tempMailApp;
document.addEventListener('DOMContentLoaded', () => {
    tempMailApp = new TempMailApp();
    window.tempMailApp = tempMailApp;
    // Siempre pide alias al cargar
    tempMailApp.reset();
});
window.addEventListener('beforeunload', () => {
    if (tempMailApp && tempMailApp.refreshInterval) {
        clearInterval(tempMailApp.refreshInterval);
    }
});
