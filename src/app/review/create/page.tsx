import { redirect } from 'next/navigation';
import { ReviewForm } from '@/features/review-create/components/review-form';

interface ReviewCreatePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ReviewCreatePage({
  searchParams,
}: ReviewCreatePageProps) {
  const params = await searchParams;

  const placeId = typeof params.placeId === 'string' ? params.placeId : undefined;
  const placeName = typeof params.placeName === 'string' ? params.placeName : undefined;
  const address = typeof params.address === 'string' ? params.address : undefined;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const latitude = typeof params.latitude === 'string' ? parseFloat(params.latitude) : undefined;
  const longitude = typeof params.longitude === 'string' ? parseFloat(params.longitude) : undefined;

  // 필수 파라미터 검증
  if (!placeId || !placeName) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <ReviewForm
        placeId={placeId}
        placeName={placeName}
        address={address || ''}
        category={category}
        latitude={latitude}
        longitude={longitude}
      />
    </div>
  );
}
