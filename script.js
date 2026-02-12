/* ===========================
   STORAGE
=========================== */
const Storage = {
    get: (key) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : (key === 'customLabels' ? null : []);
        } catch {
            return (key === 'customLabels' ? null : []);
        }
    },
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    add: (key, item) => {
        const data = Array.isArray(Storage.get(key)) ? Storage.get(key) : [];
        data.push(item);
        Storage.set(key, data);
    }
};

/* ===========================
   AUTH
=========================== */
const Auth = {
    user: JSON.parse(localStorage.getItem('currentUser') || 'null'),

    login: () => {
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();
        const role = document.getElementById('roleInput')?.value;

        if (!username || !password) return alert('يرجى إدخال اسم المستخدم وكلمة المرور');

        if (role === 'beneficiary') {
            if (password !== '123') return alert('كلمة المرور غير صحيحة');
            const beneficiaries = Storage.get('beneficiaries') || [];
            const ben = beneficiaries.find(b => b.identity === username);
            if (!ben) return alert('رقم الهوية غير مسجل في النظام');
            const sessionUser = { id: ben.id, name: ben.name, username: ben.identity, role: 'beneficiary' };
            localStorage.setItem('currentUser', JSON.stringify(sessionUser));
            Auth.user = sessionUser;
            return window.location.href = 'beneficiary_home.html';
        }

        const users = Storage.get('users') || [];
        const user = users.find(u => u.username === username && u.password === password && u.role === role);
        if (!user) return alert('بيانات الدخول غير صحيحة!');
        localStorage.setItem('currentUser', JSON.stringify(user));
        Auth.user = user;
        if (user.role === 'admin') return window.location.href = 'index.html';
        if (user.role === 'merchant') return window.location.href = 'merchant_home.html';
    },

    logout: () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    setRole: (role) => {
        const hidden = document.getElementById('roleInput');
        if (hidden) hidden.value = role;
        document.querySelectorAll('.role-option').forEach(el => el.classList.remove('active'));
        document.getElementById(`role_${role}`)?.classList.add('active');

        const userIcon = document.querySelector('label i.fa-user');
        const userInput = document.getElementById('username');
        if (userIcon) {
            const labelContainer = userIcon.parentElement;
            const textSpan = labelContainer.querySelector('span') || labelContainer.querySelector('.label-text') || labelContainer;
            if (role === 'beneficiary') {
                if (textSpan) textSpan.textContent = ' رقم الهوية';
                if (userInput) userInput.placeholder = 'أدخل رقم الهوية (مثلاً: 1010101010)';
            } else {
                if (textSpan) textSpan.textContent = ' اسم المستخدم';
                if (userInput) userInput.placeholder = 'أدخل اسم المستخدم';
            }
        }
    },

    checkSession: () => {
        const page = (window.location.pathname || '').split('/').pop() || '';
        if (page === 'login.html') {
            if (Auth.user) {
                if (Auth.user.role === 'admin') return window.location.href = 'index.html';
                if (Auth.user.role === 'merchant') return window.location.href = 'merchant_home.html';
                if (Auth.user.role === 'beneficiary') return window.location.href = 'beneficiary_home.html';
            }
            return;
        }

        if (!Auth.user) return window.location.href = 'login.html';

        if (!Auth.user) return window.location.href = 'login.html';

        // Pages restricted to ADMIN only (Merchants can access POS/Reports/Orders)
        const strictAdminPages = ['index.html', 'cards.html', 'wallets.html', 'merchants.html', 'settings.html', 'users.html'];

        if (Auth.user.role === 'merchant') {
            // Allow: merchant_home.html, pos.html, reports.html, orders.html
            // Block: strictAdminPages
            if (strictAdminPages.includes(page)) return window.location.href = 'merchant_home.html';
        }

        // Allow beneficiaries to access support.html
        if (Auth.user.role === 'beneficiary' && page !== 'beneficiary_home.html' && page !== 'support.html')
            return window.location.href = 'beneficiary_home.html';

        Auth.addLogoutButton();
    },

    addLogoutButton: () => {
        const sidebar = document.querySelector('.nav-links');
        if (sidebar && !document.getElementById('logoutBtn')) {
            const li = document.createElement('li');
            li.style.marginTop = '20px';
            li.style.borderTop = '1px solid #eee';
            li.innerHTML = `<a href="#" id="logoutBtn" onclick="Auth.logout()"><i class="fas fa-sign-out-alt"></i> تسجيل خروج</a>`;
            sidebar.appendChild(li);
        }
        const profileName = document.querySelector('.user-profile span');
        if (profileName && Auth.user) {
            profileName.innerText = `مرحباً، ${Auth.user.name}`;
        }
    }
};

