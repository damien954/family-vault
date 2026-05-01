import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/client';
import { useToast } from '../components/common/Toast.jsx';
import Btn from '../components/common/Btn.jsx';
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';

export default function CategoriesPage() {
  const qc    = useQueryClient();
  const toast = useToast();
  const [newName, setNewName] = useState('');
  const [editId, setEditId]   = useState(null);
  const [editName, setEditName] = useState('');

  const { data:categories=[], isLoading } = useQuery({ queryKey:['categories'], queryFn:()=>categoriesApi.list().then(r=>r.data) });

  const createMut = useMutation({ mutationFn:categoriesApi.create, onSuccess:()=>{ qc.invalidateQueries({queryKey:['categories']}); setNewName(''); toast('Category added.'); }, onError:(err)=>toast(err.response?.data?.error||'Failed.','error') });
  const updateMut = useMutation({ mutationFn:({id,...d})=>categoriesApi.update(id,d), onSuccess:()=>{ qc.invalidateQueries({queryKey:['categories']}); setEditId(null); toast('Updated.'); }, onError:()=>toast('Failed.','error') });
  const deleteMut = useMutation({ mutationFn:categoriesApi.delete, onSuccess:()=>{ qc.invalidateQueries({queryKey:['categories']}); toast('Deleted.'); }, onError:()=>toast('Cannot delete — may be in use.','error') });

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Categories</h1><p className="page-subtitle">Organize inventory by type</p></div>
      </div>
      <div style={{maxWidth:480}}>
        <div className="card" style={{marginBottom:14}}>
          <h3 style={{fontSize:13,marginBottom:12,color:'var(--text-2)',fontWeight:600}}>Add New Category</h3>
          <div style={{display:'flex',gap:9}}>
            <input placeholder="e.g. Handgun, Rifle, Shotgun…" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newName.trim())createMut.mutate({name:newName.trim()});}}/>
            <Btn onClick={()=>{if(newName.trim())createMut.mutate({name:newName.trim()});}} disabled={!newName.trim()||createMut.isPending}><Plus size={14}/> Add</Btn>
          </div>
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {isLoading?<div style={{padding:32,display:'flex',justifyContent:'center'}}><div className="spinner"/></div>
          :categories.length===0?<div style={{padding:40,textAlign:'center',color:'var(--text-3)'}}><Tag size={26} style={{marginBottom:10,opacity:.2}}/><p>No categories yet.</p></div>
          :categories.map((cat,i)=>(
            <div key={cat.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 18px',borderBottom:i<categories.length-1?'1px solid var(--border-sub)':'none'}}>
              <Tag size={13} color="var(--accent-dim)" style={{flexShrink:0}}/>
              {editId===cat.id?(
                <>
                  <input value={editName} onChange={e=>setEditName(e.target.value)} autoFocus style={{flex:1}} onKeyDown={e=>{ if(e.key==='Enter')updateMut.mutate({id:cat.id,name:editName}); if(e.key==='Escape')setEditId(null); }}/>
                  <Btn size="sm" onClick={()=>updateMut.mutate({id:cat.id,name:editName})} disabled={!editName.trim()}><Check size={13}/></Btn>
                  <Btn variant="ghost" size="sm" onClick={()=>setEditId(null)}><X size={13}/></Btn>
                </>
              ):(
                <>
                  <span style={{flex:1,fontWeight:600}}>{cat.name}</span>
                  <Btn variant="ghost" size="sm" onClick={()=>{setEditId(cat.id);setEditName(cat.name);}}><Pencil size={13}/></Btn>
                  <Btn variant="ghost" size="sm" onClick={()=>{if(window.confirm(`Delete "${cat.name}"?`))deleteMut.mutate(cat.id);}}><Trash2 size={13} color="var(--red)"/></Btn>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
