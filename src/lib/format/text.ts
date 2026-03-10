/**
 * 텍스트를 지정된 길이로 자르고 "..." 추가
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
};

/**
 * 리뷰 본문 미리보기 (100자 제한)
 */
export const truncateReviewContent = (content: string): string => {
  return truncateText(content, 100);
};
