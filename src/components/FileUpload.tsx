import { useCallback, useState } from "react";
import { Upload, FileText, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  selectedFile: File | null;
  onClear: () => void;
}

export const FileUpload = ({ 
  onFileSelect, 
  isProcessing, 
  selectedFile, 
  onClear 
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && isValidFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return validTypes.includes(file.type);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return <FileText className="w-12 h-12 text-destructive" />;
    }
    return <File className="w-12 h-12 text-accent" />;
  };

  if (selectedFile) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getFileIcon(selectedFile.type)}
            <div>
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <label
      className={cn(
        "upload-zone flex flex-col items-center justify-center gap-4",
        isDragging && "upload-zone-active",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
        isDragging ? "bg-primary/20" : "bg-muted"
      )}>
        <Upload className={cn(
          "w-8 h-8 transition-colors duration-300",
          isDragging ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
      
      <div className="text-center">
        <p className="font-medium text-foreground mb-1">
          Arraste seu documento aqui
        </p>
        <p className="text-sm text-muted-foreground">
          ou <span className="text-primary cursor-pointer hover:underline">clique para selecionar</span>
        </p>
      </div>
      
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
          <FileText className="w-4 h-4 text-destructive" />
          <span className="text-xs text-muted-foreground">PDF</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
          <File className="w-4 h-4 text-accent" />
          <span className="text-xs text-muted-foreground">DOCX</span>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Máximo: 100 páginas ou 50.000 palavras
      </p>
    </label>
  );
};
