import { useState, useMemo } from 'react';
import { ChevronRight, MessageSquare, Layers, Lightbulb } from 'lucide-react';
import type { SchemaType, Annotation, ChangeProposal } from '../../lib/types';
import { COMPONENT_COLORS } from '../../lib/schema-relationships';

interface Props {
  schema: SchemaType;
  annotations: Annotation[];
  proposals: ChangeProposal[];
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

export default function SchemaCard({ schema, annotations, proposals, isSelected, isHighlighted, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = COMPONENT_COLORS[schema.type_key] || '#64748b';
  const typeAnnotations = annotations.filter((a) => a.schema_type_id === schema.id);
  const proposalCount = useMemo(
    () => proposals.filter((p) => p.schema_type_id === schema.id && !p.hidden).length,
    [proposals, schema.id]
  );
  const fieldCount = Object.keys(schema.json_schema.properties || {}).length;
  const requiredCount = schema.json_schema.required?.length || 0;
  const isProposed = schema.source === 'proposal';

  return (
    <div
      className={`schema-card group relative overflow-hidden ${isSelected ? 'schema-card-active' : ''} ${
        isHighlighted ? 'ring-2 ring-cyan-300 bg-cyan-50/30' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <h3 className="font-semibold text-sm text-slate-900">{schema.display_name}</h3>
            {isProposed && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-600 border border-amber-200/60">
                proposed
              </span>
            )}
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              hovered || isSelected ? 'translate-x-0.5' : ''
            }`}
          />
        </div>

        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
          {schema.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {fieldCount} fields
          </span>
          {requiredCount > 0 && (
            <span className="text-amber-500">{requiredCount} required</span>
          )}
          {typeAnnotations.length > 0 && (
            <span className="flex items-center gap-1 text-cyan-500">
              <MessageSquare className="w-3 h-3" />
              {typeAnnotations.length}
            </span>
          )}
          {proposalCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <Lightbulb className="w-3 h-3" />
              {proposalCount}
            </span>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300"
        style={{
          backgroundColor: color,
          opacity: hovered || isSelected ? 1 : 0.3,
        }}
      />
    </div>
  );
}