/* ===========================
   INITIAL DATA
=========================== */
function initData() {
    if (localStorage.getItem('users') === null) {
        Storage.set('users', [
            { id: 1, name: 'مدير النظام', username: 'admin', password: '123', role: 'admin' },
            { id: 2, name: 'تاجر السوبرماركت', username: 'merchant', password: '123', role: 'merchant' }
        ]);
    }
    if (localStorage.getItem('cards') === null) {
        Storage.set('cards', [
            { id: 1, number: '10001', balance: 500, status: 'نشط', wallet: 'إعانة غذائية', beneficiary: 'محمد أحمد' },
            { id: 2, number: '10002', balance: 1500, status: 'نشط', wallet: 'دعم كساء', beneficiary: 'سارة خالد' },
            { id: 3, number: '10003', balance: 0, status: 'موقوف', wallet: 'خدمات عامة', beneficiary: 'غير محدد' }
        ]);
    }
    if (localStorage.getItem('wallets') === null) {
        Storage.set('wallets', [
            { id: 1, name: 'إعانة غذائية', funds: 5000, merchants: 'سوبرماركت الرياض', status: 'نشط' },
            { id: 2, name: 'دعم كساء', funds: 2000, merchants: 'متجر الملابس العصرية', status: 'نشط' }
        ]);
    }
    if (localStorage.getItem('merchants') === null) {
        Storage.set('merchants', [
            { id: 101, name: 'سوبرماركت الرياض', category: 'مواد غذائية', transactions: 12, status: 'نشط' },
            { id: 201, name: 'متجر الملابس العصرية', category: 'ملابس', transactions: 5, status: 'نشط' }
        ]);
    }
    if (localStorage.getItem('transactions') === null) {
        Storage.set('transactions', [
            { id: 101, card: '10001', amount: 50, date: '2023-10-25', merchant: 'سوبرماركت الرياض' },
            { id: 102, card: '10002', amount: 200, date: '2023-10-26', merchant: 'متجر الملابس العصرية' }
        ]);
    }
    if (localStorage.getItem('customLabels') === null) {
        Storage.set('customLabels', {
            label_cards: 'البطاقات',
            label_wallets: 'المحافظ',
            label_merchants: 'المتاجر',
            label_beneficiaries: 'المستفيدين'
        });
    }
    if (localStorage.getItem('categories') === null) {
        Storage.set('categories', ['إعانة غذائية', 'دعم كساء', 'خدمات عامة']);
    }
    if (localStorage.getItem('beneficiaries') === null) {
        Storage.set('beneficiaries', [
            { id: 1, name: 'محمد أحمد', identity: '1010101010' },
            { id: 2, name: 'سارة خالد', identity: '2020202020' }
        ]);
    }
}

