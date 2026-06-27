import React, { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Calendar, Bell, User, Search } from 'lucide-react'
import RoleBasedSidebar from './RoleBasedSidebar'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import { SocketProvider } from '../context/SocketContext'
import ToastContainer from './ToastContainer'
import SearchOverlay from './SearchOverlay'

// LayoutWrapper acts as the persistent frame around all protected routes
export const LayoutWrapper = () => {
  const { user } = useAuth()
  const { pageTitle, pageSubtitle, pageEyebrow } = useLayout()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Listen to keyboard shortcut (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Dynamic hue-shifting effect for --accent-purple across the whole application
  useEffect(() => {
    let hue = 270; // Start at purple hue
    let direction = 1;
    
    const interval = setInterval(() => {
      hue += direction * 0.4;
      if (hue >= 310) direction = -1; // Cap at magenta/pink
      if (hue <= 250) direction = 1;  // Cap at blue/indigo
      
      document.documentElement.style.setProperty('--accent-purple', `hsl(${hue}, 85%, 68%)`);
    }, 80); // Smooth update every 80ms
    
    return () => {
      clearInterval(interval);
      document.documentElement.style.removeProperty('--accent-purple');
    };
  }, []);

  return (
    <SocketProvider>
      <div className="dashboard-container">
        <RoleBasedSidebar />
        <main className="main">
          <header className="header">
            <div className="header-breadcrumb">
              DevMetrics
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style={{ color: 'var(--text-muted)' }}><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              <span>{pageTitle}</span>
            </div>
            
            <div className="header-search-trigger" onClick={() => setIsSearchOpen(true)} style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 12px',
              gap: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '13px',
              marginLeft: '20px',
              transition: 'all 0.2s',
              minWidth: '200px'
            }}>
              <Search size={13} />
              <span>Search...</span>
              <kbd style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                marginLeft: 'auto',
                fontFamily: 'inherit'
              }}>Ctrl + K</kbd>
            </div>

            <div className="header-spacer"></div>
            <div className="period-select">
              <Calendar size={12} />
              Jun 2026
            </div>
            <Link to="/notification-center" className="header-btn">
              <Bell size={15} />
            </Link>
            <Link to="/engineering-profile" className="header-btn" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <User size={15} />
              )}
            </Link>
          </header>
          <div className="content">
            {(pageEyebrow || pageTitle || pageSubtitle) && (
              <div className="page-header">
                <div className="page-title-group">
                  {pageEyebrow && <div className="page-eyebrow">{pageEyebrow}</div>}
                  {pageTitle && <div className="page-title">{pageTitle}</div>}
                  {pageSubtitle && <div className="page-subtitle">{pageSubtitle}</div>}
                </div>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </SocketProvider>
  )
}


// Layout is the child wrapper that page components use to set page-specific meta details
const Layout = ({ children, pageTitle = 'Page', pageSubtitle = '', pageEyebrow = '' }) => {
  const { setPageDetails } = useLayout()

  useEffect(() => {
    setPageDetails({
      pageTitle,
      pageSubtitle,
      pageEyebrow
    })
  }, [pageTitle, pageSubtitle, pageEyebrow, setPageDetails])

  return <>{children}</>
}

export default Layout
