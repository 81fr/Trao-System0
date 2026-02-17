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
        const input = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();
        const role = document.getElementById('roleInput')?.value;

        if (!input || !password) return alert('يرجى إدخال اسم المستخدم أو رقم الهوية وكلمة المرور');

        const users = Storage.get('users') || [];
        const beneficiaries = Storage.get('beneficiaries') || [];
        let user = null;

        // 1) Try matching by username + role in users list
        user = users.find(u => u.username === input && u.password === password && u.role === role);

        // 2) Try matching by username without role constraint (fallback)
        if (!user) {
            user = users.find(u => u.username === input && u.password === password);
        }

        // 3) Try matching by identity number in beneficiaries
        if (!user) {
            const ben = beneficiaries.find(b => b.identity === input);
            if (ben) {
                user = users.find(u => u.linkedEntity === ben.name && u.role === 'beneficiary');
                if (user) {
                    if (user.password !== password) return alert('كلمة المرور غير صحيحة');
                } else {
                    if (password !== '123') return alert('كلمة المرور غير صحيحة');
                    user = { id: ben.id, name: ben.name, username: ben.identity, role: 'beneficiary', linkedEntity: ben.name };
                }
            }
        }

        // 4) Try matching by beneficiary name
        if (!user) {
            const ben = beneficiaries.find(b => b.name === input);
            if (ben) {
                user = users.find(u => u.linkedEntity === ben.name && u.role === 'beneficiary');
                if (user) {
                    if (user.password !== password) return alert('كلمة المرور غير صحيحة');
                } else {
                    if (password !== '123') return alert('كلمة المرور غير صحيحة');
                    user = { id: ben.id, name: ben.name, username: ben.identity || ben.name, role: 'beneficiary', linkedEntity: ben.name };
                }
            }
        }

        if (!user) return alert('بيانات الدخول غير صحيحة! تأكد من اسم المستخدم أو رقم الهوية وكلمة المرور');

        localStorage.setItem('currentUser', JSON.stringify(user));
        Auth.user = user;

        if (user.role === 'admin') return window.location.href = 'index.html';
        if (user.role === 'merchant') return window.location.href = 'merchant_home.html';
        if (user.role === 'beneficiary') return window.location.href = 'beneficiary_home.html';
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
        Auth.updateSidebar();
    },

    updateSidebar: () => {
        if (!Auth.user) return;

        // Admin Specific: Add System Check Link
        if (Auth.user.role === 'admin') {
            const ul = document.querySelector('.nav-links');
            if (ul && !document.getElementById('sysCheckLink')) {
                const li = document.createElement('li');
                li.innerHTML = `<a href="test_system.html" id="sysCheckLink" style="color:#ffc107"><i class="fas fa-microchip"></i> فحص النظام</a>`;
                const logout = document.getElementById('logoutBtn')?.parentElement; 
                if (logout) ul.insertBefore(li, logout);
                else ul.appendChild(li);
            }
            return;
        }

        const links = document.querySelectorAll('.nav-links li a');
        const role = Auth.user.role;

        let allowed = [];
        let dashboardLink = 'index.html';

        if (role === 'merchant') {
            allowed = ['merchant_home.html', 'pos.html', 'reports.html', 'orders.html', 'support.html'];
            dashboardLink = 'merchant_home.html';
        } else if (role === 'beneficiary') {
            allowed = ['beneficiary_home.html', 'support.html'];
            dashboardLink = 'beneficiary_home.html';
        }

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === '#' || href.includes('logout')) return; // Skip logout/placeholder

            // Fix Dashboard Link
            if (href === 'index.html' || href === 'merchant_home.html' || href === 'beneficiary_home.html') {
                link.setAttribute('href', dashboardLink);
                // Keep dashboard visible
                return;
            }

            // Hide unauthorized
            if (!allowed.some(p => href.includes(p))) {
                link.parentElement.style.display = 'none';
            }
        });
    }
};