/* ===========================
   SETTINGS
=========================== */
const Settings = {
    labels: {},

    load: () => {
        Settings.labels = Storage.get('customLabels') || {
            label_cards: 'البطاقات',
            label_wallets: 'المحافظ',
            label_merchants: 'المتاجر',
            label_beneficiaries: 'المستفيدين'
        };
        Settings.applyLabels();

        // Load layout setting
        const layout = localStorage.getItem('layoutMode') || 'side';
        if (window.location.pathname.includes('settings.html')) {
            const radio = document.querySelector(`input[name="layoutMode"][value="${layout}"]`);
            if (radio) radio.checked = true;

            document.getElementById('label_cards').value = Settings.labels.label_cards;
            document.getElementById('label_wallets').value = Settings.labels.label_wallets;
            document.getElementById('label_merchants').value = Settings.labels.label_merchants;
            document.getElementById('label_beneficiaries').value = Settings.labels.label_beneficiaries;
            Settings.renderCategories();
            Settings.renderBeneficiaries();
        }
        Settings.populateDropdowns();
    },

    saveLayout: (mode) => {
        localStorage.setItem('layoutMode', mode);
        Settings.applyLayout();
    },

    applyLayout: () => {
        const mode = localStorage.getItem('layoutMode') || 'side';
        if (mode === 'top') {
            document.body.classList.add('layout-top');
        } else {
            document.body.classList.remove('layout-top');
        }
    },

    saveLabels: () => {
        const newLabels = {
            label_cards: document.getElementById('label_cards').value || 'البطاقات',
            label_wallets: document.getElementById('label_wallets').value || 'المحافظ',
            label_merchants: document.getElementById('label_merchants').value || 'المتاجر',
            label_beneficiaries: document.getElementById('label_beneficiaries').value || 'المستفيدين'
        };
        Storage.set('customLabels', newLabels);
        alert('تم حفظ التسميات بنجاح!');
        location.reload();
    },

    applyLabels: () => {
        const labels = Settings.labels || {};
        if (labels.label_cards) document.querySelectorAll('[data-i18n="nav_cards"]').forEach(el => el.innerHTML = `<i class="fas fa-credit-card"></i> ${labels.label_cards}`);
        if (labels.label_wallets) document.querySelectorAll('[data-i18n="nav_wallets"]').forEach(el => el.innerHTML = `<i class="fas fa-wallet"></i> ${labels.label_wallets}`);
        if (labels.label_merchants) document.querySelectorAll('[data-i18n="nav_merchants"]').forEach(el => el.innerHTML = `<i class="fas fa-store"></i> ${labels.label_merchants}`);
        document.querySelectorAll('[data-i18n="nav_settings"]').forEach(el => el.innerHTML = `<i class="fas fa-cog"></i> الإعدادات`);

        const pageTitle = document.querySelector('h1[data-i18n]');
        if (pageTitle) {
            const key = pageTitle.getAttribute('data-i18n');
            if (key === 'page_cards_title') pageTitle.innerHTML = `<i class="fas fa-credit-card"></i> إدارة ${labels.label_cards}`;
            if (key === 'page_wallets_title') pageTitle.innerHTML = `<i class="fas fa-wallet"></i> إدارة ${labels.label_wallets}`;
            if (key === 'page_merchants_title') pageTitle.innerHTML = `<i class="fas fa-store"></i> إدارة ${labels.label_merchants}`;
        }
    },

    addCategory: () => {
        const input = document.getElementById('newCategoryInput');
        const val = (input?.value || '').trim();
        if (!val) return;
        Storage.add('categories', val);
        input.value = '';
        Settings.renderCategories();
    },

    deleteCategory: (index) => {
        const cats = Storage.get('categories') || [];
        cats.splice(index, 1);
        Storage.set('categories', cats);
        Settings.renderCategories();
    },

    populateDropdown: (type, selectElement) => {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">-- اختر --</option>';
        if (type === 'merchants') {
            const merchants = Storage.get('merchants') || [];
            merchants.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.text = m.name;
                selectElement.appendChild(opt);
            });
        } else if (type === 'beneficiaries') {
            const beneficiaries = Storage.get('beneficiaries') || [];
            beneficiaries.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.name;
                opt.text = b.name;
                selectElement.appendChild(opt);
            });
        }
    },

    renderCategories: () => {
        const list = document.getElementById('categoriesList');
        if (!list) return;
        const cats = Storage.get('categories') || [];
        list.innerHTML = '';
        cats.forEach((cat, idx) => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `<span>${cat}</span> <button class="delete-btn" onclick="Settings.deleteCategory(${idx})"><i class="fas fa-trash"></i></button>`;
            list.appendChild(li);
        });
    },

    addBeneficiary: () => {
        const name = document.getElementById('beneficiaryName').value;
        const id = document.getElementById('beneficiaryID').value;
        if (!name || !id) { alert('يرجى إدخال البيانات كاملة'); return; }
        Storage.add('beneficiaries', { id: Date.now(), name, identity: id });
        document.getElementById('beneficiaryName').value = '';
        document.getElementById('beneficiaryID').value = '';
        Settings.renderBeneficiaries();
        alert('تم إضافة المستفيد');
    },

    deleteBeneficiary: (id) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        let bens = Storage.get('beneficiaries') || [];
        bens = bens.filter(b => b.id !== id);
        Storage.set('beneficiaries', bens);
        Settings.renderBeneficiaries();
    },

    renderBeneficiaries: () => {
        const tbody = document.getElementById('beneficiariesTableBody');
        if (!tbody) return;
        const bens = Storage.get('beneficiaries') || [];
        const cards = Storage.get('cards') || [];
        tbody.innerHTML = '';
        bens.forEach(b => {
            const cardCount = cards.filter(c => c.beneficiary === b.name).length;
            tbody.innerHTML += `
        <tr>
          <td>${b.name}</td>
          <td>${b.identity}</td>
          <td>${cardCount} بطاقة</td>
          <td><button class="delete-btn" onclick="Settings.deleteBeneficiary(${b.id})"><i class="fas fa-trash"></i></button></td>
        </tr>`;
        });
    },

    populateDropdowns: () => {
        const walletSelect = document.getElementById('cardWalletInput');
        if (walletSelect) {
            const cats = Storage.get('categories') || [];
            walletSelect.innerHTML = '';
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.innerText = c;
                walletSelect.appendChild(opt);
            });
        }
        const benSelect = document.getElementById('cardBeneficiaryInput');
        if (benSelect) {
            const bens = Storage.get('beneficiaries') || [];
            benSelect.innerHTML = '<option value="">اختر مستفيد...</option>';
            bens.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.name; opt.innerText = `${b.name} (${b.identity})`;
                benSelect.appendChild(opt);
            });
        }
    },

    populateDropdown: (type, targetElement) => {
        const data = Storage.get(type) || [];
        targetElement.innerHTML = '<option value="">-- اختر --</option>';
        data.forEach(item => {
            const opt = document.createElement('option');
            if (type === 'merchants') {
                const val = item.name || item;
                opt.value = val; opt.innerText = val;
            } else if (type === 'beneficiaries') {
                opt.value = item.identity;
                opt.innerText = `${item.name} (${item.identity})`;
            }
            targetElement.appendChild(opt);
        });
    }
};

