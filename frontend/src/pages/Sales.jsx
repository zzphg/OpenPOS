import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../hooks/useCurrency'
import './Sales.css'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [channel, setChannel] = useState('all') // all | caixa | loja
  const { push } = useToast()

  useEffect(() => {
    api
      .getSales()
      .then(setSales)
      .catch(() => push('Não foi possível carregar o histórico de vendas.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const channelCounts = useMemo(
    () => ({
      all: sales.length,
      caixa: sales.filter((x) => x.channel !== 'loja').length,
      loja: sales.filter((x) => x.channel === 'loja').length,
    }),
    [sales]
  )

  const shown = useMemo(() => {
    if (channel === 'caixa') return sales.filter((x) => x.channel !== 'loja')
    if (channel === 'loja') return sales.filter((x) => x.channel === 'loja')
    return sales
  }, [sales, channel])

  const shownTotal = shown.reduce((sum, x) => sum + (x.total || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendas</h1>
          <p className="page-subtitle">Todos os pedidos feitos no Caixa e na sua loja online. Toque em um pedido para ver os itens.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-page">
          <div className="spinner" />
        </div>
      ) : sales.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon">
            <IconReceipt />
          </span>
          <div className="empty-state-title">Nenhuma venda registrada ainda</div>
          <p>Quando você finalizar um pedido no Caixa ou receber uma compra pela loja online, ele aparece aqui.</p>
          <Link className="btn btn-primary" to="/">
            Fazer a primeira venda
          </Link>
        </div>
      ) : (
        <>
          <div className="sales-toolbar">
            <div className="segmented" role="tablist" aria-label="Canal de venda">
              {[
                ['all', 'Todas'],
                ['caixa', 'Caixa'],
                ['loja', 'Loja online'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={channel === value}
                  className={`segment${channel === value ? ' active' : ''}`}
                  onClick={() => setChannel(value)}
                >
                  {label}
                  <span className="segment-count">{channelCounts[value]}</span>
                </button>
              ))}
            </div>
            <div className="sales-summary-line">
              <span>{shown.length} pedido(s)</span>
              <strong className="mono">{formatCurrency(shownTotal)}</strong>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-title">Nenhuma venda neste canal</div>
              <p>Ainda não há pedidos feitos por aqui.</p>
            </div>
          ) : (
            <div className="sales-list">
              {shown.map((sale) => {
                const isOpen = expanded === sale._id
                const date = new Date(sale.createdAt)
                return (
                  <div key={sale._id} className={`card sale-card${isOpen ? ' open' : ''}`}>
                    <button className="sale-summary" onClick={() => setExpanded(isOpen ? null : sale._id)} aria-expanded={isOpen}>
                      <div className="sale-order-number mono">#{String(sale.orderNumber).padStart(4, '0')}</div>
                      <div className="sale-meta">
                        <span className="sale-date">
                          {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="sale-items-count">
                          {sale.items.length} item(ns)
                          <span className={`sale-channel ${sale.channel === 'loja' ? 'online' : 'caixa'}`}>
                            {sale.channel === 'loja' ? 'Loja online' : 'Caixa'}
                          </span>
                          {sale.discount > 0 && <span className="sale-discount-tag">−{Math.round(sale.discountRate * 100)}%</span>}
                        </span>
                      </div>
                      <div className="sale-total mono">{formatCurrency(sale.total)}</div>
                      <IconChevron open={isOpen} />
                    </button>
                    {isOpen && (
                      <div className="sale-details">
                        {sale.items.map((item, i) => (
                          <div key={i} className="sale-detail-row">
                            <span>
                              {item.qty}× {item.name}
                            </span>
                            <span className="mono">{formatCurrency(item.price * item.qty)}</span>
                          </div>
                        ))}
                        <div className="sale-detail-row sale-detail-sum">
                          <span>Subtotal</span>
                          <span className="mono">{formatCurrency(sale.subtotal ?? sale.total)}</span>
                        </div>
                        {sale.discount > 0 && (
                          <div className="sale-detail-row sale-detail-discount">
                            <span>Desconto ({Math.round(sale.discountRate * 100)}%)</span>
                            <span className="mono">− {formatCurrency(sale.discount)}</span>
                          </div>
                        )}
                        <div className="sale-detail-row sale-detail-total">
                          <span>Total pago</span>
                          <span className="mono">{formatCurrency(sale.total)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function IconReceipt() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6" />
    </svg>
  )
}
function IconChevron({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
