'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { goatsService } from '@/services/goats';
import { useAuth } from '@/context/AuthContext';
import { mockGoats } from '@/data/mock/goats';
import {
  PageHeader,
  Card,
  Badge,
  statusTone,
  Button,
  ViewOnlyBanner,
  OwnerBadge,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Goat } from '@/types/farm';

function parentName(id?: string) {
  if (!id) return '—';
  return mockGoats.find((g) => g.id === id)?.name ?? id;
}

export default function GoatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canModifyRecord, isOwnerOf } = useAuth();
  const [goat, setGoat] = useState<Goat | null>(null);

  useEffect(() => {
    void goatsService.getById(id).then((g) => setGoat(g ?? null));
  }, [id]);

  if (!goat) {
    return <p className="text-sm text-muted-fg">Goat not found.</p>;
  }

  const canEdit = canModifyRecord(goat.ownerId);

  return (
    <div>
      <PageHeader title={goat.name} description={`Tag ${goat.tagNumber} · ${goat.breed}`}>
        {canEdit && (
          <Link href={`/goats/${goat.id}/edit`}>
            <Button>Edit</Button>
          </Link>
        )}
        <Link href="/goats">
          <Button variant="outline">Back to list</Button>
        </Link>
      </PageHeader>

      {!canEdit && <ViewOnlyBanner ownerName={goat.ownerName} />}

      <div className="mb-4">
        <OwnerBadge name={goat.ownerName} isOwn={isOwnerOf(goat.ownerId)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Identity</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg">Gender</dt>
              <dd>{goat.gender}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Color</dt>
              <dd>{goat.color}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Date of Birth</dt>
              <dd>{formatDate(goat.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Weight</dt>
              <dd>{goat.weight} kg</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Father</dt>
              <dd>{parentName(goat.fatherId)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Mother</dt>
              <dd>{parentName(goat.motherId)}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Health & Status</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg">Health</dt>
              <dd>
                <Badge tone={statusTone(goat.healthStatus)}>{goat.healthStatus}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg">Vaccination</dt>
              <dd>
                <Badge tone={statusTone(goat.vaccinationStatus)}>{goat.vaccinationStatus}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg">Status</dt>
              <dd>
                <Badge tone={statusTone(goat.status)}>{goat.status}</Badge>
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Financial</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg">Purchase Date</dt>
              <dd>{goat.purchaseDate ? formatDate(goat.purchaseDate) : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Purchase Price</dt>
              <dd>{goat.purchasePrice != null ? formatCurrency(goat.purchasePrice) : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Current Value</dt>
              <dd className="font-medium">{formatCurrency(goat.currentValue)}</dd>
            </div>
          </dl>
        </Card>
        {goat.notes && (
          <Card>
            <h2 className="mb-3 font-semibold">Notes</h2>
            <p className="text-sm text-muted-fg">{goat.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