/* ===========================
   ACTIONS
=========================== */
const Actions = {
    addCard: () => {
        const number = document.getElementById('cardNumInput').value;
        const wallet = document.getElementById('cardWalletInput').value;
        const balance = parseFloat(document.getElementById('cardBalanceInput').value);
        const beneficiary = document.getElementById('cardBeneficiaryInput').value;
        if (!number || !wallet || isNaN(balance)) return alert('يرجى ملء جميع الحقول بشكل صحيح');

        Storage.add('cards', {
            id: Date.now(), number, wallet, balance, status: 'نشط', beneficiary: beneficiary || 'غير محدد'
        });
        alert('تم إصدار البطاقة بنجاح!');
        location.reload();
    },

    addWallet: () => {
        const name = document.getElementById('walletNameInput').value;
        const funds = parseFloat(document.getElementById('walletFundsInput').value);
        if (!name || isNaN(funds)) return alert('يرجى ملء جميع الحقول');
        Storage.add('wallets', { id: Date.now(), name, funds, merchants: 'غير محدد', status: 'نشط' });
        alert('تم إنشاء المحفظة بنجاح!');
        location.reload();
    },

    addMerchant: () => {
        const name = document.getElementById('merchantNameInput').value;
        const category = document.getElementById('merchantCatInput').value;
        if (!name) return alert('يرجى إدخال اسم المتجر');
        Storage.add('merchants', { id: Math.floor(Math.random() * 1000), name, category, transactions: 0, status: 'نشط' });
        alert('تم إضافة المتجر بنجاح!');
        location.reload();
    },

    saveUser: () => {
        const id = document.getElementById('editingUserId').value;
        const username = document.getElementById('newUsername').value.trim();
        const name = document.getElementById('newName').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const role = document.getElementById('newUserRole').value;
        const linkedEntity = document.getElementById('linkedEntitySelect').value;

        if (!username || !name || !password) return alert('يرجى تعبئة الحقول الأساسية');
        if ((role === 'merchant' || role === 'beneficiary') && !linkedEntity) return alert('يرجى اختيار الجهة المرتبطة بهذا الحساب');

        let users = Storage.get('users') || [];

        if (id) {
            // Edit Mode
            const index = users.findIndex(u => u.id == id);
            if (index !== -1) {
                users[index] = { ...users[index], name, username, password, role, linkedEntity };
                Storage.set('users', users);
                alert('تم تحديث بيانات المستخدم بنجاح');
            }
        } else {
            // Create Mode
            if (users.some(u => u.username === username)) return alert('اسم المستخدم مسجل مسبقاً');
            const newUser = { id: Date.now(), name, username, password, role, linkedEntity: linkedEntity || null };
            Storage.add('users', newUser);
            alert('تم إنشاء المستخدم بنجاح');
        }

        Actions.cancelEdit(); // Reset form
        location.reload();
    },

    editUser: (id) => {
        const users = Storage.get('users') || [];
        const user = users.find(u => u.id === id);
        if (!user) return;

        document.getElementById('editingUserId').value = user.id;
        document.getElementById('newUsername').value = user.username;
        document.getElementById('newName').value = user.name;
        document.getElementById('newPassword').value = user.password;

        const roleSelect = document.getElementById('newUserRole');
        roleSelect.value = user.role;

        // Trigger population
        const entitySelect = document.getElementById('linkedEntitySelect');
        if (user.role === 'merchant') Settings.populateDropdown('merchants', entitySelect);
        else if (user.role === 'beneficiary') Settings.populateDropdown('beneficiaries', entitySelect);
        else entitySelect.innerHTML = '<option value="">-- غير مرتبط --</option>';

        // Set value after population (timeout to let DOM update if needed, though redundant with sync code)
        setTimeout(() => {
            entitySelect.value = user.linkedEntity || '';
        }, 50);

        document.getElementById('saveUserBtn').innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
        window.scrollTo(0, 0);
    },

    cancelEdit: () => {
        document.getElementById('editingUserId').value = '';
        document.getElementById('newUsername').value = '';
        document.getElementById('newName').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newUserRole').value = 'admin';
        document.getElementById('linkedEntitySelect').innerHTML = '<option value="">-- غير مرتبط --</option>';

        document.getElementById('saveUserBtn').innerHTML = '<i class="fas fa-user-plus"></i> إنشاء المستخدم';
        document.getElementById('cancelEditBtn').style.display = 'none';
    },

    deleteUser: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        let users = Storage.get('users') || [];
        users = users.filter(u => u.id !== id);
        Storage.set('users', users);
        location.reload();
    },

    generateCardNum: () => {
        const num = '1000' + Math.floor(Math.random() * 9000 + 1000);
        document.getElementById('cardNumInput').value = num;
    },

    exportReport: () => alert('جارِ تحميل التقرير بصيغة PDF...')
};

/* ===========================
   TABLE LOADERS & DASHBOARD
=========================== */
function loadDashboard() {
    const cards = Storage.get('cards') || [];
    const transactions = Storage.get('transactions') || [];
    document.getElementById('totalCards') && (document.getElementById('totalCards').innerText = cards.length);
    document.getElementById('totalTransactions') && (document.getElementById('totalTransactions').innerText = transactions.length);
    const activeCards = cards.filter(c => c.status === 'نشط' || c.status === 'Active').length;
    document.getElementById('activeCards') && (document.getElementById('activeCards').innerText = activeCards);
}

