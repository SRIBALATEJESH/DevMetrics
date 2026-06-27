import React, { createContext, useContext, useState, useCallback } from 'react';

const LayoutContext = createContext(null);

export const LayoutProvider = ({ children }) => {
  const [pageDetails, setPageDetailsState] = useState({
    pageTitle: 'Page',
    pageSubtitle: '',
    pageEyebrow: ''
  });

  const setPageDetails = useCallback((details) => {
    setPageDetailsState((prev) => {
      // Avoid state updates and re-renders if details have not changed
      if (
        prev.pageTitle === details.pageTitle &&
        prev.pageSubtitle === details.pageSubtitle &&
        prev.pageEyebrow === details.pageEyebrow
      ) {
        return prev;
      }
      return {
        pageTitle: details.pageTitle || 'Page',
        pageSubtitle: details.pageSubtitle || '',
        pageEyebrow: details.pageEyebrow || ''
      };
    });
  }, []);

  return (
    <LayoutContext.Provider value={{ ...pageDetails, setPageDetails }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
