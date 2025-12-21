import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { ProcessingStage } from "@/types/document";
import { cn } from "@/lib/utils";

interface StageTimerProps {
  stages: ProcessingStage[];
  isProcessing: boolean;
}

const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(1);
  return `${minutes}m ${remainingSeconds}s`;
};

export const StageTimer = ({ stages, isProcessing }: StageTimerProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 50);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const getStageIcon = (stage: ProcessingStage) => {
    switch (stage.status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'active':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'error':
        return <Circle className="w-4 h-4 text-destructive" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStageDuration = (stage: ProcessingStage): string => {
    if (stage.duration !== undefined) {
      return formatTime(stage.duration);
    }
    if (stage.status === 'active' && stage.startTime) {
      return formatTime(currentTime - stage.startTime);
    }
    return '--';
  };

  const totalDuration = stages.reduce((acc, stage) => {
    if (stage.duration) return acc + stage.duration;
    if (stage.status === 'active' && stage.startTime) {
      return acc + (currentTime - stage.startTime);
    }
    return acc;
  }, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          Cronômetro de Processamento
        </h3>
        <div className="timer-display text-primary font-bold text-lg">
          {formatTime(totalDuration)}
        </div>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg transition-all duration-300",
              stage.status === 'active' && "bg-primary/10 border border-primary/20",
              stage.status === 'complete' && "bg-success/5 border border-success/10",
              stage.status === 'pending' && "bg-muted/50",
              stage.status === 'error' && "bg-destructive/10 border border-destructive/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background text-xs font-bold text-muted-foreground">
                {index + 1}
              </div>
              {getStageIcon(stage)}
              <span className={cn(
                "text-sm font-medium",
                stage.status === 'active' && "text-primary",
                stage.status === 'complete' && "text-success",
                stage.status === 'pending' && "text-muted-foreground"
              )}>
                {stage.name}
              </span>
            </div>
            <span className={cn(
              "timer-display",
              stage.status === 'active' && "text-primary",
              stage.status === 'complete' && "text-success",
              stage.status === 'pending' && "text-muted-foreground"
            )}>
              {getStageDuration(stage)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
