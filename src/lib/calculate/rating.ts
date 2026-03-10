/**
 * 평균 평점 계산 (소수점 첫째 자리까지)
 */
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  const average = sum / ratings.length;

  return Math.round(average * 10) / 10;
};
