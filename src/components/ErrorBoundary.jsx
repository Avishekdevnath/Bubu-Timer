import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] px-6 text-center gap-4">
          <p className="text-3xl">⚠️</p>
          <p className="text-sm font-semibold text-stone-700">Something went wrong</p>
          <p className="text-xs text-stone-400 max-w-xs">{this.state.error?.message || 'Unexpected error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
