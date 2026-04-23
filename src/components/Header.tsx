import { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon, LogOut, Coins, Heart, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

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

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

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
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="max-w-6xl mx-auto px-6 py-6 md:py-8 relative z-50">
        <div className="flex items-center justify-between">
          {/* Logo a la izquierda */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="flex flex-col items-center">
              <img src="/logo.png" alt="Media Naranja Logo" className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }} />
              <div className="hidden text-naranja-500 font-bold text-2xl group-hover:scale-110 transition-transform">🍊</div>
              <span className="text-[7px] md:text-[8px] tracking-[0.2em] font-black text-naranja-600 uppercase group-hover:text-naranja-500 transition-colors mt-1">Media Naranja</span>
            </div>
          </Link>
          
          {/* Navegación Escritorio */}
          <div className="hidden md:flex items-center space-x-10">
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

          {/* Botón Menú Móvil */}
          <div className="flex md:hidden items-center gap-4">
            {user && tokens !== null && (
              <div className="flex items-center gap-1.5 bg-naranja-50 px-3 py-1.5 rounded-full border border-naranja-200 text-naranja-600 shadow-sm">
                <Coins size={14} />
                <span className="text-xs font-black">{tokens}</span>
              </div>
            )}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-blush-600 hover:text-naranja-500 transition-colors"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Menú Móvil Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-fade-in">
          <div className="absolute inset-0 bg-blush-950/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-bold text-naranja-600 font-serif">Menú</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-blush-400">
                  <X size={24} />
                </button>
              </div>

              {user && (
                <div className="mb-8 p-4 bg-blush-50 rounded-2xl border border-blush-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-naranja-100 flex items-center justify-center text-naranja-600">
                      <UserIcon size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-ink-950 truncate max-w-[180px]">
                        {user.email}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-blush-400 font-bold">Mi Perfil</span>
                    </div>
                  </div>
                  {tokens !== null && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-blush-200/50">
                      <span className="text-xs font-medium text-ink-600">Tokens disponibles</span>
                      <div className="flex items-center gap-1.5 text-naranja-600">
                        <Coins size={14} />
                        <span className="text-sm font-black">{tokens}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <nav className="flex-1">
                <ul className="space-y-4">
                  {user && (
                    <li>
                      <Link 
                        to="/mis-canciones" 
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-naranja-50 text-blush-600 hover:text-naranja-500 transition-all font-bold uppercase tracking-widest text-sm"
                      >
                        <Heart size={20} />
                        Mis Canciones
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link 
                      to="/crear-cancion" 
                      className="flex items-center gap-4 p-4 rounded-xl bg-naranja-500 text-white shadow-lg shadow-naranja-200 font-bold uppercase tracking-widest text-sm"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">🍊</div>
                      Crear Canción
                    </Link>
                  </li>
                </ul>
              </nav>

              <div className="mt-auto pt-6 border-t border-blush-100">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-blush-50 text-blush-600 hover:bg-red-50 hover:text-red-500 transition-all font-bold uppercase tracking-widest text-sm border border-blush-100"
                  >
                    <LogOut size={20} />
                    Cerrar Sesión
                  </button>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-blush-600 text-white font-bold uppercase tracking-widest text-sm shadow-md"
                  >
                    <UserIcon size={20} />
                    Entrar / Registrarse
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

