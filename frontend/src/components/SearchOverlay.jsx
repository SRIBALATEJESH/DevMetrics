import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FolderKanban, Users, User, CheckSquare, GitFork, GitCommit, GitPullRequest, AlertCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SearchOverlay.css';
import API_BASE_URL from '../config/api';

const SearchOverlay = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, [isOpen]);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard shortcut to close (Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch search results from API (debounce)
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, { headers });
        const data = await res.json();
        if (res.ok) {
          setResults(data.data);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, token]);

  const handleRecentClick = (searchQuery) => {
    setQuery(searchQuery);
  };

  const handleSelectResult = (type, item) => {
    // Save to search history
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));

    onClose();

    switch (type) {
      case 'project':
        navigate(`/project-details/${item._id}`);
        break;
      case 'team':
        navigate('/team-directory');
        break;
      case 'user':
        navigate('/engineering-profile');
        break;
      case 'task':
        navigate('/task-board');
        break;
      case 'repo':
        navigate('/github/repositories');
        break;
      default:
        if (item.url) {
          window.open(item.url, '_blank', 'noopener,noreferrer');
        }
        break;
    }
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  if (!isOpen) return null;

  const hasResults = results && Object.values(results).some(arr => arr && arr.length > 0);

  return (
    <div className="search-overlay-backdrop" onClick={onClose}>
      <div className="search-overlay-card glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, commits, PRs, issues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-results-content">
          {loading && (
            <div className="search-state-message">Searching database...</div>
          )}

          {!query && (
            <div className="search-initial-view">
              {recentSearches.length > 0 ? (
                <div className="recent-searches">
                  <div className="recent-header">
                    <span>Recent Searches</span>
                    <button className="clear-btn" onClick={clearHistory}>Clear</button>
                  </div>
                  <div className="recent-tags">
                    {recentSearches.map((s, idx) => (
                      <button key={idx} className="recent-tag-btn" onClick={() => handleRecentClick(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="search-tip">
                  <p>Type to search everything instantly across DevMetrics.</p>
                  <span>Pro Tip: Use <kbd>Ctrl</kbd> + <kbd>K</kbd> to open this overlay anywhere.</span>
                </div>
              )}
            </div>
          )}

          {query && !loading && !hasResults && (
            <div className="search-state-message">No matches found for "{query}"</div>
          )}

          {query && !loading && hasResults && (
            <div className="results-scroll-container">
              {results.projects?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Projects</div>
                  {results.projects.map(p => (
                    <div key={p._id} className="result-item" onClick={() => handleSelectResult('project', p)}>
                      <FolderKanban size={16} className="item-icon project" />
                      <div className="item-text">
                        <span className="title">{p.title}</span>
                        <span className="subtitle">{p.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.tasks?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Tasks</div>
                  {results.tasks.map(t => (
                    <div key={t._id} className="result-item" onClick={() => handleSelectResult('task', t)}>
                      <CheckSquare size={16} className="item-icon task" />
                      <div className="item-text">
                        <span className="title">{t.title}</span>
                        <span className="subtitle">Status: {t.status} • Complexity: {t.complexity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.teams?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Teams</div>
                  {results.teams.map(t => (
                    <div key={t._id} className="result-item" onClick={() => handleSelectResult('team', t)}>
                      <Users size={16} className="item-icon team" />
                      <div className="item-text">
                        <span className="title">{t.teamName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.users?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Users</div>
                  {results.users.map(u => (
                    <div key={u._id} className="result-item" onClick={() => handleSelectResult('user', u)}>
                      <User size={16} className="item-icon user" />
                      <div className="item-text">
                        <span className="title">{u.name}</span>
                        <span className="subtitle">{u.role} • {u.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.repositories?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Repositories</div>
                  {results.repositories.map(r => (
                    <div key={r._id} className="result-item" onClick={() => handleSelectResult('repo', r)}>
                      <GitFork size={16} className="item-icon repo" />
                      <div className="item-text">
                        <span className="title">{r.name}</span>
                        <span className="subtitle">{r.fullName} ({r.visibility})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.commits?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Commits</div>
                  {results.commits.map(c => (
                    <div key={c._id} className="result-item" onClick={() => handleSelectResult('commit', c)}>
                      <GitCommit size={16} className="item-icon commit" />
                      <div className="item-text">
                        <span className="title">{c.message}</span>
                        <span className="subtitle">Author: {c.authorUsername} • SHA: {c.sha.substring(0, 8)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.pullRequests?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Pull Requests</div>
                  {results.pullRequests.map(pr => (
                    <div key={pr._id} className="result-item" onClick={() => handleSelectResult('pr', pr)}>
                      <GitPullRequest size={16} className="item-icon pr" />
                      <div className="item-text">
                        <span className="title">#{pr.number} - {pr.title}</span>
                        <span className="subtitle">Author: {pr.userUsername} • State: {pr.state}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.issues?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Issues</div>
                  {results.issues.map(iss => (
                    <div key={iss._id} className="result-item" onClick={() => handleSelectResult('issue', iss)}>
                      <AlertCircle size={16} className="item-icon issue" />
                      <div className="item-text">
                        <span className="title">#{iss.number} - {iss.title}</span>
                        <span className="subtitle">Author: {iss.userUsername} • State: {iss.state}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.reviews?.length > 0 && (
                <div className="results-group">
                  <div className="group-title">Reviews</div>
                  {results.reviews.map(rev => (
                    <div key={rev._id} className="result-item" onClick={() => handleSelectResult('review', rev)}>
                      <MessageSquare size={16} className="item-icon review" />
                      <div className="item-text">
                        <span className="title">Review on PR: "{rev.body || 'No review comments text'}"</span>
                        <span className="subtitle">Reviewer: {rev.userUsername} • State: {rev.state}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
