const $ = id => document.getElementById(id);
let contracts = [];
let parties = [];
const statusLabel = { draft: 'Bản nháp', review: 'Đang duyệt', active: 'Đang hiệu lực', completed: 'Hoàn thành', expired: 'Hết hạn', terminated: 'Đã chấm dứt' };
const typeLabel = { service: 'Dịch vụ', purchase: 'Mua hàng', sales: 'Bán hàng', employment: 'Lao động', lease: 'Thuê', nda: 'Bảo mật', other: 'Khác' };
const partyLabel = { customer: 'Khách hàng', supplier: 'Nhà cung cấp', partner: 'Đối tác', other: 'Khác' };
const pages = {
  dashboard: ['Tổng quan', 'WORKSPACE / TỔNG QUAN', 'Toàn cảnh hợp đồng và các mốc cần lưu ý.'],
  contracts: ['Hợp đồng', 'WORKSPACE / HỢP ĐỒNG', 'Tìm kiếm, lọc trạng thái và cập nhật hồ sơ hợp đồng.'],
  parties: ['Đối tác', 'WORKSPACE / ĐỐI TÁC', 'Quản lý thông tin khách hàng, nhà cung cấp và đối tác.']
};
const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = value => value ? new Date(value + 'T00:00:00').toLocaleDateString('vi-VN') : '—';

function showLogin(message = '') {
  $('workspace').hidden = true;
  $('login-screen').hidden = false;
  $('login-error').textContent = message;
  if (message) $('login-password').focus();
}

function showWorkspace(username) {
  $('login-screen').hidden = true;
  $('workspace').hidden = false;
  $('current-user').textContent = username;
  $('user-avatar').textContent = username.slice(0, 1).toLocaleUpperCase('vi');
  showView(location.hash.slice(1) || 'dashboard');
}

function showView(name) {
  const view = pages[name] ? name : 'dashboard';
  document.querySelectorAll('[data-page]').forEach(section => section.classList.toggle('active', section.dataset.page === view));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
  $('page-title').textContent = pages[view][0];
  $('page-eyebrow').textContent = pages[view][1];
  $('page-description').textContent = pages[view][2];
  $('new-contract').hidden = view !== 'contracts';
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) {
    let result = {};
    try { result = await response.json(); } catch {}
    if (response.status === 401 && !url.startsWith('/api/auth/')) showLogin();
    throw new Error(result.error || 'Có lỗi xảy ra');
  }
  return response.status === 204 ? null : response.json();
}

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 2600);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

async function load() {
  try {
    const [dashboard, contractRows, partyRows] = await Promise.all([
      api('/api/dashboard'), api('/api/contracts'), api('/api/parties')
    ]);
    contracts = contractRows;
    parties = partyRows;
    $('total').textContent = dashboard.total;
    $('value').textContent = money(dashboard.totalValue);
    $('expiring').textContent = dashboard.expiringSoon;
    $('party-count').textContent = dashboard.parties;
    renderStatus(dashboard.byStatus, dashboard.total);
    renderContracts();
    renderParties();
    fillPartySelect();
  } catch (error) {
    if (error.message !== 'Phiên đăng nhập đã hết hạn') toast(error.message);
  }
}

function renderStatus(rows, total) {
  const counts = Object.fromEntries(rows.map(row => [row.status, row.total]));
  $('status-list').innerHTML = Object.entries(statusLabel).map(([status, label]) => {
    const count = counts[status] || 0;
    const percent = total ? Math.round(count / total * 100) : 0;
    return `<div class="status-row"><span class="status-name"><i class="status-mark status-${status}"></i>${label}</span><span class="status-track"><i style="width:${percent}%"></i></span><b>${count}</b></div>`;
  }).join('');
}

function renderContracts() {
  const searchTerm = $('search').value.toLocaleLowerCase('vi');
  const selectedStatus = $('status-filter').value;
  const rows = contracts.filter(contract => (!selectedStatus || contract.status === selectedStatus) &&
    [contract.contract_code, contract.title, contract.party_name].some(value => String(value || '').toLocaleLowerCase('vi').includes(searchTerm)));
  $('contract-rows').innerHTML = rows.length ? rows.map(contract => `<tr>
    <td class="code">${esc(contract.contract_code)}</td><td class="title-cell" title="${esc(contract.title)}">${esc(contract.title)}</td>
    <td>${esc(contract.party_name || '—')}</td><td>${money(contract.value)}</td><td>${date(contract.end_date)}</td>
    <td><span class="badge status-${contract.status}">${statusLabel[contract.status] || contract.status}</span></td>
    <td><button class="action" data-edit="${contract.id}">Sửa</button><button class="action" data-delete="${contract.id}">Xóa</button></td>
  </tr>`).join('') : '<tr><td colspan="7" class="empty">Không có hợp đồng phù hợp</td></tr>';
  $('table-foot').textContent = `Hiển thị ${rows.length} / ${contracts.length} hợp đồng`;
}

