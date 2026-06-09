import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

// Context to control the global voice activation and opening of the search modal
const VoiceCommandContext = createContext({
  openSearch: () => {},
  closeSearch: () => {},
  isSearchOpen: false,
});

export const useVoiceCommand = () => useContext(VoiceCommandContext);

export const VoiceCommandProvider = ({ children }) => {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const recognitionRef = useRef(null);

  const openSearch = () => {
    setSearchOpen(true);
    setAutoStart(true);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setAutoStart(false);
  };

  useEffect(() => {
    // If search modal is already open, do not run the global listener to avoid microphone conflict
    if (isSearchOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
        recognitionRef.current = null;
      }
      return;
    }

    if (typeof window === 'undefined') return;
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Use Indian English for better recognition of local names
    recognition.interimResults = true; // Use interim results to open search instantly
    recognition.continuous = true;
    recognition.maxAlternatives = 3;

    // Lenient activation phrase to match "Hey PrashnaSarathi" and common speech-to-text misrecognitions
    const activationPhrase = /(hey\s+)?(prashna|prasna|prishna|prisna|prasanna|krishna|prashan|prasan)\s*(sarathi|sarthi|sarati)/i;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (activationPhrase.test(transcript)) {
          openSearch();
          break;
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        console.error('Global voice command error', e);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start global SpeechRecognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [isSearchOpen]);

  return (
    <VoiceCommandContext.Provider value={{ openSearch, closeSearch, isSearchOpen, autoStart }}>
      {children}
    </VoiceCommandContext.Provider>
  );
};
