import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { api } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../hooks/useCurrency'
import './Dashboard.css'

const CATEGORY_LABELS = { Foods: 'Comidas', Drinks: 'Bebidas', Other: 'Outros' }
const CATEGORY_COLORS = { Foods: 'var(--chart-foods)', Drinks: 'var(--chart-drinks)', Other: 'var(--chart-other)' }

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 12.5,
  color: 'var(--text)',
  boxShadow: 'var(--shadow-card)',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentSales, setRecentSales] = useState([])
  const [products, setProducts] = useState(null)
  const { push } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch(() => push('Não foi possível carregar as estatísticas.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // Listas de apoio (últimas vendas e estoque). Se falharem, o painel segue funcionando sem elas.
  useEffect(() => {
    if (!stats) return
    api.getSales().then((list) => setRecentSales(list.slice(0, 5))).catch(() => {})
    api.getProducts().then(setProducts).catch(() => {})
  }, [stats])

  const lowStock = useMemo(
    () => (products || []).filter((p) => (p.stock ?? 0) <= 5).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5),
    [products]
  )
  const periodTotal = useMemo(() => (stats?.byDay || []).reduce((sum, d) => sum + (d.total || 0), 0), [stats])

  async function copyStoreLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/loja/${encodeURIComponent(user.username)}`)
      push('Link da loja copiado. É só enviar para seus clientes.', 'success')
    } catch {
      push('Não foi possível copiar o link.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    )
  }

  const hasData = stats && stats.totalOrders > 0
  const hasProducts = (products?.length ?? 0) > 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel</h1>
          <p className="page-subtitle">Como sua loja está vendendo: receita, pedidos e categorias que mais rendem.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          tone="lavender"
          icon={<IconMoney />}
          label="Receita total"
          value={formatCurrency(stats?.totalRevenue)}
          hint="Soma das vendas pagas"
        />
        <KpiCard
          tone="periwinkle"
          icon={<IconBag />}
          label="Pedidos finalizados"
          value={stats?.totalOrders ?? 0}
          hint="Caixa e loja online"
        />
        <KpiCard
          tone="sky"
          icon={<IconTrend />}
          label="Ticket médio"
          value={formatCurrency(stats?.averageOrder)}
          hint="Valor médio por pedido"
        />
        <KpiCard
          tone="mix"
          icon={<IconPercent />}
          label="Descontos concedidos"
          value={formatCurrency(stats?.totalDiscount)}
          hint={`${stats?.discountedOrders ?? 0} pedido(s) com desconto`}
        />
      </div>

      {!hasData ? (
        <div className="card getting-started">
          <div className="getting-started-head">
            <h2>Comece por aqui</h2>
            <p>Três passos para ver seus números aparecerem neste painel.</p>
          </div>
          <ol className="steps">
            <li className={`step${hasProducts ? ' done' : ''}`}>
              <span className="step-num">{hasProducts ? <IconDone /> : 1}</span>
              <div className="step-body">
                <strong>Cadastre seus produtos</strong>
                <span>Nome, preço e quantidade em estoque.</span>
              </div>
              <Link className="btn btn-ghost btn-sm" to="/produtos">
                {hasProducts ? 'Ver produtos' : 'Cadastrar'}
              </Link>
            </li>
            <li className="step">
              <span className="step-num">2</span>
              <div className="step-body">
                <strong>Faça a primeira venda</strong>
                <span>Escolha os itens no Caixa e finalize o pedido.</span>
              </div>
              <Link className="btn btn-primary btn-sm" to="/">
                Ir para o Caixa
              </Link>
            </li>
            <li className="step">
              <span className="step-num">3</span>
              <div className="step-body">
                <strong>Compartilhe sua loja online</strong>
                <span>Seus clientes compram pelo link e o estoque baixa sozinho.</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={copyStoreLink}>
                Copiar link
              </button>
            </li>
          </ol>
        </div>
      ) : (
        <>
          <div className="dashboard-charts">
            <div className="chart-card chart-hero">
              <div className="chart-head">
                <div>
                  <span className="chart-eyebrow">Visão geral</span>
                  <h3>Receita nos últimos dias</h3>
                </div>
                <div className="chart-total">
                  <span>No período</span>
                  <strong className="mono">{formatCurrency(periodTotal)}</strong>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.byDay} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-line-a)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-line-a)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--chart-line-a)" />
                      <stop offset="100%" stopColor="var(--chart-line-b)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="var(--hero-grid)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    tick={{ fill: 'var(--hero-muted)', fontSize: 11.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--hero-muted)', fontSize: 11.5 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(v).replace(',00', '')}
                    width={74}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: 'var(--text-muted)' }}
                    formatter={(v) => [formatCurrency(v), 'Receita']}
                    labelFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')}
                  />
                  <Area type="monotone" dataKey="total" stroke="url(#revenueStroke)" strokeWidth={3} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card chart-card">
              <div className="chart-head">
                <div>
                  <span className="chart-eyebrow dim">Distribuição</span>
                  <h3>Receita por categoria</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.byCategory} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickFormatter={(c) => CATEGORY_LABELS[c] || c}
                    tick={{ fill: 'var(--chart-tick)', fontSize: 11.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--chart-tick)', fontSize: 11.5 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(v).replace(',00', '')}
                    width={74}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--surface-sunken)' }}
                    formatter={(v, _n, item) => [formatCurrency(v), CATEGORY_LABELS[item.payload.category]]}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {stats.byCategory.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || 'var(--chart-other)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-lists">
            <div className="card list-card">
              <div className="list-head">
                <h3>Últimas vendas</h3>
                <Link className="btn btn-primary btn-sm" to="/vendas">
                  Ver todas
                </Link>
              </div>
              {recentSales.length === 0 ? (
                <p className="list-empty">As vendas mais recentes aparecem aqui.</p>
              ) : (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Quando</th>
                      <th>Canal</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale._id}>
                        <td className="mono strong">#{String(sale.orderNumber).padStart(4, '0')}</td>
                        <td>
                          {new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                          <span className="dim mono">
                            {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td>
                          <span className={`channel-pill ${sale.channel === 'loja' ? 'online' : 'caixa'}`}>
                            {sale.channel === 'loja' ? 'Loja online' : 'Caixa'}
                          </span>
                        </td>
                        <td className="mono num strong">{formatCurrency(sale.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card list-card">
              <div className="list-head">
                <h3>Estoque para repor</h3>
                <Link className="btn btn-primary btn-sm" to="/produtos">
                  Ver produtos
                </Link>
              </div>
              {products === null ? (
                <p className="list-empty">Carregando estoque...</p>
              ) : lowStock.length === 0 ? (
                <p className="list-empty ok">Tudo certo: nenhum produto com estoque baixo.</p>
              ) : (
                <ul className="stock-list">
                  {lowStock.map((p) => (
                    <li key={p._id}>
                      <span className="stock-name">{p.name}</span>
                      <span className={`stock-badge${!p.stock ? ' empty' : ' low'}`}>{!p.stock ? 'Esgotado' : `${p.stock} un.`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, hint, icon, tone }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-text">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value mono">{value}</span>
        {hint && <span className="kpi-hint">{hint}</span>}
      </div>
      <span className={`kpi-icon kpi-icon-${tone}`} aria-hidden="true">
        {icon}
      </span>
    </div>
  )
}

const ic = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }
function IconMoney() {
  return (
    <svg {...ic}>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" />
    </svg>
  )
}
function IconBag() {
  return (
    <svg {...ic}>
      <path d="M6 7h12l1 13H5Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  )
}
function IconTrend() {
  return (
    <svg {...ic}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  )
}
function IconPercent() {
  return (
    <svg {...ic}>
      <path d="m19 5-14 14" />
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
    </svg>
  )
}
function IconDone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}
