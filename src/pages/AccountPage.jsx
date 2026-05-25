import { User } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase.js'

export function AccountPage({ currentUser, authTab, setAuthTab, authForms, setAuthForms, login, signup, loginWithGoogle, setCurrentUser }) {
  return (
    <div className="w-full px-4 md:px-6 pt-6">
      {currentUser && !currentUser.isGuest ? (
        <>
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 flex flex-col items-center mb-4">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-4">
              {currentUser.photoURL
                ? <img src={currentUser.photoURL} alt="" className="w-20 h-20 rounded-full object-cover" />
                : <User size={36} />}
            </div>
            <h2 className="text-xl font-medium text-stone-800">{currentUser.username || 'No name set'}</h2>
            <p className="text-sm text-stone-500 mb-6">{currentUser.email}</p>
          </div>
          <button onClick={() => signOut(auth)}
            className="w-full py-4 bg-white border border-stone-200 rounded-2xl text-stone-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-stone-50 hover:text-red-600 transition-colors shadow-sm">
            Sign Out
          </button>
        </>
      ) : (
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-stone-100">
            <button onClick={() => setAuthTab('login')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${authTab === 'login' ? 'text-stone-900 border-b-2 border-stone-900 -mb-px' : 'text-stone-400 hover:text-stone-700'}`}>
              Sign In
            </button>
            <button onClick={() => setAuthTab('signup')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${authTab === 'signup' ? 'text-stone-900 border-b-2 border-stone-900 -mb-px' : 'text-stone-400 hover:text-stone-700'}`}>
              Create Account
            </button>
          </div>

          <div className="p-6">
            {authTab === 'login' ? (
              <form onSubmit={login} className="space-y-3">
                <input className="field-in" type="email" placeholder="your@email.com" value={authForms.loginEmail} onChange={(e) => setAuthForms({ ...authForms, loginEmail: e.target.value })} />
                <input className="field-in" type="password" placeholder="Password" value={authForms.loginPassword} onChange={(e) => setAuthForms({ ...authForms, loginPassword: e.target.value })} />
                <button className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">Sign In</button>
              </form>
            ) : (
              <form onSubmit={signup} className="space-y-3">
                <input className="field-in" type="email" placeholder="your@email.com" value={authForms.signupEmail} onChange={(e) => setAuthForms({ ...authForms, signupEmail: e.target.value })} />
                <input className="field-in" type="password" placeholder="At least 6 characters" value={authForms.signupPassword} onChange={(e) => setAuthForms({ ...authForms, signupPassword: e.target.value })} />
                <input className="field-in" placeholder="Your name" value={authForms.signupUsername} onChange={(e) => setAuthForms({ ...authForms, signupUsername: e.target.value })} />
                <input className="field-in" placeholder="Partner name (optional)" value={authForms.signupPartnerName} onChange={(e) => setAuthForms({ ...authForms, signupPartnerName: e.target.value })} />
                <button className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">Create Account</button>
              </form>
            )}

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            <button type="button" onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-sm mb-3">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.6 34.7 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8L6 33.1C9.2 39.5 16 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.4C40.9 36 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>

            <button onClick={() => setCurrentUser({ uid: `guest-${Date.now()}`, isGuest: true, username: 'Guest', partnerName: '' })}
              className="w-full py-3 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors">
              Continue as Guest
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
