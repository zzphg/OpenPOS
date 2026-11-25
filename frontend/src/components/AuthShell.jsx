import '../pages/Auth.css'

// Moldura compartilhada de Login e Cadastro: painel da marca à esquerda, formulário à direita.
export default function AuthShell({ children }) {
  return (
    <div className="auth-screen">
      <aside className="auth-aside">
        <div className="auth-aside-brand">
          <img src="/logo-mark.png" alt="" width="40" height="40" />
          <span>OpenPOS</span>
        </div>

        <div className="auth-aside-body">
          <h2>Venda mais rápido. Controle seu estoque. Tenha sua loja online.</h2>
          <ul>
            <li>
              <span className="auth-check" aria-hidden="true" />
              Caixa simples: toque nos produtos e finalize o pedido
            </li>
            <li>
              <span className="auth-check" aria-hidden="true" />
              Estoque que baixa sozinho a cada venda
            </li>
            <li>
              <span className="auth-check" aria-hidden="true" />
              Desconto automático em compras grandes
            </li>
            <li>
              <span className="auth-check" aria-hidden="true" />
              Link da loja para seus clientes comprarem online
            </li>
          </ul>
        </div>

        <div className="auth-aside-foot">Ponto de venda para pequenos negócios</div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  )
}
