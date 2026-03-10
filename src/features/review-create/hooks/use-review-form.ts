import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReviewRequestSchema, type CreateReviewRequest } from '../lib/dto';

export const useReviewForm = (defaultValues: Partial<CreateReviewRequest>) => {
  const form = useForm<CreateReviewRequest>({
    resolver: zodResolver(CreateReviewRequestSchema),
    defaultValues: {
      placeId: defaultValues.placeId || '',
      placeName: defaultValues.placeName || '',
      address: defaultValues.address || '',
      category: defaultValues.category,
      latitude: defaultValues.latitude,
      longitude: defaultValues.longitude,
      authorName: '',
      rating: 0,
      content: '',
      password: '',
    },
    mode: 'onChange',
  });

  return form;
};
