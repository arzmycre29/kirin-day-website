// Cwd: d:/ProjectApp/Kirin Day Web/api/orders/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const AdmZip = require('adm-zip');
require('dotenv').config();

const { supabase } = require('./supabase');
const { sendEmail } = require('./email');
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
  const adminPassword = process.env.ADMIN_PASSWORD || 'kirindayadmin';
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

    if (totalChekiCount > 50) {
      return res.status(400).json({ error: "Batas maksimal cheki dalam satu pesanan adalah 50." });
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
    const orderSummaryHtml = `
      <h3>Detail Pesanan Anda:</h3>
      <ul>
        ${chekiList.map(item => `<li>Cheki ${item.member_name} (${item.type}) x${item.quantity} - ${formatRp(item.subtotal)}</li>`).join('')}
        ${merchList.map(item => `<li>${item.merch_name} x${item.quantity} - ${formatRp(item.subtotal)}</li>`).join('')}
      </ul>
      <p><b>Event:</b> ${event_name}</p>
      <p><b>Metode Pengambilan:</b> ${redeem_method === 'event' ? `Ambil di Event` : `Kirim ke Alamat (${shipping_address})`}</p>
      <p><b>Total Pembayaran:</b> ${formatRp(calculatedTotal)}</p>
      <p><b>Metode Pembayaran:</b> ${payment_method.toUpperCase()}</p>
    `;

    const emailBody = `Halo ${buyer_name},\n\nTerima kasih telah melakukan pemesanan di Kirin Day Shop!\n\n` +
      `Pesanan Anda dengan ID **${orderId}** telah berhasil kami terima.\n\n` +
      `${orderSummaryHtml}\n\n` +
      `Pesanan Anda saat ini berstatus **Menunggu Verifikasi** dan akan kami verifikasi dalam waktu maksimal ${buyConfig.verificationSLAHours} jam.\n\n` +
      `Anda dapat mengecek status pesanan Anda secara langsung pada tautan berikut:\n` +
      `${getAppUrl(req)}/buy/status?id=${orderId}\n\n` +
      `Terima kasih atas dukungannya!\n\nSalam,\nKirin Day Management`;

    await sendEmail({
      to: buyer_email,
      subject: `[Order #${orderId}] Pesananmu sudah kami terima!`,
      body: emailBody
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

// Route: Get all orders (Admin)
app.get('/api/orders', adminAuth, async (req, res) => {
  const { status, search, page = 1 } = req.query;
  const limit = 20;
  const offset = (parseInt(page, 10) - 1) * limit;

  try {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    // Filter status
    if (status && status !== 'all') {
      query = query.eq('status', status.toLowerCase());
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
    let emailBody = '';

    if (status === 'approved') {
      emailSubject = `Pesananmu #${id} telah diverifikasi!`;
      const eventDetails = order.redeem_method === 'event'
        ? `Sampai jumpa di event (${buyConfig.eventInfo.name}).`
        : `Pesananmu akan segera kami kirimkan ke alamat tujuan Anda.`;
      
      emailBody = `Halo ${order.buyer_name},\n\n` +
        `Kabar baik! Bukti pembayaran untuk pesanan Anda **#${id}** telah diverifikasi oleh tim kami.\n\n` +
        `${eventDetails}\n\n` +
        `Anda dapat memantau status terbaru pesanan Anda kapan saja di sini:\n` +
        `${getAppUrl(req)}/buy/status?id=${id}\n\n` +
        `Terima kasih atas pembelian Anda!\n\nSalam,\nKirin Day Management`;
    } else {
      emailSubject = `Update mengenai Pesananmu #${id}`;
      emailBody = `Halo ${order.buyer_name},\n\n` +
        `Mohon maaf, pesanan Anda dengan ID **#${id}** tidak dapat kami proses.\n\n` +
        `**Alasan:** ${admin_notes}\n\n` +
        `Jika Anda merasa ini adalah kesalahan atau butuh informasi lebih lanjut, silakan hubungi tim kami melalui WhatsApp atau balas email ini.\n\n` +
        `Terima kasih.\n\nSalam,\nKirin Day Management`;
    }

    await sendEmail({
      to: order.buyer_email,
      subject: emailSubject,
      body: emailBody
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
  try {
    // 1. Fetch all orders from Supabase Database
    const { data: allOrders, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

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

// Route: Purge verified payment proofs from storage (Admin)
app.post('/api/orders/purge-proofs', adminAuth, async (req, res) => {
  try {
    // 1. Fetch all orders that are approved/rejected and still have an active proof URL
    const { data: ordersToPurge, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['approved', 'rejected']);

    if (fetchErr) throw fetchErr;

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'payment-proofs';
    let purgeCount = 0;

    for (const order of ordersToPurge) {
      if (!order.payment_proof_url || order.payment_proof_url.includes('placeholder') || order.payment_proof_url.includes('Arsip') || order.payment_proof_url.includes('via.placeholder.com')) {
        continue; // Already purged or placeholder
      }

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

        // Update database record to placeholder url
        const placeholderUrl = `https://via.placeholder.com/150/1a2f47/90CDF4?text=Bukti+Telah+Diarsip`;
        const { error: updateErr } = await supabase
          .from('orders')
          .update({
            payment_proof_url: placeholderUrl,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', order.order_id);

        if (updateErr) {
          console.error(`Gagal memperbarui status db untuk ${order.order_id}:`, updateErr);
        } else {
          purgeCount++;
        }
      }
    }

    res.json({
      success: true,
      purgedCount: purgeCount,
      message: `${purgeCount} berkas bukti pembayaran lama berhasil dibersihkan dari penyimpanan.`
    });

  } catch (err) {
    console.error("Purge proofs error:", err);
    res.status(500).json({ error: "Gagal membersihkan berkas bukti pembayaran." });
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

    res.json(settings);
  } catch (err) {
    console.error("Fetch settings error:", err);
    res.json({
      master_status: { is_open: true },
      event_visibility: {}
    });
  }
});

// Route: Update shop settings (Admin)
app.put('/api/settings', adminAuth, async (req, res) => {
  const { master_status, event_visibility } = req.body;

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
