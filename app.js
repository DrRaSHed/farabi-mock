// Configuration: set your Cloudflare Worker endpoint here.
// The worker should implement the API described in the documentation.
const WORKER_URL = "https://YOUR-WORKER-URL.workers.dev";
const API_KEY = "YOUR_API_KEY";

// Helper function to render patient details and services
function renderPatient(fileNo, data) {
  const resultsDiv = document.getElementById('results');
  // Clear existing content
  resultsDiv.innerHTML = '';
  if (!data) {
    resultsDiv.textContent = 'لا يوجد ملف بهذا الرقم.';
    return;
  }
  // Patient header
  const header = document.createElement('div');
  header.innerHTML = `<strong>اسم المريض:</strong> ${data.patient_name_ar || ''} &nbsp;&nbsp; <strong>تاريخ انتهاء البوليصة:</strong> ${data.policy_expiry || ''}`;
  resultsDiv.appendChild(header);

  // Services table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>التاريخ</th><th>السن</th><th>اسم الخدمة</th><th>قيمة الخدمة</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  (data.services || []).forEach(svc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${svc.date}</td><td>${svc.tooth}</td><td>${svc.service_name}</td><td>${svc.service_price}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  resultsDiv.appendChild(table);

  // Add service form
  const form = document.createElement('div');
  form.className = 'add-form';
  form.innerHTML = `
    <h3>إضافة خدمة جديدة</h3>
    <label>السن:
      <input id="toothInput" type="text" placeholder="اختياري">
    </label>
    <label>اسم الخدمة:
      <input id="serviceNameInput" type="text" required placeholder="اسم الخدمة">
    </label>
    <label>قيمة الخدمة:
      <input id="servicePriceInput" type="number" required placeholder="قيمة الخدمة">
    </label>
    <label>ملاحظات:
      <textarea id="notesInput" rows="2" placeholder="ملاحظات إضافية"></textarea>
    </label>
    <button id="addServiceBtn">إضافة</button>
    <div id="msg"></div>
  `;
  resultsDiv.appendChild(form);
  // Attach click handler for Add
  document.getElementById('addServiceBtn').onclick = async () => {
    const tooth = document.getElementById('toothInput').value.trim();
    const serviceName = document.getElementById('serviceNameInput').value.trim();
    const servicePrice = document.getElementById('servicePriceInput').value.trim();
    const notes = document.getElementById('notesInput').value.trim();
    const msgDiv = document.getElementById('msg');
    if (!serviceName || !servicePrice) {
      msgDiv.textContent = 'يرجى إدخال اسم الخدمة وقيمتها.';
      msgDiv.className = 'error';
      return;
    }
    // Prepare payload for worker
    const payload = {
      file_no: fileNo,
      patient_name_ar: data.patient_name_ar || '',
      tooth: tooth,
      service_name: serviceName,
      service_price: servicePrice,
      policy_expiry: data.policy_expiry || '',
      notes: notes,
    };
    try {
      const resp = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        msgDiv.textContent = `حدث خطأ: ${txt}`;
        msgDiv.className = 'error';
        return;
      }
      // Locally update table for immediate feedback
      data.services = data.services || [];
      data.services.push({
        date: new Date().toLocaleDateString('ar-EG'),
        tooth: tooth,
        service_name: serviceName,
        service_price: servicePrice,
      });
      renderPatient(fileNo, data);
      msgDiv.textContent = 'تم إضافة الخدمة بنجاح!';
      msgDiv.className = 'message';
    } catch (err) {
      msgDiv.textContent = 'فشل الاتصال بالخادم. تأكد من ضبط WORKER_URL.';
      msgDiv.className = 'error';
    }
  };
}

// Search button handler
document.getElementById('searchBtn').onclick = () => {
  const fileNo = document.getElementById('fileNo').value.trim();
  const data = patientData[fileNo];
  renderPatient(fileNo, data);
};