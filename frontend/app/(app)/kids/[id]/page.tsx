'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { kidsService } from '@/services/kids';
import { goatsService } from '@/services/goats';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Card, Badge, statusTone, Button, ViewOnlyBanner, OwnerBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';
import type { Goat, Kid } from '@/types/farm';

export default function KidDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canModifyRecord, isOwnerOf } = useAuth();
  const [kid, setKid] = useState<Kid | null>(null);
  const [goats, setGoats] = useState<Goat[]>([]);

  useEffect(() => {
    void kidsService.getById(id).then((k) => setKid(k ?? null));
    void goatsService.getAll().then(setGoats);
  }, [id]);

  if (!kid) return <p className="text-sm text-muted-fg">Kid not found.</p>;

  const canEdit = canModifyRecord(kid.ownerId);
  const goatTag = (goatId?: string) => {
    if (!goatId) return '—';
    return goats.find((g) => g.id === goatId)?.tagNumber ?? goatId;
  };

  return (
    <div>
      <PageHeader title={kid.tagNumber} description="Kid record">
        <Link href="/kids">
          <Button variant="outline">Back</Button>
        </Link>
      </PageHeader>
      {!canEdit && <ViewOnlyBanner ownerName={kid.ownerName} />}
      <OwnerBadge name={kid.ownerName} isOwn={isOwnerOf(kid.ownerId)} />

      {kid.imageUrl && (
        <Card className="mt-4 overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={kid.imageUrl} alt={kid.tagNumber} className="max-h-80 w-full object-cover" />
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Profile</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg">Gender</dt>
              <dd>{kid.gender}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Date of Birth</dt>
              <dd>{formatDate(kid.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Weight</dt>
              <dd>{kid.weight} kg</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Mother</dt>
              <dd>{goatTag(kid.motherId)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Father</dt>
              <dd>{goatTag(kid.fatherId)}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Health</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-fg">Health</dt>
              <dd>
                <Badge tone={statusTone(kid.healthStatus)}>{kid.healthStatus}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-fg">Vaccination</dt>
              <dd>
                <Badge tone={statusTone(kid.vaccinationStatus)}>{kid.vaccinationStatus}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-fg">Status</dt>
              <dd>
                <Badge tone={statusTone(kid.status)}>{kid.status}</Badge>
              </dd>
            </div>
          </dl>
        </Card>
        {kid.notes && (
          <Card className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">Notes</h2>
            <p className="text-sm text-muted-fg">{kid.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
