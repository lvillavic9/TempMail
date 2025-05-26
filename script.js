/**
 * TempMail Pro - Aplicación de Correos Temporales
 * Desarrollado por @lvillavic9
 * Utiliza la API de TestMail.app
 */

class TempMailApp {
    constructor() {
        // Configuración de la API
        this.API_KEY = 'e769cbfe-db59-4af7-97d3-74703239d385';
        this.NAMESPACE = 'wjlcs';
        this.BASE_URL = 'https://api.testmail.app/api/json';
        
        // Estado de la aplicación
        this.currentTag = null;
        this.currentEmail = null;
        this.refreshInterval = null;
        this.emails = [];
        
        // Elementos del DOM
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
        this.loadFromStorage();
    }
    
    /**
     * Inicializa todos los event listeners
     */
    initializeEventListeners() {
        // Generar email
        this.elements.generateBtn.addEventListener('click', () => this.generateEmail());
        this.elements.tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateEmail();
        });
        this.elements.tagInput.addEventListener('input', () => this.validateTag());
        
        // Copiar email
        this.elements.copyBtn.addEventListener('click', () => this.copyEmail());
        
        // Actualizar manualmente
        this.elements.refreshBtn.addEventListener('click', () => this.fetchEmails());
        
        // Cambiar intervalo de actualización
        this.elements.refreshInterval.addEventListener('change', () => this.updateRefreshInterval());
        
        // Limpiar todos los emails
        this.elements.deleteAllBtn.addEventListener('click', () => this.deleteAllEmails());
        
        // Cerrar modal
        this.elements.closeModal.addEventListener('click', () => this.closeModal());
        this.elements.emailModal.addEventListener('click', (e) => {
            if (e.target === this.elements.emailModal) this.closeModal();
        });
        
        // Escape para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }
    
    /**
     * Valida el tag ingresado por el usuario
     */
    validateTag() {
        const tag = this.elements.tagInput.value.trim();
        const regex = /^[a-zA-Z0-9._-]+$/;
        
        this.clearError();
        
        if (!tag) {
            return false;
        }
        
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
    
    /**
     * Genera un nuevo email temporal
     */
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
            
            // Mostrar el email generado
            this.elements.generatedEmail.textContent = this.currentEmail;
            this.elements.emailSection.classList.remove('hidden');
            this.elements.inboxSection.classList.remove('hidden');
            
            // Limpiar emails anteriores
            this.emails = [];
            this.renderEmails();
            
            // Guardar en localStorage
            this.saveToStorage();
            
            // Comenzar a buscar emails
            this.startRefreshInterval();
            this.fetchEmails();
            
            this.showToast('¡Email temporal generado exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error generando email:', error);
            this.showToast('Error al generar el email temporal', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Copia el email al portapapeles
     */
    async copyEmail() {
        if (!this.currentEmail) return;
        
        try {
            await navigator.clipboard.writeText(this.currentEmail);
            this.showToast('Email copiado al portapapeles', 'success');
            
            // Animación visual
            this.elements.copyBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.elements.copyBtn.style.transform = '';
            }, 150);
            
        } catch (error) {
            console.error('Error copiando email:', error);
            this.showToast('Error al copiar el email', 'error');
            
            // Fallback para navegadores antiguos
            this.fallbackCopyEmail();
        }
    }
    
    /**
     * Método de respaldo para copiar texto
     */
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
    
    /**
     * Obtiene los emails desde la API
     */
    async fetchEmails() {
        if (!this.currentTag) return;
        
        try {
            this.updateStatus('Buscando nuevos correos...', false);
            
            const response = await fetch(`${this.BASE_URL}?apikey=${this.API_KEY}&namespace=${this.NAMESPACE}&tag=${this.currentTag}&livequery=true`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.emails) {
                const newEmails = data.emails.filter(email => 
                    !this.emails.find(existing => existing.id === email.id)
                );
                
                if (newEmails.length > 0) {
                    this.emails = [...newEmails, ...this.emails];
                    this.renderEmails();
                    this.showToast(`${newEmails.length} nuevo(s) correo(s) recibido(s)`, 'success');
                }
                
                this.updateStatus(`Activo - ${this.emails.length} correo(s) recibido(s)`, true);
            } else {
                this.updateStatus('Activo - Esperando correos...', true);
            }
            
        } catch (error) {
            console.error('Error fetching emails:', error);
            this.updateStatus('Error al conectar con el servidor', false);
            this.showToast('Error al buscar correos', 'error');
        }
    }
    
    /**
     * Renderiza la lista de emails
     */
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
    
    /**
     * Abre el modal con el detalle del email
     */
    openEmailModal(emailId) {
        const email = this.emails.find(e => e.id === emailId);
        if (!email) return;
        
        document.getElementById('modalSubject').textContent = email.subject || 'Sin asunto';
        document.getElementById('modalFrom').textContent = email.from || 'Desconocido';
        document.getElementById('modalTo').textContent = email.to || this.currentEmail;
        document.getElementById('modalDate').textContent = this.formatDate(email.timestamp, true);
        
        // Renderizar contenido del email
        const contentDiv = document.getElementById('modalContent');
        
        if (email.html) {
            // Crear iframe para contenido HTML
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
    
    /**
     * Cierra el modal
     */
    closeModal() {
        this.elements.emailModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    /**
     * Elimina todos los emails
     */
    async deleteAllEmails() {
        if (!this.currentTag || this.emails.length === 0) return;
        
        if (!confirm('¿Estás seguro de que quieres eliminar todos los correos?')) {
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Llamar a la API para eliminar emails
            const response = await fetch(`${this.BASE_URL}?apikey=${this.API_KEY}&namespace=${this.NAMESPACE}&tag=${this.currentTag}&action=delete`);
            
            if (response.ok) {
                this.emails = [];
                this.renderEmails();
                this.showToast('Todos los correos han sido eliminados', 'success');
            } else {
                throw new Error('Error al eliminar correos');
            }
            
        } catch (error) {
            console.error('Error deleting emails:', error);
            this.showToast('Error al eliminar los correos', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Actualiza el intervalo de refresh
     */
    updateRefreshInterval() {
        const interval = parseInt(this.elements.refreshInterval.value);
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.currentTag) {
            this.refreshInterval = setInterval(() => this.fetchEmails(), interval);
        }
        
        this.saveToStorage();
    }
    
    /**
     * Inicia el intervalo de refresh automático
     */
    startRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        const interval = parseInt(this.elements.refreshInterval.value);
        this.refreshInterval = setInterval(() => this.fetchEmails(), interval);
    }
    
    /**
     * Actualiza el estado visual
     */
    updateStatus(text, isActive) {
        this.elements.statusText.textContent = text;
        
        if (isActive) {
            this.elements.statusDot.classList.add('active');
        } else {
            this.elements.statusDot.classList.remove('active');
        }
    }
    
    /**
     * Muestra/oculta el overlay de carga
     */
    showLoading(show) {
        if (show) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Muestra un mensaje de error en el input
     */
    showError(message) {
        this.elements.tagError.textContent = message;
        this.elements.tagInput.style.borderColor = 'var(--danger-color)';
    }
    
    /**
     * Limpia los errores del input
     */
    clearError() {
        this.elements.tagError.textContent = '';
        this.elements.tagInput.style.borderColor = '';
    }
    
    /**
     * Muestra una notificación toast
     */
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
        
        // Auto-remover después de 4 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
    
    /**
     * Obtiene una vista previa del contenido del email
     */
    getEmailPreview(email) {
        let preview = '';
        
        if (email.text) {
            preview = email.text.replace(/\s+/g, ' ').trim();
        } else if (email.html) {
            // Remover tags HTML y extraer texto
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
    
    /**
     * Formatea una fecha/timestamp
     */
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
    
    /**
     * Escapa caracteres HTML para evitar XSS
     */
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
    
    /**
     * Guarda el estado en localStorage
     */
    saveToStorage() {
        const state = {
            currentTag: this.currentTag,
            currentEmail: this.currentEmail,
            refreshInterval: this.elements.refreshInterval.value,
            timestamp: Date.now()
        };
        
        localStorage.setItem('tempmail_state', JSON.stringify(state));
    }
    
    /**
     * Carga el estado desde localStorage
     */
    loadFromStorage() {
        try {
            const savedState = localStorage.getItem('tempmail_state');
            if (!savedState) return;
            
            const state = JSON.parse(savedState);
            
            // Solo restaurar si no ha pasado más de 24 horas
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            if (Date.now() - state.timestamp > maxAge) {
                localStorage.removeItem('tempmail_state');
                return;
            }
            
            if (state.currentTag && state.currentEmail) {
                this.currentTag = state.currentTag;
                this.currentEmail = state.currentEmail;
                this.elements.tagInput.value = state.currentTag;
                this.elements.generatedEmail.textContent = state.currentEmail;
                this.elements.emailSection.classList.remove('hidden');
                this.elements.inboxSection.classList.remove('hidden');
                
                if (state.refreshInterval) {
                    this.elements.refreshInterval.value = state.refreshInterval;
                }
                
                // Empezar a buscar emails
                this.startRefreshInterval();
                this.fetchEmails();
            }
            
        } catch (error) {
            console.error('Error loading from storage:', error);
            localStorage.removeItem('tempmail_state');
        }
    }
    
    /**
     * Limpia el estado y reinicia la aplicación
     */
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
        
        localStorage.removeItem('tempmail_state');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
let tempMailApp;

document.addEventListener('DOMContentLoaded', () => {
    tempMailApp = new TempMailApp();
    
    // Hacer la instancia globalmente accesible para los event handlers inline
    window.tempMailApp = tempMailApp;
});

// Limpiar intervalos cuando se cierra la página
window.addEventListener('beforeunload', () => {
    if (tempMailApp && tempMailApp.refreshInterval) {
        clearInterval(tempMailApp.refreshInterval);
    }
});