import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useListKeyboardNavigation(items, getHref, basePath) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [items]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const href = getHref(items[selectedIndex]);
      if (href) router.push(href);
    } else if (e.key === 'Escape') {
      setSelectedIndex(-1);
    }
  }, [items, selectedIndex, router, getHref]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { selectedIndex, setSelectedIndex };
}