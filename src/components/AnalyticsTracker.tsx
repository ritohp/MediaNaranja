import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID;

// Declare global types for tracking scripts
declare global {
  interface Window {
    fbq?: any;
    ttq?: any;
  }
}

const initMetaPixel = (pixelId: string) => {
  if (window.fbq) return;
  (function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  })(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', pixelId);
};

const initTikTokPixel = (pixelId: string) => {
  if (window.ttq) return;
  (function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=d.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
    ttq.load(pixelId);
  })(window, document, 'ttq');
};

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

    // Inicializar Pixeles si están configurados en entorno
    if (META_PIXEL_ID) {
      initMetaPixel(META_PIXEL_ID);
    }
    if (TIKTOK_PIXEL_ID) {
      initTikTokPixel(TIKTOK_PIXEL_ID);
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

        // Evento PageView en Pixeles
        if (META_PIXEL_ID && window.fbq) {
          window.fbq('track', 'PageView');
        }
        if (TIKTOK_PIXEL_ID && window.ttq) {
          window.ttq.page();
        }
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

        // Eventos de Conversión en Pixeles
        const lowerText = text.toLowerCase();
        if (lowerText.includes('registrar') || lowerText.includes('crear cuenta')) {
          if (window.fbq) window.fbq('track', 'CompleteRegistration');
          if (window.ttq) window.ttq.track('CompleteRegistration');
        } else if (lowerText.includes('desbloquear') || lowerText.includes('comprar') || lowerText.includes('pagar')) {
          if (window.fbq) window.fbq('track', 'AddPaymentInfo');
          if (window.ttq) window.ttq.track('AddPaymentInfo');
        } else if (lowerText.includes('continuar') || lowerText.includes('siguiente') || lowerText.includes('generar') || lowerText.includes('componer')) {
          if (window.fbq) window.fbq('track', 'InitiateCheckout');
          if (window.ttq) window.ttq.track('InitiateCheckout');
        }
      } catch (err) {}
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [location.pathname, location.search]);

  return null;
}
