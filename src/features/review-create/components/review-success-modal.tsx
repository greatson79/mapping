'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReviewSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewSuccessModal({
  open,
  onOpenChange,
}: ReviewSuccessModalProps) {
  const router = useRouter();

  const handleConfirm = () => {
    onOpenChange(false);
    router.push('/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>리뷰가 작성되었습니다!</DialogTitle>
          <DialogDescription>
            소중한 리뷰 감사합니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirm}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
