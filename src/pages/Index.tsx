import { useState, useCallback } from "react";
import { Scale, FileSearch, Sparkles, Zap, Brain, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { StageTimer } from "@/components/StageTimer";
import { TemplateSelector } from "@/components/TemplateSelector";
import { HtmlPreview } from "@/components/HtmlPreview";
import { parseDocument, ParsedDocument } from "@/lib/documentParser";
import { ProcessingStage } from "@/types/document";
import { Template } from "@/types/template";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModelOption = 'gemini-flash' | 'gemini-pro' | 'gpt-5' | 'gpt-5-mini';

type Step = 'template' | 'upload' | 'processing' | 'result';

const MODEL_OPTIONS: { value: ModelOption; label: string; description: string }[] = [
  { value: 'gemini-flash', label: 'Gemini Flash', description: 'Mais rápido (~30s)' },
  { value: 'gemini-pro', label: 'Gemini Pro', description: 'Mais preciso (~2min)' },
  { value: 'gpt-5', label: 'GPT-5', description: 'OpenAI Premium' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini', description: 'OpenAI Rápido' },
];

const INITIAL_STAGES: ProcessingStage[] = [
  { id: 'upload', name: 'Upload do Arquivo', status: 'pending' },
  { id: 'extraction', name: 'Extração de Texto', status: 'pending' },
  { id: 'analysis', name: 'Análise com IA', status: 'pending' },
  { id: 'formatting', name: 'Geração do HTML Visual', status: 'pending' },
];

interface VisualResult {
  html: string;
  css: string;
  summary: string;
  elementsFound: string[];
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stages, setStages] = useState<ProcessingStage[]>(INITIAL_STAGES);
  const [result, setResult] = useState<VisualResult | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>('gemini-flash');

  const updateStage = useCallback((
    stageId: string, 
    updates: Partial<ProcessingStage>
  ) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  }, []);

  const startStage = useCallback((stageId: string) => {
    updateStage(stageId, { status: 'active', startTime: Date.now() });
  }, [updateStage]);

  const completeStage = useCallback((stageId: string, startTime: number) => {
    updateStage(stageId, { 
      status: 'complete', 
      duration: Date.now() - startTime 
    });
  }, [updateStage]);

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
    setParsedDoc(null);
    setStages(INITIAL_STAGES);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setParsedDoc(null);
    setStages(INITIAL_STAGES);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep('template');
    setSelectedTemplate(null);
    setSelectedFile(null);
    setResult(null);
    setParsedDoc(null);
    setStages(INITIAL_STAGES);
  }, []);

  const processDocument = async () => {
    if (!selectedFile || !selectedTemplate) return;

    setIsProcessing(true);
    setCurrentStep('processing');
    setResult(null);
    setStages(INITIAL_STAGES);

    try {
      // Stage 1: Upload
      const uploadStart = Date.now();
      startStage('upload');
      await new Promise(resolve => setTimeout(resolve, 300));
      completeStage('upload', uploadStart);

      // Stage 2: Extraction
      const extractionStart = Date.now();
      startStage('extraction');
      
      const parsed = await parseDocument(selectedFile);
      setParsedDoc(parsed);
      
      if (parsed.wordCount > 50000) {
        toast.warning("O documento excede 50.000 palavras. Apenas as primeiras 50.000 serão processadas.");
      }
      
      completeStage('extraction', extractionStart);
      toast.success(`Texto extraído: ${parsed.wordCount.toLocaleString()} palavras`);

      // Stage 3: AI Analysis
      const analysisStart = Date.now();
      startStage('analysis');

      // Fetch template CSS
      const templateResponse = await fetch(selectedTemplate.previewUrl);
      const templateHtml = await templateResponse.text();
      
      // Extract CSS from template
      const cssMatch = templateHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const templateCss = cssMatch ? cssMatch[1] : '';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: parsed.text,
            fileName: parsed.fileName,
            fileType: parsed.fileType,
            wordCount: parsed.wordCount,
            fileSize: parsed.fileSize,
            model: selectedModel,
            templateId: selectedTemplate.id,
            templateCss: templateCss,
            templateColors: selectedTemplate.colorScheme,
            mode: 'visual',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na análise: ${response.status}`);
      }

      const analysisResult = await response.json();
      completeStage('analysis', analysisStart);
      
      const modelLabel = MODEL_OPTIONS.find(m => m.value === selectedModel)?.label || selectedModel;
      toast.success(`Análise concluída com ${modelLabel}`);

      // Stage 4: Formatting
      const formattingStart = Date.now();
      startStage('formatting');
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setResult({
        html: analysisResult.html,
        css: analysisResult.css,
        summary: analysisResult.summary,
        elementsFound: analysisResult.elementsFound || [],
      });
      completeStage('formatting', formattingStart);

      setCurrentStep('result');
      toast.success("Documento visual gerado com sucesso!");

    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(errorMessage);
      
      setStages(prev => prev.map(stage => 
        stage.status === 'active' ? { ...stage, status: 'error' } : stage
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const totalTime = stages.reduce((acc, stage) => acc + (stage.duration || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center shadow-glow">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">
                  DocLex Visual
                </h1>
                <p className="text-xs text-muted-foreground">
                  Transforme Documentos em Visual Law
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="hidden md:flex items-center gap-2">
              {['template', 'upload', 'processing', 'result'].map((step, idx) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep === step
                        ? 'gradient-gold text-primary-foreground shadow-glow'
                        : idx < ['template', 'upload', 'processing', 'result'].indexOf(currentStep)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < 3 && (
                    <div className={`w-8 h-0.5 ${
                      idx < ['template', 'upload', 'processing', 'result'].indexOf(currentStep)
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {currentStep !== 'template' && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Recomeçar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          {currentStep === 'template' && (
            <div className="text-center mb-10 animate-fade-in">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                Transforme Documentos em{" "}
                <span className="text-gradient-gold">Visual Law</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Selecione um modelo visual, faça upload do seu documento e nossa IA irá 
                gerar um documento estilizado com gráficos, timelines, infográficos e mais.
              </p>
            </div>
          )}

          {/* Step 1: Template Selection */}
          {currentStep === 'template' && (
            <div className="animate-slide-up">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelect={handleTemplateSelect}
              />

              {selectedTemplate && (
                <div className="mt-8 flex justify-center animate-scale-in">
                  <Button
                    size="lg"
                    onClick={() => setCurrentStep('upload')}
                    className="gradient-gold text-primary-foreground font-semibold px-8 py-6 text-lg shadow-glow hover:shadow-elevated transition-all duration-300"
                  >
                    Continuar com {selectedTemplate.name}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload */}
          {currentStep === 'upload' && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Upload do Documento
                </h2>
                <p className="text-muted-foreground">
                  Modelo selecionado: <span className="text-primary font-medium">{selectedTemplate?.name}</span>
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                  selectedFile={selectedFile}
                  onClear={handleClear}
                />

                {selectedFile && !isProcessing && (
                  <div className="mt-8 space-y-4 animate-scale-in">
                    <div className="flex items-center justify-center gap-3">
                      <Brain className="w-5 h-5 text-primary" />
                      <Select
                        value={selectedModel}
                        onValueChange={(value: ModelOption) => setSelectedModel(value)}
                      >
                        <SelectTrigger className="w-[200px] bg-card border-border">
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('template')}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <Button
                        size="lg"
                        onClick={processDocument}
                        className="gradient-gold text-primary-foreground font-semibold px-8 shadow-glow hover:shadow-elevated transition-all duration-300"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Gerar Documento Visual
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Processando Documento
                </h2>
                <p className="text-muted-foreground">
                  A IA está analisando e gerando o documento visual...
                </p>
              </div>

              <StageTimer stages={stages} isProcessing={isProcessing} />

              {parsedDoc && (
                <div className="mt-8 animate-fade-in">
                  <div className="bg-card border border-border rounded-xl p-4 max-w-lg mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="font-medium text-foreground">Informações do Documento</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Palavras</p>
                        <p className="font-semibold text-foreground">
                          {parsedDoc.wordCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Páginas</p>
                        <p className="font-semibold text-foreground">{parsedDoc.pageCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Result */}
          {currentStep === 'result' && result && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Documento Visual Gerado
                </h2>
                <p className="text-muted-foreground">
                  Tempo total: <span className="text-primary font-medium">{(totalTime / 1000).toFixed(2)}s</span>
                </p>
              </div>

              {/* Summary and Elements Found */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="font-serif font-semibold text-foreground mb-2">Resumo</h4>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="font-serif font-semibold text-foreground mb-2">Elementos Identificados</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.elementsFound.map((el, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <HtmlPreview html={result.html} css={result.css} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            POC - Visual Law com IA
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Suporta até 100 páginas ou 50.000 palavras
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
