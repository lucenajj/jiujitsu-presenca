import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInMonths } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Configuração para aulas mínimas por faixa
export const BELT_PROGRESSION = {
  white: { months: 12, minClasses: 120 },
  blue: { months: 18, minClasses: 180 },
  purple: { months: 24, minClasses: 240 },
  brown: { months: 30, minClasses: 300 },
  black: { months: 0, minClasses: 0 } // Faixa preta não tem progressão automática
};

// Tipos de faixa em ordem de progressão
export const BELT_ORDER: Array<keyof typeof BELT_PROGRESSION> = ['white', 'blue', 'purple', 'brown', 'black'];

/**
 * Calcula o progresso para a próxima graduação considerando tempo e aulas
 * @param belt A faixa atual do aluno
 * @param classesAttended Número de aulas assistidas
 * @param lastPromotionDate Data da última promoção
 * @returns Percentual de progresso e valores restantes
 */
export function calculateBeltProgress(
  belt: string, 
  classesAttended: number = 0, 
  lastPromotionDate?: string | null,
  registrationDate?: string
): {
  percent: number;
  classesRemaining: number;
  timeRemaining: number;
} {
  // Requisitos baseados na faixa atual
  const beltKey = belt as keyof typeof BELT_PROGRESSION;
  const requirements = BELT_PROGRESSION[beltKey];
  
  if (beltKey === 'black') {
    return { percent: 100, classesRemaining: 0, timeRemaining: 0 };
  }
  
  // Tempo desde a última promoção em meses (ainda mantido para o cálculo de timeRemaining)
  const lastPromotion = lastPromotionDate 
    ? new Date(lastPromotionDate) 
    : registrationDate 
      ? new Date(registrationDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Fallback para 30 dias atrás
  
  const currentDate = new Date();
  
  // Evitar cálculos negativos com datas futuras
  const monthsSincePromotion = lastPromotion > currentDate 
    ? 0 
    : differenceInMonths(currentDate, lastPromotion);
  
  // Calcular progresso baseado APENAS na quantidade de aulas
  const classesPercent = (classesAttended / requirements.minClasses) * 100;
  
  // Arredondar para duas casas decimais para maior precisão
  const progressPercent = Math.min(classesPercent, 100);
  
  // Cálculo do que resta
  const classesRemaining = Math.max(0, requirements.minClasses - classesAttended);
  const timeRemaining = Math.max(0, requirements.months - monthsSincePromotion);
  
  return {
    // Arredondamos para um número inteiro no final para exibição na interface
    percent: Math.round(progressPercent),
    classesRemaining,
    timeRemaining
  };
}

/**
 * Calcula o número de aulas necessárias para a próxima faixa
 * @param currentBelt A faixa atual do aluno
 * @returns Número de aulas necessárias ou null se for faixa preta
 */
export function getClassesRequiredForNextBelt(currentBelt: string): number | null {
  const beltKey = currentBelt as keyof typeof BELT_PROGRESSION;
  
  if (beltKey === 'black') {
    return null; // Faixa preta não tem progressão automática
  }
  
  return BELT_PROGRESSION[beltKey].minClasses;
}

/**
 * Calcula o próximo nível de faixa com base na faixa atual
 * @param currentBelt A faixa atual do aluno
 * @returns A próxima faixa ou null se for faixa preta
 */
export function getNextBelt(currentBelt: string): string | null {
  const currentIndex = BELT_ORDER.indexOf(currentBelt as keyof typeof BELT_PROGRESSION);
  
  if (currentIndex === -1 || currentIndex === BELT_ORDER.length - 1) {
    return null; // Faixa preta ou faixa inválida
  }
  
  return BELT_ORDER[currentIndex + 1];
}

/**
 * Calcula o progresso percentual para a próxima faixa
 * @param currentBelt A faixa atual do aluno
 * @param classesAttended Número de aulas assistidas na faixa atual
 * @returns Percentual de progresso (0-100)
 */
export function getBeltProgressPercentage(currentBelt: string, classesAttended: number): number {
  const requiredClasses = getClassesRequiredForNextBelt(currentBelt);
  
  if (requiredClasses === null) {
    return 100; // Faixa preta sempre 100%
  }
  
  const percentage = Math.min(Math.round((classesAttended / requiredClasses) * 100), 100);
  return percentage;
}

/**
 * Verifica se o aluno está pronto para promoção de faixa
 * @param currentBelt A faixa atual do aluno
 * @param classesAttended Número de aulas assistidas na faixa atual
 * @returns true se estiver pronto para promoção, false caso contrário
 */
export function isReadyForPromotion(currentBelt: string, classesAttended: number): boolean {
  const requiredClasses = getClassesRequiredForNextBelt(currentBelt);
  
  if (requiredClasses === null) {
    return false; // Faixa preta não tem promoção automática
  }
  
  return classesAttended >= requiredClasses;
}

/**
 * Calcula o número total de semanas com base nos meses
 * @param months Número de meses
 * @returns Número aproximado de semanas
 */
export function monthsToWeeks(months: number): number {
  return months * 4.345; // 52 semanas / 12 meses ≈ 4.345
}

/**
 * Calcula o número total de aulas com base nas semanas e aulas por semana
 * @param weeks Número de semanas
 * @param classesPerWeek Número de aulas por semana
 * @returns Número total de aulas
 */
export function weeksToClasses(weeks: number, classesPerWeek: number): number {
  return Math.floor(weeks * classesPerWeek);
}
