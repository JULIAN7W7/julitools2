document.addEventListener('DOMContentLoaded', () => {
  const log = (msg, type = 'INFO') => console.log(`[${new Date().toISOString()}] [${type}] ${msg}`);
  const appsGrid = document.getElementById('appsGrid');
  const adminModal = document.getElementById('adminModal');
  const openAdminBtn = document.getElementById('openAdmin');
  const editSelectedBtn = document.getElementById('editSelected');
  const deleteModeBtn = document.getElementById('deleteMode');
  const closeModal = document.querySelector('.close');
  const closeWarning = document.querySelector('.close-warning');
  const appForm = document.getElementById('appForm');
  const formTitle = document.querySelector('#adminModal h2');
  const submitBtn = appForm.querySelector('button[type="submit"]');

  let apps = [];
  let selectedApps = [];
  let deleteFloatingBtn = null;
  let editingAppId = null;

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
      editSelectedBtn.disabled = false;
    } else {
      removeDeleteFloatingBtn();
      editSelectedBtn.disabled = true;
    }
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

  window.editApp = (id) => {
    const app = apps.find(a => a.id === id);
    if (!app) return;

    editingAppId = id;
    formTitle.textContent = 'Editar App';
    submitBtn.textContent = 'Actualizar App';

    document.getElementById('name').value = app.name;
    document.getElementById('description').value = app.description || '';
    document.getElementById('apk_link').value = app.apk_link || '';

    document.getElementById('image').value = '';

    adminModal.classList.add('active');
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
    } catch (err) {
      log(`Error al eliminar apps: ${err.message}`, 'ERROR');
      alert('Error al eliminar');
    }
  };

  openAdminBtn.addEventListener('click', () => {
    editingAppId = null;
    formTitle.textContent = 'Agregar App';
    submitBtn.textContent = 'Guardar App';
    appForm.reset();
    adminModal.classList.add('active');
  });

  deleteModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('delete-mode');
    const isActive = document.body.classList.contains('delete-mode');
    deleteModeBtn.textContent = isActive ? 'Cancelar' : 'Eliminar App';
    selectedApps = [];
    editSelectedBtn.disabled = true;
    removeDeleteFloatingBtn();
    fetchApps();
  });

  editSelectedBtn.addEventListener('click', () => {
    if (selectedApps.length === 0) return;
    const id = selectedApps[0];
    editApp(id);
  });

  closeModal.addEventListener('click', () => {
    adminModal.classList.remove('active');
    editingAppId = null;
  });

  closeWarning.addEventListener('click', () => {
    document.getElementById('warningBanner').style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === adminModal) {
      adminModal.classList.remove('active');
      editingAppId = null;
    }
  });

  appForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(appForm);

    try {
      let res;
      if (editingAppId) {
        res = await fetch(`/api/apps/${editingAppId}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        res = await fetch('/api/apps', {
          method: 'POST',
          body: formData
        });
      }
      const result = await res.json();

      if (res.ok) {
        appForm.reset();
        editingAppId = null;
        formTitle.textContent = 'Agregar App';
        submitBtn.textContent = 'Guardar App';
        adminModal.classList.remove('active');
        window.location.reload();
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
