#!/usr/bin/env node

/**
 * minify.js - Script simple para minificar CSS y JS
 * Uso: node minify.js
 */

const fs = require('fs');
const path = require('path');

// Directorios
const CSS_DIR = './css';
const JS_DIR = './js';
const OUTPUT_DIR = './dist';

// Crear directorio de salida si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'css'), { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'js'), { recursive: true });
}

// Función simple para minificar CSS
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Eliminar comentarios
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
    .replace(/\s*([{}:;,])\s*/g, '$1') // Eliminar espacios alrededor de caracteres especiales
    .replace(/;\}/g, '}') // Eliminar punto y coma antes de cerrar llave
    .trim();
}

// Función simple para minificar JS
function minifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // Eliminar comentarios de bloque
    .replace(/\/\/.*$/gm, '') // Eliminar comentarios de línea
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
    .replace(/\s*([{}();,:<>=+\-*\/&|!])\s*/g, '$1') // Eliminar espacios alrededor de operadores
    .trim();
}

// Minificar archivos CSS
const cssFiles = [
  'base.css',
  'header.css',
  'hero.css',
  'catalog.css',
  'cart.css',
  'modal.css',
  'footer.css',
  'admin.css',
  'admin-components.css',
  'admin-modals.css'
];

console.log('🎨 Minificando archivos CSS...');
cssFiles.forEach(file => {
  const inputPath = path.join(CSS_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, 'css', file.replace('.css', '.min.css'));

  if (fs.existsSync(inputPath)) {
    const content = fs.readFileSync(inputPath, 'utf8');
    const minified = minifyCSS(content);
    fs.writeFileSync(outputPath, minified, 'utf8');
    const originalSize = Buffer.byteLength(content, 'utf8');
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
    console.log(`  ✅ ${file}: ${originalSize} → ${minifiedSize} bytes (${reduction}% reducción)`);
  } else {
    console.log(`  ⚠️  ${file}: No encontrado`);
  }
});

// Minificar archivos JS
const jsFiles = [
  'core/supabase-client.js',
  'core/brand-config.js',
  'core/utils.js',
  'core/theme-toggle.js',
  'services/config.service.js',
  'services/product.service.js',
  'services/category.service.js',
  'services/storage.service.js',
  'ui/toast.js',
  'ui/cart.js',
  'ui/catalog-ui.js',
  'ui/confirm-modal.js',
  'ui/image-upload.js',
  'catalog/catalog-modal.js',
  'app.js',
  'admin/admin-auth.js',
  'admin/admin-ui.js',
  'admin/admin-inventory.js',
  'admin/admin-editor.js',
  'admin/admin-categories.js',
  'admin/admin-settings.js',
  'admin.js'
];

console.log('\n📜 Minificando archivos JS...');
jsFiles.forEach(file => {
  const inputPath = path.join(JS_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, 'js', file.replace('.js', '.min.js'));

  if (fs.existsSync(inputPath)) {
    const content = fs.readFileSync(inputPath, 'utf8');
    const minified = minifyJS(content);
    fs.writeFileSync(outputPath, minified, 'utf8');
    const originalSize = Buffer.byteLength(content, 'utf8');
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
    console.log(`  ✅ ${file}: ${originalSize} → ${minifiedSize} bytes (${reduction}% reducción)`);
  } else {
    console.log(`  ⚠️  ${file}: No encontrado`);
  }
});

console.log('\n✨ Minificación completada! Archivos guardados en ./dist/');
console.log('\n📝 Para usar los archivos minificados, actualiza los enlaces en index.html y admin.html:');
console.log('   <link rel="stylesheet" href="dist/css/base.min.css">');
console.log('   <script src="dist/js/app.min.js"></script>');
