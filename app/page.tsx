import MathTradeApp from '@/components/MathTradeApp';
import Auth from '@/components/Auth';

export default function Home() {
  // Use mock data in development, real auth in production
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  
  return useMockData ? <MathTradeApp /> : <Auth />;
}