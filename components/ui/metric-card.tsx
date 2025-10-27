import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  /** Título de la métrica */
  title: string;
  /** Valor principal a mostrar */
  value: string | number | ReactNode;
  /** Icono a mostrar */
  icon: LucideIcon;
  /** Color del tema (afecta icono y barra) */
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  /** Contenido adicional debajo del valor */
  children?: ReactNode;
  /** Barra de progreso (0-100) */
  progressBar?: number;
  /** Escala máxima para la barra de progreso (por defecto 20%) */
  progressMax?: number;
  /** ID único para hover states */
  hoverId?: string;
  /** Callback para hover start */
  onHoverStart?: () => void;
  /** Callback para hover end */
  onHoverEnd?: () => void;
  /** Estado de hover activo */
  isHovered?: boolean;
  /** Altura fija de la card */
  height?: string;
  /** Contenido personalizado para el lado derecho */
  rightContent?: ReactNode;
}

const colorClasses = {
  blue: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    barGradient: 'from-primary to-primary',
    ringColor: 'ring-primary/40'
  },
  green: {
    iconBg: 'bg-chart-1/10',
    iconColor: 'text-chart-1',
    barGradient: 'from-chart-1 to-chart-1',
    ringColor: 'ring-chart-1/40'
  },
  amber: {
    iconBg: 'bg-chart-4/10',
    iconColor: 'text-chart-4',
    barGradient: 'from-chart-4 to-chart-4',
    ringColor: 'ring-chart-4/40'
  },
  purple: {
    iconBg: 'bg-chart-2/10',
    iconColor: 'text-chart-2',
    barGradient: 'from-chart-2 to-chart-2',
    ringColor: 'ring-chart-2/40'
  },
  red: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    barGradient: 'from-destructive to-destructive',
    ringColor: 'ring-destructive/40'
  }
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  children,
  progressBar,
  progressMax = 20,
  hoverId,
  onHoverStart,
  onHoverEnd,
  isHovered = false,
  height = 'h-32',
  rightContent
}: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      whileHover={hoverId ? { scale: 1.02 } : undefined}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      className="relative overflow-hidden"
    >
      <Card className={`${height} transition-all duration-300 ${isHovered ? `shadow-lg ring-2 ${colors.ringColor}` : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className={`text-3xl font-bold ${colors.iconColor} mt-1`}>
                {value}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {rightContent}
              <div className={`p-3 ${colors.iconBg} rounded-full`}>
                <Icon className={`w-6 h-6 ${colors.iconColor}`} />
              </div>
            </div>
          </div>

          {progressBar !== undefined && (
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, (progressBar / progressMax) * 100))}%` }}
                  transition={{ duration: 1, delay: 1 }}
                  className={`h-2 rounded-full bg-gradient-to-r ${colors.barGradient}`}
                />
              </div>
            </div>
          )}

          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Componente simplificado para métricas básicas (como StatCard)
export function SimpleMetricCard({
  label,
  value,
  hint,
  color = 'blue'
}: {
  label: string;
  value: string | number | ReactNode;
  hint?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}) {
  const colors = colorClasses[color];

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${colors.iconColor}`}>{value}</p>
        {hint && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </Card>
  );
}
