// ===== ESTADÍSTICAS DEL LEDGER =====
const totalItems = FOLDERS.reduce((sum, f) => sum + (f.items ? f.items.length : 0), 0) + 1; // +1 destacado
document.getElementById('statCategories').setAttribute('data-count', FOLDERS.length);
document.getElementById('statFiles').setAttribute('data-count', totalItems);

// ===== RENDER: RECURSO DESTACADO =====
const featEl = document.getElementById('featuredResource');
featEl.innerHTML = `
    <div class="info">
        <div class="icon-wrap">⚡</div>
        <div class="text">
            <span class="tag">Destacado · ${FEATURED.code}</span>
            <h3>${FEATURED.name}</h3>
            <p>${FEATURED.description}</p>
        </div>
    </div>
    <a href="${FEATURED.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Descargar</a>
`;

// ===== RENDER: GRID DE CARPETAS =====
const grid = document.getElementById('folderGrid');
const emptyState = document.getElementById('emptyState');

function codeFor(index) {
    return 'C-' + String(index + 1).padStart(2, '0');
}

function renderGrid(filter = '') {
    grid.innerHTML = '';
    const q = filter.trim().toLowerCase();
    let visible = 0;

    FOLDERS.forEach((folder, i) => {
        const matches = !q || folder.name.toLowerCase().includes(q) ||
            (folder.items || []).some(it => it.name.toLowerCase().includes(q));
        if (!matches) return;
        visible++;

        const hasItems = folder.items && folder.items.length > 0;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'folder-card reveal in-view';
        card.setAttribute('aria-label', `Abrir categoría ${folder.name}`);
        card.innerHTML = `
            <div class="tab"><span>${codeFor(i)}</span></div>
            <div class="body">
                <span class="icon">${folder.icon}</span>
                <h3>${folder.name}</h3>
                <div class="meta">
                    ${hasItems
                        ? `<span class="badge available">${folder.items.length} archivo${folder.items.length === 1 ? '' : 's'}</span>`
                        : `<span class="badge soon">Próximamente</span>`}
                    <span class="arrow">→</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openModal(folder, codeFor(i)));
        grid.appendChild(card);
    });

    emptyState.style.display = visible === 0 ? 'block' : 'none';
    document.getElementById('resultCount').textContent =
        visible === FOLDERS.length ? `${FOLDERS.length} categorías` : `${visible} de ${FOLDERS.length}`;
}

renderGrid();

// ===== BUSCADOR =====
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => renderGrid(e.target.value));

// ===== MODAL =====
const overlay = document.getElementById('modalOverlay');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeBtn = document.getElementById('modalCloseBtn');
const closeX = document.getElementById('modalCloseX');

function openModal(folder, code) {
    modalIcon.textContent = folder.icon;
    modalTitle.innerHTML = `<span class="code">${code}</span>${folder.name}`;

    if (folder.items && folder.items.length > 0) {
        let html = '<div class="modal-items">';
        folder.items.forEach((item, idx) => {
            html += `
                <div class="modal-item" style="animation-delay:${idx * 0.04}s">
                    <span class="idx">${String(idx + 1).padStart(2, '0')}</span>
                    <span class="item-name">${item.name}</span>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-download-modal">Descargar</a>
                </div>
            `;
        });
        html += '</div>';
        modalContent.innerHTML = html;
    } else {
        modalContent.innerHTML = `<p class="modal-empty">Esta categoría aún no tiene archivos publicados. Vuelve pronto.</p>`;
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeX.focus();
}

function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeModal);
closeX.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
