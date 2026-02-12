"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto mt-20 text-center px-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-4">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
