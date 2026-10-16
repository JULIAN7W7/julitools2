document.addEventListener('DOMContentLoaded', () => {
  const appsGrid = document.getElementById('appsGrid');
  const adminModal = document.getElementById('adminModal');
  const openAdminBtn = document.getElementById('openAdmin');
  const deleteModeBtn = document.getElementById('deleteMode');
  const closeModal = document.querySelector('.close');
  const closeWarning = document.querySelector('.close-warning');
  const appForm = document.getElementById('appForm');
  const appsList = document.getElementById('appsList');

  let apps = [];
  let selectedApps = [];
  let deleteFloatingBtn = null;

  const createDeleteFloatingBtn = () => {
    if (deleteFloatingBtn) return;
    deleteFloatingBtn = document.createElement('button');
    deleteFloatingBtn.id = 'deleteFloatingBtn';
    deleteFloatingBtn.className = 'btn btn-delete';
    deleteFloatingBtn.textContent = 'Eliminar';
    deleteFloatingBtn.onclick = deleteSelectedApps;
    document.querySelector('.container').appendChild(deleteFloatingBtn);
  };

  const removeDeleteFloatingBtn = () => {
    if (deleteFloatingBtn && deleteFloatingBtn.parentNode) {
      deleteFloatingBtn.parentNode.removeChild(deleteFloatingBtn);
      deleteFloatingBtn = null;
    }
  };

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      apps = await res.json();
      renderApps();
    } catch (err) {
      log(`Error al cargar apps: ${err.message}`, 'ERROR');
      appsGrid.innerHTML = '<p class="loading">Error al cargar las apps</p>';
    }
  };

  const renderApps = () => {
    if (apps.length === 0) {
      appsGrid.innerHTML = '<p class="loading">No hay apps disponibles aún</p>';
      removeDeleteFloatingBtn();
      selectedApps = [];
      return;
    }

    const inDeleteMode = document.body.classList.contains('delete-mode');

    appsGrid.innerHTML = apps.map(app => `
      <div class="app-card ${inDeleteMode ? 'selectable' : ''} ${selectedApps.includes(app.id) ? 'selected' : ''}" 
           ${inDeleteMode ? `onclick="toggleSelection(${app.id})"` : ''}>
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

    if (inDeleteMode && selectedApps.length > 0) {
      createDeleteFloatingBtn();
    } else {
      removeDeleteFloatingBtn();
    }
  };

  const renderAdminApps = () => {
    if (apps.length === 0) {
      appsList.innerHTML = '<p style="color: var(--text-secondary);">No hay apps registradas</p>';
      return;
    }

    appsList.innerHTML = apps.map(app => `
      <div class="admin-app-item">
        ${app.image_path ? `<img src="${app.image_path}" alt="${app.name}">` : '<div style="width:48px;height:48px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:var(--text-secondary);">Sin imagen</div>'}
        <div class="admin-app-info">
          <h4>${app.name}</h4>
          <p>${app.apk_link}</p>
        </div>
        <button class="delete-btn" onclick="deleteApp(${app.id})">Eliminar</button>
      </div>
    `).join('');
  };

  window.toggleSelection = (id) => {
    const idx = selectedApps.indexOf(id);
    if (idx > -1) {
      selectedApps.splice(idx, 1);
    } else {
      selectedApps.push(id);
    }
    renderApps();
  };

  window.deleteApp = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta app?')) return;
    try {
      const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      if (res.ok) fetchApps(); else alert('Error al eliminar');
    } catch (err) {
      log(`Error al eliminar app ${id}: ${err.message}`, 'ERROR');
      alert('Error de conexión');
    }
    if (document.body.classList.contains('delete-mode')) {
      renderAdminApps();
    }
  };

  const deleteSelectedApps = async () => {
    if (selectedApps.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedApps.length} app(s)?`)) return;
    try {
      for (const id of selectedApps) {
        await fetch(`/api/apps/${id}`, { method: 'DELETE' });
      }
      selectedApps = [];
      removeDeleteFloatingBtn();
      fetchApps();
      renderAdminApps();
    } catch (err) {
      log(`Error al eliminar apps seleccionadas: ${err.message}`, 'ERROR');
      alert('Error al eliminar');
    }
  };

  openAdminBtn.addEventListener('click', () => {
    adminModal.classList.add('active');
  });

  deleteModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('delete-mode');
    const isActive = document.body.classList.contains('delete-mode');
    deleteModeBtn.textContent = isActive ? 'Cancelar' : 'Eliminar App';
    fetchApps();
  });

  closeModal.addEventListener('click', () => {
    adminModal.classList.remove('active');
  });

  closeWarning.addEventListener('click', () => {
    document.getElementById('warningBanner').style.display = 'none';
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
      log(`Error al subir app: ${err.message}`, 'ERROR');
      alert('Error de conexión');
    }
  });

  fetchApps();
});