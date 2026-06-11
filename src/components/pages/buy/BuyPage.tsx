// Cwd: d:/ProjectApp/Kirin Day Web/src/components/pages/buy/BuyPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Instagram, MapPin, Gift, AlertTriangle, 
  ShoppingBag, Clipboard, Check, Upload, FileText, ChevronRight, X, Loader2,
  Calendar, Search
} from 'lucide-react';
import buyConfig from '../../../../config/buyConfig.js';

export function BuyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMember = searchParams.get('member');
  
  // Progress tracker state
  const [activeSection, setActiveSection] = useState('details');

  // Form identity state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [insta, setInsta] = useState('');

  // Dynamic Contentful states with fallbacks to buyConfig
  const [members, setMembers] = useState<any[]>(buyConfig.members);
  const [merch, setMerch] = useState<any[]>(buyConfig.merch);
  const [loadingContentful, setLoadingContentful] = useState(true);

  // New events state
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');

  // New cheki prices state (fallback to 35k/35k/100k as requested)
  const [chekiPrices, setChekiPrices] = useState({
    twoShot: 35000,
    solo: 35000,
    group: 100000
  });

  // Shop settings state
  const [shopSettings, setShopSettings] = useState<any>({
    master_status: { is_open: true },
    event_visibility: {}
  });

  // Event Cheki Quota Status state
  const [eventChekiStatus, setEventChekiStatus] = useState<any>(null);

  // Fetch event cheki quota status when event changes
  useEffect(() => {
    if (!selectedEvent) {
      setEventChekiStatus(null);
      return;
    }
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/orders/event-cheki-status?event_name=${encodeURIComponent(selectedEvent)}`);
        if (res.ok) {
          const data = await res.json();
          setEventChekiStatus(data);
        }
      } catch (e) {
        console.error("Error fetching event cheki status:", e);
      }
    };
    fetchStatus();
  }, [selectedEvent]);

  // Fetch members, merchandise, settings, and events
  useEffect(() => {
    const fetchContentfulData = async () => {
      try {
        const { client } = await import('../../../lib/contentful');
        
        // Fetch settings from our backend first
        let settingsData = { master_status: { is_open: true }, event_visibility: {} as Record<string, boolean> };
        try {
          const res = await fetch('/api/settings');
          if (res.ok) {
            settingsData = await res.json();
          }
        } catch (settingsErr) {
          console.error("Error fetching settings:", settingsErr);
        }
        setShopSettings(settingsData);
        
        // Fetch members
        const membersResponse = await client.getEntries({
          content_type: 'member',
          order: ['fields.name'],
        });
        
        const formattedMembers = membersResponse.items.map((item: any) => ({
          id: item.sys.id,
          name: item.fields.name || 'Untitled Member',
          photoUrl: item.fields.photo?.fields?.file?.url
            ? (item.fields.photo.fields.file.url.startsWith('//') ? 'https:' + item.fields.photo.fields.file.url : item.fields.photo.fields.file.url)
            : 'https://via.placeholder.com/150/90CDF4/1a2f47?text=' + encodeURIComponent(item.fields.name || 'Member'),
          isActive: true
        }));

        // Fetch products
        const productsResponse = await client.getEntries({
          content_type: 'product',
          order: ['fields.name'],
        });

        const formattedMerch = productsResponse.items
          .filter((item: any) => item.fields.category !== 'Cheki')
          .map((item: any) => {
            const priceStr = item.fields.price || '0';
            const priceNum = typeof priceStr === 'number' 
              ? priceStr 
              : parseInt(priceStr.replace(/\D/g, ''), 10) || 0;
            return {
              id: item.sys.id,
              name: item.fields.name || 'Untitled Product',
              price: priceNum,
              photoUrl: item.fields.image?.fields?.file?.url
                ? (item.fields.image.fields.file.url.startsWith('//') ? 'https:' + item.fields.image.fields.file.url : item.fields.image.fields.file.url)
                : 'https://via.placeholder.com/150/90CDF4/1a2f47?text=' + encodeURIComponent(item.fields.name || 'Product'),
              stock: item.fields.inStock !== false ? 50 : 0,
              isActive: true
            };
          });

        // Parse Cheki pricing from products response
        const chekiProducts = productsResponse.items.filter((item: any) => item.fields.category === 'Cheki');
        
        let contentfulTwoShot = null;
        let contentfulSolo = null;
        let contentfulGroup = null;

        chekiProducts.forEach((item: any) => {
          const nameLower = (item.fields.name || '').toLowerCase();
          const priceStr = item.fields.price || '0';
          const priceNum = typeof priceStr === 'number'
            ? priceStr
            : parseInt(priceStr.replace(/\D/g, ''), 10) || 0;

          if (nameLower.includes('two shot') || nameLower.includes('2 shot') || nameLower.includes('twoshot')) {
            contentfulTwoShot = priceNum;
          } else if (nameLower.includes('solo')) {
            contentfulSolo = priceNum;
          } else if (nameLower.includes('group')) {
            contentfulGroup = priceNum;
          } else if (nameLower.includes('reguler') || nameLower.includes('regular') || nameLower.includes('cheki')) {
            if (contentfulTwoShot === null) contentfulTwoShot = priceNum;
            if (contentfulSolo === null) contentfulSolo = priceNum;
          }
        });

        setChekiPrices({
          twoShot: contentfulTwoShot ?? 35000,
          solo: contentfulSolo ?? 35000,
          group: contentfulGroup ?? 100000
        });

        // Fetch events
        const eventsResponse = await client.getEntries({
          content_type: 'event',
          order: ['fields.date'],
        });

        const formattedEvents = eventsResponse.items.map((item: any) => {
          const rawDate = item.fields.date;
          let dateStr = 'TBA';
          if (rawDate) {
            const d = new Date(rawDate);
            dateStr = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          }
          return {
            id: item.sys.id,
            title: item.fields.title || 'Untitled Event',
            date: dateStr,
            venue: item.fields.venue || 'TBA',
            location: item.fields.address || '',
            rawDate,
            attendingMembers: item.fields.attendingMembers?.map((m: any) => ({
              id: m.sys.id,
              name: m.fields.name || ''
            })) || null
          };
        });

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const activeEvents = formattedEvents.filter((ev: any) => {
          if (!ev.rawDate) return true;
          return new Date(ev.rawDate) >= oneDayAgo;
        });

        // Filter events based on settings
        const visibleEvents = activeEvents.filter((ev: any) => {
          return settingsData.event_visibility[ev.id] !== false;
        });

        if (visibleEvents.length > 0) {
          setEvents(visibleEvents);
          setSelectedEvent(visibleEvents[0].title);
        } else {
          const defaultEv = {
            id: 'default',
            title: buyConfig.eventInfo.name,
            date: buyConfig.eventInfo.date,
            venue: buyConfig.eventInfo.location
          };
          if (settingsData.event_visibility['default'] !== false) {
            setEvents([defaultEv]);
            setSelectedEvent(defaultEv.title);
          } else {
            setEvents([]);
            setSelectedEvent('');
          }
        }

        if (formattedMembers.length > 0) {
          setMembers(formattedMembers);
          // Initialize/sync chekiOrders with the loaded members
          setChekiOrders(prev => {
            const next = { ...prev };
            formattedMembers.forEach(m => {
              const isPreselected = preselectedMember && (
                m.name.toLowerCase() === preselectedMember.toLowerCase() ||
                m.id === preselectedMember
              );
              const soloKey = `${m.id}_Solo`;
              const twoShotKey = `${m.id}_Two Shot`;
              if (!next[soloKey]) {
                next[soloKey] = { type: 'Solo', quantity: 0 };
              }
              if (!next[twoShotKey]) {
                next[twoShotKey] = { type: 'Two Shot', quantity: isPreselected ? 1 : 0 };
              } else if (isPreselected) {
                next[twoShotKey].quantity = 1;
              }
            });
            if (!next['group_shot']) {
              next['group_shot'] = { type: 'Group', quantity: 0 };
            }
            return next;
          });
        }

        if (formattedMerch.length > 0) {
          setMerch(formattedMerch);
          // Initialize/sync merchOrders with the loaded merchandise
          setMerchOrders(prev => {
            const next = { ...prev };
            formattedMerch.forEach(item => {
              if (next[item.id] === undefined) {
                next[item.id] = 0;
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Error fetching Contentful data for Shop:", err);
        // Attempt to fetch settings if not done
        let settingsData = { master_status: { is_open: true }, event_visibility: {} as Record<string, boolean> };
        try {
          const res = await fetch('/api/settings');
          if (res.ok) {
            settingsData = await res.json();
          }
        } catch (settingsErr) {
          console.error("Error fetching settings in catch:", settingsErr);
        }
        setShopSettings(settingsData);

        const defaultEv = {
          id: 'default',
          title: buyConfig.eventInfo.name,
          date: buyConfig.eventInfo.date,
          venue: buyConfig.eventInfo.location
        };

        if (settingsData.event_visibility['default'] !== false) {
          setEvents([defaultEv]);
          setSelectedEvent(defaultEv.title);
        } else {
          setEvents([]);
          setSelectedEvent('');
        }

        setChekiPrices({
          twoShot: 35000,
          solo: 35000,
          group: 100000
        });
      } finally {
        setLoadingContentful(false);
      }
    };

    fetchContentfulData();
  }, []);

  // Blur/Validation error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Cheki quantities and types
  // Structured as: { [memberId]: { type: 'Two Shot' | 'Solo' | 'Group', quantity: number } }
  const [chekiOrders, setChekiOrders] = useState<Record<string, { type: string; quantity: number }>>(() => {
    const initial = {} as Record<string, { type: string; quantity: number }>;
    buyConfig.members.forEach(m => {
      initial[`${m.id}_Solo`] = { type: 'Solo', quantity: 0 };
      initial[`${m.id}_Two Shot`] = { type: 'Two Shot', quantity: 0 };
    });
    initial['group_shot'] = { type: 'Group', quantity: 0 };
    return initial;
  });

  // Merch quantities
  // Structured as: { [merchId]: quantity }
  const [merchOrders, setMerchOrders] = useState<Record<string, number>>(
    buyConfig.merch.reduce((acc, item) => {
      acc[item.id] = 0;
      return acc;
    }, {} as any)
  );

  // Redeem method
  const [redeemMethod, setRedeemMethod] = useState<'event' | 'ship'>(
    buyConfig.eventInfo.isActive ? 'event' : 'ship'
  );
  const [shippingAddress, setShippingAddress] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // Payment Method
  const [selectedPayment, setSelectedPayment] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Payment Proof File Upload
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission / Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mobile drawer summary open state
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  // Refs for scroll spy and error focus
  const detailsRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  // 1. Scrollspy to highlight active section in progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      
      if (confirmRef.current && scrollPos >= confirmRef.current.offsetTop) {
        setActiveSection('confirm');
      } else if (paymentRef.current && scrollPos >= paymentRef.current.offsetTop) {
        setActiveSection('payment');
      } else if (itemsRef.current && scrollPos >= itemsRef.current.offsetTop) {
        setActiveSection('items');
      } else {
        setActiveSection('details');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  // Reset orders for members not attending when event changes
  useEffect(() => {
    if (!selectedEvent) return;
    const selectedEventObj = events.find(ev => ev.title === selectedEvent);
    const attendingLineup = selectedEventObj?.attendingMembers;
    if (attendingLineup && attendingLineup.length > 0) {
      setChekiOrders(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          if (key === 'group_shot') return;
          const lastUnderscore = key.lastIndexOf('_');
          const memberId = key.substring(0, lastUnderscore);
          const isAttending = attendingLineup.some((am: any) => am.id === memberId);
          if (!isAttending && next[key]?.quantity > 0) {
            next[key] = { ...next[key], quantity: 0 };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [selectedEvent, events]);

  // 2. Identity validations
  const validateField = (field: string, value: string) => {
    let error = '';
    
    if (field === 'name') {
      if (!value.trim()) error = 'Nama lengkap wajib diisi.';
      else if (value.trim().length < 3) error = 'Nama lengkap minimal 3 karakter.';
    }
    
    if (field === 'email') {
      if (!value.trim()) error = 'Email wajib diisi.';
      else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) error = 'Format email tidak valid (harus mengandung @domain.tld).';
      }
    }

    if (field === 'whatsapp') {
      if (!value.trim()) error = 'Nomor WhatsApp wajib diisi.';
      else {
        const waClean = value.trim();
        const waRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
        if (!waRegex.test(waClean)) {
          error = 'Format nomor WA tidak valid (contoh: 08123456789).';
        }
      }
    }

    if (field === 'instagram') {
      if (!value.trim()) error = 'Username Instagram wajib diisi.';
      else {
        const igClean = value.replace(/^@/, '').trim();
        const igRegex = /^[a-zA-Z0-9_.]+$/;
        if (!igRegex.test(igClean) || igClean.includes(' ')) {
          error = 'Username Instagram tidak valid (hanya huruf, angka, _, dan .).';
        }
      }
    }

    if (field === 'address') {
      if (redeemMethod === 'ship') {
        if (!value.trim()) error = 'Alamat pengiriman wajib diisi.';
        else if (value.trim().length < 20) error = 'Alamat lengkap pengiriman minimal 20 karakter.';
      }
    }

    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  // Instagram change strip @
  const handleInstagramChange = (val: string) => {
    setInsta(val);
    if (touched['instagram']) validateField('instagram', val);
  };

  // Cheki handlers
  const handleChekiQtyChange = (key: string, qty: number) => {
    const parsed = Math.max(0, qty);
    setChekiOrders(prev => {
      const next = { ...prev };
      if (!next[key]) {
        const type = key.endsWith('_Solo') ? 'Solo' : (key.endsWith('_Two Shot') ? 'Two Shot' : 'Group');
        next[key] = { type, quantity: parsed };
      } else {
        next[key] = { ...next[key], quantity: parsed };
      }
      return next;
    });
  };

  const handleChekiDirectInput = (key: string, inputVal: string) => {
    const parsed = parseInt(inputVal.replace(/\D/g, ''), 10) || 0;
    if (key === 'group_shot') {
      handleChekiQtyChange(key, parsed);
    } else {
      const lastUnderscore = key.lastIndexOf('_');
      const memberId = key.substring(0, lastUnderscore);
      const remainingStock = eventChekiStatus?.member_remaining?.[memberId];
      let finalQty = parsed;
      if (remainingStock !== undefined && remainingStock !== null) {
        const otherType = key.endsWith('_Solo') ? 'Two Shot' : 'Solo';
        const otherKey = `${memberId}_${otherType}`;
        const otherQty = chekiOrders[otherKey]?.quantity || 0;
        if (finalQty + otherQty > remainingStock) {
          finalQty = Math.max(0, remainingStock - otherQty);
        }
      }
      handleChekiQtyChange(key, finalQty);
    }
  };

  // Merch handlers
  const handleMerchQtyChange = (merchId: string, qty: number, stock: number) => {
    const maxLimit = Math.min(buyConfig.maxMerchPerItem, stock);
    const clamped = Math.max(0, Math.min(maxLimit, qty));
    setMerchOrders(prev => ({
      ...prev,
      [merchId]: clamped
    }));
  };

  const handleMerchDirectInput = (merchId: string, inputVal: string, stock: number) => {
    const parsed = parseInt(inputVal.replace(/\D/g, ''), 10) || 0;
    handleMerchQtyChange(merchId, parsed, stock);
  };

  // Calculate Subtotals & Totals
  const getChekiPrice = (type: string) => {
    if (type === 'Two Shot') return chekiPrices.twoShot;
    if (type === 'Solo') return chekiPrices.solo;
    return chekiPrices.group;
  };

  let totalChekiQty = 0;
  let chekiGrandTotal = 0;
  const activeChekiList: any[] = [];

  members
    .filter(m => m.isActive)
    .forEach(m => {
      ['Solo', 'Two Shot'].forEach(type => {
        const key = `${m.id}_${type}`;
        const order = chekiOrders[key];
        const quantity = order ? order.quantity : 0;
        if (quantity > 0) {
          const price = getChekiPrice(type);
          const subtotal = quantity * price;
          
          totalChekiQty += quantity;
          chekiGrandTotal += subtotal;

          activeChekiList.push({
            id: m.id,
            name: m.name,
            type,
            quantity,
            price,
            subtotal
          });
        }
      });
    });

  // Consolidated Group Shot active cheki compilation
  const groupOrder = chekiOrders['group_shot'];
  if (groupOrder && groupOrder.quantity > 0) {
    const quantity = groupOrder.quantity;
    const price = chekiPrices.group;
    const subtotal = quantity * price;
    
    totalChekiQty += quantity;
    chekiGrandTotal += subtotal;
    
    activeChekiList.push({
      id: 'group_shot',
      name: 'Group Shot',
      type: 'Group',
      quantity,
      price,
      subtotal
    });
  }

  let merchGrandTotal = 0;
  const activeMerchList = merch
    .filter(item => item.isActive)
    .map(item => {
      const quantity = merchOrders[item.id] || 0;
      const subtotal = quantity * item.price;
      
      merchGrandTotal += subtotal;

      return {
        id: item.id,
        name: item.name,
        quantity,
        price: item.price,
        subtotal
      };
    })
    .filter(item => item.quantity > 0);

  const grandTotal = chekiGrandTotal + merchGrandTotal;
  const isCartEmpty = activeChekiList.length === 0 && activeMerchList.length === 0;
  const isChekiLimitExceeded = totalChekiQty > 50;

  // New variables for independent PO statuses and stock overrides
  const isChekiAvailable = shopSettings.cheki_po_open !== false;
  const getMerchStock = (item: any) => {
    return shopSettings.merch_stock_overrides?.[item.id] !== undefined
      ? parseInt(shopSettings.merch_stock_overrides[item.id], 10)
      : item.stock;
  };
  const isMerchAvailable = shopSettings.merch_po_open !== false && merch.some(item => item.isActive && getMerchStock(item) > 0);
  const isShopFullyClosed = !isChekiAvailable && !isMerchAvailable;
  const isEventChekiQuotaExceeded = eventChekiStatus && eventChekiStatus.quota !== null && eventChekiStatus.remaining !== null && eventChekiStatus.remaining <= 0;

  // Reset cheki quantities if cheki po is closed or quota exceeded
  useEffect(() => {
    if (!isChekiAvailable || isEventChekiQuotaExceeded) {
      setChekiOrders(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k].quantity = 0;
        });
        return next;
      });
    }
  }, [isChekiAvailable, isEventChekiQuotaExceeded]);

  // Reset merch quantities if merch sales are closed
  useEffect(() => {
    if (!isMerchAvailable) {
      setMerchOrders(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k] = 0;
        });
        return next;
      });
    }
  }, [isMerchAvailable]);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const processUploadedFile = (file: File) => {
    setFileError(null);

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Format file tidak didukung. Harap unggah file JPG, PNG, WEBP, atau PDF.');
      setProofFile(null);
      setProofPreview(null);
      return;
    }

    // Validate size
    const maxSize = buyConfig.paymentProofMaxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(`Ukuran file melebihi batas ${buyConfig.paymentProofMaxSizeMB}MB.`);
      setProofFile(null);
      setProofPreview(null);
      return;
    }

    setProofFile(file);

    // Generate preview
    if (file.type.startsWith('image/')) {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofPreview(URL.createObjectURL(file));
    } else {
      // PDF File preview placeholder
      setProofPreview('pdf_placeholder');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Copy bank account action
  const handleCopyAccount = (accountNo: string) => {
    navigator.clipboard.writeText(accountNo);
    setCopiedAccount(accountNo);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Submit Order Action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Trigger validation on all fields
    validateField('name', name);
    validateField('email', email);
    validateField('whatsapp', whatsapp);
    validateField('instagram', insta);
    if (redeemMethod === 'ship') {
      validateField('address', shippingAddress);
    }

    setTouched({
      name: true,
      email: true,
      whatsapp: true,
      instagram: true,
      address: true
    });

    // Check validation errors
    const hasErrors = errors.name || errors.email || errors.whatsapp || errors.instagram || 
                      (redeemMethod === 'ship' && errors.address);

    if (hasErrors) {
      // Scroll to first error field
      const firstErrorKey = Object.keys(errors).find(k => errors[k]);
      if (firstErrorKey) {
        let el = document.getElementsByName(firstErrorKey)[0];
        if (!el && firstErrorKey === 'address') el = document.getElementsByName('shippingAddress')[0];
        
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      return;
    }

    // Custom validations
    if (isCartEmpty) {
      setSubmitError('Keranjang Anda kosong. Harap pilih minimal 1 Cheki atau Merchandise.');
      itemsRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (isChekiLimitExceeded) {
      setSubmitError('Jumlah total Cheki Anda melebihi batas 50 lembar.');
      itemsRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (totalChekiQty > 0 && !isChekiAvailable) {
      setSubmitError('Pemesanan Cheki saat ini sedang ditutup.');
      return;
    }

    if (totalChekiQty > 0 && isEventChekiQuotaExceeded) {
      setSubmitError('Kuota pemesanan Cheki untuk event ini sudah penuh.');
      return;
    }

    if (activeMerchList.length > 0 && !isMerchAvailable) {
      setSubmitError('Penjualan Merchandise saat ini sedang ditutup atau stok habis.');
      return;
    }

    if (!selectedEvent) {
      setSubmitError('Harap pilih salah satu event target.');
      return;
    }

    if (!selectedPayment) {
      setSubmitError('Harap pilih salah satu metode pembayaran.');
      paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!proofFile) {
      setSubmitError('Harap unggah bukti pembayaran Anda.');
      paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Start submit
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('buyer_name', name);
      formData.append('buyer_email', email);
      formData.append('buyer_whatsapp', whatsapp);
      formData.append('buyer_instagram', insta);
      formData.append('redeem_method', redeemMethod);
      formData.append('event_name', selectedEvent);
      if (redeemMethod === 'ship') {
        formData.append('shipping_address', shippingAddress);
      }
      
      // Items payload
      const chekiPayload = activeChekiList.map(item => ({
        member_id: item.id,
        member_name: item.name,
        type: item.type,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal
      }));

      const merchPayload = activeMerchList.map(item => ({
        merch_id: item.id,
        merch_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal
      }));

      formData.append('cheki_items', JSON.stringify(chekiPayload));
      formData.append('merch_items', JSON.stringify(merchPayload));
      formData.append('notes', notes);
      formData.append('payment_method', selectedPayment);
      formData.append('paymentProof', proofFile);

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData
      });

      let resData: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Terjadi kesalahan server (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(resData.error || 'Gagal mengirimkan pesanan.');
      }

      // Successful redirect to status tracking
      navigate(`/buy/status?id=${resData.orderId}`);

    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || 'Terjadi kesalahan saat mengirim pesanan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper formatting Rp.
  const formatRpString = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div className="min-h-screen pt-32 pb-32 px-4 md:px-6 bg-[#1a2f47] text-white">
      {/* Striped Pattern Background */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(246, 224, 94, 0.1) 10px,
            rgba(246, 224, 94, 0.1) 20px
          )`
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            DIRECT BUY SHOP
          </h1>
          <div className="w-24 h-1 bg-[#F6E05E] mx-auto mt-4 mb-4" />
          <p className="text-white/70 max-w-lg mx-auto text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Pesan Cheki &amp; Merchandise favoritmu secara langsung. Lakukan pembayaran manual via QRIS/Transfer Bank dan pantau verifikasinya.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/buy/status')}
              className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white font-bold text-sm tracking-wide transition-all shadow-lg flex items-center gap-2 backdrop-blur-sm cursor-pointer"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Search className="w-4 h-4 text-[#F6E05E]" />
              Cek Status Pembayaran Pesanan
            </button>
          </div>
        </div>

        {isShopFullyClosed ? (
          <div className="max-w-xl mx-auto mt-12 p-8 md:p-12 rounded-3xl border border-white/10 bg-[#152238]/60 backdrop-blur-md text-center shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#F6E05E]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#90CDF4]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingBag className="w-10 h-10 text-[#F6E05E] animate-pulse" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Pre-Order Sedang Ditutup
            </h2>
            
            <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Saat ini kami sedang tidak menerima pesanan baru. Silakan pantau pengumuman di media sosial resmi untuk jadwal pre-order berikutnya!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wide transition-all border border-white/10 cursor-pointer animate-hover"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Kembali ke Beranda
              </button>
              <button
                type="button"
                onClick={() => navigate('/buy/status')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#90CDF4] to-[#4299E1] hover:from-[#63B3ED] hover:to-[#3182CE] text-[#1a2f47] font-black text-sm tracking-wide transition-all shadow-lg cursor-pointer"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Cek Status Pesanan
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Floating Top Progress Bar */}
            <div className="sticky top-[72px] md:top-[80px] z-40 bg-[#152238]/90 backdrop-blur-md py-4 px-6 rounded-xl border border-white/10 shadow-lg mb-10">
              <div className="flex justify-between items-center max-w-3xl mx-auto">
                {[
                  { id: 'details', label: '1. Details' },
                  { id: 'items', label: '2. Items' },
                  { id: 'payment', label: '3. Payment' },
                  { id: 'confirm', label: '4. Confirm' }
                ].map(step => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 font-black text-xs md:text-sm tracking-wide transition-all ${
                      activeSection === step.id ? 'text-[#F6E05E] scale-105' : 'text-white/40'
                    }`}
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <span>{step.label}</span>
                    {step.id !== 'confirm' && <ChevronRight className="w-4 h-4 text-white/20 hidden sm:block" />}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: Order Inputs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SECTION 1: BUYER IDENTITY */}
            <div 
              ref={detailsRef} 
              id="section-details" 
              className="p-4 sm:p-8 rounded-2xl border border-white/10 bg-[#152238]/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-black text-[#90CDF4] mb-6 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <User className="w-6 h-6" /> 1. DATA IDENTITAS PEMBELI
              </h2>
              
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Nama Lengkap <span className="text-[#F6E05E]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="name"
                      value={name}
                      onChange={e => { setName(e.target.value); if (touched['name']) validateField('name', e.target.value); }}
                      onBlur={() => handleBlur('name', name)}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 bg-white/5 text-white outline-none transition-all ${
                        errors.name ? 'border-red-400 focus:border-red-500' : 'border-white/10 focus:border-[#90CDF4]'
                      }`}
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="text-red-400 text-xs mt-1.5 font-bold">{errors.name}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Alamat Email <span className="text-[#F6E05E]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (touched['email']) validateField('email', e.target.value); }}
                      onBlur={() => handleBlur('email', email)}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 bg-white/5 text-white outline-none transition-all ${
                        errors.email ? 'border-red-400 focus:border-red-500' : 'border-white/10 focus:border-[#90CDF4]'
                      }`}
                      placeholder="nama@domain.com"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-red-400 text-xs mt-1.5 font-bold">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Nomor WhatsApp <span className="text-[#F6E05E]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="tel"
                        name="whatsapp"
                        value={whatsapp}
                        onChange={e => { setWhatsapp(e.target.value); if (touched['whatsapp']) validateField('whatsapp', e.target.value); }}
                        onBlur={() => handleBlur('whatsapp', whatsapp)}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 bg-white/5 text-white outline-none transition-all ${
                          errors.whatsapp ? 'border-red-400 focus:border-red-500' : 'border-white/10 focus:border-[#90CDF4]'
                        }`}
                        placeholder="Contoh: 08123456789"
                      />
                    </div>
                    {touched.whatsapp && errors.whatsapp && (
                      <p className="text-red-400 text-xs mt-1.5 font-bold">{errors.whatsapp}</p>
                    )}
                  </div>

                  {/* Instagram Username */}
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Username Instagram <span className="text-[#F6E05E]">*</span>
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        name="instagram"
                        value={insta}
                        onChange={e => handleInstagramChange(e.target.value)}
                        onBlur={() => handleBlur('instagram', insta)}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 bg-white/5 text-white outline-none transition-all ${
                          errors.instagram ? 'border-red-400 focus:border-red-500' : 'border-white/10 focus:border-[#90CDF4]'
                        }`}
                        placeholder="username (tanpa @)"
                      />
                    </div>
                    {touched.instagram && errors.instagram && (
                      <p className="text-red-400 text-xs mt-1.5 font-bold">{errors.instagram}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PILIH EVENT UTAMA */}
            <div className="p-4 sm:p-8 rounded-2xl border border-white/10 bg-[#152238]/50 backdrop-blur-sm">
              <h2 className="text-2xl font-black text-[#90CDF4] mb-6 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Calendar className="w-6 h-6" /> 2. PILIH EVENT UTAMA
              </h2>

              <p className="text-xs text-white/60 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Pilih event target yang Anda tuju untuk pesanan Cheki ini.
              </p>

              {events.length === 1 ? (
                <div className="p-5 rounded-xl border-2 border-[#90CDF4] bg-[#90CDF4]/5 flex items-start gap-4 shadow-lg shadow-[#90CDF4]/5">
                  <div className="mt-1">
                    <div className="w-5 h-5 rounded-full border-2 border-[#90CDF4] bg-[#90CDF4] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#1a2f47] stroke-[3]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {events[0].title}
                    </h3>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      📅 {events[0].date} <br />
                      📍 {events[0].venue} {events[0].location ? `(${events[0].location})` : ''}
                    </p>
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 mt-3 rounded bg-[#90CDF4]/20 border border-[#90CDF4]/30 text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Event Attending Terjadwal
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(ev => {
                    const isSelected = selectedEvent === ev.title;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev.title)}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                          isSelected
                            ? 'border-[#90CDF4] bg-[#90CDF4]/5 shadow-lg shadow-[#90CDF4]/5'
                            : 'border-white/5 bg-white/2 hover:border-white/20'
                        }`}
                      >
                        <div className="mt-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-[#90CDF4] bg-[#90CDF4]' : 'border-white/30'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#1a2f47] stroke-[3]" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base font-black text-white truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {ev.title}
                          </h3>
                          <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                            📅 {ev.date} <br />
                            📍 {ev.venue}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {eventChekiStatus && eventChekiStatus.quota !== null && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isEventChekiQuotaExceeded ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-white/60 font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Kuota Pemesanan Cheki Event:</span>
                  </div>
                  <span className={`font-black ${isEventChekiQuotaExceeded ? 'text-red-400 bg-red-950/20 px-2 py-0.5 border border-red-500/30 rounded font-bold' : 'text-[#F6E05E]'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {isEventChekiQuotaExceeded 
                      ? 'KUOTA PENUH' 
                      : `${eventChekiStatus.ordered} / ${eventChekiStatus.quota} lembar terisi (Sisa ${eventChekiStatus.remaining} lembar)`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* SECTION 3: PESANAN CHEKI */}
            <div 
              ref={itemsRef} 
              id="section-items" 
              className="p-4 sm:p-8 rounded-2xl border border-white/10 bg-[#152238]/50 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-black text-[#90CDF4] flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <ShoppingBag className="w-6 h-6" /> 3. PESANAN CHEKI
                </h2>
                <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#90CDF4]/15 border border-[#90CDF4]/30 text-[#90CDF4]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Batas Maks. 50 Lembar
                </span>
              </div>

              {!isChekiAvailable && (
                <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-amber-950/40 text-amber-200 flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 animate-pulse" />
                  <p className="text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Pre-order Cheki saat ini sedang ditutup. Anda tidak dapat menambahkan pesanan Cheki.
                  </p>
                </div>
              )}

              {isChekiAvailable && isEventChekiQuotaExceeded && (
                <div className="p-4 rounded-xl border-2 border-red-500/50 bg-red-950/40 text-red-200 flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 animate-pulse" />
                  <p className="text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Kuota pre-order Cheki untuk event "{selectedEvent}" sudah terpenuhi. Anda tidak dapat memesan Cheki.
                  </p>
                </div>
              )}

              {isChekiLimitExceeded && (
                <div className="p-4 rounded-xl border-2 border-red-500/50 bg-red-950/40 text-red-200 flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <p className="text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Total cheki Anda saat ini ({totalChekiQty}) melebihi batas maksimal 50 lembar per pesanan. Harap kurangi jumlah cheki Anda.
                  </p>
                </div>
              )}

              {/* Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  const selectedEventObj = events.find(ev => ev.title === selectedEvent);
                  const attendingLineup = selectedEventObj?.attendingMembers;
                  const displayedMembers = members.filter(m => {
                    if (!m.isActive) return false;
                    if (attendingLineup && attendingLineup.length > 0) {
                      return attendingLineup.some((am: any) => am.id === m.id);
                    }
                    return true;
                  });

                  return displayedMembers.map(member => {
                    const soloOrder = chekiOrders[`${member.id}_Solo`] || { type: 'Solo', quantity: 0 };
                    const twoShotOrder = chekiOrders[`${member.id}_Two Shot`] || { type: 'Two Shot', quantity: 0 };
                    const hasSelected = soloOrder.quantity > 0 || twoShotOrder.quantity > 0;
                    
                    const priceSolo = chekiPrices.solo;
                    const priceTwoShot = chekiPrices.twoShot;
                    const subtotal = (soloOrder.quantity * priceSolo) + (twoShotOrder.quantity * priceTwoShot);
                    
                    const remainingStock = eventChekiStatus?.member_remaining?.[member.id];
                    const totalSelectedQtyForMember = soloOrder.quantity + twoShotOrder.quantity;
                    const isMemberOutOfStock = remainingStock !== undefined && remainingStock !== null && remainingStock <= 0;

                    return (
                      <div
                        key={member.id}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                          hasSelected 
                            ? 'border-[#90CDF4] bg-[#90CDF4]/5 shadow-lg shadow-[#90CDF4]/5' 
                            : 'border-white/5 bg-white/2 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex gap-4">
                            {/* Member Image */}
                            <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 bg-[#1a2f47] flex-shrink-0">
                              <img
                                src={member.photoUrl || "https://via.placeholder.com/150/90CDF4/1a2f47?text=" + member.name}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Member details & stock badge */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                  {member.name}
                                </h3>
                                {selectedEvent && remainingStock !== undefined && remainingStock !== null && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    isMemberOutOfStock
                                      ? 'bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse'
                                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                  }`}>
                                    {isMemberOutOfStock ? 'Stok Habis' : `Sisa ${remainingStock}x`}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/40 uppercase tracking-widest mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Member
                              </p>
                            </div>
                          </div>

                          {/* COUNTERS FOR SOLO AND REGULER */}
                          <div className="mt-5 space-y-4 pt-4 border-t border-white/5">
                            {/* Row 1: Solo */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/10 p-3 rounded-lg border border-white/5">
                              <div>
                                <span className="text-xs font-black text-white block" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                  Solo ({formatRpString(priceSolo)})
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleChekiQtyChange(`${member.id}_Solo`, soloOrder.quantity - 1)}
                                  disabled={soloOrder.quantity <= 0 || !isChekiAvailable || isEventChekiQuotaExceeded}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                                >
                                  <span className="text-lg font-bold">-</span>
                                </button>

                                <input
                                  type="text"
                                  value={soloOrder.quantity === 0 ? '' : soloOrder.quantity}
                                  onChange={e => handleChekiDirectInput(`${member.id}_Solo`, e.target.value)}
                                  disabled={!isChekiAvailable || isEventChekiQuotaExceeded || isMemberOutOfStock}
                                  placeholder="0"
                                  className="w-10 text-center font-black bg-black/30 border border-white/10 rounded-lg py-1 text-sm outline-none focus:border-[#90CDF4] disabled:opacity-30"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleChekiQtyChange(`${member.id}_Solo`, soloOrder.quantity + 1)}
                                  disabled={
                                    soloOrder.quantity >= 50 || 
                                    !isChekiAvailable || 
                                    isEventChekiQuotaExceeded ||
                                    isMemberOutOfStock ||
                                    (remainingStock !== undefined && remainingStock !== null && totalSelectedQtyForMember >= remainingStock)
                                  }
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#90CDF4]/20 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                                >
                                  <span className="text-lg font-bold text-[#90CDF4]">+</span>
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Reguler (Two Shot) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/10 p-3 rounded-lg border border-white/5">
                              <div>
                                <span className="text-xs font-black text-white block" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                  Reguler ({formatRpString(priceTwoShot)})
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleChekiQtyChange(`${member.id}_Two Shot`, twoShotOrder.quantity - 1)}
                                  disabled={twoShotOrder.quantity <= 0 || !isChekiAvailable || isEventChekiQuotaExceeded}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                                >
                                  <span className="text-lg font-bold">-</span>
                                </button>

                                <input
                                  type="text"
                                  value={twoShotOrder.quantity === 0 ? '' : twoShotOrder.quantity}
                                  onChange={e => handleChekiDirectInput(`${member.id}_Two Shot`, e.target.value)}
                                  disabled={!isChekiAvailable || isEventChekiQuotaExceeded || isMemberOutOfStock}
                                  placeholder="0"
                                  className="w-10 text-center font-black bg-black/30 border border-white/10 rounded-lg py-1 text-sm outline-none focus:border-[#90CDF4] disabled:opacity-30"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleChekiQtyChange(`${member.id}_Two Shot`, twoShotOrder.quantity + 1)}
                                  disabled={
                                    twoShotOrder.quantity >= 50 || 
                                    !isChekiAvailable || 
                                    isEventChekiQuotaExceeded ||
                                    isMemberOutOfStock ||
                                    (remainingStock !== undefined && remainingStock !== null && totalSelectedQtyForMember >= remainingStock)
                                  }
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#90CDF4]/20 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                                >
                                  <span className="text-lg font-bold text-[#90CDF4]">+</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card subtotal display */}
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-xs">
                          <span className="text-white/40">Subtotal:</span>
                          <span className={`font-bold ${hasSelected ? 'text-white font-black' : 'text-white/30'}`}>
                            {formatRpString(subtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Consolidated Group Shot Card */}
                {(() => {
                  const order = chekiOrders['group_shot'] || { type: 'Group', quantity: 0 };
                  const hasSelected = order.quantity > 0;
                  const price = chekiPrices.group;
                  const subtotal = order.quantity * price;
                  const groupPhotoUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&fit=crop&q=80";

                  return (
                    <div
                      className={`p-5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        hasSelected 
                          ? 'border-[#90CDF4] bg-[#90CDF4]/5 shadow-lg shadow-[#90CDF4]/5' 
                          : 'border-white/5 bg-white/2 hover:border-white/20'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Group Image */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 bg-[#1a2f47] flex-shrink-0">
                          <img
                            src={groupPhotoUrl}
                            alt="Kirin Day Group Shot"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            GROUP SHOT
                          </h3>
                          <p className="text-xs text-white/50 font-bold mt-1">
                            Foto bersama seluruh member Kirin Day
                          </p>
                        </div>
                      </div>

                      {/* Quantity Counter & Subtotal */}
                      <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Harga Satuan
                          </p>
                          <p className="text-sm font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {formatRpString(price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Qty minus */}
                          <button
                            type="button"
                            onClick={() => handleChekiQtyChange('group_shot', order.quantity - 1)}
                            disabled={order.quantity <= 0 || !isChekiAvailable || isEventChekiQuotaExceeded}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                          >
                            <span className="text-lg font-bold">-</span>
                          </button>

                          <input
                            type="text"
                            value={order.quantity === 0 ? '' : order.quantity}
                            onChange={e => handleChekiDirectInput('group_shot', e.target.value)}
                            disabled={!isChekiAvailable || isEventChekiQuotaExceeded}
                            placeholder="0"
                            className="w-10 text-center font-black bg-black/30 border border-white/10 rounded-lg py-1 text-sm outline-none focus:border-[#90CDF4] disabled:opacity-30"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          />

                          {/* Qty plus */}
                          <button
                            type="button"
                            onClick={() => handleChekiQtyChange('group_shot', order.quantity + 1)}
                            disabled={order.quantity >= 50 || !isChekiAvailable || isEventChekiQuotaExceeded}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                          >
                            <span className="text-lg font-bold">+</span>
                          </button>
                        </div>
                      </div>

                      {/* Card subtotal display */}
                      <div className="flex justify-between items-center mt-3 pt-2 text-xs">
                        <span className="text-white/40">Subtotal:</span>
                        <span className={`font-bold ${hasSelected ? 'text-white' : 'text-white/30'}`}>
                          {formatRpString(subtotal)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* SECTION 3: MERCH ORDER */}
            <div className="p-4 sm:p-8 rounded-2xl border border-white/10 bg-[#152238]/50 backdrop-blur-sm">
              <h2 className="text-2xl font-black text-[#90CDF4] mb-6 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <ShoppingBag className="w-6 h-6" /> 3. PESANAN MERCHANDISE
              </h2>

              {!isMerchAvailable && (
                <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-amber-950/40 text-amber-200 flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 animate-pulse" />
                  <p className="text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Penjualan Merchandise saat ini sedang ditutup atau stok habis.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {merch
                  .filter(item => {
                    if (!item.isActive) return false;
                    const searchParam = searchParams.get('search');
                    if (searchParam) {
                      return item.name.toLowerCase().includes(searchParam.toLowerCase());
                    }
                    return true;
                  })
                  .map(merch => {
                    const stock = shopSettings.merch_stock_overrides?.[merch.id] !== undefined
                      ? parseInt(shopSettings.merch_stock_overrides[merch.id], 10)
                      : merch.stock;
                    const quantity = merchOrders[merch.id] || 0;
                    const hasSelected = quantity > 0;
                    const subtotal = quantity * merch.price;
                    const isOutOfStock = stock <= 0;

                    return (
                      <div
                        key={merch.id}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                          hasSelected 
                            ? 'border-[#90CDF4] bg-[#90CDF4]/5 shadow-lg shadow-[#90CDF4]/5' 
                            : 'border-white/5 bg-white/2 hover:border-white/20'
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Image */}
                          <div className="w-16 h-20 rounded-lg overflow-hidden border border-white/20 bg-[#1a2f47] flex-shrink-0">
                            <img
                              src={merch.photoUrl || "https://via.placeholder.com/150/90CDF4/1a2f47?text=" + merch.name}
                              alt={merch.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-black text-white leading-snug line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {merch.name}
                            </h3>
                            
                            {/* Stock Badge */}
                            <div className="mt-2 flex items-center gap-2">
                              {isOutOfStock ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded">
                                  Stok Habis
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                                  Tersedia: {stock}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price & Quantity controllers */}
                        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5">
                          <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              Harga
                            </p>
                            <p className="text-sm font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {formatRpString(merch.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleMerchQtyChange(merch.id, quantity - 1, stock)}
                              disabled={quantity <= 0 || isOutOfStock || !isMerchAvailable}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <span className="text-lg font-bold">-</span>
                            </button>

                            <input
                              type="text"
                              value={quantity === 0 ? '' : quantity}
                              onChange={e => handleMerchDirectInput(merch.id, e.target.value, stock)}
                              disabled={isOutOfStock || !isMerchAvailable}
                              placeholder="0"
                              className="w-10 text-center font-black bg-black/30 border border-white/10 rounded-lg py-1 text-sm outline-none focus:border-[#90CDF4] disabled:opacity-30"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            />

                            <button
                              type="button"
                              onClick={() => handleMerchQtyChange(merch.id, quantity + 1, stock)}
                              disabled={quantity >= Math.min(buyConfig.maxMerchPerItem, stock) || isOutOfStock || !isMerchAvailable}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <span className="text-lg font-bold">+</span>
                            </button>
                          </div>
                        </div>

                        {/* Card subtotal */}
                        <div className="flex justify-between items-center mt-3 pt-2 text-xs">
                          <span className="text-white/40">Subtotal:</span>
                          <span className={`font-bold ${hasSelected ? 'text-white' : 'text-white/30'}`}>
                            {formatRpString(subtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>



            {/* SECTION 5: REDEEM METHOD & NOTES */}
            <div className="p-4 sm:p-8 rounded-2xl border border-white/10 bg-[#152238]/50 backdrop-blur-sm">
              <h2 className="text-2xl font-black text-[#90CDF4] mb-6 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <MapPin className="w-6 h-6" /> 5. METODE PENGAMBILAN
              </h2>

              {/* Redeem Method Toggle cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {buyConfig.eventInfo.isActive && (
                  <div
                    onClick={() => { setRedeemMethod('event'); setErrors(prev => ({ ...prev, address: '' })); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                      redeemMethod === 'event'
                        ? 'border-[#90CDF4] bg-[#90CDF4]/5'
                        : 'border-white/5 bg-white/2 hover:border-white/20'
                    }`}
                  >
                    <div className="mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        redeemMethod === 'event' ? 'border-[#90CDF4] bg-[#90CDF4]' : 'border-white/30'
                      }`}>
                        {redeemMethod === 'event' && <Check className="w-3.5 h-3.5 text-[#1a2f47] stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Ambil di Event
                      </h3>
                      <p className="text-xs text-white/50 mt-1 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Ambil langsung di booth merchandise pada event yang Anda pilih di atas.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  onClick={() => setRedeemMethod('ship')}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    redeemMethod === 'ship'
                      ? 'border-[#90CDF4] bg-[#90CDF4]/5'
                      : 'border-white/5 bg-white/2 hover:border-white/20'
                  }`}
                >
                  <div className="mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      redeemMethod === 'ship' ? 'border-[#90CDF4] bg-[#90CDF4]' : 'border-white/30'
                    }`}>
                      {redeemMethod === 'ship' && <Check className="w-3.5 h-3.5 text-[#1a2f47] stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Kirim ke Alamat
                    </h3>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Kirim via kurir ekspedisi ke rumahmu (Ongkos kirim akan dikonfirmasi admin saat verifikasi melalui WhatsApp).
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditional address field */}
              {redeemMethod === 'ship' && (
                <div className="mb-8 animate-fadeIn">
                  <label className="block text-sm font-bold text-white/80 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Alamat Lengkap Pengiriman <span className="text-[#F6E05E]">*</span>
                  </label>
                  <textarea
                    name="shippingAddress"
                    value={shippingAddress}
                    onChange={e => { setShippingAddress(e.target.value); if (touched['address']) validateField('address', e.target.value); }}
                    onBlur={() => handleBlur('address', shippingAddress)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white/5 text-white outline-none transition-all resize-none text-sm leading-relaxed ${
                      errors.address ? 'border-red-400 focus:border-red-500' : 'border-white/10 focus:border-[#90CDF4]'
                    }`}
                    placeholder="Nama penerima, nama jalan, kelurahan, kecamatan, kota/kabupaten, provinsi, kode pos"
                  />
                  {touched.address && errors.address && (
                    <p className="text-red-400 text-xs mt-1 font-bold">{errors.address}</p>
                  )}
                </div>
              )}

              {/* SECTION 5: NOTES */}
              <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-white/80" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Catatan Tambahan (opsional)
                  </label>
                  <span className={`text-xs ${notes.length > 500 ? 'text-red-400 font-bold' : 'text-white/40'}`}>
                    {notes.length}/500
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value.slice(0, 500))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white outline-none focus:border-[#90CDF4] resize-none text-sm"
                  placeholder="Contoh: request pose atau caption foto, dll."
                />
              </div>
            </div>

            {/* SECTION 6: PAYMENT */}
            <div 
              ref={paymentRef} 
              id="section-payment" 
              className="p-4 sm:p-8 rounded-2xl border border-white/10 bg-[#152238]/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-black text-[#90CDF4] mb-6 flex items-center gap-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <Gift className="w-6 h-6" /> 6. METODE PEMBAYARAN &amp; VERIFIKASI
              </h2>

              <p className="text-xs text-white/60 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Pilih metode pembayaran di bawah, transfer sesuai nilai Grand Total, lalu unggah bukti bayar.
              </p>

              {/* Payment Methods selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { id: 'qris', label: 'QRIS' },
                  { id: 'bank_transfer', label: 'Transfer Bank' + (shopSettings.payment_bank_name ? ` (${shopSettings.payment_bank_name})` : '') }
                ].map(method => (
                  <div
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-center items-center text-center ${
                      selectedPayment === method.id
                        ? 'border-[#90CDF4] bg-[#90CDF4]/5'
                        : 'border-white/5 bg-white/2 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mb-2 ${
                      selectedPayment === method.id ? 'border-[#90CDF4] bg-[#90CDF4]' : 'border-white/30'
                    }`}>
                      {selectedPayment === method.id && <Check className="w-3 h-3 text-[#1a2f47] stroke-[3]" />}
                    </div>
                    <span className="text-xs font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {method.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected Payment Instructions */}
              {selectedPayment && (
                <div className="p-6 rounded-xl bg-black/40 border border-white/10 mb-8 animate-fadeIn">
                  {(() => {
                    if (selectedPayment === 'qris') {
                      const qrisName = shopSettings.payment_qris_name || buyConfig.paymentMethods.find(m => m.id === 'qris')?.accountName || 'Kirin Day Management';
                      const qrisImage = shopSettings.payment_qris_image || buyConfig.paymentMethods.find(m => m.id === 'qris')?.qrImageUrl || '';
                      
                      return (
                        <div className="flex flex-col items-center">
                          <p className="text-xs text-[#90CDF4] font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            PINDAI KODE QRIS BERIKUT UNTUK MEMBAYAR
                          </p>
                          {qrisImage ? (
                            <div className="p-3 bg-white rounded-lg w-48 h-48 flex items-center justify-center overflow-hidden border-2 border-[#90CDF4]">
                              <img src={qrisImage} alt="QRIS QR Code" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <p className="text-xs text-white/40">QR Code belum dikonfigurasi.</p>
                          )}
                          <p className="text-[10px] text-white/50 mt-4 leading-normal text-center">
                            Atas nama: <b>{qrisName}</b><br />
                            QRIS mendukung pembayaran Gopay, OVO, Dana, LinkAja, BCA Mobile, dll.
                          </p>
                        </div>
                      );
                    } else if (selectedPayment === 'bank_transfer') {
                      const bankName = shopSettings.payment_bank_name || 'Bank BCA';
                      const accountNumber = shopSettings.payment_bank_account_number || buyConfig.paymentMethods.find(m => m.type === 'bank_transfer')?.accountNumber || '';
                      const accountName = shopSettings.payment_bank_account_name || buyConfig.paymentMethods.find(m => m.type === 'bank_transfer')?.accountName || 'Kirin Day Management';

                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              Transfer ke {bankName}:
                            </p>
                            <h4 className="text-xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {accountNumber}
                            </h4>
                            <p className="text-xs text-[#90CDF4] font-bold mt-1">
                              A.N. {accountName}
                            </p>
                          </div>
                          {accountNumber && (
                            <button
                              type="button"
                              onClick={() => handleCopyAccount(accountNumber)}
                              className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-[#90CDF4]/20 border border-white/10 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              <Clipboard className="w-4 h-4" />
                              {copiedAccount === accountNumber ? 'Tersalin!' : 'Salin Nomor Rekening'}
                            </button>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Drag-and-drop file upload */}
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Unggah Bukti Pembayaran <span className="text-[#F6E05E]">*</span>
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-[#90CDF4]/50 rounded-xl p-8 text-center cursor-pointer transition-all bg-white/2 hover:bg-[#90CDF4]/2 flex flex-col items-center justify-center"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                  />
                  
                  {proofPreview ? (
                    <div className="flex flex-col items-center">
                      {proofPreview === 'pdf_placeholder' ? (
                        <div className="w-20 h-20 rounded bg-white/5 flex items-center justify-center border border-white/10 mb-4 text-[#90CDF4]">
                          <FileText className="w-10 h-10" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded overflow-hidden border-2 border-[#90CDF4] mb-4 shadow-lg">
                          <img src={proofPreview} alt="Bukti transfer" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <p className="text-xs font-bold text-white max-w-xs truncate">
                        {proofFile?.name}
                      </p>
                      <p className="text-[10px] text-white/40 mt-1">
                        {proofFile && (proofFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProofFile(null);
                          setProofPreview(null);
                        }}
                        className="mt-3 text-xs text-red-400 font-bold hover:underline flex items-center gap-1"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <X className="w-3.5 h-3.5" /> Hapus File
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-white/40 mb-3" />
                      <p className="text-sm font-bold text-white/80" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Tarik &amp; letakkan file bukti bayar di sini, atau klik untuk menelusuri
                      </p>
                      <p className="text-xs text-white/40 mt-2">
                        Format: JPG, PNG, WEBP, PDF (Maks. {buyConfig.paymentProofMaxSizeMB}MB)
                      </p>
                    </>
                  )}
                </div>
                {fileError && (
                  <p className="text-red-400 text-xs mt-2 font-bold">{fileError}</p>
                )}
              </div>
            </div>

            {/* ERROR BANNER */}
            {submitError && (
              <div className="p-4 rounded-xl border-2 border-red-500 bg-red-950/30 text-red-200 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <p className="text-sm font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {submitError}
                </p>
              </div>
            )}

            {/* SUBMIT BUTTON SECTION */}
            <div ref={confirmRef} id="section-confirm" className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isCartEmpty || isChekiLimitExceeded || !selectedPayment || !proofFile}
                className="w-full py-4 rounded-full bg-[#F6E05E] text-[#1a2f47] font-black hover:scale-[1.02] shadow-xl shadow-[#F6E05E]/20 transition-all duration-300 disabled:opacity-35 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-[#1a2f47]" />
                    Mengirim Pesanan...
                  </>
                ) : (
                  <>
                    KIRIM PESANAN ({formatRpString(grandTotal)})
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-white/40 text-center mt-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Dengan mengklik tombol, Anda menyetujui bahwa pesanan bersifat final dan akan diverifikasi secara manual.
              </p>
            </div>

          </div>

          {/* RIGHT: Live Summary (Desktop Sticky) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-[160px]">
            <div 
              className="p-6 rounded-2xl border border-white/10 bg-[#152238]/60 backdrop-blur-md shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
            >
              <h3 className="text-lg font-black text-[#90CDF4] border-b border-white/10 pb-4 mb-4 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <ShoppingBag className="w-5 h-5" /> RINGKASAN BELANJA
              </h3>

              {isCartEmpty ? (
                <div className="py-12 text-center text-white/30 text-sm">
                  Belum ada item dipilih
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cheki list */}
                  {activeChekiList.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#F6E05E] mb-2 tracking-wider uppercase">Cheki</h4>
                      <div className="space-y-3">
                        {activeChekiList.map(item => (
                          <div key={`${item.id}-${item.type}`} className="flex justify-between text-sm gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{item.name}</p>
                              <p className="text-xs text-white/50">{item.type} x{item.quantity}</p>
                            </div>
                            <span className="font-bold text-white/90 shrink-0">{formatRpString(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Merch list */}
                  {activeMerchList.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold text-[#F6E05E] mb-2 tracking-wider uppercase">Merch</h4>
                      <div className="space-y-3">
                        {activeMerchList.map(item => (
                          <div key={item.id} className="flex justify-between text-sm gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{item.name}</p>
                              <p className="text-xs text-white/50">Qty: {item.quantity}</p>
                            </div>
                            <span className="font-bold text-white/90 shrink-0">{formatRpString(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event info */}
                  {selectedEvent && (
                    <div className="pt-4 border-t border-white/5 text-xs text-white/60">
                      <p className="font-bold mb-1">Target Event:</p>
                      <p className="text-white/85 font-black text-[#90CDF4]">{selectedEvent}</p>
                    </div>
                  )}

                  {/* Redeem info */}
                  <div className="pt-4 border-t border-white/5 text-xs text-white/60">
                    <p className="font-bold mb-1">Metode Pengambilan:</p>
                    <p>
                      {redeemMethod === 'event' 
                        ? `Ambil di Event` 
                        : `Kirim ke Alamat (${shippingAddress || 'Alamat belum diisi'})`}
                    </p>
                  </div>

                  {/* Note info */}
                  {notes && (
                    <div className="pt-4 border-t border-white/5 text-xs text-white/40 italic truncate">
                      Catatan: "{notes}"
                    </div>
                  )}

                  {/* Totals */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm text-white/50">Grand Total:</span>
                      <span className="text-2xl font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {formatRpString(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE ONLY: Floating View Order Button & Bottom Sheet */}
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <button
              type="button"
              onClick={() => setIsMobileSummaryOpen(true)}
              className="px-6 py-3 rounded-full bg-[#90CDF4] text-[#1a2f47] font-black shadow-2xl flex items-center gap-2 border border-[#152238]/20 hover:scale-105 transition-all text-xs md:text-sm whitespace-nowrap"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <ShoppingBag className="w-4 h-4" /> 
              LIHAT KERANJANG ({formatRpString(grandTotal)})
            </button>
          </div>

          {/* Mobile Bottom Sheet Overlay */}
          {isMobileSummaryOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileSummaryOpen(false)} />
              
              {/* Sheet container */}
              <div className="relative w-full max-h-[80vh] bg-[#152238] rounded-t-3xl border-t border-white/10 p-6 z-10 overflow-y-auto animate-slideUp">
                <button
                  type="button"
                  onClick={() => setIsMobileSummaryOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>

                <h3 className="text-lg font-black text-[#90CDF4] border-b border-white/10 pb-4 mb-4 flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <ShoppingBag className="w-5 h-5" /> RINGKASAN BELANJA
                </h3>

                {isCartEmpty ? (
                  <div className="py-12 text-center text-white/30 text-sm">
                    Belum ada item dipilih
                  </div>
                ) : (
                  <div className="space-y-6 pb-20">
                    {/* Cheki list */}
                    {activeChekiList.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#F6E05E] mb-2 tracking-wider uppercase">Cheki</h4>
                        <div className="space-y-3">
                          {activeChekiList.map(item => (
                            <div key={`${item.id}-${item.type}`} className="flex justify-between text-sm gap-2">
                              <div>
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-xs text-white/50">{item.type} x{item.quantity}</p>
                              </div>
                              <span className="font-bold text-white/90">{formatRpString(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Merch list */}
                    {activeMerchList.length > 0 && (
                      <div className="pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold text-[#F6E05E] mb-2 tracking-wider uppercase">Merch</h4>
                        <div className="space-y-3">
                          {activeMerchList.map(item => (
                            <div key={item.id} className="flex justify-between text-sm gap-2">
                              <div>
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-xs text-white/50">Qty: {item.quantity}</p>
                              </div>
                              <span className="font-bold text-white/90">{formatRpString(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Event info */}
                    {selectedEvent && (
                      <div className="pt-4 border-t border-white/5 text-xs text-white/60">
                        <p className="font-bold mb-1">Target Event:</p>
                        <p className="text-white/85 font-black text-[#90CDF4]">{selectedEvent}</p>
                      </div>
                    )}

                    {/* Redeem info */}
                    <div className="pt-4 border-t border-white/5 text-xs text-white/60">
                      <p className="font-bold mb-1">Metode Pengambilan:</p>
                      <p>
                        {redeemMethod === 'event' 
                          ? `Ambil di Event` 
                          : `Kirim ke Alamat (${shippingAddress || 'Alamat belum diisi'})`}
                      </p>
                    </div>

                    {/* Notes info */}
                    {notes && (
                      <div className="pt-4 border-t border-white/5 text-xs text-white/40 italic">
                        Catatan: "{notes}"
                      </div>
                    )}

                    {/* Totals */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm text-white/50">Grand Total:</span>
                        <span className="text-2xl font-black text-[#F6E05E]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {formatRpString(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </form>
          </>
        )}
      </div>
    </div>
  );
}
