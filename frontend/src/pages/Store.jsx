// LOJA DO CLIENTE — interface pública onde o cliente simula uma compra.
// Acessada por /loja/<username-do-lojista>, sem login. Usa as rotas
// /api/public/... e o MESMO serviço de checkout do Caixa no back-end:
// estoque baixa automaticamente e o desconto de 5% (> R$ 200) é aplicado.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../hooks/useCurrency'
import { useCart } from '../hooks/useCart'
import { usePricingRules } from '../utils/pricing'
import CartTotals from '../components/CartTotals'
import './Register.css' // reaproveita carrinho/abas do Caixa
import './Store.css'

const CATEGORY_LABELS = { all: 'Todos', Foods: 'Comidas', Drinks: 'Bebidas', Other: 'Outros' }

export default function Store() {
  const { username } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [buying, setBuying] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const rules = usePricingRules()
  const { cart, totals, qtyOf, add, changeQty, remove, clear } = useCart(rules)
  const { push } = useToast()
  const cartRef = useRef(null)
  const percent = Math.round(rules.discountRate * 100)

  useEffect(() => {
    loadStore()
  }, [username])

  async function loadStore() {
    try {
      const data = await api.getStore(username)
      setStore(data.store)
      setProducts(data.products)
    } catch (err) {
      if (err.status === 404) setNotFound(true)
      else push('Não foi possível carregar a loja.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter(
      (p) => (category === 'all' || p.category === category) && (!term || p.name.toLowerCase().includes(term))
    )
  }, [products, category, search])

  function handleAdd(product) {
    if (!add(product)) push(`Não há mais unidades de ${product.name} em estoque.`, 'error')
  }

  async function handleBuy() {
    if (!cart.length) return
    setBuying(true)
    try {
      const result = await api.buyFromStore(username, cart)
      setReceipt(result)
      clear()
    } catch (err) {
      push(err.message || 'Não foi possível concluir a compra.', 'error')
    } finally {
      setBuying(false)
      loadStore() // atualiza o estoque exibido
    }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="store-shell">
        <div className="empty-state">
          <span className="empty-icon">
            <IconStore />
          </span>
          <div className="empty-state-title">Loja não encontrada</div>
          <p>Confira o endereço com a loja. O link deve terminar com o nome de usuário do lojista.</p>
        </div>
      </div>
    )
  }

  const itemsCount = cart.reduce((n, i) => n + i.qty, 0)
  const storeName = store?.name || username

  return (
    <div className="store-page">
      <header className="store-hero">
        <div className="store-hero-inner">
          <div className="store-brand">
            <span className="sidebar-mark">{storeName[0].toUpperCase()}</span>
            <div>
              <h1>{storeName}</h1>
              <p>Compre online · retire na loja</p>
            </div>
          </div>
          <div className="store-promo">
            <strong>{percent}% OFF</strong> em compras acima de {formatCurrency(rules.discountThreshold)}
          </div>
        </div>
      </header>

      <div className="store-shell">
        <div className="store-layout">
          <section>
            <div className="store-toolbar">
              <div className="field search-input store-search-wrap">
                <IconSearch />
                <input
                  className="store-search"
                  placeholder="Buscar produto"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar produto"
                />
              </div>
              <div className="segmented category-tabs" role="tablist" aria-label="Categorias">
                {Object.keys(CATEGORY_LABELS).map((cat) => (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={category === cat}
                    className={`segment category-tab${category === cat ? ' active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <IconSearch />
                </span>
                <div className="empty-state-title">Nenhum produto encontrado</div>
                <p>Tente outro termo ou escolha outra categoria.</p>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearch('')
                    setCategory('all')
                  }}
                >
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <div className="store-grid">
                {visible.map((p) => {
                  const inCart = qtyOf(p._id)
                  const available = p.stock - inCart
                  return (
                    <article key={p._id} className={`store-card${p.stock <= 0 ? ' sold-out' : ''}`}>
                      <div className={`store-thumb thumb-${p.category.toLowerCase()}`} aria-hidden="true">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="store-card-body">
                        <span className={`badge badge-${p.category.toLowerCase()}`}>{CATEGORY_LABELS[p.category]}</span>
                        <h3>{p.name}</h3>
                        <div className="store-card-price mono">{formatCurrency(p.price)}</div>
                        <div className={`store-card-stock${p.stock > 0 && p.stock <= 5 ? ' low' : ''}`}>
                          {p.stock <= 0 ? 'Esgotado' : p.stock <= 5 ? `Restam só ${p.stock}` : 'Em estoque'}
                        </div>
                      </div>
                      {inCart > 0 ? (
                        <div className="store-stepper">
                          <button onClick={() => changeQty(p._id, -1)} aria-label={`Diminuir ${p.name}`}>
                            −
                          </button>
                          <span className="mono">{inCart} no carrinho</span>
                          <button onClick={() => handleAdd(p)} disabled={available <= 0} aria-label={`Aumentar ${p.name}`}>
                            +
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-primary" disabled={available <= 0} onClick={() => handleAdd(p)}>
                          {p.stock <= 0 ? 'Indisponível' : 'Adicionar ao carrinho'}
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <aside ref={cartRef} className="cart-panel store-cart" aria-label="Seu carrinho">
            <div className="cart-header">
              <h2>
                Seu carrinho {itemsCount > 0 && <span className="cart-count mono">{itemsCount}</span>}
              </h2>
              {cart.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={clear}>
                  Esvaziar
                </button>
              )}
            </div>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <span className="empty-icon">
                    <IconCart />
                  </span>
                  <strong>Seu carrinho está vazio</strong>
                  <p>Adicione produtos para ver o total e finalizar a compra.</p>
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
                    <button className="cart-item-remove" onClick={() => remove(item.productId)} aria-label={`Remover ${item.name}`}>
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="cart-footer">
              <CartTotals totals={totals} rules={rules} />
              <button className="btn btn-primary btn-lg checkout-btn" disabled={!cart.length || buying} onClick={handleBuy}>
                {buying ? 'Processando...' : 'Finalizar compra'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* telas pequenas: atalho fixo para o carrinho */}
      {itemsCount > 0 && (
        <button className="store-cartbar" onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <span>
            Ver carrinho <span className="mono">({itemsCount})</span>
          </span>
          <strong className="mono">{formatCurrency(totals.total)}</strong>
        </button>
      )}

      {receipt && <Receipt receipt={receipt} onClose={() => setReceipt(null)} />}
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
function IconCart() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  )
}
function IconStore() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18l-1.5-5h-15Z" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </svg>
  )
}

function Receipt({ receipt, onClose }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="store-receipt" onClick={(e) => e.stopPropagation()}>
        <div className="store-receipt-head">
          <span className="store-receipt-check">✓</span>
          <div>
            <h3>Compra confirmada!</h3>
            <p className="mono">Pedido #{String(receipt.orderNumber).padStart(4, '0')}</p>
          </div>
        </div>

        <div className="store-receipt-lines">
          {receipt.items.map((item, i) => (
            <div key={i} className="store-receipt-line">
              <span>{item.qty}× {item.name}</span>
              <span className="mono">{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="store-receipt-line muted">
          <span>Subtotal</span>
          <span className="mono">{formatCurrency(receipt.subtotal)}</span>
        </div>
        {receipt.discount > 0 && (
          <div className="store-receipt-line discount">
            <span>Desconto ({Math.round(receipt.discountRate * 100)}%)</span>
            <span className="mono">− {formatCurrency(receipt.discount)}</span>
          </div>
        )}
        <div className="store-receipt-line total">
          <span>Total</span>
          <span className="mono">{formatCurrency(receipt.total)}</span>
        </div>

        <button className="btn btn-primary checkout-btn" onClick={onClose}>
          Continuar comprando
        </button>
      </div>
    </div>
  )
}
