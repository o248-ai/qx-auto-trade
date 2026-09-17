import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Reload View
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
