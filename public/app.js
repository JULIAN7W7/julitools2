document.addEventListener('DOMContentLoaded', () => {
  const appsGrid = document.getElementById('appsGrid');
  const adminModal = document.getElementById('adminModal');
  const openAdminBtn = document.getElementById('openAdmin');
  const deleteModeBtn = document.getElementById('deleteMode');
  const closeModal = document.querySelector('.close');
  const appForm = document.getElementById('appForm');
  const appsList = document.getElementById('appsList');

  let apps = [];

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      apps = await res.json();
      renderApps();
    } catch (err) {
      appsGrid.innerHTML = '<p class="loading">Error al cargar las apps</p>';
    }
  };

  const renderApps = () => {
    if (apps.length === 0) {
      appsGrid.innerHTML = '<p class="loading">No hay apps disponibles aún</p>';
      return;
    }

    appsGrid.innerHTML = apps.map(app => `
      <div class="app-card">
        <button class="delete-card-btn" onclick="deleteApp(${app.id})" title="Eliminar app">X</button>
        <div class="app-image">
          ${app.image_path ? `<img src="${app.image_path}" alt="${app.name}">` : app.name}
        </div>
        <div class="app-content">
          <h3>${app.name}</h3>
          ${app.description ? `<p>${app.description}</p>` : ''}
          <a href="${app.apk_link}" class="download-btn" download>Descargar</a>
        </div>
      </div>
    `).join('');
  };

  const renderAdminApps = () => {
    if (apps.length === 0) {
      appsList.innerHTML = '<p style="color: var(--text-secondary);">No hay apps registradas</p>';
      return;
    }

    appsList.innerHTML = apps.map(app => `
      <div class="admin-app-item">
        ${app.image_path ? `<img src="${app.image_path}" alt="${app.name}">` : '<div style="width:48px;height:48px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:8px;display:flex;align-items:center;justify-content.center;font-size:0.7rem;color:var(--text-secondary);">Sin imagen</div>'}
        <div class="admin-app-info">
          <h4>${app.name}</h4>
          <p>${app.apk_link}</p>
        </div>
        <button class="delete-btn" onclick="deleteApp(${app.id})">Eliminar</button>
      </div>
    `).join('');
  };

  window.deleteApp = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta app?')) return;
    await fetch(`/api/apps/${id}`, { method: 'DELETE' });
    fetchApps();
    renderAdminApps();
  };

  openAdminBtn.addEventListener('click', () => {
    adminModal.classList.add('active');
  });

  deleteModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('delete-mode');
    deleteModeBtn.textContent = document.body.classList.contains('delete-mode') ? 'Cancelar' : 'Eliminar App';
  });

  closeModal.addEventListener('click', () => {
    adminModal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.classList.remove('active');
    }
  });

  appForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(appForm);

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();

      if (res.ok) {
        appForm.reset();
        fetchApps();
        renderAdminApps();
      } else {
        alert(result.error || 'Error al subir');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  });

  fetchApps();
});