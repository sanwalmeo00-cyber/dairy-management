import Link from 'next/link';
import { Button, Card } from '@/components/ui';

type WalletEmptyNoticeProps = {
  message: string;
  backHref?: string;
  backLabel?: string;
};

/** Shown instead of money-out forms when the farm wallet has no balance. */
export function WalletEmptyNotice({
  message,
  backHref,
  backLabel = 'Back',
}: WalletEmptyNoticeProps) {
  return (
    <Card>
      <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
        {message}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/cashbook/new?type=sale">
          <Button type="button">Go to Cashbook</Button>
        </Link>
        {backHref ? (
          <Link href={backHref}>
            <Button type="button" variant="outline">
              {backLabel}
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
