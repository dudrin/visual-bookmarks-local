import { useState, useCallback, useEffect } from 'react';

interface UsePagePreviewOptions {
  delay?: number;
  enabled?: boolean;
}

/**
 * Хук для управления предпросмотром страниц
 * Позволяет показывать/скрывать превью с задержкой для избежания мерцания
 */
export function usePagePreview({ delay = 500, enabled = true }: UsePagePreviewOptions = {}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Показать превью с задержкой
  const showPreview = useCallback((url: string, title: string, x: number, y: number) => {
    if (!enabled) return;
    
    // Очищаем предыдущий таймер, если он есть
    if (timer) {
      clearTimeout(timer);
    }
    
    // Устанавливаем новый таймер для показа превью
    const newTimer = setTimeout(() => {
      setPreviewUrl(url);
      setPreviewTitle(title);
      setPosition({ x, y });
      setIsVisible(true);
    }, delay);
    
    setTimer(newTimer);
  }, [delay, timer, enabled]);

  // Скрыть превью немедленно
  const hidePreview = useCallback(() => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    setIsVisible(false);
  }, [timer]);

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return {
    previewUrl,
    previewTitle,
    isVisible,
    position,
    showPreview,
    hidePreview
  };
}

export default usePagePreview;