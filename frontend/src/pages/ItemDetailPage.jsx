import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api/client';
import { useToast } from '../components/common/Toast';
import Btn from '../components/common/Btn';
import ItemFormModal from '../components/inventory/ItemFormModal';
import { ArrowLeft, Image, Trash2, Upload, ChevronLeft, ChevronRight, X } from 'lucide-react';

const API_ROOT = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');

function fmt(n) {
  return n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
    : '—';
}

function DetailField({ label, value, mono }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontFamily: mono ? 'var(--mono)' : undefined }}>
        {value}
      </div>
    </div>
  );
}

export default function ItemDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const qc            = useQueryClient();
  const toast         = useToast();
  const fileRef       = useRef();
  const [showEdit, setShowEdit]       = useState(false);
  const [lightbox, setLightbox]       = useState(null); // index into images array

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => itemsApi.get(id).then(r => r.data),
  });

  const images = item?.images || [];

  // ── Lightbox keyboard nav ───────────────────────────────────────────────
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage = useCallback(() => setLightbox(i => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const nextImage = useCallback(() => setLightbox(i => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => {
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, closeLightbox, prevImage, nextImage]);

  const uploadMutation = useMutation({
    mutationFn: (files) => {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      return itemsApi.uploadImages(id, fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['item', id] }); toast('Images uploaded.'); },
    onError:   () => toast('Upload failed.', 'error'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => itemsApi.deleteImage(id, imageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item', id] });
      if (lightbox !== null) closeLightbox();
      toast('Image deleted.');
    },
    onError: () => toast('Failed to delete image.', 'error'),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--text-3)' }}>Item not found.</p>
        <Btn variant="secondary" onClick={() => navigate('/inventory')} style={{ marginTop: 16 }}>
          <ArrowLeft size={14} /> Back
        </Btn>
      </div>
    );
  }

  const handleEditClose = () => {
    setShowEdit(false);
    qc.invalidateQueries({ queryKey: ['item', id] });
  };

  const displayName = [item.make, item.model].filter(Boolean).join(' ') || item.name || 'Unnamed';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
            <ArrowLeft size={14} /> Back
          </Btn>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>{displayName}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span>
              {item.category_name && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.category_name}</span>}
              {item.is_private && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>Private</span>}
            </div>
          </div>
        </div>
        <Btn onClick={() => setShowEdit(true)}>Edit Item</Btn>
      </div>

      <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Details */}
        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 18 }}>Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DetailField label="Serial Number" value={item.serial_number} mono />
            <DetailField label="Make"           value={item.make} />
            <DetailField label="Model"          value={item.model} />
            <DetailField label="Caliber"        value={item.caliber} />
            <DetailField label="Date Acquired"  value={item.purchase_date?.slice(0, 10)} />
            <DetailField label="Acquired From"  value={item.purchased_from} />
            <DetailField label="Purchase Amount"value={fmt(item.purchase_amount)} />
            <DetailField label="Current Value"  value={fmt(item.current_value)} />
            <DetailField label="Location"       value={item.storage_location_name} />
            <DetailField label="Owner"          value={item.owner_name} />
          </div>

          {item.tags?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Tags</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {item.tags.map(t => (
                  <span key={t.id} style={{ padding: '3px 10px', background: 'var(--accent-sub)', color: 'var(--accent)', borderRadius: 100, fontSize: 11, fontWeight: 600, border: '1px solid rgba(201,170,112,.2)' }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.notes && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.notes}</p>
            </div>
          )}

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-sub)', display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 3 }}>Added</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 3 }}>Updated</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{new Date(item.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14 }}>Images</h3>
            <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
              <Upload size={13} /> {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Btn>
          </div>
          <input
            ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) { uploadMutation.mutate(Array.from(e.target.files)); e.target.value = ''; } }}
          />

          {images.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
              <Image size={32} style={{ marginBottom: 10, opacity: .2 }} />
              <p style={{ fontSize: 13 }}>No images yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Upload photos for insurance records.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--bg-elevated)', cursor: 'pointer' }}
                  onClick={() => setLightbox(idx)}
                >
                  <img
                    src={`${API_ROOT}/uploads/${img.filename}`}
                    alt={img.original_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); if (window.confirm('Delete this image?')) deleteImageMutation.mutate(img.id); }}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.75)', borderRadius: 4, padding: 4, color: 'var(--red)', display: 'flex', cursor: 'pointer', border: 'none' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && images[lightbox] && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button onClick={closeLightbox} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
            <X size={14} /> Close (Esc)
          </button>
          {/* Counter */}
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,.6)', fontSize: 13 }}>
            {lightbox + 1} / {images.length}
          </div>
          {/* Prev */}
          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prevImage(); }} style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '10px 8px', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={24} />
            </button>
          )}
          {/* Image */}
          <img
            src={`${API_ROOT}/uploads/${images[lightbox].filename}`}
            alt={images[lightbox].original_name}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          {/* Next */}
          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); nextImage(); }} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '10px 8px', cursor: 'pointer', display: 'flex' }}>
              <ChevronRight size={24} />
            </button>
          )}
          {/* Delete from lightbox */}
          <button
            onClick={e => { e.stopPropagation(); if (window.confirm('Delete this image?')) deleteImageMutation.mutate(images[lightbox].id); }}
            style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--red-sub)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <Trash2 size={14} /> Delete image
          </button>
        </div>
      )}

      {showEdit && <ItemFormModal item={item} onClose={handleEditClose} />}
    </div>
  );
}
