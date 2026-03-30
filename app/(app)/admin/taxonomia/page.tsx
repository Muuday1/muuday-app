'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Tag,
  FolderTree,
} from 'lucide-react'

type Category = { id: string; slug: string; name_pt: string; name_en: string; icon: string; sort_order: number; is_active: boolean }
type Subcategory = { id: string; category_id: string; slug: string; name_pt: string; name_en: string; sort_order: number; is_active: boolean }
type Specialty = { id: string; subcategory_id: string; slug: string; name_pt: string; name_en: string; sort_order: number; is_active: boolean }
type TagSuggestion = { id: string; professional_id: string; tag: string; status: string; created_at: string }

export default function TaxonomiaPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([])
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<{ type: string; id: string; name_pt: string; name_en: string; slug: string } | null>(null)
  const [addItem, setAddItem] = useState<{ type: string; parentId: string; name_pt: string; name_en: string; slug: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'tree' | 'tags'>('tree')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [cRes, scRes, spRes, tsRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
      supabase.from('specialties').select('*').order('sort_order'),
      supabase.from('tag_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    setCategories(cRes.data || [])
    setSubcategories(scRes.data || [])
    setSpecialties(spRes.data || [])
    setTagSuggestions(tsRes.data || [])
    setLoading(false)
  }

  function slugify(text: string) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleAddSubcategory() {
    if (!addItem || addItem.type !== 'subcategory' || !addItem.name_pt.trim()) return
    setActionLoading('add')
    const maxOrder = subcategories.filter(s => s.category_id === addItem.parentId).length + 1
    await supabase.from('subcategories').insert({
      category_id: addItem.parentId,
      slug: addItem.slug || slugify(addItem.name_pt),
      name_pt: addItem.name_pt.trim(),
      name_en: addItem.name_en.trim() || addItem.name_pt.trim(),
      sort_order: maxOrder,
    })
    setAddItem(null)
    setActionLoading(null)
    loadAll()
  }

  async function handleAddSpecialty() {
    if (!addItem || addItem.type !== 'specialty' || !addItem.name_pt.trim()) return
    setActionLoading('add')
    const maxOrder = specialties.filter(s => s.subcategory_id === addItem.parentId).length + 1
    await supabase.from('specialties').insert({
      subcategory_id: addItem.parentId,
      slug: addItem.slug || slugify(addItem.name_pt),
      name_pt: addItem.name_pt.trim(),
      name_en: addItem.name_en.trim() || addItem.name_pt.trim(),
      sort_order: maxOrder,
    })
    setAddItem(null)
    setActionLoading(null)
    loadAll()
  }

  async function handleSaveEdit() {
    if (!editItem) return
    setActionLoading(editItem.id)
    const table = editItem.type === 'category' ? 'categories' : editItem.type === 'subcategory' ? 'subcategories' : 'specialties'
    await supabase.from(table).update({
      name_pt: editItem.name_pt.trim(),
      name_en: editItem.name_en.trim(),
      slug: editItem.slug,
    }).eq('id', editItem.id)
    setEditItem(null)
    setActionLoading(null)
    loadAll()
  }

  async function handleToggleActive(type: string, id: string, currentActive: boolean) {
    setActionLoading(id)
    const table = type === 'category' ? 'categories' : type === 'subcategory' ? 'subcategories' : 'specialties'
    await supabase.from(table).update({ is_active: !currentActive }).eq('id', id)
    setActionLoading(null)
    loadAll()
  }

  async function handleTagAction(id: string, status: 'approved' | 'rejected') {
    setActionLoading(id)
    await supabase.from('tag_suggestions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    setActionLoading(null)
    loadAll()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-neutral-900 mb-2">Taxonomia</h1>
      <p className="text-sm text-neutral-500 mb-6">Gerencie categorias, subcategorias, especialidades e tags.</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'tree' ? 'bg-brand-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'}`}
        >
          <FolderTree className="w-4 h-4" /> Árvore
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'tags' ? 'bg-brand-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'}`}
        >
          <Tag className="w-4 h-4" /> Tags pendentes
          {tagSuggestions.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{tagSuggestions.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'tree' && (
        <div className="space-y-2">
          {categories.map(cat => {
            const catSubs = subcategories.filter(s => s.category_id === cat.id)
            const isExpanded = expandedCat === cat.id
            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  <span className="text-lg">{cat.icon}</span>
                  {editItem?.id === cat.id ? (
                    <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input value={editItem.name_pt} onChange={e => setEditItem({ ...editItem, name_pt: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-sm" placeholder="Nome PT" />
                      <input value={editItem.name_en} onChange={e => setEditItem({ ...editItem, name_en: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-sm" placeholder="Nome EN" />
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditItem(null)} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className={`flex-1 text-sm font-semibold ${cat.is_active ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>{cat.name_pt}</span>
                      <span className="text-xs text-neutral-400 mr-2">{catSubs.length} sub</span>
                      <button onClick={e => { e.stopPropagation(); setEditItem({ type: 'category', id: cat.id, name_pt: cat.name_pt, name_en: cat.name_en, slug: cat.slug }) }} className="text-neutral-400 hover:text-neutral-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={e => { e.stopPropagation(); handleToggleActive('category', cat.id, cat.is_active) }} className={`ml-1 text-xs px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {actionLoading === cat.id ? '...' : cat.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-50 px-4 py-2 space-y-1">
                    {catSubs.map(sub => {
                      const subSpecs = specialties.filter(sp => sp.subcategory_id === sub.id)
                      const isSubExpanded = expandedSub === sub.id
                      return (
                        <div key={sub.id}>
                          <div className="flex items-center gap-2 py-2 pl-6 cursor-pointer hover:bg-neutral-50 rounded-lg" onClick={() => setExpandedSub(isSubExpanded ? null : sub.id)}>
                            {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                            {editItem?.id === sub.id ? (
                              <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <input value={editItem.name_pt} onChange={e => setEditItem({ ...editItem, name_pt: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-sm" />
                                <input value={editItem.name_en} onChange={e => setEditItem({ ...editItem, name_en: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-sm" />
                                <button onClick={handleSaveEdit} className="text-green-600"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditItem(null)} className="text-neutral-400"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <>
                                <span className={`flex-1 text-sm ${sub.is_active ? 'text-neutral-800' : 'text-neutral-400 line-through'}`}>{sub.name_pt}</span>
                                <span className="text-xs text-neutral-400 mr-2">{subSpecs.length} esp</span>
                                <button onClick={e => { e.stopPropagation(); setEditItem({ type: 'subcategory', id: sub.id, name_pt: sub.name_pt, name_en: sub.name_en, slug: sub.slug }) }} className="text-neutral-400 hover:text-neutral-600"><Pencil className="w-3 h-3" /></button>
                                <button onClick={e => { e.stopPropagation(); handleToggleActive('subcategory', sub.id, sub.is_active) }} className={`ml-1 text-xs px-2 py-0.5 rounded-full ${sub.is_active ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                  {actionLoading === sub.id ? '...' : sub.is_active ? 'Ativo' : 'Inativo'}
                                </button>
                              </>
                            )}
                          </div>

                          {isSubExpanded && (
                            <div className="pl-14 space-y-1 pb-2">
                              {subSpecs.map(sp => (
                                <div key={sp.id} className="flex items-center gap-2 py-1.5">
                                  {editItem?.id === sp.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                      <input value={editItem.name_pt} onChange={e => setEditItem({ ...editItem, name_pt: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-xs" />
                                      <input value={editItem.name_en} onChange={e => setEditItem({ ...editItem, name_en: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-xs" />
                                      <button onClick={handleSaveEdit} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setEditItem(null)} className="text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className={`flex-1 text-xs ${sp.is_active ? 'text-neutral-700' : 'text-neutral-400 line-through'}`}>{sp.name_pt}</span>
                                      <button onClick={() => setEditItem({ type: 'specialty', id: sp.id, name_pt: sp.name_pt, name_en: sp.name_en, slug: sp.slug })} className="text-neutral-400 hover:text-neutral-600"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={() => handleToggleActive('specialty', sp.id, sp.is_active)} className={`text-xs px-2 py-0.5 rounded-full ${sp.is_active ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                        {actionLoading === sp.id ? '...' : sp.is_active ? 'Ativo' : 'Inativo'}
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}

                              {addItem?.type === 'specialty' && addItem.parentId === sub.id ? (
                                <div className="flex items-center gap-2 py-1.5">
                                  <input value={addItem.name_pt} onChange={e => setAddItem({ ...addItem, name_pt: e.target.value, slug: slugify(e.target.value) })} className="flex-1 px-2 py-1 border rounded-lg text-xs" placeholder="Nome PT" autoFocus />
                                  <input value={addItem.name_en} onChange={e => setAddItem({ ...addItem, name_en: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-xs" placeholder="Nome EN" />
                                  <button onClick={handleAddSpecialty} disabled={actionLoading === 'add'} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setAddItem(null)} className="text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAddItem({ type: 'specialty', parentId: sub.id, name_pt: '', name_en: '', slug: '' })}
                                  className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 py-1"
                                >
                                  <Plus className="w-3 h-3" /> Especialidade
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {addItem?.type === 'subcategory' && addItem.parentId === cat.id ? (
                      <div className="flex items-center gap-2 py-2 pl-6">
                        <input value={addItem.name_pt} onChange={e => setAddItem({ ...addItem, name_pt: e.target.value, slug: slugify(e.target.value) })} className="flex-1 px-2 py-1 border rounded-lg text-sm" placeholder="Nome PT" autoFocus />
                        <input value={addItem.name_en} onChange={e => setAddItem({ ...addItem, name_en: e.target.value })} className="flex-1 px-2 py-1 border rounded-lg text-sm" placeholder="Nome EN" />
                        <button onClick={handleAddSubcategory} disabled={actionLoading === 'add'} className="text-green-600"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setAddItem(null)} className="text-neutral-400"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddItem({ type: 'subcategory', parentId: cat.id, name_pt: '', name_en: '', slug: '' })}
                        className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 py-2 pl-6"
                      >
                        <Plus className="w-3.5 h-3.5" /> Subcategoria
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Tags pendentes de revisão</h2>
          {tagSuggestions.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma tag pendente.</p>
          ) : (
            <div className="space-y-3">
              {tagSuggestions.map(ts => (
                <div key={ts.id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-neutral-800">{ts.tag}</span>
                    <span className="text-xs text-neutral-400 ml-2">{new Date(ts.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTagAction(ts.id, 'approved')}
                      disabled={actionLoading === ts.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium"
                    >
                      {actionLoading === ts.id ? '...' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => handleTagAction(ts.id, 'rejected')}
                      disabled={actionLoading === ts.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
