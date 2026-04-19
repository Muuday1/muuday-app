import json, os

OUT = "docs/product/design-system/figma-export"
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, "frames"), exist_ok=True)

def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

tokens = {
  "collections": [
    {
      "name": "Colors",
      "mode": "Default",
      "variables": [
        {"name": "primary/50", "type": "color", "value": "#f0fdf4"},
        {"name": "primary/100", "type": "color", "value": "#dcfce7"},
        {"name": "primary/200", "type": "color", "value": "#bbf7d0"},
        {"name": "primary/300", "type": "color", "value": "#86efac"},
        {"name": "primary/400", "type": "color", "value": "#4ade80"},
        {"name": "primary/500", "type": "color", "value": "#22c55e"},
        {"name": "primary/600", "type": "color", "value": "#16a34a"},
        {"name": "primary/700", "type": "color", "value": "#15803d"},
        {"name": "primary/800", "type": "color", "value": "#166534"},
        {"name": "primary/900", "type": "color", "value": "#14532d"},
        {"name": "primary/950", "type": "color", "value": "#052e16"},
        {"name": "neutral/50", "type": "color", "value": "#fafaf9"},
        {"name": "neutral/100", "type": "color", "value": "#f5f5f4"},
        {"name": "neutral/200", "type": "color", "value": "#e7e5e4"},
        {"name": "neutral/300", "type": "color", "value": "#d6d3d1"},
        {"name": "neutral/400", "type": "color", "value": "#a8a29e"},
        {"name": "neutral/500", "type": "color", "value": "#78716c"},
        {"name": "neutral/600", "type": "color", "value": "#57534e"},
        {"name": "neutral/700", "type": "color", "value": "#44403c"},
        {"name": "neutral/800", "type": "color", "value": "#292524"},
        {"name": "neutral/900", "type": "color", "value": "#1c1917"},
        {"name": "neutral/950", "type": "color", "value": "#0c0a09"},
        {"name": "success/50", "type": "color", "value": "#f0fdf4"},
        {"name": "success/100", "type": "color", "value": "#dcfce7"},
        {"name": "success/200", "type": "color", "value": "#bbf7d0"},
        {"name": "success/300", "type": "color", "value": "#86efac"},
        {"name": "success/400", "type": "color", "value": "#4ade80"},
        {"name": "success/500", "type": "color", "value": "#22c55e"},
        {"name": "success/600", "type": "color", "value": "#16a34a"},
        {"name": "success/700", "type": "color", "value": "#15803d"},
        {"name": "success/800", "type": "color", "value": "#166534"},
        {"name": "success/900", "type": "color", "value": "#14532d"},
        {"name": "success/950", "type": "color", "value": "#052e16"},
        {"name": "warning/50", "type": "color", "value": "#fffbeb"},
        {"name": "warning/100", "type": "color", "value": "#fef3c7"},
        {"name": "warning/200", "type": "color", "value": "#fde68a"},
        {"name": "warning/300", "type": "color", "value": "#fcd34d"},
        {"name": "warning/400", "type": "color", "value": "#fbbf24"},
        {"name": "warning/500", "type": "color", "value": "#f59e0b"},
        {"name": "warning/600", "type": "color", "value": "#d97706"},
        {"name": "warning/700", "type": "color", "value": "#b45309"},
        {"name": "warning/800", "type": "color", "value": "#92400e"},
        {"name": "warning/900", "type": "color", "value": "#78350f"},
        {"name": "warning/950", "type": "color", "value": "#451a03"},
        {"name": "error/50", "type": "color", "value": "#fef2f2"},
        {"name": "error/100", "type": "color", "value": "#fee2e2"},
        {"name": "error/200", "type": "color", "value": "#fecaca"},
        {"name": "error/300", "type": "color", "value": "#fca5a5"},
        {"name": "error/400", "type": "color", "value": "#f87171"},
        {"name": "error/500", "type": "color", "value": "#ef4444"},
        {"name": "error/600", "type": "color", "value": "#dc2626"},
        {"name": "error/700", "type": "color", "value": "#b91c1c"},
        {"name": "error/800", "type": "color", "value": "#991b1b"},
        {"name": "error/900", "type": "color", "value": "#7f1d1d"},
        {"name": "error/950", "type": "color", "value": "#450a0a"},
        {"name": "info/50", "type": "color", "value": "#eff6ff"},
        {"name": "info/100", "type": "color", "value": "#dbeafe"},
        {"name": "info/200", "type": "color", "value": "#bfdbfe"},
        {"name": "info/300", "type": "color", "value": "#93c5fd"},
        {"name": "info/400", "type": "color", "value": "#60a5fa"},
        {"name": "info/500", "type": "color", "value": "#3b82f6"},
        {"name": "info/600", "type": "color", "value": "#2563eb"},
        {"name": "info/700", "type": "color", "value": "#1d4ed8"},
        {"name": "info/800", "type": "color", "value": "#1e40af"},
        {"name": "info/900", "type": "color", "value": "#1e3a8a"},
        {"name": "info/950", "type": "color", "value": "#172554"},
        {"name": "brand/bright", "type": "color", "value": "#9FE870"},
        {"name": "brand/bright-dark", "type": "color", "value": "#163300"},
        {"name": "surface/page", "type": "color", "value": "#f4f8f5"},
        {"name": "surface/page-alt", "type": "color", "value": "#fafaf9"},
        {"name": "surface/card", "type": "color", "value": "#ffffff"},
        {"name": "surface/card-elevated", "type": "color", "value": "#ffffff"},
        {"name": "surface/overlay", "type": "color", "value": "rgba(28, 25, 23, 0.5)"},
        {"name": "surface/inverse", "type": "color", "value": "#1c1917"},
        {"name": "surface/input", "type": "color", "value": "#ffffff"},
        {"name": "surface/input-disabled", "type": "color", "value": "#f5f5f4"},
        {"name": "text/primary", "type": "color", "value": "#1c1917"},
        {"name": "text/secondary", "type": "color", "value": "#57534e"},
        {"name": "text/tertiary", "type": "color", "value": "#78716c"},
        {"name": "text/disabled", "type": "color", "value": "#a8a29e"},
        {"name": "text/inverse", "type": "color", "value": "#ffffff"},
        {"name": "text/inverse-secondary", "type": "color", "value": "rgba(255, 255, 255, 0.8)"},
        {"name": "text/link", "type": "color", "value": "#16a34a"},
        {"name": "text/link-hover", "type": "color", "value": "#15803d"},
        {"name": "text/error", "type": "color", "value": "#dc2626"},
        {"name": "text/success", "type": "color", "value": "#16a34a"},
        {"name": "text/warning", "type": "color", "value": "#d97706"},
        {"name": "border/default", "type": "color", "value": "#e7e5e4"},
        {"name": "border/hover", "type": "color", "value": "#d6d3d1"},
        {"name": "border/focus", "type": "color", "value": "#22c55e"},
        {"name": "border/error", "type": "color", "value": "#ef4444"},
        {"name": "border/success", "type": "color", "value": "#22c55e"},
        {"name": "border/subtle", "type": "color", "value": "#f5f5f4"},
        {"name": "border/inverse", "type": "color", "value": "rgba(255, 255, 255, 0.2)"}
      ]
    },
    {
      "name": "Typography",
      "mode": "Default",
      "variables": [
        {"name": "family/body", "type": "string", "value": "Inter"},
        {"name": "family/display", "type": "string", "value": "Space Grotesk"},
        {"name": "family/mono", "type": "string", "value": "JetBrains Mono"},
        {"name": "size/xs", "type": "string", "value": "10px"},
        {"name": "size/sm", "type": "string", "value": "13px"},
        {"name": "size/base", "type": "string", "value": "16px"},
        {"name": "size/lg", "type": "string", "value": "20px"},
        {"name": "size/xl", "type": "string", "value": "24px"},
        {"name": "size/2xl", "type": "string", "value": "30px"},
        {"name": "size/3xl", "type": "string", "value": "38px"},
        {"name": "size/4xl", "type": "string", "value": "48px"},
        {"name": "size/5xl", "type": "string", "value": "61px"},
        {"name": "weight/normal", "type": "string", "value": "400"},
        {"name": "weight/medium", "type": "string", "value": "500"},
        {"name": "weight/semibold", "type": "string", "value": "600"},
        {"name": "weight/bold", "type": "string", "value": "700"},
        {"name": "leading/tight", "type": "string", "value": "1.1"},
        {"name": "leading/normal", "type": "string", "value": "1.5"},
        {"name": "leading/relaxed", "type": "string", "value": "1.65"},
        {"name": "tracking/tight", "type": "string", "value": "-0.03em"},
        {"name": "tracking/normal", "type": "string", "value": "0em"},
        {"name": "tracking/wide", "type": "string", "value": "0.05em"}
      ]
    },
    {
      "name": "Spacing",
      "mode": "Default",
      "variables": [
        {"name": "0", "type": "string", "value": "0px"},
        {"name": "1", "type": "string", "value": "4px"},
        {"name": "2", "type": "string", "value": "8px"},
        {"name": "3", "type": "string", "value": "12px"},
        {"name": "4", "type": "string", "value": "16px"},
        {"name": "5", "type": "string", "value": "20px"},
        {"name": "6", "type": "string", "value": "24px"},
        {"name": "8", "type": "string", "value": "32px"},
        {"name": "10", "type": "string", "value": "40px"},
        {"name": "12", "type": "string", "value": "48px"},
        {"name": "16", "type": "string", "value": "64px"},
        {"name": "20", "type": "string", "value": "80px"},
        {"name": "24", "type": "string", "value": "96px"},
        {"name": "32", "type": "string", "value": "128px"},
        {"name": "40", "type": "string", "value": "160px"},
        {"name": "48", "type": "string", "value": "192px"},
        {"name": "64", "type": "string", "value": "256px"},
        {"name": "80", "type": "string", "value": "320px"},
        {"name": "96", "type": "string", "value": "384px"},
        {"name": "xs", "type": "string", "value": "4px"},
        {"name": "sm", "type": "string", "value": "8px"},
        {"name": "md", "type": "string", "value": "16px"},
        {"name": "lg", "type": "string", "value": "24px"},
        {"name": "xl", "type": "string", "value": "32px"},
        {"name": "2xl", "type": "string", "value": "48px"},
        {"name": "3xl", "type": "string", "value": "64px"},
        {"name": "4xl", "type": "string", "value": "80px"},
        {"name": "5xl", "type": "string", "value": "96px"}
      ]
    },
    {
      "name": "Radius",
      "mode": "Default",
      "variables": [
        {"name": "none", "type": "string", "value": "0px"},
        {"name": "sm", "type": "string", "value": "6px"},
        {"name": "md", "type": "string", "value": "8px"},
        {"name": "lg", "type": "string", "value": "12px"},
        {"name": "xl", "type": "string", "value": "16px"},
        {"name": "2xl", "type": "string", "value": "24px"},
        {"name": "full", "type": "string", "value": "9999px"}
      ]
    },
    {
      "name": "Shadows",
      "mode": "Default",
      "variables": [
        {"name": "none", "type": "string", "value": "none"},
        {"name": "sm", "type": "string", "value": "0 1px 2px 0 rgba(28, 25, 23, 0.05)"},
        {"name": "md", "type": "string", "value": "0 4px 6px -1px rgba(28, 25, 23, 0.08), 0 2px 4px -2px rgba(28, 25, 23, 0.04)"},
        {"name": "lg", "type": "string", "value": "0 10px 15px -3px rgba(28, 25, 23, 0.1), 0 4px 6px -4px rgba(28, 25, 23, 0.05)"},
        {"name": "xl", "type": "string", "value": "0 20px 25px -5px rgba(28, 25, 23, 0.12), 0 8px 10px -6px rgba(28, 25, 23, 0.04)"},
        {"name": "inner", "type": "string", "value": "inset 0 2px 4px 0 rgba(28, 25, 23, 0.04)"},
        {"name": "focus", "type": "string", "value": "0 0 0 3px rgba(34, 197, 94, 0.15)"}
      ]
    },
    {
      "name": "Animation",
      "mode": "Default",
      "variables": [
        {"name": "duration/instant", "type": "string", "value": "0ms"},
        {"name": "duration/fast", "type": "string", "value": "150ms"},
        {"name": "duration/normal", "type": "string", "value": "250ms"},
        {"name": "duration/slow", "type": "string", "value": "350ms"},
        {"name": "duration/slower", "type": "string", "value": "500ms"},
        {"name": "ease/out", "type": "string", "value": "cubic-bezier(0, 0, 0.2, 1)"},
        {"name": "ease/in", "type": "string", "value": "cubic-bezier(0.4, 0, 1, 1)"},
        {"name": "ease/in-out", "type": "string", "value": "cubic-bezier(0.4, 0, 0.2, 1)"},
        {"name": "ease/spring", "type": "string", "value": "cubic-bezier(0.34, 1.56, 0.64, 1)"},
        {"name": "ease/bounce", "type": "string", "value": "cubic-bezier(0.68, -0.55, 0.265, 1.55)"}
      ]
    },
    {
      "name": "Breakpoints",
      "mode": "Default",
      "variables": [
        {"name": "xs", "type": "string", "value": "0px"},
        {"name": "sm", "type": "string", "value": "480px"},
        {"name": "md", "type": "string", "value": "640px"},
        {"name": "lg", "type": "string", "value": "768px"},
        {"name": "xl", "type": "string", "value": "1024px"},
        {"name": "2xl", "type": "string", "value": "1280px"},
        {"name": "3xl", "type": "string", "value": "1536px"}
      ]
    },
    {
      "name": "Z-Index",
      "mode": "Default",
      "variables": [
        {"name": "base", "type": "number", "value": 0},
        {"name": "dropdown", "type": "number", "value": 100},
        {"name": "sticky", "type": "number", "value": 200},
        {"name": "drawer", "type": "number", "value": 300},
        {"name": "popover", "type": "number", "value": 400},
        {"name": "overlay", "type": "number", "value": 500},
        {"name": "modal", "type": "number", "value": 600},
        {"name": "toast", "type": "number", "value": 700},
        {"name": "tooltip", "type": "number", "value": 800},
        {"name": "max", "type": "number", "value": 9999}
      ]
    },
    {
      "name": "Opacity",
      "mode": "Default",
      "variables": [
        {"name": "0", "type": "string", "value": "0%"},
        {"name": "25", "type": "string", "value": "25%"},
        {"name": "50", "type": "string", "value": "50%"},
        {"name": "60", "type": "string", "value": "60%"},
        {"name": "75", "type": "string", "value": "75%"},
        {"name": "80", "type": "string", "value": "80%"},
        {"name": "90", "type": "string", "value": "90%"},
        {"name": "100", "type": "string", "value": "100%"}
      ]
    }
  ]
}

