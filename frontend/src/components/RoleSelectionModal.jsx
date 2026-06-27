import React, { useState } from 'react';
import { Briefcase, Code, Shield, Bug, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './RoleSelectionModal.css';

const roles = [
  {
    key: 'project manager',
    label: 'Project Manager',
    icon: Briefcase,
    description: 'Oversee sprints, track velocity, and manage DORA metrics',
    color: '#fbbf24'
  },
  {
    key: 'team lead',
    label: 'Team Lead',
    icon: Shield,
    description: 'Lead your team, review code, and track performance',
    color: '#2dd4bf'
  },
  {
    key: 'developer',
    label: 'Developer',
    icon: Code,
    description: 'Ship code, track contributions, and monitor build health',
    color: '#6E76F2'
  },
  {
    key: 'tester',
    label: 'Tester',
    icon: Bug,
    description: 'Manage test coverage, track defects, and ensure quality',
    color: '#f87171'
  }
];

const RoleSelectionModal = () => {
  const { completeRoleSelection, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await completeRoleSelection(selectedRole);
    } catch (err) {
      console.error('Role selection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-modal-overlay">
      <div className="role-modal">
        <div className="role-modal-glow"></div>

        <div className="role-modal-header">
          <div className="role-modal-badge">
            <span className="role-pulse"></span>
            ACCOUNT SETUP
          </div>
          <h2>Welcome, {user?.name?.split(' ')[0] || 'there'}!</h2>
          <p>Select your role to personalize your DevMetrics experience.</p>
        </div>

        <div className="role-modal-grid">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.key;
            return (
              <button
                key={role.key}
                className={`role-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.key)}
                style={{ '--role-color': role.color }}
              >
                <div className="role-card-icon">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <div className="role-card-info">
                  <div className="role-card-label">{role.label}</div>
                  <div className="role-card-desc">{role.description}</div>
                </div>
                {isSelected && (
                  <div className="role-card-check">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          className="role-modal-confirm"
          disabled={!selectedRole || loading}
          onClick={handleConfirm}
        >
          {loading ? 'Setting up...' : 'Continue to Dashboard'}
          {!loading && <ChevronRight size={18} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
