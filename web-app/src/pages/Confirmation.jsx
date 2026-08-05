import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import '../styles/confirmation.scss';

export default function Confirmation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const title = state?.title || 'Request Sent';
  const message = state?.message || 'Thank you - our team has been notified.';
  const isPending = state?.isPending;

  return (
    <div className="page confirmation-page fade-in">
      <div className="page-content center-content">
        <div className={`confirm-icon ${isPending ? 'pending' : 'success'}`}>
          {isPending ? <Clock size={30} /> : <CheckCircle2 size={30} />}
        </div>
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        {isPending && <span className="badge pending">Pending Approval</span>}

        <button className="btn btn-outline" onClick={() => navigate(`/r/${token}`)}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
