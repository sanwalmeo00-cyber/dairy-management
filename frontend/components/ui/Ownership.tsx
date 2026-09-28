import { Eye } from 'lucide-react';
import { Badge } from './Badge';

export function ViewOnlyBanner({ ownerName }: { ownerName: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Eye className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">View Only</p>
        <p className="text-amber-800/90">
          This record was added by {ownerName}. You can view it but cannot modify it.
        </p>
      </div>
    </div>
  );
}

export function OwnerBadge({ name, isOwn }: { name: string; isOwn: boolean }) {
  return <Badge tone={isOwn ? 'success' : 'neutral'}>{name}</Badge>;
}
