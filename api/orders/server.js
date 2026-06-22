// Cwd: d:/ProjectApp/Kirin Day Web/api/orders/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const AdmZip = require('adm-zip');
require('dotenv').config();

const { supabase } = require('./supabase');
const { sendEmail, buildHtmlEmail } = require('./email');
const buyConfig = require('../../config/buyConfig.json');

const app = express();

app.use(cors());
app.use(express.json());

// Set up Multer for memory upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: buyConfig.paymentProofMaxSizeMB * 1024 * 1024 // e.g., 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format berkas tidak didukung. Harap unggah JPG, PNG, WEBP, atau PDF.'));
    }
  }
});

const getAppUrl = (req) => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  return `${protocol}://${req.headers.host || 'kirinday.id'}`;
};

// Admin Authorization Middleware
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer /, '');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: "Konfigurasi server salah: ADMIN_PASSWORD belum diatur di env." });
  }

  if (token === adminPassword) {
    next();
  } else {
    res.status(401).json({ error: "Akses ditolak. Kata sandi admin salah." });
  }
}

// Generate Order ID (CK-YYYYMMDD-XXXX)
function generateOrderId(prefix) {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${dateStr}-${rand}`;
}

// Format currency helper
function formatRp(val) {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

// Route: Get config (to avoid frontend import issues in some dev setups)
app.get('/api/orders/config', (req, res) => {
  res.json(buyConfig);
});

// Route: Get order status
app.get('/api/orders/status', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Order ID diperlukan." });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    res.json(data);
  } catch (err) {
    console.error("Error checking status:", err);
    res.status(500).json({ error: "Terjadi kesalahan internal." });
  }
});

// Route: Submit order
app.post('/api/orders', upload.single('paymentProof'), async (req, res) => {
  try {
    const {
      buyer_name,
      buyer_email,
      buyer_whatsapp,
      buyer_instagram,
      redeem_method,
      shipping_address,
      cheki_items,
      merch_items,
      notes,
      payment_method,
      event_name
    } = req.body;

    const file = req.file;

    // 1. Basic Field Presence Validations
    if (!buyer_name || !buyer_email || !buyer_whatsapp || !buyer_instagram || !redeem_method || !payment_method || !event_name) {
      return res.status(400).json({ error: "Semua kolom wajib diisi (termasuk Event)." });
    }

    if (!file) {
      return res.status(400).json({ error: "Bukti pembayaran wajib diunggah." });
    }

    // 2. Format Validations
    // Full Name Min 3 chars
    if (buyer_name.trim().length < 3) {
      return res.status(400).json({ error: "Nama lengkap minimal 3 karakter." });
    }

    // Email containing @domain.tld
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyer_email)) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }

    // WhatsApp normalize and validate
    const waClean = buyer_whatsapp.trim();
    const waRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
    if (!waRegex.test(waClean)) {
      return res.status(400).json({ error: "Format nomor WA tidak valid (contoh: 08123456789)." });
    }
    // Normalize to +62 format
    let waNormalized = waClean;
    if (waClean.startsWith('08')) {
      waNormalized = '+628' + waClean.substring(2);
    } else if (waClean.startsWith('628')) {
      waNormalized = '+' + waClean;
    } else if (waClean.startsWith('8')) {
      waNormalized = '+628' + waClean.substring(1);
    }

    // Instagram auto-strip leading @ and validate (reject spaces/special chars except _ and .)
    let igClean = buyer_instagram.trim().replace(/^@/, '');
    const igRegex = /^[a-zA-Z0-9_.]+$/;
    if (!igRegex.test(igClean) || igClean.includes(' ')) {
      return res.status(400).json({ error: "Username Instagram tidak valid." });
    }

    // Parse items
    let chekiList = [];
    let merchList = [];
    try {
      chekiList = typeof cheki_items === 'string' ? JSON.parse(cheki_items) : cheki_items;
      merchList = typeof merch_items === 'string' ? JSON.parse(merch_items) : merch_items;
    } catch (e) {
      return res.status(400).json({ error: "Format data barang belanjaan tidak valid." });
    }

    // 3. Cart Limits
    const totalChekiCount = chekiList.reduce((sum, item) => sum + item.quantity, 0);
    const totalMerchCount = merchList.reduce((sum, item) => sum + item.quantity, 0);

    if (totalChekiCount === 0 && totalMerchCount === 0) {
      return res.status(400).json({ error: "Keranjang belanja kosong. Harap pilih minimal 1 item." });
    }

    // Fetch shop settings for PO status and event quotas
    const { data: settingsData } = await supabase
      .from('shop_settings')
      .select('*');

    const settings = {};
    if (settingsData) {
      settingsData.forEach(item => {
        settings[item.key] = item.value;
      });
    }

    const chekiPoOpen = settings.cheki_po_open !== false;
    const merchPoOpen = settings.merch_po_open !== false;

    if (totalChekiCount > 0 && !chekiPoOpen) {
      return res.status(400).json({ error: "Pre-order Cheki saat ini sedang ditutup." });
    }

    if (totalMerchCount > 0 && !merchPoOpen) {
      return res.status(400).json({ error: "Penjualan Merchandise saat ini sedang ditutup." });
    }

    // Check event-level cheki quota
    if (totalChekiCount > 0 && event_name) {
      const eventQuotas = settings.event_cheki_quotas || {};
      const quota = eventQuotas[event_name];
      if (quota !== undefined && quota !== null && quota !== "" && Number(quota) > 0) {
        const { data: eventOrders } = await supabase
          .from('orders')
          .select('cheki_items')
          .eq('event_name', event_name)
          .neq('status', 'rejected');

        let currentChekiCount = 0;
        if (eventOrders) {
          eventOrders.forEach(o => {
            let items = [];
            try {
              items = typeof o.cheki_items === 'string' ? JSON.parse(o.cheki_items) : o.cheki_items;
            } catch(e) {}
            if (Array.isArray(items)) {
              items.forEach(item => {
                currentChekiCount += (item.quantity || 0);
              });
            }
          });
        }

        if (currentChekiCount + totalChekiCount > Number(quota)) {
          const remaining = Math.max(0, Number(quota) - currentChekiCount);
          return res.status(400).json({ 
            error: `Kuota pre-order Cheki untuk event ini hampir penuh. Tersisa ${remaining} slot cheki.` 
          });
        }
      }
      // Check member-level cheki quota
      const eventMemberQuotas = settings.event_member_cheki_quotas || {};
      const memberQuotas = eventMemberQuotas[event_name] || {};
      
      const memberQuotasDefined = Object.keys(memberQuotas).length > 0;
      if (memberQuotasDefined) {
        const { data: eventOrders } = await supabase
          .from('orders')
          .select('cheki_items')
          .eq('event_name', event_name)
          .neq('status', 'rejected');

        const memberOrdered = {};
        if (eventOrders) {
          eventOrders.forEach(o => {
            let items = [];
            try {
              items = typeof o.cheki_items === 'string' ? JSON.parse(o.cheki_items) : o.cheki_items;
            } catch(e) {}
            if (Array.isArray(items)) {
              items.forEach(item => {
                const mid = item.member_id || item.id;
                if (mid) {
                  memberOrdered[mid] = (memberOrdered[mid] || 0) + (item.quantity || 0);
                }
              });
            }
          });
        }

        // Validate each item in the submitted chekiList
        for (const item of chekiList) {
          const mid = item.member_id || item.id;
          if (mid && memberQuotas[mid] !== undefined && memberQuotas[mid] !== null && memberQuotas[mid] !== "") {
            const quota = Number(memberQuotas[mid]);
            if (quota > 0) {
              const currentCount = memberOrdered[mid] || 0;
              if (currentCount + item.quantity > quota) {
                const remaining = Math.max(0, quota - currentCount);
                return res.status(400).json({ 
                  error: `Stok Cheki untuk member ${item.member_name} tidak mencukupi. Tersisa ${remaining} lembar.` 
                });
              }
            }
          }
        }
      }
    }



    // 4. Redeem Method validation
    if (redeem_method === 'ship') {
      if (!shipping_address || shipping_address.trim().length < 20) {
        return res.status(400).json({ error: "Alamat pengiriman lengkap wajib diisi minimal 20 karakter." });
      }
    }

    // 5. Notes Validation
    if (notes && notes.length > 500) {
      return res.status(400).json({ error: "Catatan tambahan maksimal 500 karakter." });
    }

    // 6. Anti-Abuse Server-side Deduplication
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('created_at')
      .eq('buyer_email', buyer_email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentOrders && recentOrders.length > 0) {
      const lastOrderTime = new Date(recentOrders[0].created_at).getTime();
      if (Date.now() - lastOrderTime < 15000) { // 15 seconds cooldown
        return res.status(429).json({ error: "Mohon tunggu beberapa saat sebelum mengirim pesanan kembali." });
      }
    }

    // Calculate Grand Total to verify
    let calculatedTotal = 0;
    chekiList.forEach(item => {
      calculatedTotal += item.quantity * item.unit_price;
    });
    merchList.forEach(item => {
      calculatedTotal += item.quantity * item.unit_price;
    });

    // Generate Order ID
    const orderId = generateOrderId(buyConfig.orderIdPrefix);

    // 7. Upload to Supabase Storage
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'payment-proofs';
    const ext = path.extname(file.originalname) || '.jpg';
    const storagePath = `proofs/${orderId}-${Date.now()}${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return res.status(500).json({ error: "Gagal mengunggah bukti pembayaran ke server." });
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    const paymentProofUrl = publicUrlData.publicUrl;

    // 8. Save Order to Database
    const { error: dbError } = await supabase
      .from('orders')
      .insert([{
        order_id: orderId,
        buyer_name,
        buyer_email,
        buyer_whatsapp: waNormalized,
        buyer_instagram: igClean,
        redeem_method,
        shipping_address: redeem_method === 'ship' ? shipping_address : null,
        cheki_items: chekiList,
        merch_items: merchList,
        grand_total: calculatedTotal,
        notes: notes || null,
        payment_method,
        payment_proof_url: paymentProofUrl,
        status: 'pending',
        admin_notes: null,
        event_name: event_name || null
      }]);

    if (dbError) {
      console.error("Database insert error:", dbError);
      return res.status(500).json({ error: "Gagal menyimpan data pesanan." });
    }

    // 9. Send Confirmation Email to Buyer
    const chekiRows = chekiList.map(item => `
      <tr>
        <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155;">
          <strong>Cheki ${item.member_name}</strong><br>
          <span style="font-size: 12px; color: #64748b;">Tipe: ${item.type}</span>
        </td>
        <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155;">x${item.quantity}</td>
        <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #334155;">${formatRp(item.subtotal)}</td>
      </tr>
    `).join('');

    const merchRows = merchList.map(item => `
      <tr>
        <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155;">
          <strong>${item.merch_name}</strong>
        </td>
        <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155;">x${item.quantity}</td>
        <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #334155;">${formatRp(item.subtotal)}</td>
      </tr>
    `).join('');

    const detailsHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 5px;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #7c3aed; padding-bottom: 5px;">Rincian Belanja</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; font-size: 12px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Item</th>
              <th style="text-align: center; font-size: 12px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; width: 60px;">Jumlah</th>
              <th style="text-align: right; font-size: 12px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; width: 100px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${chekiRows}
            ${merchRows}
          </tbody>
        </table>
        
        <div style="margin-top: 15px; border-top: 2px dashed #e2e8f0; padding-top: 10px; font-size: 14px; color: #334155;">
          <table style="width: 100%;">
            ${event_name ? `<tr><td style="padding: 3px 0; color: #64748b;">Event:</td><td style="padding: 3px 0; text-align: right; font-weight: 500; color: #0f172a;">${event_name}</td></tr>` : ''}
            <tr><td style="padding: 3px 0; color: #64748b;">Metode Pengambilan:</td><td style="padding: 3px 0; text-align: right; font-weight: 500; color: #0f172a;">${redeem_method === 'event' ? 'Ambil di Event' : `Kirim ke Alamat (${shipping_address})`}</td></tr>
            <tr><td style="padding: 3px 0; color: #64748b;">Metode Pembayaran:</td><td style="padding: 3px 0; text-align: right; font-weight: 500; color: #0f172a;">${payment_method.toUpperCase()}</td></tr>
            <tr>
              <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #0f172a;">Total Pembayaran:</td>
              <td style="padding: 10px 0 0 0; text-align: right; font-size: 16px; font-weight: bold; color: #7c3aed;">${formatRp(calculatedTotal)}</td>
            </tr>
          </table>
        </div>
      </div>
    `;

    const mainText = `Terima kasih telah melakukan pemesanan di Kirin Day Shop!<br><br>` +
      `Pesanan Anda dengan ID <strong>${orderId}</strong> telah berhasil kami terima.<br><br>` +
      `Pesanan Anda saat ini berstatus <strong>Menunggu Verifikasi</strong> dan akan kami verifikasi dalam waktu maksimal ${buyConfig.verificationSLAHours} jam.<br><br>` +
      `Anda dapat memantau status pesanan Anda secara langsung dengan menekan tombol di bawah ini.`;

    const emailHtml = buildHtmlEmail({
      title: "Pesanan Diterima",
      subtitle: `Order ID: #${orderId}`,
      buyerName: buyer_name,
      mainText: mainText,
      detailsHtml: detailsHtml,
      ctaUrl: `${getAppUrl(req)}/buy/status?id=${orderId}`,
      ctaText: "Cek Status Pesanan"
    });

    // 9. Send Confirmation Email to Buyer (Background Task)
    sendEmail({
      to: buyer_email,
      subject: `[Order #${orderId}] Pesananmu sudah kami terima!`,
      html: emailHtml
    }).catch(err => {
      console.error(`Gagal mengirim email konfirmasi latar belakang untuk order ${orderId}:`, err);
    });

    // Success response
    res.json({
      success: true,
      orderId,
      message: "Pesanan berhasil dikirim."
    });

  } catch (err) {
    console.error("Unexpected submission error:", err);
    res.status(500).json({ error: "Terjadi kesalahan internal sistem." });
  }
});

