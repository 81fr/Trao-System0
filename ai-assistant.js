/* ===========================
   TRAOF AI ASSISTANT - مساعد تراؤف الذكي
   Open-Source Local AI Assistant
   =========================== */

(function () {
    'use strict';

    // ===== Configuration =====
    const AI_CONFIG = {
        name: 'مساعد تراؤف',
        avatar: '🤖',
        welcomeMessages: {
            admin: 'مرحباً بك أيها المشرف! أنا مساعد تراؤف الذكي. يمكنني مساعدتك في إدارة النظام، تحليل البيانات، وإنشاء التقارير. كيف أستطيع مساعدتك؟',
            merchant: 'أهلاً بك! أنا مساعد تراؤف الذكي. يمكنني مساعدتك في متابعة مبيعاتك، إدارة طلبات الشراء، ومعرفة إحصائيات متجرك. كيف أقدر أساعدك؟',
            beneficiary: 'مرحباً! أنا مساعد تراؤف الذكي. يمكنني مساعدتك في معرفة رصيدك، تتبع مشترياتك، وإيجاد أقرب المتاجر. كيف أقدر أساعدك؟'
        },
        quickActions: {
            admin: [
                { label: '📊 إحصائيات النظام', query: 'إحصائيات النظام' },
                { label: '💳 عدد البطاقات', query: 'كم عدد البطاقات' },
                { label: '🏪 قائمة المتاجر', query: 'المتاجر المسجلة' },
                { label: '📈 تقرير سريع', query: 'تقرير سريع' },
                { label: '⚠️ تنبيهات', query: 'تنبيهات النظام' }
            ],
            merchant: [
                { label: '💰 مبيعاتي', query: 'مبيعاتي' },
                { label: '📦 الطلبات', query: 'طلبات الشراء' },
                { label: '🏆 وسامي', query: 'وسام المتجر' },
                { label: '📍 موقعي', query: 'موقع المتجر' }
            ],
            beneficiary: [
                { label: '💳 رصيدي', query: 'رصيدي' },
                { label: '🛒 مشترياتي', query: 'مشترياتي الأخيرة' },
                { label: '🏪 متاجر قريبة', query: 'متاجر قريبة' },
                { label: '📍 موقعي', query: 'موقعي' }
            ]
        }
    };

    // ===== Detect User Type =====
    function detectUserType() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('beneficiary')) return 'beneficiary';
        if (path.includes('merchant_home')) return 'merchant';
        return 'admin';
    }

    // ===== AI Engine =====
    const AIEngine = {
        getSystemStats: () => {
            const cards = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('cards') || [] : [];
            const merchants = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('merchants') || [] : [];
            const txns = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('transactions') || [] : [];
            const bens = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('beneficiaries') || [] : [];
            const wallets = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('wallets') || [] : [];
            const orders = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('orders') || [] : [];

            const totalBalance = cards.reduce((s, c) => s + (parseFloat(c.balance) || 0), 0);
            const totalTxAmount = txns.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
            const activeCards = cards.filter(c => c.status === 'active' || !c.status).length;
            const blockedCards = cards.filter(c => c.status === 'blocked').length;

            return { cards, merchants, txns, bens, wallets, orders, totalBalance, totalTxAmount, activeCards, blockedCards };
        },

        getUserCard: () => {
            if (typeof Auth === 'undefined' || !Auth.user) return null;
            const cards = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('cards') || [] : [];
            return cards.find(c => c.identity === Auth.user.linkedEntity || c.holder === Auth.user.linkedEntity || c.number === Auth.user.linkedEntity);
        },

        getMerchantData: () => {
            if (typeof Auth === 'undefined' || !Auth.user) return null;
            const merchants = (typeof Storage !== 'undefined' && Storage.get) ? Storage.get('merchants') || [] : [];
            const name = Auth.user.linkedEntity || Auth.user.name;
            return merchants.find(m => m.name === name);
        },

        processQuery: (query) => {
            const q = query.toLowerCase().trim();
            const userType = detectUserType();
            const stats = AIEngine.getSystemStats();

            // ===== ADMIN QUERIES =====
            if (userType === 'admin') {
                // System stats
                if (q.includes('إحصائيات') || q.includes('احصائيات') || q.includes('ملخص') || q.includes('نظرة عامة')) {
                    return `📊 **إحصائيات النظام الحالية:**\n\n` +
                        `💳 البطاقات: **${stats.cards.length}** (نشطة: ${stats.activeCards} | محظورة: ${stats.blockedCards})\n` +
                        `🏪 المتاجر: **${stats.merchants.length}**\n` +
                        `👥 المستفيدون: **${stats.bens.length}**\n` +
                        `💰 إجمالي الأرصدة: **${stats.totalBalance.toLocaleString()} ريال**\n` +
                        `📦 أوامر التوريد: **${stats.orders.length}**\n` +
                        `🔄 العمليات: **${stats.txns.length}** (إجمالي: ${stats.totalTxAmount.toLocaleString()} ريال)\n` +
                        `👛 المحافظ: **${stats.wallets.length}**`;
                }

                // Cards
                if (q.includes('بطاق') || q.includes('كرت') || q.includes('card')) {
                    if (q.includes('عدد') || q.includes('كم')) {
                        return `💳 إجمالي البطاقات: **${stats.cards.length}**\n✅ نشطة: **${stats.activeCards}**\n🚫 محظورة: **${stats.blockedCards}**\n💰 إجمالي الأرصدة: **${stats.totalBalance.toLocaleString()} ريال**`;
                    }
                    const topCards = stats.cards.sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 5);
                    if (topCards.length === 0) return '💳 لا توجد بطاقات مسجلة في النظام حالياً.';
                    let res = '💳 **أعلى 5 بطاقات رصيداً:**\n\n';
                    topCards.forEach((c, i) => { res += `${i + 1}. ${c.holder || 'غير معروف'} — **${(c.balance || 0).toLocaleString()} ريال** (${c.number})\n`; });
                    return res;
                }

                // Merchants
                if (q.includes('متجر') || q.includes('متاجر') || q.includes('تجار') || q.includes('merchant')) {
                    if (stats.merchants.length === 0) return '🏪 لا توجد متاجر مسجلة حالياً.';
                    let res = `🏪 **المتاجر المسجلة (${stats.merchants.length}):**\n\n`;
                    stats.merchants.forEach((m, i) => {
                        res += `${i + 1}. **${m.name}** — ${m.category || 'عام'} | ${m.location || 'غير محدد'}\n`;
                    });
                    return res;
                }

                // Transactions
                if (q.includes('عملي') || q.includes('معامل') || q.includes('transaction')) {
                    if (stats.txns.length === 0) return '📄 لا توجد عمليات مسجلة حالياً.';
                    const last5 = stats.txns.slice(-5).reverse();
                    let res = `🔄 **آخر ${last5.length} عمليات:**\n\n`;
                    last5.forEach((t, i) => {
                        res += `${i + 1}. ${t.merchant || '-'} — **${t.amount || 0} ريال** (${t.date || '-'})\n`;
                    });
                    res += `\n📊 إجمالي العمليات: **${stats.txns.length}** | المبلغ: **${stats.totalTxAmount.toLocaleString()} ريال**`;
                    return res;
                }

                // Report
                if (q.includes('تقرير') || q.includes('report')) {
                    return `📈 **تقرير سريع للنظام:**\n\n` +
                        `• عدد البطاقات: ${stats.cards.length}\n` +
                        `• عدد المتاجر: ${stats.merchants.length}\n` +
                        `• عدد المستفيدين: ${stats.bens.length}\n` +
                        `• إجمالي الأرصدة: ${stats.totalBalance.toLocaleString()} ريال\n` +
                        `• عدد العمليات: ${stats.txns.length}\n` +
                        `• إجمالي المبالغ المصروفة: ${stats.totalTxAmount.toLocaleString()} ريال\n` +
                        `• أوامر التوريد: ${stats.orders.length}\n\n` +
                        `💡 **توصيات:**\n` +
                        (stats.blockedCards > 0 ? `⚠️ يوجد ${stats.blockedCards} بطاقة محظورة تحتاج مراجعة\n` : '') +
                        (stats.cards.filter(c => (c.balance || 0) < 50).length > 0 ? `⚠️ ${stats.cards.filter(c => (c.balance || 0) < 50).length} بطاقة رصيدها أقل من 50 ريال\n` : '') +
                        `✅ النظام يعمل بشكل طبيعي`;
                }

                // Alerts
                if (q.includes('تنبيه') || q.includes('تحذير') || q.includes('alert')) {
                    let alerts = [];
                    const lowBalance = stats.cards.filter(c => (c.balance || 0) < 50);
                    if (lowBalance.length > 0) alerts.push(`💰 **${lowBalance.length}** بطاقة رصيدها أقل من 50 ريال`);
                    if (stats.blockedCards > 0) alerts.push(`🚫 **${stats.blockedCards}** بطاقة محظورة`);
                    const pendingOrders = stats.orders.filter(o => o.status === 'pending' || o.status === 'جديد');
                    if (pendingOrders.length > 0) alerts.push(`📦 **${pendingOrders.length}** أمر توريد معلق`);
                    if (alerts.length === 0) return '✅ لا توجد تنبيهات حالياً. النظام يعمل بشكل ممتاز!';
                    return '⚠️ **تنبيهات النظام:**\n\n' + alerts.join('\n');
                }

                // Beneficiaries
                if (q.includes('مستفيد') || q.includes('مستفيدين') || q.includes('beneficiar')) {
                    return `👥 **المستفيدون:**\n\nالعدد الإجمالي: **${stats.bens.length}**\n` +
                        (stats.bens.length > 0 ? stats.bens.slice(0, 5).map((b, i) => `${i + 1}. ${b.name} — ${b.identity || '-'}`).join('\n') : 'لا يوجد مستفيدون مسجلون');
                }

                // Wallets
                if (q.includes('محفظ') || q.includes('wallet')) {
                    if (stats.wallets.length === 0) return '👛 لا توجد محافظ.';
                    let res = `👛 **المحافظ (${stats.wallets.length}):**\n\n`;
                    stats.wallets.forEach((w, i) => {
                        res += `${i + 1}. **${w.name}** — ${(w.funds || 0).toLocaleString()} ريال (${w.category || 'عام'})\n`;
                    });
                    return res;
                }

                // Orders
                if (q.includes('توريد') || q.includes('order') || q.includes('أوامر')) {
                    if (stats.orders.length === 0) return '📦 لا توجد أوامر توريد.';
                    let res = `📦 **أوامر التوريد (${stats.orders.length}):**\n\n`;
                    stats.orders.slice(0, 5).forEach((o, i) => {
                        res += `${i + 1}. #${o.id || i} — ${o.description || '-'} | ${o.status || '-'} | ${(o.cost || 0).toLocaleString()} ريال\n`;
                    });
                    return res;
                }
            }

            // ===== MERCHANT QUERIES =====
            if (userType === 'merchant') {
                const merchant = AIEngine.getMerchantData();
                const txns = stats.txns.filter(t => t.merchant === (merchant ? merchant.name : ''));

                if (q.includes('مبيعات') || q.includes('عملي') || q.includes('sales')) {
                    const total = txns.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
                    return `💰 **إحصائيات مبيعاتك:**\n\n` +
                        `🔄 عدد العمليات: **${txns.length}**\n` +
                        `💵 إجمالي المبيعات: **${total.toLocaleString()} ريال**\n` +
                        `📊 متوسط العملية: **${txns.length > 0 ? (total / txns.length).toFixed(0) : 0} ريال**`;
                }

                if (q.includes('طلب') || q.includes('شراء') || q.includes('order')) {
                    const pending = (typeof Storage !== 'undefined' && Storage.get) ? (Storage.get('purchaseRequests') || []).filter(r => r.merchant === (merchant ? merchant.name : '')) : [];
                    if (pending.length === 0) return '📦 لا توجد طلبات شراء حالياً.';
                    let res = `📦 **طلبات الشراء (${pending.length}):**\n\n`;
                    pending.slice(0, 5).forEach((r, i) => {
                        res += `${i + 1}. مبلغ: **${r.amount || 0} ريال** — حالة: ${r.status || 'معلق'}\n`;
                    });
                    return res;
                }

                if (q.includes('وسام') || q.includes('تحفيز') || q.includes('badge')) {
                    const count = txns.length;
                    let badge = 'مبتدئ 🌱';
                    if (count >= 100) badge = 'ماسي 💎';
                    else if (count >= 50) badge = 'ذهبي 🥇';
                    else if (count >= 25) badge = 'فضي 🥈';
                    else if (count >= 10) badge = 'برونزي 🥉';
                    return `🏆 **وسام متجرك:** ${badge}\n📊 عدد العمليات: **${count}**\n\n` +
                        (count < 10 ? `💡 أكمل ${10 - count} عملية للحصول على الوسام البرونزي!` :
                            count < 25 ? `💡 أكمل ${25 - count} عملية للحصول على الوسام الفضي!` :
                                count < 50 ? `💡 أكمل ${50 - count} عملية للحصول على الوسام الذهبي!` :
                                    '🎉 أداء ممتاز! استمر في التميز!');
                }

                if (q.includes('موقع') || q.includes('location')) {
                    if (!merchant || !merchant.coords) return '📍 لم يتم تحديد موقع المتجر بعد. يمكنك تحديده من زر "تحديد موقع المتجر".';
                    return `📍 **موقع المتجر:**\nخط العرض: ${merchant.coords.lat}\nخط الطول: ${merchant.coords.lng}\n\n🗺️ [فتح في Google Maps](https://www.google.com/maps?q=${merchant.coords.lat},${merchant.coords.lng})`;
                }
            }

            // ===== BENEFICIARY QUERIES =====
            if (userType === 'beneficiary') {
                const card = AIEngine.getUserCard();

                if (q.includes('رصيد') || q.includes('balance') || q.includes('كم عند')) {
                    if (!card) return '💳 لم يتم العثور على بطاقتك. تأكد من ربط حسابك بالبطاقة.';
                    return `💳 **بيانات بطاقتك:**\n\n` +
                        `👤 الاسم: **${card.holder || '-'}**\n` +
                        `🔢 الرقم: **${card.number}**\n` +
                        `💰 الرصيد: **${(card.balance || 0).toLocaleString()} ريال**\n` +
                        `📊 الحالة: ${card.status === 'blocked' ? '🚫 محظورة' : '✅ نشطة'}\n` +
                        `👛 المحفظة: ${card.wallet || '-'}`;
                }

                if (q.includes('مشتري') || q.includes('عملي') || q.includes('purchase')) {
                    if (!card) return '💳 لم يتم العثور على بطاقتك.';
                    const myTxns = stats.txns.filter(t => t.card === card.number);
                    if (myTxns.length === 0) return '🛒 لا توجد مشتريات سابقة.';
                    const total = myTxns.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
                    let res = `🛒 **مشترياتك الأخيرة:**\n\n`;
                    myTxns.slice(-5).reverse().forEach((t, i) => {
                        res += `${i + 1}. ${t.merchant || '-'} — **${t.amount || 0} ريال** (${t.date || '-'})\n`;
                    });
                    res += `\n📊 إجمالي المشتريات: **${total.toLocaleString()} ريال** (${myTxns.length} عملية)`;
                    return res;
                }

                if (q.includes('متجر') || q.includes('متاجر') || q.includes('قريب')) {
                    if (stats.merchants.length === 0) return '🏪 لا توجد متاجر متاحة حالياً.';
                    let res = `🏪 **المتاجر المتاحة (${stats.merchants.length}):**\n\n`;
                    stats.merchants.forEach((m, i) => {
                        res += `${i + 1}. **${m.name}** — ${m.category || 'عام'}`;
                        if (m.coords) res += ` 📍`;
                        res += '\n';
                    });
                    return res;
                }

                if (q.includes('موقع') || q.includes('location')) {
                    if (!card || !card.coords) return '📍 لم يتم تحديد موقعك بعد. يمكنك تحديده من زر "تحديد الموقع".';
                    return `📍 **موقعك المحفوظ:**\nخط العرض: ${card.coords.lat}\nخط الطول: ${card.coords.lng}\n\n🗺️ [فتح في Google Maps](https://www.google.com/maps?q=${card.coords.lat},${card.coords.lng})`;
                }
            }

            // ===== GENERAL QUERIES =====
            if (q.includes('مرحب') || q.includes('أهل') || q.includes('سلام') || q.includes('هلا')) {
                return 'أهلاً وسهلاً! 👋 كيف أقدر أساعدك اليوم؟';
            }

            if (q.includes('شكر') || q.includes('مشكور') || q.includes('thanks')) {
                return 'العفو! 😊 سعدت بمساعدتك. هل تحتاج شي ثاني؟';
            }

            if (q.includes('مساعد') || q.includes('help') || q.includes('ايش تسوي') || q.includes('وش تقدر')) {
                const features = {
                    admin: '• إحصائيات النظام الشاملة\n• تقارير سريعة\n• معلومات البطاقات والمتاجر\n• تنبيهات النظام\n• معلومات المستفيدين والمحافظ',
                    merchant: '• إحصائيات مبيعاتك\n• متابعة طلبات الشراء\n• معرفة وسامك ومستواك\n• معلومات موقع المتجر',
                    beneficiary: '• رصيد بطاقتك\n• مشترياتك الأخيرة\n• المتاجر المتاحة\n• معلومات موقعك'
                };
                return `🤖 **أقدر أساعدك في:**\n\n${features[userType]}\n\n💡 **جرب تسألني أي سؤال!**`;
            }

            if (q.includes('وقت') || q.includes('ساعة') || q.includes('تاريخ') || q.includes('time')) {
                const now = new Date();
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                return `🕐 الوقت الحالي: **${now.toLocaleTimeString('ar-SA')}**\n📅 التاريخ: **${now.toLocaleDateString('ar-SA', options)}**`;
            }

            // Default
            return '🤔 ما قدرت أفهم سؤالك بالضبط. جرب تسأل عن:\n\n' +
                (userType === 'admin' ? '• إحصائيات النظام\n• البطاقات\n• المتاجر\n• التقارير\n• التنبيهات' :
                    userType === 'merchant' ? '• مبيعاتي\n• طلبات الشراء\n• وسام المتجر\n• موقعي' :
                        '• رصيدي\n• مشترياتي\n• المتاجر\n• موقعي');
        }
    };

    // ===== Chat Widget UI =====
    function createWidget() {
        const userType = detectUserType();

        // Main container
        const container = document.createElement('div');
        container.id = 'aiAssistantContainer';
        container.innerHTML = `
        <!-- Floating Button -->
        <button id="aiAssistantBtn" title="مساعد تراؤف الذكي">
            <div class="ai-btn-pulse"></div>
            <span class="ai-btn-icon">🤖</span>
        </button>

        <!-- Chat Window -->
        <div id="aiChatWindow">
            <div class="ai-chat-header">
                <div class="ai-chat-header-info">
                    <div class="ai-chat-avatar">🤖</div>
                    <div>
                        <div class="ai-chat-name">مساعد تراؤف</div>
                        <div class="ai-chat-status"><span class="ai-status-dot"></span> متصل الآن</div>
                    </div>
                </div>
                <div class="ai-chat-header-actions">
                    <button onclick="TraofAI.clearChat()" title="مسح المحادثة"><i class="fas fa-trash"></i></button>
                    <button onclick="TraofAI.toggle()" title="إغلاق"><i class="fas fa-times"></i></button>
                </div>
            </div>

            <div class="ai-chat-messages" id="aiChatMessages">
                <!-- Messages go here -->
            </div>

            <div class="ai-quick-actions" id="aiQuickActions">
                <!-- Quick action buttons --></div>

            <div class="ai-chat-input-area">
                <input type="text" id="aiChatInput" placeholder="اكتب سؤالك هنا..." autocomplete="off">
                <button id="aiSendBtn" onclick="TraofAI.send()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>`;

        document.body.appendChild(container);

        // Inject CSS
        const style = document.createElement('style');
        style.textContent = `
        #aiAssistantContainer { position: fixed; bottom: 24px; left: 24px; z-index: 9998; font-family: 'Tajawal', sans-serif; direction: rtl; }

        #aiAssistantBtn {
            width: 62px; height: 62px; border-radius: 50%; border: none; cursor: pointer;
            background: linear-gradient(135deg, #00A59B, #8CC240);
            box-shadow: 0 8px 25px rgba(0, 165, 155, 0.4);
            display: flex; align-items: center; justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative; overflow: visible;
        }
        #aiAssistantBtn:hover { transform: scale(1.1); box-shadow: 0 12px 35px rgba(0, 165, 155, 0.5); }
        #aiAssistantBtn .ai-btn-icon { font-size: 1.7rem; z-index: 1; }
        .ai-btn-pulse {
            position: absolute; inset: -4px; border-radius: 50%;
            border: 3px solid #00A59B; animation: aiPulse 2s ease-in-out infinite; opacity: 0.6;
        }
        @keyframes aiPulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 0; } }

        #aiChatWindow {
            display: none; position: fixed; bottom: 96px; left: 24px;
            width: 400px; max-width: calc(100vw - 48px); height: 550px; max-height: calc(100vh - 120px);
            background: var(--card, #fff); border-radius: 24px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05);
            flex-direction: column; overflow: hidden;
            animation: aiSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #aiChatWindow.open { display: flex; }
        @keyframes aiSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .ai-chat-header {
            background: linear-gradient(135deg, #00A59B, #069e8e);
            padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;
            color: white; flex-shrink: 0;
        }
        .ai-chat-header-info { display: flex; align-items: center; gap: 12px; }
        .ai-chat-avatar { width: 42px; height: 42px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
        .ai-chat-name { font-weight: 700; font-size: 1.05rem; }
        .ai-chat-status { font-size: 0.78rem; opacity: 0.9; display: flex; align-items: center; gap: 5px; }
        .ai-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; display: inline-block; animation: aiDotPulse 2s infinite; }
        @keyframes aiDotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .ai-chat-header-actions { display: flex; gap: 6px; }
        .ai-chat-header-actions button { background: rgba(255,255,255,0.15); border: none; color: white; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
        .ai-chat-header-actions button:hover { background: rgba(255,255,255,0.3); }

        .ai-chat-messages {
            flex: 1; overflow-y: auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 12px;
            background: var(--bg, #f7f9fb);
        }
        .ai-chat-messages::-webkit-scrollbar { width: 5px; }
        .ai-chat-messages::-webkit-scrollbar-thumb { background: #c0c8d2; border-radius: 10px; }

        .ai-msg {
            max-width: 85%; padding: 12px 16px; border-radius: 18px;
            font-size: 0.92rem; line-height: 1.7; word-wrap: break-word; white-space: pre-line;
            animation: aiMsgIn 0.3s ease-out;
        }
        @keyframes aiMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .ai-msg.bot {
            background: var(--card, #fff); color: var(--text-primary, #333);
            border-bottom-right-radius: 6px; align-self: flex-start;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid var(--border, #eee);
        }
        .ai-msg.user {
            background: linear-gradient(135deg, #00A59B, #069e8e); color: white;
            border-bottom-left-radius: 6px; align-self: flex-end;
        }
        .ai-msg.bot strong { color: var(--brand-teal, #00A59B); }

        .ai-msg-time { font-size: 0.7rem; color: var(--muted, #888); margin-top: 4px; text-align: left; }
        .ai-msg.user .ai-msg-time { color: rgba(255,255,255,0.7); text-align: right; }

        .ai-typing { display: flex; gap: 5px; padding: 12px 16px; align-self: flex-start; }
        .ai-typing span { width: 8px; height: 8px; border-radius: 50%; background: #00A59B; display: inline-block; animation: aiTypingDot 1.4s infinite; }
        .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes aiTypingDot { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }

        .ai-quick-actions {
            padding: 8px 16px; display: flex; gap: 8px; flex-wrap: wrap;
            border-top: 1px solid var(--border, #eee); flex-shrink: 0; background: var(--card, #fff);
        }
        .ai-quick-btn {
            padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; border: 1px solid var(--border, #ddd);
            background: var(--bg, #f7f9fb); color: var(--text-primary, #333); cursor: pointer;
            transition: 0.2s; font-family: inherit; white-space: nowrap;
        }
        .ai-quick-btn:hover { border-color: #00A59B; color: #00A59B; background: rgba(0,165,155,0.05); }

        .ai-chat-input-area {
            padding: 14px 16px; display: flex; gap: 10px; align-items: center;
            border-top: 1px solid var(--border, #eee); flex-shrink: 0; background: var(--card, #fff);
        }
        #aiChatInput {
            flex: 1; border: 2px solid var(--border, #e0e5ec); border-radius: 14px;
            padding: 12px 16px; font-size: 0.95rem; outline: none; font-family: inherit;
            background: var(--bg, #f7f9fb); color: var(--text-primary, #333); transition: 0.2s;
        }
        #aiChatInput:focus { border-color: #00A59B; }
        #aiSendBtn {
            width: 44px; height: 44px; border-radius: 14px; border: none;
            background: linear-gradient(135deg, #00A59B, #8CC240); color: white;
            cursor: pointer; font-size: 1rem; transition: 0.2s; display: flex; align-items: center; justify-content: center;
        }
        #aiSendBtn:hover { transform: scale(1.05); }

        @media (max-width: 500px) {
            #aiChatWindow { width: calc(100vw - 16px); left: 8px; bottom: 80px; height: calc(100vh - 100px); border-radius: 20px; }
            #aiAssistantContainer { bottom: 16px; left: 16px; }
        }
        `;
        document.head.appendChild(style);
    }

    // ===== Public API =====
    window.TraofAI = {
        isOpen: false,
        messages: [],

        init: () => {
            createWidget();
            const userType = detectUserType();

            // Add welcome message
            TraofAI.addBotMessage(AI_CONFIG.welcomeMessages[userType]);

            // Render quick actions
            const qActions = AI_CONFIG.quickActions[userType];
            const qContainer = document.getElementById('aiQuickActions');
            if (qContainer && qActions) {
                qContainer.innerHTML = qActions.map(a =>
                    `<button class="ai-quick-btn" onclick="TraofAI.ask('${a.query}')">${a.label}</button>`
                ).join('');
            }

            // Button click
            document.getElementById('aiAssistantBtn').addEventListener('click', TraofAI.toggle);

            // Enter key
            document.getElementById('aiChatInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') TraofAI.send();
            });
        },

        toggle: () => {
            const win = document.getElementById('aiChatWindow');
            if (!win) return;
            TraofAI.isOpen = !TraofAI.isOpen;
            win.classList.toggle('open', TraofAI.isOpen);
            if (TraofAI.isOpen) {
                setTimeout(() => document.getElementById('aiChatInput')?.focus(), 300);
            }
        },

        send: () => {
            const input = document.getElementById('aiChatInput');
            if (!input || !input.value.trim()) return;
            const query = input.value.trim();
            input.value = '';
            TraofAI.ask(query);
        },

        ask: (query) => {
            TraofAI.addUserMessage(query);

            // Show typing indicator
            const messages = document.getElementById('aiChatMessages');
            const typing = document.createElement('div');
            typing.className = 'ai-typing';
            typing.id = 'aiTypingIndicator';
            typing.innerHTML = '<span></span><span></span><span></span>';
            messages.appendChild(typing);
            messages.scrollTop = messages.scrollHeight;

            // Simulate AI thinking
            setTimeout(() => {
                typing.remove();
                const response = AIEngine.processQuery(query);
                TraofAI.addBotMessage(response);
            }, 600 + Math.random() * 800);
        },

        addUserMessage: (text) => {
            const messages = document.getElementById('aiChatMessages');
            if (!messages) return;
            const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            const div = document.createElement('div');
            div.className = 'ai-msg user';
            div.innerHTML = `${text}<div class="ai-msg-time">${time}</div>`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            TraofAI.messages.push({ role: 'user', text, time });
        },

        addBotMessage: (text) => {
            const messages = document.getElementById('aiChatMessages');
            if (!messages) return;
            const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            // Format markdown-like bold
            let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Format links
            formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#00A59B;">$1</a>');
            const div = document.createElement('div');
            div.className = 'ai-msg bot';
            div.innerHTML = `${formatted}<div class="ai-msg-time">🤖 ${time}</div>`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            TraofAI.messages.push({ role: 'bot', text, time });
        },

        clearChat: () => {
            const messages = document.getElementById('aiChatMessages');
            if (!messages) return;
            messages.innerHTML = '';
            TraofAI.messages = [];
            const userType = detectUserType();
            TraofAI.addBotMessage(AI_CONFIG.welcomeMessages[userType]);
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(TraofAI.init, 800));
    } else {
        setTimeout(TraofAI.init, 800);
    }
})();