write_json(os.path.join(OUT, "tokens.json"), tokens)

components_data = [
  {"name":"Button","figma_name":"Button","category":"Primitives","variants":{"variant":["primary","secondary","ghost","danger"],"size":["sm","md","lg"],"state":["default","hover","active","focus","disabled","loading"],"icon":["none","left","right","only"]},"auto_layout":{"direction":"horizontal","padding":{"top":10,"bottom":10,"left":16,"right":16},"gap":8},"tokens":{"primary-bg":"primary-500","primary-text":"primary-900","secondary-bg":"neutral-0","secondary-border":"neutral-200","ghost-text":"neutral-700","danger-bg":"error-500","danger-text":"neutral-0","radius":"radius-md","font-size-sm":"font-size-sm","font-size-md":"font-size-base","font-weight":"font-weight-semibold","space-icon":"space-2","padding-sm":"space-3","padding-md":"space-4","padding-lg":"space-5"}},
  {"name":"Input","figma_name":"Input","category":"Primitives","variants":{"type":["text","password","number","email"],"size":["sm","md"],"state":["default","focus","error","disabled"],"icon":["none","prefix","suffix"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":12,"right":12},"gap":0},"tokens":{"bg":"neutral-0","border-default":"neutral-200","border-focus":"primary-500","border-error":"error-500","text":"neutral-900","placeholder":"neutral-400","disabled-bg":"neutral-50","radius":"radius-md","font-size-sm":"font-size-sm","font-size-md":"font-size-base","space-padding":"space-3"}},
  {"name":"Select","figma_name":"Select","category":"Primitives","variants":{"size":["sm","md"],"state":["default","focus","error","disabled"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":12,"right":12},"gap":0},"tokens":{"bg":"neutral-0","border-default":"neutral-200","border-focus":"primary-500","border-error":"error-500","text":"neutral-900","placeholder":"neutral-400","chevron":"neutral-500","radius":"radius-md","font-size-sm":"font-size-sm","font-size-md":"font-size-base","space-padding":"space-3"}},
  {"name":"Textarea","figma_name":"Textarea","category":"Primitives","variants":{"size":["sm","md"],"state":["default","focus","error","disabled"],"counter":["hidden","visible"]},"auto_layout":{"direction":"vertical","padding":{"top":12,"bottom":12,"left":12,"right":12},"gap":0},"tokens":{"bg":"neutral-0","border-default":"neutral-200","border-focus":"primary-500","border-error":"error-500","text":"neutral-900","placeholder":"neutral-400","counter":"neutral-500","counter-over":"error-500","radius":"radius-md","font-size-sm":"font-size-sm","font-size-md":"font-size-base","space-padding":"space-3"}},
  {"name":"Checkbox","figma_name":"Checkbox","category":"Primitives","variants":{"state":["default","hover","checked","disabled","error"],"indeterminate":["true","false"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":12},"tokens":{"box-default":"neutral-0","box-border":"neutral-300","box-checked":"primary-500","box-border-checked":"primary-500","checkmark":"primary-900","error-border":"error-500","label":"neutral-900","disabled-label":"neutral-400","radius":"radius-sm","font-size":"font-size-base","space-gap":"space-3"}},
  {"name":"Radio","figma_name":"Radio","category":"Primitives","variants":{"state":["default","hover","checked","disabled","error"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":12},"tokens":{"circle-default":"neutral-0","circle-border":"neutral-300","circle-checked":"primary-500","dot-checked":"primary-900","error-border":"error-500","label":"neutral-900","disabled-label":"neutral-400","radius":"radius-full","font-size":"font-size-base","space-gap":"space-3"}},
  {"name":"Toggle","figma_name":"Toggle","category":"Primitives","variants":{"state":["default","checked","disabled"],"size":["sm","md"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":12},"tokens":{"track-default":"neutral-200","track-checked":"primary-500","thumb":"neutral-0","label":"neutral-900","disabled":"neutral-300","radius":"radius-full","font-size":"font-size-base","space-gap":"space-3"}},
  {"name":"Badge","figma_name":"Badge","category":"Primitives","variants":{"variant":["default","success","warning","error","info","pro"],"size":["sm","md"]},"auto_layout":{"direction":"horizontal","padding":{"top":4,"bottom":4,"left":12,"right":12},"gap":4},"tokens":{"default-bg":"neutral-100","default-text":"neutral-700","success-bg":"success-100","success-text":"success-800","warning-bg":"warning-100","warning-text":"warning-800","error-bg":"error-100","error-text":"error-800","info-bg":"info-100","info-text":"info-800","pro-bg":"primary-500","pro-text":"primary-900","radius":"radius-full","font-size-sm":"font-size-xs","font-size-md":"font-size-sm","font-weight":"font-weight-semibold"}},
  {"name":"Avatar","figma_name":"Avatar","category":"Primitives","variants":{"size":["xs","sm","md","lg","xl"],"shape":["circle","rounded"],"fallback":["initials","generic"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"fallback-bg":"primary-100","fallback-text":"primary-800","generic-bg":"neutral-200","generic-icon":"neutral-500","radius-circle":"radius-full","radius-rounded":"radius-md","font-size-xs":"font-size-xs","font-size-sm":"font-size-xs","font-size-md":"font-size-sm","font-size-lg":"font-size-base","font-size-xl":"font-size-lg","font-weight":"font-weight-semibold"}},
  {"name":"Icon","figma_name":"Icon","category":"Primitives","variants":{"size":["16","20","24","32"],"stroke":["default","emphasis"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"color":"neutral-700","color-muted":"neutral-500","color-primary":"primary-700","color-danger":"error-500","stroke-default":"1.5px","stroke-emphasis":"2px"}},
  {"name":"Card","figma_name":"Card","category":"Composites","variants":{"variant":["default","hover","active","selected"]},"auto_layout":{"direction":"vertical","padding":{"top":24,"bottom":24,"left":24,"right":24},"gap":16},"tokens":{"bg":"neutral-0","border":"neutral-200","hover-border":"neutral-300","active-bg":"neutral-50","selected-border":"primary-500","selected-bg":"primary-50","radius":"radius-lg","space-padding":"space-6","space-gap":"space-4"}},
  {"name":"Modal","figma_name":"Modal","category":"Composites","variants":{"size":["sm","md","lg","full"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"overlay":"rgba(26, 23, 20, 0.5)","panel-bg":"neutral-0","border":"neutral-200","header-text":"neutral-900","body-text":"neutral-700","radius-panel":"radius-xl","radius-full":"0px","space-header":"space-6","space-body-x":"space-4","space-body-y":"space-5"}},
  {"name":"Drawer","figma_name":"Drawer","category":"Composites","variants":{"position":["right","bottom"],"size":["sm","md","lg"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"overlay":"rgba(26, 23, 20, 0.5)","panel-bg":"neutral-0","border":"neutral-200","radius-bottom":"radius-xl","radius-right":"0px","space-header":"space-6","space-body":"space-4"}},
  {"name":"Toast","figma_name":"Toast","category":"Composites","variants":{"variant":["success","warning","error","info"],"position":["top-right","bottom-right","bottom-center"]},"auto_layout":{"direction":"horizontal","padding":{"top":16,"bottom":16,"left":16,"right":16},"gap":12},"tokens":{"success-bg":"#F0FDF4","success-border":"#86EFAC","success-icon":"success-500","warning-bg":"#FFFBEB","warning-border":"#FCD34D","warning-icon":"warning-500","error-bg":"#FEF2F2","error-border":"#FECACA","error-icon":"error-500","info-bg":"#EFF6FF","info-border":"#BFDBFE","info-icon":"info-500","text":"neutral-800","close":"neutral-500","radius":"radius-lg","font-size":"font-size-sm","space-padding":"space-4","space-gap":"space-3"}},
  {"name":"Tooltip","figma_name":"Tooltip","category":"Composites","variants":{"arrow":["true","false"]},"auto_layout":{"direction":"horizontal","padding":{"top":8,"bottom":8,"left":12,"right":12},"gap":0},"tokens":{"bg":"neutral-800","text":"neutral-0","radius":"radius-md","font-size":"font-size-sm","font-weight":"font-weight-medium","space-v":"space-2","space-h":"space-3"}},
  {"name":"Dropdown Menu","figma_name":"DropdownMenu","category":"Composites","variants":{},"auto_layout":{"direction":"vertical","padding":{"top":8,"bottom":8,"left":0,"right":0},"gap":0},"tokens":{"menu-bg":"neutral-0","menu-border":"neutral-200","item-hover":"neutral-50","item-active":"primary-50","item-text":"neutral-900","item-muted":"neutral-500","divider":"neutral-200","radius":"radius-lg","font-size":"font-size-sm","space-menu":"space-1","space-item-v":"space-2","space-item-h":"space-3"}},
  {"name":"Tabs","figma_name":"Tabs","category":"Composites","variants":{"variant":["default","underline","pill"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"default-text":"neutral-500","default-active-text":"neutral-900","default-active-border":"neutral-900","underline-text":"neutral-500","underline-active-text":"primary-700","underline-active-line":"primary-500","pill-text":"neutral-700","pill-bg":"neutral-100","pill-active-text":"neutral-900","radius-pill":"radius-md","font-size":"font-size-sm","font-weight":"font-weight-semibold","space-h":"space-3","space-v":"space-2"}},
  {"name":"Accordion","figma_name":"Accordion","category":"Composites","variants":{"type":["single","multi"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"item-bg":"neutral-0","item-border":"neutral-200","trigger-text":"neutral-900","content-text":"neutral-700","icon":"neutral-500","font-size-trigger":"font-size-base","font-size-content":"font-size-sm","font-weight":"font-weight-semibold","space-trigger":"space-4","space-content":"space-3"}},
  {"name":"Stepper","figma_name":"Stepper","category":"Composites","variants":{"orientation":["horizontal","vertical"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"pending-circle":"neutral-200","pending-text":"neutral-500","active-circle":"primary-500","active-text":"neutral-900","completed-circle":"primary-500","completed-icon":"primary-900","error-circle":"error-500","error-text":"error-500","connector-pending":"neutral-200","connector-completed":"primary-500","radius":"radius-full","font-size":"font-size-sm","font-weight":"font-weight-medium","space-gap":"space-2"}},
  {"name":"Table","figma_name":"Table","category":"Composites","variants":{"density":["default","compact"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"bg":"neutral-0","header-bg":"neutral-50","header-text":"neutral-600","row-text":"neutral-900","border":"neutral-200","hover-row":"neutral-50","selected-row":"primary-50","sort-active":"neutral-900","radius":"radius-md","font-size-header":"font-size-xs","font-size-row":"font-size-sm","font-weight-header":"font-weight-semibold","space-default":"space-4","space-compact":"space-3"}},
  {"name":"Shell","figma_name":"Shell","category":"Layout","variants":{},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"bg":"neutral-0","max-width":"1280px","padding-mobile":"space-4","padding-tablet":"space-6","padding-desktop":"space-8"}},
  {"name":"Header","figma_name":"Header","category":"Layout","variants":{"context":["public","app"]},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":24,"right":24},"gap":0},"tokens":{"bg":"neutral-0","border":"neutral-200","logo":"primary-700","nav-text":"neutral-700","nav-active":"neutral-900","font-size":"font-size-sm","font-weight":"font-weight-medium","space-gap":"space-4","space-padding":"space-6"}},
  {"name":"Footer","figma_name":"Footer","category":"Layout","variants":{},"auto_layout":{"direction":"vertical","padding":{"top":48,"bottom":48,"left":0,"right":0},"gap":0},"tokens":{"bg":"neutral-50","border":"neutral-200","text":"neutral-600","link":"neutral-700","link-hover":"neutral-900","font-size":"font-size-sm","space-v":"space-8","space-gap":"space-6"}},
  {"name":"Sidebar","figma_name":"Sidebar","category":"Layout","variants":{"state":["expanded","collapsed"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"bg":"neutral-0","border":"neutral-200","item-text":"neutral-700","item-hover":"neutral-50","item-active":"primary-50","item-active-text":"primary-800","icon":"neutral-500","icon-active":"primary-700","radius":"radius-md","font-size":"font-size-sm","font-weight":"font-weight-medium","space-item":"space-3","space-icon":"space-2"}},
  {"name":"Grid","figma_name":"Grid","category":"Layout","variants":{},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":16},"tokens":{"gap-sm":"space-3","gap-md":"space-4","gap-lg":"space-6"}},
  {"name":"Section","figma_name":"Section","category":"Layout","variants":{"background":["default","muted","primary"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"bg-default":"neutral-0","bg-muted":"neutral-50","bg-primary":"primary-500","primary-text":"primary-900","padding-y-mobile":"space-8","padding-y-tablet":"space-10","padding-y-desktop":"space-12","padding-x":"space-4 to space-8"}},
  {"name":"Empty State","figma_name":"EmptyState","category":"Patterns","variants":{},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":16},"tokens":{"icon":"neutral-300","title":"neutral-900","description":"neutral-500","font-size-title":"font-size-xl","font-size-description":"font-size-base","font-weight-title":"font-weight-semibold","space-gap":"space-4","space-padding":"space-6"}},
  {"name":"Loading Skeleton","figma_name":"Skeleton","category":"Patterns","variants":{"shape":["text","avatar","card","list"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"bg":"neutral-100","shimmer":"neutral-200","radius-text":"radius-sm","radius-card":"radius-lg","radius-avatar":"radius-full"}},
  {"name":"Error Boundary","figma_name":"ErrorBoundary","category":"Patterns","variants":{},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"icon":"error-500","title":"neutral-900","description":"neutral-600","code-bg":"neutral-100","font-size-title":"font-size-xl","font-size-description":"font-size-base","font-size-code":"font-size-xs","space-gap":"space-4","space-padding":"space-6"}},
  {"name":"Confirmation Dialog","figma_name":"ConfirmationDialog","category":"Patterns","variants":{},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"icon-bg":"error-50","icon":"error-500","title":"neutral-900","description":"neutral-600","confirm-bg":"error-500","confirm-text":"neutral-0","cancel-bg":"neutral-0","cancel-border":"neutral-200","radius":"radius-xl","font-size-title":"font-size-xl","font-size-description":"font-size-base","space-padding":"space-6","space-gap":"space-4"}},
  {"name":"Search Bar","figma_name":"SearchBar","category":"Patterns","variants":{},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":16,"right":16},"gap":0},"tokens":{"bg":"neutral-0","border":"neutral-200","border-focus":"primary-500","icon":"neutral-400","text":"neutral-900","placeholder":"neutral-400","clear":"neutral-500","radius":"radius-lg","font-size":"font-size-base","space-h":"space-4","space-icon":"space-3"}},
  {"name":"Filter Chip","figma_name":"FilterChip","category":"Patterns","variants":{"state":["inactive","active"]},"auto_layout":{"direction":"horizontal","padding":{"top":6,"bottom":6,"left":12,"right":12},"gap":6},"tokens":{"inactive-bg":"neutral-0","inactive-border":"neutral-200","inactive-text":"neutral-700","active-bg":"primary-500","active-text":"primary-900","active-icon":"primary-900","radius":"radius-md","font-size":"font-size-sm","font-weight":"font-weight-medium"}},
  {"name":"Pagination","figma_name":"Pagination","category":"Patterns","variants":{},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":4},"tokens":{"bg-default":"neutral-0","bg-hover":"neutral-50","bg-active":"primary-500","text":"neutral-700","text-active":"primary-900","border":"neutral-200","disabled":"neutral-400","radius":"radius-md","font-size":"font-size-sm","font-weight":"font-weight-medium","space-h":"space-2","space-min":"space-3"}},
  {"name":"Breadcrumb","figma_name":"Breadcrumb","category":"Patterns","variants":{},"auto_layout":{"direction":"horizontal","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":4},"tokens":{"link":"neutral-600","link-hover":"neutral-900","current":"neutral-900","separator":"neutral-400","font-size":"font-size-sm","font-weight":"font-weight-medium"}},
  {"name":"Progress Bar","figma_name":"ProgressBar","category":"Patterns","variants":{"size":["sm","md","lg"]},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"track":"neutral-200","fill":"primary-500","fill-complete":"success-500","label":"neutral-600","radius":"radius-full","font-size":"font-size-sm","font-weight":"font-weight-semibold"}},
  {"name":"Progress Step","figma_name":"ProgressStep","category":"Patterns","variants":{},"auto_layout":{"direction":"vertical","padding":{"top":0,"bottom":0,"left":0,"right":0},"gap":0},"tokens":{"track":"neutral-200","fill":"primary-500","complete":"success-500","icon":"neutral-0","font-size-label":"font-size-sm"}}
]

write_json(os.path.join(OUT, "components.json"), {"components": components_data})

frame_meta = [
  ("Search Booking","1","Search Results (`/buscar`)","/buscar",1440,900,375,812,"Header, Input, Chip, Card, Avatar, Button","4","P0"),
  ("Search Booking","2","Profile Bio Tab (`/profissional/[id]`)","/profissional/[id]",1440,900,375,812,"Header, Avatar, Tabs, Card, Button","4","P0"),
  ("Search Booking","3","Services Tab (`/profissional/[id]?tab=servicos`)","/profissional/[id]?tab=servicos",1440,900,375,812,"Header, Card, Accordion, Button, Tag","3","P0"),
  ("Search Booking","4","Slot Selection (`/agendar/[id]`)","/agendar/[id]",1440,900,375,812,"Header, Calendar, Button, Chip, Checkbox","4","P0"),
  ("Search Booking","5","Personal Info","/agendar/[id]/dados",1440,900,375,812,"Header, Input, Textarea, Checkbox, Button","3","P0"),
  ("Search Booking","6","Checkout","/agendar/[id]/checkout",1440,900,375,812,"Header, Card, Radio, Input, Button","4","P0"),
  ("Search Booking","7","Payment Processing","/agendar/[id]/processando",1440,900,375,812,"Header, Spinner, Progress, Card","3","P0"),
  ("Search Booking","8","Confirmation","/confirmacao/[id]",1440,900,375,812,"Header, Icon, Card, Button","3","P0"),
  ("Professional Workspace","1.1","Dashboard (`/dashboard`)","/dashboard",1440,900,375,812,"Sidebar, Header, Card, Button, Row","4","P0"),
  ("Professional Workspace","1.2","Services Management (`/dashboard/servicos`)","/dashboard/servicos",1440,900,375,812,"Sidebar, Header, Card, Modal, Button","4","P0"),
  ("Professional Workspace","1.3","Agenda (`/agenda`)","/agenda",1440,900,375,812,"Sidebar, Header, Calendar, Tabs, Panel","5","P0"),
  ("Professional Workspace","1.4","Financial Overview (`/financeiro`)","/financeiro",1440,900,375,812,"Sidebar, Header, Card, Chart, Row","4","P1"),
  ("Profile Edit","1.1","User Edit Profile","/configuracoes/perfil",1440,900,375,812,"Header, Avatar, Input, Textarea, Button","3","P1"),
  ("Profile Edit","2.1","Professional Edit Profile","/dashboard/perfil",1440,900,375,812,"Header, Tabs, Card, Input, Checkbox, Progress","5","P0"),
  ("User Onboarding","1","Signup (`/cadastro`)","/cadastro",1440,900,375,812,"Header, Card, Input, Button","3","P0"),
  ("User Onboarding","2","Profile Basics (`/cadastro/perfil`)","/cadastro/perfil",1440,900,375,812,"Stepper, Card, Input, Select, Button","2","P0"),
  ("User Onboarding","3","Onboarding Complete (`/cadastro/sucesso`)","/cadastro/sucesso",1440,900,375,812,"Icon, Button","2","P0"),
  ("Professional Onboarding","1","Registration (`/registrar-profissional`)","/registrar-profissional",1440,900,375,812,"Header, Card, Input, Select, Textarea, Button","3","P0"),
  ("Professional Onboarding","2","Verification (`/registrar-profissional/verificacao`)","/registrar-profissional/verificacao",1440,900,375,812,"Stepper, Dropzone, Button, Camera","4","P0"),
  ("Professional Onboarding","3","Approval Waiting (`/registrar-profissional/aguardando`)","/registrar-profissional/aguardando",1440,900,375,812,"Icon, Card, Badge, Button","2","P1"),
  ("Professional Onboarding","4","First Booking Enabled (`/profissional/dashboard?welcome=1`)","/profissional/dashboard?welcome=1",1440,900,375,812,"Header, Banner, Card, Button","3","P1"),
  ("Recurring Booking","1.1","Type Selection (`/agendar/[slug]/tipo`)","/agendar/[slug]/tipo",1440,900,375,812,"Header, Card, Button, Banner","3","P1"),
  ("Recurring Booking","1.2","Recurring Config (`/agendar/[slug]/recorrente/configurar`)","/agendar/[slug]/recorrente/configurar",1440,900,375,812,"Header, Select, Radio, Calendar, Button","5","P0"),
  ("Recurring Booking","1.3","Slot Selection (`/agendar/[slug]/recorrente/horarios`)","/agendar/[slug]/recorrente/horarios",1440,900,375,812,"Header, Calendar, Radio, Card, Button","5","P0"),
  ("Recurring Booking","1.4","Success — Package Confirmed (`/confirmacao/pacote/[id]`)","/confirmacao/pacote/[id]",1440,900,375,812,"Header, Icon, Card, Button","3","P0"),
  ("Request Booking","1.1","Profile CTA (`/p/[slug]`)","/p/[slug]",1440,900,375,812,"Header, Cover, Avatar, Card, Button","3","P0"),
  ("Request Booking","1.2","Request Form (`/p/[slug]/solicitar`)","/p/[slug]/solicitar",1440,900,375,812,"Header, Calendar, Radio, Textarea, Button","4","P0"),
  ("Request Booking","2.1","Pro Response Panel (`/profissional/solicitacoes/[id]`)","/profissional/solicitacoes/[id]",1440,900,375,812,"Header, Card, Button, Message","4","P0"),
  ("Request Booking","2.2","Negotiation (`/profissional/solicitacoes/[id]?tab=negociacao`)","/profissional/solicitacoes/[id]?tab=negociacao",1440,900,375,812,"Header, Message, Calendar, Button","4","P0"),
  ("Request Booking","3","Success — Request Confirmed (`/confirmacao/solicitacao/[id]`)","/confirmacao/solicitacao/[id]",1440,900,375,812,"Header, Icon, Card, Button","3","P0"),
  ("Session Lifecycle","1","Pre-join","/sessao/[id]/pre-join",1440,900,375,812,"Header, Video, Button, Icon, Card","4","P0"),
  ("Session Lifecycle","2","In-session","/sessao/[id]",1440,900,375,812,"Header, Video, Chat, Button, Icon","5","P0"),
  ("Session Lifecycle","3","Post-session","/sessao/[id]/pos",1440,900,375,812,"Header, Icon, Card, Star, Button","3","P0"),
  ("Video Session","1","Session Lobby (`/sessao/[id]/lobby`)","/sessao/[id]/lobby",1440,900,375,812,"Header, Video, Button, Icon, List","3","P0"),
  ("Video Session","2","Active Call (`/sessao/[id]`)","/sessao/[id]",1440,900,375,812,"Video, Button, Icon, Toolbar","4","P0"),
  ("Video Session","3","End Screen (`/sessao/[id]/encerramento`)","/sessao/[id]/encerramento",1440,900,375,812,"Icon, Card, Star, Button","3","P0"),
  ("Settings Preferences","1","User Settings (`/configuracoes`)","/configuracoes",1440,900,375,812,"Header, Card, Toggle, Row, Button","3","P1"),
  ("Settings Preferences","2","Professional Settings (`/configuracoes/pro`)","/configuracoes/pro",1440,900,375,812,"Header, Card, Toggle, Progress, Button","4","P1"),
  ("Trust Safety","1","Report Flow (`/reportar`)","/reportar",1440,900,375,812,"Modal, Radio, Textarea, Button","2","P2"),
  ("Trust Safety","2","Dispute Initiation (`/disputa/nova`)","/disputa/nova",1440,900,375,812,"Modal, Select, Textarea, Dropzone, Button","3","P2"),
  ("Trust Safety","3","Resolution (`/disputa/[id]`)","/disputa/[id]",1440,900,375,812,"Header, Card, Badge, Button","2","P2"),
  ("Payments Billing","1","Transaction List (`/pagamentos/transacoes`)","/pagamentos/transacoes",1440,900,375,812,"Header, Input, Select, Table, Pagination","3","P1"),
  ("Payments Billing","2","Payout Dashboard (`/pagamentos/saques`)","/pagamentos/saques",1440,900,375,812,"Header, Card, Button, Radio, Table","3","P1"),
  ("Payments Billing","3","Invoice Detail (`/pagamentos/fatura/[id]`)","/pagamentos/fatura/[id]",1440,900,375,812,"Header, Card, Table, Button","3","P1"),
  ("Admin Operations","1","Admin Dashboard (`/admin`)","/admin",1440,900,375,812,"Header, Card, Badge, Row","3","P1"),
  ("Admin Operations","2","Review Queue (`/admin/fila`)","/admin/fila",1440,900,375,812,"Header, Tabs, Table, Pagination","3","P1"),
  ("Admin Operations","3","Decision Panel (`/admin/fila/[id]`)","/admin/fila/[id]",1440,900,375,812,"Header, Card, Textarea, Button","3","P1"),
]

lines = [
    "# Figma Export — Frame Index",
    "",
    "| Frame Name | Journey | Route | Desktop (w×h) | Mobile (w×h) | Key Components | Complexity | Priority |",
    "|------------|---------|-------|---------------|--------------|----------------|------------|----------|"
]

for journey, fid, name, route, dw, dh, mw, mh, comps, comp, prio in frame_meta:
    lines.append(f"| {name} | {journey} | `{route}` | {dw}×{dh} | {mw}×{mh} | {comps} | {comp} | {prio} |")

lines += [
    "",
    "---",
    "",
    "## Notes",
    "- All frames use an 8px baseline grid. Snap every element to this grid.",
    "- Color styles: Create swatches for all token names in `tokens.json`.",
    "- Text styles: Create \"Display\" and \"Body\" families with sizes sm through 5xl.",
    "- Components: Build reusable components from `components.json` before constructing frames.",
    "- Prototype links: Connect frames within each journey with \"Navigate to\" and Smart Animate where appropriate.",
    "- Use auto-layout for all cards, lists, and sidebars to ensure responsive behavior.",
]

with open(os.path.join(OUT, "frames", "README.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

if __name__ == "__main__":
    pass
