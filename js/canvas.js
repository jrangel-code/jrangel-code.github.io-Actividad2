/* =========================================================
   canvas.js — Gráfico de latencia en tiempo real (Canvas 2D)
   Animación con requestAnimationFrame (~60 FPS).
   ========================================================= */
'use strict';

(() => {
  const canvas = document.getElementById('graficoLatencia');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const btnPausa = document.getElementById('btnPausa');
  const kpiActual = document.getElementById('kpiActual');
  const kpiPromedio = document.getElementById('kpiPromedio');
  const kpiMaximo = document.getElementById('kpiMaximo');
  const estado = document.getElementById('estadoEnlace');

  const CONFIG = {
    puntos: 120,           // muestras visibles
    msPorMuestra: 250,     // una nueva lectura cada 250 ms
    minY: 0,
    maxY: 120,
    umbral: 80,            // ms: umbral de alerta
    margen: { arriba: 20, derecha: 16, abajo: 28, izquierda: 44 },
    colores: {
      rejilla: 'rgba(219, 230, 243, 0.15)',
      texto: '#dbe6f3',
      linea: '#5cc8ff',
      relleno: 'rgba(92, 200, 255, 0.18)',
      umbral: '#ff9f6b',
      punto: '#ffffff'
    }
  };

  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let datos = [];
  let base = 35;
  let pausaUsuario = reducirMovimiento; // pausa elegida por el usuario (o por prefers-reduced-motion)
  let visible = true;                   // el gráfico está en pantalla
  let pausado = pausaUsuario;
  let ultimoTiempo = 0;
  let acumulado = 0;
  let ultimoAnuncio = 0;
  let ancho = 0;
  let alto = 0;

  // ---- Generador de datos simulados (paseo aleatorio con picos ocasionales) ----
  function nuevaLectura() {
    base += (Math.random() - 0.5) * 6;
    base = Math.min(Math.max(base, 20), 60);
    const pico = Math.random() < 0.04 ? 35 + Math.random() * 30 : 0;
    return Math.round(base + pico + Math.random() * 4);
  }

  for (let i = 0; i < CONFIG.puntos; i++) datos.push(nuevaLectura());

  // ---- Ajuste a la densidad de píxeles del dispositivo (pantallas retina) ----
  function redimensionar() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ancho = rect.width;
    alto = rect.height;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dibujar(0);
  }

  const escalaY = (v) => {
    const { arriba, abajo } = CONFIG.margen;
    const h = alto - arriba - abajo;
    return arriba + h - ((v - CONFIG.minY) / (CONFIG.maxY - CONFIG.minY)) * h;
  };

  // ---- Dibujo de un cuadro ----
  // "progreso" (0–1) desplaza la serie suavemente entre muestras: así el
  // movimiento es continuo a 60 FPS aunque los datos lleguen cada 250 ms.
  function dibujar(progreso) {
    const { izquierda, derecha, arriba, abajo } = CONFIG.margen;
    const anchoUtil = ancho - izquierda - derecha;
    const paso = anchoUtil / (CONFIG.puntos - 1);
    const desplazamiento = progreso * paso;

    ctx.clearRect(0, 0, ancho, alto);

    // Rejilla horizontal y etiquetas del eje Y
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= CONFIG.maxY; v += 20) {
      const y = escalaY(v);
      ctx.strokeStyle = CONFIG.colores.rejilla;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(izquierda, y);
      ctx.lineTo(ancho - derecha, y);
      ctx.stroke();
      ctx.fillStyle = CONFIG.colores.texto;
      ctx.fillText(String(v), izquierda - 8, y);
    }

    // Etiqueta del eje X
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('últimos 30 segundos', izquierda + anchoUtil / 2, alto - 8);

    // Recorte al área del gráfico
    ctx.save();
    ctx.beginPath();
    ctx.rect(izquierda, arriba, anchoUtil, alto - arriba - abajo);
    ctx.clip();

    // Área rellena bajo la curva
    const x = (i) => izquierda + i * paso - desplazamiento;
    ctx.beginPath();
    ctx.moveTo(x(0), escalaY(datos[0]));
    for (let i = 1; i < datos.length; i++) ctx.lineTo(x(i), escalaY(datos[i]));
    ctx.lineTo(x(datos.length - 1), alto - abajo);
    ctx.lineTo(x(0), alto - abajo);
    ctx.closePath();
    ctx.fillStyle = CONFIG.colores.relleno;
    ctx.fill();

    // Línea de la serie
    ctx.beginPath();
    ctx.moveTo(x(0), escalaY(datos[0]));
    for (let i = 1; i < datos.length; i++) ctx.lineTo(x(i), escalaY(datos[i]));
    ctx.strokeStyle = CONFIG.colores.linea;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Umbral de alerta (línea discontinua)
    const yU = escalaY(CONFIG.umbral);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = CONFIG.colores.umbral;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(izquierda, yU);
    ctx.lineTo(ancho - derecha, yU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = CONFIG.colores.umbral;
    ctx.textAlign = 'right';
    ctx.fillText('umbral 80 ms', ancho - derecha - 4, yU - 6);

    // Punto de la última lectura
    const ultimo = datos[datos.length - 1];
    ctx.beginPath();
    ctx.arc(x(datos.length - 1), escalaY(ultimo), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colores.punto;
    ctx.fill();
  }

  // ---- Indicadores del panel lateral ----
  function actualizarKpis(ahora) {
    const actual = datos[datos.length - 1];
    const promedio = Math.round(datos.reduce((a, b) => a + b, 0) / datos.length);
    const maximo = Math.max(...datos);
    kpiActual.textContent = actual;
    kpiPromedio.textContent = promedio;
    kpiMaximo.textContent = maximo;

    // El texto anunciado por lectores de pantalla se limita a uno cada 5 s
    // para no saturar al usuario (región aria-live).
    if (ahora - ultimoAnuncio > 5000 || ultimoAnuncio === 0) {
      const alerta = actual > CONFIG.umbral;
      estado.textContent = alerta
        ? `Alerta: latencia de ${actual} ms, por encima del umbral.`
        : `Enlace estable: ${actual} ms, dentro del rango normal.`;
      estado.classList.toggle('alerta', alerta);
      estado.classList.toggle('ok', !alerta);
      ultimoAnuncio = ahora;
    }
  }

  // ---- Bucle de animación ----
  function bucle(tiempo) {
    if (!ultimoTiempo) ultimoTiempo = tiempo;
    const delta = tiempo - ultimoTiempo;
    ultimoTiempo = tiempo;

    if (!pausado) {
      acumulado += delta;
      while (acumulado >= CONFIG.msPorMuestra) {
        datos.push(nuevaLectura());
        datos.shift();
        acumulado -= CONFIG.msPorMuestra;
        actualizarKpis(tiempo);
      }
      dibujar(acumulado / CONFIG.msPorMuestra);
    }
    requestAnimationFrame(bucle);
  }

  // ---- Control de pausa accesible ----
  function aplicarEstadoBoton() {
    btnPausa.textContent = pausaUsuario ? 'Reanudar' : 'Pausar';
    btnPausa.setAttribute('aria-pressed', String(pausaUsuario));
    pausado = pausaUsuario || !visible;
  }
  btnPausa.addEventListener('click', () => {
    pausaUsuario = !pausaUsuario;
    aplicarEstadoBoton();
  });

  // Ahorro de recursos: sólo se anima cuando el gráfico es visible
  const observador = new IntersectionObserver(([entrada]) => {
    visible = entrada.isIntersecting;
    aplicarEstadoBoton();
  });
  observador.observe(canvas);

  window.addEventListener('resize', redimensionar);
  redimensionar();
  actualizarKpis(performance.now());
  aplicarEstadoBoton();
  requestAnimationFrame(bucle);
})();
