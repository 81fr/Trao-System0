/* ===========================
   STORAGE
=========================== */
const Storage = {
    get: (key) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return (key === 'customLabels' ? null : []);
            return JSON.parse(raw);
        } catch (e) {
            console.error(`Storage GET error for key ${key}:`, e);
            return (key === 'customLabels' ? null : []);
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Storage SET error for key ${key}:`, e);
            if (typeof showToast === 'function') showToast('فشل في حفظ البيانات - قد تكون الذاكرة ممتلئة', 'error');
        }
    },
    add: (key, item) => {
        try {
            const data = Array.isArray(Storage.get(key)) ? Storage.get(key) : [];
            data.push(item);
            Storage.set(key, data);
        } catch (e) {
            console.error(`Storage ADD error for key ${key}:`, e);
        }
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
    // Helper function for random dates
    function getRandomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
    }

    const firstNamesM = ['محمد', 'أحمد', 'عبدالله', 'خالد', 'فهد', 'عبدالرحمن', 'سعد', 'سلطان', 'فيصل', 'صالح', 'علي', 'ابراهيم', 'عمر', 'طارق', 'حسن', 'حسين', 'ياسر', 'نايف', 'وليد', 'ماجد', 'تركي', 'سعود', 'نواف', 'ريان'];
    const firstNamesF = ['سارة', 'نورة', 'فاطمة', 'مريم', 'هند', 'العنود', 'ريم', 'شهد', 'مها', 'عبير', 'ندى', 'نوف', 'أمل', 'حصة', 'هيفاء', 'منيرة', 'الجازي', 'شروق', 'روان'];
    const familyNames = ['الغامدي', 'الشمري', 'القحطاني', 'العتيبي', 'المطيري', 'الدوسري', 'العنزي', 'الحربي', 'الصريصري', 'السبيعي', 'الشهراني', 'الأحمري', 'الشهري', 'الزهراني', 'المالكي', 'عسيري', 'التميمي', 'البقمي', 'الرشيدي'];

    const regions = ['الرياض -', 'جدة -', 'الدمام -', 'مكة -', 'المدينة -', 'الطائف -'];
    const districts = ['العليا', 'النخيل', 'الملز', 'الحمراء', 'الخالدية', 'الربيع', 'النسيم', 'السليمانية', 'الروضة', 'الصفا'];

    // Generate Beneficiaries
    let beneficiaries = [];
    if (localStorage.getItem('beneficiaries') === null) {
        for (let i = 1; i <= 60; i++) {
            const isMale = Math.random() > 0.4;
            const firstName = isMale ? firstNamesM[Math.floor(Math.random() * firstNamesM.length)] : firstNamesF[Math.floor(Math.random() * firstNamesF.length)];
            const fatherName = firstNamesM[Math.floor(Math.random() * firstNamesM.length)];
            const grandName = firstNamesM[Math.floor(Math.random() * firstNamesM.length)];
            const familyName = familyNames[Math.floor(Math.random() * familyNames.length)];
            const idNumber = '1' + Math.floor(100000000 + Math.random() * 900000000); // 10 digit ID starting with 1
            const mobile = '05' + Math.floor(10000000 + Math.random() * 90000000);

            beneficiaries.push({
                id: i,
                name: `${firstName} ${fatherName} ${grandName} ${familyName}`,
                firstName: firstName,
                fatherName: fatherName,
                grandName: grandName,
                familyName: familyName,
                nationality: 'saudi',
                identity: idNumber,
                mobile: mobile,
                fileNum: `F00${i}`
            });
        }
        Storage.set('beneficiaries', beneficiaries);
    } else {
        beneficiaries = Storage.get('beneficiaries');
    }

    // Generate Wallets
    const walletsDefault = [
        { id: 1, name: 'إعانة غذائية', funds: 150000, merchants: 'أسواق العثيم', status: 'نشط' },
        { id: 2, name: 'دعم كساء', funds: 85000, merchants: 'سنتربوينت', status: 'نشط' },
        { id: 3, name: 'أجهزة ومنزل', funds: 120000, merchants: 'إكسترا', status: 'نشط' },
        { id: 4, name: 'رعاية صحية', funds: 60000, merchants: 'صيدلية النهدي', status: 'نشط' },
        { id: 5, name: 'حقيبة مدرسية', funds: 30000, merchants: 'مكتبة جرير', status: 'نشط' }
    ];
    if (localStorage.getItem('wallets') === null) {
        Storage.set('wallets', walletsDefault);
    }

    // Generate Cards
    if (localStorage.getItem('cards') === null) {
        let cards = [];
        let cardId = 1;
        beneficiaries.forEach((ben, index) => {
            const numWallets = Math.floor(Math.random() * 3) + 1; // 1 to 3 cards per person
            for (let w = 0; w < numWallets; w++) {
                const wallet = walletsDefault[Math.floor(Math.random() * walletsDefault.length)].name;
                const balance = Math.floor(Math.random() * 200) * 10; // 0 to 2000 in tens
                const status = Math.random() > 0.1 ? 'نشط' : 'موقوف';
                const expYear = new Date().getFullYear() + Math.floor(Math.random() * 4);
                const expMonth = ('0' + (Math.floor(Math.random() * 12) + 1)).slice(-2);

                cards.push({
                    id: cardId++,
                    number: '1' + Math.floor(1000000 + Math.random() * 9000000), // 8 digit
                    balance: balance,
                    status: status,
                    wallet: wallet,
                    beneficiary: ben.name,
                    identity: ben.identity,
                    pin: '1234',
                    password: '1234',
                    expiry: `${expYear}-${expMonth}-01`,
                    issueDate: getRandomDate(new Date(2023, 0, 1), new Date())
                });
            }
        });
        Storage.set('cards', cards);
    }

    // Generate Merchants
    const merchantBases = [
        { name: 'أسواق العثيم', category: 'مواد غذائية' }, { name: 'بندة', category: 'مواد غذائية' }, { name: 'الدانوب', category: 'مواد غذائية' }, { name: 'التميمي', category: 'مواد غذائية' }, { name: 'لولو هايبر', category: 'مواد غذائية' }, { name: 'أسواق المزرعة', category: 'مواد غذائية' },
        { name: 'سنتربوينت', category: 'ملابس' }, { name: 'ماكس', category: 'ملابس' }, { name: 'رد تاغ', category: 'ملابس' }, { name: 'مذركير', category: 'ملابس' },
        { name: 'إكسترا', category: 'إلكترونيات' }, { name: 'المنيع', category: 'إلكترونيات' }, { name: 'الشتاء والصيف', category: 'إلكترونيات' },
        { name: 'صيدلية النهدي', category: 'أدوية' }, { name: 'صيدلية الدواء', category: 'أدوية' }, { name: 'صيدلية وايتس', category: 'أدوية' },
        { name: 'مكتبة جرير', category: 'مستلزمات مدرسية' }, { name: 'مكتبة العبيكان', category: 'مستلزمات مدرسية' },
        { name: 'ايكيا', category: 'أثاث' }, { name: 'ساكو', category: 'أدوات منزلية' }, { name: 'هوم سنتر', category: 'أثاث' }, { name: 'هوم بوكس', category: 'أثاث' }
    ];

    if (localStorage.getItem('merchants') === null) {
        let merchants = [];
        merchantBases.forEach((mb, index) => {
            const loc = regions[Math.floor(Math.random() * regions.length)] + ' ' + districts[Math.floor(Math.random() * districts.length)];
            const contact = firstNamesM[Math.floor(Math.random() * firstNamesM.length)] + ' ' + familyNames[Math.floor(Math.random() * familyNames.length)];
            merchants.push({
                id: 100 + index + 1,
                name: mb.name,
                category: mb.category,
                transactions: Math.floor(Math.random() * 500) + 50,
                status: Math.random() > 0.05 ? 'نشط' : 'موقوف',
                contactPerson: contact,
                phone: '05' + Math.floor(10000000 + Math.random() * 90000000),
                email: 'info@' + mb.name.replace(/\s+/g, '').replace('أ', 'a').toLowerCase() + '.sa',
                location: loc,
                crNumber: '10' + Math.floor(10000000 + Math.random() * 90000000),
                vatNumber: '310' + Math.floor(100000000000 + Math.random() * 900000000000), // 15 digits
                bankName: ['البنك الأهلي', 'مصرف الراجحي', 'بنك الرياض', 'مصرف الإنماء'][Math.floor(Math.random() * 4)],
                iban: 'SA' + Math.floor(10 + Math.random() * 89) + '00000000' + Math.floor(1000000000 + Math.random() * 9000000000)
            });
        });
        Storage.set('merchants', merchants);
    }

    // Generate Transactions
    if (localStorage.getItem('transactions') === null) {
        let transactions = [];
        const cards = Storage.get('cards') || [];
        const merchantsList = Storage.get('merchants') || merchantBases;
        if (cards.length > 0) {
            for (let i = 1; i <= 200; i++) { // 200 tx
                const card = cards[Math.floor(Math.random() * cards.length)];
                const merchant = merchantsList[Math.floor(Math.random() * merchantsList.length)];
                transactions.push({
                    id: 1000 + i,
                    card: card.number,
                    amount: Math.floor(Math.random() * 400) + 10,
                    date: getRandomDate(new Date(2023, 10, 1), new Date()),
                    merchant: merchant.name
                });
            }
            // Sort by date
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            Storage.set('transactions', transactions);
        }
    }

    // Generate Orders
    if (localStorage.getItem('supply_orders') === null || Storage.get('supply_orders').length === 0) {
        let orders = [];
        const statuses = ['Pending', 'Accepted', 'Completed', 'Completed', 'Completed', 'Rejected', 'Withdrawn'];
        const items = ['توريد سلال غذائية (أرز، سكر، زيت)', 'توريد بطانيات شتوية', 'توريد أجهزة تكييف سبليت', 'صيانة مستودع الجمعية وتجديد الأرفف', 'توريد ملابس أطفال صيفية', 'كوبونات شرائية للعائلات المحتاجة', 'توريد أدوية أطفال ومكملات غذائية', 'حقائب مدرسية وأدوات قرطاسية', 'توريد مواد تنظيف ومعقمات', 'توريد ثلاجات للعائلات المحتاجة', 'أدوات كهربائية منزلية (غسالات + مكانس)', 'ملابس شتوية نسائية ورجالية', 'أثاث منزلي أساسي (أسرّة وخزائن)', 'أدوات مطبخ ومستلزمات طبخ', 'لوازم مدرسية للفصل الدراسي الثاني', 'توريد حليب أطفال ومواد غذائية خاصة', 'أجهزة تدفئة للشتاء'];
        const merchantsList = Storage.get('merchants') || merchantBases;

        for (let i = 1; i <= 40; i++) {
            orders.push({
                id: '100' + (200 + i),
                item: items[Math.floor(Math.random() * items.length)] + (Math.random() > 0.5 ? ' - كمية ضخمة' : ''),
                partner: merchantsList[Math.floor(Math.random() * merchantsList.length)].name,
                cost: Math.floor(Math.random() * 900) * 100 + 1000,
                date: getRandomDate(new Date(2023, 6, 1), new Date()),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                rejectionReason: Math.random() > 0.8 ? 'السعر مرتفع جداً مقارنة بالسوق' : ''
            });
        }
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        Storage.set('supply_orders', orders);
    }

    // Generate Users
    if (localStorage.getItem('users') === null) {
        Storage.set('users', [
            { id: 1, name: 'مدير النظام', username: 'admin', password: '123', role: 'admin' },
            { id: 2, name: 'سوبرماركت الرياض', username: 'merchant', password: '123', role: 'merchant', linkedEntity: 'أسواق العثيم' },
            { id: 3, name: 'موظف مبيعات', username: 'cashier', password: '123', role: 'merchant', linkedEntity: 'سنتربوينت' }
        ]);
        // Also map some beneficiaries to users so they can log in
        let users = Storage.get('users');
        beneficiaries.slice(0, 5).forEach((ben, i) => { // Top 5 beneficiaries get logins explicitly for testing
            users.push({
                id: 100 + i,
                name: ben.name,
                username: `ben${i + 1}`,
                password: '123',
                role: 'beneficiary',
                linkedEntity: ben.name
            });
        });
        Storage.set('users', users);
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
        Storage.set('categories', ['إعانة غذائية', 'دعم كساء', 'خدمات عامة', 'رعاية صحية', 'أجهزة ومنزل']);
    }

    // Seed POS Products
    if (localStorage.getItem('products') === null) {
        Storage.set('products', [
            { id: 1, name: 'أرز بسمتي 5كج', category: 'مواد غذائية', price: 45.00, image: '🌾' },
            { id: 2, name: 'زيت دوار الشمس 1.5ل', category: 'مواد غذائية', price: 18.50, image: '🌻' },
            { id: 3, name: 'سكر ناعم 2كج', category: 'مواد غذائية', price: 12.00, image: '🍭' },
            { id: 4, name: 'حليب كامل الدسم 1ل', category: 'ألبان', price: 6.00, image: '🥛' },
            { id: 5, name: 'زبادي طازج 200جم', category: 'ألبان', price: 2.00, image: '🍦' },
            { id: 6, name: 'جبنة فيتا 500جم', category: 'ألبان', price: 14.00, image: '🧀' },
            { id: 7, name: 'دجاج مجمد 1000جم', category: 'لحوم ومجمدات', price: 19.00, image: '🍗' },
            { id: 8, name: 'لحم غنم مفروم 400جم', category: 'لحوم ومجمدات', price: 22.00, image: '🥩' },
            { id: 9, name: 'مياه معدنية 330مل * 40', category: 'مشروبات', price: 15.00, image: '💧' },
            { id: 10, name: 'عصير برتقال طازج', category: 'مشروبات', price: 9.00, image: '🍊' },
            { id: 11, name: 'شاي أحمر 100 كيس', category: 'مشروبات', price: 14.50, image: '☕' },
            { id: 12, name: 'حقيبة مدرسية', category: 'قرطاسية', price: 85.00, image: '🎒' },
            { id: 13, name: 'دفتر جامعي 100 ورقة', category: 'قرطاسية', price: 5.00, image: '📓' },
            { id: 14, name: 'طقم أقلام حبر', category: 'قرطاسية', price: 12.00, image: '🖋️' },
            { id: 15, name: 'ثوب رجالي شتوي', category: 'ملابس', price: 150.00, image: '🧥' },
            { id: 16, name: 'فستان أطفال', category: 'ملابس', price: 95.00, image: '👗' }
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

    // Migrate merchants: patch old merchants missing contact/regulatory fields
    const merchants = Storage.get('merchants') || [];
    let merchantsChanged = false;
    const seedContacts = {
        101: { contactPerson: 'فهد العثيم', phone: '0501234567', email: 'info@othaim.sa', location: 'الرياض - العليا', crNumber: '1010123456', vatNumber: '310123456789012', bankName: 'البنك الأهلي', iban: 'SA0380000000608010167519' },
        102: { contactPerson: 'سعد المحمدي', phone: '0509876543', email: 'info@panda.sa', location: 'جدة - الحمراء', crNumber: '4030234567', vatNumber: '310234567890123', bankName: 'مصرف الراجحي', iban: 'SA4420000000068427859940' },
        103: { contactPerson: 'ياسر الدوسري', phone: '0551234567', email: 'info@danube.sa', location: 'الرياض - النخيل', crNumber: '1010345678', vatNumber: '310345678901234', bankName: 'بنك الجزيرة', iban: 'SA5860100000022957651000' },
        104: { contactPerson: 'عمر التميمي', phone: '0561234567', email: 'info@tamimi.sa', location: 'الرياض - الربيع' },
        201: { contactPerson: 'منصور الحربي', phone: '0541234567', email: 'info@centerpoint.sa', location: 'الرياض - البوليفارد' },
        202: { contactPerson: 'طلال العنزي', phone: '0571234567', email: 'info@extra.sa', location: 'الرياض - المروج' },
        301: { contactPerson: 'سلمان النهدي', phone: '0581234567', email: 'info@nahdi.sa', location: 'جدة - البلد', crNumber: '4030456789', vatNumber: '310456789012345', bankName: 'مصرف الإنماء', iban: 'SA0595000068201234567000' },
        302: { contactPerson: 'عادل السعيد', phone: '0521234567', email: 'info@jarir.sa', location: 'الدمام - الشاطئ' },
        303: { contactPerson: 'نايف المنيع', phone: '0531234567', email: 'info@almanea.sa', location: 'الرياض - السلام' },
        304: { contactPerson: 'وليد الرشيدي', phone: '0591234567', email: 'info@max.sa', location: 'جدة - النزهة' },
        305: { contactPerson: 'إبراهيم الشهري', phone: '0511234567', email: 'info@aldawaa.sa', location: 'الرياض - النسيم' },
        306: { contactPerson: 'حمد القحطاني', phone: '0542345678', email: 'info@ikea.sa', location: 'الرياض - طريق الملك فهد' },
        307: { contactPerson: 'بدر العتيبي', phone: '0552345678', email: 'info@saco.sa', location: 'الرياض - العقيق' },
        308: { contactPerson: 'خالد البلوي', phone: '0562345678', email: 'info@homecenter.sa', location: 'جدة - التحلية' }
    };
    merchants.forEach(m => {
        if (!m.contactPerson && seedContacts[m.id]) {
            Object.assign(m, seedContacts[m.id]);
            merchantsChanged = true;
        }
    });
    if (merchantsChanged) Storage.set('merchants', merchants);
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
            const wallets = Storage.get('wallets') || [];
            walletSelect.innerHTML = '<option value="">اختر محفظة...</option>';
            wallets.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w.name; opt.innerText = w.name;
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
        if (!amount || isNaN(amount)) return;
        let wallets = Storage.get('wallets') || [];
        const w = wallets.find(x => x.id === id);
        if (w) {
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
        const pinEl = document.getElementById('cardPinInput');
        const expiryEl = document.getElementById('cardExpiryInput');
        const pin = pinEl ? pinEl.value : '';
        const expiry = expiryEl ? expiryEl.value : '';

        // Validation with visual feedback
        let hasError = false;
        if (!number) { markFieldError('cardNumInput'); hasError = true; }
        if (!wallet) { markFieldError('cardWalletInput'); hasError = true; }
        if (isNaN(balance) || balance < 0) { markFieldError('cardBalanceInput'); hasError = true; }
        if (!beneficiary) { markFieldError('cardBeneficiaryInput'); hasError = true; }
        if (hasError) return showToast('يرجى ملء جميع الحقول بشكل صحيح', 'error');

        // Get beneficiary identity
        const bens = Storage.get('beneficiaries') || [];
        const ben = bens.find(b => b.name === beneficiary);
        const identity = ben ? ben.identity : '';

        let cards = Storage.get('cards') || [];

        if (id) {
            // Edit Mode
            const index = cards.findIndex(c => c.id == id);
            if (index !== -1) {
                cards[index] = { ...cards[index], number, wallet, balance, status, beneficiary: beneficiary || 'غير محدد', identity, pin: pin || cards[index].pin, password: pin || cards[index].password, expiry: expiry || cards[index].expiry };
                Storage.set('cards', cards);
                showToast('تم تحديث البطاقة بنجاح', 'success');
            }
        } else {
            // Create Mode
            if (cards.some(c => c.number === number)) return showToast('رقم البطاقة موجود بالفعل', 'error');
            Storage.add('cards', {
                id: Date.now(), number, wallet, balance, status: status || 'نشط', beneficiary: beneficiary || 'غير محدد', identity,
                pin: pin || '1234', password: pin || '1234', expiry: expiry || '', issueDate: new Date().toLocaleDateString('ar-SA')
            });
            showToast('تم إصدار البطاقة بنجاح!', 'success');
        }

        Actions.cancelCardEdit();
        if (typeof CardPage !== 'undefined') { CardPage.refreshAll(); } else { location.reload(); }
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

        const pinEl = document.getElementById('cardPinInput');
        if (pinEl) pinEl.value = card.pin || card.password || '';
        const expiryEl = document.getElementById('cardExpiryInput');
        if (expiryEl) expiryEl.value = card.expiry || '';

        // If form is collapsed, expand it
        if (typeof CardPage !== 'undefined' && !CardPage.formOpen) CardPage.toggleForm();

        const formTitle = document.getElementById('cardFormTitle');
        if (formTitle) formTitle.textContent = 'تعديل البطاقة';

        document.getElementById('saveCardBtn').innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        document.getElementById('cancelCardEditBtn').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    cancelCardEdit: () => {
        document.getElementById('editingCardId').value = '';
        document.getElementById('cardNumInput').value = '';
        document.getElementById('cardBalanceInput').value = '';
        document.getElementById('cardStatusInput').value = 'نشط';
        const w = document.getElementById('cardWalletInput'); if (w) w.selectedIndex = 0;
        const b = document.getElementById('cardBeneficiaryInput'); if (b) b.selectedIndex = 0;
        const pinEl = document.getElementById('cardPinInput'); if (pinEl) pinEl.value = '';
        const expiryEl = document.getElementById('cardExpiryInput'); if (expiryEl) expiryEl.value = '';
        const formTitle = document.getElementById('cardFormTitle');
        if (formTitle) formTitle.textContent = 'إصدار بطاقة جديدة';
        document.getElementById('saveCardBtn').innerHTML = '<i class="fas fa-plus"></i> إصدار البطاقة';
        document.getElementById('cancelCardEditBtn').style.display = 'none';
        if (typeof CardPage !== 'undefined') { CardPage.refreshAll(); }
        else if (typeof loadCardsTable === 'function') loadCardsTable();
    },

    deleteCard: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return;
        let cards = Storage.get('cards') || [];
        cards = cards.filter(c => c.id != id);
        Storage.set('cards', cards);
        showToast('تم حذف البطاقة', 'success');
        if (typeof CardPage !== 'undefined') { CardPage.refreshAll(); } else { location.reload(); }
    },

    addWallet: () => {
        const editId = document.getElementById('editingWalletId')?.value;
        const name = document.getElementById('walletNameInput').value.trim();
        const funds = parseFloat(document.getElementById('walletFundsInput').value);
        const category = document.getElementById('walletCategoryInput')?.value || 'عام';
        const target = parseFloat(document.getElementById('walletTargetInput')?.value) || 50000;
        const color = document.getElementById('walletColorInput')?.value || '#00A59B';
        const icon = document.getElementById('walletIconInput')?.value || 'fas fa-wallet';

        // Validation with visual feedback
        let hasError = false;
        if (!name) { markFieldError('walletNameInput'); hasError = true; }
        if (isNaN(funds) || funds < 0) { markFieldError('walletFundsInput'); hasError = true; }
        if (hasError) return showToast('يرجى ملء جميع الحقول المطلوبة', 'error');

        let wallets = Storage.get('wallets') || [];

        if (editId) {
            // Edit Mode
            const index = wallets.findIndex(w => w.id == editId);
            if (index !== -1) {
                wallets[index] = { ...wallets[index], name, funds, category, target, color, icon };
                Storage.set('wallets', wallets);
                showToast('تم تحديث المحفظة بنجاح', 'success');
            }
        } else {
            // Create Mode
            Storage.add('wallets', {
                id: Date.now(), name, funds, collected: 0, target, category, color, icon, merchants: 'غير محدد', status: 'نشط'
            });
            showToast('تم إنشاء المحفظة بنجاح!', 'success');
        }

        Actions.cancelWalletEdit();
        location.reload();
    },

    addMerchant: () => {
        const idInput = document.getElementById('editingMerchantId');
        const name = document.getElementById('merchantNameInput').value;
        const cat = document.getElementById('merchantCatInput').value;
        const contact = document.getElementById('merchantContactInput').value;
        const phone = document.getElementById('merchantPhoneInput').value;
        const email = document.getElementById('merchantEmailInput').value;
        const loc = document.getElementById('merchantLocationInput').value;

        // New Fields
        const cr = document.getElementById('merchantCRInput').value;
        const vat = document.getElementById('merchantVATInput').value;
        const bank = document.getElementById('merchantBankInput').value;
        const iban = document.getElementById('merchantIBANInput').value;

        // Map Coordinates (from location picker)
        const latInput = document.getElementById('merchantLatInput');
        const lngInput = document.getElementById('merchantLngInput');
        const coords = (latInput && latInput.value && lngInput && lngInput.value)
            ? { lat: parseFloat(latInput.value), lng: parseFloat(lngInput.value) }
            : null;

        if (!name) { markFieldError('merchantNameInput'); return showToast('يرجى إدخال اسم المتجر', 'error'); }

        let merchants = Storage.get('merchants') || [];

        // Get temp files
        const currentFiles = window.tempMerchantFiles || [];

        if (idInput && idInput.value) {
            // Edit
            const id = parseInt(idInput.value);
            const idx = merchants.findIndex(m => m.id === id);
            if (idx !== -1) {
                merchants[idx].name = name;
                if (cat) merchants[idx].category = cat;
                if (contact) merchants[idx].contactPerson = contact;
                if (phone) merchants[idx].phone = phone;
                if (email) merchants[idx].email = email;
                if (loc) merchants[idx].location = loc;

                merchants[idx].crNumber = cr;
                merchants[idx].vatNumber = vat;
                merchants[idx].bankName = bank;
                merchants[idx].iban = iban;
                if (coords) merchants[idx].coords = coords;

                // Append new files to existing
                if (currentFiles.length > 0) {
                    merchants[idx].attachments = (merchants[idx].attachments || []).concat(currentFiles);
                }

                Storage.set('merchants', merchants);
                showToast('تم تعديل بيانات المتجر', 'success');
                Actions.cancelMerchantEdit();
            }
        } else {
            // Add
            merchants.push({
                id: Date.now(),
                name,
                category: cat || 'عام',
                contactPerson: contact,
                phone,
                email,
                location: loc,
                crNumber: cr,
                vatNumber: vat,
                bankName: bank,
                iban: iban,
                coords: coords,
                attachments: currentFiles,
                transactions: 0,
                status: 'نشط'
            });
            Storage.set('merchants', merchants);
            showToast('تم إضافة المتجر بنجاح', 'success');
            Actions.cancelMerchantEdit();
        }
        loadMerchantsTable();
    },

    saveUser: () => {
        const id = document.getElementById('editingUserId').value;
        const username = document.getElementById('newUsername').value.trim();
        const name = document.getElementById('newName').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const role = document.getElementById('newUserRole').value;
        const linkedEntity = document.getElementById('linkedEntitySelect').value;

        let hasError = false;
        if (!username) { markFieldError('newUsername'); hasError = true; }
        if (!name) { markFieldError('newName'); hasError = true; }
        if (!password) { markFieldError('newPassword'); hasError = true; }
        if (hasError) return showToast('يرجى تعبئة الحقول الأساسية', 'error');
        if ((role === 'merchant' || role === 'beneficiary') && !linkedEntity) return showToast('يرجى اختيار الجهة المرتبطة بهذا الحساب', 'error');

        let users = Storage.get('users') || [];

        if (id) {
            // Edit Mode
            const index = users.findIndex(u => u.id == id);
            if (index !== -1) {
                users[index] = { ...users[index], name, username, password, role, linkedEntity };
                Storage.set('users', users);
                showToast('تم تحديث بيانات المستخدم بنجاح', 'success');
            }
        } else {
            // Create Mode
            if (users.some(u => u.username === username)) return showToast('اسم المستخدم مسجل مسبقاً', 'error');
            const newUser = { id: Date.now(), name, username, password, role, linkedEntity: linkedEntity || null };
            Storage.add('users', newUser);
            showToast('تم إنشاء المستخدم بنجاح', 'success');
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

    exportReport: () => showToast('جارِ تحميل التقرير بصيغة PDF...', 'info'),

    // ===== WALLET MANAGEMENT =====
    editWallet: (id) => {
        const wallets = Storage.get('wallets') || [];
        const w = wallets.find(x => x.id === id);
        if (!w) return;

        document.getElementById('editingWalletId').value = w.id;
        document.getElementById('walletNameInput').value = w.name || '';
        document.getElementById('walletFundsInput').value = w.funds || 0;
        if (document.getElementById('walletCategoryInput')) document.getElementById('walletCategoryInput').value = w.category || 'عام';
        if (document.getElementById('walletTargetInput')) document.getElementById('walletTargetInput').value = w.target || 50000;
        if (document.getElementById('walletColorInput')) document.getElementById('walletColorInput').value = w.color || '#00A59B';
        if (document.getElementById('walletIconInput')) document.getElementById('walletIconInput').value = w.icon || 'fas fa-wallet';

        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'تعديل المحفظة';
        const saveBtn = document.getElementById('saveWalletBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        const cancelBtn = document.getElementById('cancelWalletEditBtn');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        window.scrollTo(0, 0);
    },

    deleteWallet: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه المحفظة؟')) return;
        let wallets = Storage.get('wallets') || [];
        wallets = wallets.filter(w => w.id !== id);
        Storage.set('wallets', wallets);
        showToast('تم حذف المحفظة', 'success');
        location.reload();
    },

    cancelWalletEdit: () => {
        const editId = document.getElementById('editingWalletId');
        if (editId) editId.value = '';
        ['walletNameInput', 'walletFundsInput', 'walletTargetInput'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const colorInput = document.getElementById('walletColorInput');
        if (colorInput) colorInput.value = '#00A59B';
        const iconInput = document.getElementById('walletIconInput');
        if (iconInput) iconInput.value = 'fas fa-wallet';
        const catInput = document.getElementById('walletCategoryInput');
        if (catInput) catInput.value = 'عام';

        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'إنشاء محفظة جديدة';
        const saveBtn = document.getElementById('saveWalletBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-plus"></i> إنشاء المحفظة';
        const cancelBtn = document.getElementById('cancelWalletEditBtn');
        if (cancelBtn) cancelBtn.style.display = 'none';
    },

    // ===== MERCHANT MANAGEMENT =====
    editMerchant: (id) => {
        const merchants = Storage.get('merchants') || [];
        const m = merchants.find(x => x.id === id);
        if (!m) return;

        document.getElementById('editingMerchantId').value = m.id;
        document.getElementById('merchantNameInput').value = m.name || '';
        if (document.getElementById('merchantCatInput')) document.getElementById('merchantCatInput').value = m.category || '';
        if (document.getElementById('merchantContactInput')) document.getElementById('merchantContactInput').value = m.contactPerson || '';
        if (document.getElementById('merchantPhoneInput')) document.getElementById('merchantPhoneInput').value = m.phone || '';
        if (document.getElementById('merchantEmailInput')) document.getElementById('merchantEmailInput').value = m.email || '';
        if (document.getElementById('merchantLocationInput')) document.getElementById('merchantLocationInput').value = m.location || '';
        if (document.getElementById('merchantCRInput')) document.getElementById('merchantCRInput').value = m.crNumber || '';
        if (document.getElementById('merchantVATInput')) document.getElementById('merchantVATInput').value = m.vatNumber || '';
        if (document.getElementById('merchantBankInput')) document.getElementById('merchantBankInput').value = m.bankName || '';
        if (document.getElementById('merchantIBANInput')) document.getElementById('merchantIBANInput').value = m.iban || '';

        const formTitle = document.getElementById('merchantFormTitle');
        if (formTitle) formTitle.textContent = 'تعديل بيانات المتجر';
        const saveBtn = document.getElementById('saveMerchantBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        const cancelBtn = document.getElementById('cancelMerchantEditBtn');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        window.scrollTo(0, 0);
    },

    deleteMerchant: (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المتجر؟')) return;
        let merchants = Storage.get('merchants') || [];
        merchants = merchants.filter(m => m.id !== id);
        Storage.set('merchants', merchants);
        showToast('تم حذف المتجر', 'success');
        location.reload();
    },

    cancelMerchantEdit: () => {
        const editId = document.getElementById('editingMerchantId');
        if (editId) editId.value = '';
        ['merchantNameInput', 'merchantCatInput', 'merchantContactInput', 'merchantPhoneInput',
            'merchantEmailInput', 'merchantLocationInput', 'merchantCRInput', 'merchantVATInput',
            'merchantBankInput', 'merchantIBANInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        const fileList = document.getElementById('fileList');
        if (fileList) fileList.innerHTML = '';
        window.tempMerchantFiles = [];

        const formTitle = document.getElementById('merchantFormTitle');
        if (formTitle) formTitle.textContent = 'إضافة متجر جديد';
        const saveBtn = document.getElementById('saveMerchantBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-plus"></i> حفظ المتجر';
        const cancelBtn = document.getElementById('cancelMerchantEditBtn');
        if (cancelBtn) cancelBtn.style.display = 'none';
    },

    // ===== FILE UPLOAD HANDLER =====
    handleFileUpload: (input) => {
        if (!input.files || input.files.length === 0) return;
        window.tempMerchantFiles = window.tempMerchantFiles || [];
        const fileListDiv = document.getElementById('fileList');

        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                window.tempMerchantFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: e.target.result
                });
                if (fileListDiv) {
                    fileListDiv.innerHTML += `<div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:#f0fdf4; border-radius:6px;">
                        <i class="fas fa-file" style="color:#8cc240"></i>
                        <span style="flex:1; font-size:0.85rem;">${file.name}</span>
                        <small style="color:#888">${(file.size / 1024).toFixed(1)} KB</small>
                    </div>`;
                }
            };
            reader.readAsDataURL(file);
        });
        showToast(`تم إرفاق ${input.files.length} ملف`, 'success');
    }
};

/* ===========================
   UTILITY FUNCTIONS
=========================== */
function toggleCardMenu(el) {
    const dropdown = el.querySelector('.card-menu-dropdown');
    if (!dropdown) return;
    // Close all other open menus
    document.querySelectorAll('.card-menu-dropdown').forEach(d => {
        if (d !== dropdown) d.style.display = 'none';
    });
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-menu-btn')) {
        document.querySelectorAll('.card-menu-dropdown').forEach(d => d.style.display = 'none');
    }
});

function markFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.add('input-error');
    el.addEventListener('focus', () => el.classList.remove('input-error'), { once: true });
    el.addEventListener('input', () => el.classList.remove('input-error'), { once: true });
}

function hideFormsByRole() {
    if (!Auth.user) return;
    const role = Auth.user.role;
    if (role === 'admin') return; // Admin sees everything

    // Hide all form containers for non-admin users on admin-only pages
    document.querySelectorAll('.form-container').forEach(form => {
        form.style.display = 'none';
    });

    // Hide action buttons (edit/delete) for non-admin on admin-only content
    if (role === 'beneficiary') {
        document.querySelectorAll('.delete-btn, button.secondary').forEach(btn => {
            if (btn.closest('.form-container')) return;
            btn.style.display = 'none';
        });
    }
}
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
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--muted)"><i class="fas fa-users-cog" style="font-size:2rem; opacity:0.3; margin-bottom:10px; display:block;"></i>لا يوجد مستخدمون. قائمة المستخدمين فارغة.</td></tr>';
        return;
    }
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
    // New visual grid mode
    if (typeof CardPage !== 'undefined' && document.getElementById('cardsVisualGrid')) {
        CardPage.init();
        return;
    }
    // Legacy table fallback
    const cards = Storage.get('cards') || [];
    const tbody = document.getElementById('cardsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (cards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--muted)"><i class="fas fa-credit-card" style="font-size:2rem; opacity:0.3; margin-bottom:10px; display:block;"></i>لا توجد بطاقات مصدرة حتى الآن</td></tr>';
        return;
    }
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
    if (wallets.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:50px; color:var(--muted);"><i class="fas fa-wallet" style="font-size:3rem; opacity:0.3; margin-bottom:15px; display:block;"></i>لا توجد محافظ حالياً. انقر على "إنشاء محفظة" للبدء.</div>';
        return;
    }

    wallets.forEach(w => {
        const collected = (w.collected !== undefined) ? Number(w.collected) : 0;
        const target = (w.target !== undefined && w.target > 0) ? Number(w.target) : 50000;
        const funds = (w.funds !== undefined) ? Number(w.funds) : 0;
        const percent = Math.min(100, Math.round((collected / target) * 100));

        const card = document.createElement('div');
        card.className = 'wallet-vault-card'; // replace 'wallet-card'
        card.innerHTML = `
            <div class="vault-menu-btn" onclick="toggleCardMenu(this)">
                <i class="fas fa-ellipsis-v"></i>
                <div class="card-menu-dropdown vault-menu-dropdown" style="display:none; text-align:right;">
                    <button onclick="Actions.editWallet(${w.id})"><i class="fas fa-edit"></i> تعديل</button>
                    <button onclick="Actions.deleteWallet(${w.id})" style="color:#fc8181"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
            
            <div class="vault-header">
                <div class="vault-icon-box" style="background: linear-gradient(135deg, ${w.color || '#00A59B'}, rgba(0,0,0,0.3))">
                    <i class="${w.icon || 'fas fa-wallet'}"></i>
                </div>
                <div class="vault-category">${w.category || 'عام'}</div>
            </div>
            
            <h3 class="vault-title">${w.name}</h3>
            <div class="vault-balance">
                ${funds.toLocaleString('ar-SA')} <small>ريال</small>
            </div>
            
            <div class="vault-progress-bg">
                <div class="vault-progress-fill" style="width:${percent}%; background:${w.color || '#00A59B'}; color:${w.color || '#00A59B'}"></div>
            </div>
            <div class="vault-progress-stats">
                <span>المحقق: ${collected.toLocaleString('ar-SA')}</span>
                <span>الهدف: ${target.toLocaleString('ar-SA')}</span>
            </div>
            
            <div class="vault-actions">
                 <button class="vault-btn vault-btn-secondary" onclick="alert('تفاصيل المحفظة قريباً')"><i class="fas fa-chart-line"></i> التفاصيل</button>
                 <button class="vault-btn vault-btn-primary" style="background: ${w.color || '#00A59B'}" onclick="Actions.addWalletFunds(${w.id})"><i class="fas fa-plus"></i> إيداع</button>
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
    if (merchants.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:50px; color:var(--muted);"><i class="fas fa-store" style="font-size:3rem; opacity:0.3; margin-bottom:15px; display:block;"></i>لا توجد متاجر حالياً. انقر على "إضافة متجر" للبدء.</div>';
        return;
    }

    merchants.forEach(m => {
        const isActive = (m.status === 'نشط' || m.status === 'Active');
        const isVerified = (m.crNumber && m.vatNumber);

        const badge = isActive ?
            '<span class="badge-gold" style="background:#e6fffa; color:#00A59B; border-color:#b2f5ea">نشط</span>' :
            '<span class="badge-gold" style="background:#fff5f5; color:#c53030; border-color:#feb2b2">غير نشط</span>';

        const verifiedBadge = isVerified ?
            '<span title="موثق (سجل + ضريبة)" style="color:#28a745; margin-right:5px;"><i class="fas fa-check-circle"></i></span>' : '';

        const attachCount = (m.attachments && m.attachments.length) || 0;

        const card = document.createElement('div');
        card.className = 'merchant-card';
        card.innerHTML = `
            <div class="card-menu-btn" onclick="toggleCardMenu(this)">
                <i class="fas fa-ellipsis-v"></i>
                <div class="card-menu-dropdown" style="display:none;">
                    <button onclick="location.href='merchant_view.html?id=${m.id}'"><i class="fas fa-eye"></i> عرض التفاصيل</button>
                    <button onclick="Actions.editMerchant(${m.id})"><i class="fas fa-edit"></i> تعديل</button>
                    <button onclick="Actions.deleteMerchant(${m.id})" style="color:red"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px;">
                <img src="${m.logo || 'assets/logo.png'}" style="width:50px; height:50px; border-radius:8px; object-fit:contain; border:1px solid #eee;">
                <div>${badge}</div>
            </div>
            
            <h3 style="cursor:pointer" onclick="location.href='merchant_view.html?id=${m.id}'">${m.name} ${verifiedBadge}</h3>
            <p style="color:#777; font-size:0.9rem; margin-bottom:16px;">${m.category || 'عام'}</p>
            
            <div class="merchant-contact">
                <div class="contact-row"><i class="fas fa-map-marker-alt"></i> <span>${m.location || 'الرياض'}</span></div>
                <div class="contact-row"><i class="fas fa-id-card"></i> <span>${m.crNumber || 'لا يوجد سجل'}</span></div>
                <div class="contact-row"><i class="fas fa-paperclip"></i> <span>${attachCount} مرفقات</span></div>
            </div>
            
            <div style="margin-top:20px; text-align:center;">
                <button class="secondary" style="width:100%" onclick="location.href='merchant_view.html?id=${m.id}'">
                    عرض الملف الكامل
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
    products: [],
    cart: [],
    currentCard: null,
    total: 0,

    init: () => {
        console.log('POS.init()');
        POS.products = Storage.get('products') || [];
        POS.renderCategories();
        POS.filterProducts();
        POS.renderCart();
    },

    renderCategories: () => {
        const categories = ['الكل', ...new Set(POS.products.map(p => p.category))];
        const container = document.getElementById('posCategories');
        if (!container) return;
        container.innerHTML = categories.map(cat => `
            <div class="category-tab ${cat === 'الكل' ? 'active' : ''}" onclick="POS.selectCategory(this, '${cat}')">${cat}</div>
        `).join('');
    },

    selectCategory: (el, category) => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        POS.filterProducts(category);
    },

    filterProducts: (category = 'الكل') => {
        const query = document.getElementById('posSearch')?.value.toLowerCase() || '';
        const grid = document.getElementById('posProductGrid');
        if (!grid) return;

        const filtered = POS.products.filter(p => {
            const matchesCategory = category === 'الكل' || p.category === category;
            const matchesQuery = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
            return matchesCategory && matchesQuery;
        });

        grid.innerHTML = filtered.map(p => `
            <div class="pos-item-card" onclick="POS.addToCart(${p.id})">
                <div class="pos-item-icon">${p.image || '📦'}</div>
                <div class="pos-item-name">${p.name}</div>
                <div class="pos-item-price">${p.price.toFixed(2)} ر.س</div>
            </div>
        `).join('');
    },

    addToCart: (productId) => {
        const product = POS.products.find(p => p.id === productId);
        if (!product) return;

        const existing = POS.cart.find(item => item.id === productId);
        if (existing) {
            existing.qty++;
        } else {
            POS.cart.push({ ...product, qty: 1 });
        }
        POS.renderCart();
        if (typeof showToast === 'function') showToast(`تم إضافة ${product.name}`, 'success');
    },

    updateQuantity: (productId, delta) => {
        const item = POS.cart.find(p => p.id === productId);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            POS.cart = POS.cart.filter(p => p.id !== productId);
        }
        POS.renderCart();
    },

    clearCart: () => {
        if (POS.cart.length === 0) return;
        if (confirm('هل أنت متأكد من مسح السلة؟')) {
            POS.cart = [];
            POS.renderCart();
        }
    },

    renderCart: () => {
        const container = document.getElementById('cartItems');
        if (!container) return;

        if (POS.cart.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; margin-top:50px; color:var(--muted)">
                    <i class="fas fa-shopping-bag" style="font-size:3rem; opacity:0.2; margin-bottom:10px; display:block;"></i>
                    السلة فارغة حالياً
                </div>`;
            POS.updateTotals(0);
            return;
        }

        container.innerHTML = POS.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price.toFixed(2)} × ${item.qty}</div>
                </div>
                <div class="cart-qty-controls">
                    <button class="cart-qty-btn" onclick="POS.updateQuantity(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                    <span>${item.qty}</span>
                    <button class="cart-qty-btn" onclick="POS.updateQuantity(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                </div>
                <div style="font-weight:700;">${(item.price * item.qty).toFixed(2)}</div>
            </div>
        `).join('');

        const subtotal = POS.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        POS.updateTotals(subtotal);
    },

    updateTotals: (subtotal) => {
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        POS.total = total;

        const subEl = document.getElementById('cartSubtotal');
        const taxEl = document.getElementById('cartTax');
        const totalEl = document.getElementById('cartTotal');

        if (subEl) subEl.innerText = subtotal.toFixed(2) + ' ر.س';
        if (taxEl) taxEl.innerText = tax.toFixed(2) + ' ر.س';
        if (totalEl) totalEl.innerText = total.toFixed(2) + ' ر.س';
    },

    openCheckout: () => {
        if (POS.cart.length === 0) return alert('السلة فارغة!');
        document.getElementById('checkoutTotalVal').innerText = POS.total.toFixed(2) + ' ر.س';
        document.getElementById('checkoutModal').classList.add('active');

        // Auto-fill from merchants if possible
        const savedCard = sessionStorage.getItem('posCardNumber');
        if (savedCard) {
            document.getElementById('posCardNumber').value = savedCard;
            POS.verifyCardAction();
            sessionStorage.removeItem('posCardNumber');
        }
    },

    closeCheckout: () => {
        document.getElementById('checkoutModal').classList.remove('active');
        document.getElementById('posCardStatus').innerHTML = '';
        document.getElementById('posConfirmCode').value = '';

        // Reset Request Area
        const reqArea = document.getElementById('posRequestArea');
        const reqBtn = document.getElementById('sendRequestBtn');
        const reqStatus = document.getElementById('posRequestStatus');
        if (reqArea) reqArea.style.display = 'none';
        if (reqBtn) reqBtn.disabled = false;
        if (reqStatus) reqStatus.innerHTML = '';
    },

    verifyCardAction: () => {
        const cardNumber = document.getElementById('posCardNumber')?.value.trim();
        if (!cardNumber) return;

        const cards = Storage.get('cards') || [];
        const card = cards.find(c => c.number === cardNumber || c.identity === cardNumber);
        const display = document.getElementById('posCardStatus');

        if (!card) {
            POS.currentCard = null;
            display.innerHTML = '<div style="color:red; background:#fff5f5; padding:10px; border-radius:8px;">البطاقة غير موجودة</div>';
            return;
        }

        if (card.status !== 'نشط' && card.status !== 'Active') {
            POS.currentCard = null;
            display.innerHTML = '<div style="color:red; background:#fff5f5; padding:10px; border-radius:8px;">البطاقة موقوفة</div>';
            return;
        }

        POS.currentCard = card;
        display.innerHTML = `
            <div style="background:#f0fafe; padding:12px; border-radius:8px; border:1px solid #d0eaf5;">
                <div style="font-weight:700;">${card.beneficiary}</div>
                <div style="font-size:0.9rem; color:#005a8d;">الرصيد: ${Number(card.balance).toFixed(2)} ر.س</div>
            </div>`;

        // Show request area
        const reqArea = document.getElementById('posRequestArea');
        if (reqArea) reqArea.style.display = 'block';
    },

    sendPurchaseRequest: () => {
        if (!POS.currentCard) return alert('يرجى التحقق من البطاقة أولاً');

        const btn = document.getElementById('sendRequestBtn');
        const status = document.getElementById('posRequestStatus');

        // Generate Code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const request = {
            id: Date.now(),
            cardNumber: POS.currentCard.number,
            beneficiary: POS.currentCard.beneficiary,
            amount: POS.total,
            merchant: 'نقطة بيع احترافية',
            code: code,
            status: 'pending',
            expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
            timestamp: new Date().toISOString()
        };

        Storage.add('pendingPurchases', request);

        if (btn) btn.disabled = true;
        if (status) {
            status.innerHTML = `
                <div style="background:#e7f7f6; color:var(--brand-teal); padding:10px; border-radius:8px; border:1px solid #c9e8e5;">
                    <i class="fas fa-check-circle"></i> تم إرسال الطلب!<br>
                    <strong>كود التأكيد للمستفيد: ${code}</strong>
                </div>
            `;
        }

        if (typeof showToast === 'function') showToast('تم إرسال طلب الشراء بنجاح', 'success');
    },

    processCartPayment: () => {
        if (!POS.currentCard) return alert('يرجى التحقق من البطاقة');
        const code = document.getElementById('posConfirmCode').value.trim();
        if (!code) return alert('يرجى إدخال كود التأكيد');

        // Verify with Pending Purchases
        const pending = Storage.get('pendingPurchases') || [];
        const req = pending.find(p =>
            p.cardNumber === POS.currentCard.number &&
            p.status === 'confirmed' &&
            p.code === code
        );

        if (!req) {
            return alert('كود التأكيد غير صحيح أو الطلب غير موجود.');
        }

        // Check balance (against requirement or cart total?)
        // In the professional POS, we use the cart total
        if (POS.currentCard.balance < POS.total) {
            return alert('الرصيد في البطاقة لا يكفي لإتمام عملية الشراء.');
        }

        // Execute payment
        const cards = Storage.get('cards') || [];
        const cardIdx = cards.findIndex(c => c.number === POS.currentCard.number);
        cards[cardIdx].balance -= POS.total;
        Storage.set('cards', cards);

        // Transaction record
        const transaction = {
            id: Date.now(),
            card: POS.currentCard.number,
            amount: POS.total,
            items: POS.cart.map(i => `${i.name} (${i.qty})`),
            date: new Date().toLocaleDateString('ar-SA'),
            merchant: req.merchant || 'نقطة بيع'
        };
        Storage.add('transactions', transaction);

        // Mark req as completed
        req.status = 'completed';
        Storage.set('pendingPurchases', pending);

        // Show receipt
        POS.showReceipt(transaction, cards[cardIdx]);
        POS.cart = [];
        POS.renderCart();
        POS.closeCheckout();
    },

    showReceipt: (tx, card) => {
        const backdrop = document.getElementById('posReceiptBackdrop');
        const holder = document.getElementById('receiptContent');
        if (!holder) return;

        holder.innerHTML = `
            <div class="thermal-receipt">
                <div class="thermal-logo">Trao-f POS</div>
                <div style="font-size:0.8rem; margin-bottom:15px; color:#555;">إيصال ضريبي مبسط</div>
                
                <div class="thermal-row">
                    <span>التاريخ والوقت:</span>
                    <span>${tx.date}</span>
                </div>
                <div class="thermal-row">
                    <span>رقم العملية:</span>
                    <span>#${tx.id}</span>
                </div>
                <div class="thermal-row">
                    <span>البائع:</span>
                    <span>${tx.merchant}</span>
                </div>
                <div class="thermal-row">
                    <span>البطاقة:</span>
                    <span dir="ltr">${tx.card.replace(/(\d{4})(?=\d)/g, '$1 ')}</span>
                </div>
                <div class="thermal-row" style="margin-bottom:15px;">
                    <span>المستفيد:</span>
                    <span>${card.beneficiary || 'غير محدد'}</span>
                </div>

                <div class="thermal-divider"></div>

                <div class="thermal-title">المشتريات</div>
                ${POS.cart.length > 0 ? POS.cart.map(i => `
                    <div class="thermal-row">
                        <span>${i.name} (x${i.qty})</span>
                        <span>${(i.price * i.qty).toFixed(2)}</span>
                    </div>
                `).join('') : `
                    <div class="thermal-row">
                        <span>مشتريات عامة</span>
                        <span>${tx.amount.toFixed(2)}</span>
                    </div>
                `}

                <div class="thermal-total">
                    <div class="thermal-row" style="margin-bottom:0; font-size:1.3rem;">
                        <span>الإجمالي (شامل الضريبة):</span>
                        <span>${tx.amount.toFixed(2)} ر.س</span>
                    </div>
                </div>

                <div class="thermal-footer">
                    <div>الرصيد المتبقي: ${Number(card.balance).toFixed(2)} ر.س</div>
                    <div style="margin-top:10px;">شكراً لتسوقكم معنا!</div>
                    <div style="font-family:monospace; margin-top:5px;">*** نسخة التاجر ***</div>
                </div>
            </div>
        `;
        backdrop.classList.add('active');
    },

    closeModal: () => {
        document.getElementById('posReceiptBackdrop').classList.remove('active');
    }
};

/* ===========================
   SUPPLY ORDERS
=========================== */
const Orders = {
    populateMerchants: () => {
        const partnerSelect = document.getElementById('orderPartner');
        const walletSelect = document.getElementById('orderWallet');

        if (partnerSelect) {
            const merchants = Storage.get('merchants') || [];
            partnerSelect.innerHTML = '<option value="">اختر الشريك...</option>' +
                merchants.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        }

        if (walletSelect) {
            const wallets = Storage.get('wallets') || [];
            walletSelect.innerHTML = '<option value="">أمر توريد عام بميزانية مستقلة...</option>' +
                wallets.map(w => `<option value="${w.name}">${w.name} (المتاح: ${Number(w.funds).toLocaleString()} ر.س)</option>`).join('');
        }
    },

    create: () => {
        try {
            const item = document.getElementById('orderItem').value;
            const partner = document.getElementById('orderPartner').value;
            const walletName = document.getElementById('orderWallet') ? document.getElementById('orderWallet').value : '';
            const cost = Number(document.getElementById('orderCost').value);
            const notes = document.getElementById('orderNotes').value;

            if (!item || !partner || !cost) return alert('يرجى تعبئة جميع الحقول المطلوبة (الصنف، الشريك، القيمة)');

            let wallets = Storage.get('wallets') || [];
            if (walletName) {
                const wIdx = wallets.findIndex(w => w.name === walletName);
                if (wIdx === -1) return alert('المحفظة المحددة غير موجودة!');
                if (wallets[wIdx].funds < cost) return alert(`رصيد المحفظة (${wallets[wIdx].funds}) لا يكفي لقيمة التوريد (${cost})`);

                // Deduct from wallet
                wallets[wIdx].funds -= cost;
                if (!wallets[wIdx].history) wallets[wIdx].history = [];
                wallets[wIdx].history.push({
                    date: new Date().toLocaleString('ar-SA'),
                    op: 'فاتورة/أمر توريد: ' + item,
                    amount: cost,
                    type: 'out'
                });
                Storage.set('wallets', wallets);
            }

            const order = {
                id: Date.now().toString().slice(-6),
                item,
                partner,
                wallet: walletName,
                cost: cost,
                notes,
                date: new Date().toLocaleDateString('ar-SA'),
                status: 'Pending',
                rejectionReason: ''
            };

            Storage.add('supply_orders', order);
            alert('تم إنشاء أمر التوريد بنجاح' + (walletName ? ' (تم خصم القيم من الرصيد)' : ''));

            // Reload to show changes
            location.reload();
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء إنشاء الطلب: ' + e.message);
        }
    },
    load: () => {
        console.log('Orders.load() (Kanban) called');
        try {
            const isKanban = !!document.getElementById('kanbanBoard');
            const grid = document.getElementById('ordersGrid');

            const targetContainer = isKanban ? document.getElementById('kanbanBoard') : grid;
            if (!targetContainer) return;

            let orders = Storage.get('supply_orders') || [];
            if (Orders.populateMerchants) Orders.populateMerchants();

            if (!isKanban && grid) {
                // Fallback for pages still using ordersGrid
                grid.innerHTML = orders.length ? '' : '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#777; background:#fff; border-radius:16px; border:1px dashed #ccc;">لا توجد أوامر توريد.</div>';
            }

            // Reset Kanban columns if present
            const cols = {
                Pending: document.getElementById('cards-Pending'),
                Accepted: document.getElementById('cards-Accepted'),
                Completed: document.getElementById('cards-Completed'),
                Other: document.getElementById('cards-Other')
            };
            const counts = { Pending: 0, Accepted: 0, Completed: 0, Other: 0 };

            if (isKanban) {
                Object.values(cols).forEach(col => { if (col) col.innerHTML = ''; });
            }

            orders.slice().reverse().forEach(o => {
                if (!o) return;

                let statusRole = 'status-badge';
                let statusText = o.status;
                let statusColorStyle = '';
                let colKey = 'Other'; // Default for Rejected, Cancelled, Withdrawn

                if (o.status === 'Completed') { statusText = 'منفذ'; statusRole += ' status-active'; colKey = 'Completed'; }
                else if (o.status === 'Pending') { statusText = 'قيد الانتظار'; statusColorStyle = 'background:#fff8e1; color:#f57f17; border-color:#ffecb3;'; colKey = 'Pending'; }
                else if (o.status === 'Accepted') { statusText = 'مقبول'; statusColorStyle = 'background:#e3f2fd; color:#0d47a1; border-color:#bbdefb;'; colKey = 'Accepted'; }
                else if (o.status === 'Withdrawn') { statusText = 'مسحوب'; statusColorStyle = 'background:#f1f2f6; color:#6c757d; border-color:#dbe2e8;'; }
                else if (o.status === 'Rejected') { statusText = 'مرفوض'; statusRole += ' status-inactive'; }
                else if (o.status === 'Cancelled') { statusText = 'ملغي'; statusColorStyle = 'background:#000; color:#fff;'; }

                counts[colKey]++;

                const cardHTML = `
                    <div class="card-menu-btn" onclick="toggleCardMenu(this)">
                        <i class="fas fa-ellipsis-v"></i>
                        <div class="card-menu-dropdown" style="display:none;">
                            ${Orders.getActionsHTML(o)}
                        </div>
                    </div>
                    <div class="k-card-header">
                        <span class="k-card-id">#${o.id}</span>
                        ${!isKanban ? `<span class="${statusRole}" style="${statusColorStyle}">${statusText}</span>` : ''}
                    </div>
                    <div class="k-card-title">${o.item}</div>
                    <div class="k-card-partner"><i class="fas fa-store"></i> ${o.partner}</div>
                    <div class="k-card-footer">
                        <span class="k-card-cost">${Number(o.cost).toLocaleString('ar-SA')} <small>ريال</small></span>
                        <span class="k-card-date">${o.date}</span>
                    </div>
                    ${o.status === 'Rejected' ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border); color:red; font-size:0.8rem;">سبب الرفض: ${o.rejectionReason}</div>` : ''}
                `;

                if (isKanban && cols[colKey]) {
                    const card = document.createElement('div');
                    card.className = 'k-card';
                    card.draggable = true;
                    card.id = 'order-card-' + o.id;
                    card.ondragstart = (e) => Orders.dragStart(e, o.id);
                    card.ondragend = Orders.dragEnd;
                    card.innerHTML = cardHTML;
                    cols[colKey].appendChild(card);
                } else if (grid) {
                    const card = document.createElement('div');
                    card.className = 'merchant-card';
                    card.innerHTML = cardHTML;
                    grid.appendChild(card);
                }
            });

            if (isKanban) {
                document.getElementById('count-Pending').innerText = counts.Pending;
                document.getElementById('count-Accepted').innerText = counts.Accepted;
                document.getElementById('count-Completed').innerText = counts.Completed;
                document.getElementById('count-Other').innerText = counts.Other;
            }

        } catch (e) {
            console.error('Orders.load error:', e);
        }
    },

    // Kanban Drag & Drop
    dragStart: (e, id) => {
        e.dataTransfer.setData('text/plain', id);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    },
    dragEnd: (e) => {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    },
    allowDrop: (e) => {
        e.preventDefault();
        const col = e.target.closest('.kanban-column');
        if (col) col.classList.add('drag-over');
    },
    drop: (e) => {
        e.preventDefault();
        document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));

        const col = e.target.closest('.kanban-column');
        if (!col) return;

        const orderIdStr = e.dataTransfer.getData('text/plain');
        if (!orderIdStr) return;
        const newStatusGroup = col.getAttribute('data-status');

        // Find order
        let orders = Storage.get('supply_orders') || [];
        const idx = orders.findIndex(o => o.id == orderIdStr);
        if (idx === -1) return;

        const currentStatus = orders[idx].status;
        let finalStatus = newStatusGroup;

        // Map grouped column back to actual data status if needed
        if (newStatusGroup === 'Other') {
            if (currentStatus !== 'Rejected' && currentStatus !== 'Withdrawn' && currentStatus !== 'Cancelled') {
                finalStatus = 'Cancelled'; // Default if dragged to 'Other' from active
            } else {
                return; // Already in Other
            }
        } else if (newStatusGroup === 'Completed') {
            finalStatus = 'Completed';
        } else if (newStatusGroup === 'Accepted') {
            finalStatus = 'Accepted';
        } else if (newStatusGroup === 'Pending') {
            finalStatus = 'Pending';
        }

        if (finalStatus !== currentStatus) {
            orders[idx].status = finalStatus;
            Storage.set('supply_orders', orders);

            // Log action if changing to executed/withdrawn/accepted manually
            if (finalStatus === 'Completed') System.log(`تم تحويل طلب توريد #${orderIdStr} إلى مكتمل عن طريق السحب والإفلات`);

            Orders.load();
        }
    },


    getActionsHTML: (o) => {
        let html = '';
        if (o.status === 'Pending') {
            html += `<button onclick="Orders.withdraw('${o.id}')"><i class="fas fa-hand-paper" style="color:#ff9800"></i> سحب</button>`;
            html += `<button onclick="Orders.execute('${o.id}')"><i class="fas fa-check" style="color:green"></i> تنفيذ</button>`;
        } else if (o.status === 'Accepted') {
            html += `<button onclick="Orders.execute('${o.id}')"><i class="fas fa-check" style="color:green"></i> تنفيذ</button>`;
            html += `<button onclick="Orders.withdraw('${o.id}')"><i class="fas fa-hand-paper" style="color:#ff9800"></i> سحب</button>`;
        } else if (o.status === 'Rejected') {
            html += `<button onclick="Orders.reopen('${o.id}')"><i class="fas fa-redo"></i> إعادة فتح</button>`;
            html += `<button onclick="Orders.cancelFinal('${o.id}')" style="color:red"><i class="fas fa-ban"></i> إلغاء نهائي</button>`;
        }

        // Common actions
        html += `<button onclick="Orders.printInvoice('${o.id}')"><i class="fas fa-print"></i> طباعة</button>`;
        html += `<button onclick="Orders.delete('${o.id}')" style="color:red"><i class="fas fa-trash"></i> حذف</button>`;

        return html;
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

    cancelFinal: (id) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        let orders = Storage.get('supply_orders') || [];
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].status = 'Cancelled';
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
};
window.Orders = Orders;

