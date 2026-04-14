// ── CONFIGURACIÓN DE API ──
const API_URL = "https://script.google.com/macros/s/AKfycby4hAvML44n1iCEQ1OUhZIhVujEfvTH83wIFMqnYc1cw8xNNs0OUHS9TYKi1HegNrdP/exec";
const WA = "573207101121";

let productos = [];
let carrito = JSON.parse(localStorage.getItem('lupe_cart')) || [];
const track = document.getElementById('track');
const dotsEl = document.getElementById('dots');
const loadingEl = document.getElementById('loading');
let cur = 0, perPage = 3, currentProduct = null;

function getDriveSrc(id) {
  return `https://lh3.googleusercontent.com/d/${id}=s800`;
}

// ── SKELETONS INICIALES ──
function showSkeletons() {
  if (!track) return;
  track.innerHTML = '';
  for(let i=0; i<3; i++) {
    const d = document.createElement('div');
    d.className = 'card skeleton';
    d.style.height = '450px';
    track.appendChild(d);
  }
}

async function cargarProductos() {
  showSkeletons();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    productos = data.map(p => ({
      id: p.driveId,
      name: p.name || "Producto LupeStyle",
      desc: p.desc || "Disponible en Medellín",
      src: getDriveSrc(p.driveId)
    }));
    
    if (productos.length === 0) {
      if (loadingEl) loadingEl.innerHTML = "<p>El catálogo está vacío.</p>";
    } else {
      if (loadingEl) loadingEl.style.display = 'none';
      buildCards();
      buildDots();
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
    if (loadingEl) loadingEl.innerHTML = "<p>Error al cargar catálogo. Verifica la conexión.</p>";
  }
  actualizarCarritoUI();
}

function buildCards(){
  if (!track) return;
  track.innerHTML='';
  productos.forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='card';
    d.style.animation = `fadeUp 0.8s forwards ${i*0.1}s`;
    d.innerHTML=`
      <button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarrito(productos[${i}])">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
      </button>
      <img src="${p.src}" alt="${p.name}" loading="lazy"/>
      <div class="card-label"><h3>${p.name}</h3><p>${p.desc}</p></div>
    `;
    d.onclick=()=>openModal(p);
    track.appendChild(d);
  });
}

// ── LÓGICA DE CARRITO ──
function toggleCart() {
  const panel = document.getElementById('cart-panel');
  if (panel) panel.classList.toggle('open');
}

function agregarAlCarrito(p) {
  carrito.push(p);
  localStorage.setItem('lupe_cart', JSON.stringify(carrito));
  actualizarCarritoUI();
  
  // Feedback visual
  const btn = document.querySelector('.cart-bubble');
  if (btn) {
    btn.style.transform = 'scale(1.3)';
    setTimeout(() => btn.style.transform = '', 200);
  }
}

function quitarDelCarrito(index) {
  carrito.splice(index, 1);
  localStorage.setItem('lupe_cart', JSON.stringify(carrito));
  actualizarCarritoUI();
}

function actualizarCarritoUI() {
  const list = document.getElementById('cart-list');
  const count = document.getElementById('cart-count');
  const totalQty = document.getElementById('cart-total-qty');
  
  if (count) count.textContent = carrito.length;
  if (totalQty) totalQty.textContent = carrito.length;
  
  if (list) {
    list.innerHTML = carrito.length === 0 ? '<p style="text-align:center; color:#aaa; margin-top:2rem;">Tu pedido está vacío</p>' : '';
    
    carrito.forEach((p, i) => {
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <img src="${p.src}"/>
        <div class="cart-item-info">
          <h4>${p.name}</h4>
          <p>${p.desc}</p>
          <span class="cart-remove" onclick="quitarDelCarrito(${i})">Eliminar</span>
        </div>
      `;
      list.appendChild(item);
    });
  }
}

function enviarPedidoWA() {
  if (carrito.length === 0) return alert("Agrega al menos una prenda a tu pedido.");
  
  let msg = "¡Hola LupeStyle! 👋 Me interesan estas prendas de tu catálogo:\n\n";
  carrito.forEach((p, i) => {
    msg += `${i + 1}. *${p.name}*\n   (${p.desc})\n\n`;
  });
  msg += `📍 Mi ubicación: Medellín\nTotal artículos: ${carrito.length}`;
  
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank');
}

function move(dir){
  if (productos.length === 0) return;
  const pages=Math.ceil(productos.length/getPerPage());
  cur=(cur+dir+pages)%pages;
  updateCarousel();
}

function updateCarousel(){
  const perP = getPerPage();
  const cardW=track.children[0]?.offsetWidth||0;
  const gap=parseFloat(getComputedStyle(track).gap)||0;
  track.style.transform=`translateX(-${cur*(cardW+gap)*perP}px)`;
  document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active',i===cur));
}

function getPerPage(){
  return window.innerWidth<=700?1:window.innerWidth<=950?2:3;
}

function buildDots(){
  if (!dotsEl) return;
  const perP = getPerPage();
  const pages=Math.ceil(productos.length/perP);
  dotsEl.innerHTML='';
  for(let i=0; i<pages; i++){
    const b=document.createElement('button');
    b.className='dot'+(i===cur?' active':'');
    b.onclick=()=>{cur=i;updateCarousel()};
    dotsEl.appendChild(b);
  }
}

function openModal(p){
  currentProduct = p;
  const img = document.getElementById('modal-img');
  const name = document.getElementById('modal-name');
  const desc = document.getElementById('modal-desc');
  const overlay = document.getElementById('overlay');

  if (img) img.src = p.src;
  if (name) name.textContent = p.name;
  if (desc) desc.textContent = p.desc;
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeModal(e){
  const overlay = document.getElementById('overlay');
  if(!e || e.target===overlay || 
     (e.currentTarget && (e.currentTarget.classList.contains('modal-x') || e.currentTarget.classList.contains('btn-close-modal')))) {
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow='';
  }
}

// ── EVENTOS ──
window.addEventListener('resize', ()=>{ 
  if(productos.length>0){
    buildDots();
    updateCarousel();
  }
});

// Iniciamos carga al cargar el DOM
document.addEventListener('DOMContentLoaded', cargarProductos);
