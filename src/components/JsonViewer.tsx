import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface JsonViewerProps {
  data: object;
  className?: string;
}

const JsonNode = ({ 
  keyName, 
  value, 
  depth = 0 
}: { 
  keyName?: string; 
  value: unknown; 
  depth?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value as object).length === 0;

  const getValueColor = (val: unknown): string => {
    if (typeof val === 'string') return 'text-success';
    if (typeof val === 'number') return 'text-warning';
    if (typeof val === 'boolean') return 'text-primary';
    if (val === null) return 'text-muted-foreground';
    return 'text-foreground';
  };

  const renderValue = (val: unknown): string => {
    if (typeof val === 'string') return `"${val.length > 100 ? val.slice(0, 100) + '...' : val}"`;
    if (val === null) return 'null';
    return String(val);
  };

  if (!isObject) {
    return (
      <span className={getValueColor(value)}>
        {renderValue(value)}
      </span>
    );
  }

  const entries = Object.entries(value as object);
  const bracketOpen = isArray ? '[' : '{';
  const bracketClose = isArray ? ']' : '}';

  return (
    <div className="json-viewer">
      <span
        className="cursor-pointer hover:bg-muted/50 rounded inline-flex items-center gap-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
        {keyName && (
          <>
            <span className="text-accent">"{keyName}"</span>
            <span className="text-muted-foreground">: </span>
          </>
        )}
        <span className="text-foreground">{bracketOpen}</span>
        {!isExpanded && (
          <>
            <span className="text-muted-foreground">
              {isEmpty ? '' : `${entries.length} ${isArray ? 'items' : 'properties'}`}
            </span>
            <span className="text-foreground">{bracketClose}</span>
          </>
        )}
      </span>

      {isExpanded && (
        <div className="ml-4 border-l border-border pl-3 mt-1">
          {entries.map(([key, val], index) => (
            <div key={key} className="py-0.5">
              {typeof val === 'object' && val !== null ? (
                <JsonNode keyName={isArray ? undefined : key} value={val} depth={depth + 1} />
              ) : (
                <>
                  {!isArray && (
                    <>
                      <span className="text-accent">"{key}"</span>
                      <span className="text-muted-foreground">: </span>
                    </>
                  )}
                  <JsonNode value={val} depth={depth + 1} />
                  {index < entries.length - 1 && <span className="text-muted-foreground">,</span>}
                </>
              )}
            </div>
          ))}
          <span className="text-foreground">{bracketClose}</span>
        </div>
      )}
    </div>
  );
};

export const JsonViewer = ({ data, className }: JsonViewerProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      toast.success("JSON copiado para a área de transferência");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar JSON");
    }
  };

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          Resultado da Análise
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-success">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar</span>
            </>
          )}
        </Button>
      </div>
      <div className="p-4 max-h-[600px] overflow-auto">
        <JsonNode value={data} />
      </div>
    </div>
  );
};
