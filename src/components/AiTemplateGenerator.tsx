import { useState } from "react";
import { Sparkles, Clock, Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Template } from "@/types/template";

interface AiTemplateGeneratorProps {
  onTemplateGenerated: (template: Template) => void;
}

export const AiTemplateGenerator = ({ onTemplateGenerated }: AiTemplateGeneratorProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error("Por favor, insira o título do documento");
      return;
    }

    setIsGenerating(true);
    setGenerationTime(null);
    setGeneratedPreview(null);
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            mode: 'generate-template',
            title: title.trim(),
            description: description.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao gerar template: ${response.status}`);
      }

      const result = await response.json();
      const elapsed = Date.now() - startTime;
      setGenerationTime(elapsed);

      // Create a blob URL for the generated HTML
      const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${result.css}</style>
</head>
<body>
${result.html}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const previewUrl = URL.createObjectURL(blob);
      setGeneratedPreview(previewUrl);

      // Create the template object
      const generatedTemplate: Template = {
        id: `ai-generated-${Date.now()}`,
        name: title,
        description: description || "Modelo gerado por IA",
        previewUrl: previewUrl,
        colorScheme: result.colorScheme || {
          primary: '#2c3e50',
          accent: '#3498db',
          background: '#ffffff',
        },
      };

      toast.success(`Template gerado em ${(elapsed / 1000).toFixed(1)}s`);
      onTemplateGenerated(generatedTemplate);

    } catch (error) {
      console.error('Template generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar template');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-serif font-semibold text-foreground">Gerar Modelo com IA</h3>
          <p className="text-xs text-muted-foreground">Crie um modelo personalizado a partir do título e descrição</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="doc-title">Título do Documento</Label>
          <Input
            id="doc-title"
            placeholder="Ex: Petição Inicial - Danos Morais"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isGenerating}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doc-description">Descrição (opcional)</Label>
          <Textarea
            id="doc-description"
            placeholder="Descreva o tipo de documento, área do direito, elementos desejados..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isGenerating}
            className="bg-background resize-none"
            rows={3}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !title.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando modelo...
            </>
          ) : (
            <>
              <Palette className="w-4 h-4 mr-2" />
              Gerar Modelo com IA
            </>
          )}
        </Button>

        {generationTime !== null && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Tempo de geração: <span className="text-primary font-medium">{(generationTime / 1000).toFixed(1)}s</span></span>
          </div>
        )}
      </div>

      {generatedPreview && (
        <div className="mt-4 border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-foreground">Preview do Modelo Gerado</p>
          </div>
          <iframe
            src={generatedPreview}
            className="w-full h-64 border-0"
            title="Preview do modelo gerado"
          />
        </div>
      )}
    </div>
  );
};
