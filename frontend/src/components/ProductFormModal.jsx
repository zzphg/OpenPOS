import { useEffect, useState } from 'react'
import './ProductFormModal.css'

const CATEGORIES = [
  { value: 'Foods', label: 'Comidas' },
  { value: 'Drinks', label: 'Bebidas' },
  { value: 'Other', label: 'Outros' },
]

const EMPTY = { name: '', price: '', category: 'Foods', stock: '' }

export default function ProductFormModal({ open, product, onClose, onSave }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(
        product
          ? { name: product.name, price: String(product.price), category: product.category, stock: String(product.stock ?? 0) }
          : EMPTY
      )
      setErrors({})
    }
  }, [open, product])

  if (!open) return null

  function validate() {
    const next = {}
    if (!values.name.trim()) next.name = 'Informe um nome'
    else if (values.name.length > 36) next.name = 'Máximo de 36 caracteres'

    const priceNum = Number(String(values.price).replace(',', '.'))
    if (values.price === '' || Number.isNaN(priceNum) || priceNum < 0) {
      next.price = 'Informe um preço válido'
    }

    const stockNum = Number(values.stock)
    if (values.stock === '' || !Number.isInteger(stockNum) || stockNum < 0) {
      next.stock = 'Informe um estoque inteiro (0 ou mais)'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await onSave({
        name: values.name.trim(),
        price: Number(String(values.price).replace(',', '.')),
        category: values.category,
        stock: Number(values.stock),
      })
    } catch {
      // erro já tratado/mostrado via toast pelo componente pai
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <form className="product-form-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <div className="product-form-head">
          <h3>{product ? 'Editar produto' : 'Novo produto'}</h3>
          <p>{product ? 'Atualize os dados e salve.' : 'Preencha o básico. Você pode editar depois.'}</p>
        </div>

        <div className="field">
          <label htmlFor="product-name">Nome do produto</label>
          <input
            id="product-name"
            className={errors.name ? 'has-error' : ''}
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Ex.: Café coado 200 ml"
            autoFocus
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="product-form-row">
          <div className="field">
            <label htmlFor="product-price">Preço de venda</label>
            <div className="input-affix">
              <span aria-hidden="true">R$</span>
              <input
                id="product-price"
                className={errors.price ? 'has-error' : ''}
                value={values.price}
                onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>
          <div className="field">
            <label htmlFor="product-stock">Estoque</label>
            <div className="input-affix suffix">
              <input
                id="product-stock"
                className={errors.stock ? 'has-error' : ''}
                value={values.stock}
                onChange={(e) => setValues((v) => ({ ...v, stock: e.target.value }))}
                placeholder="0"
                inputMode="numeric"
              />
              <span aria-hidden="true">un.</span>
            </div>
            {errors.stock && <span className="field-error">{errors.stock}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="product-category">Categoria</label>
          <select
            id="product-category"
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="field-hint">Define em qual aba o produto aparece no Caixa e na loja online.</span>
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : product ? 'Salvar alterações' : 'Criar produto'}
          </button>
        </div>
      </form>
    </div>
  )
}