/* ===========================
   SYSTEM INITIALIZATION
=========================== */
const System = {
    init: () => {
        try {
            console.log('TRAOF System: Initializing...');
            initData();
            migrateData();

            // Layout & Preferences
            if (typeof Settings !== 'undefined') {
                if (typeof Settings.applyLayout === 'function') Settings.applyLayout();
                if (typeof Settings.load === 'function') Settings.load();
            }

            // Authentication & UI Role Patching
            if (typeof Auth !== 'undefined') Auth.checkSession();
            if (typeof hideFormsByRole === 'function') hideFormsByRole();
            if (typeof Actions !== 'undefined' && typeof Actions.populateDropdowns === 'function') Actions.populateDropdowns();

            // Dynamic Data Loaders (If functions exist on current page)
            if (typeof loadDashboard === 'function') loadDashboard();
            if (typeof loadCardsTable === 'function') loadCardsTable();
            if (typeof loadWalletsTable === 'function') loadWalletsTable();
            if (typeof loadMerchantsTable === 'function') loadMerchantsTable();
            if (typeof Orders !== 'undefined' && typeof Orders.load === 'function') Orders.load();

            // Users Table & Role Listener
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

            // Secondary Loaders
            if (typeof fillTransactionsTableIfAny === 'function') {
                if (fillTransactionsTableIfAny()) {
                    if (typeof buildReportsChart === 'function') buildReportsChart();
                }
            }
            if (typeof buildDashboardChart === 'function') buildDashboardChart();
            if (typeof initBeneficiary === 'function') initBeneficiary();

            // Support System
            if (typeof Support !== 'undefined' && typeof Support.init === 'function') Support.init();

            console.log('TRAOF System: Ready.');
        } catch (e) {
            console.error('TRAOF System: Initialization Failed!', e);
            if (typeof showToast === 'function') showToast('حدث خطأ أثناء تحميل النظام', 'error');
        }
    }
};
window.System = System;

