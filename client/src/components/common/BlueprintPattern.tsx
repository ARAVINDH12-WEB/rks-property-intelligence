import React from 'react';

interface BlueprintPatternProps {
  opacity?: number;
  color?: 'teal' | 'navy' | 'gold';
  className?: string;
}

export const BlueprintPattern: React.FC<BlueprintPatternProps> = ({
  opacity = 0.08,
  color = 'teal',
  className = ''
}) => {
  const colorMap = {
    teal: '%230F766E',
    navy: '%230A1128',
    gold: '%23D4AF37',
  };
  const c = colorMap[color];
  const svgPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='none'/%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40h40M40 0v40' stroke='${c}' stroke-width='0.8' stroke-opacity='${opacity * 10}'/%3E%3Cpath d='M20 0v40M0 20h40' stroke='${c}' stroke-width='0.3' stroke-opacity='${opacity * 5}'/%3E%3C/svg%3E")`;
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ backgroundImage: svgPattern, backgroundSize: '40px 40px' }}
      aria-hidden="true"
    />
  );
};
