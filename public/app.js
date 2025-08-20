document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('presentationForm');
    const topicInput = document.getElementById('topic');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const errorSection = document.getElementById('errorSection');
    const downloadLink = document.getElementById('downloadLink');
    const previewContent = document.getElementById('previewContent');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const topic = topicInput.value.trim();
        if (!topic) {
            showError('Por favor, ingresa un tema para la presentación.');
            return;
        }

        // Rate limiting simple - verificar si ya generó una presentación recientemente
        const lastGeneration = localStorage.getItem('lastGeneration');
        const now = Date.now();
        const cooldownTime = 30000; // 30 segundos

        if (lastGeneration && (now - parseInt(lastGeneration)) < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (now - parseInt(lastGeneration))) / 1000);
            showError(`Por favor espera ${remainingTime} segundos antes de generar otra presentación.`);
            return;
        }

        try {
            // Guardar timestamp de esta generación
            localStorage.setItem('lastGeneration', now.toString());
            showLoading();
            
            const response = await fetch('/api/generate-presentation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic: topic })
            });

            const data = await response.json();

            if (data.success) {
                showSuccess(data.downloadUrl, data.txtDownloadUrl, data.presentationData);
            } else {
                showError(data.error || 'Error desconocido al generar la presentación');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión. Verifica que el servidor esté funcionando.');
        }
    });

    function showLoading() {
        hideAllSections();
        loadingSection.style.display = 'block';
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando...';
    }

    function showSuccess(downloadUrl, txtDownloadUrl, presentationData) {
        hideAllSections();
        resultSection.style.display = 'block';
        resultSection.classList.add('animate-slide-in');
        
        downloadLink.href = downloadUrl;
        downloadLink.onclick = function() {
            setTimeout(() => {
                showSuccessMessage('¡Descarga iniciada! Revisa tu carpeta de descargas.');
            }, 1000);
        };

        // Agregar enlace para el archivo .txt si existe
        if (txtDownloadUrl) {
            const txtLinkHtml = `
                <a href="${txtDownloadUrl}" class="btn btn-info btn-lg mt-2" download>
                    <i class="fas fa-file-text me-2"></i>
                    Descargar Contenido Completo (.txt)
                </a>
            `;
            downloadLink.insertAdjacentHTML('afterend', txtLinkHtml);
        }

        if (presentationData) {
            displayPreview(presentationData);
        }

        resetButton();
    }

    function showError(message) {
        hideAllSections();
        errorSection.style.display = 'block';
        errorSection.classList.add('animate-slide-in');
        errorMessage.textContent = message;
        resetButton();
    }

    function hideAllSections() {
        loadingSection.style.display = 'none';
        resultSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        [resultSection, errorSection].forEach(section => {
            section.classList.remove('animate-slide-in');
        });
    }

    function resetButton() {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generar Presentación';
    }

    function displayPreview(presentationData) {
        if (!presentationData || !presentationData.slides) {
            previewContent.innerHTML = '<p class="text-muted">No hay vista previa disponible.</p>';
            return;
        }

        let previewHTML = `<h6 class="mb-3 text-primary"><strong>${presentationData.title || 'Presentación'}</strong></h6>`;
        
        presentationData.slides.forEach((slide, index) => {
            previewHTML += `
                <div class="slide-preview">
                    <div class="slide-title">
                        <i class="fas fa-file-powerpoint me-2 text-danger"></i>
                        Diapositiva ${index + 1}: ${slide.title}
                    </div>
                    <div class="slide-content">
                        <ul class="mb-0">
                            ${slide.content ? slide.content.map(point => `<li>${point}</li>`).join('') : '<li>Sin contenido</li>'}
                        </ul>
                    </div>
                </div>
            `;
        });

        previewContent.innerHTML = previewHTML;
    }

    function showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }

    // Auto-resize textarea
    topicInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
});

function resetForm() {
    const form = document.getElementById('presentationForm');
    const topicInput = document.getElementById('topic');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const errorSection = document.getElementById('errorSection');
    
    form.reset();
    topicInput.style.height = 'auto';
    loadingSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    topicInput.focus();
    updateButtonState();
}

function updateButtonState() {
    const generateBtn = document.getElementById('generateBtn');
    const lastGeneration = localStorage.getItem('lastGeneration');
    const now = Date.now();
    const cooldownTime = 30000; // 30 segundos

    if (lastGeneration && (now - parseInt(lastGeneration)) < cooldownTime) {
        const remainingTime = Math.ceil((cooldownTime - (now - parseInt(lastGeneration))) / 1000);
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<i class="fas fa-clock me-2"></i>Espera ${remainingTime}s`;
        
        // Actualizar cada segundo
        setTimeout(updateButtonState, 1000);
    } else {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generar Presentación';
    }
}

// Health check on page load
window.addEventListener('load', async function() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('Servidor:', data.message);
    } catch (error) {
        console.warn('No se pudo conectar con el servidor:', error);
    }
    
    // Verificar estado del botón al cargar la página
    updateButtonState();
});