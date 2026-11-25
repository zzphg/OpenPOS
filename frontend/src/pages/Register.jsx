import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../hooks/useCurrency'
import { useCart } from '../hooks/useCart'
import { usePricingRules } from '../utils/pricing'
import CartTotals from '../components/CartTotals'
import ConfirmDialog from '../components/ConfirmDialog'
import './Register.css'

const CATEGORIES = ['all', 'Foods', 'Drinks', 'Other']
const CATEGORY_LABELS = { all: 'Todos', Foods: 'Comidas', Drinks: 'Bebidas', Other: 'Outros' }

export default function Register() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const rules = usePricingRules()
  const { cart, totals, qtyOf, add, changeQty, remove: removeFromCart, clear: clearCart } = useCart(rules)
  const [clock, setClock] = useState(new Date())
  const [checkingOut, setCheckingOut] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const searchRef = useRef(null)
  const cartRef = useRef(null)
  const { push } = useToast()

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [])

  // Atalho: "/" leva direto para a busca; Esc fecha o aviso de venda concluída.
  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') setLastOrder(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (err) {
      push('Não foi possível carregar os produtos.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c = { all: products.length, Foods: 0, Drinks: 0, Other: 0 }
    products.forEach((p) => {
      if (c[p.category] !== undefined) c[p.category] += 1
    })
    return c
  }, [products])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter(
      (p) => (activeCategory === 'all' || p.category === activeCategory) && (!term || p.name.toLowerCase().includes(term))
    )
  }, [products, activeCategory, search])

  function addToCart(product) {
    if (!add(product)) {
      push(`Sem estoque suficiente de ${product.name}.`, 'error')
    }
  }

  // Enter na busca adiciona o primeiro resultado disponível: venda rápida só no teclado.
  function handleSearchKey(e) {
    if (e.key === 'Escape') {
      setSearch('')
      e.currentTarget.blur()
    }
    if (e.key === 'Enter') {
      const first = visible.find((p) => (p.stock ?? 0) - qtyOf(p._id) > 0)
      if (first) {
        addToCart(first)
        setSearch('')
      }
    }
  }

  async function checkout() {
    if (!cart.length) return
    setCheckingOut(true)
    try {
      const sale = await api.createSale(cart)
      setLastOrder(sale)
      clearCart()
      push(`Venda #${sale.orderNumber} registrada com sucesso.`, 'success')
    } catch (err) {
      // 409 = estoque insuficiente; a mensagem do servidor diz qual produto.
      push(err.message || 'Não foi possível finalizar a venda.', 'error')
    } finally {
      loadProducts() // estoque mudou (baixa automática) — atualiza a vitrine
      setCheckingOut(false)
    }
  }

  const itemsCount = cart.reduce((n, i) => n + i.qty, 0)
  const dateLabel = clock.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeLabel = clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="register-layout">
      <section className="register-main">
        <div className="page-header register-header">
          <div>
            <h1 className="page-title">Caixa</h1>
            <p className="page-subtitle">
              <span className="date-label">{dateLabel}</span> · <span className="mono">{timeLabel}</span>
            </p>
          </div>
        </div>

        <div className="register-filters">
          <div className="field search-input register-search">
            <IconSearch />
            <input
              ref={searchRef}
              placeholder="Buscar produto (Enter adiciona)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              aria-label="Buscar produto"
            />
            {!search && <span className="kbd">/</span>}
          </div>

          <div className="segmented category-tabs" role="tablist" aria-label="Categorias">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                className={`segment category-tab${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {CATEGORY_LABELS[cat]}
                <span className="segment-count">{counts[cat]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <IconBox />
            </span>
            <div className="empty-state-title">Cadastre seu primeiro produto</div>
            <p>Para vender, primeiro adicione os itens da sua loja com nome, preço e estoque. Leva menos de um minuto.</p>
            <Link className="btn btn-primary" to="/produtos">
              Ir para Produtos
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <IconSearch />
            </span>
            <div className="empty-state-title">Nada encontrado</div>
            <p>
              {search
                ? `Nenhum produto combina com "${search}".`
                : `Nenhum produto em ${CATEGORY_LABELS[activeCategory]}.`}
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearch('')
                setActiveCategory('all')
              }}
            >
              Mostrar todos os produtos
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {visible.map((product) => {
              const inCart = qtyOf(product._id)
              const available = (product.stock ?? 0) - inCart
              return (
                <button
                  key={product._id}
                  className={`product-tile${available <= 0 ? ' out-of-stock' : ''}${inCart > 0 ? ' in-cart' : ''}`}
                  onClick={() => addToCart(product)}
                  disabled={available <= 0}
                >
                  {inCart > 0 && <span className="tile-qty mono">{inCart}</span>}
                  <span className={`tile-cat tile-cat-${product.category.toLowerCase()}`}>{CATEGORY_LABELS[product.category]}</span>
                  <span className="product-tile-name">{product.name}</span>
                  <span className="product-tile-footer">
                    <span className="product-tile-price mono">{formatCurrency(product.price)}</span>
                    <span className={`stock-pill${available <= 0 ? ' empty' : available <= 5 ? ' low' : ''}`}>
                      {available <= 0 ? 'Esgotado' : `${available} un.`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <aside ref={cartRef} className="cart-panel" aria-label="Pedido atual">
        <div className="cart-header">
          <h2>
            Pedido atual {itemsCount > 0 && <span className="cart-count mono">{itemsCount}</span>}
          </h2>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(true)}>
              Limpar
            </button>
          )}
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <span className="empty-icon">
                <IconCart />
              </span>
              <strong>Seu pedido está vazio</strong>
              <ol className="cart-steps">
                <li>Toque nos produtos para adicionar</li>
                <li>Confira quantidades e total</li>
                <li>Finalize a venda</li>
              </ol>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-unit mono">{formatCurrency(item.price)} cada</span>
                </div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => changeQty(item.productId, -1)} aria-label={`Diminuir ${item.name}`}>
                    −
                  </button>
                  <span className="qty-value mono">{item.qty}</span>
                  <button className="qty-btn" onClick={() => changeQty(item.productId, 1)} disabled={item.qty >= item.stock} aria-label={`Aumentar ${item.name}`}>
                    +
                  </button>
                </div>
                <span className="cart-item-total mono">{formatCurrency(item.price * item.qty)}</span>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.productId)} aria-label={`Remover ${item.name}`}>
                  <IconTrash />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <CartTotals totals={totals} rules={rules} />
          <button className="btn btn-primary btn-lg checkout-btn" disabled={!cart.length || checkingOut} onClick={checkout}>
            {checkingOut ? 'Finalizando...' : 'Finalizar venda'}
          </button>
        </div>
      </aside>

      {/* telas pequenas: atalho fixo para o pedido */}
      {itemsCount > 0 && (
        <button className="register-cartbar" onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <span>
            Ver pedido <span className="mono">({itemsCount})</span>
          </span>
          <strong className="mono">{formatCurrency(totals.total)}</strong>
        </button>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Limpar o pedido?"
        message="Todos os itens do pedido atual serão removidos. Os produtos continuam no estoque."
        confirmLabel="Limpar pedido"
        danger
        onConfirm={() => {
          clearCart()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />

      {lastOrder && (
        <div className="dialog-overlay" onClick={() => setLastOrder(null)}>
          <div className="sale-done" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Venda concluída">
            <span className="sale-done-icon">
              <IconCheck />
            </span>
            <div className="sale-done-title">Venda #{String(lastOrder.orderNumber).padStart(4, '0')} concluída</div>
            <div className="sale-done-total mono">{formatCurrency(lastOrder.total)}</div>
            {lastOrder.discount > 0 && (
              <div className="sale-done-discount mono">Desconto aplicado: {formatCurrency(lastOrder.discount)}</div>
            )}
            <button className="btn btn-primary btn-lg" onClick={() => setLastOrder(null)} autoFocus>
              Nova venda
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
function IconBox() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
    </svg>
  )
}
function IconCart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6" />
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
function IconCheck() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}