// ================= ADMIN ENDPOINTS =================

// Route: Create On-The-Spot (OTS) Order (Admin)
app.post('/api/orders/ots', adminAuth, async (req, res) => {
  try {
    const {
      buyer_name,
      buyer_email,
      buyer_whatsapp,
      buyer_instagram,
      cheki_items,
      merch_items,
      payment_method,
      notes,
      event_name,
      is_redeemed,
      bypass_quotas
    } = req.body;

    // 1. Basic Validations
    if (!buyer_name || !payment_method || !event_name) {
      return res.status(400).json({ error: "Nama pembeli, metode pembayaran, dan event wajib diisi." });
    }

    if (buyer_name.trim().length < 3) {
      return res.status(400).json({ error: "Nama lengkap minimal 3 karakter." });
    }

    if (payment_method !== 'Cash' && payment_method !== 'QRIS') {
      return res.status(400).json({ error: "Metode pembayaran harus berupa Cash atau QRIS." });
    }

    // WhatsApp normalize and validate if provided
    let waNormalized = '';
    if (buyer_whatsapp && buyer_whatsapp.trim().length > 0) {
      const waClean = buyer_whatsapp.trim();
      const waRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
      if (!waRegex.test(waClean)) {
        return res.status(400).json({ error: "Format nomor WA tidak valid (contoh: 08123456789)." });
      }
      if (waClean.startsWith('08')) {
        waNormalized = '+628' + waClean.substring(2);
      } else if (waClean.startsWith('628')) {
        waNormalized = '+' + waClean;
      } else if (waClean.startsWith('8')) {
        waNormalized = '+628' + waClean.substring(1);
      } else {
        waNormalized = waClean;
      }
    }

    // Instagram auto-strip leading @ and validate if provided
    let igClean = '';
    if (buyer_instagram && buyer_instagram.trim().length > 0) {
      igClean = buyer_instagram.trim().replace(/^@/, '');
      const igRegex = /^[a-zA-Z0-9_.]+$/;
      if (!igRegex.test(igClean) || igClean.includes(' ')) {
        return res.status(400).json({ error: "Username Instagram tidak valid." });
      }
    }

    // Validate email if provided
    let isEmailValid = false;
    if (buyer_email && buyer_email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(buyer_email.trim())) {
        return res.status(400).json({ error: "Format email tidak valid." });
      }
      // Check if it's not a dummy/system email
      const lowerEmail = buyer_email.trim().toLowerCase();
      if (!lowerEmail.endsWith('@example.com') && lowerEmail !== 'ots@kirinday.id') {
        isEmailValid = true;
      }
    }

    // Parse items
    let chekiList = [];
    let merchList = [];
    try {
      chekiList = typeof cheki_items === 'string' ? JSON.parse(cheki_items) : (cheki_items || []);
      merchList = typeof merch_items === 'string' ? JSON.parse(merch_items) : (merch_items || []);
    } catch (e) {
      return res.status(400).json({ error: "Format data barang belanjaan tidak valid." });
    }

    const totalChekiCount = chekiList.reduce((sum, item) => sum + item.quantity, 0);
    const totalMerchCount = merchList.reduce((sum, item) => sum + item.quantity, 0);

    if (totalChekiCount === 0 && totalMerchCount === 0) {
      return res.status(400).json({ error: "Keranjang belanja kosong. Harap pilih minimal 1 item." });
    }

    // 2. Quota validations (if not bypassed)
    if (!bypass_quotas && totalChekiCount > 0 && event_name) {
      // Fetch shop settings
      const { data: settingsData } = await supabase
        .from('shop_settings')
        .select('*');

      const settings = {};
      if (settingsData) {
        settingsData.forEach(item => {
          settings[item.key] = item.value;
        });
      }

      // Check event-level cheki quota
      const eventQuotas = settings.event_cheki_quotas || {};
      const quota = eventQuotas[event_name];
      if (quota !== undefined && quota !== null && quota !== "" && Number(quota) > 0) {
        const { data: eventOrders } = await supabase
          .from('orders')
          .select('cheki_items')
          .eq('event_name', event_name)
          .neq('status', 'rejected');

        let currentChekiCount = 0;
        if (eventOrders) {
          eventOrders.forEach(o => {
            let items = [];
            try {
              items = typeof o.cheki_items === 'string' ? JSON.parse(o.cheki_items) : o.cheki_items;
            } catch(e) {}
            if (Array.isArray(items)) {
              items.forEach(item => {
                currentChekiCount += (item.quantity || 0);
              });
            }
          });
        }

        if (currentChekiCount + totalChekiCount > Number(quota)) {
          const remaining = Math.max(0, Number(quota) - currentChekiCount);
          return res.status(400).json({ 
            error: `Kuota Cheki untuk event ini hampir penuh. Tersisa ${remaining} slot cheki.` 
          });
        }
      }

      // Check member-level cheki quota
      const eventMemberQuotas = settings.event_member_cheki_quotas || {};
      const memberQuotas = eventMemberQuotas[event_name] || {};
      const memberQuotasDefined = Object.keys(memberQuotas).length > 0;
      if (memberQuotasDefined) {
        const { data: eventOrders } = await supabase
          .from('orders')
          .select('cheki_items')
          .eq('event_name', event_name)
          .neq('status', 'rejected');

        const memberOrdered = {};
        if (eventOrders) {
          eventOrders.forEach(o => {
            let items = [];
            try {
              items = typeof o.cheki_items === 'string' ? JSON.parse(o.cheki_items) : o.cheki_items;
            } catch(e) {}
            if (Array.isArray(items)) {
              items.forEach(item => {
                const mid = item.member_id || item.id;
                if (mid) {
                  memberOrdered[mid] = (memberOrdered[mid] || 0) + (item.quantity || 0);
                }
              });
            }
          });
        }

        for (const item of chekiList) {
          const mid = item.member_id || item.id;
          if (mid && memberQuotas[mid] !== undefined && memberQuotas[mid] !== null && memberQuotas[mid] !== "") {
            const quota = Number(memberQuotas[mid]);
            if (quota > 0) {
              const currentCount = memberOrdered[mid] || 0;
              if (currentCount + item.quantity > quota) {
                const remaining = Math.max(0, quota - currentCount);
                return res.status(400).json({ 
                  error: `Stok Cheki untuk member ${item.member_name} tidak mencukupi. Tersisa ${remaining} lembar.` 
                });
              }
            }
          }
        }
      }
    }

    // Calculate Grand Total
    let calculatedTotal = 0;
    chekiList.forEach(item => {
      calculatedTotal += item.quantity * item.unit_price;
    });
    merchList.forEach(item => {
      calculatedTotal += item.quantity * item.unit_price;
    });

    // Generate Order ID
    const orderId = generateOrderId('OTS');

    // Save OTS Order to Database
    const { error: dbError } = await supabase
      .from('orders')
      .insert([{
        order_id: orderId,
        buyer_name,
        buyer_email: buyer_email || '',
        buyer_whatsapp: waNormalized || '',
        buyer_instagram: igClean || '',
        redeem_method: 'event',
        shipping_address: null,
        cheki_items: chekiList,
        merch_items: merchList,
        grand_total: calculatedTotal,
        notes: notes || null,
        payment_method,
        payment_proof_url: 'OTS - Terverifikasi oleh Admin',
        status: 'approved',
        admin_notes: 'Transaksi On-The-Spot',
        event_name: event_name || null,
        is_redeemed: is_redeemed !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (dbError) {
      console.error("Database insert error for OTS:", dbError);
      return res.status(500).json({ error: "Gagal menyimpan data pesanan OTS." });
    }

    // Send Confirmation Email if email is valid
    if (isEmailValid) {
      try {
        let detailsHtml = `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Rincian Belanja</h3>
            <table style="width: 100%; border-collapse: collapse;">
        `;

        chekiList.forEach(item => {
          detailsHtml += `
            <tr>
              <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155;">
                <strong>Cheki ${item.member_name}</strong><br>
                <span style="font-size: 12px; color: #64748b;">Tipe: ${item.type}</span>
              </td>
              <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155;">x${item.quantity}</td>
              <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #334155;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
            </tr>
          `;
        });

        merchList.forEach(item => {
          detailsHtml += `
            <tr>
              <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155;">
                <strong>${item.merch_name}</strong>
              </td>
              <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155;">x${item.quantity}</td>
              <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #334155;">Rp ${item.subtotal.toLocaleString('id-ID')}</td>
            </tr>
          `;
        });

        detailsHtml += `
              <tr style="font-weight: bold;">
                <td colspan="2" style="padding: 15px 0 0 0; font-size: 16px; color: #0f172a;">Total Pembayaran</td>
                <td style="padding: 15px 0 0 0; font-size: 16px; text-align: right; color: #0f172a;">Rp ${calculatedTotal.toLocaleString('id-ID')}</td>
              </tr>
            </table>
          </div>
        `;

        const mainText = `Halo!<br><br>` +
          `Pembelian On-The-Spot Anda dengan ID <strong>${orderId}</strong> telah berhasil diproses dan dikonfirmasi oleh Admin.<br><br>` +
          `Pembayaran telah diterima menggunakan metode <strong>${payment_method}</strong>.<br><br>` +
          `Silakan ambil pesanan Anda langsung di booth event Kirin Day jika Anda belum menerimanya.`;

        const emailHtml = buildHtmlEmail({
          title: "Pembelian OTS Sukses",
          subtitle: `Order ID: #${orderId}`,
          buyerName: buyer_name,
          mainText: mainText,
          detailsHtml: detailsHtml,
          ctaUrl: `${getAppUrl(req)}/buy/status?id=${orderId}`,
          ctaText: "Cek Status Pesanan"
        });

        sendEmail({
          to: buyer_email.trim(),
          subject: `[Order #${orderId}] Pembelian OTS Berhasil Diproses!`,
          html: emailHtml
        }).catch(err => {
          console.error(`Gagal mengirim email konfirmasi OTS latar belakang untuk order ${orderId}:`, err);
        });
      } catch (emailErr) {
        console.error("Error preparing OTS confirmation email:", emailErr);
      }
    }

    res.json({
      success: true,
      message: `Pesanan OTS ${orderId} berhasil diproses.`,
      order_id: orderId
    });

  } catch (err) {
    console.error("OTS creation internal error:", err);
    res.status(500).json({ error: "Terjadi kesalahan internal sistem saat memproses OTS." });
  }
});

// ================= ADMIN ENDPOINTS =================

// Route: Get all orders (Admin)
app.get('/api/orders', adminAuth, async (req, res) => {
  const { status, search, page = 1, show_archived = 'false', limit: queryLimit } = req.query;
  const limit = queryLimit ? parseInt(queryLimit, 10) : 20;
  const offset = (parseInt(page, 10) - 1) * limit;

  try {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    // Filter status
    if (status && status !== 'all') {
      query = query.eq('status', status.toLowerCase());
    }

    // Filter is_archived
    if (show_archived !== 'true') {
      query = query.eq('is_archived', false);
    }

    // Search term
    if (search) {
      // In Supabase we can use or for searching across multiple columns
      query = query.or(`order_id.ilike.%${search}%,buyer_name.ilike.%${search}%,buyer_email.ilike.%${search}%`);
    }

    // Pagination & Sort
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      orders: data,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error("Admin fetch orders error:", err);
    res.status(500).json({ error: "Gagal mengambil data pesanan." });
  }
});

// Route: Update order status (Approve/Reject - Admin)
app.put('/api/orders/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Status tidak valid. Harus 'approved' atau 'rejected'." });
  }

  if (status === 'rejected' && (!admin_notes || admin_notes.trim().length === 0)) {
    return res.status(400).json({ error: "Alasan penolakan (catatan admin) wajib diisi." });
  }

  try {
    // 1. Fetch current order details to verify existence
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', id)
      .single();

    if (fetchErr || !order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    // 2. Update status in Database
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', id);

    if (updateErr) {
      throw updateErr;
    }

    // 3. Send Notification Email to Buyer
    let emailSubject = '';
    let emailHtml = '';

    if (status === 'approved') {
      emailSubject = `Pesananmu #${id} telah diverifikasi!`;
      const currentEventName = order.event_name || buyConfig.eventInfo.name || 'Kirin Day';
      const eventDetails = order.redeem_method === 'event'
        ? `Sampai jumpa di event (${currentEventName}).`
        : `Pesananmu akan segera kami kirimkan ke alamat tujuan Anda.`;
      
      const mainText = `Kabar baik! Bukti pembayaran untuk pesanan Anda <strong>#${id}</strong> telah diverifikasi oleh tim kami.<br><br>` +
        `<strong>${eventDetails}</strong><br><br>` +
        `Silakan pantau status terbaru pesanan Anda kapan saja dengan menekan tombol di bawah ini.`;
      
      emailHtml = buildHtmlEmail({
        title: "Pembayaran Terverifikasi",
        subtitle: `Order ID: #${id}`,
        buyerName: order.buyer_name,
        mainText: mainText,
        ctaUrl: `${getAppUrl(req)}/buy/status?id=${id}`,
        ctaText: "Cek Status Pesanan"
      });
    } else {
      emailSubject = `Update mengenai Pesananmu #${id}`;
      const mainText = `Mohon maaf, pesanan Anda dengan ID <strong>#${id}</strong> tidak dapat kami proses.<br><br>` +
        `<strong>Alasan:</strong> ${admin_notes}<br><br>` +
        `Jika Anda merasa ini adalah kesalahan atau membutuhkan informasi lebih lanjut, silakan hubungi tim kami melalui WhatsApp atau balas email ini.`;
      
      emailHtml = buildHtmlEmail({
        title: "Pesanan Ditolak",
        subtitle: `Order ID: #${id}`,
        buyerName: order.buyer_name,
        mainText: mainText,
        ctaUrl: `${getAppUrl(req)}/buy/status?id=${id}`,
        ctaText: "Cek Status Pesanan"
      });
    }

    // 3. Send Notification Email to Buyer (Background Task)
    sendEmail({
      to: order.buyer_email,
      subject: emailSubject,
      html: emailHtml
    }).catch(err => {
      console.error(`Gagal mengirim email update status latar belakang untuk order ${id}:`, err);
    });

    res.json({
      success: true,
      message: `Status pesanan berhasil diperbarui menjadi ${status}.`
    });

  } catch (err) {
    console.error("Admin update order error:", err);
    res.status(500).json({ error: "Gagal memperbarui status pesanan." });
  }
});

// Route: Backup all orders as a ZIP file (Admin)
app.get('/api/orders/backup-zip', adminAuth, async (req, res) => {
  const { include_archived } = req.query;
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (include_archived !== 'true') {
      query = query.eq('is_archived', false);
    }

    const { data: allOrders, error: fetchErr } = await query;

    if (fetchErr || !allOrders) {
      throw fetchErr || new Error("Tidak ada data pesanan ditemukan.");
    }

    const zip = new AdmZip();

    // 2. Generate CSV Content
    let csvContent = '\uFEFF'; // UTF-8 BOM to display Indonesian characters properly in Excel
    csvContent += 'Order ID,Buyer Name,Buyer Email,WhatsApp,Instagram,Redeem Method,Shipping Address,Grand Total,Payment Method,Status,Admin Notes,Created At,Updated At\n';

    allOrders.forEach(order => {
      const cleanAddress = (order.shipping_address || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const cleanNotes = (order.admin_notes || '').replace(/"/g, '""').replace(/\n/g, ' ');
      csvContent += `"${order.order_id}","${order.buyer_name}","${order.buyer_email}","${order.buyer_whatsapp}","${order.buyer_instagram}","${order.redeem_method}","${cleanAddress}",${order.grand_total},"${order.payment_method}","${order.status}","${cleanNotes}","${order.created_at}","${order.updated_at}"\n`;
    });

    zip.addFile("rekap_transaksi.csv", Buffer.from(csvContent, "utf8"));

    // 3. Download and add each payment proof image to the ZIP file
    for (const order of allOrders) {
      // Skip if URL is empty, a placeholder, or already archived
      if (!order.payment_proof_url || order.payment_proof_url.includes('placeholder') || order.payment_proof_url.includes('Arsip') || order.payment_proof_url.includes('via.placeholder.com')) {
        continue;
      }

      try {
        const response = await fetch(order.payment_proof_url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          let ext = '.jpg';
          if (order.payment_proof_url.toLowerCase().endsWith('.pdf')) {
            ext = '.pdf';
          } else if (order.payment_proof_url.toLowerCase().endsWith('.png')) {
            ext = '.png';
          } else if (order.payment_proof_url.toLowerCase().endsWith('.webp')) {
            ext = '.webp';
          }

          // Folder path inside ZIP
          const zipPath = `bukti_pembayaran/${order.order_id}${ext}`;
          zip.addFile(zipPath, buffer);
        }
      } catch (fileErr) {
        console.error(`Gagal mengunduh bukti pembayaran untuk ${order.order_id}:`, fileErr);
        // Continue backing up other files
      }
    }

    // 4. Generate and send ZIP
    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=KirinDay_Backup_Shop_${new Date().toISOString().slice(0,10)}.zip`);
    res.send(zipBuffer);

  } catch (err) {
    console.error("Backup ZIP error:", err);
    res.status(500).json({ error: "Gagal membuat berkas backup (.zip)." });
  }
});

// Route: Purge verified payment proofs from storage and Archive (Admin)
app.post('/api/orders/purge-proofs', adminAuth, async (req, res) => {
  try {
    // 1. Fetch all orders that are approved/rejected
    const { data: ordersToPurge, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['approved', 'rejected']);

    if (fetchErr) throw fetchErr;

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'payment-proofs';
    let purgeCount = 0;

    for (const order of ordersToPurge) {
      const isPlaceholder = !order.payment_proof_url || 
        order.payment_proof_url.includes('placeholder') || 
        order.payment_proof_url.includes('Arsip') || 
        order.payment_proof_url.includes('via.placeholder.com');

      if (!isPlaceholder) {
        // Extract storage path from public URL
        const parts = order.payment_proof_url.split(`/${bucketName}/`);
        if (parts.length > 1) {
          const filePath = parts[1]; // e.g. proofs/CK-...
          
          // Delete from storage
          const { error: deleteErr } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

          if (deleteErr) {
            console.error(`Gagal menghapus file storage ${filePath}:`, deleteErr);
          }
        }
      }

      // Update database record to placeholder url (if not already placeholder) and set is_archived = true
      const updateData = {
        is_archived: true,
        updated_at: new Date().toISOString()
      };

      if (!isPlaceholder) {
        updateData.payment_proof_url = `https://via.placeholder.com/150/1a2f47/90CDF4?text=Bukti+Telah+Diarsip`;
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update(updateData)
        .eq('order_id', order.order_id);

      if (updateErr) {
        console.error(`Gagal memperbarui status db untuk ${order.order_id}:`, updateErr);
      } else {
        purgeCount++;
      }
    }

    res.json({
      success: true,
      purgedCount: purgeCount,
      message: `${purgeCount} pesanan berhasil dibersihkan dari penyimpanan bukti dan dipindahkan ke arsip.`
    });

  } catch (err) {
    console.error("Purge proofs error:", err);
    res.status(500).json({ error: "Gagal membersihkan berkas bukti pembayaran dan mengarsipkan pesanan." });
  }
});

// Route: Get event cheki quota status
app.get('/api/orders/event-cheki-status', async (req, res) => {
  const { event_name } = req.query;
  if (!event_name) {
    return res.status(400).json({ error: "Nama event diperlukan." });
  }

  try {
    // 1. Fetch quota
    const { data: quotaSetting } = await supabase
      .from('shop_settings')
      .select('value')
      .eq('key', 'event_cheki_quotas')
      .single();
    const quotas = quotaSetting?.value || {};
    const quota = quotas[event_name] !== undefined && quotas[event_name] !== null && quotas[event_name] !== "" ? parseInt(quotas[event_name], 10) : null;

    // 2. Fetch current ordered count
    const { data: eventOrders } = await supabase
      .from('orders')
      .select('cheki_items')
      .eq('event_name', event_name)
      .neq('status', 'rejected');

    let currentChekiCount = 0;
    if (eventOrders) {
      eventOrders.forEach(o => {
        let items = [];
        try {
          items = typeof o.cheki_items === 'string' ? JSON.parse(o.cheki_items) : o.cheki_items;
        } catch(e) {}
        if (Array.isArray(items)) {
          items.forEach(item => {
            currentChekiCount += (item.quantity || 0);
          });
        }
      });
    }

    // 3. Fetch member-level quotas
    const { data: memberQuotaSetting } = await supabase
      .from('shop_settings')
      .select('value')
      .eq('key', 'event_member_cheki_quotas')
      .single();
    const allMemberQuotas = memberQuotaSetting?.value || {};
    const memberQuotas = allMemberQuotas[event_name] || {};

    // 4. Calculate member-level ordered count
    const memberOrdered = {};
    if (eventOrders) {
      eventOrders.forEach(o => {
        let items = [];
        try {
          items = typeof o.cheki_items === 'string' ? JSON.parse(o.cheki_items) : o.cheki_items;
        } catch(e) {}
        if (Array.isArray(items)) {
          items.forEach(item => {
            const mid = item.member_id || item.id;
            if (mid) {
              memberOrdered[mid] = (memberOrdered[mid] || 0) + (item.quantity || 0);
            }
          });
        }
      });
    }

    // 5. Compute member-level remaining quotas
    const memberRemaining = {};
    Object.keys(memberQuotas).forEach(mid => {
      const q = parseInt(memberQuotas[mid], 10);
      if (!isNaN(q)) {
        const ordered = memberOrdered[mid] || 0;
        memberRemaining[mid] = Math.max(0, q - ordered);
      }
    });

    res.json({
      event_name,
      quota,
      ordered: currentChekiCount,
      remaining: quota !== null ? Math.max(0, quota - currentChekiCount) : null,
      member_quotas: memberQuotas,
      member_ordered: memberOrdered,
      member_remaining: memberRemaining
    });
  } catch (err) {
    console.error("Error event-cheki-status:", err);
    res.status(500).json({ error: "Gagal memuat status kuota event." });
  }
});

// Route: Get shop settings (Public)
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*');

    if (error) {
      throw error;
    }

    const settings = {};
    if (data) {
      data.forEach(item => {
        settings[item.key] = item.value;
      });
    }

    if (!settings.master_status) {
      settings.master_status = { is_open: true };
    }
    if (!settings.event_visibility) {
      settings.event_visibility = {};
    }
    if (settings.cheki_po_open === undefined) {
      settings.cheki_po_open = true;
    }
    if (settings.merch_po_open === undefined) {
      settings.merch_po_open = true;
    }
    if (!settings.event_cheki_quotas) {
      settings.event_cheki_quotas = {};
    }
    if (!settings.merch_stock_overrides) {
      settings.merch_stock_overrides = {};
    }
    if (!settings.event_member_cheki_quotas) {
      settings.event_member_cheki_quotas = {};
    }
    if (settings.payment_qris_name === undefined) {
      settings.payment_qris_name = '';
    }
    if (settings.payment_qris_image === undefined) {
      settings.payment_qris_image = '';
    }
    if (settings.payment_bank_name === undefined) {
      settings.payment_bank_name = '';
    }
    if (settings.payment_bank_account_number === undefined) {
      settings.payment_bank_account_number = '';
    }
    if (settings.payment_bank_account_name === undefined) {
      settings.payment_bank_account_name = '';
    }

    res.json(settings);
  } catch (err) {
    console.error("Fetch settings error:", err);
    res.json({
      master_status: { is_open: true },
      event_visibility: {},
      cheki_po_open: true,
      merch_po_open: true,
      event_cheki_quotas: {},
      merch_stock_overrides: {},
      event_member_cheki_quotas: {},
      payment_qris_name: '',
      payment_qris_image: '',
      payment_bank_name: '',
      payment_bank_account_number: '',
      payment_bank_account_name: ''
    });
  }
});

