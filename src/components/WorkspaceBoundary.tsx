import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  save: () => Promise<void>;
  saveStatus: string;
  onBack: () => void;
}

/** A failed editor download must leave the learner state and navigation intact. */
export default class WorkspaceBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const saved = ['All changes saved', 'Saved on this device'].includes(this.props.saveStatus);
    return (
      <section className="page-container" role="alert">
        <h1>The code workspace could not open.</h1>
        <p>Your project remains in this tab. Save your work before reloading to retry the editor download.</p>
        <p role="status">{this.props.saveStatus}</p>
        <div className="button-row">
          <button className="button primary" onClick={() => void this.props.save()}>Save project</button>
          <button className="button secondary" disabled={!saved} onClick={() => window.location.reload()}>Reload editor</button>
          <button className="button secondary" onClick={this.props.onBack}>Return to overview</button>
        </div>
      </section>
    );
  }
}
