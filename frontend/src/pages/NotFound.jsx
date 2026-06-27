import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFound = () => {
    return (
        <Layout
            pageTitle="Page Not Found"
            pageEyebrow=" error 404"
            pageSubtitle="The page you're looking for doesn't exist."
        >
            <div className="card" style={{ textAlign: 'center', padding: '64px 32px' }}>
                <div style={{ fontSize: '96px', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '16px' }}>
                    404
                </div>
                <h2 style={{ marginBottom: '16px', fontSize: '24px' }}>Oops! Page Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link to="/dashboard" className="btn btn-primary" style={{ marginRight: '12px' }}>
                    Go to Dashboard
                </Link>
                <Link to="/all-projects" className="btn btn-ghost">
                    View Projects
                </Link>
            </div>
        </Layout>
    );
};

export default NotFound;