/* ===========================
   INITIAL DATA
=========================== */
function initData() {
    if (localStorage.getItem('users') === null) {
        Storage.set('users', [
            { id: 1, name: 'مدير النظام', username: 'admin', password: '123', role: 'admin' },
            { id: 2, name: 'تاجر السوبرماركت', username: 'merchant', password: '123', role: 'merchant', linkedEntity: 'سوبرماركت الرياض' },
            { id: 3, name: 'محمد أحمد', username: 'ben1', password: '123', role: 'beneficiary', linkedEntity: 'محمد أحمد' }
        ]);
    }
    if (localStorage.getItem('cards') === null) {
        Storage.set('cards', [
            { id: 1, number: '10001001', balance: 500, status: 'نشط', wallet: 'إعانة غذائية', beneficiary: 'محمد أحمد', identity: '1010101010' },
            { id: 2, number: '10001002', balance: 1500, status: 'نشط', wallet: 'دعم كساء', beneficiary: 'سارة خالد', identity: '2020202020' },
            { id: 3, number: '10001003', balance: 0, status: 'موقوف', wallet: 'خدمات عامة', beneficiary: 'غير محدد', identity: '' }
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
            { id: 101, name: 'أسواق العثيم', category: 'مواد غذائية', transactions: 245, status: 'نشط' },
            { id: 102, name: 'بندة', category: 'مواد غذائية', transactions: 198, status: 'نشط' },
            { id: 103, name: 'الدانوب', category: 'مواد غذائية', transactions: 145, status: 'نشط' },
            { id: 104, name: 'التميمي', category: 'مواد غذائية', transactions: 88, status: 'نشط' },
            { id: 201, name: 'سنتربوينت', category: 'ملابس', transactions: 176, status: 'نشط' },
            { id: 202, name: 'إكسترا', category: 'إلكترونيات', transactions: 82, status: 'نشط' },
            { id: 301, name: 'صيدلية النهدي', category: 'أدوية', transactions: 310, status: 'نشط' },
            { id: 302, name: 'مكتبة جرير', category: 'مستلزمات مدرسية', transactions: 67, status: 'نشط' },
            { id: 303, name: 'المنيع', category: 'إلكترونيات', transactions: 43, status: 'نشط' },
            { id: 304, name: 'ماكس', category: 'ملابس', transactions: 95, status: 'نشط' },
            { id: 305, name: 'صيدلية الدواء', category: 'أدوية', transactions: 120, status: 'نشط' },
            { id: 306, name: 'ايكيا', category: 'أثاث', transactions: 35, status: 'نشط' },
            { id: 307, name: 'ساكو', category: 'أدوات منزلية', transactions: 52, status: 'نشط' },
            { id: 308, name: 'هوم سنتر', category: 'أثاث', transactions: 28, status: 'نشط' }
        ]);
    }
    if (localStorage.getItem('transactions') === null) {
        Storage.set('transactions', [
            { id: 101, card: '10001001', amount: 50, date: '2023-10-25', merchant: 'أسواق العثيم' },
            { id: 102, card: '10001002', amount: 200, date: '2023-10-26', merchant: 'سنتربوينت' }
        ]);
    }
    if (localStorage.getItem('supply_orders') === null) {
        Storage.set('supply_orders', [
            { id: '100201', item: 'توريد سلال غذائية (أرز، سكر، زيت) - 500 سلة', partner: 'أسواق العثيم', cost: 15000, date: '2024-01-05', status: 'Completed' },
            { id: '100202', item: 'توريد بطانيات شتوية (200 بطانية)', partner: 'سنتربوينت', cost: 8000, date: '2024-01-10', status: 'Completed' },
            { id: '100203', item: 'توريد أجهزة تكييف سبليت (15 جهاز)', partner: 'إكسترا', cost: 25000, date: '2024-02-01', status: 'Completed' },
            { id: '100204', item: 'صيانة مستودع الجمعية وتجديد الأرفف', partner: 'ساكو', cost: 4500, date: '2024-02-15', status: 'Rejected', rejectionReason: 'السعر مرتفع جداً مقارنة بالسوق' },
            { id: '100205', item: 'توريد ملابس أطفال صيفية (300 قطعة)', partner: 'ماكس', cost: 12000, date: '2024-03-01', status: 'Completed' },
            { id: '100206', item: 'كوبونات شرائية للعائلات المحتاجة', partner: 'الدانوب', cost: 50000, date: '2024-03-15', status: 'Withdrawn' },
            { id: '100207', item: 'توريد أدوية أطفال ومكملات غذائية', partner: 'صيدلية النهدي', cost: 18000, date: '2024-04-01', status: 'Completed' },
            { id: '100208', item: 'حقائب مدرسية وأدوات قرطاسية (500 طالب)', partner: 'مكتبة جرير', cost: 9500, date: '2024-04-20', status: 'Completed' },
            { id: '100209', item: 'توريد مواد تنظيف ومعقمات', partner: 'بندة', cost: 5200, date: '2024-05-10', status: 'Accepted' },
            { id: '100210', item: 'توريد ثلاجات للعائلات المحتاجة (20 ثلاجة)', partner: 'إكسترا', cost: 32000, date: '2024-06-01', status: 'Pending' },
            { id: '100211', item: 'أدوات كهربائية منزلية (غسالات + مكانس)', partner: 'المنيع', cost: 21000, date: '2024-06-15', status: 'Completed' },
            { id: '100212', item: 'ملابس شتوية نسائية ورجالية', partner: 'سنتربوينت', cost: 14000, date: '2024-07-01', status: 'Accepted' },
            { id: '100213', item: 'أثاث منزلي أساسي (أسرّة وخزائن)', partner: 'ايكيا', cost: 45000, date: '2024-07-20', status: 'Completed' },
            { id: '100214', item: 'أدوات مطبخ ومستلزمات طبخ', partner: 'ساكو', cost: 7800, date: '2024-08-05', status: 'Completed' },
            { id: '100215', item: 'سجاد ومفروشات للعائلات الجديدة', partner: 'هوم سنتر', cost: 19000, date: '2024-08-20', status: 'Pending' },
            { id: '100216', item: 'لوازم مدرسية للفصل الدراسي الثاني', partner: 'مكتبة جرير', cost: 11000, date: '2024-09-01', status: 'Accepted' },
            { id: '100217', item: 'توريد حليب أطفال ومواد غذائية خاصة', partner: 'التميمي', cost: 22000, date: '2024-09-15', status: 'Completed' },
            { id: '100218', item: 'أجهزة تدفئة للشتاء (50 جهاز)', partner: 'إكسترا', cost: 17500, date: '2024-10-01', status: 'Pending' }
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
            { id: 1, name: 'محمد أحمد علي الغامدي', firstName: 'محمد', fatherName: 'أحمد', grandName: 'علي', familyName: 'الغامدي', nationality: 'saudi', identity: '1010101010', mobile: '0512345678', fileNum: 'F001' },
            { id: 2, name: 'سارة خالد عبدالله الشمري', firstName: 'سارة', fatherName: 'خالد', grandName: 'عبدالله', familyName: 'الشمري', nationality: 'saudi', identity: '2020202020', mobile: '0598765432', fileNum: 'F002' }
        ]);
    }
}

