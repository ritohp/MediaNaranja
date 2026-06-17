import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let os = 'Unknown';
  let browser = 'Unknown';
  const deviceType = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua) ? 'Mobile' : 'Desktop';
  
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'Mac OS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Linux/.test(ua)) os = 'Linux';
  else if (/iOS|iPhone|iPad|iPod/.test(ua)) os = 'iOS';

  if (/Chrome/.test(ua) && !/Edge|OPR|Edg/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome|Edg/.test(ua)) browser = 'Safari';
  else if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Edg/.test(ua)) browser = 'Edge';
  
  return { os, browser, deviceType };
};

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Truco para excluir dispositivos de los administradores
    if (location.search.includes('ignore_me=true')) {
      localStorage.setItem('mn_ignore_analytics', 'true');
    }

    if (location.pathname.startsWith('/admin') || localStorage.getItem('mn_ignore_analytics') === 'true') {
      return;
    }

    let visitorId = localStorage.getItem('mn_visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('mn_visitor_id', visitorId);
    }

    let sessionId = sessionStorage.getItem('mn_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('mn_session_id', sessionId);
    }

    const { os, browser, deviceType } = getDeviceInfo();
    const referrer = document.referrer || 'Direct';

    const trackPageview = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || null;

        await supabase.from('mn_analytics').insert({
          visitor_id: visitorId,
          session_id: sessionId,
          path: location.pathname + location.search,
          user_agent: navigator.userAgent,
          device_type: deviceType,
          os,
          browser,
          referrer,
          event_type: 'pageview',
          event_details: email ? { email } : {}
        });
      } catch (error) {
        console.error('Analytics pageview failed:', error);
      }
    };

    trackPageview();

    const handleGlobalClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, [role="button"]');
      if (!clickable) return;
      
      const text = clickable.textContent?.trim().substring(0, 50) || 'Icon/Image';
      const type = clickable.tagName.toLowerCase();
      
      const importantKeywords = ['desbloquear', 'siguiente', 'completar', 'comprar', 'empezar', 'crear', 'registrar', 'entrar', 'continuar', 'generar', 'componer'];
      const isImportant = importantKeywords.some(kw => text.toLowerCase().includes(kw));
      
      if (!isImportant) return; // Solo rastrear botones importantes de embudo para no saturar DB

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || null;

        await supabase.from('mn_analytics').insert({
          visitor_id: visitorId,
          session_id: sessionId,
          path: location.pathname + location.search,
          device_type: deviceType,
          os,
          browser,
          event_type: 'click',
          event_details: { 
            element: type, 
            text: text,
            ...(email ? { email } : {})
          }
        });
      } catch (err) {}
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [location.pathname, location.search]);

  return null;
}
