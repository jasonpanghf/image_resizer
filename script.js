// JavaScript for Batch Image Resizer

// Grab DOM elements
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const formatSelect = document.getElementById('format');
const lockAspect = document.getElementById('lock-aspect');
const autoRename = document.getElementById('auto-rename');
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const outputList = document.getElementById('output-list');

// Prevent default drag behaviors
['dragenter','dragover','dragleave','drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

// Also allow clicking the drop area to select files
dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFiles);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files } });
}

function handleFiles(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Clear previous outputs
    outputList.innerHTML = '';
    [...files].forEach(file => processFile(file));
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            resizeImage(img, file);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function resizeImage(img, file) {
    // Parse desired width and height
    const targetWidth = parseInt(widthInput.value) || img.width;
    const targetHeight = parseInt(heightInput.value) || img.height;
    let newWidth, newHeight;
    if (lockAspect.checked) {
        // Preserve aspect ratio within bounding box
        const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
        newWidth = Math.round(img.width * scale);
        newHeight = Math.round(img.height * scale);
    } else {
        newWidth = targetWidth;
        newHeight = targetHeight;
    }
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    const format = formatSelect.value;
    // Determine MIME type based on selected format
    let mimeType;
    switch (format) {
        case 'jpeg':
        case 'jpg':
            mimeType = 'image/jpeg';
            break;
        case 'png':
            mimeType = 'image/png';
            break;
        case 'webp':
            mimeType = 'image/webp';
            break;
        default:
            mimeType = 'image/png';
    }
    canvas.toBlob(function(blob) {
        // Generate file name
        const newName = generateFileName(file.name, newWidth, newHeight, format);
        // Create a download link
        const url = URL.createObjectURL(blob);
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = url;
        link.download = newName;
        link.textContent = newName;
        li.appendChild(link);
        outputList.appendChild(li);
    }, mimeType, format === 'jpeg' ? 0.9 : 1.0);
}

function generateFileName(originalName, width, height, format) {
    const ext = format === 'jpeg' ? 'jpg' : format;
    // Remove existing extension
    const nameParts = originalName.split('.');
    nameParts.pop();
    const baseName = nameParts.join('.');
    if (autoRename.checked) {
        // Create a more descriptive name using a timestamp
        const timestamp = Date.now();
        return `${baseName}_resized_${width}x${height}_${timestamp}.${ext}`;
    } else {
        return `${baseName}_resized.${ext}`;
    }
}