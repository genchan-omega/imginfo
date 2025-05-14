// src/app/result/page.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ResultPage() {
  const router = useRouter();
  const { task_id } = router.query;
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      const res = await fetch(`http://localhost:5000/result/${task_id}`);
      const data = await res.json();
      setResult(data);
    };

    if (task_id) {
      fetchResult();
    }
  }, [task_id]);

  if (!result) return <div>結果を取得中です...</div>;

  return (
    <div>
      <h1>処理結果</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
