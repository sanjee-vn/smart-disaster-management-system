import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default class Component03ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Component 03 render failure', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <main className="component03-fatal-state" role="alert">
      <AlertTriangle size={30}/>
      <h1>This operational page could not be displayed</h1>
      <p>{this.state.error.message || 'An unexpected rendering error occurred.'}</p>
      <div><button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload Page</button><button type="button" className="btn btn-secondary" onClick={() => { window.location.href = '/' }}>Return to Dashboard</button></div>
    </main>
  }
}
