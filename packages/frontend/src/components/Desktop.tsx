import { useState } from 'react';
import { Window } from './Window';
import { CommandInput } from './CommandInput';
import { useWindowStore } from '../store/window';
import { streamImagine } from '../lib/api';
import { parseAgentOutput } from '@imagine/shared';

export function Desktop() {
  const { windows, createWindow, updateWindow } = useWindowStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCommand = async (prompt: string) => {
    setIsGenerating(true);

    try {
      for await (const message of streamImagine(prompt)) {
        if (message.type === 'text' && typeof message.data === 'object' && 'content' in message.data) {
          const content = message.data.content;
          
          if (Array.isArray(content)) {
            for (const item of content) {
              if (item.type === 'text') {
                const action = parseAgentOutput(item.text);
                
                if (action) {
                  switch (action.type) {
                    case 'WINDOW_NEW':
                      createWindow(action.id, action.title, action.size);
                      break;
                    case 'WINDOW_UPDATE':
                      updateWindow(action.id, action.content);
                      break;
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      {/* Desktop Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      {/* Windows */}
      {Array.from(windows.values()).map((window) => (
        <Window key={window.id} window={window} />
      ))}

      {/* Command Input */}
      <CommandInput onSubmit={handleCommand} disabled={isGenerating} />

      {/* Loading Indicator */}
      {isGenerating && (
        <div className="fixed top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm font-medium">Generating...</span>
        </div>
      )}
    </div>
  );
}
