/**
 * image-upload.js — Zona de Drag & Drop con vista previa.
 *
 * @param {Object} ids - IDs de los elementos del DOM
 * @returns {{ getFile: () => File|null, reset: () => void }}
 */
function initImageUpload({ dropAreaId, fileInputId, previewImgId, uploadInnerId, uploadPreviewId }) {
  const dropArea      = document.getElementById(dropAreaId);
  const fileInput     = document.getElementById(fileInputId);
  const previewImg    = document.getElementById(previewImgId);
  const uploadInner   = document.getElementById(uploadInnerId);
  const uploadPreview = document.getElementById(uploadPreviewId);

  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadInner.classList.add('hidden');
      uploadPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function reset() {
    fileInput.value = '';
    previewImg.src  = '';
    uploadInner.classList.remove('hidden');
    uploadPreview.classList.add('hidden');
  }

  dropArea.addEventListener('click',     () => fileInput.click());
  dropArea.addEventListener('dragover',  (e) => { e.preventDefault(); dropArea.classList.add('dragover'); });
  dropArea.addEventListener('dragleave', ()  => dropArea.classList.remove('dragover'));
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      showPreview(file);
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showPreview(file);
  });

  return {
    getFile: () => fileInput.files[0] ?? null,
    reset,
  };
}
