// Application State
let currentView = 'form';
let blocks = [];
let currentBlock = null;
let isEditing = false;
let currentCarouselIndex = 0;
let currentCarouselPhotos = [];

// API Base URL
const API_URL = '/api/blocks';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadBlocks();
});

// Event Listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn, [data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.getAttribute('data-view');
            if (view) switchView(view);
        });
    });

    // Form submission
    document.getElementById('block-form').addEventListener('submit', handleFormSubmit);

    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', resetForm);

    // Photo uploads with preview
    ['front', 'back', 'left', 'right'].forEach(side => {
        const input = document.getElementById(`photo_${side}`);
        input.addEventListener('change', (e) => handlePhotoPreview(e, side));
    });

    // Search
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // Modal controls
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    document.getElementById('carousel-prev').addEventListener('click', () => navigateCarousel(-1));
    document.getElementById('carousel-next').addEventListener('click', () => navigateCarousel(1));
}

// View Management
function switchView(view) {
    currentView = view;

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    // Update views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `${view}-view`);
    });

    // Load blocks when switching to gallery
    if (view === 'gallery') {
        loadBlocks();
    }
}

// Photo Preview
function handlePhotoPreview(event, side) {
    const file = event.target.files[0];
    const preview = document.getElementById(`preview_${side}`);

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
        <img src="${e.target.result}" alt="${side}">
        <span class="photo-text">${getSideLabel(side)}</span>
      `;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
}

function getSideLabel(side) {
    const labels = {
        front: 'Frente',
        back: 'Trás',
        left: 'Lado Esquerdo',
        right: 'Lado Direito'
    };
    return labels[side] || side;
}

// Form Handling
async function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    // Validate that at least one photo is uploaded
    const hasPhotos = ['photo_front', 'photo_back', 'photo_left', 'photo_right'].some(
        field => formData.get(field)?.size > 0
    );

    if (!hasPhotos) {
        showToast('Por favor, adicione pelo menos uma foto', 'warning');
        return;
    }

    showLoading(true);

    try {
        const url = isEditing ? `${API_URL}/${currentBlock.id}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao salvar bloco');
        }

        const result = await response.json();

        showToast(
            isEditing ? 'Bloco atualizado com sucesso!' : 'Bloco cadastrado com sucesso!',
            'success'
        );

        resetForm();
        switchView('gallery');
        loadBlocks();
    } catch (error) {
        console.error('Error saving block:', error);
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function resetForm() {
    document.getElementById('block-form').reset();

    // Reset photo previews
    ['front', 'back', 'left', 'right'].forEach(side => {
        const preview = document.getElementById(`preview_${side}`);
        preview.innerHTML = `
      <span class="photo-icon">📷</span>
      <span class="photo-text">${getSideLabel(side)}</span>
    `;
        preview.classList.remove('has-image');
    });

    isEditing = false;
    currentBlock = null;
    document.getElementById('submit-btn').innerHTML = `
    <span class="btn-icon">✓</span>
    Salvar Bloco
  `;
}

// Load Blocks
async function loadBlocks(searchQuery = '') {
    showLoading(true);

    try {
        const url = searchQuery ? `${API_URL}/search/${encodeURIComponent(searchQuery)}` : API_URL;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Erro ao carregar blocos');
        }

        blocks = await response.json();
        renderGallery();
    } catch (error) {
        console.error('Error loading blocks:', error);
        showToast('Erro ao carregar blocos', 'error');
    } finally {
        showLoading(false);
    }
}

