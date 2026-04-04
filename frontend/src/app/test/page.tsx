import { Navbar } from '@/components/landing/Navbar';
import { TypingTest } from '@/components/typing/TypingTest';

export default function TestPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-3xl">
          <TypingTest />
        </div>
      </div>
    </main>
  );
}
