import React from 'react';
import Tutorial from './Tutorial';

export default function TutorialWrapper({ profile, currentPage, onComplete }) {
  return <Tutorial profile={profile} currentPage={currentPage} onComplete={onComplete} />;
}