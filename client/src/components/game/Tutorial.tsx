import React, { useState, useEffect } from 'react';
import './Tutorial.css';

interface TutorialStep {
  icon: string;
  title: string;
  body: React.ReactNode;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🏝️',
    title: 'Welcome to Catan Online!',
    body: (
      <>
        <p>
          <strong>Settlers of Catan</strong> is a strategy board game where you collect resources,
          build settlements and cities, and trade with other players to earn
          <span className="highlight"> Victory Points (VP)</span>.
        </p>
        <p>
          The first player to reach <strong>10 VP</strong> (or 13 with Cities &amp; Knights) wins the game!
        </p>
        <div className="tutorial-tip">
          <strong>💡 Tip:</strong> This tutorial covers the basics. You'll learn more as you play!
        </div>
      </>
    ),
  },
  {
    icon: '🗺️',
    title: 'The Board',
    body: (
      <>
        <p>
          The board is made of <strong>hexagonal tiles</strong>, each producing a different resource.
          Numbers on tiles indicate which dice rolls produce resources from that tile.
        </p>
        <div className="tutorial-info-grid">
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🌲</span>
            <div>
              <span className="tutorial-info-label">Forest → Lumber</span>
              <span className="tutorial-info-desc">Build roads & settlements</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🧱</span>
            <div>
              <span className="tutorial-info-label">Hills → Brick</span>
              <span className="tutorial-info-desc">Build roads & settlements</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🌾</span>
            <div>
              <span className="tutorial-info-label">Fields → Grain</span>
              <span className="tutorial-info-desc">Build settlements & cities</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🐑</span>
            <div>
              <span className="tutorial-info-label">Pasture → Wool</span>
              <span className="tutorial-info-desc">Build settlements & buy cards</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">⛰️</span>
            <div>
              <span className="tutorial-info-label">Mountain → Ore</span>
              <span className="tutorial-info-desc">Build cities & buy cards</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🏜️</span>
            <div>
              <span className="tutorial-info-label">Desert</span>
              <span className="tutorial-info-desc">Produces nothing, starts with robber</span>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    icon: '🎲',
    title: 'Rolling Dice & Getting Resources',
    body: (
      <>
        <p>
          On your turn, you <strong>roll two dice</strong>. Every tile with the matching number
          produces resources for players with settlements or cities touching it.
        </p>
        <p>
          <strong>Settlements</strong> produce <span className="highlight">1 resource</span> each.
          <strong> Cities</strong> produce <span className="highlight">2 resources</span> each.
        </p>
        <div className="tutorial-tip">
          <strong>💡 Tip:</strong> Numbers <strong>6</strong> and <strong>8</strong> are rolled most often
          (shown with red numbers). Place your settlements near these tiles!
        </div>
        <p>
          If a <strong>7</strong> is rolled, no one gets resources. Instead, any player with more than
          7 cards must discard half, and you move the <strong>Robber</strong> to steal from an opponent.
        </p>
      </>
    ),
  },
  {
    icon: '🏘️',
    title: 'Building',
    body: (
      <>
        <p>
          Spend resources to build structures and expand your empire.
          Each structure costs specific resources:
        </p>
        <div className="tutorial-info-grid">
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🛣️</span>
            <div>
              <span className="tutorial-info-label">Road</span>
              <span className="tutorial-info-desc">🧱 Brick + 🌲 Lumber</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🏠</span>
            <div>
              <span className="tutorial-info-label">Settlement (1 VP)</span>
              <span className="tutorial-info-desc">🧱 🌲 🌾 🐑</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🏰</span>
            <div>
              <span className="tutorial-info-label">City (2 VP)</span>
              <span className="tutorial-info-desc">🌾🌾 ⛰️⛰️⛰️</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🃏</span>
            <div>
              <span className="tutorial-info-label">Development Card</span>
              <span className="tutorial-info-desc">🐑 🌾 ⛰️</span>
            </div>
          </div>
        </div>
        <div className="tutorial-tip">
          <strong>💡 Tip:</strong> Settlements must be at least <strong>2 road segments apart</strong>.
          Build roads to reach new locations!
        </div>
      </>
    ),
  },
  {
    icon: '💱',
    title: 'Trading',
    body: (
      <>
        <p>
          Don't have the right resources? <strong>Trade!</strong>
        </p>
        <p>
          <strong>Bank Trade:</strong> Trade <span className="highlight">4 of one resource</span> for
          1 of any other. If you have a settlement on a <strong>port</strong>, you get better rates
          (3:1 or 2:1).
        </p>
        <p>
          <strong>Player Trade:</strong> Propose trades to other players — negotiate any deal you want!
        </p>
        <div className="tutorial-tip">
          <strong>💡 Tip:</strong> Trading is key to winning. Build on ports early for better exchange rates!
        </div>
      </>
    ),
  },
  {
    icon: '🏆',
    title: 'Winning the Game',
    body: (
      <>
        <p>
          Race to <strong>10 Victory Points</strong> to win! Here's how to earn them:
        </p>
        <div className="tutorial-info-grid">
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🏠</span>
            <div>
              <span className="tutorial-info-label">Settlement = 1 VP</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🏰</span>
            <div>
              <span className="tutorial-info-label">City = 2 VP</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">🛣️</span>
            <div>
              <span className="tutorial-info-label">Longest Road = 2 VP</span>
              <span className="tutorial-info-desc">5+ connected roads</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">⚔️</span>
            <div>
              <span className="tutorial-info-label">Largest Army = 2 VP</span>
              <span className="tutorial-info-desc">3+ knight cards played</span>
            </div>
          </div>
        </div>
        <div className="tutorial-tip">
          <strong>💡 Tip:</strong> Development cards can contain <strong>hidden VP cards</strong>.
          Keep an eye on opponents who buy lots of dev cards!
        </div>
      </>
    ),
  },
  {
    icon: '🎮',
    title: 'How to Play Online',
    body: (
      <>
        <p>Here's how this online version works:</p>
        <div className="tutorial-info-grid">
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">1️⃣</span>
            <div>
              <span className="tutorial-info-label">Create or Join a Room</span>
              <span className="tutorial-info-desc">Share the room code with friends</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">2️⃣</span>
            <div>
              <span className="tutorial-info-label">Pick a Color & Ready Up</span>
              <span className="tutorial-info-desc">Host starts when all are ready</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">3️⃣</span>
            <div>
              <span className="tutorial-info-label">Setup Phase</span>
              <span className="tutorial-info-desc">Place 2 settlements & 2 roads each</span>
            </div>
          </div>
          <div className="tutorial-info-item">
            <span className="tutorial-info-icon">4️⃣</span>
            <div>
              <span className="tutorial-info-label">Roll → Trade → Build → End Turn</span>
              <span className="tutorial-info-desc">Repeat until someone wins!</span>
            </div>
          </div>
        </div>
        <div className="tutorial-tip">
          <strong>💡 Tip:</strong> Use the <strong>💬 chat button</strong> to talk to other players during the game.
          On mobile, tap it in the bottom-right corner!
        </div>
      </>
    ),
  },
];

