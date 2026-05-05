const el = (id) => document.getElementById(id);

const ui = {
  file: el('file'),
  fileInfo: el('fileInfo'),
  needle: el('needle'),
  caseSensitive: el('caseSensitive'),
  useRegex: el('useRegex'),
  invert: el('invert'),
  maxLines: el('maxLines'),
  btnFilter: el('btnFilter'),
  btnClear: el('btnClear'),
  btnDownload: el('btnDownload'),
  btnCopy: el('btnCopy'),
  btnExportCookie: el('btnExportCookie'),
  out: el('out'),
  preview: el('preview'),
  stats: el('stats'),
};

let fileText = '';
let lastResultText = '';

function escapePreview(s) {
  // No HTML injection risk in <pre> textContent, but keep function for clarity.
  return s;
}

function setStats(msg) {
  ui.stats.textContent = msg;
}

function detectLineEnding(text) {
  // Prefer original ending style for downloads.
  const hasCRLF = text.includes('\r\n');
  return hasCRLF ? '\r\n' : '\n';
}

function splitLines(text) {
  // Handle \n and \r\n
  return text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
}

function buildMatcher() {
  const needleRaw = ui.needle.value ?? '';
  const needle = needleRaw.toString();
  const invert = !!ui.invert.checked;

  if (!needle.trim()) {
    return { ok: false, error: 'Vui lòng nhập từ/cụm từ cần lọc.' };
  }

  if (ui.useRegex.checked) {
    try {
      const flags = ui.caseSensitive.checked ? 'g' : 'gi';
      const re = new RegExp(needle, flags);
      return {
        ok: true,
        test: (line) => {
          re.lastIndex = 0;
          const matched = re.test(line);
          return invert ? !matched : matched;
        },
        label: `Regex: /${needle}/${flags}${invert ? ' (invert)' : ''}`
      };
    } catch (e) {
      return { ok: false, error: 'Regex không hợp lệ: ' + (e?.message ?? e) };
    }
  }

  const n = ui.caseSensitive.checked ? needle : needle.toLowerCase();
  return {
    ok: true,
    test: (line) => {
      const hay = ui.caseSensitive.checked ? line : line.toLowerCase();
      const matched = hay.includes(n);
      return invert ? !matched : matched;
    },
    label: `Text contains: "${needle}"${ui.caseSensitive.checked ? ' (case-sensitive)' : ''}${invert ? ' (invert)' : ''}`
  };
}

function clearOutput() {
  ui.out.textContent = '';
  lastResultText = '';
  ui.btnDownload.disabled = true;
  ui.btnCopy.disabled = true;
  ui.btnExportCookie.disabled = true;
  setStats('—');
}

function filterNow() {
  if (!fileText) {
    alert('Vui lòng chọn file trước.');
    return;
  }

  const matcher = buildMatcher();
  if (!matcher.ok) {
    alert(matcher.error);
    return;
  }

  const maxLines = Math.max(1, parseInt(ui.maxLines.value || '2000', 10));

  const lines = splitLines(fileText);
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (matcher.test(line)) {
      matches.push(line);
      if (matches.length >= maxLines) break;
    }
  }

  const ending = detectLineEnding(fileText);
  lastResultText = matches.join(ending);
  ui.out.textContent = lastResultText;
  ui.btnDownload.disabled = matches.length === 0;
  ui.btnCopy.disabled = matches.length === 0;
  ui.btnExportCookie.disabled = matches.length === 0;

  const total = lines.length;
  const shown = matches.length;
  const capped = (shown >= maxLines) ? ` (đã chạm giới hạn ${maxLines})` : '';
  setStats(`${matcher.label} • Dòng trong file: ${total} • Kết quả: ${shown}${capped}`);
}

function downloadResult() {
  if (!lastResultText) return;
  const blob = new Blob([lastResultText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filtered-lines.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyResult() {
  if (!lastResultText) return;
  navigator.clipboard.writeText(lastResultText)
    .then(() => alert('Đã copy kết quả vào clipboard!'))
    .catch(err => alert('Lỗi khi copy: ' + err));
}

function exportCookie() {
  if (!lastResultText) return;
  
  // Try to parse lines as JSON objects
  const lines = splitLines(lastResultText);
  const cookies = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    // Remove trailing commas if any from weird JSON formats
    let cleanLine = line.trim();
    if (cleanLine.endsWith(',')) {
      cleanLine = cleanLine.slice(0, -1);
    }
    
    try {
      const obj = JSON.parse(cleanLine);
      if (obj && typeof obj === 'object') {
        cookies.push(obj);
      }
    } catch (e) {
      console.warn('Bỏ qua dòng không phải JSON hợp lệ:', line);
    }
  }
  
  if (cookies.length === 0) {
    alert('Không tìm thấy cookie JSON hợp lệ nào trong kết quả.');
    return;
  }
  
  // Default URL or we could try to guess from the first cookie host
  let url = 'https://www.facebook.com'; 
  const needle = ui.needle.value ? ui.needle.value.toLowerCase() : '';
  if (needle.includes('instagram')) url = 'https://www.instagram.com';
  else if (needle.includes('google') || needle.includes('gmail')) url = 'https://myaccount.google.com';
  else if (needle.includes('tiktok')) url = 'https://www.tiktok.com';
  
  const exportFormat = {
    url: url,
    cookies: cookies
  };
  
  const jsonStr = JSON.stringify(exportFormat, null, 2);
  
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'exported-cookies.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}

async function readSelectedFile(file) {
  // Guard: huge files can freeze browser; warn above some threshold
  const MB = 1024 * 1024;
  if (file.size > 25 * MB) {
    const ok = confirm(`File ~${(file.size / MB).toFixed(1)}MB. Trình duyệt có thể chậm/treo. Vẫn đọc?`);
    if (!ok) return;
  }

  const text = await file.text();
  fileText = text;

  ui.fileInfo.textContent = `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;

  const lines = splitLines(text);
  const previewLines = lines.slice(0, 60).join('\n');
  ui.preview.textContent = escapePreview(previewLines || '(file trống)');

  clearOutput();
  setStats(`Đã tải file. Tổng dòng: ${lines.length}`);
}

ui.file.addEventListener('change', async () => {
  const file = ui.file.files?.[0];
  if (!file) return;
  try {
    await readSelectedFile(file);
  } catch (e) {
    console.error(e);
    alert('Không đọc được file.');
  }
});

ui.btnFilter.addEventListener('click', () => filterNow());
ui.btnClear.addEventListener('click', () => clearOutput());
ui.btnDownload.addEventListener('click', () => downloadResult());
ui.btnCopy.addEventListener('click', () => copyResult());
ui.btnExportCookie.addEventListener('click', () => exportCookie());

ui.needle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') filterNow();
});