/* ===========================
   ONLOAD CONTROLLER
=========================== */
window.onload = () => {
    System.init();
};

/* ===========================
   SUPPORT SYSTEM
=========================== */
const Support = {
    currentTicketId: null,

    init: () => {
        if (!Auth.user) return;
        const container = document.getElementById('supportChatLayout');
        if (container) {
            container.style.display = 'flex';
            Support.loadTickets();
        }
    },

    showNewTicketForm: () => {
        document.getElementById('chatActiveArea').style.display = 'none';
        document.getElementById('chatEmptyState').style.display = 'none';
        document.getElementById('newTicketArea').style.display = 'block';

        // Clear active state on list
        document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
        Support.currentTicketId = null;
    },

    hideNewTicketForm: () => {
        document.getElementById('newTicketArea').style.display = 'none';
        document.getElementById('chatEmptyState').style.display = 'flex';
        document.getElementById('ticketTitle').value = '';
        document.getElementById('ticketDesc').value = '';
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
        Support.hideNewTicketForm();
        Support.loadTickets();
        Support.openTicket(ticket.id); // Open immediately
    },

    loadTickets: () => {
        const listContainer = document.getElementById('chatListContainer');
        if (!listContainer) return;

        let tickets = Storage.get('tickets') || [];

        // Show tickets based on role
        if (Auth.user.role !== 'admin') {
            const myId = Auth.user.username || Auth.user.identity;
            tickets = tickets.filter(t => t.senderUsername === myId || (!t.senderUsername && t.sender === Auth.user.name));
        }

        if (tickets.length === 0) {
            listContainer.innerHTML = '<div style="padding:40px 20px; text-align:center; color:#a0aec0; font-size:0.9rem;">لا توجد محادثات سابقة</div>';
            return;
        }

        // Sort by id descending (newest first)
        tickets.sort((a, b) => b.id - a.id);

        listContainer.innerHTML = tickets.map(t => {
            const isActive = Support.currentTicketId === t.id ? 'active' : '';
            // Get last message logic
            let lastMessage = t.desc;
            let lastDate = t.date;
            if (t.replies && t.replies.length > 0) {
                const lastRep = t.replies[t.replies.length - 1];
                lastMessage = lastRep.text;
                lastDate = lastRep.date;
            }

            // Format status badge inline
            const statusColors = {
                'جديد': '#00A59B',
                'محدث': '#00A59B',
                'مسترجع': '#f59e0b',
                'مغلق': '#a0aec0',
                'قيد التنفيذ': '#3182ce',
                'تم التنفيذ': '#38a169'
            };
            const sc = statusColors[t.status] || '#888';

            return `
            <div class="chat-list-item ${isActive}" onclick="Support.openTicket(${t.id})">
                <div class="cli-header">
                    <span class="cli-sender">${Auth.user.role === 'admin' ? t.sender : 'الدعم الفني'}</span>
                    <span class="cli-date">${lastDate.split(' ')[0]}</span>
                </div>
                <div class="cli-title">${t.title}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; color:#8c97a8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%;">${lastMessage}</span>
                    <span style="font-size:0.7rem; padding:2px 8px; border-radius:10px; background:${sc}22; color:${sc}; font-weight:700;">${t.status}</span>
                </div>
            </div>
        `}).join('');
    },

    openTicket: (id) => {
        const tickets = Storage.get('tickets') || [];
        const t = tickets.find(x => x.id === id);
        if (!t) return;

        Support.currentTicketId = id;

        // Switch views
        document.getElementById('newTicketArea').style.display = 'none';
        document.getElementById('chatEmptyState').style.display = 'none';
        document.getElementById('chatActiveArea').style.display = 'flex';

        // Title and Status
        document.getElementById('cwTitle').innerHTML = `#${t.id} - ${t.title}`;

        const statusColors = {
            'جديد': '#00A59B',
            'محدث': '#00A59B',
            'مسترجع': '#f59e0b',
            'مغلق': '#a0aec0',
            'قيد التنفيذ': '#3182ce',
            'تم التنفيذ': '#38a169'
        };
        const sc = statusColors[t.status] || '#888';
        document.getElementById('cwStatusContainer').innerHTML = `<span style="font-size:0.85rem; padding:4px 12px; border-radius:20px; background:${sc}22; color:${sc}; font-weight:700;">${t.status}</span>`;

        // Build History HTML (Bubbles)
        const messagesView = document.getElementById('chatMessagesView');

        // Original sender is the user. If we are admin, user is "theirs", admin is "mine".
        // If we are user, user is "mine", admin is "theirs".
        const amIAdmin = Auth.user.role === 'admin';
        const isOriginalMine = !amIAdmin && (t.senderUsername === (Auth.user.username || Auth.user.identity) || t.sender === Auth.user.name);

        let html = `
            <div class="chat-bubble ${isOriginalMine ? 'mine' : 'theirs'}">
                <span class="msg-sender">${t.sender}</span>
                ${t.desc}
                <span class="msg-meta">${t.date}</span>
            </div>
        `;

        if (t.replies && t.replies.length > 0) {
            html += t.replies.map(r => {
                const isReplyMine = (amIAdmin && r.role === 'admin') || (!amIAdmin && r.role !== 'admin');
                return `
                <div class="chat-bubble ${isReplyMine ? 'mine' : 'theirs'}">
                    <span class="msg-sender">${r.sender}</span>
                    ${r.text}
                    <span class="msg-meta">${r.date}</span>
                </div>
                `;
            }).join('');
        }

        if (t.status === 'مغلق') {
            const ratingHtml = (t.rating > 0) ? '⭐'.repeat(t.rating) : 'لم يتم التقييم';
            html += `<div style="text-align:center; padding:10px; background:#f5f5f5; border-radius:8px; margin-top:10px; color:#666; font-size:0.9rem;">
                        <strong>التذكرة مغلقة</strong><br>التقييم: ${ratingHtml}
                    </div>`;

            if (!amIAdmin && !t.rating) {
                html += `
                 <div style="text-align:center; margin-top:10px; background:#fff; padding:15px; border-radius:8px; border:1px solid #eee;">
                    <p style="margin-bottom:10px; font-weight:bold; color:#3E4559;">قيم الخدمة:</p>
                    <div style="display:flex; justify-content:center; gap:5px;" class="rating-stars">
                        ${[5, 4, 3, 2, 1].map(n => `<button onclick="Support.rateTicket(${t.id}, ${n})" style="font-size:1.5rem; background:none; border:none; color:#ddd; cursor:pointer;" onmouseover="this.style.color='#f59e0b'" onmouseout="this.style.color='#ddd'">★</button>`).join('')}
                    </div>
                 </div>`;
            }
        }

        messagesView.innerHTML = html;
        messagesView.scrollTop = messagesView.scrollHeight; // Auto scroll to bottom

        // Update active class in list
        Support.loadTickets();

        // Configure Action Areas
        const chatInputArea = document.getElementById('chatInputArea');
        const adminActionArea = document.getElementById('adminActionArea');
        const replyText = document.getElementById('replyText');
        replyText.value = '';

        if (t.status === 'مغلق') {
            chatInputArea.style.display = 'none';
            adminActionArea.style.display = 'none';
        } else {
            chatInputArea.style.display = 'flex';
            if (amIAdmin) {
                adminActionArea.style.display = 'flex';
                // Hide specific buttons based on status
                const btnAccept = document.getElementById('btnAccept');
                const btnExecute = document.getElementById('btnExecute');
                const btnReturn = document.getElementById('btnReturn');
                const btnClose = document.getElementById('btnCloseTicket');

                btnAccept.style.display = 'none';
                btnExecute.style.display = 'none';
                btnReturn.style.display = 'none';
                btnClose.style.display = 'none';

                if (t.status === 'جديد' || t.status === 'محدث' || t.status === 'مسترجع') {
                    btnAccept.style.display = 'block';
                    btnReturn.style.display = 'block';
                } else if (t.status === 'قيد التنفيذ' || t.status === 'قيد المعالجة') {
                    btnExecute.style.display = 'block';
                    btnReturn.style.display = 'block';
                } else if (t.status === 'تم التنفيذ') {
                    btnClose.style.display = 'block';
                }
            } else {
                adminActionArea.style.display = 'none';
            }
        }
    },

    closeModal: () => {
        // Obsolete with chat interface
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
        Support.loadTickets();
        Support.openTicket(id); // Refresh chat pane
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


// Global exports handled at the EOF

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
            m.email = 'info@' + m.name.replace(/\s/g, '') + '.com';
            m.location = 'الرياض - حي العليا';
            m.logo = 'assets/logo.png'; // Placeholder
            merchantsChanged = true;
        }
    });
    if (merchantsChanged) Storage.set('merchants', merchants);

    console.log('Data Migration v2 Complete');
})();