function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    const users = Storage.get('users') || [];
    tbody.innerHTML = '';
    users.forEach(u => {
        let roleBadge = '';
        if (u.role === 'admin') roleBadge = '<span class="status-badge status-active">مدير</span>';
        if (u.role === 'merchant') roleBadge = '<span class="status-badge" style="background:#fff3cd; color:#856404">تاجر</span>';
        if (u.role === 'beneficiary') roleBadge = '<span class="status-badge" style="background:#d1ecf1; color:#0c5460">مستفيد</span>';
        tbody.innerHTML += `
      <tr>
        <td>${u.username}</td>
        <td>${u.name}</td>
        <td>${roleBadge}</td>
        <td>${u.linkedEntity || '-'}</td>
        <td>
            ${(u.role !== 'admin' || u.username !== 'admin') ?
                `<button class="secondary" onclick="Actions.editUser(${u.id})" style="padding:5px 10px; font-size:0.8rem; margin-left:5px;">تعديل</button>
             <button class="delete-btn" onclick="Actions.deleteUser(${u.id})" style="padding:5px 10px; font-size:0.8rem;"><i class="fas fa-trash"></i></button>`
                : ''}
        </td>
      </tr>`;
    });
}

function loadCardsTable() {
    const cards = Storage.get('cards') || [];
    const tbody = document.getElementById('cardsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    cards.forEach(card => {
        const statusClass = (card.status === 'نشط' || card.status === 'Active') ? 'status-active' : 'status-inactive';
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${card.number}</td>
      <td>${card.wallet}</td>
      <td>${card.beneficiary || '-'}</td>
      <td>${card.balance} ريال</td>
      <td><span class="status-badge ${statusClass}">${card.status}</span></td>
      <td><button class="secondary" onclick="alert('خاصية التعديل قادمة قريباً')">تعديل</button></td>`;
        tbody.appendChild(tr);
    });
}

function loadWalletsTable() {
    const wallets = Storage.get('wallets') || [];
    const tbody = document.getElementById('walletsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    wallets.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${w.name}</td>
      <td>${w.funds} ريال</td>
      <td>${w.merchants}</td>
      <td><span class="status-badge status-active">${w.status}</span></td>`;
        tbody.appendChild(tr);
    });
}

