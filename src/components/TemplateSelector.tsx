import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { Template, TEMPLATES } from "@/types/template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onSelect: (template: Template) => void;
}

export const TemplateSelector = ({
  selectedTemplate,
  onSelect,
}: TemplateSelectorProps) => {
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          Escolha um Modelo Visual
        </h3>
        {selectedTemplate && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Check className="w-4 h-4" />
            <span>{selectedTemplate.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`
              group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300
              ${
                selectedTemplate?.id === template.id
                  ? "border-primary shadow-glow ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50 hover:shadow-lg"
              }
            `}
            onClick={() => onSelect(template)}
          >
            {/* Color Preview */}
            <div className="aspect-[3/4] relative">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: template.colorScheme.background }}
              >
                {/* Simulated header */}
                <div
                  className="h-8"
                  style={{ backgroundColor: template.colorScheme.primary }}
                />
                {/* Simulated content */}
                <div className="p-2 space-y-1.5">
                  <div
                    className="h-2 rounded-full w-3/4"
                    style={{ backgroundColor: template.colorScheme.primary }}
                  />
                  <div className="h-1.5 rounded-full w-full bg-muted" />
                  <div className="h-1.5 rounded-full w-5/6 bg-muted" />
                  <div className="h-1.5 rounded-full w-4/6 bg-muted" />
                  {/* Accent element */}
                  <div className="mt-2 flex gap-1">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: template.colorScheme.accent }}
                    />
                    <div className="h-1.5 w-12 rounded-full bg-muted mt-0.5" />
                  </div>
                  <div className="mt-2">
                    <div
                      className="h-6 rounded"
                      style={{
                        backgroundColor: `${template.colorScheme.primary}15`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Selected check */}
              {selectedTemplate?.id === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              {/* Preview button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewTemplate(template);
                }}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity border border-border hover:bg-muted"
              >
                <Eye className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Template info */}
            <div className="p-2 bg-card border-t border-border">
              <p className="text-xs font-medium text-foreground truncate">
                {template.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {template.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-serif">
                {previewTemplate?.name}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (previewTemplate) {
                      onSelect(previewTemplate);
                      setPreviewTemplate(null);
                    }
                  }}
                  className="gradient-gold text-primary-foreground"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Selecionar Este Modelo
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewTemplate && (
              <iframe
                src={previewTemplate.previewUrl}
                className="w-full h-full border-0"
                title={`Preview ${previewTemplate.name}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
