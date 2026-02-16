
/* ===========================
   DUMMY DATA SEEDER — FULL RICH DATASET
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
        { id: 15, name: 'لمياء خالد عبدالرحمن الجهني', firstName: 'لمياء', fatherName: 'خالد', grandName: 'عبدالرحمن', familyName: 'الجهني', nationality: 'gulf', identity: '1151515150', mobile: '0512345015', fileNum: 'F015' },
        { id: 16, name: 'تركي فهد محمد السبيعي', firstName: 'تركي', fatherName: 'فهد', grandName: 'محمد', familyName: 'السبيعي', nationality: 'saudi', identity: '1161616160', mobile: '0512345016', fileNum: 'F016' },
        { id: 17, name: 'عائشة سعود ناصر الرشيدي', firstName: 'عائشة', fatherName: 'سعود', grandName: 'ناصر', familyName: 'الرشيدي', nationality: 'saudi', identity: '1171717170', mobile: '0512345017', fileNum: 'F017' },
        { id: 18, name: 'بدر حمد علي الشهراني', firstName: 'بدر', fatherName: 'حمد', grandName: 'علي', familyName: 'الشهراني', nationality: 'saudi', identity: '1181818180', mobile: '0512345018', fileNum: 'F018' },
        { id: 19, name: 'مها عبدالله سعيد الحارثي', firstName: 'مها', fatherName: 'عبدالله', grandName: 'سعيد', familyName: 'الحارثي', nationality: 'non_saudi', identity: '2191919190', mobile: '0512345019', fileNum: 'F019' },
        { id: 20, name: 'فواز خالد أحمد الزهراني', firstName: 'فواز', fatherName: 'خالد', grandName: 'أحمد', familyName: 'الزهراني', nationality: 'saudi', identity: '1202020200', mobile: '0512345020', fileNum: 'F020' }
    ];

    const wallets = [
        { id: 1, name: 'السلة الغذائية', funds: 150000, merchants: 'أسواق العثيم, بندة, الدانوب, التميمي', status: 'نشط' },
        { id: 2, name: 'كسوة الشتاء', funds: 75000, merchants: 'سنتربوينت, ماكس, رد تاغ, زارا', status: 'نشط' },
        { id: 3, name: 'الأجهزة الكهربائية', funds: 50000, merchants: 'إكسترا, المنيع, ساكو', status: 'نشط' },
        { id: 4, name: 'دعم الإيجار', funds: 200000, merchants: 'خدمات إلكترونية', status: 'نشط' },
        { id: 5, name: 'الأدوية والعلاج', funds: 95000, merchants: 'صيدلية النهدي, صيدلية الدواء', status: 'نشط' },
        { id: 6, name: 'المستلزمات المدرسية', funds: 40000, merchants: 'مكتبة جرير, سنتربوينت', status: 'نشط' },
        { id: 7, name: 'المواصلات', funds: 30000, merchants: 'أوبر, كريم', status: 'نشط' },
        { id: 8, name: 'الأثاث المنزلي', funds: 60000, merchants: 'ايكيا, هوم سنتر', status: 'نشط' }
    ];

    const merchants = [
        { id: 101, name: 'أسواق العثيم', category: 'مواد غذائية', transactions: 245, status: 'نشط' },
        { id: 102, name: 'بندة', category: 'مواد غذائية', transactions: 198, status: 'نشط' },
        { id: 103, name: 'الدانوب', category: 'مواد غذائية', transactions: 145, status: 'نشط' },
        { id: 104, name: 'التميمي', category: 'مواد غذائية', transactions: 88, status: 'نشط' },
        { id: 201, name: 'سنتربوينت', category: 'ملابس', transactions: 176, status: 'نشط' },
        { id: 202, name: 'إكسترا', category: 'إلكترونيات', transactions: 82, status: 'نشط' },
        { id: 301, name: 'صيدلية النهدي', category: 'أدوية', transactions: 310, status: 'نشط' },
        { id: 302, name: 'مكتبة جرير', category: 'مستلزمات مدرسية', transactions: 67, status: 'نشط' },
        { id: 303, name: 'المنيع', category: 'إلكترونيات', transactions: 43, status: 'نشط' },
        { id: 304, name: 'ماكس', category: 'ملابس', transactions: 95, status: 'موقوف' },
        { id: 305, name: 'صيدلية الدواء', category: 'أدوية', transactions: 120, status: 'نشط' },
        { id: 306, name: 'ايكيا', category: 'أثاث', transactions: 35, status: 'نشط' },
        { id: 307, name: 'ساكو', category: 'أدوات منزلية', transactions: 52, status: 'نشط' },
        { id: 308, name: 'هوم سنتر', category: 'أثاث', transactions: 28, status: 'نشط' }
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
        { id: 15, number: '60006002', balance: 250, status: 'نشط', wallet: 'المستلزمات المدرسية', beneficiary: 'لمياء خالد عبدالرحمن الجهني', identity: '1151515150' },
        { id: 16, number: '70007001', balance: 180, status: 'نشط', wallet: 'المواصلات', beneficiary: 'تركي فهد محمد السبيعي', identity: '1161616160' },
        { id: 17, number: '80008001', balance: 1200, status: 'نشط', wallet: 'الأثاث المنزلي', beneficiary: 'عائشة سعود ناصر الرشيدي', identity: '1171717170' },
        { id: 18, number: '10001006', balance: 320, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'بدر حمد علي الشهراني', identity: '1181818180' },
        { id: 19, number: '50005003', balance: 0, status: 'موقوف', wallet: 'الأدوية والعلاج', beneficiary: 'مها عبدالله سعيد الحارثي', identity: '2191919190' },
        { id: 20, number: '30003002', balance: 1800, status: 'نشط', wallet: 'الأجهزة الكهربائية', beneficiary: 'فواز خالد أحمد الزهراني', identity: '1202020200' }
    ];

    // --- Generate 90 days of rich transactions ---
    const txMerchants = ['أسواق العثيم', 'بندة', 'الدانوب', 'التميمي', 'سنتربوينت', 'إكسترا', 'صيدلية النهدي', 'مكتبة جرير', 'المنيع', 'صيدلية الدواء', 'ايكيا', 'ساكو', 'هوم سنتر'];
    const txCards = cards.filter(c => c.status === 'نشط').map(c => c.number);
    const transactions = [];
    let txId = 500;
    const now = new Date();

    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
        const d = new Date(now);
        d.setDate(now.getDate() - dayOffset);
        const dateStr = d.toLocaleDateString('ar-SA');
        const dayOfWeek = d.getDay();
        // Weekends (Fri/Sat in Saudi) get fewer transactions
        const isSlow = dayOfWeek === 5 || dayOfWeek === 6;
        const txCount = isSlow ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 7) + 3;

        for (let t = 0; t < txCount; t++) {
            txId++;
            const merchant = txMerchants[Math.floor(Math.random() * txMerchants.length)];
            // Amount varies by merchant category
            let amount;
            if (['أسواق العثيم', 'بندة', 'الدانوب', 'التميمي'].includes(merchant)) {
                amount = Math.floor(Math.random() * 250 + 30); // Groceries: 30-280
            } else if (['سنتربوينت', 'ماكس'].includes(merchant)) {
                amount = Math.floor(Math.random() * 400 + 80); // Clothing: 80-480
            } else if (['إكسترا', 'المنيع', 'ساكو'].includes(merchant)) {
                amount = Math.floor(Math.random() * 800 + 100); // Electronics: 100-900
            } else if (['ايكيا', 'هوم سنتر'].includes(merchant)) {
                amount = Math.floor(Math.random() * 600 + 150); // Furniture: 150-750
            } else if (['صيدلية النهدي', 'صيدلية الدواء'].includes(merchant)) {
                amount = Math.floor(Math.random() * 120 + 15); // Pharmacy: 15-135
            } else {
                amount = Math.floor(Math.random() * 200 + 20); // Default: 20-220
            }

            transactions.push({
                id: txId,
                card: txCards[Math.floor(Math.random() * txCards.length)],
                amount: amount,
                date: dateStr,
                merchant: merchant
            });
        }
    }

    const supplyOrders = [
        { id: '100201', item: 'توريد سلال غذائية (أرز، سكر، زيت)', partner: 'أسواق العثيم', cost: 15000, date: '2024-01-05', status: 'Completed' },
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

    Storage.set('users', [
        { id: 1, name: 'مدير النظام', username: 'admin', password: '123', role: 'admin' },
        { id: 2, name: 'تاجر العثيم', username: 'merchant', password: '123', role: 'merchant', linkedEntity: 'أسواق العثيم' },
        { id: 3, name: 'أحمد محمد علي الغامدي', username: 'ben1', password: '123', role: 'beneficiary', linkedEntity: 'أحمد محمد علي الغامدي' },
        { id: 4, name: 'سارة عبدالله عمر الشهري', username: 'ben2', password: '123', role: 'beneficiary', linkedEntity: 'سارة عبدالله عمر الشهري' },
        { id: 5, name: 'خالد عبدالعزيز فهد العنزي', username: 'ben3', password: '123', role: 'beneficiary', linkedEntity: 'خالد عبدالعزيز فهد العنزي' },
        { id: 6, name: 'تاجر بندة', username: 'merchant2', password: '123', role: 'merchant', linkedEntity: 'بندة' },
        { id: 7, name: 'تاجر الدانوب', username: 'merchant3', password: '123', role: 'merchant', linkedEntity: 'الدانوب' }
    ]);
    Storage.set('beneficiaries', beneficiaries);
    Storage.set('cards', cards);
    Storage.set('wallets', wallets);
    Storage.set('merchants', merchants);
    Storage.set('supply_orders', supplyOrders);
    Storage.set('transactions', transactions);

    alert('✅ تم تحميل البيانات التجريبية بنجاح!\n\n' +
        '👥 ' + beneficiaries.length + ' مستفيد\n' +
        '💳 ' + cards.length + ' بطاقة\n' +
        '🏪 ' + merchants.length + ' متجر\n' +
        '📁 ' + wallets.length + ' محفظة\n' +
        '🧾 ' + transactions.length + ' عملية (90 يوم)\n' +
        '📦 ' + supplyOrders.length + ' أمر توريد');
    location.reload();
}
