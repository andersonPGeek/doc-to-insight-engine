import { useState, useCallback } from "react";
import { Scale, FileSearch, Sparkles, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { StageTimer } from "@/components/StageTimer";
import { JsonViewer } from "@/components/JsonViewer";
import { parseDocument, ParsedDocument } from "@/lib/documentParser";
import { ProcessingStage, ProcessingResult } from "@/types/document";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModelOption = 'gemini-flash' | 'gemini-pro' | 'gpt-5' | 'gpt-5-mini';

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
  { id: 'formatting', name: 'Formatação do JSON', status: 'pending' },
];

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stages, setStages] = useState<ProcessingStage[]>(INITIAL_STAGES);
  const [result, setResult] = useState<ProcessingResult | null>(null);
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

  const processDocument = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setResult(null);
    setStages(INITIAL_STAGES);

    try {
      // Stage 1: Upload
      const uploadStart = Date.now();
      startStage('upload');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate upload delay
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
      
      // Small delay to simulate formatting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setResult(analysisResult);
      completeStage('formatting', formattingStart);

      toast.success("Documento processado com sucesso!");

    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(errorMessage);
      
      // Mark current active stage as error
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center shadow-glow">
              <Scale className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground">
                DocLex AI
              </h1>
              <p className="text-xs text-muted-foreground">
                Análise Inteligente de Documentos Jurídicos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10 animate-fade-in">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Extraia Informações de{" "}
              <span className="text-gradient-gold">Documentos Jurídicos</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Faça upload de petições, contratos ou sentenças e nossa IA irá 
              identificar partes, citações legais, sugestões de melhoria e muito mais.
            </p>
          </div>

          {/* Upload Section */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <FileUpload
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
              selectedFile={selectedFile}
              onClear={handleClear}
            />
          </div>

          {/* Model Selection & Process Button */}
          {selectedFile && !isProcessing && !result && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-scale-in">
              <div className="flex items-center gap-3">
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
              
              <Button
                size="lg"
                onClick={processDocument}
                className="gradient-gold text-primary-foreground font-semibold px-8 py-6 text-lg shadow-glow hover:shadow-elevated transition-all duration-300"
              >
                <Zap className="w-5 h-5 mr-2" />
                Processar Documento
              </Button>
            </div>
          )}

          {/* Timer Section */}
          {(isProcessing || stages.some(s => s.duration)) && (
            <div className="mb-8 animate-slide-up">
              <StageTimer stages={stages} isProcessing={isProcessing} />
            </div>
          )}

          {/* Document Info */}
          {parsedDoc && !isProcessing && (
            <div className="mb-8 animate-fade-in">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Informações Extraídas</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                  <div>
                    <p className="text-muted-foreground">Tamanho</p>
                    <p className="font-semibold text-foreground">{parsedDoc.fileSize}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tempo Total</p>
                    <p className="font-semibold text-primary">
                      {(totalTime / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="animate-slide-up">
              <JsonViewer data={result} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            POC - Análise de Documentos Jurídicos com IA
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
