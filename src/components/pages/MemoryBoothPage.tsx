import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowLeft, ArrowRight, Upload, Download, RefreshCw, 
  Smile, Calendar, Check, X, ZoomIn, RotateCw, Image as ImageIcon, Video, HelpCircle
} from 'lucide-react';

// Import template frame assets
import default1s from '../../assets/Default - 1s.png';
import default2s from '../../assets/Default - 2s.png';
import default4s from '../../assets/Default - 4s.png';

interface SlotData {
  file: File | null;
  url: string | null;      // Local blob URL
  type: 'image' | 'video' | null;
  zoom: number;            // 1.0 to 3.0
  rotation: number;        // -180 to 180 degrees
  offsetX: number;         // offset X in pixels
  offsetY: number;         // offset Y in pixels
  filter: string;          // filter style
}

interface LayoutConfig {
  width: number;
  height: number;
  bgImage: string;
  slots: { x: number; y: number; w: number; h: number }[];
}

const LAYOUTS: Record<'1s' | '2s' | '4s', LayoutConfig> = {
  '1s': {
    width: 1080,
    height: 1107,
    bgImage: default1s,
    slots: [{ x: 54, y: 54, w: 972, h: 729 }]
  },
  '2s': {
    width: 1080,
    height: 1890,
    bgImage: default2s,
    slots: [
      { x: 54, y: 54, w: 972, h: 729 },
      { x: 54, y: 837, w: 972, h: 729 }
    ]
  },
  '4s': {
    width: 1080,
    height: 3456,
    bgImage: default4s,
    slots: [
      { x: 54, y: 54, w: 972, h: 729 },
      { x: 54, y: 837, w: 972, h: 729 },
      { x: 54, y: 1620, w: 972, h: 729 },
      { x: 54, y: 2403, w: 972, h: 729 }
    ]
  }
};

const THEMES = [
  { id: 'default', name: 'Default White', bgColor: '#ffffff', textColor: '#1a2f47' },
  { id: 'signature', name: 'Kirin Gold', bgColor: '#1a2f47', textColor: '#F6E05E' },
  { id: 'blossom', name: 'Pastel Clouds', bgColor: 'linear-gradient(135deg, #FFD3E8 0%, #D6E4FF 100%)', textColor: '#5b6b95' },
  { id: 'filmstrip', name: 'Retro Film', bgColor: '#0d0d0d', textColor: '#ffffff' },
  { id: 'neon', name: 'Neon Dream', bgColor: '#0c061a', textColor: '#00f0ff' }
];

const FILTERS = [
  { id: 'none', name: 'Original', css: '' },
  { id: 'bw', name: 'B&W', css: 'grayscale(100%)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(40%) contrast(90%) brightness(105%)' },
  { id: 'warm', name: 'Warm Sun', css: 'sepia(20%) saturate(125%) hue-rotate(-5deg)' },
  { id: 'cool', name: 'Neon Cyber', css: 'saturate(130%) hue-rotate(180deg) brightness(95%)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(100%) contrast(140%) brightness(90%)' }
];

// Helper to pre-load image sources as HTMLImageElements
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

