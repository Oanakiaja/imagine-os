import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@imagine/ui';

interface CommandInputProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
}

export function CommandInput({ onSubmit, disabled }: CommandInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !disabled) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want to build?"
          disabled={disabled}
          className="w-full px-6 py-4 pr-14 text-lg rounded-full border-2 border-gray-300 focus:border-blue-500 focus:outline-none shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !prompt.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
