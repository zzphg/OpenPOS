import { formatCurrency } from '../hooks/useCurrency'
import './CartTotals.css'

// Resumo financeiro do carrinho: subtotal, desconto (quando houver) e total,
// mais uma barra mostrando quanto falta para ganhar o desconto.
export default function CartTotals({ totals, rules }) {
  const percent = Math.round(rules.discountRate * 100)
  const hasItems = totals.subtotal > 0
  const progress = Math.min(100, (totals.subtotal / rules.discountThreshold) * 100)

  return (
    <div className="cart-totals">
      {hasItems && (
        <div className="cart-totals-row">
          <span>Subtotal</span>
          <span className="mono">{formatCurrency(totals.subtotal)}</span>
        </div>
      )}

      {totals.discount > 0 ? (
        <div className="cart-totals-row cart-totals-discount">
          <span>Desconto ({percent}%) aplicado</span>
          <span className="mono">− {formatCurrency(totals.discount)}</span>
        </div>
      ) : (
        hasItems && (
          <div className="cart-totals-hint">
            <div className="cart-totals-hint-text">
              Faltam <strong className="mono">{formatCurrency(totals.missingForDiscount)}</strong> para ganhar {percent}% de desconto
            </div>
            <div className="cart-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )
      )}

      <div className="cart-total-row">
        <span>Total a pagar</span>
        <span className="cart-total mono">{formatCurrency(totals.total)}</span>
      </div>
    </div>
  )
}
