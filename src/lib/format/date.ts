import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * ISO 8601 문자열을 YYYY.MM.DD 형식으로 변환
 */
export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return format(date, 'yyyy.MM.dd', { locale: ko });
};

/**
 * ISO 8601 문자열을 YYYY년 MM월 DD일 형식으로 변환
 */
export const formatDateLong = (isoString: string): string => {
  const date = new Date(isoString);
  return format(date, 'yyyy년 MM월 dd일', { locale: ko });
};
