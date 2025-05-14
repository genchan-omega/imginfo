// src/app/waiting/page.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ProcessingPage() {
  const router = useRouter();
  const { task_id } = router.query;

  useEffect(() => {
    const checkStatus = async () => {
      if (!task_id) return;

      const interval = setInterval(async () => {
        const res = await fetch(`http://localhost:5000/status/${task_id}`);
        const data = await res.json();

        if (data.status === 'done') {
          clearInterval(interval);
          router.push(`/result?task_id=${task_id}`);
        }
      }, 2000); // 2秒ごとにポーリング

      return () => clearInterval(interval);
    };

    checkStatus();
  }, [task_id]);

  return <div>処理中です...お待ちください</div>;
}