function loadMerchantsTable() {
    const merchants = Storage.get('merchants') || [];
    const tbody = document.getElementById('merchantsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    merchants.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.name}</td>
      <td>${m.category}</td>
      <td>${m.transactions}</td>
      <td><span class="status-badge status-active">${m.status}</span></td>`;
        tbody.appendChild(tr);
    });
}

/* ===========================
   EXPORTS (CSV / PDF)
=========================== */
function exportTransactionsCSV(filename = 'transactions.csv') {
    const tx = Storage.get('transactions') || [];
    const header = ['id', 'merchant', 'card', 'amount', 'date'];
    const rows = tx.map(t => [t.id, t.merchant, t.card, t.amount, t.date]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportTransactionsPDF() {
    // Basic browser print for PDF
    window.print();
}

/* ===========================
   CHARTS (Chart.js)
=========================== */
let _dashboardChart, _reportsChart;

function buildDashboardChart() {
    const el = document.getElementById('dashboardChart');
    if (!el) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        el.parentNode.innerHTML = '<p style="color:red; text-align:center; padding:20px;">فشل تحميل المكتبة الرسومية. تأكد من الاتصال بالإنترنت.</p>';
        return;
    }

    let tx = Storage.get('transactions') || [];

    // DEMO DATA: If no transactions exist, show some empty state or dummy data?
    // Let's rely on actual data but ensure the chart renders even with 0s.

    const labels = [], data = [];
    const now = new Date();

    // Use 'en-GB' for consistent key matching if 'ar-SA' varies, 
    // BUT we must match what is stored. Stored data uses 'ar-SA'.
    // We will attempt to match exactly what `new Date().toLocaleDateString('ar-SA')` produces on this machine.

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        // FORCE 'ar-SA' to match POS saved format
        const key = d.toLocaleDateString('ar-SA');

        // Simplified label for display (Day/Month)
        const displayLabel = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' });
        labels.push(displayLabel);

        const sum = tx.filter(t => t.date === key).reduce((s, t) => s + Number(t.amount || 0), 0);
        data.push(sum);
    }

    if (_dashboardChart) _dashboardChart.destroy();

    _dashboardChart = new Chart(el.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'المبيعات (ريال)',
                data,
                backgroundColor: '#00A59B',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, suggestedMax: 100 } }
        }
    });
}

function buildReportsChart() {
    const el = document.getElementById('reportsChart');
    if (!el) return;
    const tx = Storage.get('transactions') || [];
    // Merchant aggregation
    const map = {};
    tx.forEach(t => map[t.merchant] = (map[t.merchant] || 0) + Number(t.amount || 0));
    const labels = Object.keys(map);
    const data = Object.values(map);
    if (_reportsChart) _reportsChart.destroy();
    _reportsChart = new Chart(el.getContext('2d'), {
        type: 'doughnut',
        data: { labels, datasets: [{ label: 'إجمالي بالمتاجر', data, backgroundColor: ['#00A59B', '#8CC240', '#3E4559', '#5ec9c3', '#a9d66e'] }] },
        options: {
            responsive: true,
            cutout: '60%',
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } } }
        }
    });
}

function fillTransactionsTableIfAny() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return false;
    const transactions = Storage.get('transactions') || [];
    tbody.innerHTML = transactions.map(t => `
    <tr>
      <td>#${t.id}</td>
      <td>${t.merchant}</td>
      <td>${t.card}</td>
      <td style="color:var(--brand-teal)"><strong>${Number(t.amount || 0).toFixed(2)} ريال</strong></td>
      <td>${t.date}</td>
    </tr>
  `).join('');
    return true;
}

/* ===========================
   POS
=========================== */
const POS = {
    currentCard: null,
    amount: '0',

    verifyCard: () => {
        const cardNumber = document.getElementById('cardNumber')?.value;
        const cards = Storage.get('cards') || [];
        const card = cards.find(c => c.number === cardNumber);
        const display = document.getElementById('cardStatusDisplay');
        if (!display) return;

        if (!card) {
            POS.currentCard = null;
            display.innerHTML = '<span style="color:red">البطاقة غير موجودة</span>';
            return;
        }
        if (card.status === 'موقوف' || card.status === 'Inactive') {
            POS.currentCard = null;
            display.innerHTML = '<span style="color:red">البطاقة موقوفة</span>';
            return;
        }
        POS.currentCard = card;
        display.innerHTML = `<span style="color:green">تم التحقق: محفظة ${card.wallet} (الرصيد: ${card.balance} ريال)</span><br><small>المستفيد: ${card.beneficiary || 'غير معروف'}</small>`;
    },

    addToAmount: (num) => {
        if (num === '.' && String(POS.amount).includes('.')) return;
        POS.amount = (POS.amount === '0') ? String(num) : String(POS.amount) + String(num);
        POS.updateDisplay();
    },

    clearAmount: () => { POS.amount = '0'; POS.updateDisplay(); },

    updateDisplay: () => {
        const el = document.getElementById('amountDisplay');
        if (!el) return;
        const val = parseFloat(POS.amount || '0');
        el.innerText = isNaN(val) ? '0.00' : val.toFixed(2);
    },

    processPayment: () => {
        if (!POS.currentCard) return alert('يرجى التحقق من البطاقة أولاً.');
        const amount = parseFloat(POS.amount);
        if (isNaN(amount) || amount <= 0) return alert('يرجى إدخال مبلغ صحيح.');
        if (POS.currentCard.balance < amount) return alert('الرصيد غير كافٍ!');

        const cards = Storage.get('cards') || [];
        const i = cards.findIndex(c => c.number === POS.currentCard.number);
        if (i === -1) return alert('حدث خطأ: لم يتم العثور على البطاقة.');
        cards[i].balance -= amount;
        Storage.set('cards', cards);

        const transaction = {
            id: Date.now(),
            card: POS.currentCard.number,
            amount,
            date: new Date().toLocaleDateString('ar-SA'),
            merchant: 'نقطة بيع 1'
        };
        Storage.add('transactions', transaction);

        const modal = document.getElementById('successModal');
        const receipt = document.getElementById('receiptContent');
        if (receipt) {
            receipt.innerHTML = `
        <strong>رقم العملية:</strong> ${transaction.id}<br>
        <strong>التاريخ:</strong> ${transaction.date}<br>
        <strong>البطاقة:</strong> ${transaction.card}<br>
        <strong>المستفيد:</strong> ${cards[i].beneficiary || 'غير محدد'}<br>
        <strong>المبلغ:</strong> ${transaction.amount.toFixed(2)} ريال<br>
        <strong>الرصيد المتبقي:</strong> ${cards[i].balance.toFixed(2)} ريال<br>
        <strong>الحالة:</strong> مقبولة`;
        }
        if (modal) modal.style.display = 'block';

        POS.amount = '0';
        POS.currentCard = null;
        const cardInput = document.getElementById('cardNumber');
        const statusDisplay = document.getElementById('cardStatusDisplay');
        if (cardInput) cardInput.value = '';
        if (statusDisplay) statusDisplay.innerText = '';
        POS.updateDisplay();
    },

    closeModal: () => {
        const modal = document.getElementById('successModal');
        if (modal) modal.style.display = 'none';
    }
};

/* ===========================
   SUPPLY ORDERS
=========================== */
const Orders = {
    create: () => {
        const item = document.getElementById('orderItem').value;
        const partner = document.getElementById('orderPartner').value;
        const cost = document.getElementById('orderCost').value;
        const notes = document.getElementById('orderNotes').value;

        if (!item || !partner || !cost) return alert('يرجى تعبئة جميع الحقول المطلوبة');

        const order = {
            id: Date.now().toString().slice(-6),
            item,
            partner,
            cost: Number(cost),
            notes,
            date: new Date().toLocaleDateString('ar-SA'),
            status: 'Pending' // Pending, Completed
        };

        Storage.add('supply_orders', order);
        alert('تم إنشاء أمر التوريد بنجاح');
        location.reload();
    },

    load: () => {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        const orders = Storage.get('supply_orders') || [];
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${o.item}</td>
                <td>${o.partner}</td>
                <td>${Number(o.cost).toFixed(2)} ريال</td>
                <td>${o.date}</td>
                <td><span class="status-badge ${o.status === 'Completed' ? 'status-active' : 'status-inactive'}">${o.status === 'Completed' ? 'منفذ' : 'قيد الانتظار'}</span></td>
                <td>
                    ${o.status !== 'Completed' ? `<button onclick="Orders.execute('${o.id}')" style="padding:5px 10px; font-size:0.8rem;">تنفيذ</button>` : ''}
                    <button class="secondary" onclick="Orders.printInvoice('${o.id}')" style="padding:5px 10px; font-size:0.8rem;"><i class="fas fa-print"></i> فاتورة</button>
                    ${o.status !== 'Completed' ? `<button class="secondary" onclick="Orders.delete('${o.id}')" style="padding:5px 10px; font-size:0.8rem; color:red; border-color:red;">حذف</button>` : ''}
                </td>
            </tr>
        `).join('');

        Orders.populateMerchants();
    },

    execute: (id) => {
        if (!confirm('هل أنت متأكد من تنفيذ هذا الأمر؟ سيتحول إلى مكتمل.')) return;
        const orders = Storage.get('supply_orders') || [];
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = 'Completed';
            Storage.set('supply_orders', orders);
            Orders.load();
        }
    },

    delete: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا الأمر؟')) return;
        let orders = Storage.get('supply_orders') || [];
        orders = orders.filter(o => o.id !== id);
        Storage.set('supply_orders', orders);
        Orders.load();
    },

    printInvoice: (id) => {
        const orders = Storage.get('supply_orders') || [];
        const order = orders.find(o => o.id === id);
        if (!order) return;

        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html lang="ar" dir="rtl">
            <head>
                <title>فاتورة أمر توريد #${order.id}</title>
                <style>
                    body { font-family: 'Tahoma', sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                    .details { margin-bottom: 20px; font-size: 1.1rem; line-height: 1.8; }
                    .footer { margin-top: 50px; text-align: center; font-size: 0.9rem; color: #555; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>فاتورة أمر توريد</h2>
                    <p>جمعية رعاية الأيتام - تراوف</p>
                </div>
                <div class="details">
                    <p><strong>رقم الأمر:</strong> #${order.id}</p>
                    <p><strong>تاريخ الأمر:</strong> ${order.date}</p>
                    <p><strong>الشريك المنفذ:</strong> ${order.partner}</p>
                    <p><strong>حالة الطلب:</strong> ${order.status === 'Completed' ? 'منفذ ومكتمل' : 'قيد الانتظار'}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>الصنف / الخدمة</th>
                            <th>الملاحظات</th>
                            <th>التكلفة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${order.item}</td>
                            <td>${order.notes || '-'}</td>
                            <td>${Number(order.cost).toFixed(2)} ريال</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="2">الإجمالي</th>
                            <th>${Number(order.cost).toFixed(2)} ريال</th>
                        </tr>
                    </tfoot>
                </table>
                <div class="footer">
                    <p>تم استخراج هذه الفاتورة إلكترونياً من نظام تراوف</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    populateMerchants: () => {
        const select = document.getElementById('orderPartner');
        if (!select) return;
        const merchants = Storage.get('merchants') || [];
        if (select.options.length <= 1) {
            merchants.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.text = m.name;
                select.appendChild(opt);
            });
        }
    },

    loadForMerchant: (merchantName) => {
        const tbody = document.getElementById('merchantOrdersTable');
        if (!tbody) return;

        const allOrders = Storage.get('supply_orders') || [];
        // Filter orders match merchant name
        const myOrders = allOrders.filter(o => o.partner === merchantName);

        if (myOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">لا توجد أوامر توريد واردة</td></tr>';
            return;
        }

        tbody.innerHTML = myOrders.map(o => {
            let actions = '';
            if (o.status === 'Pending' || o.status === 'قيد الانتظار') {
                actions = `
                    <button onclick="Orders.updateStatus('${o.id}', 'Accepted')" style="padding:5px 10px; font-size:0.8rem; background-color:#28a745; color:white; border:none; border-radius:4px; margin-left:5px;">قبول</button>
                    <button onclick="Orders.updateStatus('${o.id}', 'Rejected')" style="padding:5px 10px; font-size:0.8rem; background-color:#dc3545; color:white; border:none; border-radius:4px;">رفض</button>
                `;
            } else if (o.status === 'Accepted') {
                actions = `<button onclick="Orders.updateStatus('${o.id}', 'Completed')" style="padding:5px 10px; font-size:0.8rem; background-color:#007bff; color:white; border:none; border-radius:4px;">تنفيذ</button>`;
            } else if (o.status === 'Completed') {
                actions = '<span style="color:green;"><i class="fas fa-check"></i> مكتمل</span>';
            } else if (o.status === 'Rejected') {
                actions = '<span style="color:red;"><i class="fas fa-times"></i> مرفوض</span>';
            }

            return `
            <tr>
                <td>#${o.id}</td>
                <td>${o.item}</td>
                <td>${Number(o.cost).toFixed(2)} ريال</td>
                <td>${o.date}</td>
                <td><span class="status-badge ${o.status === 'Completed' ? 'status-active' : 'status-inactive'}">${o.status === 'Completed' ? 'منفذ' : (o.status === 'Accepted' ? 'مقبول' : (o.status === 'Rejected' ? 'مرفوض' : 'قيد الانتظار'))}</span></td>
                <td>${actions}</td>
            </tr>
        `}).join('');
    },

    updateStatus: (id, newStatus) => {
        const actionName = newStatus === 'Accepted' ? 'قبول' : (newStatus === 'Rejected' ? 'رفض' : 'تنفيذ');
        if (!confirm(`هل أنت متأكد من ${actionName} هذا الطلب؟`)) return;

        const allOrders = Storage.get('supply_orders') || [];
        const orderIndex = allOrders.findIndex(o => o.id === id);
        if (orderIndex !== -1) {
            allOrders[orderIndex].status = newStatus;
            Storage.set('supply_orders', allOrders);
            alert(`تم ${actionName} الطلب بنجاح`);
            location.reload();
        }
    }
};

