import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArchitectureEdgeData } from '@/types';
import { PROTOCOL_CONFIG } from '@/constants';
import { cn } from '@/lib/utils';

interface EdgeDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  edgeId: string;
  data: ArchitectureEdgeData | undefined;
}

const GROUP_LABELS: Record<string, string> = {
  standard: 'Standard',
  messaging: 'Messaging',
  data: 'Data',
  auth: 'Auth & DNS',
  aiml: 'AI / ML',
};

export function EdgeDetailsDialog({
  open,
  onClose,
  edgeId,
  data,
}: EdgeDetailsDialogProps) {
  const protocol = data?.protocol ?? 'http';
  const config = PROTOCOL_CONFIG[protocol];
  const protocolLabel = config?.label ?? protocol.toUpperCase();
  const protocolColor = config?.color.primary ?? '#3b82f6';
  const group = config ? GROUP_LABELS[config.group] : undefined;

  const isAsync = data?.async ?? false;
  const isBidirectional = data?.bidirectional ?? false;
  const isAnimated = data?.animated ?? false;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* Protocol colour dot */}
            <span
              className="inline-block h-3 w-3 rounded-full flex-shrink-0"
              style={{ background: protocolColor }}
            />
            Edge Details
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            ID: {edgeId}
          </DialogDescription>
        </DialogHeader>

        {/* ── Protocol ── */}
        <Section title="Protocol">
          <Row label="Type">
            <span
              className="font-semibold"
              style={{ color: protocolColor }}
            >
              {protocolLabel}
            </span>
            {group && (
              <Badge>{group}</Badge>
            )}
          </Row>
          {data?.method && (
            <Row label="Method">
              <HttpMethodBadge method={data.method} />
            </Row>
          )}
          {config && (
            <Row label="Request / Response">
              {config.requestResponse ? 'Yes' : 'No (fire-and-forget)'}
            </Row>
          )}
        </Section>

        {/* ── Connection ── */}
        <Section title="Connection">
          {data?.label && <Row label="Label">{data.label}</Row>}
          {data?.description && (
            <Row label="Description">
              <span className="whitespace-pre-wrap">{data.description}</span>
            </Row>
          )}
          {data?.latencyMs !== undefined && (
            <Row label="Latency">{data.latencyMs} ms</Row>
          )}
          <Row label="Flags">
            <div className="flex flex-wrap gap-1">
              <FlagBadge active={isAsync} label="Async" />
              <FlagBadge active={isBidirectional} label="Bidirectional" />
              <FlagBadge active={isAnimated} label="Animated" />
            </div>
          </Row>
        </Section>

        {/* ── Data Contract ── */}
        {data?.dataContract && (
          <Section title="Data Contract">
            {data.dataContract.format && (
              <Row label="Format">
                <Badge>{data.dataContract.format.toUpperCase()}</Badge>
              </Row>
            )}
            {data.dataContract.schemaName && (
              <Row label="Schema Name">{data.dataContract.schemaName}</Row>
            )}
            {data.dataContract.description && (
              <Row label="Description">{data.dataContract.description}</Row>
            )}
            {data.dataContract.schema && (
              <div className="mt-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Schema
                </p>
                <pre className="overflow-auto rounded-md bg-muted p-2 text-xs leading-relaxed max-h-40">
                  {data.dataContract.schema}
                </pre>
              </div>
            )}
          </Section>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── small layout helpers ─────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="rounded-lg border p-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
      {children}
    </span>
  );
}

function FlagBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
        active
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground opacity-40'
      )}
    >
      {label}
    </span>
  );
}

const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
  POST: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
  PUT: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
  PATCH: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
  DELETE: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
};

function HttpMethodBadge({ method }: { method: string }) {
  const color = HTTP_METHOD_COLORS[method] ?? 'text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800';
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-xs font-mono font-bold', color)}>
      {method}
    </span>
  );
}
