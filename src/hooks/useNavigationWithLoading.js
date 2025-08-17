import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useLoading } from '../contexts/LoadingContext.jsx';

export const useNavigationWithLoading = () => {
  const { isLoading, setIsLoading, showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();

  const navigateWithLoading = useCallback((path) => {
    showLoading('Loading page...');
    
    // Show loading for at least 500ms for smooth transition, then navigate
    setTimeout(() => {
      navigate(path);
      // Don't hide loading here - let the destination component handle it
      // This prevents double loading by keeping one loading state throughout
    }, 500);
  }, [navigate, showLoading]);

  return { isLoading, navigateWithLoading, showLoading, hideLoading };
};
