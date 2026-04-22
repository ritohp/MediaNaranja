import { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon, LogOut, Coins, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('mn_profiles')
      .select('tokens_balance')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setTokens(data.tokens_balance);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setTokens(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const email = window.prompt("Email:");
    if (!email) return;
    const password = window.prompt("Contraseña (mín. 6 caracteres):");
    if (!password) return;

    // Intentar Login
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      // Si falla porque no existe, intentar Registro
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        alert("Error: " + signUpError.message);
      } else {
        alert("¡Cuenta creada! Ya puedes crear tus canciones.");
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="max-w-6xl mx-auto px-6 py-8 relative z-50">
      <div className="flex items-center justify-between">
        {/* Logo a la izquierda */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-center">
            <img src="/logo.png" alt="Media Naranja Logo" className="w-14 h-14 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="hidden text-naranja-500 font-bold text-2xl group-hover:scale-110 transition-transform">🍊</div>
            <span className="text-[8px] tracking-[0.2em] font-black text-naranja-600 uppercase group-hover:text-naranja-500 transition-colors mt-1">Media Naranja</span>
          </div>
        </Link>
        
        {/* Navegación Derecha */}
        <div className="flex items-center space-x-10">
          <ul className="flex items-center space-x-8 text-sm font-bold text-blush-600 uppercase tracking-widest">
            {user && (
              <li><Link to="/mis-canciones" className="hover:text-naranja-500 transition-colors">Mis Canciones</Link></li>
            )}
            <li><Link to="/crear-cancion" className="px-4 py-2 bg-naranja-500 text-white rounded-xl hover:bg-naranja-600 transition-all shadow-md shadow-naranja-100">Crear Canción</Link></li>
          </ul>

          <div className="flex items-center gap-4 text-blush-600">
            {user ? (
              <div className="flex items-center gap-4 border-l border-blush-100 pl-4">
                {tokens !== null && (
                  <div className="flex items-center gap-1.5 bg-naranja-50 px-3 py-1.5 rounded-full border border-naranja-200 text-naranja-600 shadow-sm" title="Tus Tokens">
                    <Coins size={14} />
                    <span className="text-xs font-black">{tokens}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ink-600/70 border border-blush-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {user.email?.split('@')[0]}
                  </span>
                  <button onClick={handleLogout} className="hover:text-naranja-500 transition-colors p-2" title="Cerrar sesión">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleLogin} className="hover:text-naranja-500 transition-colors flex items-center gap-2 group ml-4">
                <div className="p-2 rounded-full bg-blush-50 border border-blush-100 group-hover:bg-naranja-50 group-hover:border-naranja-200 transition-colors">
                  <UserIcon size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
