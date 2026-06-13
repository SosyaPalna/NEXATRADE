import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
            <p className="text-muted-foreground">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
                {this.state.error.toString()}
              </pre>
            )}
            <Button onClick={this.handleReset}>
              Обновить страницу
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
