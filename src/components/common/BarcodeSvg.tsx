import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 42,
  displayValue = true,
  fontSize = 11,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      // Use CODE128 as reliable standard if the value might have variable length
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        textMargin: 2,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
        font: 'JetBrains Mono, monospace',
      });
    } catch {
      // If specific format like EAN13 fails due to digit check, fallback to CODE128
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            margin: 2,
            background: '#ffffff',
            lineColor: '#000000',
            font: 'JetBrains Mono, monospace',
          });
        }
      } catch {
        // Safe fail
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className={`max-w-full overflow-hidden ${className}`} />;
};
