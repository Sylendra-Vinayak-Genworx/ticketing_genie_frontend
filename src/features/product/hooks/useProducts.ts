import { useEffect, useState, useCallback } from 'react'
import { productService } from '../service/productService'
import type { Product, ProductCreateRequest, ProductUpdateRequest } from '@/types'
import toast from 'react-hot-toast'

type ModalMode = 'create' | 'edit' | 'delete' | null

interface ProductForm {
  name: string
  description: string
  is_active: boolean
}

const EMPTY_FORM: ProductForm = { name: '', description: '', is_active: true }

export function useProducts() {
  const [products, setProducts]         = useState<Product[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalMode, setModalMode]       = useState<ModalMode>(null)
  const [selected, setSelected]         = useState<Product | null>(null)
  const [form, setForm]                 = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [togglingId, setTogglingId]     = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productService.listProducts(false)
      setProducts(data)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    const matchActive = showInactive ? true : p.is_active
    return matchSearch && matchActive
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setSelected(null)
    setModalMode('create')
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description ?? '', is_active: p.is_active })
    setSelected(p)
    setModalMode('edit')
  }

  function openDelete(p: Product) {
    setSelected(p)
    setModalMode('delete')
  }

  function closeModal() {
    setModalMode(null)
    setSelected(null)
    setForm(EMPTY_FORM)
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast.error('Product name is required'); return }
    setSaving(true)
    try {
      const payload: ProductCreateRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        is_active: form.is_active,
      }
      const created = await productService.createProduct(payload)
      setProducts(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success(`Product "${created.name}" created`)
      closeModal()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!selected || !form.name.trim()) { toast.error('Product name is required'); return }
    setSaving(true)
    try {
      const payload: ProductUpdateRequest = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        is_active: form.is_active,
      }
      const updated = await productService.updateProduct(selected.product_id, payload)
      setProducts(prev =>
        prev.map(p => p.product_id === updated.product_id ? updated : p)
            .sort((a, b) => a.name.localeCompare(b.name))
      )
      toast.success(`Product "${updated.name}" updated`)
      closeModal()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setSaving(true)
    try {
      await productService.deleteProduct(selected.product_id)
      setProducts(prev => prev.filter(p => p.product_id !== selected.product_id))
      toast.success(`Product "${selected.name}" deleted`)
      closeModal()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete product')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(p: Product) {
    setTogglingId(p.product_id)
    try {
      const updated = await productService.updateProduct(p.product_id, { is_active: !p.is_active })
      setProducts(prev => prev.map(x => x.product_id === updated.product_id ? updated : x))
      toast.success(`"${p.name}" ${updated.is_active ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update product status')
    } finally {
      setTogglingId(null)
    }
  }

  const activeCount   = products.filter(p => p.is_active).length
  const inactiveCount = products.filter(p => !p.is_active).length

  return {
    products, filtered, loading, search, setSearch,
    showInactive, setShowInactive,
    modalMode, selected, form, setForm, saving, togglingId,
    activeCount, inactiveCount,
    openCreate, openEdit, openDelete, closeModal,
    handleCreate, handleUpdate, handleDelete, handleToggleActive,
  }
}
