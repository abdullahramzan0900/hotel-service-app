import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { getPublicMenu, submitOrder } from '../api/client';
import GuestContactFields from '../components/GuestContactFields';
import { validateContact } from '../utils/validate';
import '../styles/orderFood.scss';

export default function OrderFoodPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({}); // { menuItemId: quantity }
  const [showCheckout, setShowCheckout] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    getPublicMenu()
      .then(setMenu)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const groups = {};
    for (const item of menu) {
      groups[item.category] = groups[item.category] || [];
      groups[item.category].push(item);
    }
    return groups;
  }, [menu]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menu.find((m) => m.id === id);
        return item ? { ...item, quantity: qty } : null;
      })
      .filter(Boolean);
  }, [cart, menu]);

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const updateQty = (id, delta) => {
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      return next;
    });
  };

  const handleChange = (field, val) => setValues((v) => ({ ...v, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const contactErrors = validateContact(values);
    setErrors(contactErrors);
    if (Object.keys(contactErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      await submitOrder(token, {
        ...values,
        items: cartItems.map((i) => ({ menuItemId: i.id, quantity: i.quantity }))
      });
      navigate(`/r/${token}/confirmation`, {
        state: {
          title: 'Order Pending Approval',
          message: `Your order (£${total.toFixed(2)}) has been sent to the kitchen. You'll receive an email once it's approved - it will then be added to your room bill.`,
          isPending: true
        }
      });
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page order-page">
        <div className="page-content center-content">
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="page order-page fade-in">
        <div className="form-header">
          <button className="btn-ghost back-btn" onClick={() => setShowCheckout(false)}>← Back to menu</button>
          <h2>Confirm Your Order</h2>
        </div>
        <div className="page-content">
          <div className="cart-summary">
            {cartItems.map((item) => (
              <div className="cart-line" key={item.id}>
                <span>{item.quantity} x {item.name}</span>
                <span>£{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="cart-total">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <GuestContactFields values={values} errors={errors} onChange={handleChange} />
            {serverError && <div className="field-error server-error">{serverError}</div>}
            <button className="btn btn-gold" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : `Place Order · £${total.toFixed(2)}`}
            </button>
            <p className="checkout-note">Payment isn't taken now - approved orders are added to your room bill at checkout.</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page order-page fade-in">
      <div className="form-header">
        <button className="btn-ghost back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{
          display:"flex",
          justifyContent:"center"
        }}>Order Food</h2>
        <p  style={{
          display:"flex",
          justifyContent:"center"
        }} className="muted">Browse our menu and add items to your order.</p>
      </div>

      <div className="page-content">
        {Object.entries(categories).map(([category, items]) => (
          <div className="menu-category" key={category}>
            <h3>{category}</h3>
            {items.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div className={`menu-item ${qty > 0 ? 'in-cart' : ''}`} key={item.id}>
                  {item.imageUrl ? (
                    <img className="menu-item-image" src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="menu-item-image menu-item-image-placeholder" />
                  )}
                  <div className="menu-item-body">
                    <div className="menu-item-info">
                      <span className="menu-item-name">{item.name}</span>
                      <span className="menu-item-price">£{item.price.toFixed(2)}</span>
                    </div>
                    {item.description && <p className="menu-item-desc">{item.description}</p>}
                    <div className="qty-control">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQty(item.id, -1)}
                        disabled={!qty}
                        aria-label={`Remove one ${item.name}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        type="button"
                        className="qty-btn qty-btn-add"
                        onClick={() => updateQty(item.id, 1)}
                        aria-label={`Add one ${item.name}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {itemCount > 0 && (
        <div className="cart-bar">
          <div className="cart-bar-info">
            <ShoppingBag size={18} />
            <div>
              <span className="cart-bar-count">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
              <span className="cart-bar-total">£{total.toFixed(2)}</span>
            </div>
          </div>
          <button className="btn btn-gold" onClick={() => setShowCheckout(true)}>Review Order</button>
        </div>
      )}
    </div>
  );
}