export function MemoryBoothPage() {
  const navigate = useNavigate();

  // Wizard Steps: 'splash' | 'layout' | 'frame' | 'workspace' | 'preview'
  const [step, setStep] = useState<'splash' | 'layout' | 'frame' | 'workspace' | 'preview'>('splash');
  
  const [layout, setLayout] = useState<'1s' | '2s' | '4s'>('4s');
  const [mediaMode, setMediaMode] = useState<'photo' | 'video'>('photo');
  const [theme, setTheme] = useState<string>('signature');
  const [customText, setCustomText] = useState<string>('KIRIN DAY');
  const [showDate, setShowDate] = useState<boolean>(true);

  // Slots State
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  // Modals & Export Status
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<'story' | 'strip'>('story'); // 'story' (9:16) or 'strip' (exact frame size)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // HTML Element Refs for Preview & Canvas Exports
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging interaction state
  const isDragging = useRef<boolean>(false);
  const startDragPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load layout configurations
  const config = LAYOUTS[layout];

  // Sync slots size when layout changes
  useEffect(() => {
    const slotCount = layout === '1s' ? 1 : layout === '2s' ? 2 : 4;
    setSlots(
      Array.from({ length: slotCount }, () => ({
        file: null,
        url: null,
        type: null,
        zoom: 1.0,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        filter: 'none'
      }))
    );
    setActiveSlotIndex(0);
  }, [layout]);

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      slots.forEach(slot => {
        if (slot.url) URL.revokeObjectURL(slot.url);
      });
    };
  }, []);

  // Fetch frame overlays dynamically from Contentful
  const [contentfulFrames, setContentfulFrames] = useState<any[]>([]);

  useEffect(() => {
    const fetchContentfulFrames = async () => {
      try {
        const { client } = await import('../../lib/contentful');
        const response = await client.getEntries({
          content_type: 'frameDesign',
        });
        
        const items = response.items.map((item: any) => {
          const fields = item.fields;
          const imageUrl = fields.image?.fields?.file?.url;
          return {
            id: item.sys.id,
            name: fields.name || fields.title || 'Custom Frame',
            bgColor: fields.bgColor || '#1a2f47',
            textColor: fields.textColor || '#ffffff',
            layout: fields.layout || '4s',
            imageUrl: imageUrl ? (imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl) : null,
            isContentful: true
          };
        }).filter(f => f.imageUrl !== null);

        setContentfulFrames(items);
      } catch (err) {
        console.warn("Contentful frameDesign content type not found or failed to fetch. Falling back to local styles.", err);
      }
    };

    fetchContentfulFrames();
  }, []);

  // Merge local themes with Contentful frames
  const availableThemes = [
    ...THEMES,
    ...contentfulFrames.filter(f => f.layout === layout)
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeSlotIndex === null || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const isVideo = file.type.startsWith('video/');
    
    // Validate media mode
    if (mediaMode === 'photo' && isVideo) {
      alert("Format video terdeteksi. Silakan ubah mode ke 'Videostrip' untuk memasukkan video.");
      return;
    }
    if (mediaMode === 'video' && !isVideo) {
      alert("Format gambar terdeteksi. Silakan ubah mode ke 'Photostrip' untuk memasukkan gambar.");
      return;
    }

    const fileUrl = URL.createObjectURL(file);

    // Update active slot
    setSlots(prev => prev.map((s, idx) => {
      if (idx === activeSlotIndex) {
        // Clean up previous URL if it exists
        if (s.url) URL.revokeObjectURL(s.url);
        return {
          ...s,
          file,
          url: fileUrl,
          type: isVideo ? 'video' : 'image',
          zoom: 1.0,
          rotation: 0,
          offsetX: 0,
          offsetY: 0
        };
      }
      return s;
    }));
  };

  const triggerFileInput = (idx: number) => {
    setActiveSlotIndex(idx);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.accept = mediaMode === 'video' ? 'video/*' : 'image/*';
      fileInputRef.current.click();
    }
  };

  const clearSlot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlots(prev => prev.map((s, i) => {
      if (i === idx) {
        if (s.url) URL.revokeObjectURL(s.url);
        return {
          file: null,
          url: null,
          type: null,
          zoom: 1.0,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          filter: 'none'
        };
      }
      return s;
    }));
  };

  // Dragging event handlers for panning the images inside slots
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, idx: number) => {
    if (idx !== activeSlotIndex) {
      setActiveSlotIndex(idx);
      return;
    }

    const slot = slots[idx];
    if (!slot.url) return;

    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    startDragPos.current = { x: clientX, y: clientY };
    startOffset.current = { x: slot.offsetX, y: slot.offsetY };
  };

  // Bind global drag listeners for smooth drag experience
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || activeSlotIndex === null) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startDragPos.current.x;
      const deltaY = clientY - startDragPos.current.y;

      setSlots(prev => prev.map((s, idx) => {
        if (idx === activeSlotIndex) {
          return {
            ...s,
            offsetX: startOffset.current.x + deltaX / s.zoom,
            offsetY: startOffset.current.y + deltaY / s.zoom
          };
        }
        return s;
      }));
    };

    const handleGlobalEnd = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove, { passive: true });
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [activeSlotIndex]);

  const updateActiveSlotProperty = (prop: 'zoom' | 'rotation' | 'filter', value: any) => {
    if (activeSlotIndex === null) return;
    setSlots(prev => prev.map((s, idx) => {
      if (idx === activeSlotIndex) {
        return { ...s, [prop]: value };
      }
      return s;
    }));
  };

  // Check if all slots are filled
  const isWorkspaceComplete = slots.every(s => s.url !== null);

  // Render the Frame and text onto canvas dynamically
  const drawFrameAndDecorations = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    themeId: string,
    textVal: string,
    showDateVal: boolean
  ) => {
    const activeTheme = availableThemes.find(t => t.id === themeId) || THEMES[0];
    const isContentfulTheme = activeTheme && 'isContentful' in activeTheme && activeTheme.isContentful;

    // 1. Draw Background
    if (isContentfulTheme) {
      ctx.fillStyle = activeTheme.bgColor;
      ctx.fillRect(0, 0, width, height);
    } else if (themeId === 'blossom') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#FFD3E8');
      grad.addColorStop(1, '#D6E4FF');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = activeTheme.bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Destination-Out erases the transparent slots
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    config.slots.forEach(slot => {
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    });
    ctx.restore();

    // 3. Draw Overlay Image (Default or Contentful PNG)
    if (isContentfulTheme) {
      try {
        const frameImg = await loadImage(activeTheme.imageUrl);
        ctx.drawImage(frameImg, 0, 0, width, height);
      } catch (err) {
        console.error("Error loading Contentful frame image:", err);
      }
    } else if (themeId === 'default') {
      try {
        const frameImg = await loadImage(config.bgImage);
        ctx.drawImage(frameImg, 0, 0);
      } catch (err) {
        console.error("Error loading default template frame:", err);
      }
    }

    // 4. Draw Custom Theme borders and decals (only for local themes!)
    if (!isContentfulTheme) {
      config.slots.forEach(slot => {
        ctx.save();
        if (themeId === 'signature') {
          ctx.strokeStyle = '#F6E05E';
          ctx.lineWidth = 6;
          ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
        } else if (themeId === 'blossom') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6;
          ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
        } else if (themeId === 'neon') {
          ctx.strokeStyle = '#ff007f';
          ctx.shadowColor = '#ff007f';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 2;
          ctx.strokeRect(slot.x - 3, slot.y - 3, slot.w + 6, slot.h + 6);
          ctx.strokeStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 15;
          ctx.lineWidth = 5;
          ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
        } else if (themeId === 'filmstrip') {
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 2;
          ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
        }
        ctx.restore();
      });

      // 5. Draw Decals
      ctx.save();
      if (themeId === 'signature') {
        // Draw Gold Stars
        ctx.fillStyle = '#F6E05E';
        const drawStarDecal = (cx: number, cy: number, r: number) => {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(cx + Math.cos((18 + i * 72) * Math.PI / 180) * r, cy - Math.sin((18 + i * 72) * Math.PI / 180) * r);
            ctx.lineTo(cx + Math.cos((54 + i * 72) * Math.PI / 180) * (r/2), cy - Math.sin((54 + i * 72) * Math.PI / 180) * (r/2));
          }
          ctx.closePath();
          ctx.fill();
        };
        drawStarDecal(35, height - 162, 14);
        drawStarDecal(width - 35, height - 162, 14);
      } else if (themeId === 'blossom') {
        // Draw clouds on margins
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const drawCloud = (cx: number, cy: number, r: number) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.8, 0, Math.PI * 2);
          ctx.arc(cx - r * 0.7, cy - r * 0.1, r * 0.7, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        };
        drawCloud(70, height - 162, 25);
        drawCloud(width - 80, height - 200, 20);
      } else if (themeId === 'filmstrip') {
        // Draw Film sprocket holes on left and right margins
        ctx.fillStyle = '#222222';
        for (let sy = 25; sy < height - 25; sy += 85) {
          // Left
          ctx.fillRect(15, sy, 18, 30);
          // Right
          ctx.fillRect(width - 33, sy, 18, 30);
        }
      } else if (themeId === 'neon') {
        // Draw cyber Grid dots on margins
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        for (let gx = 20; gx < width; gx += 40) {
          ctx.fillRect(gx, height - 280, 2, 2);
          ctx.fillRect(gx, height - 80, 2, 2);
        }
      }
      ctx.restore();
    }

    // 6. Draw Texts
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Choose font color & family
    ctx.fillStyle = activeTheme.textColor;
    ctx.font = 'bold 36px Montserrat, sans-serif';
    
    // Draw Branding Text centered in the 324px bottom area
    const textY = height - 162;
    ctx.fillText(textVal.toUpperCase(), width / 2, textY - (showDateVal ? 20 : 0));

    // Draw Date
    if (showDateVal) {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      ctx.font = '500 20px Montserrat, sans-serif';
      ctx.fillStyle = themeId === 'default' ? '#718096' : activeTheme.textColor + 'cc';
      ctx.fillText(formattedDate, width / 2, textY + 30);
    }
    ctx.restore();
  };

  // Compile full-res photostrip (flat)
  const compileStaticStripCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not construct 2D context");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Photos behind first
    for (let i = 0; i < config.slots.length; i++) {
      const slot = config.slots[i];
      const slotState = slots[i];
      if (!slotState.url) continue;

      ctx.save();
      
      // Clip to slot boundary
      ctx.beginPath();
      ctx.rect(slot.x, slot.y, slot.w, slot.h);
      ctx.clip();

      const img = await loadImage(slotState.url);

      // Compute "Cover" dimensions
      const slotAspect = slot.w / slot.h;
      const imgAspect = img.width / img.height;
      let drawW = slot.w;
      let drawH = slot.h;
      
      if (imgAspect > slotAspect) {
        drawH = slot.h;
        drawW = slot.h * imgAspect;
      } else {
        drawW = slot.w;
        drawH = slot.w / imgAspect;
      }

      // Center and translate
      const centerX = slot.x + slot.w / 2;
      const centerY = slot.y + slot.h / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((slotState.rotation * Math.PI) / 180);
      ctx.scale(slotState.zoom, slotState.zoom);

      // Apply Canvas Filter
      if (slotState.filter !== 'none') {
        const filterDef = FILTERS.find(f => f.id === slotState.filter);
        if (filterDef && filterDef.css) {
          ctx.filter = filterDef.css;
        }
      }

      // Draw
      ctx.drawImage(
        img,
        -drawW / 2 + slotState.offsetX,
        -drawH / 2 + slotState.offsetY,
        drawW,
        drawH
      );

      ctx.filter = 'none';
      ctx.restore();
    }

    // 2. Draw Frame Overlay and decorations
    await drawFrameAndDecorations(ctx, canvas.width, canvas.height, theme, customText, showDate);

    return canvas;
  };

  // Compile standard 9:16 Insta Story wrap canvas
  const compileStoryCanvas = (stripCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return stripCanvas;

    // 1. Draw beautiful Story Background matching the theme
    const activeTheme = availableThemes.find(t => t.id === theme) || THEMES[0];
    const isContentfulTheme = activeTheme && 'isContentful' in activeTheme && activeTheme.isContentful;

    if (isContentfulTheme) {
      ctx.fillStyle = activeTheme.bgColor;
      ctx.fillRect(0, 0, 1080, 1920);
    } else if (theme === 'default') {
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, 1080, 1920);
    } else if (theme === 'filmstrip') {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 1080, 1920);
    } else if (theme === 'signature') {
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#0f1f33');
      grad.addColorStop(1, '#1a2f47');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);
    } else if (theme === 'blossom') {
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#FFE8F3');
      grad.addColorStop(1, '#E6EFFF');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);
    } else if (theme === 'neon') {
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#090414');
      grad.addColorStop(1, '#1b0933');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);
    }

    // 2. Draw Strip Canvas Centered & Scaled
    const stripH = stripCanvas.height;
    const stripW = stripCanvas.width;

    if (layout === '2s') {
      // 2-shot fits 9:16 almost perfectly, draw it centered
      const drawY = (1920 - stripH) / 2;
      ctx.drawImage(stripCanvas, 0, drawY);
    } else if (layout === '1s') {
      // 1-shot (1107px), center it
      const drawY = (1920 - stripH) / 2;
      ctx.drawImage(stripCanvas, 0, drawY);
    } else if (layout === '4s') {
      // 4-shot (3456px) needs scaling to fit within 1920px height
      // Max strip height = 1760px (gives 80px margin top/bottom)
      const maxH = 1760;
      const scale = maxH / stripH;
      const drawW = stripW * scale;
      const drawH = stripH * scale;
      const drawX = (1080 - drawW) / 2;
      const drawY = (1920 - drawH) / 2;
      
      // Draw subtle shadow for premium effect
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(stripCanvas, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    return canvas;
  };

  const handleGenerate = async () => {
    setShowConfirmModal(false);
    setIsGenerating(true);
    
    try {
      if (mediaMode === 'photo') {
        const stripCanvas = await compileStaticStripCanvas();
        
        let finalCanvas = stripCanvas;
        if (exportMode === 'story') {
          finalCanvas = compileStoryCanvas(stripCanvas);
        }

        const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.92);
        setGeneratedUrl(dataUrl);
        setStep('preview');
      } else {
        // Videostrip record sequence
        await recordVideoStrip();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses gambar.");
    } finally {
      setIsGenerating(false);
    }
  };

  // MediaRecorder canvas loop animation
  const recordVideoStrip = async () => {
    // 1. Create drawing canvas
    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context construction failed");

    // Let's load the video elements
    const vids = videoRefs.current.filter(v => v !== null) as HTMLVideoElement[];
    if (vids.length === 0) return;

    // Reset video playbacks
    vids.forEach(v => {
      v.currentTime = 0;
      v.play().catch(e => console.log("Video auto play failed:", e));
    });

    // Canvas stream & recorder
    const stream = canvas.captureStream(30); // 30 fps
    
    // Choose mimetype
    let options = { mimeType: 'video/webm;codecs=vp9' };
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      } catch (e2) {
        recorder = new MediaRecorder(stream);
      }
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    // Render loop function
    let animId: number;
    let frameCount = 0;

    const renderLoop = async () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw active frames of videos in slots
      for (let i = 0; i < config.slots.length; i++) {
        const slot = config.slots[i];
        const slotState = slots[i];
        const video = videoRefs.current[i];

        if (slotState.url && video && video.readyState >= 2) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(slot.x, slot.y, slot.w, slot.h);
          ctx.clip();

          // Cover calculations
          const slotAspect = slot.w / slot.h;
          const videoAspect = video.videoWidth / video.videoHeight;
          let drawW = slot.w;
          let drawH = slot.h;

          if (videoAspect > slotAspect) {
            drawH = slot.h;
            drawW = slot.h * videoAspect;
          } else {
            drawW = slot.w;
            drawH = slot.w / videoAspect;
          }

          const centerX = slot.x + slot.w / 2;
          const centerY = slot.y + slot.h / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((slotState.rotation * Math.PI) / 180);
          ctx.scale(slotState.zoom, slotState.zoom);

          // Apply filters
          if (slotState.filter !== 'none') {
            const filterDef = FILTERS.find(f => f.id === slotState.filter);
            if (filterDef && filterDef.css) {
              ctx.filter = filterDef.css;
            }
          }

          ctx.drawImage(
            video,
            -drawW / 2 + slotState.offsetX,
            -drawH / 2 + slotState.offsetY,
            drawW,
            drawH
          );

          ctx.filter = 'none';
          ctx.restore();
        }
      }

      // Draw overlay frame
      await drawFrameAndDecorations(ctx, canvas.width, canvas.height, theme, customText, showDate);

      // Record frames
      animId = requestAnimationFrame(renderLoop);
    };

    // Begin loop and start recorder
    renderLoop();
    recorder.start();

    // Record for exactly 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Stop recorder & loop
    recorder.stop();
    cancelAnimationFrame(animId);
    vids.forEach(v => v.pause());

    // Construct resulting blob URL
    return new Promise<void>((resolve) => {
      recorder.onstop = () => {
        // Use standard WebM format
        const blob = new Blob(chunks, { type: 'video/webm' });
        const finalUrl = URL.createObjectURL(blob);
        setGeneratedUrl(finalUrl);
        setStep('preview');
        resolve();
      };
    });
  };

  const handleDownload = () => {
    if (!generatedUrl) return;
    const a = document.createElement('a');
    a.href = generatedUrl;
    a.download = `kirinday_memory_${layout}_${mediaMode === 'photo' ? 'strip.jpg' : 'video.webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reset the wizard to create another
  const resetWorkspace = () => {
    slots.forEach(slot => {
      if (slot.url) URL.revokeObjectURL(slot.url);
    });
    setStep('layout');
    setGeneratedUrl(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 text-white overflow-x-hidden flex flex-col items-center">
      {/* Background Gradients */}
      <div className="fixed inset-0 bg-[#1a2f47] -z-20" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#F6E05E]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-[#90CDF4]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="w-full max-w-4xl flex flex-col items-center flex-grow">
        
        {/* Step Indicator Header (Hidden in Splash & Preview) */}
        {step !== 'splash' && step !== 'preview' && (
          <div className="w-full flex items-center justify-between mb-8 max-w-2xl px-4">
            <button 
              onClick={() => {
                if (step === 'layout') setStep('splash');
                if (step === 'frame') setStep('layout');
                if (step === 'workspace') setStep('frame');
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1 text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${step === 'layout' ? 'bg-[#F6E05E]' : 'bg-white/30'}`} />
              <span className={`w-2.5 h-2.5 rounded-full ${step === 'frame' ? 'bg-[#F6E05E]' : 'bg-white/30'}`} />
              <span className={`w-2.5 h-2.5 rounded-full ${step === 'workspace' ? 'bg-[#F6E05E]' : 'bg-white/30'}`} />
            </div>
            <div className="w-16" /> {/* Spacer */}
          </div>
        )}

        {/* 1. SPLASH SCREEN STEP */}
        {step === 'splash' && (
          <div className="flex-grow flex flex-col items-center justify-center text-center max-w-2xl py-12 px-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-[#F6E05E]/10 border-2 border-[#F6E05E]/30 flex items-center justify-center text-[#F6E05E] mb-8 animate-pulse">
              <Sparkles className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#FFFCE0] mb-6">
              KIRIN DAY MEMORY BOOTH
            </h1>
            <p className="text-lg text-[#FFFCE0]/80 leading-relaxed mb-8 max-w-lg">
              Kirin Day akan hiatus sementara untuk mempersiapkan diri agar kembali lebih kuat. 
              <br />
              <span className="font-bold text-[#F6E05E]">Ini bukanlah perpisahan selamanya</span>, melainkan janji untuk pertemuan kita berikutnya. 
              Mari abadikan kenangan indah kita bersama dalam bentuk Photostrip &amp; Videostrip custom!
            </p>
            <button 
              onClick={() => setStep('layout')}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#F6E05E] to-[#90CDF4] text-[#1a2f47] font-black text-lg tracking-wider shadow-lg hover:shadow-[#F6E05E]/20 hover:scale-105 transition-all duration-300 flex items-center gap-3 group"
            >
              Mulai Membuat <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* 2. LAYOUT SELECTION STEP */}
        {step === 'layout' && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-2">Pilih Layout &amp; Media</h2>
            <p className="text-[#FFFCE0]/70 text-center mb-8">Pilih tipe strip dan format slots yang ingin digunakan</p>

            {/* Media Mode Selector */}
            <div className="flex bg-white/5 p-1.5 rounded-full border border-white/10 mb-10 w-full max-w-xs justify-between">
              <button 
                onClick={() => setMediaMode('photo')}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  mediaMode === 'photo' ? 'bg-[#F6E05E] text-[#1a2f47] shadow-md' : 'hover:bg-white/5'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Photostrip
              </button>
              <button 
                onClick={() => setMediaMode('video')}
                className={`flex-1 py-2.5 px-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  mediaMode === 'video' ? 'bg-[#90CDF4] text-[#1a2f47] shadow-md' : 'hover:bg-white/5'
                }`}
              >
                <Video className="w-4 h-4" /> Videostrip
              </button>
            </div>

            {/* Layout Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4 mb-10">
              {/* 1s Layout */}
              <div 
                onClick={() => setLayout('1s')}
                className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col items-center ${
                  layout === '1s' 
                    ? 'bg-white/10 border-[#F6E05E] shadow-[0_0_20px_rgba(246,224,94,0.15)] scale-102' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-24 h-24 border border-dashed border-white/30 rounded-lg bg-white/5 mb-6 flex flex-col items-center justify-center p-2">
                  <div className="w-full h-16 bg-white/10 rounded-sm mb-1" />
                  <div className="w-6 h-1.5 bg-white/20 rounded-full" />
                </div>
                <h3 className="font-bold text-lg mb-1">1 Shot (Polaroid)</h3>
                <p className="text-xs text-white/50 text-center">Cocok untuk foto tunggal ala polaroid instan</p>
              </div>

              {/* 2s Layout */}
              <div 
                onClick={() => setLayout('2s')}
                className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col items-center ${
                  layout === '2s' 
                    ? 'bg-white/10 border-[#F6E05E] shadow-[0_0_20px_rgba(246,224,94,0.15)] scale-102' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-24 h-24 border border-dashed border-white/30 rounded-lg bg-white/5 mb-6 flex flex-col items-center justify-center gap-1.5 p-2">
                  <div className="w-full h-7 bg-white/10 rounded-sm" />
                  <div className="w-full h-7 bg-white/10 rounded-sm" />
                  <div className="w-6 h-1.5 bg-white/20 rounded-full" />
                </div>
                <h3 className="font-bold text-lg mb-1">2 Shots (Grid)</h3>
                <p className="text-xs text-white/50 text-center">Pas dengan rasio layar Story 9:16 asli</p>
              </div>

              {/* 4s Layout */}
              <div 
                onClick={() => setLayout('4s')}
                className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col items-center ${
                  layout === '4s' 
                    ? 'bg-white/10 border-[#F6E05E] shadow-[0_0_20px_rgba(246,224,94,0.15)] scale-102' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-20 h-24 border border-dashed border-white/30 rounded-lg bg-white/5 mb-6 flex flex-col items-center justify-center gap-1 p-1">
                  <div className="w-full h-3.5 bg-white/10 rounded-xs" />
                  <div className="w-full h-3.5 bg-white/10 rounded-xs" />
                  <div className="w-full h-3.5 bg-white/10 rounded-xs" />
                  <div className="w-full h-3.5 bg-white/10 rounded-xs" />
                  <div className="w-6 h-1 bg-white/20 rounded-full" />
                </div>
                <h3 className="font-bold text-lg mb-1">4 Shots (Classic)</h3>
                <p className="text-xs text-white/50 text-center">Format photostrip legendaris 4 potong</p>
              </div>
            </div>

            <button 
              onClick={() => setStep('frame')}
              className="px-8 py-3.5 rounded-full bg-[#F6E05E] text-[#1a2f47] font-black tracking-wide hover:scale-105 transition-transform shadow-lg"
            >
              Lanjutkan Ke Desain Frame
            </button>
          </div>
        )}

        {/* 3. FRAME THEME SELECTION STEP */}
        {step === 'frame' && (
          <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-2">Pilih Desain Frame</h2>
            <p className="text-[#FFFCE0]/70 text-center mb-8">Pilih style warna dan ornamen frame luar</p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full px-4 mb-10">
              {availableThemes.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col items-center text-center ${
                    theme === t.id 
                      ? 'bg-white/10 border-[#F6E05E] shadow-md scale-102' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div 
                    className="w-12 h-16 rounded-md mb-3 border border-white/10 flex flex-col justify-between p-1.5"
                    style={{ background: t.bgColor }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="w-full h-2.5 bg-black/10 rounded-xs" />
                      <div className="w-full h-2.5 bg-black/10 rounded-xs" />
                    </div>
                    <div className="w-full h-1 bg-black/20 rounded-full" />
                  </div>
                  <span className="font-bold text-sm">{t.name}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setStep('workspace')}
              className="px-8 py-3.5 rounded-full bg-[#F6E05E] text-[#1a2f47] font-black tracking-wide hover:scale-105 transition-transform shadow-lg"
            >
              Mulai Susun Gambar
            </button>
          </div>
        )}

        {/* 4. WORKSPACE STEP */}
        {step === 'workspace' && (
          <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-center px-4 animate-fade-in">
            
            {/* Left: Preview Canvas Mockup (Responsive 9:16 layout) */}
            <div className="w-full md:w-auto flex-shrink-0 flex flex-col items-center justify-center self-center md:self-auto">
              <div 
                ref={previewContainerRef}
                className="relative select-none overflow-hidden aspect-[9/16] bg-[#1a2f47] w-[300px] md:w-[360px] shadow-2xl rounded-2xl border border-white/10 flex flex-col items-center justify-center"
              >
                {/* Dynamically Styled Frame Background */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    background: theme === 'blossom' ? 'linear-gradient(135deg, #FFD3E8 0%, #D6E4FF 100%)' : 
                                theme === 'signature' ? '#1a2f47' : 
                                theme === 'filmstrip' ? '#0d0d0d' : 
                                theme === 'neon' ? '#0c061a' : '#ffffff'
                  }}
                />

                {/* Grid Dot Decals for Neon Theme */}
                {theme === 'neon' && (
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ff007f_1px,transparent_1px)] [background-size:20px_20px] z-0" />
                )}

                {/* Slots */}
                {config.slots.map((slot, idx) => {
                  const state = slots[idx];
                  if (!state) return null;
                  
                  // Calculate responsive percentages
                  const pLeft = (slot.x / config.width) * 100;
                  const pWidth = (slot.w / config.width) * 100;
                  const pTop = (slot.y / config.height) * 100;
                  const pHeight = (slot.h / config.height) * 100;

                  const isCurrent = idx === activeSlotIndex;

                  return (
                    <div 
                      key={idx}
                      onClick={() => setActiveSlotIndex(idx)}
                      onMouseDown={(e) => handleDragStart(e, idx)}
                      onTouchStart={(e) => handleDragStart(e, idx)}
                      className={`absolute overflow-hidden cursor-move border-2 transition-colors z-10 ${
                        isCurrent ? 'border-[#F6E05E]' : 'border-transparent'
                      } ${!state.url ? 'bg-white/5 border-dashed border-white/20 hover:bg-white/10' : ''}`}
                      style={{
                        left: `${pLeft}%`,
                        width: `${pWidth}%`,
                        top: `${pTop}%`,
                        height: `${pHeight}%`
                      }}
                    >
                      {/* Active Slot Indicator Outline */}
                      {isCurrent && (
                        <div className="absolute inset-0 border border-[#F6E05E]/40 animate-pulse pointer-events-none z-30" />
                      )}

                      {/* Clear Button */}
                      {state.url && (
                        <button 
                          onClick={(e) => clearSlot(idx, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-30 pointer-events-auto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Slot Content */}
                      {state.url ? (
                        <div className="w-full h-full relative pointer-events-none">
                          {state.type === 'video' ? (
                            <video 
                              ref={el => { videoRefs.current[idx] = el; }}
                              src={state.url}
                              loop 
                              muted 
                              autoPlay 
                              playsInline
                              className="w-full h-full object-cover origin-center"
                              style={{
                                transform: `translate(${state.offsetX}px, ${state.offsetY}px) rotate(${state.rotation}deg) scale(${state.zoom})`,
                                filter: FILTERS.find(f => f.id === state.filter)?.css || 'none'
                              }}
                            />
                          ) : (
                            <img 
                              src={state.url}
                              alt={`Slot ${idx + 1}`}
                              className="w-full h-full object-cover origin-center"
                              style={{
                                transform: `translate(${state.offsetX}px, ${state.offsetY}px) rotate(${state.rotation}deg) scale(${state.zoom})`,
                                filter: FILTERS.find(f => f.id === state.filter)?.css || 'none'
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 select-none pointer-events-none text-white/50">
                          {mediaMode === 'video' ? <Video className="w-6 h-6 mb-2" /> : <Upload className="w-6 h-6 mb-2" />}
                          <span className="text-[10px] font-bold tracking-wider">TAP UNTUK UPLOAD</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Programmatic Overlays (Decals, Borders, Logos, Text) */}
                
                {/* 1. Theme-Specific Borders around Slots */}
                {config.slots.map((slot, idx) => {
                  const pLeft = (slot.x / config.width) * 100;
                  const pWidth = (slot.w / config.width) * 100;
                  const pTop = (slot.y / config.height) * 100;
                  const pHeight = (slot.h / config.height) * 100;
                  
                  return (
                    <div 
                      key={`border-${idx}`}
                      className="absolute pointer-events-none z-20"
                      style={{
                        left: `${pLeft}%`,
                        width: `${pWidth}%`,
                        top: `${pTop}%`,
                        height: `${pHeight}%`,
                        boxShadow: theme === 'neon' ? '0 0 10px rgba(0,240,255,0.4), inset 0 0 10px rgba(0,240,255,0.2)' : 'none',
                        border: theme === 'signature' ? '3px solid #F6E05E' :
                                theme === 'blossom' ? '3px solid #ffffff' :
                                theme === 'neon' ? '3px solid #00f0ff' : 
                                theme === 'filmstrip' ? '1px solid #222' : '2px solid #e2e8f0'
                      }}
                    />
                  );
                })}

                {/* 2. Theme-Specific Decals (Stars, Clouds, Film Rolls) */}
                {theme === 'signature' && (
                  <>
                    <Sparkles className="absolute left-3 bottom-[6%] w-4 h-4 text-[#F6E05E] pointer-events-none" />
                    <Sparkles className="absolute right-3 bottom-[6%] w-4 h-4 text-[#F6E05E] pointer-events-none" />
                  </>
                )}
                {theme === 'blossom' && (
                  <>
                    {/* Clouds */}
                    <div className="absolute left-4 bottom-[6%] w-8 h-5 bg-white/70 rounded-full blur-[0.5px]" />
                    <div className="absolute left-8 bottom-[7%] w-6 h-4 bg-white/70 rounded-full blur-[0.5px]" />
                    <div className="absolute right-5 bottom-[8%] w-8 h-4 bg-white/60 rounded-full blur-[0.5px]" />
                  </>
                )}
                {theme === 'filmstrip' && (
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-10">
                    {/* Sprocket Holes Column Left & Right */}
                    <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-between py-4">
                      {Array.from({ length: layout === '4s' ? 24 : layout === '2s' ? 14 : 9 }).map((_, i) => (
                        <div key={i} className="w-3 h-5 bg-black rounded-xs border border-white/5" />
                      ))}
                    </div>
                    <div className="absolute right-2.5 top-0 bottom-0 flex flex-col justify-between py-4">
                      {Array.from({ length: layout === '4s' ? 24 : layout === '2s' ? 14 : 9 }).map((_, i) => (
                        <div key={i} className="w-3 h-5 bg-black rounded-xs border border-white/5" />
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Frame Overlay Image (Default or Contentful PNG) */}
                {theme === 'default' && (
                  <img 
                    src={config.bgImage} 
                    alt="Frame Mask" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30" 
                  />
                )}
                {(() => {
                  const activeTheme = availableThemes.find(t => t.id === theme);
                  if (activeTheme && 'isContentful' in activeTheme && activeTheme.isContentful) {
                    return (
                      <img 
                        src={activeTheme.imageUrl} 
                        alt="Frame Mask" 
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-30" 
                      />
                    );
                  }
                  return null;
                })()}

                {/* 3. Bottom Branding Texts */}
                <div 
                  className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center justify-center text-center pointer-events-none"
                  style={{
                    height: `${(324 / config.height) * 100}%`,
                    color: availableThemes.find(t => t.id === theme)?.textColor || '#ffffff'
                  }}
                >
                  <span className="font-black text-sm tracking-widest px-4 uppercase block select-none">
                    {customText || 'KIRIN DAY'}
                  </span>
                  {showDate && (
                    <span className="text-[9px] font-bold tracking-wider mt-1.5 opacity-80 block select-none">
                      {(() => {
                        const today = new Date();
                        return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
                      })()}
                    </span>
                  )}
                </div>

              </div>
              <span className="text-xs text-[#FFFCE0]/50 mt-4 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Drag foto di dalam slot untuk geser posisinya
              </span>
            </div>

            {/* Right: Controls & Adjustment Panel */}
            <div className="flex-grow w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="font-black text-xl mb-4 text-[#FFFCE0] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F6E05E]" /> Edit Strip
              </h3>
              
              {/* Slot Indicator Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-thin">
                {slots.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlotIndex(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                      activeSlotIndex === idx
                        ? 'bg-[#F6E05E] text-[#1a2f47] border-[#F6E05E] shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Slot {idx + 1} {!slots[idx].url && '●'}
                  </button>
                ))}
              </div>

              {/* Media Loader */}
              {activeSlotIndex !== null && (
                <div className="space-y-6">
                  
                  {/* Upload action */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                    {slots[activeSlotIndex].url ? (
                      <div className="flex items-center gap-3 w-full justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded bg-white/10 overflow-hidden border border-white/10">
                            {slots[activeSlotIndex].type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center text-[#90CDF4]"><Video className="w-5 h-5" /></div>
                            ) : (
                              <img src={slots[activeSlotIndex].url || ''} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-white/50 block">File Terunggah</span>
                            <span className="text-sm font-bold truncate max-w-[120px] block">{slots[activeSlotIndex].file?.name || 'File media'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => triggerFileInput(activeSlotIndex)}
                          className="px-4 py-2 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/15 transition-all"
                        >
                          Ganti File
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerFileInput(activeSlotIndex)}
                        className="w-full py-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-white/70"
                      >
                        <Upload className="w-6 h-6 text-[#F6E05E]" />
                        <span className="text-xs font-bold tracking-wider">UNGGAH {mediaMode.toUpperCase()} BARU</span>
                        <span className="text-[10px] text-white/40">Mendukung {mediaMode === 'video' ? 'MP4, WebM, MOV' : 'JPG, PNG, WebP'}</span>
                      </button>
                    )}
                  </div>

                  {/* Media Adjustment Sliders (Only if slot has media) */}
                  {slots[activeSlotIndex].url && (
                    <div className="space-y-5 animate-fade-in">
                      
                      {/* Zoom Slider */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-white/75 flex items-center gap-1.5"><ZoomIn className="w-3.5 h-3.5" /> Skala (Zoom)</span>
                          <span className="font-mono text-[#F6E05E]">{slots[activeSlotIndex].zoom.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="3.0"
                          step="0.05"
                          value={slots[activeSlotIndex].zoom}
                          onChange={(e) => updateActiveSlotProperty('zoom', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#F6E05E]"
                        />
                      </div>

                      {/* Rotation Slider */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-white/75 flex items-center gap-1.5"><RotateCw className="w-3.5 h-3.5" /> Rotasi (Miring)</span>
                          <span className="font-mono text-[#F6E05E]">{slots[activeSlotIndex].rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="1"
                          value={slots[activeSlotIndex].rotation}
                          onChange={(e) => updateActiveSlotProperty('rotation', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#F6E05E]"
                        />
                      </div>

                      {/* Filter Grid */}
                      <div>
                        <span className="text-xs font-bold text-white/75 block mb-2.5">Filter Warna</span>
                        <div className="grid grid-cols-3 gap-2">
                          {FILTERS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => updateActiveSlotProperty('filter', f.id)}
                              className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                slots[activeSlotIndex].filter === f.id
                                  ? 'bg-white/10 border-[#F6E05E] text-[#F6E05E]'
                                  : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  <hr className="border-white/10" />

                  {/* Dynamic Branding Text and Custom Watermark Settings */}
                  <div className="space-y-4">
                    <span className="text-xs font-black tracking-wider text-[#FFFCE0]/80 block">Kustomisasi Teks Frame</span>
                    
                    {/* Bottom label */}
                    <div>
                      <label className="text-xs text-white/60 block mb-1.5">Teks Branding Bawah</label>
                      <input
                        type="text"
                        maxLength={18}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#F6E05E]"
                        placeholder="KIRIN DAY"
                      />
                    </div>

                    {/* Date Toggle */}
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-left">
                        <span className="text-sm font-bold block">Tampilkan Tanggal</span>
                        <span className="text-[10px] text-white/40">Watermark tanggal pembuatan otomatis</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showDate}
                        onChange={(e) => setShowDate(e.target.checked)}
                        className="w-5 h-5 rounded border-white/10 accent-[#F6E05E] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Complete Workspace generate actions */}
                  <div className="pt-4">
                    <button
                      disabled={!isWorkspaceComplete}
                      onClick={() => setShowConfirmModal(true)}
                      className={`w-full py-4 rounded-full font-black text-lg tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                        isWorkspaceComplete
                          ? 'bg-gradient-to-r from-[#F6E05E] to-[#90CDF4] text-[#1a2f47] hover:scale-103 cursor-pointer'
                          : 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-5 h-5" /> Selesai &amp; Generate Strip
                    </button>
                    {!isWorkspaceComplete && (
                      <span className="text-[10px] text-white/40 mt-2 text-center block font-semibold">
                        Lengkapi semua {layout === '1s' ? '1' : layout === '2s' ? '2' : '4'} slot di atas terlebih dahulu
                      </span>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {/* 5. CONFIRMATION MODAL POP-UP */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1a2f47] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative">
              <div className="w-14 h-14 rounded-full bg-[#F6E05E]/15 border border-[#F6E05E]/40 text-[#F6E05E] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Smile className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-black mb-2 text-[#FFFCE0]">Yakin dengan hasilnya?</h4>
              <p className="text-sm text-[#FFFCE0]/70 leading-relaxed mb-6">
                Pastikan posisi foto sudah teratur dengan rapi. Hasil akhir yang keren akan siap diunduh!
              </p>
              
              {/* Option to select export canvas size */}
              {mediaMode === 'photo' && (
                <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-6 text-left">
                  <span className="text-xs font-bold block mb-2 text-[#F6E05E]">Format Unduhan:</span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                      <input 
                        type="radio" 
                        name="exportMode" 
                        checked={exportMode === 'story'} 
                        onChange={() => setExportMode('story')}
                        className="accent-[#F6E05E]" 
                      />
                      <div>
                        <span className="font-bold block text-white/90">Instagram Story (9:16)</span>
                        <span className="text-white/40 block text-[10px]">Untuk langsung di-share di Story</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                      <input 
                        type="radio" 
                        name="exportMode" 
                        checked={exportMode === 'strip'} 
                        onChange={() => setExportMode('strip')}
                        className="accent-[#F6E05E]" 
                      />
                      <div>
                        <span className="font-bold block text-white/90">Strip Saja (Sesuai Ukuran Asli)</span>
                        <span className="text-white/40 block text-[10px]">Cocok untuk cetak fisik / wallpaper</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition-all text-xs"
                >
                  Kembali
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-3 rounded-xl bg-[#F6E05E] text-[#1a2f47] font-black hover:scale-103 transition-transform text-xs"
                >
                  Ya, Generate!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING SCREEN WHILE COMPILING */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <RefreshCw className="w-12 h-12 text-[#F6E05E] animate-spin mb-4" />
            <h4 className="text-lg font-black text-white mb-2">Sedang Merender Strip...</h4>
            <p className="text-xs text-white/50">Harap tunggu sebentar, kami sedang menyusun media berkualitas tinggi</p>
          </div>
        )}

        {/* 6. FINAL EXPORT PREVIEW & DOWNLOAD STEP */}
        {step === 'preview' && generatedUrl && (
          <div className="w-full max-w-xl flex flex-col items-center text-center animate-fade-in py-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center text-green-400 mb-4 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-center mb-1 text-[#FFFCE0]">Kenanganmu Telah Siap!</h2>
            <p className="text-[#FFFCE0]/70 text-center mb-8 text-sm">Unduh hasil karyamu di bawah ini dan bagikan di Instagram Story</p>

            {/* Generated Mockup Frame */}
            <div className="relative overflow-hidden aspect-[9/16] bg-[#0c061a] w-[260px] md:w-[280px] shadow-2xl rounded-2xl border border-white/20 mb-8">
              {mediaMode === 'video' ? (
                <video 
                  src={generatedUrl} 
                  controls 
                  loop 
                  autoPlay 
                  playsInline
                  className="w-full h-full object-contain" 
                />
              ) : (
                <img 
                  src={generatedUrl} 
                  alt="Generated Photostrip" 
                  className="w-full h-full object-contain" 
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-4 w-full max-w-xs">
              <button 
                onClick={handleDownload}
                className="w-full py-4 rounded-full bg-[#F6E05E] text-[#1a2f47] font-black text-lg tracking-wider shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> Unduh Hasil Strip
              </button>

              <button 
                onClick={resetWorkspace}
                className="w-full py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition-all text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Buat Strip Baru
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