/* ===========================
   CRUD EXTENSIONS - Functions now defined in main Actions object above
   Only loadMerchantProfile extension remains here
=========================== */
window.tempMerchantFiles = window.tempMerchantFiles || [];

/* ===========================
   MERCHANT PROFILE LOAD
=========================== */
Object.assign(Actions, {
    loadMerchantProfile: (id) => {
        const merchants = Storage.get('merchants') || [];
        console.log('loadMerchantProfile called with id:', id, 'merchants count:', merchants.length);
        const m = merchants.find(x => x.id == id); // loose check string/number
        if (!m) {
            console.warn('loadMerchantProfile: merchant not found for id:', id);
            return typeof showToast === 'function' ? showToast('المتجر غير موجود', 'error') : alert('المتجر غير موجود');
        }
        console.log('loadMerchantProfile: found merchant:', m.name);

        // Header
        document.getElementById('viewName').innerText = m.name;
        document.getElementById('viewCategory').innerText = m.category || '-';

        const isActive = (m.status === 'نشط' || m.status === 'Active');
        const badge = isActive ?
            '<span class="badge-gold" style="background:#e6fffa; color:#00A59B; border-color:#b2f5ea; padding:5px 15px; border-radius:20px;">نشط</span>' :
            '<span class="badge-gold" style="background:#fff5f5; color:#c53030; border-color:#feb2b2; padding:5px 15px; border-radius:20px;">غير نشط</span>';

        let badgesHtml = badge;

        // ======== Gamification UI Update ========
        const tx = Storage.get('transactions') || [];
        let myTx = tx.filter(t => t.partner === m.name || t.merchant === m.name);
        let txCount = myTx.length;
        if (txCount === 0) {
            // Visual demonstration for mock data
            txCount = (m.name.length * 17) % 150 + 5;
        }

        let badgeName = 'تاجر مبتدئ';
        let badgeIcon = '<i class="fas fa-medal" style="color: #64748b;"></i>';
        if (txCount >= 100) {
            badgeName = 'وسام ذهبي';
            badgeIcon = '<i class="fas fa-crown" style="color: #eab308;"></i>';
        } else if (txCount >= 50) {
            badgeName = 'وسام فضي';
            badgeIcon = '<i class="fas fa-gem" style="color: #94a3b8;"></i>';
        } else if (txCount >= 10) {
            badgeName = 'وسام برونزي';
            badgeIcon = '<i class="fas fa-award" style="color: #b45309;"></i>';
        }

        badgesHtml += ` <span style="background:#f8f9fa; border:1px solid #e2e8f0; padding:5px 15px; border-radius:20px; font-size:0.85rem; font-weight:bold; margin-right:5px;" title="${txCount} عملية تجارية">${badgeIcon} ${badgeName}</span>`;
        // ========================================

        if (m.crNumber && m.vatNumber) {
            badgesHtml += ' <span style="color:#10b981; font-weight:bold; margin-right:10px; font-size:0.9rem;"><i class="fas fa-check-circle"></i> موثق</span>';
        }
        document.getElementById('viewBadges').innerHTML = badgesHtml;

        // Contact
        document.getElementById('viewContact').innerText = m.contactPerson || '-';
        document.getElementById('viewPhone').innerText = m.phone || '-';
        document.getElementById('viewEmail').innerText = m.email || '-';
        document.getElementById('viewLocation').innerText = m.location || '-';

        // Reg
        document.getElementById('viewCR').innerText = m.crNumber || '-';
        document.getElementById('viewVAT').innerText = m.vatNumber || '-';
        document.getElementById('viewBank').innerText = m.bankName || '-';
        document.getElementById('viewIBAN').innerText = m.iban || '-';

        // Attachments
        const attachList = document.getElementById('viewAttachmentsList');
        if (m.attachments && m.attachments.length > 0) {
            attachList.innerHTML = '';
            m.attachments.forEach(f => {
                const div = document.createElement('div');
                div.className = 'attachment-item';
                div.innerHTML = `
                    <span><i class="fas fa-file-alt" style="color:#00A59B; margin-left:10px;"></i> ${f.name}</span>
                    <button class="secondary" onclick="alert('تحميل الملف... (محاكاة)')" style="padding:5px 10px; font-size:0.8rem;">تحميل</button>
                `;
                attachList.appendChild(div);
            });
        } else {
            attachList.innerHTML = '<p style="color:#777; text-align:center;">لا توجد مرفقات</p>';
        }
    }
});


