import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed:false };
  }

  static getDerivedStateFromError() {
    return { failed:true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="error-screen" role="alert" aria-live="assertive">
          <div className="error-card">
            <div className="start-logo">TREBLR</div>
            <h1>We hit a snag.</h1>
            <p>Your career save is kept on this device. Reload the game to try again.</p>
            <button className="btn btn-primary btn-full" type="button" onClick={() => window.location.reload()}>RELOAD GAME</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
