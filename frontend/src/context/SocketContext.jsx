import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../config/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const addToast = (message, type = 'info', title = 'Notification') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const storedToken = token || localStorage.getItem('token');
    if (!storedToken || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = `${API_BASE_URL}`;
    console.log(`[Socket.IO] Connecting to ${socketUrl}...`);
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`[Socket.IO] Connected successfully with id: ${newSocket.id}`);
    });

    // 1. Commit Added Event
    newSocket.on('commit_added', (data) => {
      console.log('[Socket.IO] commit_added received:', data);
      
      // Dispatch event to refresh analytics pages
      window.dispatchEvent(new CustomEvent('analytics_updated', { detail: data }));
      
      const role = user.role?.toLowerCase();
      const currentGithub = user.githubUsername;
      const isSelf = currentGithub && data.author && currentGithub.toLowerCase() === data.author.toLowerCase();

      let title = 'Code Commit';
      let msg = '';
      let type = 'info';

      if (role === 'admin') {
        msg = `Repository Activity: Commit pushed to ${data.repository} by ${data.author}`;
      } else if (role === 'project manager') {
        msg = `New Commit: ${data.author} committed to ${data.repository} - "${data.message}"`;
      } else if (role === 'team lead') {
        msg = `Team Commit Activity: ${data.author} pushed to ${data.repository}`;
      } else if (role === 'developer') {
        if (isSelf) {
          title = 'Commit Confirmed';
          msg = `Your commit to ${data.repository} was synced successfully!`;
          type = 'success';
        } else {
          msg = `Commit pushed by ${data.author} to ${data.repository}`;
        }
      }

      if (msg) {
        addToast(msg, type, title);
      }
    });

    // 2. PR Created/Updated Event
    newSocket.on('pr_created', (data) => {
      console.log('[Socket.IO] pr_created received:', data);
      window.dispatchEvent(new CustomEvent('analytics_updated', { detail: data }));

      const role = user.role?.toLowerCase();
      const currentGithub = user.githubUsername;
      const isSelf = currentGithub && data.author && currentGithub.toLowerCase() === data.author.toLowerCase();

      let title = 'Pull Request';
      let msg = '';
      let type = 'info';

      if (role === 'admin') {
        msg = `Repository Activity: PR #${data.number} ${data.action} in ${data.repository}`;
      } else if (role === 'project manager') {
        msg = `PR Update: PR #${data.number} (${data.title}) ${data.action} by ${data.author}`;
      } else if (role === 'team lead') {
        if (data.action === 'opened') {
          title = 'Review Request';
          msg = `PR #${data.number} (${data.title}) needs review in ${data.repository}`;
          type = 'warning';
        } else {
          msg = `Pending Review: PR #${data.number} was ${data.action}`;
        }
      } else if (role === 'developer') {
        if (isSelf) {
          title = 'PR Status Change';
          msg = `Your PR #${data.number} was ${data.action}`;
          type = data.action === 'merged' ? 'success' : 'info';
        } else {
          title = 'Review Notification';
          msg = `PR #${data.number} ${data.action} by ${data.author}`;
        }
      }

      if (msg) {
        addToast(msg, type, title);
      }
    });

    // 3. Review Submitted Event
    newSocket.on('review_submitted', (data) => {
      console.log('[Socket.IO] review_submitted received:', data);
      window.dispatchEvent(new CustomEvent('analytics_updated', { detail: data }));

      const role = user.role?.toLowerCase();
      const currentGithub = user.githubUsername;
      const isSelf = currentGithub && data.reviewer && currentGithub.toLowerCase() === data.reviewer.toLowerCase();

      let title = 'PR Review';
      let msg = '';
      let type = 'info';

      if (data.state === 'APPROVED') type = 'success';
      else if (data.state === 'CHANGES_REQUESTED') type = 'warning';

      if (role === 'admin') {
        msg = `Repository Activity: Review submitted for PR #${data.pullRequestNumber} in ${data.repository} - ${data.state}`;
      } else if (role === 'project manager') {
        msg = `Team Contribution Update: Review ${data.state} by ${data.reviewer} on PR #${data.pullRequestNumber}`;
      } else if (role === 'team lead') {
        msg = `Pending Review: Review ${data.state} by ${data.reviewer} on PR #${data.pullRequestNumber}`;
      } else if (role === 'developer') {
        if (isSelf) {
          title = 'Review Submitted';
          msg = `Your review on PR #${data.pullRequestNumber} was recorded successfully.`;
        } else {
          title = 'Review Notification';
          msg = `${data.reviewer} submitted a review (${data.state}) on PR #${data.pullRequestNumber}`;
        }
      }

      if (msg) {
        addToast(msg, type, title);
      }
    });

    // 4. Issue Updated Event
    newSocket.on('issue_updated', (data) => {
      console.log('[Socket.IO] issue_updated received:', data);
      window.dispatchEvent(new CustomEvent('analytics_updated', { detail: data }));

      const role = user.role?.toLowerCase();
      const currentGithub = user.githubUsername;
      const isSelfAssignee = currentGithub && data.assignee && currentGithub.toLowerCase() === data.assignee.toLowerCase();

      let title = 'Issue Alert';
      let msg = '';
      let type = 'info';

      if (data.action === 'closed') type = 'success';
      else if (data.action === 'opened') type = 'warning';

      if (role === 'admin') {
        msg = `Repository Activity: Issue #${data.number} ${data.action} in ${data.repository}`;
      } else if (role === 'project manager') {
        msg = `Project Progress: Issue #${data.number} ${data.action} - "${data.title}"`;
      } else if (role === 'team lead') {
        msg = `Issue Update: Issue #${data.number} (${data.title}) ${data.action}`;
      } else if (role === 'developer') {
        if (isSelfAssignee) {
          title = 'Issue Assignment';
          msg = `You have been assigned to Issue #${data.number}: "${data.title}"`;
          type = 'warning';
        } else {
          msg = `Issue #${data.number} ${data.action} by ${data.author}`;
        }
      } else if (role === 'tester') {
        if (data.action === 'opened') {
          title = 'Issue Opened';
          msg = `Bug Ticket Opened: Issue #${data.number} - ${data.title}`;
          type = 'warning';
        } else if (data.action === 'closed') {
          title = 'Issue Closed';
          msg = `Bug Resolved: Issue #${data.number} - ${data.title} (Metrics updated)`;
          type = 'success';
        }
      }

      if (msg) {
        addToast(msg, type, title);
      }
    });

    // 5. Global Analytics Recalculated Event
    newSocket.on('analytics_updated', (data) => {
      console.log('[Socket.IO] analytics_updated received:', data);
      window.dispatchEvent(new CustomEvent('analytics_updated', { detail: data }));

      const role = user.role?.toLowerCase();
      if (role === 'admin' || role === 'project manager' || role === 'team lead') {
        addToast('Project and Repository health metrics recalculated automatically.', 'success', 'Engineering Health');
      }
    });

    // 6. Leaderboard Recalculated Event
    newSocket.on('leaderboard_updated', (data) => {
      console.log('[Socket.IO] leaderboard_updated received:', data);
      window.dispatchEvent(new CustomEvent('leaderboard_updated', { detail: data }));

      const role = user.role?.toLowerCase();
      if (role === 'admin' || role === 'project manager' || role === 'team lead') {
        addToast('Contributor Leaderboard rankings updated in real-time.', 'success', 'Leaderboard');
      } else if (role === 'developer') {
        addToast('Your engineering contribution score has been recalculated.', 'success', 'Contribution Score');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });

    return () => {
      console.log('[Socket.IO] Cleaning up socket connection...');
      newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, toasts, addToast, removeToast }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
