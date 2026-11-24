import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import './Layout.css'

// Cada item diz, em linguagem simples, para que serve a tela.
const NAV_GROUPS = [
  {
    title: 'Operação do dia',
    items: [
      { to: '/', label: 'Caixa', hint: 'Registrar vendas', icon: IconRegister, tone: 'lavender' },
      { to: '/produtos', label: 'Produtos', hint: 'Preços e estoque', icon: IconBox, tone: 'periwinkle' },
      { to: '/vendas', label: 'Vendas', hint: 'Histórico de pedidos', icon: IconReceipt, tone: 'sky' },
    ],
  },
  {
    title: 'Acompanhamento',
    items: [{ to: '/dashboard', label: 'Painel', hint: 'Resultados da loja', icon: IconChart, tone: 'indigo' }],
  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('openpos-theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('openpos-theme', theme)
    } catch {
      /* navegador sem armazenamento: o tema vale só nesta sessão */
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const storePath = user ? `/loja/${encodeURIComponent(user.username)}` : ''

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  async function copyStoreLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${storePath}`)
      push('Link da loja copiado. É só enviar para seus clientes.', 'success')
    } catch {
      push('Não foi possível copiar. Use o botão Abrir e copie o endereço.', 'error')
    }
  }

  return (
    <div className="shell">
      {/* barra superior: só aparece em telas pequenas */}
      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          {user && (
            <a className="topbar-btn" href={storePath} target="_blank" rel="noreferrer" aria-label="Abrir minha loja online">
              <IconStore />
            </a>
          )}
          <button className="topbar-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <button className="topbar-btn" onClick={handleLogout} aria-label="Sair da conta">
            <IconLogout />
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              {group.items.map(({ to, label, hint, icon: Icon, tone }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span className={`nav-icon tone-${tone}`}>
                    <Icon />
                  </span>
                  <span className="nav-text">
                    <span className="nav-label">{label}</span>
                    <span className="nav-hint">{hint}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {user && (
          <div className="side-store">
            <div className="side-store-head">
              <IconStore />
              <span>Sua loja online</span>
            </div>
            <p>Seus clientes compram pelo link e o estoque baixa sozinho.</p>
            <div className="side-store-actions">
              <a className="side-store-btn primary" href={storePath} target="_blank" rel="noreferrer">
                Abrir
              </a>
              <button className="side-store-btn" onClick={copyStoreLink}>
                <IconCopy /> Copiar link
              </button>
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{(user?.username || '?')[0].toUpperCase()}</div>
            <div className="sidebar-user-text">
              <div className="sidebar-username">{user?.name || user?.username}</div>
              <div className="sidebar-username-sub">@{user?.username}</div>
            </div>
          </div>
          <button
            className="sidebar-logout"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <button className="sidebar-logout" onClick={handleLogout} aria-label="Sair da conta" title="Sair">
            <IconLogout />
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-band" aria-hidden="true" />
        <Outlet />
      </main>
    </div>
  )
}

function Brand() {
  return (
    <div className="brand">
      <img className="brand-mark" src="/logo-mark.png" alt="" width="36" height="36" />
      <div>
        <div className="brand-name">OpenPOS</div>
        <div className="brand-sub">Ponto de venda</div>
      </div>
    </div>
  )
}

const iconProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }

function IconRegister() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M7 8V6a5 5 0 0 1 10 0v2" />
      <path d="M12 12v4M9 14h6" />
    </svg>
  )
}
function IconBox() {
  return (
    <svg {...iconProps}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}
function IconReceipt() {
  return (
    <svg {...iconProps}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg {...iconProps}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15v-3M12 15V8M16 15v-6" />
    </svg>
  )
}
function IconStore() {
  return (
    <svg {...iconProps} width="18" height="18">
      <path d="M3 9h18l-1.5-5h-15Z" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </svg>
  )
}
function IconCopy() {
  return (
    <svg {...iconProps} width="14" height="14" strokeWidth="2">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg {...iconProps} width="18" height="18">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg {...iconProps} width="18" height="18">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}
function IconMoon() {
  return (
    <svg {...iconProps} width="18" height="18">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}
