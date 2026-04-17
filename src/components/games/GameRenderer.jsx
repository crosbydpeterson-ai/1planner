import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Dynamically renders a game component from code string.
 * The code is compiled using new Function() and rendered as a React component.
 */
export default function GameRenderer({ gameCode, questions, onGameEnd, onAnswerResult }) {
  const [error, setError] = useState(null);
  const [GameComponent, setGameComponent] = useState(null);
  const keyRef = useRef(0);

  useEffect(() => {
    if (!gameCode) return;
    try {
      setError(null);
      keyRef.current += 1;
      
      let code = gameCode.trim();
      
      // Remove any markdown fences if present
      code = code.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');

      // Strip export default if present
      code = code.replace(/export\s+default\s+/, '');
      
      // Quick check: if the code still has JSX angle-bracket patterns, show a clear error
      // Look for patterns like: return ( <div  or  return <div  — strong JSX indicators
      if (/return\s*\(?\s*<[a-zA-Z]/.test(code)) {
        setError('Game code contains JSX syntax which cannot run in this environment. Please regenerate the game.');
        return;
      }
      
      // Create the component using Function constructor
      const createComponent = new Function(
        'React',
        `
        const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useLayoutEffect, Fragment, createElement } = React;
        const h = React.createElement;
        
        ${code}
        
        // Try to find the exported component
        if (typeof GameComponent !== 'undefined') return GameComponent;
        if (typeof Game !== 'undefined') return Game;
        if (typeof MiniGame !== 'undefined') return MiniGame;
        
        throw new Error('Could not find game component. Make sure the function is named GameComponent.');
        `
      );
      
      const Comp = createComponent(React);
      setGameComponent(() => Comp);
    } catch (e) {
      console.error('Game render error:', e);
      setError(e.message);
    }
  }, [gameCode]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-white p-6">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold mb-2">Game Error</h3>
          <p className="text-sm text-slate-400 mb-4 whitespace-pre-wrap">{error}</p>
          <button
            onClick={() => onGameEnd?.({ score: 0, correctAnswers: 0, totalQuestions: 0, survivalTime: 0 })}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Exit Game
          </button>
        </div>
      </div>
    );
  }

  if (!GameComponent) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ErrorBoundary key={keyRef.current} onError={(e) => setError(e)} onGameEnd={onGameEnd}>
        <GameComponent
          questions={questions || []}
          onGameEnd={onGameEnd || (() => {})}
          onAnswerResult={onAnswerResult || (() => {})}
        />
      </ErrorBoundary>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error) {
    this.props.onError?.(error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-900 text-white p-6">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">💥</div>
            <h3 className="text-lg font-bold mb-2">Game Crashed</h3>
            <p className="text-sm text-slate-400 mb-4">{this.state.error}</p>
            <button
              onClick={() => this.props.onGameEnd?.({ score: 0, correctAnswers: 0, totalQuestions: 0, survivalTime: 0 })}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Exit Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}