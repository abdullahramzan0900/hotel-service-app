import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import GuestContactFields from '../components/GuestContactFields';
import { validateContact } from '../utils/validate';
import { submitRoomService } from '../api/client';
import '../styles/guestForm.scss';

export default function RoomServicePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '' });
  const [priority, setPriority] = useState('normal');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (field, val) => setValues((v) => ({ ...v, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const contactErrors = validateContact(values);
    const messageError = values.message.trim().length < 3 ? 'Please describe what you need.' : null;
    const allErrors = { ...contactErrors, ...(messageError ? { message: messageError } : {}) };
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      await submitRoomService(token, { ...values, priority });
      navigate(`/r/${token}/confirmation`, {
        state: { title: 'Request Sent', message: 'Our housekeeping team has been notified and will be with you shortly.' }
      });
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page form-page fade-in">
      <div className="form-header">
        <button className="btn-ghost back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2>Room Service</h2>
        <p className="muted">Let us know what you need and we'll take care of it.</p>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <GuestContactFields values={values} errors={errors} onChange={handleChange} />

          <div className="field">
            <label>Priority</label>
            <div className="priority-select">
              <button
                type="button"
                className={`priority-option ${priority === 'normal' ? 'active-normal' : ''}`}
                onClick={() => setPriority('normal')}
              >
                Normal
              </button>
              <button
                type="button"
                className={`priority-option ${priority === 'urgent' ? 'active-urgent' : ''}`}
                onClick={() => setPriority('urgent')}
              >
                <AlertTriangle size={14} /> Urgent
              </button>
            </div>
          </div>

          <div className="field">
            <label>What do you need?</label>
            <textarea
              placeholder="e.g. Two extra towels and a bottle of water please"
              value={values.message}
              onChange={(e) => handleChange('message', e.target.value)}
            />
            {errors.message && <div className="field-error">{errors.message}</div>}
          </div>

          {serverError && <div className="field-error server-error">{serverError}</div>}

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Send Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
