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
        <ul className="flex items-center space-x-8 text-sm font-medium text-blush-600">
          <li><Link to="/" className="hover:text-naranja-500 transition-colors">Inicio</Link></li>
          {user && (
            <li><Link to="/mis-recuerdos" className="hover:text-naranja-500 transition-colors">Mis Recuerdos</Link></li>
          )}
        </ul>
        
        <Link to="/" className="flex flex-col items-center cursor-pointer group">
          <img src="/logo.png" alt="Media Naranja Logo" className="w-16 h-16 object-contain mb-1 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }} />
          <div className="hidden text-naranja-500 font-bold text-2xl mb-1 group-hover:scale-110 transition-transform">🍊</div>
          <span className="text-[10px] tracking-[0.25em] font-bold text-naranja-600 uppercase group-hover:text-naranja-500 transition-colors">Media Naranja</span>
        </Link>

        <ul className="flex items-center space-x-8 text-sm font-medium text-blush-600">
          <li><a href="#" className="hover:text-naranja-500 transition-colors">Productos ⌄</a></li>
          {user && (
            <li><Link to="/mis-canciones" className="hover:text-naranja-500 transition-colors">Mis Canciones</Link></li>
          )}
          <li><Link to="/crear-cancion" className="hover:text-naranja-500 font-bold transition-colors">Crear Canción</Link></li>
        </ul>

        <div className="flex items-center space-x-4 text-blush-600">
          {user ? (
            <div className="flex items-center gap-3">
              {tokens !== null && (
                <div className="flex items-center gap-1.5 bg-naranja-50 px-3 py-1 rounded-full border border-naranja-200 text-naranja-600 shadow-sm" title="Tus Tokens para canciones">
                  <Coins size={16} />
                  <span className="text-sm font-bold">{tokens}</span>
                </div>
              )}
              <span className="text-sm font-medium text-ink-600/70 border border-blush-200 px-3 py-1 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button onClick={handleLogout} className="hover:text-naranja-500 transition-colors text-xs" title="Cerrar sesión">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="hover:text-naranja-500 transition-colors flex items-center gap-1 group">
              <div className="p-1.5 rounded-full bg-blush-50 border border-blush-100 group-hover:bg-naranja-50 group-hover:border-naranja-200 transition-colors">
                <UserIcon size={18} />
              </div>
              <span className="text-sm font-bold">Entrar</span>
            </button>
          )}
          <button className="hover:text-naranja-500 transition-colors ml-4"><ShoppingCart size={20} /></button>
        </div>
      </div>
    </nav>
  );
}
