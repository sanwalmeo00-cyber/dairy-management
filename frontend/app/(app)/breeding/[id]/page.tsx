'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { breedingService } from '@/services/breeding';
import { mockGoats } from '@/data/mock/goats';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Card, Badge, statusTone, Button, ViewOnlyBanner, OwnerBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';
import type { Breeding } from '@/types/farm';

function goatName(id: string) {
  return mockGoats.find((g) => g.id === id)?.name ?? id;
}

export default function BreedingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canModifyRecord, isOwnerOf } = useAuth();
  const [record, setRecord] = useState<Breeding | null>(null);

  useEffect(() => {
    void breedingService.getById(id).then((b) => setRecord(b ?? null));
  }, [id]);

  if (!record) return <p className="text-sm text-muted-fg">Record not found.</p>;

  const canEdit = canModifyRecord(record.ownerId);

  return (
    <div>
      <PageHeader title="Breeding Record" description={`${goatName(record.femaleGoatId)} × ${goatName(record.maleGoatId)}`}>
        <Link href="/breeding">
          <Button variant="outline">Back</Button>
        </Link>
      </PageHeader>
      {!canEdit && <ViewOnlyBanner ownerName={record.ownerName} />}
      <OwnerBadge name={record.ownerName} isOwn={isOwnerOf(record.ownerId)} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Timeline</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-fg">Breeding date</dt>
              <dd>{formatDate(record.breedingDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-fg">Expected due</dt>
              <dd>{formatDate(record.expectedDueDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-fg">Actual birth</dt>
              <dd>{record.actualBirthDate ? formatDate(record.actualBirthDate) : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-fg">Status</dt>
              <dd>
                <Badge tone={statusTone(record.status)}>{record.status}</Badge>
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Kids</h2>
          {record.kidIds.length === 0 ? (
            <p className="text-sm text-muted-fg">No kids linked yet.</p>
          ) : (
            <ul className="list-inside list-disc text-sm">
              {record.kidIds.map((kidId) => (
                <li key={kidId}>
                  <Link href={`/kids/${kidId}`} className="text-primary hover:underline">
                    {kidId}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {record.notes && (
          <Card className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">Notes</h2>
            <p className="text-sm text-muted-fg">{record.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
