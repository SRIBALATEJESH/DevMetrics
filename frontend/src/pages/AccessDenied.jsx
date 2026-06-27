import React from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import Layout from '../components/Layout'

const AccessDenied = () => {
  return (
    <Layout pageTitle="Access Denied" pageEyebrow="// restricted" pageSubtitle="You don't have permission to access this page.">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', textAlign: 'center' }}>
        <Lock size={64} style={{ color: 'var(--accent-red)', marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>403 Forbidden</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This area requires additional permissions.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </Layout>
  )
}

export default AccessDenied