/* ===========================
   DATA MIGRATION (patch old data)
=========================== */
function migrateData() {
    const cards = Storage.get('cards') || [];
    const beneficiaries = Storage.get('beneficiaries') || [];

    // Detect old default card numbers (10001, 10002, 10003) and replace with new format
    const oldDefaults = ['10001', '10002', '10003'];
    const hasOldCards = cards.some(c => oldDefaults.includes(c.number));
    if (hasOldCards) {
        // Replace old cards with new format
        const newCards = [
            { id: 1, number: '10001001', balance: 500, status: 'نشط', wallet: 'إعانة غذائية', beneficiary: 'محمد أحمد', identity: '1010101010' },
            { id: 2, number: '10001002', balance: 1500, status: 'نشط', wallet: 'دعم كساء', beneficiary: 'سارة خالد', identity: '2020202020' },
            { id: 3, number: '10001003', balance: 0, status: 'موقوف', wallet: 'خدمات عامة', beneficiary: 'غير محدد', identity: '' }
        ];
        // Keep any user-added cards (not in old defaults)
        const userCards = cards.filter(c => !oldDefaults.includes(c.number));
        Storage.set('cards', [...newCards, ...userCards]);
    }

    // Patch remaining cards with identity from beneficiaries
    const currentCards = Storage.get('cards') || [];
    let cardsChanged = false;
    currentCards.forEach(card => {
        if (!card.identity && card.beneficiary) {
            const ben = beneficiaries.find(b => b.name === card.beneficiary);
            if (ben && ben.identity) {
                card.identity = ben.identity;
                cardsChanged = true;
            }
        }
    });
    if (cardsChanged) Storage.set('cards', currentCards);

    // Update old transactions that reference old card numbers
    const tx = Storage.get('transactions') || [];
    let txChanged = false;
    const cardMap = { '10001': '10001001', '10002': '10001002', '10003': '10001003' };
    tx.forEach(t => {
        if (cardMap[t.card]) { t.card = cardMap[t.card]; txChanged = true; }
    });
    if (txChanged) Storage.set('transactions', tx);

    // Ensure at least one beneficiary user exists
    const users = Storage.get('users') || [];
    const hasBenUser = users.some(u => u.role === 'beneficiary');
    if (!hasBenUser && beneficiaries.length > 0) {
        const firstBen = beneficiaries[0];
        users.push({
            id: users.length + 100,
            name: firstBen.name,
            username: 'ben1',
            password: '123',
            role: 'beneficiary',
            linkedEntity: firstBen.name
        });
        Storage.set('users', users);
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
        const firstName = (document.getElementById('benFirstName') || {}).value || '';
        const fatherName = (document.getElementById('benFatherName') || {}).value || '';
        const grandName = (document.getElementById('benGrandName') || {}).value || '';
        const familyName = (document.getElementById('benFamilyName') || {}).value || '';
        const nationality = document.getElementById('beneficiaryNationality').value;
        const id = document.getElementById('beneficiaryID').value.trim();
        const mobile = document.getElementById('beneficiaryMobile').value.trim();
        const fileNum = document.getElementById('beneficiaryFileNum').value.trim();

        // Build full name from 4 parts
        let fullName = '';
        if (firstName || fatherName || grandName || familyName) {
            if (!firstName.trim() || !fatherName.trim() || !grandName.trim() || !familyName.trim()) {
                alert('يرجى إدخال الاسم الرباعي كاملاً');
                return;
            }
            fullName = `${firstName.trim()} ${fatherName.trim()} ${grandName.trim()} ${familyName.trim()}`;
        } else {
            const oldName = (document.getElementById('beneficiaryName') || {}).value || '';
            if (!oldName.trim()) { alert('يرجى إدخال الاسم'); return; }
            fullName = oldName.trim();
        }

        if (!id || !mobile || !fileNum) {
            alert('يرجى إدخال رقم الهوية ورقم الجوال ورقم الملف');
            return;
        }

        // Identity validation based on nationality
        const idRules = {
            'saudi': { len: 10, label: 'رقم الهوية للسعوديين' },
            'non_saudi': { len: 10, label: 'رقم الإقامة' },
            'gulf': { len: 10, label: 'رقم الهوية الخليجية' }
        };
        const rule = idRules[nationality] || idRules['saudi'];
        if (!/^\d+$/.test(id)) {
            alert('رقم الهوية يجب أن يحتوي على أرقام فقط');
            return;
        }
        if (id.length !== rule.len) {
            alert(`${rule.label} يجب أن يتكون من ${rule.len} أرقام`);
            return;
        }

        // Phone validation
        if (!/^05\d{8}$/.test(mobile)) {
            alert('رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
            return;
        }

        Storage.add('beneficiaries', {
            id: Date.now(),
            name: fullName,
            firstName: firstName.trim(),
            fatherName: fatherName.trim(),
            grandName: grandName.trim(),
            familyName: familyName.trim(),
            nationality,
            identity: id,
            mobile,
            fileNum
        });

        // Clear fields
        ['benFirstName', 'benFatherName', 'benGrandName', 'benFamilyName', 'beneficiaryID', 'beneficiaryMobile', 'beneficiaryFileNum'].forEach(fid => {
            const el = document.getElementById(fid);
            if (el) el.value = '';
        });
        document.getElementById('beneficiaryNationality').value = 'saudi';
        if (typeof updateIdHint === 'function') updateIdHint();

        Settings.renderBeneficiaries();
        alert('تم إضافة المستفيد بنجاح');
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
            const natDisplay = b.nationality === 'saudi' ? 'سعودي' : (b.nationality === 'non_saudi' ? 'غير سعودي' : '-');
            tbody.innerHTML += `
        <tr>
          <td>${b.name}</td>
          <td>${natDisplay}</td>
          <td>${b.identity}</td>
          <td>${b.mobile || '-'}</td>
          <td>${b.fileNum || '-'}</td>
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
    addWalletFunds: (id) => {
        const amount = prompt('أدخل المبلغ للإيداع:');
        if(!amount || isNaN(amount)) return;
        let wallets = Storage.get('wallets') || [];
        const w = wallets.find(x => x.id === id);
        if(w) {
            w.funds = parseFloat(w.funds || 0) + parseFloat(amount);
            w.collected = parseFloat(w.collected || 0) + parseFloat(amount);
            Storage.set('wallets', wallets);
            loadWalletsTable();
        }
    },
    addCard: () => {
        const id = document.getElementById('editingCardId').value;
        const number = document.getElementById('cardNumInput').value;
        const wallet = document.getElementById('cardWalletInput').value;
        const balance = parseFloat(document.getElementById('cardBalanceInput').value);
        const beneficiary = document.getElementById('cardBeneficiaryInput').value;
        const status = document.getElementById('cardStatusInput').value;

        if (!number || !wallet || isNaN(balance)) return alert('يرجى ملء جميع الحقول بشكل صحيح');

        let cards = Storage.get('cards') || [];

        if (id) {
            // Edit Mode
            const index = cards.findIndex(c => c.id == id);
            if (index !== -1) {
                cards[index] = { ...cards[index], number, wallet, balance, status, beneficiary: beneficiary || 'غير محدد' };
                Storage.set('cards', cards);
                alert('تم تحديث البطاقة بنجاح');
            }
        } else {
            // Create Mode
            if (cards.some(c => c.number === number)) return alert('رقم البطاقة موجود بالفعل');
            Storage.add('cards', {
                id: Date.now(), number, wallet, balance, status: status || 'نشط', beneficiary: beneficiary || 'غير محدد'
            });
            alert('تم إصدار البطاقة بنجاح!');
        }

        Actions.cancelCardEdit();
        location.reload();
    },

    editCard: (id) => {
        const cards = Storage.get('cards') || [];
        const card = cards.find(c => c.id == id);
        if (!card) return;

        document.getElementById('editingCardId').value = card.id;
        document.getElementById('cardNumInput').value = card.number;
        document.getElementById('cardBalanceInput').value = card.balance;
        document.getElementById('cardStatusInput').value = card.status || 'نشط';

        // Populate dropdowns first if empty (though usually they are populated on load)
        // We assume they are populated. We just set values.
        document.getElementById('cardWalletInput').value = card.wallet;
        document.getElementById('cardBeneficiaryInput').value = card.beneficiary === 'غير محدد' ? '' : card.beneficiary;

        document.getElementById('saveCardBtn').innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        document.getElementById('cancelCardEditBtn').style.display = 'inline-block';
        window.scrollTo(0, 0);
    },

    cancelCardEdit: () => {
        document.getElementById('editingCardId').value = '';
        document.getElementById('cardNumInput').value = '';
        document.getElementById('cardBalanceInput').value = '';
        document.getElementById('cardWalletInput').value = '';
        document.getElementById('cardBeneficiaryInput').value = '';
        document.getElementById('cardStatusInput').value = 'نشط';

        document.getElementById('saveCardBtn').innerHTML = '<i class="fas fa-plus"></i> إصدار البطاقة';
        document.getElementById('cancelCardEditBtn').style.display = 'none';
    },

    deleteCard: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return;
        let cards = Storage.get('cards') || [];
        cards = cards.filter(c => c.id != id);
        Storage.set('cards', cards);
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
        const status = card.status || 'نشط';
        const statusClass = (status === 'نشط' || status === 'Active') ? 'status-active' : 'status-inactive';
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${card.number}</td>
      <td>${card.wallet}</td>
      <td>${card.beneficiary || '-'}</td>
      <td>${card.balance} ريال</td>
      <td><span class="status-badge ${statusClass}">${status}</span></td>
      <td>
        <button class="secondary" onclick="Actions.editCard(${card.id})" style="padding:5px 10px; font-size:0.8rem; margin-left:5px;">تعديل</button>
        <button class="delete-btn" onclick="Actions.deleteCard(${card.id})" style="padding:5px 10px; font-size:0.8rem;"><i class="fas fa-trash"></i></button>
      </td>`;
        tbody.appendChild(tr);
    });
}

