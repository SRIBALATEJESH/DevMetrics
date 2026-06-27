import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, Bell, GitCommit, GitPullRequest } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import './Toast.css';

const ToastIcon = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="toast-icon success" size={18} />;
    case 'warning':
      return <AlertTriangle className="toast-icon warning" size={18} />;
    case 'error':
      return <AlertTriangle className="toast-icon error" size={18} />;
    case 'commit':
      return <GitCommit className="toast-icon commit" size={18} />;
    case 'pr':
      return <GitPullRequest className="toast-icon pr" size={18} />;
    default:
      return <Info className="toast-icon info" size={18} />;
  }
};

const ToastContainer = () => {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card ${toast.type}`}>
          <div className="toast-header-bar">
            <ToastIcon type={toast.type} />
            <span className="toast-title">{toast.title}</span>
            <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
          <div className="toast-body">
            <p className="toast-message">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