/* ===========================
   ONLOAD CONTROLLER
=========================== */
window.onload = () => {
    try {
        initData();
        Settings.applyLayout(); // Apply saved layout preference
        Settings.load?.();
        Auth.checkSession();

        if (typeof loadDashboard === 'function') loadDashboard();
        if (typeof loadCardsTable === 'function') loadCardsTable();
        if (typeof loadWalletsTable === 'function') loadWalletsTable();
        if (typeof loadMerchantsTable === 'function') loadMerchantsTable();
        if (typeof loadUsersTable === 'function') {
            loadUsersTable();
            const roleSelect = document.getElementById('newUserRole');
            if (roleSelect) {
                roleSelect.addEventListener('change', (e) => {
                    const entitySelect = document.getElementById('linkedEntitySelect');
                    if (entitySelect) {
                        if (e.target.value === 'merchant') Settings.populateDropdown('merchants', entitySelect);
                        else if (e.target.value === 'beneficiary') Settings.populateDropdown('beneficiaries', entitySelect);
                        else entitySelect.innerHTML = '<option value="">-- غير مرتبط --</option>';
                    }
                });
            }
        }

        // Fill reports table and build reports chart
        if (fillTransactionsTableIfAny()) {
            if (typeof buildReportsChart === 'function') buildReportsChart();
        }

        // Build dashboard chart
        if (typeof buildDashboardChart === 'function') buildDashboardChart();

        // صفحة المستفيد (لو دالتها معرفة)
        if (typeof initBeneficiary === 'function') initBeneficiary();

        // نظام الدعم الفني
        Support.init();

        // أوامر التوريد
        if (typeof Orders !== 'undefined') Orders.load();

    } catch (e) {
        console.error('Initialization Error:', e);
    }
};

