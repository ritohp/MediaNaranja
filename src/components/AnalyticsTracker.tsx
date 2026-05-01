import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackPageview = async () => {
      try {
        let visitorId = localStorage.getItem('mn_visitor_id');
        
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('mn_visitor_id', visitorId);
        }

        // Evitar rastrear el admin panel repetidamente para no ensuciar las stats
        if (location.pathname.startsWith('/admin')) return;

        await supabase.from('mn_analytics').insert({
          visitor_id: visitorId,
          path: location.pathname,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        // Fallar silenciosamente para no interrumpir al usuario
        console.error('Analytics tracking failed:', error);
      }
    };

    trackPageview();
  }, [location.pathname]);

  return null;
}