function loadWalletsTable() {
    const wallets = Storage.get('wallets') || [];
    const container = document.getElementById('walletsGrid');
    if (!container) return;
    container.innerHTML = '';
    
    wallets.forEach(w => {
        // Safe defaults
        const collected = (w.collected !== undefined) ? w.collected : 0;
        const target = (w.target !== undefined) ? w.target : 50000;
        const funds = (w.funds !== undefined) ? w.funds : 0;
        const percent = Math.min(100, Math.round((collected / target) * 100));
        
        const card = document.createElement('div');
        card.className = 'wallet-card';
        card.innerHTML = `
            <div class="card-menu-btn"><i class="fas fa-ellipsis-v"></i></div>
            <div class="card-icon" style="background:${w.color || '#00A59B'}">
                <i class="${w.icon || 'fas fa-wallet'}"></i>
            </div>
            <span class="wallet-category">${w.category || 'عام'}</span>
            <h3>${w.name}</h3>
            <div style="font-size:1.8rem; font-weight:bold; color:#333; margin-bottom:10px;">
                ${Number(funds).toLocaleString('ar-SA')} <small style="font-size:1rem;color:#777">ريال</small>
            </div>
            
            <div class="progress-container">
                <div class="progress-labels">
                    <span>المحقق: ${Number(collected).toLocaleString('ar-SA')}</span>
                    <span>الهدف: ${Number(target).toLocaleString('ar-SA')}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${percent}%; background:${w.color || '#00A59B'}"></div>
                </div>
            </div>
            
            <div style="display:flex; gap:10px; margin-top:16px;">
                 <button class="secondary" style="flex:1" onclick="alert('تفاصيل المحفظة قريباً')">التفاصيل</button>
                 <button style="flex:1; background:${w.color || '#00A59B'}; color:white; border:none;" onclick="Actions.addWalletFunds(${w.id})">إيداع</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function loadMerchantsTable() {
    const merchants = Storage.get('merchants') || [];
    const container = document.getElementById('merchantsGrid');
    if (!container) return;
    container.innerHTML = '';
    
    merchants.forEach(m => {
        const isActive = (m.status === 'نشط' || m.status === 'Active');
        const badge = isActive ? 
            '<span class="badge-gold" style="background:#e6fffa; color:#00A59B; border-color:#b2f5ea">نشط</span>' : 
            '<span class="badge-gold" style="background:#fff5f5; color:#c53030; border-color:#feb2b2">غير نشط</span>';
            
        const card = document.createElement('div');
        card.className = 'merchant-card';
        card.innerHTML = `
            <div class="card-menu-btn"><i class="fas fa-ellipsis-v"></i></div>
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px;">
                <img src="${m.logo || 'assets/logo.png'}" style="width:50px; height:50px; border-radius:8px; object-fit:contain; border:1px solid #eee;">
                ${badge}
            </div>
            
            <h3>${m.name}</h3>
            <p style="color:#777; font-size:0.9rem; margin-bottom:16px;">${m.category || 'عام'}</p>
            
            <div class="merchant-contact">
                <div class="contact-row"><i class="fas fa-map-marker-alt"></i> <span>${m.location || 'الرياض'}</span></div>
                <div class="contact-row"><i class="fas fa-user-tie"></i> <span>${m.contactPerson || '-'}</span></div>
                <div class="contact-row"><i class="fas fa-phone"></i> <span>${m.phone || '-'}</span></div>
                <div class="contact-row"><i class="fas fa-envelope"></i> <span>${m.email || '-'}</span></div>
            </div>
            
            <div style="margin-top:20px; text-align:center;">
                <button class="secondary" style="width:100%" onclick="alert('عرض سجل العمليات')">
                    <i class="fas fa-history"></i> سجل العمليات (${m.transactions || 0})
                </button>
            </div>
        `;
        container.appendChild(card);
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
   TOAST
=========================== */
function showToast(msg, type = 'success', timeout = 1800) {
    let el = document.getElementById('__toast');
    if (!el) {
        el = document.createElement('div'); el.id = '__toast'; el.className = 'toast';
        document.body.appendChild(el);
    }
    el.className = `toast ${type}`; el.innerText = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), timeout);
}

/* ===========================
   TABLE SEARCH + PAGINATION
=========================== */
function attachTableSearchAndPager(tableId, searchInputId, pagerContainerId, pageSize = 10) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const search = document.getElementById(searchInputId);
    const pager = document.getElementById(pagerContainerId);

    let filtered = rows.slice(), page = 1;
    function render() {
        const start = (page - 1) * pageSize, end = start + pageSize;
        rows.forEach(r => r.style.display = 'none');
        filtered.slice(start, end).forEach(r => r.style.display = '');
        if (pager) {
            const total = filtered.length, pages = Math.max(1, Math.ceil(total / pageSize));
            pager.innerHTML = `
        <div class="pager">
          <span>عرض ${(start + 1)}–${Math.min(end, total)} من ${total}</span>
          <button ${page <= 1 ? 'class="muted" disabled' : ''} onclick="this.closest('.pager').__prev?.()">السابق</button>
          <button ${page >= pages ? 'class="muted" disabled' : ''} onclick="this.closest('.pager').__next?.()">التالي</button>
        </div>`;
            const root = pager.querySelector('.pager');
            root.__prev = () => { if (page > 1) { page--; render(); } };
            root.__next = () => { const pages2 = Math.ceil(filtered.length / pageSize); if (page < pages2) { page++; render(); } };
        }
    }
    if (search) {
        search.oninput = () => {
            const q = search.value.trim().toLowerCase();
            filtered = rows.filter(r => r.innerText.toLowerCase().includes(q));
            page = 1; render();
        };
    }
    render();
}

/* ===========================
   BENEFICIARY QR (اختياري)
=========================== */
function renderBeneficiaryQR(containerId, text) {
    if (!window.QRCode) return;
    const el = document.getElementById(containerId); if (!el) return;
    el.innerHTML = '';
    new QRCode(el, { text, width: 128, height: 128 });
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

        // === Purchase Code Verification Gate ===
        const pending = Storage.get('pendingPurchases') || [];
        const confirmedReq = pending.find(p =>
            p.cardNumber === POS.currentCard.number &&
            p.status === 'confirmed' &&
            Math.abs(p.amount - amount) < 0.01
        );

        if (!confirmedReq) {
            return alert('⚠️ لا يمكن تنفيذ العملية!\n\nيجب أولاً:\n1. إنشاء طلب شراء من صفحة التاجر\n2. انتظار تأكيد المستفيد\n\nلم يتم العثور على طلب شراء مؤكد لهذه البطاقة بهذا المبلغ.');
        }

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
            merchant: confirmedReq.merchant || 'نقطة بيع 1'
        };
        Storage.add('transactions', transaction);

        // Mark purchase request as completed
        const updatedPending = Storage.get('pendingPurchases') || [];
        const pReq = updatedPending.find(p => p.code === confirmedReq.code);
        if (pReq) pReq.status = 'completed';
        Storage.set('pendingPurchases', updatedPending);

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
        <strong>كود الشراء:</strong> ${confirmedReq.code}<br>
        <strong>الحالة:</strong> مقبولة ✅`;
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
        try {
            const item = document.getElementById('orderItem').value;
            const partner = document.getElementById('orderPartner').value;
            const cost = document.getElementById('orderCost').value;
            const notes = document.getElementById('orderNotes').value;

            if (!item || !partner || !cost) return alert('يرجى تعبئة جميع الحقول المطلوبة (الصنف، الشريك، القيمة)');

            const order = {
                id: Date.now().toString().slice(-6),
                item,
                partner,
                cost: Number(cost),
                notes,
                date: new Date().toLocaleDateString('ar-SA'),
                status: 'Pending',
                rejectionReason: ''
            };

            Storage.add('supply_orders', order);
            alert('تم إنشاء أمر التوريد بنجاح');

            // Reload to show changes
            location.reload();
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء إنشاء الطلب: ' + e.message);
        }
    },

    load: () => {
        try {
            const tbody = document.getElementById('ordersTableBody');
            if (!tbody) return; // Not on orders page

            // Ensure data exists
            let orders = Storage.get('supply_orders');
            if (!orders || !Array.isArray(orders)) {
                orders = [];
                Storage.set('supply_orders', []);
            }

            // Render table
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#777">لا توجد أوامر توريد حالياً</td></tr>';
            } else {
                tbody.innerHTML = orders.map(o => {
                    if (!o) return ''; // Skip nulls
                    let actions = '';
                    let statusBadge = '';

                    // Status Badge
                    if (o.status === 'Completed') statusBadge = '<span class="status-badge status-active">منفذ</span>';
                    else if (o.status === 'Pending') statusBadge = '<span class="status-badge" style="background:#ffc107; color:#000">قيد الانتظار</span>';
                    else if (o.status === 'Withdrawn') statusBadge = '<span class="status-badge" style="background:#6c757d; color:#fff">مسحوب</span>';
                    else if (o.status === 'Rejected') statusBadge = `<span class="status-badge" style="background:#dc3545; color:#fff" title="${o.rejectionReason || 'لا يوجد سبب'}">مرفوض</span>`;
                    else if (o.status === 'Cancelled') statusBadge = '<span class="status-badge" style="background:#000; color:#fff">ملغي نهائياً</span>';
                    else if (o.status === 'Accepted') statusBadge = '<span class="status-badge" style="background:#17a2b8; color:#fff">مقبول</span>';
                    else statusBadge = `<span class="status-badge">${o.status}</span>`;

                    // Actions
                    if (o.status === 'Pending') {
                        actions += `<button onclick="Orders.withdraw('${o.id}')" style="padding:5px 10px; font-size:0.8rem; background-color:#ff9800; color:white; border:none; margin-inline-end:5px;">سحب</button>`;
                        actions += `<button onclick="Orders.execute('${o.id}')" style="padding:5px 10px; font-size:0.8rem; margin-inline-end:5px;">تنفيذ</button>`;
                    }
                    if (o.status === 'Accepted') {
                        actions += `<button onclick="Orders.execute('${o.id}')" style="padding:5px 10px; font-size:0.8rem; margin-inline-end:5px;">تنفيذ</button>`;
                        actions += `<button onclick="Orders.withdraw('${o.id}')" style="padding:5px 10px; font-size:0.8rem; background-color:#ff9800; color:white; border:none; margin-inline-end:5px;">سحب</button>`;
                    }
                    if (o.status === 'Rejected') {
                        actions += `<button onclick="Orders.reopen('${o.id}')" style="padding:5px 10px; font-size:0.8rem; background-color:#17a2b8; color:white; border:none; margin-inline-end:5px;">إعادة فتح</button>`;
                        actions += `<button onclick="Orders.cancelFinal('${o.id}')" style="padding:5px 10px; font-size:0.8rem; background-color:#343a40; color:white; border:none; margin-inline-end:5px;">إلغاء</button>`;
                    }

                    actions += `<button class="secondary" onclick="Orders.printInvoice('${o.id}')" style="padding:5px 10px; font-size:0.8rem; margin-inline-end:5px;"><i class="fas fa-print"></i></button>`;

                    if (['Pending', 'Withdrawn', 'Cancelled'].includes(o.status) || !o.status) {
                        actions += `<button class="secondary" onclick="Orders.delete('${o.id}')" style="padding:5px 10px; font-size:0.8rem; color:red; border-color:red; margin-inline-end:5px;"><i class="fas fa-trash"></i></button>`;
                    }

                    return `
                    <tr>
                        <td>#${o.id}</td>
                        <td>${o.item} ${o.status === 'Rejected' ? ('<br><small style="color:red">' + (o.rejectionReason || '') + '</small>') : ''}</td>
                        <td style="font-weight:600;color:#00A59B">${o.partner || "—"}</td>
                        <td>${Number(o.cost || 0).toLocaleString('ar-SA')} ريال</td>
                        <td>${o.date}</td>
                        <td>${statusBadge}</td>
                        <td>${actions}</td>
                    </tr>`;
                }).join('');
            }

            // Populate merchants dropdown
            Orders.populateMerchants();

        } catch (e) {
            console.error('Orders.load error:', e);
            const tbody = document.getElementById('ordersTableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:red;text-align:center">حدث خطأ في تحميل البيانات: ${e.message}</td></tr>`;
        }
    },

    currentWithdrawId: null,

    withdraw: (id) => {
        Orders.currentWithdrawId = id;
        document.getElementById('withdrawModal').style.display = 'flex';
        Orders.populateReassignDropdown();
    },

    closeWithdrawModal: () => {
        document.getElementById('withdrawModal').style.display = 'none';
        Orders.currentWithdrawId = null;
    },

    populateReassignDropdown: () => {
        const select = document.getElementById('reassignPartnerSelect');
        if (!select) return;
        const merchants = Storage.get('merchants') || [];
        select.innerHTML = '<option value="">اختر شريكاً جديداً...</option>';
        merchants.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            opt.text = m.name;
            select.appendChild(opt);
        });
    },

    confirmReassign: () => {
        const id = Orders.currentWithdrawId;
        const newPartner = document.getElementById('reassignPartnerSelect').value;
        if (!newPartner) return alert('يرجى اختيار شريك جديد');

        let orders = Storage.get('supply_orders') || [];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].partner = newPartner;
            orders[index].status = 'Pending'; // Reset to pending
            Storage.set('supply_orders', orders);
            alert('تم إسناد الطلب للشريك الجديد بنجاح');
            Orders.closeWithdrawModal();
            location.reload();
        }
    },

    confirmCancel: () => {
        const id = Orders.currentWithdrawId;
        if (!confirm('هل أنت متأكد من إلغاء هذا الطلب نهائياً؟')) return;

        let orders = Storage.get('supply_orders') || [];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].status = 'Cancelled';
            Storage.set('supply_orders', orders);
            alert('تم إلغاء الطلب بنجاح');
            Orders.closeWithdrawModal();
            location.reload();
        }
    },

    delete: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
        let orders = Storage.get('supply_orders') || [];
        orders = orders.filter(o => o.id !== id);
        Storage.set('supply_orders', orders);
        Orders.load();
    },

    printInvoice: (id) => {
        const orders = Storage.get('supply_orders') || [];
        const order = orders.find(o => o.id === id);
        if (!order) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>فاتورة أمر توريد #${order.id}</title>
                <style>
                    body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 40px; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .details { font-size: 1.1rem; line-height: 1.8; }
                    .total { margin-top: 30px; font-size: 1.5rem; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>فاتورة أمر توريد</h1>
                    <p>رقم الأمر: #${order.id}</p>
                    <p>التاريخ: ${order.date}</p>
                </div>
                <div class="details">
                    <p><strong>الصنف/الخدمة:</strong> ${order.item}</p>
                    <p><strong>الشريك المنفذ:</strong> ${order.partner}</p>
                    <p><strong>الحالة:</strong> ${order.status}</p>
                    <div class="total">الإجمالي: ${Number(order.cost).toLocaleString('ar-SA')} ريال</div>
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
        
        // Always refresh options
        select.innerHTML = '<option value="">اختر الشريك...</option>';
        
        let merchants = Storage.get('merchants') || [];
        
        // Filter only Active merchants
        const activeMerchants = merchants.filter(m => m.status === 'نشط' || m.status === 'Active');
        
        // Sort alphabetically
        activeMerchants.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        if (activeMerchants.length === 0) {
             // Fallback if no active merchants found (show all or seed?)
             // Let's fallback to showing all if none active, or just keep empty
             if (merchants.length > 0) {
                 // Show all if none active
                 merchants.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.name;
                    opt.text = m.name + ' (' + m.status + ')';
                    select.appendChild(opt);
                 });
             }
             return;
        }

        activeMerchants.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            opt.text = m.name;
            select.appendChild(opt);
        });
        console.log('Populated ' + activeMerchants.length + ' active merchants');
    },

    execute: (id) => {
        if (!confirm('هل أنت متأكد من تنفيذ هذا الطلب؟')) return;
        let orders = Storage.get('supply_orders') || [];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].status = 'Completed';
            Storage.set('supply_orders', orders);
            Orders.load();
        }
    },

    reopen: (id) => {
        if (!confirm('هل أنت متأكد من إعادة فتح هذا الطلب؟')) return;
        let orders = Storage.get('supply_orders') || [];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].status = 'Pending';
            Storage.set('supply_orders', orders);
            Orders.load();
        }
    },

    updateStatus: (id, status, reason) => {
        let orders = Storage.get('supply_orders') || [];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].status = status;
            if (reason) orders[index].rejectionReason = reason;
            Storage.set('supply_orders', orders);
            Orders.load();
        }
    }
};;

