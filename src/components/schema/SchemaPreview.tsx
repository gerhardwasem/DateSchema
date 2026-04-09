import { Hash, ToggleLeft, Type, List, Braces, Plus, Minus, Pencil } from 'lucide-react';
import type { SchemaType, SchemaProperty, ChangeType } from '../../lib/types';

export type FieldDiffStatus = 'added' | 'modified' | 'removed' | 'unchanged';

export interface FieldDiff {
  fieldName: string;
  status: FieldDiffStatus;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

interface Props {
  schema: SchemaType;
  diffs: FieldDiff[];
  compact?: boolean;
}

const typeIcons: Record<string, typeof Hash> = {
  integer: Hash,
  number: Hash,
  boolean: ToggleLeft,
  string: Type,
  array: List,
  object: Braces,
};

const statusStyles: Record<FieldDiffStatus, { border: string; bg: string; text: string; badge: string; badgeBg: string }> = {
  added: { border: 'border-l-emerald-500', bg: 'bg-emerald-50/60', text: 'text-emerald-700', badge: 'NEW', badgeBg: 'bg-emerald-100 text-emerald-700' },
  modified: { border: 'border-l-amber-500', bg: 'bg-amber-50/60', text: 'text-amber-700', badge: 'CHANGED', badgeBg: 'bg-amber-100 text-amber-700' },
  removed: { border: 'border-l-red-500', bg: 'bg-red-50/60', text: 'text-red-500', badge: 'REMOVED', badgeBg: 'bg-red-100 text-red-700' },
  unchanged: { border: 'border-l-transparent', bg: '', text: 'text-slate-700', badge: '', badgeBg: '' },
};

const statusIcons: Record<FieldDiffStatus, typeof Plus | null> = {
  added: Plus,
  modified: Pencil,
  removed: Minus,
  unchanged: null,
};

function getTypeLabel(prop: SchemaProperty): string {
  let label = prop.type;
  if (prop.format) label += ` (${prop.format})`;
  if (prop.enum) label += ` [${prop.enum.join(' | ')}]`;
  if (prop.nullable) label += ' ?';
  return label;
}

export default function SchemaPreview({ schema, diffs, compact }: Props) {
  const properties = schema.json_schema.properties || {};
  const fieldNames = Object.keys(properties);
  const diffMap = new Map(diffs.map((d) => [d.fieldName, d]));

  const addedFields = diffs.filter((d) => d.status === 'added' && !fieldNames.includes(d.fieldName));

  const allFields = [...fieldNames, ...addedFields.map((d) => d.fieldName)];

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 mb-2">
        <Braces className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Schema Preview
        </span>
        {diffs.length > 0 && (
          <span className="text-xs text-slate-400">
            ({diffs.filter((d) => d.status !== 'unchanged').length} change{diffs.filter((d) => d.status !== 'unchanged').length !== 1 ? 's' : ''})
          </span>
        )}
      </div>

      {allFields.map((name) => {
        const diff = diffMap.get(name);
        const status = diff?.status || 'unchanged';
        const style = statusStyles[status];
        const StatusIcon = statusIcons[status];

        const prop = properties[name];
        const displayProp = status === 'added' && diff?.newValue
          ? diff.newValue as unknown as SchemaProperty
          : prop;

        if (!displayProp) return null;

        const Icon = typeIcons[displayProp.type] || Type;

        return (
          <div
            key={name}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-r-lg border-l-2 transition-all ${style.border} ${style.bg}`}
          >
            {StatusIcon && <StatusIcon className={`w-3 h-3 ${style.text} shrink-0`} />}
            <Icon className={`w-3.5 h-3.5 shrink-0 ${status === 'unchanged' ? 'text-slate-400' : style.text}`} />
            <code className={`text-xs font-mono font-medium ${status === 'removed' ? 'line-through text-red-400' : style.text}`}>
              {name}
            </code>
            {!compact && (
              <span className={`text-xs ml-auto ${status === 'removed' ? 'line-through text-red-300' : 'text-slate-400'}`}>
                {getTypeLabel(displayProp)}
              </span>
            )}
            {style.badge && (
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${style.badgeBg} ml-1`}>
                {style.badge}
              </span>
            )}
          </div>
        );
      })}

      {allFields.length === 0 && (
        <p className="text-xs text-slate-400 italic px-3 py-4">No fields defined</p>
      )}
    </div>
  );
}

export function computeDiffsFromProposal(
  schema: SchemaType,
  changeType: ChangeType,
  currentValue: Record<string, unknown>,
  proposedValue: Record<string, unknown>,
): FieldDiff[] {
  const properties = schema.json_schema.properties || {};
  const fieldNames = Object.keys(properties);
  const diffs: FieldDiff[] = [];

  if (changeType === 'add_field') {
    const newFieldNames = Object.keys(proposedValue).filter((k) => !k.startsWith('_'));
    fieldNames.forEach((name) => {
      diffs.push({ fieldName: name, status: 'unchanged' });
    });
    newFieldNames.forEach((name) => {
      if (!fieldNames.includes(name)) {
        diffs.push({
          fieldName: name,
          status: 'added',
          newValue: proposedValue[name] as Record<string, unknown>,
        });
      }
    });
  } else if (changeType === 'remove_field') {
    const removed = new Set((proposedValue._removed as string[]) || Object.keys(currentValue));
    fieldNames.forEach((name) => {
      diffs.push({
        fieldName: name,
        status: removed.has(name) ? 'removed' : 'unchanged',
        oldValue: removed.has(name) ? (currentValue[name] as Record<string, unknown>) : undefined,
      });
    });
  } else if (changeType === 'modify_field') {
    const modifiedFields = new Set(Object.keys(proposedValue));
    fieldNames.forEach((name) => {
      if (modifiedFields.has(name)) {
        diffs.push({
          fieldName: name,
          status: 'modified',
          oldValue: (currentValue[name] as Record<string, unknown>) || {},
          newValue: (proposedValue[name] as Record<string, unknown>) || {},
        });
      } else {
        diffs.push({ fieldName: name, status: 'unchanged' });
      }
    });
  } else {
    fieldNames.forEach((name) => {
      diffs.push({ fieldName: name, status: 'unchanged' });
    });
  }

  return diffs;
}