// Route: Update shop settings (Admin)
app.put('/api/settings', adminAuth, async (req, res) => {
  const { master_status, event_visibility, cheki_po_open, merch_po_open, event_cheki_quotas, merch_stock_overrides } = req.body;

  try {
    const promises = [];

    if (master_status !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'master_status', value: master_status })
      );
    }

    if (event_visibility !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'event_visibility', value: event_visibility })
      );
    }

    if (cheki_po_open !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'cheki_po_open', value: cheki_po_open })
      );
    }

    if (merch_po_open !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'merch_po_open', value: merch_po_open })
      );
    }

    if (event_cheki_quotas !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'event_cheki_quotas', value: event_cheki_quotas })
      );
    }

    if (merch_stock_overrides !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'merch_stock_overrides', value: merch_stock_overrides })
      );
    }

    if (req.body.event_member_cheki_quotas !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'event_member_cheki_quotas', value: req.body.event_member_cheki_quotas })
      );
    }

    if (req.body.payment_qris_name !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'payment_qris_name', value: req.body.payment_qris_name })
      );
    }

    if (req.body.payment_qris_image !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'payment_qris_image', value: req.body.payment_qris_image })
      );
    }

    if (req.body.payment_bank_name !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'payment_bank_name', value: req.body.payment_bank_name })
      );
    }

    if (req.body.payment_bank_account_number !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'payment_bank_account_number', value: req.body.payment_bank_account_number })
      );
    }

    if (req.body.payment_bank_account_name !== undefined) {
      promises.push(
        supabase
          .from('shop_settings')
          .upsert({ key: 'payment_bank_account_name', value: req.body.payment_bank_account_name })
      );
    }

    const results = await Promise.all(promises);
    for (const resObj of results) {
      if (resObj.error) {
        throw resObj.error;
      }
    }

    res.json({ success: true, message: "Pengaturan berhasil diperbarui." });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Gagal memperbarui pengaturan." });
  }
});

