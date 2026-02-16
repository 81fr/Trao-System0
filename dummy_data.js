
/* ===========================
   DUMMY DATA SEEDER — FULL
   =========================== */
function injectDummyData() {
    if (!confirm('سيتم مسح البيانات الحالية واستبدالها ببيانات تجريبية. هل أنت متأكد؟')) return;

    const beneficiaries = [
        { id: 1, name: 'أحمد محمد علي الغامدي', firstName: 'أحمد', fatherName: 'محمد', grandName: 'علي', familyName: 'الغامدي', nationality: 'saudi', identity: '1010101010', mobile: '0512345001', fileNum: 'F001' },
        { id: 2, name: 'سارة عبدالله عمر الشهري', firstName: 'سارة', fatherName: 'عبدالله', grandName: 'عمر', familyName: 'الشهري', nationality: 'saudi', identity: '1020202020', mobile: '0512345002', fileNum: 'F002' },
        { id: 3, name: 'فاطمة حسن سعيد القحطاني', firstName: 'فاطمة', fatherName: 'حسن', grandName: 'سعيد', familyName: 'القحطاني', nationality: 'saudi', identity: '1030303030', mobile: '0512345003', fileNum: 'F003' },
        { id: 4, name: 'خالد عبدالعزيز فهد العنزي', firstName: 'خالد', fatherName: 'عبدالعزيز', grandName: 'فهد', familyName: 'العنزي', nationality: 'saudi', identity: '1040404040', mobile: '0512345004', fileNum: 'F004' },
        { id: 5, name: 'نورة صالح ناصر الدوسري', firstName: 'نورة', fatherName: 'صالح', grandName: 'ناصر', familyName: 'الدوسري', nationality: 'saudi', identity: '1050505050', mobile: '0512345005', fileNum: 'F005' },
        { id: 6, name: 'عمر يوسف سعد المطيري', firstName: 'عمر', fatherName: 'يوسف', grandName: 'سعد', familyName: 'المطيري', nationality: 'saudi', identity: '1060606060', mobile: '0512345006', fileNum: 'F006' },
        { id: 7, name: 'ليلى محمود أحمد الحربي', firstName: 'ليلى', fatherName: 'محمود', grandName: 'أحمد', familyName: 'الحربي', nationality: 'non_saudi', identity: '2070707070', mobile: '0512345007', fileNum: 'F007' },
        { id: 8, name: 'سعيد حسين فيصل القحطاني', firstName: 'سعيد', fatherName: 'حسين', grandName: 'فيصل', familyName: 'القحطاني', nationality: 'saudi', identity: '1080808080', mobile: '0512345008', fileNum: 'F008' },
        { id: 9, name: 'منى عبدالرحمن خالد الدوسري', firstName: 'منى', fatherName: 'عبدالرحمن', grandName: 'خالد', familyName: 'الدوسري', nationality: 'saudi', identity: '1090909090', mobile: '0512345009', fileNum: 'F009' },
        { id: 10, name: 'عبدالله سلطان ماجد العنزي', firstName: 'عبدالله', fatherName: 'سلطان', grandName: 'ماجد', familyName: 'العنزي', nationality: 'gulf', identity: '1101010101', mobile: '0512345010', fileNum: 'F010' },
        { id: 11, name: 'هند فارس طلال الشمري', firstName: 'هند', fatherName: 'فارس', grandName: 'طلال', familyName: 'الشمري', nationality: 'saudi', identity: '1111111110', mobile: '0512345011', fileNum: 'F011' },
        { id: 12, name: 'ماجد صالح عمر العتيبي', firstName: 'ماجد', fatherName: 'صالح', grandName: 'عمر', familyName: 'العتيبي', nationality: 'saudi', identity: '1121212120', mobile: '0512345012', fileNum: 'F012' },
        { id: 13, name: 'ريم ناصر فهد الزهراني', firstName: 'ريم', fatherName: 'ناصر', grandName: 'فهد', familyName: 'الزهراني', nationality: 'non_saudi', identity: '2131313130', mobile: '0512345013', fileNum: 'F013' },
        { id: 14, name: 'يزيد طارق سليمان البلوي', firstName: 'يزيد', fatherName: 'طارق', grandName: 'سليمان', familyName: 'البلوي', nationality: 'saudi', identity: '1141414140', mobile: '0512345014', fileNum: 'F014' },
        { id: 15, name: 'لمياء خالد عبدالرحمن الجهني', firstName: 'لمياء', fatherName: 'خالد', grandName: 'عبدالرحمن', familyName: 'الجهني', nationality: 'gulf', identity: '1151515150', mobile: '0512345015', fileNum: 'F015' }
    ];

    const wallets = [
        { id: 1, name: 'السلة الغذائية', funds: 150000, merchants: 'أسواق العثيم, بندة, الدانوب', status: 'نشط' },
        { id: 2, name: 'كسوة الشتاء', funds: 75000, merchants: 'سنتربوينت, ماكس, رد تاغ', status: 'نشط' },
        { id: 3, name: 'الأجهزة الكهربائية', funds: 50000, merchants: 'إكسترا, المنيع', status: 'نشط' },
        { id: 4, name: 'دعم الإيجار', funds: 200000, merchants: 'خدمات إلكترونية', status: 'نشط' },
        { id: 5, name: 'الأدوية والعلاج', funds: 95000, merchants: 'صيدلية النهدي, صيدلية الدواء', status: 'نشط' },
        { id: 6, name: 'المستلزمات المدرسية', funds: 40000, merchants: 'مكتبة جرير, سنتربوينت', status: 'نشط' }
    ];

    const merchants = [
        { id: 101, name: 'أسواق العثيم', category: 'مواد غذائية', transactions: 245, status: 'نشط' },
        { id: 102, name: 'بندة', category: 'مواد غذائية', transactions: 198, status: 'نشط' },
        { id: 103, name: 'الدانوب', category: 'مواد غذائية', transactions: 145, status: 'نشط' },
        { id: 201, name: 'سنتربوينت', category: 'ملابس', transactions: 176, status: 'نشط' },
        { id: 202, name: 'إكسترا', category: 'إلكترونيات', transactions: 82, status: 'نشط' },
        { id: 301, name: 'صيدلية النهدي', category: 'أدوية', transactions: 310, status: 'نشط' },
        { id: 302, name: 'مكتبة جرير', category: 'مستلزمات مدرسية', transactions: 67, status: 'نشط' },
        { id: 303, name: 'المنيع', category: 'إلكترونيات', transactions: 43, status: 'نشط' },
        { id: 304, name: 'ماكس', category: 'ملابس', transactions: 95, status: 'موقوف' },
        { id: 305, name: 'صيدلية الدواء', category: 'أدوية', transactions: 120, status: 'نشط' }
    ];

    const cards = [
        { id: 1, number: '10001001', balance: 500, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'أحمد محمد علي الغامدي', identity: '1010101010' },
        { id: 2, number: '10001002', balance: 350, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'سارة عبدالله عمر الشهري', identity: '1020202020' },
        { id: 3, number: '10001003', balance: 0, status: 'موقوف', wallet: 'السلة الغذائية', beneficiary: 'فاطمة حسن سعيد القحطاني', identity: '1030303030' },
        { id: 4, number: '20002001', balance: 1000, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'خالد عبدالعزيز فهد العنزي', identity: '1040404040' },
        { id: 5, number: '20002002', balance: 800, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'نورة صالح ناصر الدوسري', identity: '1050505050' },
        { id: 6, number: '30003001', balance: 2500, status: 'نشط', wallet: 'الأجهزة الكهربائية', beneficiary: 'عمر يوسف سعد المطيري', identity: '1060606060' },
        { id: 7, number: '10001004', balance: 450, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'ليلى محمود أحمد الحربي', identity: '2070707070' },
        { id: 8, number: '20002003', balance: 600, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'سعيد حسين فيصل القحطاني', identity: '1080808080' },
        { id: 9, number: '50005001', balance: 750, status: 'نشط', wallet: 'الأدوية والعلاج', beneficiary: 'منى عبدالرحمن خالد الدوسري', identity: '1090909090' },
        { id: 10, number: '60006001', balance: 300, status: 'نشط', wallet: 'المستلزمات المدرسية', beneficiary: 'عبدالله سلطان ماجد العنزي', identity: '1101010101' },
        { id: 11, number: '10001005', balance: 200, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'هند فارس طلال الشمري', identity: '1111111110' },
        { id: 12, number: '40004001', balance: 3500, status: 'نشط', wallet: 'دعم الإيجار', beneficiary: 'ماجد صالح عمر العتيبي', identity: '1121212120' },
        { id: 13, number: '50005002', balance: 400, status: 'موقوف', wallet: 'الأدوية والعلاج', beneficiary: 'ريم ناصر فهد الزهراني', identity: '2131313130' },
        { id: 14, number: '20002004', balance: 900, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'يزيد طارق سليمان البلوي', identity: '1141414140' },
        { id: 15, number: '60006002', balance: 250, status: 'نشط', wallet: 'المستلزمات المدرسية', beneficiary: 'لمياء خالد عبدالرحمن الجهني', identity: '1151515150' }
    ];

    // --- Generate 30 days of transactions ---
    const txMerchants = ['أسواق العثيم', 'بندة', 'الدانوب', 'سنتربوينت', 'إكسترا', 'صيدلية النهدي', 'مكتبة جرير', 'المنيع', 'صيدلية الدواء'];
    const txCards = ['10001001', '10001002', '20002001', '20002002', '30003001', '10001004', '20002003', '50005001', '60006001', '10001005', '40004001', '20002004', '60006002'];
    const transactions = [];
    let txId = 500;
    const now = new Date();

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const d = new Date(now);
        d.setDate(now.getDate() - dayOffset);
        const dateStr = d.toLocaleDateString('ar-SA');

        // Random 2-6 transactions per day
        const txCount = Math.floor(Math.random() * 5) + 2;
        for (let t = 0; t < txCount; t++) {
            txId++;
            transactions.push({
                id: txId,
                card: txCards[Math.floor(Math.random() * txCards.length)],
                amount: Math.floor(Math.random() * 400 + 30),
                date: dateStr,
                merchant: txMerchants[Math.floor(Math.random() * txMerchants.length)]
            });
        }
    }

    const supplyOrders = [
        { id: '100201', item: 'توريد سلال غذائية (أرز، سكر، زيت)', partner: 'أسواق العثيم', cost: 15000, date: '2023-10-01', status: 'Completed' },
        { id: '100202', item: 'توريد بطانيات شتوية', partner: 'سنتربوينت', cost: 8000, date: '2023-10-05', status: 'Pending' },
        { id: '100203', item: 'توريد أجهزة تكييف', partner: 'إكسترا', cost: 25000, date: '2023-10-10', status: 'Pending' },
        { id: '100204', item: 'صيانة مستودع الجمعية', partner: 'خدمات إلكترونية', cost: 4500, date: '2023-10-12', status: 'Rejected', rejectionReason: 'السعر مرتفع جداً مقارنة بالسوق' },
        { id: '100205', item: 'توريد ملابس أطفال', partner: 'ماكس', cost: 12000, date: '2023-10-15', status: 'Accepted' },
        { id: '100206', item: 'كوبونات شرائية', partner: 'الدانوب', cost: 50000, date: '2023-10-20', status: 'Withdrawn' },
        { id: '100207', item: 'توريد أدوية أطفال', partner: 'صيدلية النهدي', cost: 18000, date: '2023-11-01', status: 'Completed' },
        { id: '100208', item: 'حقائب مدرسية', partner: 'مكتبة جرير', cost: 9500, date: '2023-11-05', status: 'Completed' },
        { id: '100209', item: 'توريد مواد تنظيف', partner: 'بندة', cost: 5200, date: '2023-11-10', status: 'Accepted' },
        { id: '100210', item: 'توريد ثلاجات للعائلات', partner: 'إكسترا', cost: 32000, date: '2023-11-15', status: 'Pending' },
        { id: '100211', item: 'أدوات كهربائية منزلية', partner: 'المنيع', cost: 21000, date: '2023-11-20', status: 'Completed' },
        { id: '100212', item: 'ملابس شتوية نسائية', partner: 'سنتربوينت', cost: 14000, date: '2023-12-01', status: 'Accepted' }
    ];

    Storage.set('users', [
        { id: 1, name: 'مدير النظام', username: 'admin', password: '123', role: 'admin' },
        { id: 2, name: 'تاجر العثيم', username: 'merchant', password: '123', role: 'merchant', linkedEntity: 'أسواق العثيم' },
        { id: 3, name: 'أحمد محمد علي الغامدي', username: 'ben1', password: '123', role: 'beneficiary', linkedEntity: 'أحمد محمد علي الغامدي' },
        { id: 4, name: 'سارة عبدالله عمر الشهري', username: 'ben2', password: '123', role: 'beneficiary', linkedEntity: 'سارة عبدالله عمر الشهري' },
        { id: 5, name: 'خالد عبدالعزيز فهد العنزي', username: 'ben3', password: '123', role: 'beneficiary', linkedEntity: 'خالد عبدالعزيز فهد العنزي' },
        { id: 6, name: 'تاجر بندة', username: 'merchant2', password: '123', role: 'merchant', linkedEntity: 'بندة' }
    ]);
    Storage.set('beneficiaries', beneficiaries);
    Storage.set('cards', cards);
    Storage.set('wallets', wallets);
    Storage.set('merchants', merchants);
    Storage.set('supply_orders', supplyOrders);
    Storage.set('transactions', transactions);

    alert('✅ تم تحميل البيانات التجريبية بنجاح!\n\n📊 ' + beneficiaries.length + ' مستفيد\n💳 ' + cards.length + ' بطاقة\n🏪 ' + merchants.length + ' متجر\n📁 ' + wallets.length + ' محفظة\n🧾 ' + transactions.length + ' عملية\n📦 ' + supplyOrders.length + ' أمر توريد');
    location.reload();
}