function loadTables() {
    console.log('Calling loadTables wrapper');
    if (typeof loadWalletsTable === 'function') loadWalletsTable();
    if (typeof loadMerchantsTable === 'function') loadMerchantsTable();
    if (typeof loadCardsTable === 'function') loadCardsTable();
    if (typeof loadUsersTable === 'function') loadUsersTable();
}

// Ensure all major modules are accessible globally across all pages
window.Storage = Storage;
if (typeof Actions !== 'undefined') window.Actions = Actions;
if (typeof Auth !== 'undefined') window.Auth = Auth;
if (typeof Settings !== 'undefined') window.Settings = Settings;
if (typeof POS !== 'undefined') window.POS = POS;
if (typeof Orders !== 'undefined') window.Orders = Orders;
if (typeof Support !== 'undefined') window.Support = Support;
if (typeof System !== 'undefined') window.System = System;


/* ===== GLOBAL DARK MODE ===== */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('traof_dark_mode', isDark ? '1' : '0');
    updateDarkIcon(isDark);
}

function updateDarkIcon(isDark) {
    const icon = document.getElementById('darkIcon');
    const btn = document.getElementById('darkModeToggleBtn');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    if (btn) btn.innerHTML = isDark ? '<i id="darkIcon" class="fas fa-sun" style="color:#f59e0b;"></i> المظهر الفاتح' : '<i id="darkIcon" class="fas fa-moon"></i> المظهر الداكن';
}

