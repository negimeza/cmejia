# Manual de Referencia Profesional: Ecosistema E-commerce

Este documento establece las reglas, estándares y directrices para el desarrollo y mantenimiento del proyecto. Siguiendo estos principios, garantizamos un producto de clase mundial, escalable y fácil de administrar.

## 1. Misión del Sistema
Transformar una página estática en una plataforma administrable por el usuario, eliminando la dependencia de programadores para tareas diarias como actualizar precios, subir fotos o gestionar el inventario.

---

## 2. Reglas de Oro de Arquitectura (Senior CTO Vision)

### 2.1 Escalabilidad y Costo $0
- **Prioridad**: Siempre utilizar herramientas con "Free Tier" robusto (Supabase, Vercel, Sanity, Cloudinary).
- **Abstracción**: El frontend no debe depender de una base de datos específica; usar capas de servicios.

### 2.2 Administrabilidad (User-First)
- **Cero Código para el Usuario**: Cualquier cambio de precio, imagen o descripción debe hacerse desde un panel visual (CMS).
- **Procesamiento de Imágenes**: Automatizar el redimensionamiento y optimización de imágenes al subir.

### 2.3 Diseño Premium (WOW Effect)
- **Estética**: Seguir la línea "Glassmorphism" o "Minimalist Beauty".
- **Interacción**: Animaciones sutiles con Framer Motion o CSS Transitions.
- **Tipografía**: Uso de fuentes modernas (Inter, Outfit, Playfair Display para elegancia).

---

## 3. Stack Tecnológico Sugerido (The Golden Stack)

| Capa | Herramienta | Por qué |
|---|---|---|
| **Frontend** | Next.js / React | SEO, velocidad de carga y ecosistema profesional. |
| **CMS (Admin)** | Sanity.io | Interfaz de usuario increíble para subir fotos y editar precios gratis. |
| **Database** | Supabase | PostgreSQL robusto, Auth integrado y Storage de archivos. |
| **Hosting** | Vercel | Despliegue automático desde GitHub y performance global. |
| **Checkout** | WhatsApp API | Cierre de ventas directo y personal (Gratis y efectivo). |

---

## 4. Estándares de Implementación

### 4.1 Código Limpio
- **Nomenclatura**: Variables en inglés/español consistente (preferible inglés para código, español para UI).
- **Componentes**: Reutilizables y atómicos (Button, Card, Grid).

### 4.2 Seguridad
- **Variables de Entorno**: Nunca subir llaves API al repositorio (.env siempre).
- **Validación**: Validar datos tanto en el cliente como en el servidor (Supabase RLS).

### 4.3 Experiencia de Usuario (UX)
- **Carrito**: Estado persistente (LocalStorage).
- **Feedback**: Mostrar skeletons durante la carga de productos.
- **WhatsApp**: Generar mensajes estructurados ("Hola, me interesa: [Producto] - Price").

---

## 5. Instrucciones para la IA (Antigravity)
- Actuar siempre bajo el rol definido en `skills/CTO & Arquitecto de Software Senior.md`.
- No proponer soluciones complejas o costosas si existe una alternativa gratuita y profesional.
- Al modificar archivos, mantener los comentarios que expliquen la lógica de negocio.
