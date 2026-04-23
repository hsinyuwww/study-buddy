"use client";

import { useEffect } from 'react';

export default function InitializeSettings() {
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // First try to load from backend (which will check file storage)
        let settingsToApply = null;
        
        try {
          const response = await fetch('/api/settings');
          if (response.ok) {
            const backendSettings = await response.json();
            console.log('Backend settings available:', backendSettings.llmProvider);
            settingsToApply = backendSettings;
          }
        } catch (e) {
          console.log('Backend settings not available yet');
        }
        
        // Check localStorage as fallback
        const savedSettings = localStorage.getItem("studybuddy-settings");
        if (savedSettings && !settingsToApply) {
          console.log('Using localStorage settings as fallback');
          settingsToApply = JSON.parse(savedSettings);
        }
        
        if (settingsToApply) {
          console.log('Auto-initializing backend with settings...');
          
          // Do not persist masked API keys from GET /api/settings — they would be sent
          // back in X-StudyBuddy-Settings and would override real Vercel env keys.
          const toStore = { ...settingsToApply } as Record<string, unknown>;
          if (toStore.llmApiKey === "***") delete toStore.llmApiKey;
          if (toStore.searchApiKey === "***") delete toStore.searchApiKey;
          
          // Save to localStorage for frontend components to use
          localStorage.setItem('studybuddy-settings', JSON.stringify(toStore));
          console.log('✓ Settings saved to localStorage for frontend use');
          
          // Apply these settings to the backend immediately
          const response = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(toStore),
          });
          
          if (response.ok) {
            console.log('✓ Backend settings auto-initialized successfully');
          } else {
            console.warn('⚠ Failed to auto-initialize backend settings, will use per-request headers');
          }
          
          // Dispatch event to notify components that settings are loaded
          window.dispatchEvent(new CustomEvent('settingsLoaded'));
        } else {
          console.log('No saved settings found, backend will use defaults');
        }
      } catch (error) {
        console.warn('Error auto-initializing settings, will use per-request headers:', error);
      }
    };

    // Small delay to ensure DOM is ready, then initialize
    const timeoutId = setTimeout(initializeSettings, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // This component renders nothing, it just initializes settings
  return null;
}