// Global Init for Dark Mode
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('traof_dark_mode') === '1') {
        document.body.classList.add('dark-mode');
        updateDarkIcon(true);
    } else {
        updateDarkIcon(false);
    }

    // Auto-init AI Insights if on dashboard
    if (document.getElementById('aiTypewriter')) {
        setTimeout(generateAIInsight, 1000);
    }
});

/* ===== Phase 2: AI Insights ===== */
const aiInsightsList = [
    '<i class="fas fa-arrow-up" style="color:#8CC240"></i> <strong>ارتفاع المبيعات:</strong> متجر "أسواق العثيم" حقق زيادة 15% في العمليات هذا الأسبوع مقارنة بالأسبوع الماضي.',
    '<i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i> <strong>تنبيه ميزانية:</strong> من المتوقع نفاذ ميزانية محفظة "كسوة الشتاء" خلال 12 يوماً بناءً على معدل الاستهلاك الحالي.',
    '<i class="fas fa-check-circle" style="color:#00A59B"></i> <strong>أداء النظام:</strong> 98% من البطاقات النشطة تم استخدامها مرة واحدة على الأقل خلال الـ 30 يوماً الماضية.',
    '<i class="fas fa-chart-line" style="color:#8b5cf6"></i> <strong>توقع الإنفاق:</strong> بناءً على المواسم السابقة، من المتوقع زيادة السحوبات بنسبة 25% الأسبوع القادم استعداداً لشهر رمضان.',
    '<i class="fas fa-bolt" style="color:#ef4444"></i> <strong>اكتشاف استثنائي:</strong> البطاقة رقم "4711" أجرت 3 عمليات متتالية في أقل من دقيقتين. يرجى المراجعة.'
];