const STORAGE_KEY = 'catan-tutorial-dismissed';

interface TutorialProps {
  forceShow?: boolean;
  onClose?: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ forceShow, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setCurrentStep(0);
    } else {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    }
  }, [forceShow]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setVisible(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!visible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="tutorial-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="tutorial-card">
        {/* Header */}
        <div className="tutorial-header">
          <div className="tutorial-badge">📖 New Player Guide</div>
          <h2 className="tutorial-title">Learn to Play Catan</h2>
          <button className="tutorial-skip-btn" onClick={handleClose} title="Close tutorial">
            ✕
          </button>
        </div>

        {/* Step dots */}
        <div className="tutorial-steps-indicator">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(i)}
            />
          ))}
        </div>

        {/* Content */}
        <div className="tutorial-content">
          <div className="tutorial-step" key={currentStep}>
            <div className="tutorial-step-icon">{step.icon}</div>
            <h3 className="tutorial-step-title">{step.title}</h3>
            <div className="tutorial-step-body">{step.body}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="tutorial-footer">
          <label className="tutorial-dont-show">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don't show again
          </label>

          <div className="tutorial-nav-btns">
            {currentStep > 0 && (
              <button className="tutorial-nav-btn prev" onClick={handlePrev}>
                ← Back
              </button>
            )}
            <button
              className={`tutorial-nav-btn ${isLastStep ? 'finish' : 'next'}`}
              onClick={handleNext}
            >
              {isLastStep ? '🎮 Start Playing!' : 'Next →'}
            </button>
          </div>

          <span className="tutorial-step-counter">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </span>
        </div>
      </div>
    </div>
  );
};

// Export a function to manually trigger the tutorial
export const resetTutorial = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export default Tutorial;
