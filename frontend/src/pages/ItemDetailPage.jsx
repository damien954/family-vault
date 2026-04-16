import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api/client';
import { useToast } from '../components/common/Toast';
import Btn from '../components/common/Btn';
import ItemFormModal from '../components/inventory/ItemFormModal';
import { ArrowLeft, Image, Trash2, Upload } from 'lucide-react';

const API_BASE = (process.env.REACT_APP_API_URL || '/api').replace('/api', '');

function fmt(n) {
  return n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
    : '—';
}

function DetailField({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value}</div>
    </div>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef();
  const [showEdit, setShowEdit] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => itemsApi.get(id).then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (files) => {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      return itemsApi.uploadImages(id, fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['item', id] }); toast('Images uploaded.'); },
    onError: () => toast('Upload failed.', 'error'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => itemsApi.deleteImage(id, imageId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['item', id] }); toast('Image deleted.'); },
    onError: () => toast('Failed to delete image.', 'error'),
  });

  if (isLoading) {
    return <div style={{ padding: 28, display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  }

  if (!item) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--text-muted)' }}>Item not found.</p>
        <Btn variant="secondary" onClick={() => navigate('/inventory')} style={{ marginTop: 16 }}><ArrowLeft size={14} /> Back to Inventory</Btn>
      </div>
    );
  }

  const handleEditClose = () => {
    setShowEdit(false);
    qc.invalidateQueries({ queryKey: ['item', id] });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Btn variant="ghost" size="sm" onClick={() => navigate('/inventory')} style={{ flexShrink: 0 }}>
            <ArrowLeft size={14} /> Back
          </Btn>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>{item.name}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span>
              {item.category_name && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.category_name}</span>}
              {item.is_private && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Private</span>}
            </div>
          </div>
        </div>
        <Btn onClick={() => setShowEdit(true)}>Edit Item</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Details card */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Item Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <DetailField label="Serial Number" value={item.serial_number} mono />
            <DetailField label="Make" value={item.make} />
            <DetailField label="Model" value={item.model} />
            <DetailField label="Caliber" value={item.caliber} />
            <DetailField label="Purchase Date" value={item.purchase_date?.slice(0, 10)} />
            <DetailField label="Purchased From" value={item.purchased_from} />
            <DetailField label="Purchase Amount" value={fmt(item.purchase_amount)} />
            <DetailField label="Current Value" value={fmt(item.current_value)} />
            <DetailField label="Storage Location" value={item.storage_location_name} />
            <DetailField label="Owner" value={item.owner_name} />
          </div>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Tags</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {item.tags.map(t => (
                  <span key={t.id} style={{ padding: '3px 10px', background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 100, fontSize: 11, fontWeight: 600, border: '1px solid rgba(200,169,110,0.2)' }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>Added</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(item.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>Updated</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(item.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Images card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Images</h3>
            <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
              <Upload size={13} /> {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Btn>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) { uploadMutation.mutate(Array.from(e.target.files)); e.target.value = ''; } }}
          />
          {item.images?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <Image size={36} style={{ marginBottom: 10, opacity: 0.2 }} />
              <p style={{ fontSize: 13 }}>No images attached yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Upload photos for insurance records.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
              {item.images.map(img => (
                <div
                  key={img.id}
                  style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-elevated)', cursor: 'pointer' }}
                  onClick={() => setLightbox(img)}
                >
                  <img
                    src={`${API_BASE}/uploads/${img.filename}`}
                    alt={img.original_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); if (window.confirm('Delete this image?')) deleteImageMutation.mutate(img.id); }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(0,0,0,0.75)', borderRadius: 4, padding: 4,
                      color: 'var(--danger)', display: 'flex', cursor: 'pointer', border: 'none',
                    }}
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
      {lightbox && (
        <div
          className="modal-overlay"
          onClick={() => setLightbox(null)}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={`${API_BASE}/uploads/${lightbox.filename}`}
            alt={lightbox.original_name}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--radius)', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {showEdit && <ItemFormModal item={item} onClose={handleEditClose} />}
    </div>
  );
}