function renderParties() {
  $('party-rows').innerHTML = parties.length ? parties.map(party => `<tr>
    <td class="title-cell">${esc(party.name)}</td><td>${partyLabel[party.party_type] || party.party_type}</td>
    <td>${esc(party.email || '—')}</td><td>${esc(party.phone || '—')}</td><td>${esc(party.tax_code || '—')}</td>
    <td><button class="action" data-party-delete="${party.id}">Xóa</button></td>
  </tr>`).join('') : '<tr><td colspan="6" class="empty">Chưa có đối tác</td></tr>';
}

function fillPartySelect() {
  $('contract-party').innerHTML = '<option value="">Chưa chọn</option>' + parties.map(party => `<option value="${party.id}">${esc(party.name)}</option>`).join('');
}

function resetContract() {
  $('contract-form').reset();
  $('contract-id').value = '';
  $('contract-code').disabled = false;
  $('contract-value').value = '0';
  $('contract-dialog-title').textContent = 'Tạo hợp đồng';
  $('form-error').textContent = '';
}

function editContract(id) {
  const contract = contracts.find(item => String(item.id) === String(id));
  if (!contract) return;
  resetContract();
  $('contract-dialog-title').textContent = 'Cập nhật hợp đồng';
  $('contract-id').value = contract.id;
  $('contract-code').value = contract.contract_code;
  $('contract-code').disabled = true;
  $('contract-title').value = contract.title;
  $('contract-party').value = contract.party_id || '';
  $('contract-type').value = contract.contract_type;
  $('contract-status').value = contract.status;
  $('contract-value').value = contract.value;
  $('start-date').value = contract.start_date?.slice(0, 10) || '';
  $('end-date').value = contract.end_date?.slice(0, 10) || '';
  $('owner-name').value = contract.owner_name || '';
  $('currency').value = contract.currency || 'VND';
  $('contract-description').value = contract.description || '';
  $('contract-dialog').showModal();
}

async function startSession() {
  try {
    const result = await api('/api/auth/session');
    showWorkspace(result.user.username);
    await load();
  } catch {
    showLogin();
  }
}

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('login-error').textContent = '';
  const username = $('login-username').value.trim();
  const password = $('login-password').value;
  try {
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    $('login-password').value = '';
    showWorkspace(result.user.username);
    await load();
  } catch (error) {
    $('login-error').textContent = error.message;
  }
});

$('logout-button').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST' }); } finally { showLogin(); }
});

document.querySelectorAll('[data-view]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const view = link.dataset.view;
  history.replaceState(null, '', `#${view}`);
  showView(view);
}));
window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
$('new-contract').addEventListener('click', () => { resetContract(); $('contract-dialog').showModal(); });
$('refresh').addEventListener('click', load);
$('refresh-contracts').addEventListener('click', load);
$('search').addEventListener('input', renderContracts);
$('status-filter').addEventListener('change', renderContracts);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));

$('contract-rows').addEventListener('click', async event => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  if (editButton) editContract(editButton.dataset.edit);
  if (deleteButton && confirm('Xóa hợp đồng này?')) {
    try { await api('/api/contracts/' + deleteButton.dataset.delete, { method: 'DELETE' }); toast('Đã xóa hợp đồng'); await load(); }
    catch (error) { toast(error.message); }
  }
});

$('contract-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('form-error').textContent = '';
  const id = $('contract-id').value;
  const body = {
    contract_code: $('contract-code').value, title: $('contract-title').value, party_id: $('contract-party').value || null,
    contract_type: $('contract-type').value, status: $('contract-status').value, value: Number($('contract-value').value || 0),
    start_date: $('start-date').value || null, end_date: $('end-date').value || null, owner_name: $('owner-name').value,
    currency: $('currency').value, description: $('contract-description').value
  };
  try {
    await api(id ? '/api/contracts/' + id : '/api/contracts', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    $('contract-dialog').close();
    toast(id ? 'Đã cập nhật hợp đồng' : 'Đã tạo hợp đồng');
    await load();
  } catch (error) { $('form-error').textContent = error.message; }
});

$('new-party').addEventListener('click', () => { $('party-form').reset(); $('party-error').textContent = ''; $('party-dialog').showModal(); });
$('party-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await api('/api/parties', { method: 'POST', body: JSON.stringify({
      name: $('party-name').value, party_type: $('party-type').value, email: $('party-email').value,
      phone: $('party-phone').value, tax_code: $('party-tax').value, address: $('party-address').value
    }) });
    $('party-dialog').close();
    toast('Đã thêm đối tác');
    await load();
  } catch (error) { $('party-error').textContent = error.message; }
});

$('party-rows').addEventListener('click', async event => {
  const button = event.target.closest('[data-party-delete]');
  if (button && confirm('Xóa đối tác? Hợp đồng liên quan sẽ giữ lại nhưng bỏ liên kết.')) {
    try { await api('/api/parties/' + button.dataset.partyDelete, { method: 'DELETE' }); toast('Đã xóa đối tác'); await load(); }
    catch (error) { toast(error.message); }
  }
});

startSession();
