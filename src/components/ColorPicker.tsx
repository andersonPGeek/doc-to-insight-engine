import { useState, useEffect } from "react";
import { Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ColorScheme {
  primary: string;
  accent: string;
  background: string;
}

interface ColorPickerProps {
  colorScheme: ColorScheme;
  onChange: (colors: ColorScheme) => void;
}

const PRESET_COLORS = [
  '#132238', '#2c3e50', '#1a365d', '#0f3057', '#2c5282',
  '#4527a0', '#7c43bd', '#5a67d8', '#3182ce', '#2b6cb0',
  '#591313', '#7b341e', '#744210', '#276749', '#285e61',
  '#16a085', '#27ae60', '#e67e22', '#f5b041', '#3498db',
];

export const ColorPicker = ({ colorScheme, onChange }: ColorPickerProps) => {
  const [colors, setColors] = useState<ColorScheme>(colorScheme);

  useEffect(() => {
    setColors(colorScheme);
  }, [colorScheme]);

  const handleColorChange = (key: keyof ColorScheme, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    onChange(newColors);
  };

  const ColorField = ({ 
    label, 
    colorKey, 
    value 
  }: { 
    label: string; 
    colorKey: keyof ColorScheme; 
    value: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-9"
          >
            <div
              className="w-5 h-5 rounded border border-border shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="text-xs font-mono uppercase">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => handleColorChange(colorKey, e.target.value)}
                className="w-12 h-8 p-0 border-0 cursor-pointer"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => handleColorChange(colorKey, e.target.value)}
                className="flex-1 font-mono text-xs uppercase"
                placeholder="#000000"
              />
            </div>
            <div className="grid grid-cols-5 gap-1">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleColorChange(colorKey, preset)}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    value === preset ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <h4 className="font-serif font-semibold text-sm text-foreground">Personalizar Cores</h4>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ColorField 
          label="Cor Primária" 
          colorKey="primary" 
          value={colors.primary} 
        />
        <ColorField 
          label="Cor de Destaque" 
          colorKey="accent" 
          value={colors.accent} 
        />
        <ColorField 
          label="Fundo" 
          colorKey="background" 
          value={colors.background} 
        />
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 rounded-lg border border-border" style={{ backgroundColor: colors.background }}>
        <div className="h-6 rounded mb-2" style={{ backgroundColor: colors.primary }} />
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.accent }} />
          <div className="flex-1 h-3 rounded bg-muted/50" />
        </div>
        <div className="mt-2 h-2 w-3/4 rounded bg-muted/30" />
        <div className="mt-1 h-2 w-1/2 rounded bg-muted/30" />
      </div>
    </div>
  );
};
