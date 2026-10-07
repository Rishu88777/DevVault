import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from './Feedback'

/** Catches render errors so users never see a stack trace or blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(_e: Error, _i: ErrorInfo) { /* intentionally not logged to any service */ }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <ErrorMessage title="This tool hit an unexpected problem" action={<Button size="sm" onClick={() => this.setState({ failed: false })}>Try again</Button>}>
        Your input was not sent anywhere. Reload the page or try again.
      </ErrorMessage>
    )
  }
}
