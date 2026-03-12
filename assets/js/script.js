import getWeather from './api/weather.js';
import Tarea from './classes/Tarea.js';
import GestorTareas from './classes/GestorTareas.js';
import {options} from './api/Geolocalization.js';

const formularioTarea = document.getElementById('formTareas');
const listarTareas = document.getElementById('listaTareas');
const alertContainer = document.getElementById('alertContainer');

// Crear instancia de GestorTareas y Tareas
const gestorTareas = new GestorTareas();
const cargarDesdeStorage = () => {
  const tareasGuardadas = JSON.parse(localStorage.getItem('tareas'));
  if (tareasGuardadas) {
      //  array interno del gestor vacío para que no se sumen las del storage a las que ya existan en memoria
      gestorTareas.tareas = [];       
      tareasGuardadas.forEach(t => {
          const nuevaTarea = new Tarea(t.id, t.descripcion, t.estado, t.fechaCreacion, t.fechaLimite);
          gestorTareas.agregarTarea(nuevaTarea);
      });
  }
};
cargarDesdeStorage();

const contadorRegresivo = (fechaLimite) => {
  if (!fechaLimite) return '¡Tómate tu tiempo! No hay prisa ☘ ';

  const fechaActual = new Date().getTime();
  const diferencia = fechaLimite - fechaActual;

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor(
    (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

  return `${dias} días y ${horas}:${minutos}:${segundos}`;
};

// Reemplaza tu antigua función por esta:
const renderizarTareas = (tareasFiltradas = null) => {
  listarTareas.innerHTML = '';

  // Esta línea decide: si hay filtro usa el filtro, si no, usa todas las del gestor
  const tareasAMostrar = tareasFiltradas || gestorTareas.listarTareas();

  tareasAMostrar.forEach((tarea) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

    const span = document.createElement('span');
    span.dataset.id = tarea.id;
    span.classList.add('small', 'text-muted', 'date-countdown');
    span.textContent = contadorRegresivo(tarea.fechaLimite);

    const { descripcion, estado } = tarea;
    li.textContent = `${descripcion} - ${estado ? 'Completada' : 'Pendiente'}`;

    li.appendChild(span);

    const buttonDelete = document.createElement('button');
    buttonDelete.classList.add('btn', 'btn-danger', 'btn-sm');
    buttonDelete.textContent = 'Eliminar';
    buttonDelete.dataset.id = tarea.id;

    const buttonEstado = document.createElement('button');
    buttonEstado.classList.add('btn', 'btn-success', 'btn-sm');
    buttonEstado.textContent = 'Cambiar estado';
    buttonEstado.dataset.id = tarea.id;

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('btn-group');
    buttonContainer.appendChild(buttonDelete);
    buttonContainer.appendChild(buttonEstado);

    li.appendChild(buttonContainer);
    listarTareas.appendChild(li);
  });
};
// Renderizar tareas para la primera carga de la página
renderizarTareas();

// Actualizar el contador regresivo 1 vez por segundo
setInterval(() => {
  const countdown = document.querySelectorAll('.date-countdown');

  countdown.forEach((span) => {
    const id = Number(span.dataset.id);
    const tarea = gestorTareas.listarTareas().find((tarea) => tarea.id === id);
    span.textContent = contadorRegresivo(tarea.fechaLimite);
  });
}, 1000);

formularioTarea.addEventListener('submit', (event) => {
  event.preventDefault();

  // Deshabilitar boton submit
  document.querySelector('button[type="submit"]').disabled = true;
  // Insertar alert informativa para el usuario (porque hay un tiempo de espera)
  insertAlert('warning', 'Agregando tarea, por favor espere...');

  // Simular retardo al agregar tarea
  setTimeout(() => {
    const descripcion = document.getElementById('descripcion').value;
    const fechaLimite = document.getElementById('fechaLimite').value;

    // Si es que se selecciona una fecha límite en el input, la convertimos a milisegundos, sino devolvemos undefined
    const tiempoLimite = fechaLimite
      ? new Date(fechaLimite).getTime()
      : undefined;

    gestorTareas.agregarTarea(
      new Tarea(Date.now(), descripcion, false, new Date(), tiempoLimite),
    );
      localStorage.setItem('tareas', JSON.stringify(gestorTareas.listarTareas()));
    // Renderizar tareas, para actualizar la lista
    renderizarTareas();
    // Limpiar formulario
    event.target.reset();
    insertAlert('success', 'Tarea agregada correctamente');
    document.querySelector('button[type="submit"]').disabled = false;
  }, 2000);
});

// Manejar Clicks de botones dentro de cada <li>
listarTareas.addEventListener('click', (event) => {
  if (event.target.classList.contains('btn-danger')) {
    const id = Number(event.target.dataset.id);
    gestorTareas.eliminarTarea(id);
    localStorage.setItem('tareas', JSON.stringify(gestorTareas.listarTareas()));
    insertAlert('success', 'Tarea eliminada exitosamente.');
    renderizarTareas();
  } else if (event.target.classList.contains('btn-success')) {
    const id = Number(event.target.dataset.id);
    gestorTareas.cambiarEstado(id);
    localStorage.setItem('tareas', JSON.stringify(gestorTareas.listarTareas()));
    renderizarTareas();
  }
});

const insertAlert = (className, message) => {
  alertContainer.innerHTML = '';
  const alert = `
    <div class="alert alert-${className} alert-dismissible fade show" role="alert">
      ${message}.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  alertContainer.innerHTML = alert;
};

//  NUEVA SECCIÓN DE FILTRADO 

const esperar = (ms) => new Promise(res => setTimeout(res, ms));

async function filtrar(tipo) {
    const loader = document.getElementById('loadingMessage');
    const listaUI = document.getElementById('listaTareas');

    loader.classList.remove('d-none');
    listaUI.style.opacity = '0.5';

    await esperar(1500); // Pausa de 1.5 segundos

    const todas = gestorTareas.listarTareas();
    
    if (tipo === 'completas') {
        const filtradas = todas.filter(t => t.estado === true);
        renderizarTareas(filtradas);
    } else if (tipo === 'pendientes') {
        const filtradas = todas.filter(t => t.estado === false);
        renderizarTareas(filtradas);
    } else {
        renderizarTareas(todas);
    }

    loader.classList.add('d-none');
    listaUI.style.opacity = '1';
}

// Eventos para los botones (asegúrate que los ID coincidan con tu HTML)
document.getElementById('btnVerTodas').onclick = () => filtrar('todas');
document.getElementById('btnVerCompletadas').onclick = () => filtrar('completas');
document.getElementById('btnVerPendientes').onclick = () => filtrar('pendientes');

// Evento Keyup: Valida visualmente el input mientras escribes
const inputDesc = document.getElementById('descripcion');
inputDesc.addEventListener('keyup', (e) => {
    // Si el usuario escribe, el borde se pone verde "ecológico"
    e.target.style.borderColor = e.target.value.length > 3 ? "#2d5a4c" : "#ced4da";
});

// Evento Mouseover: Resalta la tarea cuando pasas el puntero
listarTareas.addEventListener('mouseover', (event) => {
    const item = event.target.closest('.list-group-item');
    if (item) {
        item.style.backgroundColor = "#f8fdfb"; // Un toque de verde muy suave
        item.style.transition = "background-color 0.3s";
    }
});

// Evento Mouseout: Quita el resaltado al sacar el puntero
listarTareas.addEventListener('mouseout', (event) => {
    const item = event.target.closest('.list-group-item');
    if (item) {
        item.style.backgroundColor = "";
    }
});

// GEOLOCALIZACIÓN Y CLIMA
// Si el usuario dice No
const error = (err) => {
  console.warn(`Error de geolocalización (${err.code}): ${err.message}`);
  
  const topBar = document.getElementById('topBar');
  if (topBar) {
      // Mostramos un mensaje amigable en la barra en lugar de dejarla vacía
      topBar.innerHTML = `
          <div class="container-fluid bg-dark text-white py-1 text-center">
              <p class="small my-0">📍 El clima no está disponible porque la ubicación fue denegada.</p>
          </div>
      `;
  }
};

// 2. Qué hacer si el usuario dice que SÍ
const success = (pos) => {
  const { latitude, longitude } = pos.coords;
  // Llamamos a la función que importamos de weather.js
  getWeather(latitude, longitude); 
};

// 3. Ejecutar la petición (Usa las opciones que importaste al principio)
navigator.geolocation.getCurrentPosition(success, error, options);
