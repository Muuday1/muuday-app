'use client'

import { useState } from 'react'
import {
  updateTaxonomyItem,
  insertTaxonomyItem,
  toggleTaxonomyActive,
  reviewTagSuggestion,
  type TaxonomyType,
  type TaxonomyData,
} from '@/lib/actions/admin-taxonomy'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Check,
  X,
  Loader2,
  Tag,
  FolderTree,
  Briefcase,
} from 'lucide-react'

export interface TaxonomiaFormProps {
  initialData: TaxonomyData
}

export function TaxonomiaForm({ initialData }: TaxonomiaFormProps) {
  const [categories, setCategories] = useState<TaxonomyData['categories']>(initialData.categories)
  const [subcategories, setSubcategories] = useState<TaxonomyData['subcategories']>(initialData.subcategories)
  const [specialties, setSpecialties] = useState<TaxonomyData['specialties']>(initialData.specialties)
  const [serviceOptions, setServiceOptions] = useState<TaxonomyData['serviceOptions']>(initialData.serviceOptions)
  const [tagSuggestions, setTagSuggestions] = useState<TaxonomyData['tagSuggestions']>(initialData.tagSuggestions)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<{ type: string; id: string; name_pt: string; name_en: string; slug: string } | null>(null)
  const [addItem, setAddItem] = useState<{ type: string; parentId: string; name_pt: string; name_en: string; slug: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'tree' | 'services' | 'tags'>('tree')

  async function reloadAll() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const [cRes, scRes, spRes, soRes, tsRes] = await Promise.all([
      supabase.from('categories').select('id,slug,name_pt,name_en,icon,sort_order,is_active').order('sort_order'),
      supabase.from('subcategories').select('id,category_id,slug,name_pt,name_en,sort_order,is_active').order('sort_order'),
      supabase.from('specialties').select('id,subcategory_id,slug,name_pt,name_en,sort_order,is_active').order('sort_order'),
      supabase.from('taxonomy_service_options').select('id,subcategory_slug,slug,name_pt,name_en,sort_order,is_active').order('subcategory_slug').order('sort_order'),
      supabase.from('tag_suggestions').select('id,professional_id,tag,status,created_at').eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    setCategories(cRes.data || [])
    setSubcategories(scRes.data || [])
    setSpecialties(spRes.data || [])
    setServiceOptions(soRes.data || [])
    setTagSuggestions(tsRes.data || [])
  }

  function slugify(text: string) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleAddSubcategory() {
    if (!addItem || addItem.type !== 'subcategory' || !addItem.name_pt.trim()) return
    setActionLoading('add')
    const maxOrder = subcategories.filter(s => s.category_id === addItem.parentId).length + 1
    const result = await insertTaxonomyItem({
      type: 'subcategory',
      parentId: addItem.parentId,
      slug: addItem.slug || slugify(addItem.name_pt),
      name_pt: addItem.name_pt.trim(),
      name_en: addItem.name_en.trim() || addItem.name_pt.trim(),
      sortOrder: maxOrder,
    })
    if (!result.success) {
       
      console.error('Failed to add subcategory:', result.error)
    }
    setAddItem(null)
    setActionLoading(null)
    reloadAll()
  }

  async function handleAddSpecialty() {
    if (!addItem || addItem.type !== 'specialty' || !addItem.name_pt.trim()) return
    setActionLoading('add')
    const maxOrder = specialties.filter(s => s.subcategory_id === addItem.parentId).length + 1
    const result = await insertTaxonomyItem({
      type: 'specialty',
      parentId: addItem.parentId,
      slug: addItem.slug || slugify(addItem.name_pt),
      name_pt: addItem.name_pt.trim(),
      name_en: addItem.name_en.trim() || addItem.name_pt.trim(),
      sortOrder: maxOrder,
    })
    if (!result.success) {
       
      console.error('Failed to add specialty:', result.error)
    }
    setAddItem(null)
    setActionLoading(null)
    reloadAll()
  }

  async function handleSaveEdit() {
    if (!editItem) return
    setActionLoading(editItem.id)
    const type = editItem.type === 'category'
      ? 'category'
      : editItem.type === 'subcategory'
        ? 'subcategory'
        : editItem.type === 'service_option'
          ? 'service_option'
          : 'specialty'
    const result = await updateTaxonomyItem(type as TaxonomyType, editItem.id, {
      name_pt: editItem.name_pt.trim(),
      name_en: editItem.name_en.trim(),
      slug: editItem.slug,
    })
    if (!result.success) {
       
      console.error('Failed to update taxonomy item:', result.error)
    }
    setEditItem(null)
    setActionLoading(null)
    reloadAll()
  }

  async function handleToggleActive(type: string, id: string, currentActive: boolean) {
    setActionLoading(id)
    const taxonomyType = type === 'category'
      ? 'category'
      : type === 'subcategory'
        ? 'subcategory'
        : type === 'service_option'
          ? 'service_option'
          : 'specialty'
    const result = await toggleTaxonomyActive(taxonomyType as TaxonomyType, id, currentActive)
    if (!result.success) {
       
      console.error('Failed to toggle active:', result.error)
    }
    setActionLoading(null)
    reloadAll()
  }

  async function handleAddServiceOption() {
    if (!addItem || addItem.type !== 'service_option' || !addItem.name_pt.trim()) return
    setActionLoading('add')
    const maxOrder = serviceOptions.filter(s => s.subcategory_slug === addItem.parentId).length + 1
    const result = await insertTaxonomyItem({
      type: 'service_option',
      parentId: addItem.parentId,
      slug: addItem.slug || slugify(addItem.name_pt),
      name_pt: addItem.name_pt.trim(),
      name_en: addItem.name_en.trim() || addItem.name_pt.trim(),
      sortOrder: maxOrder,
    })
    if (!result.success) {
       
      console.error('Failed to add service option:', result.error)
    }
    setAddItem(null)
    setActionLoading(null)
    reloadAll()
  }

  async function handleTagAction(id: string, status: 'approved' | 'rejected') {
    setActionLoading(id)
    const result = await reviewTagSuggestion(id, status)
    if (!result.success) {
       
      console.error('Failed to review tag:', result.error)
    }
    setActionLoading(null)
    reloadAll()
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-neutral-900 mb-2">Taxonomia</h1>
      <p className="text-sm text-neutral-500 mb-6">Gerencie categorias, subcategorias e profissões/especialidades validadas.</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'tree' ? 'bg-brand-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'}`}
        >
          <FolderTree className="w-4 h-4" /> Árvore
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'services' ? 'bg-brand-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'}`}
        >
          <Briefcase className="w-4 h-4" /> Serviços
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'tags' ? 'bg-brand-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'}`}
        >
          <Tag className="w-4 h-4" /> Sugestões pendentes
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

      {activeTab === 'services' && (
        <div className="space-y-3">
          {subcategories.map(sub => {
            const subServiceOptions = serviceOptions.filter(option => option.subcategory_slug === sub.slug)
            return (
              <div key={sub.id} className="bg-white rounded-2xl border border-neutral-100 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{sub.name_pt}</p>
                    <p className="text-xs text-neutral-500">{sub.slug}</p>
                  </div>
                  <span className="text-xs text-neutral-500">{subServiceOptions.length} opções</span>
                </div>

                <div className="space-y-2">
                  {subServiceOptions.map(option => (
                    <div key={option.id} className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                      {editItem?.id === option.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            value={editItem.name_pt}
                            onChange={e => setEditItem({ ...editItem, name_pt: e.target.value })}
                            className="flex-1 px-2 py-1 border rounded-lg text-xs"
                          />
                          <input
                            value={editItem.name_en}
                            onChange={e => setEditItem({ ...editItem, name_en: e.target.value })}
                            className="flex-1 px-2 py-1 border rounded-lg text-xs"
                          />
                          <button onClick={handleSaveEdit} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditItem(null)} className="text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <>
                          <p className={`flex-1 text-xs ${option.is_active ? 'text-neutral-800' : 'text-neutral-400 line-through'}`}>{option.name_pt}</p>
                          <button
                            onClick={() => setEditItem({ type: 'service_option', id: option.id, name_pt: option.name_pt, name_en: option.name_en, slug: option.slug })}
                            className="text-neutral-400 hover:text-neutral-600"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleToggleActive('service_option', option.id, option.is_active)}
                            className={`text-xs px-2 py-0.5 rounded-full ${option.is_active ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                          >
                            {actionLoading === option.id ? '...' : option.is_active ? 'Ativo' : 'Inativo'}
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {addItem?.type === 'service_option' && addItem.parentId === sub.slug ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={addItem.name_pt}
                        onChange={e => setAddItem({ ...addItem, name_pt: e.target.value, slug: slugify(e.target.value) })}
                        className="flex-1 px-2 py-1 border rounded-lg text-xs"
                        placeholder="Nome PT"
                        autoFocus
                      />
                      <input
                        value={addItem.name_en}
                        onChange={e => setAddItem({ ...addItem, name_en: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded-lg text-xs"
                        placeholder="Nome EN"
                      />
                      <button onClick={handleAddServiceOption} disabled={actionLoading === 'add'} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setAddItem(null)} className="text-neutral-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddItem({ type: 'service_option', parentId: sub.slug, name_pt: '', name_en: '', slug: '' })}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                    >
                      <Plus className="w-3 h-3" /> Opção de serviço
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Sugestões pendentes de revisão</h2>
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
                      {actionLoading === ts.id ? '...' : 'Rejeitar'}
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