// Render Gallery
function renderGallery() {
    const gallery = document.getElementById('gallery-grid');
    const emptyState = document.getElementById('empty-state');

    if (blocks.length === 0) {
        gallery.innerHTML = '';
        emptyState.classList.add('active');
        return;
    }

    emptyState.classList.remove('active');

    gallery.innerHTML = blocks.map(block => {
        const mainPhoto = block.photo_front || block.photo_back || block.photo_left || block.photo_right;
        const photoUrl = getImageUrl(mainPhoto);

        return `
      <div class="block-card" data-id="${block.id}">
        ${photoUrl ? `<img src="${photoUrl}" alt="${block.code}" class="block-image">` :
                '<div class="block-image" style="display: flex; align-items: center; justify-content: center; font-size: 3rem; opacity: 0.3;">📦</div>'}
        <div class="block-content">
          <div class="block-code">${block.code}</div>
          <div class="block-material">${block.material}</div>
          <div class="block-dimensions">
            <div class="dimension-item">
              <span class="dimension-label">Altura</span>
              <span class="dimension-value">${block.height}m</span>
            </div>
            <div class="dimension-item">
              <span class="dimension-label">Largura</span>
              <span class="dimension-value">${block.width}m</span>
            </div>
            <div class="dimension-item">
              <span class="dimension-label">Comprimento</span>
              <span class="dimension-value">${block.length}m</span>
            </div>
          </div>
          <div class="block-actions">
            <button class="btn btn-primary btn-small" onclick="viewBlockPhotos(${block.id})">
              <span class="btn-icon">🖼️</span>
              Ver Fotos
            </button>
            <button class="btn btn-secondary btn-small" onclick="editBlock(${block.id})">
              <span class="btn-icon">✏️</span>
              Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="deleteBlock(${block.id})">
              <span class="btn-icon">🗑️</span>
              Excluir
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// View Block Photos
function viewBlockPhotos(blockId) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const photos = [
        { url: block.photo_front, label: 'Frente' },
        { url: block.photo_back, label: 'Trás' },
        { url: block.photo_left, label: 'Lado Esquerdo' },
        { url: block.photo_right, label: 'Lado Direito' }
    ].filter(p => p.url);

    if (photos.length === 0) {
        showToast('Este bloco não possui fotos', 'warning');
        return;
    }

    currentCarouselPhotos = photos;
    currentCarouselIndex = 0;
    showCarousel();
}

function showCarousel() {
    const modal = document.getElementById('photo-modal');
    modal.classList.add('active');
    updateCarousel();
}

function updateCarousel() {
    const photo = currentCarouselPhotos[currentCarouselIndex];
    const image = document.getElementById('carousel-image');
    const caption = document.getElementById('carousel-caption');
    const dots = document.getElementById('carousel-dots');

    image.src = getImageUrl(photo.url);
    caption.textContent = photo.label;

    // Update dots
    dots.innerHTML = currentCarouselPhotos.map((_, index) =>
        `<div class="carousel-dot ${index === currentCarouselIndex ? 'active' : ''}" onclick="goToSlide(${index})"></div>`
    ).join('');
}

function navigateCarousel(direction) {
    currentCarouselIndex += direction;

    if (currentCarouselIndex < 0) {
        currentCarouselIndex = currentCarouselPhotos.length - 1;
    } else if (currentCarouselIndex >= currentCarouselPhotos.length) {
        currentCarouselIndex = 0;
    }

    updateCarousel();
}

function goToSlide(index) {
    currentCarouselIndex = index;
    updateCarousel();
}

function closeModal() {
    document.getElementById('photo-modal').classList.remove('active');
}

// Edit Block
async function editBlock(blockId) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    currentBlock = block;
    isEditing = true;

    // Fill form
    document.getElementById('code').value = block.code;
    document.getElementById('material').value = block.material;
    document.getElementById('height').value = block.height;
    document.getElementById('width').value = block.width;
    document.getElementById('length').value = block.length;

    // Show existing photos
    ['front', 'back', 'left', 'right'].forEach(side => {
        const photoUrl = block[`photo_${side}`];
        if (photoUrl) {
            const preview = document.getElementById(`preview_${side}`);
            preview.innerHTML = `
        <img src="${getImageUrl(photoUrl)}" alt="${side}">
        <span class="photo-text">${getSideLabel(side)}</span>
      `;
            preview.classList.add('has-image');
        }
    });

    // Update submit button
    document.getElementById('submit-btn').innerHTML = `
    <span class="btn-icon">✓</span>
    Atualizar Bloco
  `;

    switchView('form');
    showToast('Editando bloco. Atualize as informações necessárias.', 'success');
}

// Delete Block
async function deleteBlock(blockId) {
    if (!confirm('Tem certeza que deseja excluir este bloco? Esta ação não pode ser desfeita.')) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_URL}/${blockId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir bloco');
        }

        showToast('Bloco excluído com sucesso!', 'success');
        loadBlocks();
    } catch (error) {
        console.error('Error deleting block:', error);
        showToast('Erro ao excluir bloco', 'error');
    } finally {
        showLoading(false);
    }
}

// Search
function handleSearch(event) {
    const query = event.target.value.trim();
    loadBlocks(query);
}

// UI Helpers
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.toggle('active', show);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.25s ease reverse';
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

function getImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `/uploads/${url}`;
}

// Make functions globally accessible
window.viewBlockPhotos = viewBlockPhotos;
window.editBlock = editBlock;
window.deleteBlock = deleteBlock;
window.goToSlide = goToSlide;
