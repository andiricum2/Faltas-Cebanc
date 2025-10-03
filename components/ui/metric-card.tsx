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
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    barGradient: 'from-blue-500 to-blue-600',
    ringColor: 'ring-blue-400'
  },
  green: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    barGradient: 'from-green-500 to-green-600',
    ringColor: 'ring-green-400'
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    barGradient: 'from-amber-500 to-amber-600',
    ringColor: 'ring-amber-400'
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    barGradient: 'from-purple-500 to-purple-600',
    ringColor: 'ring-purple-400'
  },
  red: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    barGradient: 'from-red-500 to-red-600',
    ringColor: 'ring-red-400'
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
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