let aiTypingInterval;

function generateAIInsight() {
    const typewriter = document.getElementById('aiTypewriter');
    const refreshBtn = document.querySelector('.ai-refresh-btn i');
    if (!typewriter) return;

    clearInterval(aiTypingInterval);
    refreshBtn.classList.add('fa-spin');

    // Pick a random insight
    const insightHTML = aiInsightsList[Math.floor(Math.random() * aiInsightsList.length)];

    // Strip HTML tags for the typing effect, we will type the text then inject the full HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = insightHTML;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    const iconHTML = insightHTML.substring(0, insightHTML.indexOf('</i>') + 4);
    const strongHTML = insightHTML.substring(insightHTML.indexOf('<strong>'), insightHTML.indexOf('</strong>') + 9);
    const prefixHTML = iconHTML + ' ' + strongHTML + ' ';
    const textToType = plainText.replace(tempDiv.querySelector('strong').innerText, '').trim();

    typewriter.innerHTML = prefixHTML + '<span id="aiCursor">|</span>';

    let i = 0;
    aiTypingInterval = setInterval(() => {
        if (i < textToType.length) {
            typewriter.innerHTML = prefixHTML + textToType.substring(0, i + 1) + '<span id="aiCursor" style="animation: blink 1s infinite;">|</span>';
            i++;
        } else {
            clearInterval(aiTypingInterval);
            typewriter.innerHTML = insightHTML; // Set final HTML without cursor
            refreshBtn.classList.remove('fa-spin');
        }
    }, 30); // Typing speed
}

/* ===========================
   MOBILE RESPONSIVE MENU
=========================== */
(function initMobileMenu() {
    // Create hamburger button
    const btn = document.createElement('button');
    btn.className = 'mobile-menu-btn';
    btn.innerHTML = '<i class="fas fa-bars"></i>';
    btn.setAttribute('aria-label', 'فتح القائمة');
    document.body.appendChild(btn);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    btn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        btn.innerHTML = sidebar.classList.contains('open')
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    });

    overlay.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('open');
        overlay.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-bars"></i>';
    });

    // Close sidebar on link click (mobile)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.sidebar a[href]')) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.remove('open');
            overlay.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
})();

/* ===========================
   ACTIVITY LOG SYSTEM
=========================== */
const ActivityLog = {
    log: (action, details, user) => {
        const logs = Storage.get('activityLog') || [];
        logs.unshift({
            id: Date.now(),
            action: action,
            details: details,
            user: user || (Auth.user ? Auth.user.name : 'النظام'),
            timestamp: new Date().toISOString()
        });
        // Keep last 200 entries
        if (logs.length > 200) logs.length = 200;
        Storage.set('activityLog', logs);
    },

    getAll: () => Storage.get('activityLog') || [],

    getFiltered: (type, from, to) => {
        let logs = ActivityLog.getAll();
        if (type) logs = logs.filter(l => l.action.includes(type));
        if (from) logs = logs.filter(l => new Date(l.timestamp) >= new Date(from));
        if (to) logs = logs.filter(l => new Date(l.timestamp) <= new Date(to));
        return logs;
    },

    clear: () => Storage.set('activityLog', []),

    renderTimeline: (containerId, limit) => {
        const el = document.getElementById(containerId);
        if (!el) return;
        const logs = ActivityLog.getAll().slice(0, limit || 20);
        if (logs.length === 0) {
            el.innerHTML = '<div style="text-align:center; padding:30px; color:#888;"><i class="fas fa-clipboard-list" style="font-size:2rem; margin-bottom:10px; display:block;"></i>لا توجد أنشطة مسجلة بعد</div>';
            return;
        }
        const icons = {
            'إضافة': 'fa-plus-circle', 'حذف': 'fa-trash', 'تعديل': 'fa-edit',
            'شراء': 'fa-shopping-cart', 'تغذية': 'fa-coins', 'دخول': 'fa-sign-in-alt',
            'موقع': 'fa-map-marker-alt', 'توريد': 'fa-file-invoice'
        };
        const colors = {
            'إضافة': '#10b981', 'حذف': '#ef4444', 'تعديل': '#f59e0b',
            'شراء': '#3b82f6', 'تغذية': '#8CC240', 'دخول': '#00A59B',
            'موقع': '#6366f1', 'توريد': '#ec4899'
        };
        el.innerHTML = logs.map(l => {
            const iconKey = Object.keys(icons).find(k => l.action.includes(k)) || '';
            const icon = icons[iconKey] || 'fa-circle';
            const color = colors[iconKey] || '#888';
            const timeAgo = getTimeAgo(l.timestamp);
            return `<div style="display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid var(--border);">
                <div style="width:36px; height:36px; border-radius:10px; background:${color}15; color:${color}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fas ${icon}"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:0.9rem; color:var(--text-primary);">${l.action}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">${l.details}</div>
                </div>
                <div style="font-size:0.75rem; color:var(--muted); white-space:nowrap;">${timeAgo}</div>
            </div>`;
        }).join('');
    }
};

function getTimeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'الآن';
    if (m < 60) return `منذ ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} ساعة`;
    const d = Math.floor(h / 24);
    return `منذ ${d} يوم`;
}

// Hook into existing actions to log activities
(function hookActivityLog() {
    const origAddCard = Actions.addCard;
    if (origAddCard) {
        Actions.addCard = function () {
            origAddCard.apply(this, arguments);
            ActivityLog.log('إضافة بطاقة', 'تم إضافة بطاقة جديدة');
        };
    }
    const origAddMerchant = Actions.addMerchant;
    if (origAddMerchant) {
        Actions.addMerchant = function () {
            origAddMerchant.apply(this, arguments);
            const name = document.getElementById('merchantName')?.value || '';
            ActivityLog.log('إضافة/تعديل متجر', `متجر: ${name}`);
        };
    }
})();

/* ===========================
   GLOBAL SEARCH (Ctrl+K)
=========================== */
const GlobalSearch = {
    isOpen: false,

    init: () => {
        // Create search modal HTML
        const modal = document.createElement('div');
        modal.id = 'globalSearchOverlay';
        modal.innerHTML = `
        <div id="globalSearchDialog" style="background:var(--card); border-radius:20px; width:90%; max-width:600px; max-height:70vh; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.3); display:flex; flex-direction:column;">
            <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px;">
                <i class="fas fa-search" style="color:var(--brand-teal); font-size:1.2rem;"></i>
                <input type="text" id="globalSearchInput" placeholder="ابحث في البطاقات، المتاجر، المستفيدين..." style="flex:1; border:none; outline:none; font-size:1.1rem; background:transparent; color:var(--text-primary); font-family:inherit;">
                <kbd style="background:var(--thead-bg); color:var(--muted); padding:4px 10px; border-radius:6px; font-size:0.75rem; border:1px solid var(--border);">ESC</kbd>
            </div>
            <div id="globalSearchResults" style="padding:12px; overflow-y:auto; flex:1;"></div>
        </div>`;
        modal.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; backdrop-filter:blur(8px); justify-content:center; align-items:center; padding:20px;';
        document.body.appendChild(modal);

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                GlobalSearch.toggle();
            }
            if (e.key === 'Escape' && GlobalSearch.isOpen) {
                GlobalSearch.close();
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) GlobalSearch.close();
        });

        // Live search
        document.getElementById('globalSearchInput')?.addEventListener('input', (e) => {
            GlobalSearch.search(e.target.value);
        });
    },

    toggle: () => {
        GlobalSearch.isOpen ? GlobalSearch.close() : GlobalSearch.open();
    },

    open: () => {
        const modal = document.getElementById('globalSearchOverlay');
        if (!modal) return;
        modal.style.display = 'flex';
        GlobalSearch.isOpen = true;
        setTimeout(() => document.getElementById('globalSearchInput')?.focus(), 100);
    },

    close: () => {
        const modal = document.getElementById('globalSearchOverlay');
        if (!modal) return;
        modal.style.display = 'none';
        GlobalSearch.isOpen = false;
        const input = document.getElementById('globalSearchInput');
        if (input) input.value = '';
        const results = document.getElementById('globalSearchResults');
        if (results) results.innerHTML = '';
    },

    search: (query) => {
        const results = document.getElementById('globalSearchResults');
        if (!results || !query || query.length < 2) {
            if (results) results.innerHTML = '<div style="text-align:center; padding:30px; color:var(--muted);"><i class="fas fa-search" style="font-size:2rem; margin-bottom:10px; display:block;"></i>اكتب للبحث...</div>';
            return;
        }
        const q = query.toLowerCase();
        let items = [];

        // Search cards
        const cards = Storage.get('cards') || [];
        cards.forEach(c => {
            if ((c.number || '').toLowerCase().includes(q) || (c.holder || '').toLowerCase().includes(q)) {
                items.push({ type: 'بطاقة', icon: 'fa-credit-card', color: '#3b82f6', title: c.holder || c.number, sub: `رقم: ${c.number} | رصيد: ${c.balance} ريال`, link: 'cards.html' });
            }
        });

        // Search merchants
        const merchants = Storage.get('merchants') || [];
        merchants.forEach(m => {
            if ((m.name || '').toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q)) {
                items.push({ type: 'متجر', icon: 'fa-store', color: '#10b981', title: m.name, sub: `الفئة: ${m.category || '-'} | الموقع: ${m.location || '-'}`, link: 'merchants.html' });
            }
        });

        // Search beneficiaries
        const bens = Storage.get('beneficiaries') || [];
        bens.forEach(b => {
            if ((b.name || '').toLowerCase().includes(q) || (b.identity || '').toLowerCase().includes(q)) {
                items.push({ type: 'مستفيد', icon: 'fa-user', color: '#8b5cf6', title: b.name, sub: `الهوية: ${b.identity || '-'}`, link: 'settings.html' });
            }
        });

        // Search transactions
        const txns = Storage.get('transactions') || [];
        txns.forEach(t => {
            if ((t.merchant || '').toLowerCase().includes(q) || (t.card || '').toLowerCase().includes(q)) {
                items.push({ type: 'عملية', icon: 'fa-receipt', color: '#f59e0b', title: `${t.merchant} - ${t.amount} ريال`, sub: `بطاقة: ${t.card} | ${t.date || ''}`, link: 'reports.html' });
            }
        });

        if (items.length === 0) {
            results.innerHTML = '<div style="text-align:center; padding:30px; color:var(--muted);"><i class="fas fa-search" style="font-size:2rem; margin-bottom:10px; display:block; opacity:0.3;"></i>لا توجد نتائج لـ "' + query + '"</div>';
            return;
        }

        results.innerHTML = items.slice(0, 15).map(item => `
            <a href="${item.link}" style="display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; text-decoration:none; color:inherit; transition:0.2s; cursor:pointer;" onmouseover="this.style.background='var(--thead-bg)'" onmouseout="this.style.background='transparent'">
                <div style="width:40px; height:40px; border-radius:12px; background:${item.color}15; color:${item.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fas ${item.icon}"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:0.95rem;">${item.title}</div>
                    <div style="font-size:0.8rem; color:var(--muted);">${item.sub}</div>
                </div>
                <span style="font-size:0.7rem; background:${item.color}20; color:${item.color}; padding:4px 10px; border-radius:20px; font-weight:600;">${item.type}</span>
            </a>
        `).join('');
    }
};

// Initialize global search
GlobalSearch.init();

/* ===========================
   DATA EXPORT (CSV)
=========================== */
const DataExport = {
    toCSV: (data, filename) => {
        if (!data || data.length === 0) {
            if (typeof showToast === 'function') showToast('لا توجد بيانات للتصدير', 'warning');
            return;
        }
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        data.forEach(row => {
            csvRows.push(headers.map(h => {
                let val = row[h] || '';
                if (typeof val === 'object') val = JSON.stringify(val);
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            }).join(','));
        });
        // Add BOM for Arabic support
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        if (typeof showToast === 'function') showToast('تم تصدير البيانات بنجاح!', 'success');
        ActivityLog.log('تصدير بيانات', `تم تصدير ${filename} (${data.length} سجل)`);
    },

    exportCards: () => DataExport.toCSV(Storage.get('cards') || [], 'البطاقات'),
    exportMerchants: () => DataExport.toCSV(Storage.get('merchants') || [], 'المتاجر'),
    exportTransactions: () => DataExport.toCSV(Storage.get('transactions') || [], 'العمليات'),
    exportBeneficiaries: () => DataExport.toCSV(Storage.get('beneficiaries') || [], 'المستفيدون'),

    exportAll: () => {
        DataExport.exportCards();
        setTimeout(() => DataExport.exportMerchants(), 500);
        setTimeout(() => DataExport.exportTransactions(), 1000);
    }
};