// Route: Toggle order redemption status (Admin)
app.put('/api/orders/:id/redeem', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { is_redeemed } = req.body;

  if (is_redeemed === undefined) {
    return res.status(400).json({ error: "Status pengambilan (is_redeemed) diperlukan." });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        is_redeemed: !!is_redeemed,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', id)
      .select();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: `Status pengambilan pesanan ${id} berhasil diperbarui.`,
      order: data ? data[0] : null
    });
  } catch (err) {
    console.error("Redeem order error:", err);
    res.status(500).json({ error: "Gagal memperbarui status pengambilan pesanan." });
  }
});

// Route: Delete all archived orders from database (Admin)
app.delete('/api/orders/archive/clear', adminAuth, async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from('orders')
      .delete({ count: 'exact' })
      .eq('is_archived', true);

    if (error) throw error;

    res.json({
      success: true,
      deletedCount: count || 0,
      message: `${count || 0} data pesanan terarsip berhasil dihapus secara permanen.`
    });
  } catch (err) {
    console.error("Clear archive error:", err);
    res.status(500).json({ error: "Gagal menghapus data pesanan terarsip." });
  }
});

// Route: Delete a specific archived order from database (Admin)
app.delete('/api/orders/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Verifikasi terlebih dahulu apakah order tersebut terarsip
    const { data: orders, error: checkErr } = await supabase
      .from('orders')
      .select('is_archived')
      .eq('order_id', id);

    if (checkErr) throw checkErr;
    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    const order = orders[0];
    if (!order.is_archived) {
      return res.status(400).json({ error: "Hanya pesanan yang sudah diarsipkan yang dapat dihapus secara permanen." });
    }

    const { error: deleteErr } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', id);

    if (deleteErr) throw deleteErr;

    res.json({
      success: true,
      message: `Pesanan ${id} berhasil dihapus secara permanen.`
    });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: "Gagal menghapus pesanan." });
  }
});

// Error handling middleware for Multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `Ukuran berkas terlalu besar. Maksimal adalah ${buyConfig.paymentProofMaxSizeMB}MB.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = app;
