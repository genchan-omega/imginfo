// src/app/page.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {Dela_Gothic_One} from "next/font/google";

const reggae = Dela_Gothic_One({weight: "400", subsets:["latin"]});

export default function Home() {
  return (
    <main className="min-h-screen w-full relative">
      <Image
        src="/bg_entry.png"
        alt=""
        fill
        className="-z-1 object-cover opacity-40"
        priority
      />
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <h1 className={`${reggae.className} text-7xl font-bold text-fuchsia-600`}>
          3Dモデル生成サイト
        </h1>
        <p className="w-130 p-2 text-2xl">
          数枚の写真を撮ることで，簡単にかわいい3Dモデルを生成するサイトです．
        </p>
        <div className="flex gap-5">
          <Link 
            href="./upload_check"
            className="border-2 border-emerald-200 p-2 hover:bg-emerald-800 transition duration-300"
          >
            動作確認をする！
          </Link>
          <Link 
            href="./upload_make"
            className="border-2 border-amber-200 p-2 hover:bg-amber-800 transition duration-300"
          >
            3Dモデルを作る！
          </Link>
        </div>
      </div>
    </main>
  );
}
