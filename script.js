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

        const adminPages = ['index.html', 'cards.html', 'wallets.html', 'merchants.html', 'settings.html', 'users.html', 'reports.html', 'pos.html'];
        if (Auth.user.role === 'merchant' && adminPages.includes(page)) return window.location.href = 'merchant_home.html';

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
        if (window.location.pathname.includes('settings.html')) {
            document.getElementById('label_cards').value = Settings.labels.label_cards;
            document.getElementById('label_wallets').value = Settings.labels.label_wallets;
            document.getElementById('label_merchants').value = Settings.labels.label_merchants;
            document.getElementById('label_beneficiaries').value = Settings.labels.label_beneficiaries;
            Settings.renderCategories();
            Settings.renderBeneficiaries();
        }
        Settings.populateDropdowns();
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

    addUser: () => {
        const username = document.getElementById('newUsername').value.trim();
        const name = document.getElementById('newName').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const role = document.getElementById('newUserRole').value;
        const linkedEntity = document.getElementById('linkedEntitySelect').value;

        if (!username || !name || !password) return alert('يرجى تعبئة الحقول الأساسية');
        if ((role === 'merchant' || role === 'beneficiary') && !linkedEntity) return alert('يرجى اختيار الجهة المرتبطة بهذا الحساب');

        const users = Storage.get('users') || [];
        if (users.some(u => u.username === username)) return alert('اسم المستخدم مسجل مسبقاً');

        const newUser = { id: Date.now(), name, username, password, role, linkedEntity: linkedEntity || null };
        Storage.add('users', newUser);
        alert('تم إنشاء المستخدم بنجاح!');
        location.reload();
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
        <td>${(u.role !== 'admin' || u.username !== 'admin')
                ? `<button class="delete-btn" onclick="Actions.deleteUser(${u.id})"><i class="fas fa-trash"></i></button>` : ''}</td>
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
   ONLOAD CONTROLLER
=========================== */
window.onload = () => {
    try {
        initData();
        Settings.load?.();
        Auth.checkSession();

        if (typeof loadDashboard === 'function') loadDashboard();
        if (typeof loadCardsTable === 'function') loadCardsTable();
        if (typeof loadWalletsTable === 'function') loadWalletsTable();
        if (typeof loadMerchantsTable === 'function') loadMerchantsTable();
        if (typeof loadUsersTable === 'function') loadUsersTable();

        // التقارير العامة (إن وجد جدولها)
        const tbody = document.getElementById('transactionsTableBody');
        if (tbody) {
            const transactions = Storage.get('transactions') || [];
            tbody.innerHTML = transactions.map(t => `
        <tr>
          <td>#${t.id}</td>
          <td>${t.merchant}</td>
          <td>${t.card}</td>
          <td style="color:var(--primary-color)"><strong>${Number(t.amount || 0).toFixed(2)} ريال</strong></td>
          <td>${t.date}</td>
        </tr>`).join('');
        }

        // صفحة المستفيد (لو دالتها معرفة)
        if (typeof initBeneficiary === 'function') initBeneficiary();

        // نظام الدعم الفني
        Support.init();

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
