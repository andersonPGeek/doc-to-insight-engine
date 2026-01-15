import { useState } from "react";
import { Copy, Check, Download, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HtmlPreviewProps {
  html: string;
  css: string;
}

export const HtmlPreview = ({ html, css }: HtmlPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento Visual Law</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    toast.success("HTML copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documento-visual-law.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo HTML baixado!");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <h3 className="font-serif font-semibold text-foreground">
          Documento Visual Gerado
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 mr-2" />
            ) : (
              <Maximize2 className="w-4 h-4 mr-2" />
            )}
            {isExpanded ? "Minimizar" : "Expandir"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copiar HTML
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="gradient-gold text-primary-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div
        className={`bg-muted/20 overflow-auto transition-all duration-300 ${
          isExpanded ? "h-[80vh]" : "h-[600px]"
        }`}
      >
        <iframe
          srcDoc={fullHtml}
          className="w-full h-full border-0"
          title="Preview do documento"
        />
      </div>
    </div>
  );
};
