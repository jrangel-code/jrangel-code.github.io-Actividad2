/* =========================================================
   main.js — Formulario de cotización y utilidades de interfaz
   JavaScript nativo, sin jQuery.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Año actual en el pie de página
  document.getElementById('anio').textContent = new Date().getFullYear();

  cerrarMenuAlNavegar();
  precargarServicioDesdeTarjetas();
  configurarFormulario();
});

/** En móvil, cierra el menú hamburguesa al elegir un enlace. */
function cerrarMenuAlNavegar() {
  const menu = document.getElementById('menuPrincipal');
  const colapso = bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false });
  menu.querySelectorAll('.nav-link').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      if (menu.classList.contains('show')) colapso.hide();
    });
  });
}

/** Al pulsar "Cotizar …" en una tarjeta, se rellena el campo de servicio. */
function precargarServicioDesdeTarjetas() {
  const campo = document.getElementById('servicio');
  document.querySelectorAll('[data-servicio]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      campo.value = enlace.dataset.servicio;
      campo.classList.remove('is-invalid');
      // Se enfoca el primer campo tras el desplazamiento para usuarios de teclado
      setTimeout(() => document.getElementById('nombre').focus({ preventScroll: true }), 400);
    });
  });
}

/** Validación con la API nativa de HTML5 + clases de feedback de Bootstrap. */
function configurarFormulario() {
  const form = document.getElementById('formCotizacion');
  const aviso = document.getElementById('mensajeEnvio');
  const mensaje = document.getElementById('mensaje');
  const contador = document.getElementById('mensajeContador');
  const campos = form.querySelectorAll('input, textarea');

  // Validación en vivo: marca cada campo al salir de él o al corregirlo
  campos.forEach((campo) => {
    campo.addEventListener('blur', () => marcarCampo(campo));
    campo.addEventListener('input', () => {
      if (campo.classList.contains('is-invalid') || campo.classList.contains('is-valid')) {
        marcarCampo(campo);
      }
    });
  });

  // Contador de caracteres del mensaje
  mensaje.addEventListener('input', () => {
    contador.textContent = `${mensaje.value.length} / 500 caracteres (mínimo 20).`;
  });

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    form.classList.add('was-validated');
    campos.forEach(marcarCampo);

    if (!form.checkValidity()) {
      // Se lleva el foco al primer campo con error (WCAG 3.3.1)
      const primero = form.querySelector(':invalid');
      if (primero) primero.focus();
      mostrarAviso(aviso, 'Revise los campos marcados en rojo.', 'alert-danger');
      return;
    }

    const datos = Object.fromEntries(new FormData(form));
    mostrarAviso(
      aviso,
      `Gracias, ${datos.nombre.split(' ')[0]}. Recibimos su solicitud de «${datos.servicio}» y le escribiremos a ${datos.correo}.`,
      'alert-success'
    );
    form.reset();
    form.classList.remove('was-validated');
    campos.forEach((c) => c.classList.remove('is-valid', 'is-invalid'));
    contador.textContent = '0 / 500 caracteres (mínimo 20).';
  });

  form.addEventListener('reset', () => {
    form.classList.remove('was-validated');
    campos.forEach((c) => {
      c.classList.remove('is-valid', 'is-invalid');
      c.removeAttribute('aria-invalid');
    });
    aviso.classList.add('d-none');
  });
}

/** Aplica .is-valid / .is-invalid y aria-invalid según la validez nativa. */
function marcarCampo(campo) {
  if (!campo.willValidate) return;
  if (!campo.required && campo.value === '') {
    campo.classList.remove('is-valid', 'is-invalid');
    campo.removeAttribute('aria-invalid');
    return;
  }
  const valido = campo.checkValidity();
  campo.classList.toggle('is-valid', valido);
  campo.classList.toggle('is-invalid', !valido);
  campo.setAttribute('aria-invalid', String(!valido));
}

function mostrarAviso(elemento, texto, clase) {
  elemento.className = `alert mt-3 ${clase}`;
  elemento.textContent = texto;
}
