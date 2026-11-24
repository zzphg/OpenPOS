import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useDebounce } from '../hooks/useDebounce'
import { formatCurrency } from '../hooks/useCurrency'
import ConfirmDialog from '../components/ConfirmDialog'
import ProductFormModal from '../components/ProductFormModal'
import './Products.css'

const CATEGORY_LABELS = { Foods: 'Comidas', Drinks: 'Bebidas', Other: 'Outros' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // all | low | out
  const { push } = useToast()

  useEffect(() => {
    loadProducts(debouncedSearch)
  }, [debouncedSearch])

  async function loadProducts(searchTerm) {
    setLoading(true)
    try {
      const data = await api.getProducts(searchTerm)
      setProducts(data)
    } catch {
      push('Não foi possível carregar os produtos.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEdit(product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  async function handleSave(values) {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, values)
        push('Produto atualizado.', 'success')
      } else {
        await api.createProduct(values)
        push('Produto criado.', 'success')
      }
      setFormOpen(false)
      loadProducts(debouncedSearch)
    } catch (err) {
      push(err.message || 'Erro ao salvar produto.', 'error')
      throw err
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.deleteProduct(deleteTarget._id)
      push('Produto removido.', 'success')
      setDeleteTarget(null)
      loadProducts(debouncedSearch)
    } catch {
      push('Não foi possível remover o produto.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const statusCounts = useMemo(
    () => ({
      all: products.length,
      low: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
      out: products.filter((p) => !p.stock).length,
    }),
    [products]
  )

  const shown = useMemo(() => {
    if (statusFilter === 'low') return products.filter((p) => p.stock > 0 && p.stock <= 5)
    if (statusFilter === 'out') return products.filter((p) => !p.stock)
    return products
  }, [products, statusFilter])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Cadastre o que você vende, ajuste preços e acompanhe o estoque.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus /> Novo produto
        </button>
      </div>

      <div className="products-toolbar">
        <div className="field search-input">
          <IconSearch />
          <input
            placeholder="Buscar produto pelo nome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar produto pelo nome"
          />
        </div>
        <div className="segmented" role="tablist" aria-label="Situação do estoque">
          {[
            ['all', 'Todos'],
            ['low', 'Estoque baixo'],
            ['out', 'Esgotados'],
          ].map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={statusFilter === value}
              className={`segment${statusFilter === value ? ' active' : ''}`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
              <span className="segment-count">{statusCounts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-page">
          <div className="spinner" />
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon">
            <IconBox />
          </span>
          <div className="empty-state-title">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</div>
          <p>
            {search
              ? 'Confira a grafia ou tente outro termo de busca.'
              : 'Adicione o primeiro item da sua loja com nome, preço e estoque. Depois é só vender no Caixa.'}
          </p>
          {search ? (
            <button className="btn btn-ghost" onClick={() => setSearch('')}>
              Limpar busca
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openCreate}>
              <IconPlus /> Cadastrar primeiro produto
            </button>
          )}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon">
            <IconBox />
          </span>
          <div className="empty-state-title">Tudo certo por aqui</div>
          <p>{statusFilter === 'low' ? 'Nenhum produto com estoque baixo no momento.' : 'Nenhum produto esgotado no momento.'}</p>
          <button className="btn btn-ghost" onClick={() => setStatusFilter('all')}>
            Ver todos os produtos
          </button>
        </div>
      ) : (
        <div className="card products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th className="num">Preço</th>
                <th>Estoque</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p._id}>
                  <td className="products-name">{p.name}</td>
                  <td>
                    <span className={`badge badge-${p.category.toLowerCase()}`}>{CATEGORY_LABELS[p.category]}</span>
                  </td>
                  <td className="mono num products-price">{formatCurrency(p.price)}</td>
                  <td>
                    <span className={`stock-badge${!p.stock ? ' empty' : p.stock <= 5 ? ' low' : ''}`}>
                      {!p.stock ? 'Esgotado' : p.stock <= 5 ? `${p.stock} un. · baixo` : `${p.stock} un.`}
                    </span>
                  </td>
                  <td className="products-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-icon danger-hover"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Excluir ${p.name}`}
                      title="Excluir"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        product={editingProduct}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir produto?"
        message={`"${deleteTarget?.name}" será removido da sua loja. Vendas já registradas continuam no histórico. Essa ação não pode ser desfeita.`}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir produto'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}
function IconBox() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  )
}