/* ===========================
   ONLOAD CONTROLLER
=========================== */
window.onload = () => {
    try {
        initData();
        migrateData(); // Patch old data with identity fields
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
    currentTicketId: null,

    init: () => {
        if (!Auth.user) return;
        const container = document.getElementById('ticketListContainer');
        if (container) {
            container.style.display = 'block';
            Support.loadTickets();
        }
    },

    submitTicket: () => {
        const title = document.getElementById('ticketTitle').value.trim();
        const desc = document.getElementById('ticketDesc').value.trim();

        if (!title || !desc) return alert('يرجى تعبئة جميع الحقول');

        const ticket = {
            id: Date.now(),
            sender: Auth.user.name,
            senderRole: Auth.user.role,
            senderUsername: Auth.user.username || Auth.user.identity,
            title: title,
            desc: desc,
            date: new Date().toLocaleDateString('ar-SA'),
            status: 'جديد', // جديد, مسترجع, محدث, مغلق
            rating: 0,
            replies: [] // Array of { sender, role, text, date }
        };

        Storage.add('tickets', ticket);
        alert('تم إرسال تذكرتك بنجاح!');
        document.getElementById('ticketTitle').value = '';
        document.getElementById('ticketDesc').value = '';
        Support.loadTickets();
    },

    loadTickets: () => {
        const tbody = document.getElementById('ticketsTableBody');
        if (!tbody) return;

        let tickets = Storage.get('tickets') || [];

        // Show tickets based on role
        if (Auth.user.role !== 'admin') {
            const myId = Auth.user.username || Auth.user.identity;
            tickets = tickets.filter(t => t.senderUsername === myId || (!t.senderUsername && t.sender === Auth.user.name));
        }

        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">لا توجد تذاكر</td></tr>';
            return;
        }

        tbody.innerHTML = tickets.map(t => {
            const statusColors = {
                'جديد': 'status-active',
                'محدث': 'status-active',
                'مسترجع': 'status-warning',
                'مغلق': 'status-inactive'
            };
            const statusBadge = `<span class="status-badge ${statusColors[t.status] || ''}">${t.status}</span>`;

            return `
            <tr>
                <td>#${t.id}</td>
                <td>${t.sender} (${t.senderRole || 'مستخدم'})</td>
                <td>${t.title}</td>
                <td>${t.date}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="secondary" onclick="Support.openTicket(${t.id})" style="padding:5px 10px; font-size:0.85rem;">
                        <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                </td>
            </tr>
        `}).join('');
    },

    openTicket: (id) => {
        const tickets = Storage.get('tickets') || [];
        const t = tickets.find(x => x.id === id);
        if (!t) return;

        Support.currentTicketId = id;

        // Populate Modal
        document.getElementById('modalTicketTitle').innerText = `تذكرة #${t.id}: ${t.title}`;

        // Build History HTML
        const historyContainer = document.getElementById('ticketHistory');
        let html = `
            <div class="message-box original">
                <div class="msg-header"><strong>${t.sender}</strong> <small>${t.date}</small></div>
                <div class="msg-body">${t.desc}</div>
            </div>
        `;

        if (t.replies && t.replies.length > 0) {
            html += t.replies.map(r => `
                <div class="message-box ${r.role === 'admin' ? 'admin-reply' : 'user-reply'}">
                    <div class="msg-header"><strong>${r.sender}</strong> <small>${r.date}</small></div>
                    <div class="msg-body">${r.text}</div>
                </div>
            `).join('');
        }
        historyContainer.innerHTML = html;
        historyContainer.scrollTop = historyContainer.scrollHeight;

        // Configure Buttons based on Role & Status
        const btnReturn = document.getElementById('btnReturn');
        const btnClose = document.getElementById('btnCloseTicket');
        const btnReply = document.getElementById('btnReply');
        const replyText = document.getElementById('replyText');

        // Create new buttons if they don't exist
        let btnAccept = document.getElementById('btnAccept');
        if (!btnAccept) {
            btnAccept = document.createElement('button');
            btnAccept.id = 'btnAccept';
            btnAccept.style.backgroundColor = '#28a745'; // Green
            btnAccept.innerHTML = '<i class="fas fa-check"></i> قبول التذكرة';
            btnAccept.onclick = Support.acceptTicket;
            btnAccept.style.marginLeft = '10px';
            const actionDiv = document.getElementById('ticketActionArea').querySelector('div');
            if (actionDiv) actionDiv.prepend(btnAccept);
        }

        let btnExecute = document.getElementById('btnExecute');
        if (!btnExecute) {
            btnExecute = document.createElement('button');
            btnExecute.id = 'btnExecute';
            btnExecute.style.backgroundColor = '#17a2b8'; // Blue
            btnExecute.innerHTML = '<i class="fas fa-tools"></i> تنفيذ التذكرة';
            btnExecute.onclick = Support.executeTicket;
            btnExecute.style.marginLeft = '10px';
            const actionDiv = document.getElementById('ticketActionArea').querySelector('div');
            if (actionDiv) actionDiv.insertBefore(btnExecute, btnReturn);
        }

        replyText.value = '';
        btnReturn.style.display = 'none';
        btnClose.style.display = 'none';
        btnReply.style.display = 'none';
        btnAccept.style.display = 'none';
        btnExecute.style.display = 'none';
        replyText.style.display = 'none';

        if (t.status === 'مغلق') {
            // Closed: Read only
            const ratingHtml = (t.rating > 0) ? '⭐'.repeat(t.rating) : 'لم يتم التقييم';
            historyContainer.innerHTML += `<div style="text-align:center; padding:10px; border-top:1px solid #eee; margin-top:10px;"><strong>التذكرة مغلقة</strong><br>التقييم: ${ratingHtml}</div>`;

            if (Auth.user.role !== 'admin' && !t.rating) {
                historyContainer.innerHTML += `
                 <div style="text-align:center; margin-top:10px;">
                    <p>قيم لخدمة:</p>
                    <select onchange="Support.rateTicket(${t.id}, this.value)" style="padding:5px;">
                        <option value="">-- اختر --</option>
                        <option value="5">5 ممتاز</option>
                        <option value="4">4 جيد جدا</option>
                        <option value="3">3 جيد</option>
                        <option value="2">2 مقبول</option>
                        <option value="1">1 سيء</option>
                    </select>
                 </div>`;
            }
        } else {
            // Open Action Area
            replyText.style.display = 'block';

            if (Auth.user.role === 'admin') {
                btnReturn.style.display = 'inline-block';
                btnReply.style.display = 'inline-block';
                btnReply.innerHTML = '<i class="fas fa-reply"></i> رد عادي';

                // Status Flow Logic
                if (t.status === 'جديد' || t.status === 'محدث' || t.status === 'مسترجع') {
                    // Stage 1: Accept
                    btnAccept.style.display = 'inline-block';
                } else if (t.status === 'قيد التنفيذ') {
                    // Stage 2: Execute
                    btnExecute.style.display = 'inline-block';
                } else if (t.status === 'تم التنفيذ') {
                    // Stage 3: Close
                    btnClose.style.display = 'inline-block';
                }
            } else {
                // User
                btnReply.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال رد';
                btnReply.style.display = 'inline-block';
            }
        }

        // Show Modal
        const modal = document.getElementById('ticketModal');
        if (modal) {
            modal.classList.add('active');
            if (modal.style.display !== 'block') modal.style.display = 'block';
        }
    },

    closeModal: () => {
        const modal = document.getElementById('ticketModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
        Support.currentTicketId = null;
    },

    sendReply: () => {
        const text = document.getElementById('replyText').value.trim();
        if (!text) return alert('اكتب الرد أولاً');

        let newStatus = 'قيد المعالجة';
        // Need to check current status to avoid resetting flow
        const tickets = Storage.get('tickets') || [];
        const t = tickets.find(x => x.id === Support.currentTicketId);
        if (t) newStatus = t.status;

        if (Auth.user.role !== 'admin') {
            newStatus = 'محدث';
        }

        Support.addReplyToAction(text, newStatus);
    },

    acceptTicket: () => {
        const text = document.getElementById('replyText').value.trim();
        Support.addReplyToAction(text || 'تم قبول التذكرة وجاري العمل عليها.', 'قيد التنفيذ');
    },

    executeTicket: () => {
        const text = document.getElementById('replyText').value.trim();
        Support.addReplyToAction(text || 'تم تنفيذ الطلب بنجاح.', 'تم التنفيذ');
    },

    returnTicketAction: () => {
        const text = document.getElementById('replyText').value.trim();
        if (!text) return alert('يرجى كتابة سبب الإعادة في خانة الرد');
        Support.addReplyToAction(text, 'مسترجع');
    },

    closeTicketAction: () => {
        const text = document.getElementById('replyText').value.trim();
        if (confirm('هل أنت متأكد من إغلاق التذكرة نهائياً؟')) {
            Support.addReplyToAction(text || 'تم إغلاق التذكرة.', 'مغلق');
        }
    },

    addReplyToAction: (text, newStatus) => {
        const id = Support.currentTicketId;
        const tickets = Storage.get('tickets') || [];
        const idx = tickets.findIndex(t => t.id === id);
        if (idx === -1) return;

        const reply = {
            sender: Auth.user.name,
            role: Auth.user.role,
            text: text,
            date: new Date().toLocaleDateString('ar-SA') + ' ' + new Date().toLocaleTimeString('ar-SA')
        };

        if (!tickets[idx].replies) tickets[idx].replies = [];
        tickets[idx].replies.push(reply);
        tickets[idx].status = newStatus;

        Storage.set('tickets', tickets);
        alert('تم تنفيذ الإجراء بنجاح');
        Support.closeModal();
        Support.loadTickets();
    },

    rateTicket: (id, rating) => {
        if (!rating) return;
        const tickets = Storage.get('tickets') || [];
        const idx = tickets.findIndex(t => t.id === id);
        if (idx !== -1) {
            tickets[idx].rating = parseInt(rating);
            Storage.set('tickets', tickets);
            alert('شكراً لتقييمك!');
            Support.openTicket(id); // Reload modal to show stars
        }
    }
};

/* ===========================
   DUMMY DATA SEEDER
   =========================== */
function injectDummyData() {
    if (!confirm('سيتم مسح البيانات الحالية واستبدالها ببيانات تجريبية. هل أنت متأكد؟')) return;

    const beneficiaries = [
        { id: 1, name: 'أحمد محمد علي', identity: '1010101010', phone: '0500000001' },
        { id: 2, name: 'سارة عبدالله عمر', identity: '1020202020', phone: '0500000002' },
        { id: 3, name: 'فاطمة حسن سعيد', identity: '1030303030', phone: '0500000003' },
        { id: 4, name: 'خالد عبدالعزيز', identity: '1040404040', phone: '0500000004' },
        { id: 5, name: 'نورة صالح', identity: '1050505050', phone: '0500000005' },
        { id: 6, name: 'عمر يوسف', identity: '1060606060', phone: '0500000006' },
        { id: 7, name: 'ليلى محمود', identity: '1070707070', phone: '0500000007' },
        { id: 8, name: 'سعيد القحطاني', identity: '1080808080', phone: '0500000008' },
        { id: 9, name: 'منى الدوسري', identity: '1090909090', phone: '0500000009' },
        { id: 10, name: 'عبدالله العنزي', identity: '1101010101', phone: '0500000010' }
    ];

    const wallets = [
        { id: 1, name: 'السلة الغذائية', funds: 150000, merchants: 'أسواق العثيم, بندة, الدانوب', status: 'نشط' },
        { id: 2, name: 'كسوة الشتاء', funds: 75000, merchants: 'سنتربوينت, ماكس, رد تاغ', status: 'نشط' },
        { id: 3, name: 'الأجهزة الكهربائية', funds: 50000, merchants: 'إكسترا, المنيع', status: 'نشط' },
        { id: 4, name: 'دعم الإيجار', funds: 200000, merchants: 'خدمات إلكترونية', status: 'نشط' }
    ];

    const merchants = [
        { id: 101, name: 'أسواق العثيم', category: 'مواد غذائية', transactions: 145, status: 'نشط' },
        { id: 102, name: 'بندة', category: 'مواد غذائية', transactions: 98, status: 'نشط' },
        { id: 103, name: 'الدانوب', category: 'مواد غذائية', transactions: 45, status: 'نشط' },
        { id: 201, name: 'سنتربوينت', category: 'ملابس', transactions: 76, status: 'نشط' },
        { id: 202, name: 'إكسترا', category: 'إلكترونيات', transactions: 32, status: 'نشط' },
        { id: 301, name: 'صيدلية النهدي', category: 'أدوية', transactions: 210, status: 'نشط' }
    ];

    const cards = [
        { id: 1, number: '10001001', balance: 500, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'أحمد محمد علي' },
        { id: 2, number: '10001002', balance: 350, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'سارة عبدالله عمر' },
        { id: 3, number: '10001003', balance: 0, status: 'موقوف', wallet: 'السلة الغذائية', beneficiary: 'فاطمة حسن سعيد' },
        { id: 4, number: '20002001', balance: 1000, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'خالد عبدالعزيز' },
        { id: 5, number: '20002002', balance: 800, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'نورة صالح' },
        { id: 6, number: '30003001', balance: 2500, status: 'نشط', wallet: 'الأجهزة الكهربائية', beneficiary: 'عمر يوسف' },
        { id: 7, number: '10001004', balance: 450, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'ليلى محمود' },
        { id: 8, number: '20002003', balance: 600, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'سعيد القحطاني' }
    ];

    const supplyOrders = [
        { id: '100201', item: 'توريد سلال غذائية (أرز، سكر، زيت) - 500 سلة', partner: 'أسواق العثيم', cost: 15000, date: '2024-01-05', status: 'Completed' },
        { id: '100202', item: 'توريد بطانيات شتوية (200 بطانية)', partner: 'سنتربوينت', cost: 8000, date: '2024-01-10', status: 'Completed' },
        { id: '100203', item: 'توريد أجهزة تكييف سبليت (15 جهاز)', partner: 'إكسترا', cost: 25000, date: '2024-02-01', status: 'Completed' },
        { id: '100204', item: 'صيانة مستودع الجمعية وتجديد الأرفف', partner: 'خدمات إلكترونية', cost: 4500, date: '2024-02-15', status: 'Rejected', rejectionReason: 'السعر مرتفع جداً مقارنة بالسوق' },
        { id: '100205', item: 'توريد ملابس أطفال صيفية (300 قطعة)', partner: 'ماكس', cost: 12000, date: '2024-03-01', status: 'Completed' },
        { id: '100206', item: 'كوبونات شرائية للعائلات المحتاجة', partner: 'الدانوب', cost: 50000, date: '2024-03-15', status: 'Withdrawn' },
        { id: '100207', item: 'توريد أدوية أطفال ومكملات غذائية', partner: 'صيدلية النهدي', cost: 18000, date: '2024-04-01', status: 'Completed' },
        { id: '100208', item: 'حقائب مدرسية وأدوات قرطاسية (500 طالب)', partner: 'مكتبة جرير', cost: 9500, date: '2024-04-20', status: 'Completed' },
        { id: '100209', item: 'توريد مواد تنظيف ومعقمات', partner: 'بندة', cost: 5200, date: '2024-05-10', status: 'Accepted' },
        { id: '100210', item: 'توريد ثلاجات للعائلات المحتاجة (20 ثلاجة)', partner: 'إكسترا', cost: 32000, date: '2024-06-01', status: 'Pending' },
        { id: '100211', item: 'أدوات كهربائية منزلية (غسالات + مكانس)', partner: 'المنيع', cost: 21000, date: '2024-06-15', status: 'Completed' },
        { id: '100212', item: 'ملابس شتوية نسائية ورجالية', partner: 'سنتربوينت', cost: 14000, date: '2024-07-01', status: 'Accepted' },
        { id: '100213', item: 'أثاث منزلي أساسي (أسرّة وخزائن)', partner: 'ايكيا', cost: 45000, date: '2024-07-20', status: 'Completed' },
        { id: '100214', item: 'أدوات مطبخ ومستلزمات طبخ', partner: 'ساكو', cost: 7800, date: '2024-08-05', status: 'Completed' },
        { id: '100215', item: 'سجاد ومفروشات للعائلات الجديدة', partner: 'هوم سنتر', cost: 19000, date: '2024-08-20', status: 'Pending' },
        { id: '100216', item: 'لوازم مدرسية للفصل الدراسي الثاني', partner: 'مكتبة جرير', cost: 11000, date: '2024-09-01', status: 'Accepted' },
        { id: '100217', item: 'توريد حليب أطفال ومواد غذائية خاصة', partner: 'التميمي', cost: 22000, date: '2024-09-15', status: 'Completed' },
        { id: '100218', item: 'أجهزة تدفئة للشتاء (50 جهاز)', partner: 'إكسترا', cost: 17500, date: '2024-10-01', status: 'Pending' }
    ];

    Storage.set('users', [{ id: 1, name: 'مدير النظام', username: 'admin', password: '123', role: 'admin' }, { id: 2, name: 'تاجر', username: 'merchant', password: '123', role: 'merchant' }]);
    Storage.set('beneficiaries', beneficiaries);
    Storage.set('cards', cards);
    Storage.set('wallets', wallets);
    Storage.set('merchants', merchants);
    Storage.set('supply_orders', supplyOrders);
    Storage.set('transactions', [
        { id: 501, card: '10001001', amount: 120, date: new Date().toLocaleDateString('ar-SA'), merchant: 'أسواق العثيم' },
        { id: 502, card: '20002001', amount: 350, date: new Date().toLocaleDateString('ar-SA'), merchant: 'سنتربوينت' }
    ]);

    alert('تم تحميل البيانات التجريبية بنجاح!');
    location.reload();
}

/* ===========================
   INITIALIZATION
=========================== */
window.onload = function () {
    initData();
    migrateData();
    Auth.checkSession();
    Settings.load();
    loadDashboard();
    loadUsersTable();
    loadCardsTable();
    loadWalletsTable();
    loadMerchantsTable();
};

// Expose globals
window.Storage = Storage;
window.Auth = Auth;
window.Orders = Orders;
window.Support = Support;

/* ===========================
   DATA MIGRATION (v2)
   Adds missing fields for Grid View
   =========================== */
(function migrateData() {
    // 1. Migrate Wallets
    let wallets = Storage.get('wallets') || [];
    let walletsChanged = false;
    wallets.forEach(w => {
        if (!w.target) {
             w.target = 50000;
             w.collected = Math.floor(Math.random() * 20000) + 5000;
             w.category = 'عام';
             w.color = '#00A59B';
             w.icon = 'fas fa-wallet';
             walletsChanged = true;
        }
    });
    if (walletsChanged) Storage.set('wallets', wallets);

    // 2. Migrate Merchants
    let merchants = Storage.get('merchants') || [];
    let merchantsChanged = false;
    merchants.forEach(m => {
        if (!m.current_balance) {
             // Add contact info and location
             m.contactPerson = 'مدير الفرع';
             m.phone = '050xxxxxxx';
             m.email = 'info@' + m.name.replace(/\s/g,'') + '.com';
             m.location = 'الرياض - حي العليا';
             m.logo = 'assets/logo.png'; // Placeholder
             merchantsChanged = true;
        }
    });
    if (merchantsChanged) Storage.set('merchants', merchants);
    
    console.log('Data Migration v2 Complete');
})();
