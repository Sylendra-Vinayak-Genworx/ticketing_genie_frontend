import React from 'react'
import {
  Plus, Search, Pencil, Trash2, Loader2, PackageOpen,
  ToggleLeft, ToggleRight, Package,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner, EmptyState } from '@/components/common/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { useProducts } from '../hooks/useProducts'

export default function ProductsPage() {
  const {
    filtered, loading, search, setSearch,
    showInactive, setShowInactive,
    modalMode, selected, form, setForm, saving, togglingId,
    activeCount, inactiveCount, products,
    openCreate, openEdit, openDelete, closeModal,
    handleCreate, handleUpdate, handleDelete, handleToggleActive,
  } = useProducts()

  const modalTitle = modalMode === 'create' ? 'Add New Product'
    : modalMode === 'edit'   ? 'Edit Product'
    : modalMode === 'delete' ? 'Delete Product'
    : ''

  const modalFooter = modalMode === 'delete' ? (
    <>
      <button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button>
      <button onClick={handleDelete} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Delete
      </button>
    </>
  ) : (
    <>
      <button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button>
      <button
        onClick={modalMode === 'create' ? handleCreate : handleUpdate}
        disabled={saving}
        className="btn-primary flex items-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {modalMode === 'create' ? 'Create Product' : 'Save Changes'}
      </button>
    </>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        subtitle="Manage the product catalogue used when filing tickets"
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'text-gray-900' },
          { label: 'Active',         value: activeCount,     color: 'text-green-600' },
          { label: 'Inactive',       value: inactiveCount,   color: 'text-gray-400'  },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex flex-col gap-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => setShowInactive(v => !v)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
            showInactive
              ? 'bg-gray-100 text-gray-700 border-gray-300'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
        >
          {showInactive
            ? <ToggleRight className="w-4 h-4 text-blue-600" />
            : <ToggleLeft  className="w-4 h-4 text-gray-400" />}
          Show inactive
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner fullPage text="Loading products…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="w-12 h-12" />}
            title="No products found"
            description={search ? `No matches for "${search}"` : 'Add your first product to get started.'}
            action={
              <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const isToggling = togglingId === p.product_id
                  return (
                    <tr key={p.product_id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            p.is_active ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Package className={`w-4 h-4 ${p.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <span className={`font-medium ${p.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {p.description || <span className="text-gray-300 italic">No description</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors disabled:opacity-50 ${
                            p.is_active
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                          title={p.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {isToggling
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : p.is_active
                              ? <ToggleRight className="w-3.5 h-3.5" />
                              : <ToggleLeft  className="w-3.5 h-3.5" />}
                          {p.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDelete(p)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalMode !== null} onClose={closeModal} title={modalTitle} footer={modalFooter}>
        {(modalMode === 'create' || modalMode === 'edit') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field" placeholder="e.g. bookmyticket, mobile-app, payments…"
                maxLength={100} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input-field resize-none" rows={3}
                placeholder="Optional short description of this product…" maxLength={500} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="button"
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.is_active ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.is_active ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {form.is_active ? 'Active — visible in ticket creation' : 'Inactive — hidden from ticket creation'}
              </span>
            </div>
          </div>
        )}

        {modalMode === 'delete' && selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">
                Are you sure you want to permanently delete <strong>"{selected.name}"</strong>?
                This action cannot be undone.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Consider deactivating the product instead if you want to hide it from ticket creation without losing history.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}