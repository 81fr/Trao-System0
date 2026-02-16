
/* ===========================
   DUMMY DATA SEEDER
   =========================== */
function injectDummyData() {
    if (!confirm('سيتم مسح البيانات الحالية واستبدالها ببيانات تجريبية. هل أنت متأكد؟')) return;

    const beneficiaries = [
        { id: 1, name: 'أحمد محمد علي الغامدي', firstName: 'أحمد', fatherName: 'محمد', grandName: 'علي', familyName: 'الغامدي', nationality: 'saudi', identity: '1010101010', mobile: '0500000001', fileNum: 'F001' },
        { id: 2, name: 'سارة عبدالله عمر الشهري', firstName: 'سارة', fatherName: 'عبدالله', grandName: 'عمر', familyName: 'الشهري', nationality: 'saudi', identity: '1020202020', mobile: '0500000002', fileNum: 'F002' },
        { id: 3, name: 'فاطمة حسن سعيد القحطاني', firstName: 'فاطمة', fatherName: 'حسن', grandName: 'سعيد', familyName: 'القحطاني', nationality: 'saudi', identity: '1030303030', mobile: '0500000003', fileNum: 'F003' },
        { id: 4, name: 'خالد عبدالعزيز فهد العنزي', firstName: 'خالد', fatherName: 'عبدالعزيز', grandName: 'فهد', familyName: 'العنزي', nationality: 'saudi', identity: '1040404040', mobile: '0500000004', fileNum: 'F004' },
        { id: 5, name: 'نورة صالح ناصر الدوسري', firstName: 'نورة', fatherName: 'صالح', grandName: 'ناصر', familyName: 'الدوسري', nationality: 'saudi', identity: '1050505050', mobile: '0500000005', fileNum: 'F005' },
        { id: 6, name: 'عمر يوسف سعد المطيري', firstName: 'عمر', fatherName: 'يوسف', grandName: 'سعد', familyName: 'المطيري', nationality: 'saudi', identity: '1060606060', mobile: '0500000006', fileNum: 'F006' },
        { id: 7, name: 'ليلى محمود أحمد الحربي', firstName: 'ليلى', fatherName: 'محمود', grandName: 'أحمد', familyName: 'الحربي', nationality: 'non_saudi', identity: '2070707070', mobile: '0500000007', fileNum: 'F007' },
        { id: 8, name: 'سعيد حسين فيصل القحطاني', firstName: 'سعيد', fatherName: 'حسين', grandName: 'فيصل', familyName: 'القحطاني', nationality: 'saudi', identity: '1080808080', mobile: '0500000008', fileNum: 'F008' },
        { id: 9, name: 'منى عبدالرحمن خالد الدوسري', firstName: 'منى', fatherName: 'عبدالرحمن', grandName: 'خالد', familyName: 'الدوسري', nationality: 'saudi', identity: '1090909090', mobile: '0500000009', fileNum: 'F009' },
        { id: 10, name: 'عبدالله سلطان ماجد العنزي', firstName: 'عبدالله', fatherName: 'سلطان', grandName: 'ماجد', familyName: 'العنزي', nationality: 'gulf', identity: '1101010101', mobile: '0500000010', fileNum: 'F010' }
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
        { id: 1, number: '10001001', balance: 500, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'أحمد محمد علي الغامدي', identity: '1010101010' },
        { id: 2, number: '10001002', balance: 350, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'سارة عبدالله عمر الشهري', identity: '1020202020' },
        { id: 3, number: '10001003', balance: 0, status: 'موقوف', wallet: 'السلة الغذائية', beneficiary: 'فاطمة حسن سعيد القحطاني', identity: '1030303030' },
        { id: 4, number: '20002001', balance: 1000, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'خالد عبدالعزيز فهد العنزي', identity: '1040404040' },
        { id: 5, number: '20002002', balance: 800, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'نورة صالح ناصر الدوسري', identity: '1050505050' },
        { id: 6, number: '30003001', balance: 2500, status: 'نشط', wallet: 'الأجهزة الكهربائية', beneficiary: 'عمر يوسف سعد المطيري', identity: '1060606060' },
        { id: 7, number: '10001004', balance: 450, status: 'نشط', wallet: 'السلة الغذائية', beneficiary: 'ليلى محمود أحمد الحربي', identity: '2070707070' },
        { id: 8, number: '20002003', balance: 600, status: 'نشط', wallet: 'كسوة الشتاء', beneficiary: 'سعيد حسين فيصل القحطاني', identity: '1080808080' }
    ];

    const supplyOrders = [
        { id: '100201', item: 'توريد سلال غذائية (أرز، سكر، زيت)', partner: 'أسواق العثيم', cost: 15000, date: '2023-10-01', status: 'Completed' },
        { id: '100202', item: 'توريد بطانيات شتوية', partner: 'سنتربوينت', cost: 8000, date: '2023-10-05', status: 'Pending' },
        { id: '100203', item: 'توريد أجهزة تكييف', partner: 'إكسترا', cost: 25000, date: '2023-10-10', status: 'Pending' },
        { id: '100204', item: 'صيانة مستودع الجمعية', partner: 'خدمات إلكترونية', cost: 4500, date: '2023-10-12', status: 'Rejected', rejectionReason: 'السعر مرتفع جداً مقارنة بالسوق' },
        { id: '100205', item: 'توريد ملابس أطفال', partner: 'ماكس', cost: 12000, date: '2023-10-15', status: 'Accepted' },
        { id: '100206', item: 'كوبونات شرائية', partner: 'الدانوب', cost: 50000, date: '2023-10-20', status: 'Withdrawn' }
    ];

    Storage.set('users', [
        { id: 1, name: 'مدير النظام', username: 'admin', password: '123', role: 'admin' },
        { id: 2, name: 'تاجر', username: 'merchant', password: '123', role: 'merchant', linkedEntity: 'أسواق العثيم' },
        { id: 3, name: 'أحمد محمد علي الغامدي', username: 'ben1', password: '123', role: 'beneficiary', linkedEntity: 'أحمد محمد علي الغامدي' },
        { id: 4, name: 'سارة عبدالله عمر الشهري', username: 'ben2', password: '123', role: 'beneficiary', linkedEntity: 'سارة عبدالله عمر الشهري' },
        { id: 5, name: 'خالد عبدالعزيز فهد العنزي', username: 'ben3', password: '123', role: 'beneficiary', linkedEntity: 'خالد عبدالعزيز فهد العنزي' }
    ]);
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
