"use client";

import React, { useRef } from 'react';
import { VoiceCommandProvider, useVoiceCommand } from '@/context/VoiceCommandContext';
import SearchModal from '@/components/SearchModal';

function VoiceSearchInner() {
  const { isSearchOpen, closeSearch, autoStart } = useVoiceCommand();
  const searchRef = useRef(null);
  return (
    <SearchModal
      ref={searchRef}
      isOpen={isSearchOpen}
      onClose={closeSearch}
      autoStart={autoStart}
    />
  );
}

export default function VoiceSearchWrapper() {
  return (
    <VoiceCommandProvider>
      <VoiceSearchInner />
    </VoiceCommandProvider>
  );
}

