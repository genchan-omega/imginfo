// app/not-found.tsx

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <main className="min-h-screen w-full relative">
      <Image
        src="/bg_404.webp"
        alt="bg_404"
        fill
        className="-z-1 object-cover opacity-40"
        priority
      />
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-bold mb-4">404 - ページが見つかりません</h1>
        <p className="mb-6">お探しのページは存在しません！</p>
          <Link 
            href="/"
            className="w-60 mt-5 border-2 border-blue-300 bg-blue-200 hover:bg-blue-400 text-gray-700 font-bold px-4 py-2 rounded transition duration-300 hover:cursor-pointer"
          >
            Back to Index Page
          </Link>
      </div>
    </main>
  );
}