/* ===========================
   PUSH NOTIFICATIONS (Local)
=========================== */
const PushNotifs = {
    permission: false,

    init: () => {
        if ('Notification' in window && Notification.permission === 'default') {
            // Don't request immediately, wait for user action
        }
    },

    requestPermission: async () => {
        if (!('Notification' in window)) return false;
        const p = await Notification.requestPermission();
        PushNotifs.permission = (p === 'granted');
        return PushNotifs.permission;
    },

    send: (title, body, icon) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            new Notification(title, {
                body: body,
                icon: icon || 'assets/logo.png',
                dir: 'rtl',
                lang: 'ar',
                badge: 'assets/logo.png'
            });
        } catch (e) { console.log('Notification error:', e); }
    }
};

PushNotifs.init();


/* ===========================
   WALLETS PAGE SPECIFIC
=========================== */
const WalletPage = {
    currentActionWallet: null,

    init: () => {
        WalletPage.updateStats();
        WalletPage.render();
    },

    toggleForm: () => {
        const body = document.getElementById('walletFormBody');
        const icon = document.getElementById('toggleWalletFormIcon');
        if (body.style.display === 'none') {
            body.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
        } else {
            body.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        }
    },

    updateStats: () => {
        const wallets = Storage.get('wallets');
        const cards = Storage.get('cards');
        const totalWallets = wallets.length;
        const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.funds) || 0), 0);

        const walletsMap = wallets.map(w => w.name);
        const linkedCards = cards.filter(c => walletsMap.includes(c.wallet)).length;

        const el1 = document.getElementById('statTotalWallets');
        const el2 = document.getElementById('statTotalWalletBalance');
        const el3 = document.getElementById('statLinkedCards');

        if (el1) el1.innerText = totalWallets;
        if (el2) el2.innerText = isNaN(totalBalance) ? '0' : totalBalance.toLocaleString('en-US');
        if (el3) el3.innerText = linkedCards;
    },

    render: (filterText = '', filterCat = '') => {
        const grid = document.getElementById('walletsVisualGrid');
        if (!grid) return;

        let wallets = Storage.get('wallets');

        wallets = wallets.filter(w => {
            const matchText = (w.name || '').includes(filterText) || (w.category || '').includes(filterText);
            const matchCat = filterCat === '' || w.category === filterCat;
            return matchText && matchCat;
        });

        if (wallets.length === 0) {
            grid.innerHTML = `<div class="empty-state">
                <i class="fas fa-folder-open empty-icon"></i>
                <p>لا توجد محافظ مطابقة للبحث</p>
                <button class="primary" onclick="WalletPage.toggleForm()">إنشاء محفظة جديدة</button>
            </div>`;
            return;
        }

        grid.innerHTML = wallets.map(w => {
            const funds = parseFloat(w.funds || 0);
            return `
            <div class="vcard-item" style="border-right: 4px solid ${w.color || '#00A59B'};" onclick="WalletPage.openDetail(${w.id})">
                <div class="vcard-header">
                    <div class="vc-icon" style="background: ${w.color || '#00A59B'}15; color: ${w.color || '#00A59B'}">
                        <i class="${w.icon || 'fas fa-wallet'}"></i>
                    </div>
                    <div class="vc-badge active">${w.category || 'عام'}</div>
                </div>
                <div class="vc-body">
                    <h3 class="vc-name">${w.name}</h3>
                    <div class="vc-balance">
                        <small>الرصيد المتاح</small>
                        <strong>${funds.toLocaleString('en-US', { minimumFractionDigits: 2 })} <small>ريال</small></strong>
                    </div>
                </div>
                <div class="vc-footer">
                    <span>${w.date || '—'}</span>
                    <span class="vc-hint"><i class="fas fa-mouse-pointer"></i> اضغط للخيارات</span>
                </div>
            </div>`;
        }).join('');
    },

    filterWallets: () => {
        const txt = document.getElementById('walletsSearchInput')?.value.trim() || '';
        const cat = document.getElementById('walletsFilterCategory')?.value || '';
        WalletPage.render(txt, cat);
    },

    addWallet: () => {
        const id = document.getElementById('editingWalletId').value;
        const name = document.getElementById('walletNameInput').value.trim();
        const category = document.getElementById('walletCategoryInput').value;
        const funds = parseFloat(document.getElementById('walletFundsInput').value) || 0;
        const target = parseFloat(document.getElementById('walletTargetInput').value) || 0;
        const color = document.getElementById('walletColorInput').value || '#00A59B';
        const icon = document.getElementById('walletIconInput').value || 'fas fa-wallet';

        if (!name) return alert('اسم المحفظة مطلوب!');

        const wallets = Storage.get('wallets');
        if (id) {
            const idx = wallets.findIndex(w => w.id == id);
            if (idx > -1) {
                wallets[idx] = { ...wallets[idx], name, category, funds, target, color, icon };
            }
        } else {
            wallets.push({
                id: Date.now(),
                name,
                category,
                funds,
                target,
                color,
                icon,
                date: new Date().toLocaleDateString('ar-SA'),
                history: [{ date: new Date().toLocaleString('ar-SA'), op: 'إنشاء المحفظة (رصيد افتتاحي)', amount: funds, type: 'in' }]
            });
        }

        Storage.set('wallets', wallets);
        WalletPage.cancelEdit();
        WalletPage.init();
        if (typeof showToast === 'function') showToast(id ? 'تم تعديل المحفظة' : 'تم إنشاء المحفظة', 'success');
    },

    editFromModal: () => {
        if (!WalletPage.currentActionWallet) return;
        const w = WalletPage.currentActionWallet;
        WalletPage.closeDetail();
        WalletPage.toggleForm();

        document.getElementById('editingWalletId').value = w.id;
        document.getElementById('walletNameInput').value = w.name;
        document.getElementById('walletCategoryInput').value = w.category || 'عام';
        document.getElementById('walletFundsInput').value = w.funds;
        document.getElementById('walletTargetInput').value = w.target || '';
        document.getElementById('walletColorInput').value = w.color || '#00A59B';
        document.getElementById('walletIconInput').value = w.icon || 'fas fa-wallet';

        document.getElementById('walletFormTitle').innerText = 'تعديل المحفظة';
        document.getElementById('saveWalletBtn').innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        document.getElementById('cancelWalletEditBtn').style.display = 'inline-block';
        document.getElementById('walletFormBody').style.display = 'block';
        document.getElementById('walletFormContainer').scrollIntoView({ behavior: 'smooth' });
    },

    cancelEdit: () => {
        document.getElementById('editingWalletId').value = '';
        document.getElementById('walletNameInput').value = '';
        document.getElementById('walletCategoryInput').value = 'عام';
        document.getElementById('walletFundsInput').value = '';
        document.getElementById('walletTargetInput').value = '';
        document.getElementById('walletColorInput').value = '#00A59B';
        document.getElementById('walletIconInput').value = 'fas fa-wallet';

        document.getElementById('walletFormTitle').innerText = 'إنشاء محفظة جديدة';
        document.getElementById('saveWalletBtn').innerHTML = '<i class="fas fa-plus"></i> إنشاء المحفظة';
        document.getElementById('cancelWalletEditBtn').style.display = 'none';
    },

    deleteFromModal: () => {
        if (!WalletPage.currentActionWallet) return;
        if (confirm('هل أنت متأكد من حذف هذه المحفظة نهائياً؟')) {
            let wallets = Storage.get('wallets');
            wallets = wallets.filter(w => w.id != WalletPage.currentActionWallet.id);
            Storage.set('wallets', wallets);
            WalletPage.closeDetail();
            WalletPage.init();
            if (typeof showToast === 'function') showToast('تم حذف المحفظة بنجاح', 'success');
        }
    },

    openDetail: (id) => {
        const wallets = Storage.get('wallets');
        const w = wallets.find(x => x.id == id);
        if (!w) return;
        WalletPage.currentActionWallet = w;

        document.getElementById('wdName').innerText = w.name;
        document.getElementById('wdCategory').innerText = w.category || 'عام';
        document.getElementById('wdBalance').innerText = (parseFloat(w.funds) || 0).toLocaleString('en-US') + ' ريال';
        document.getElementById('wdTarget').innerText = w.target ? w.target.toLocaleString('en-US') + ' ريال' : 'غير محدد';
        document.getElementById('wdDate').innerText = w.date || '—';
        document.getElementById('wdIconBadge').innerHTML = `<i class="${w.icon || 'fas fa-wallet'}"></i>`;

        document.getElementById('wdPreview').style.background = `linear-gradient(135deg, #1a1d27, ${w.color || '#00A59B'})`;

        // Render History
        const histDiv = document.getElementById('wdTransactions');
        const hist = w.history || [];
        if (hist.length === 0) {
            histDiv.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">لا توجد عمليات</div>';
        } else {
            histDiv.innerHTML = hist.slice().reverse().map(h => `
                <div class="trans-item">
                    <div class="trans-icon ${h.type === 'in' ? 'success' : 'danger'}">
                        <i class="fas fa-arrow-${h.type === 'in' ? 'down' : 'up'}"></i>
                    </div>
                    <div class="trans-info">
                        <strong>${h.op}</strong>
                        <small>${h.date}</small>
                    </div>
                    <div class="trans-amount ${h.type === 'in' ? 'text-success' : 'text-danger'}">
                        ${h.type === 'in' ? '+' : '-'}${parseFloat(h.amount).toLocaleString('en-US')}
                    </div>
                </div>
            `).join('');
        }

        // Render Linked Cards
        const lcDiv = document.getElementById('wdLinkedCards');
        const cards = Storage.get('cards').filter(c => c.wallet === w.name);
        if (cards.length === 0) {
            lcDiv.innerHTML = '<div style="text-align:center;color:#888;padding:10px;">لا توجد بطاقات مرتبطة</div>';
        } else {
            lcDiv.innerHTML = cards.map(c => `
                <div class="trans-item" style="cursor:pointer;" onclick="location.href='cards.html'">
                    <div class="trans-icon primary"><i class="fas fa-credit-card"></i></div>
                    <div class="trans-info">
                        <strong>${c.masked || c.number}</strong>
                        <small>${c.beneficiary}</small>
                    </div>
                    <div class="trans-amount text-primary">${parseFloat(c.balance).toLocaleString()} ر.س</div>
                </div>
            `).join('');
        }

        document.getElementById('walletDetailOverlay').style.display = 'flex';
    },

    closeDetail: () => {
        document.getElementById('walletDetailOverlay').style.display = 'none';
        WalletPage.currentActionWallet = null;
    },

    openBalanceModal: (type, id = null) => {
        if (id) {
            const wallets = Storage.get('wallets');
            WalletPage.currentActionWallet = wallets.find(x => x.id == id);
            WalletPage.closeDetail();
        }

        if (!WalletPage.currentActionWallet) return;

        const isDeposit = type === 'deposit';
        document.getElementById('walletBalanceModalTitle').innerHTML = isDeposit
            ? '<i class="fas fa-arrow-down text-success"></i> إيداع رصيد بالمحفظة'
            : '<i class="fas fa-arrow-up text-danger"></i> سحب رصيد من المحفظة';

        document.getElementById('walletBalanceOpType').value = type;
        document.getElementById('walletBalanceOpAmount').value = '';
        document.getElementById('walletBalanceOpReason').value = isDeposit ? 'تمويل إضافي' : 'سحب / صرف من المحفظة';

        document.getElementById('walletBalanceModalOverlay').style.display = 'flex';
    },

    closeBalanceModal: () => {
        document.getElementById('walletBalanceModalOverlay').style.display = 'none';
        if (WalletPage.currentActionWallet && document.getElementById('walletDetailOverlay').style.display === 'none') {
            WalletPage.openDetail(WalletPage.currentActionWallet.id);
        }
    },

    submitBalanceOp: () => {
        const amt = parseFloat(document.getElementById('walletBalanceOpAmount').value);
        const reason = document.getElementById('walletBalanceOpReason').value.trim() || 'عملية مجهولة';
        const type = document.getElementById('walletBalanceOpType').value;
        const w = WalletPage.currentActionWallet;

        if (!amt || amt <= 0) return alert('الرجاء إدخال مبلغ صحيح');
        if (!w) return;

        let wallets = Storage.get('wallets');
        const idx = wallets.findIndex(x => x.id == w.id);
        if (idx === -1) return;

        if (type === 'withdraw' && wallets[idx].funds < amt) {
            return alert('الرصيد في المحفظة غير كافٍ لهذه العملية!');
        }

        if (type === 'withdraw') {
            wallets[idx].funds -= amt;
        } else {
            wallets[idx].funds += amt;
        }

        if (!wallets[idx].history) wallets[idx].history = [];
        wallets[idx].history.push({
            date: new Date().toLocaleString('ar-SA'),
            op: reason,
            amount: amt,
            type: type === 'withdraw' ? 'out' : 'in'
        });

        Storage.set('wallets', wallets);
        WalletPage.closeBalanceModal();
        WalletPage.init();
        if (typeof showToast === 'function') showToast('تمت العملية بنجاح', 'success');
        WalletPage.openDetail(w.id); // Reopen to see changes
    }
};

// Auto-init if we are on wallets.html
if (window.location.pathname.includes('wallets.html')) {
    document.addEventListener('DOMContentLoaded', WalletPage.init);
}

// Add these exports specifically mapped to old code format in Global Actions so original HTML won't break if needed
if (typeof Actions !== 'undefined') {
    Actions.addWallet = WalletPage.addWallet;
    Actions.cancelWalletEdit = WalletPage.cancelEdit;
}
