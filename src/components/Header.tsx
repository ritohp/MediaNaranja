import React, { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon, LogOut, Coins, Heart, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
      if (_event === 'PASSWORD_RECOVERY') {
        setAuthMode('recovery');
        setIsLoginModalOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsLoginModalOpen(false);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.session) {
          setIsLoginModalOpen(false);
          alert("¡Cuenta creada con éxito! Bienvenido a Media Naranja.");
        } else {
          setAuthMode('login');
          alert("⚠️ ¡ATENCIÓN! Tu cuenta NO está activada.\n\nSi no confirmas tu correo en los próximos 15 minutos, perderás el acceso al estudio y no podrás generar tu canción.");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Ocurrió un error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError("Por favor, ingresa tu correo electrónico arriba primero.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      alert("Te hemos enviado un enlace de recuperación. Revisa tu correo electrónico.");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert("¡Contraseña actualizada con éxito! Ya puedes entrar.");
      setAuthMode('login');
      setIsLoginModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
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
                <button onClick={() => setIsLoginModalOpen(true)} className="hover:text-naranja-500 transition-colors flex items-center gap-2 group ml-4">
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
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
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
      {/* Modal de Auth */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-blush-950/40 backdrop-blur-md" onClick={() => setIsLoginModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-blush-100 animate-in zoom-in duration-300">
            <div className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-naranja-50 text-naranja-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon size={32} />
                </div>
                <h2 className="text-3xl font-serif text-blush-800">
                  {authMode === 'login' ? '¡Qué bueno verte!' : authMode === 'signup' ? 'Únete a la magia' : 'Nueva Contraseña'}
                </h2>
                <p className="text-ink-600/70 text-sm mt-2">
                  {authMode === 'login' 
                    ? 'Entra para ver tus canciones y recuerdos.' 
                    : authMode === 'signup' 
                    ? 'Crea tu cuenta para empezar a componer.'
                    : 'Ingresa tu nueva contraseña para recuperar el acceso.'}
                </p>
              </div>

              <form onSubmit={authMode === 'recovery' ? handleUpdatePassword : handleAuth} className="space-y-4">
                {authMode !== 'recovery' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-blush-400 ml-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-5 py-4 bg-blush-50 border border-blush-100 rounded-2xl outline-none focus:ring-2 focus:ring-naranja-400 transition-all"
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-blush-400">Contraseña</label>
                    {authMode === 'login' && (
                      <button 
                        type="button" 
                        onClick={handleResetPassword}
                        className="text-[10px] font-bold text-naranja-500 hover:text-naranja-600 transition-colors uppercase tracking-widest"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-blush-50 border border-blush-100 rounded-2xl outline-none focus:ring-2 focus:ring-naranja-400 transition-all"
                    required
                  />
                  {authMode === 'signup' && (
                    <p className="text-[10px] font-bold text-naranja-600/80 mt-2 bg-naranja-50 p-2 rounded-lg border border-naranja-100">
                      ⚠️ ¡Atención! Si no confirmas tu correo una vez registrado, perderás tu sesión de estudio.
                    </p>
                  )}
                </div>

                {authError && (
                  <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100">
                    {authError}
                  </p>
                )}

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full py-5 bg-gradient-to-r from-naranja-500 to-naranja-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-naranja-200 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {authLoading ? 'PROCESANDO...' : (authMode === 'login' ? 'ENTRAR' : authMode === 'signup' ? 'CREAR CUENTA' : 'GUARDAR CONTRASEÑA')}
                </button>
              </form>

              {authMode !== 'recovery' && (
                <div className="mt-8 text-center">
                  <button 
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthError(null);
                    }}
                    className="text-xs font-bold text-blush-400 uppercase tracking-widest hover:text-naranja-500 transition-colors"
                  >
                    {authMode === 'login' 
                      ? '¿No tienes cuenta? Regístrate aquí' 
                      : '¿Ya tienes cuenta? Inicia sesión'}
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-blush-400 hover:text-naranja-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