/* ===========================
   SUPPORT SYSTEM
=========================== */
const Support = {
    init: () => {
        if (!Auth.user) return;
        if (Auth.user.role === 'admin') {
            const adminView = document.getElementById('adminTicketView');
            if (adminView) {
                adminView.style.display = 'block';
                Support.loadTickets();
            }
        }
    },

    submitTicket: () => {
        const title = document.getElementById('ticketTitle').value.trim();
        const desc = document.getElementById('ticketDesc').value.trim();

        if (!title || !desc) return alert('يرجى تعبئة جميع الحقول');

        const ticket = {
            id: Date.now(),
            sender: Auth.user.name + ' (' + Auth.user.role + ')',
            title: title,
            desc: desc,
            date: new Date().toLocaleDateString('ar-SA'),
            status: 'جديد'
        };

        Storage.add('tickets', ticket);
        alert('تم إرسال تذكرتك بنجاح! سيتم التواصل معك قريباً.');
        document.getElementById('ticketTitle').value = '';
        document.getElementById('ticketDesc').value = '';

        // If admin submits (test), reload to see it
        if (Auth.user.role === 'admin') Support.loadTickets();
    },

    loadTickets: () => {
        const tbody = document.getElementById('ticketsTableBody');
        if (!tbody) return;

        const tickets = Storage.get('tickets') || [];
        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">لا توجد تذاكر جديدة</td></tr>';
            return;
        }

        tbody.innerHTML = tickets.map(t => `
            <tr>
                <td>#${t.id}</td>
                <td>${t.sender}</td>
                <td><strong>${t.title}</strong><br><small style="color:#777">${t.desc}</small></td>
                <td>${t.date}</td>
                <td><span class="status-badge status-active">${t.status}</span></td>
            </tr>
        `).join('');
    }
};
