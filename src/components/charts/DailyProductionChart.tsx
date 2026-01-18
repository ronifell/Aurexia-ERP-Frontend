'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface DailyProductionChartProps {
  data: any[];
}

const DailyProductionChart: React.FC<DailyProductionChartProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const darkBackground = 'rgba(0, 0, 0, 0.2)';
    
    const changeWhiteBackgrounds = () => {
      if (!containerRef.current) return;
      
      // Get all rectangles AND path elements that might have backgrounds
      const allRects = containerRef.current.querySelectorAll('rect, path, g');
      allRects.forEach((rect) => {
        // Skip if already processed (has our data attribute)
        if (rect.getAttribute('data-processed') === 'true') {
          const currentFill = rect.getAttribute('fill') || '';
          // Re-check in case it was changed back
          if (currentFill && currentFill !== darkBackground && 
              !currentFill.includes('url(') && !currentFill.includes('gradient') &&
              (currentFill.includes('#fff') || currentFill.includes('white') || 
               currentFill.includes('rgb(255') || currentFill.includes('rgb(245') ||
               currentFill.includes('rgb(240') || currentFill.includes('rgb(250') ||
               currentFill.includes('rgb(230') || currentFill.includes('rgb(220'))) {
            rect.setAttribute('fill', darkBackground);
            rect.setAttribute('style', `fill: ${darkBackground} !important;`);
          }
          return;
        }
        
        const fill = (rect.getAttribute('fill') || '').toLowerCase();
        const style = (rect.getAttribute('style') || '').toLowerCase();
        
        // Skip gradient fills and actual bar fills (they have gradients)
        // Also skip if it's a path that's part of the actual bars (check if it has a stroke or is small)
        const tagName = rect.tagName.toLowerCase();
        const hasStroke = rect.getAttribute('stroke') || (rect as any).style?.stroke;
        const rectWidth = parseFloat(rect.getAttribute('width') || '0');
        const rectHeight = parseFloat(rect.getAttribute('height') || '0');
        const isSmallPath = tagName === 'path' && !hasStroke && (rectWidth < 20 || rectHeight < 20);
        
        if (fill.includes('url(') || fill.includes('gradient') || fill.includes('#22c55e') || 
            fill.includes('#3b82f6') || fill.includes('#eab308') || fill.includes('#86efac') ||
            fill.includes('#93c5fd') || fill.includes('#fde047') || fill.includes('#4ade80') ||
            fill.includes('#fca5a5') || fill.includes('#ef4444') || isSmallPath) {
          return;
        }
        
        // Check if it's a light color - be very permissive
        const isLight = 
          fill === '#fff' || fill === 'white' || fill === '#ffffff' ||
          fill.includes('#f5f5f5') || fill.includes('#fafafa') || fill.includes('#f0f0f0') ||
          fill.includes('#e5e5e5') || fill.includes('#e0e0e0') || fill.includes('#d3d3d3') ||
          fill.includes('#c0c0c0') || fill.includes('#bebebe') ||
          fill.includes('rgb(255') || fill.includes('rgb(245') ||
          fill.includes('rgb(240') || fill.includes('rgb(250') ||
          fill.includes('rgb(230') || fill.includes('rgb(220') ||
          fill.includes('rgba(255') || fill.includes('rgba(245') ||
          fill.includes('rgba(240') || fill.includes('rgba(250') ||
          fill.includes('rgba(230') || fill.includes('rgba(220') ||
          style.includes('fill: white') || style.includes('fill:#fff') ||
          style.includes('fill: rgb(255') || style.includes('fill:rgb(255') ||
          style.includes('fill: rgb(245') || style.includes('fill:rgb(245') ||
          style.includes('fill: rgb(240') || style.includes('fill:rgb(240') ||
          style.includes('fill: rgb(250') || style.includes('fill:rgb(250');
        
        // Also check computed style - be very aggressive
        const computedStyle = window.getComputedStyle(rect);
        const computedFill = computedStyle.fill || '';
        let isLightComputed = false;
        if (computedFill && !computedFill.includes('url(') && !computedFill.includes('gradient')) {
          const rgbMatch = computedFill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            // Very permissive - anything lighter than medium grey
            if (r > 120 && g > 120 && b > 120) {
              isLightComputed = true;
            }
          } else if (computedFill.includes('#fff') || computedFill.includes('white') || 
                     computedFill.includes('rgb(255') || computedFill.includes('rgb(245') ||
                     computedFill.includes('rgb(240') || computedFill.includes('rgb(250') ||
                     computedFill.includes('rgb(230') || computedFill.includes('rgb(220')) {
            isLightComputed = true;
          }
        }
        
        // Also check if it's a large rectangle (likely category background)
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');
        const isLargeRect = width > 30 && height > 50;
        
        if (isLight || isLightComputed || (isLargeRect && (isLight || fill === ''))) {
          // Option 1: Try to hide it completely
          // If it's a large rectangle (likely the category background), try hiding it
          if (rectWidth > 30 && rectHeight > 50) {
            rect.setAttribute('opacity', '0');
            rect.setAttribute('style', 'opacity: 0 !important; display: none !important;');
            rect.setAttribute('data-processed', 'true');
            rect.setAttribute('data-dark-bg', 'true');
            return; // Skip the rest if we're hiding it
          }
          
          // Option 2: Force the change multiple ways - be extremely aggressive
          rect.setAttribute('fill', darkBackground);
          rect.setAttribute('style', `fill: ${darkBackground} !important; opacity: 1 !important;`);
          rect.setAttribute('data-processed', 'true');
          rect.setAttribute('data-dark-bg', 'true');
          
          if (rect instanceof SVGElement) {
            const svgRect = rect as any;
            svgRect.style.fill = darkBackground;
            svgRect.style.setProperty('fill', darkBackground, 'important');
            svgRect.style.setProperty('opacity', '1', 'important');
            
            // Try multiple methods to ensure it sticks
            try {
              svgRect.setAttributeNS(null, 'fill', darkBackground);
              svgRect.setAttributeNS('http://www.w3.org/1999/xlink', 'fill', darkBackground);
            } catch (e) {
              // Ignore errors
            }
          }
        }
        
        // Also check if it was previously processed but changed back
        if (rect.getAttribute('data-dark-bg') === 'true') {
          const currentFill = rect.getAttribute('fill') || '';
          if (currentFill !== darkBackground && (isLight || isLightComputed)) {
            // Force it back
            rect.setAttribute('fill', darkBackground);
            rect.setAttribute('style', `fill: ${darkBackground} !important; opacity: 1 !important;`);
            if (rect instanceof SVGElement) {
              (rect as any).style.fill = darkBackground;
              (rect as any).style.setProperty('fill', darkBackground, 'important');
            }
          }
        }
      });
    };

    // Run immediately and on any changes
    changeWhiteBackgrounds();
    
    // Use MutationObserver to catch dynamically added elements (like hover backgrounds)
    // Also intercept attribute changes immediately
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'fill' || mutation.attributeName === 'style')) {
          const target = mutation.target as SVGElement;
          if (target.tagName === 'rect') {
            changeWhiteBackgrounds();
          }
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof SVGElement && node.tagName === 'rect') {
              // Immediately process new rectangles
              setTimeout(() => changeWhiteBackgrounds(), 0);
            }
          });
        }
      });
      changeWhiteBackgrounds();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['fill', 'style'],
        attributeOldValue: false
      });
    }

    // Use requestAnimationFrame loop for continuous checking - run multiple times per frame
    let animationFrameId: number;
    const checkLoop = () => {
      changeWhiteBackgrounds();
      // Run multiple times to catch rapid changes
      setTimeout(() => changeWhiteBackgrounds(), 0);
      setTimeout(() => changeWhiteBackgrounds(), 5);
      animationFrameId = requestAnimationFrame(checkLoop);
    };
    animationFrameId = requestAnimationFrame(checkLoop);
    
    // Also listen for mouse events
    const handleMouseMove = () => {
      changeWhiteBackgrounds();
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseenter', handleMouseMove);
      containerRef.current.addEventListener('mouseover', handleMouseMove);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseenter', handleMouseMove);
        containerRef.current.removeEventListener('mouseover', handleMouseMove);
      }
    };
  }, [data]);

  return (
    <div className="chart-container" ref={containerRef}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .chart-container svg rect[fill="#fff"],
          .chart-container svg rect[fill="white"],
          .chart-container svg rect[fill="#ffffff"],
          .chart-container svg rect[fill="#f5f5f5"],
          .chart-container svg rect[fill="#fafafa"],
          .chart-container svg rect[fill="#f0f0f0"],
          .chart-container svg rect[fill="#e5e5e5"],
          .chart-container svg rect[fill="#e0e0e0"],
          .chart-container svg rect[fill="#d3d3d3"],
          .chart-container svg rect[fill="#c0c0c0"],
          .chart-container svg rect[fill="#bebebe"],
          .chart-container svg g rect[fill="#fff"],
          .chart-container svg g rect[fill="white"],
          .chart-container svg g rect[fill="#ffffff"],
          .chart-container svg g rect[fill="#f5f5f5"],
          .chart-container svg g rect[fill="#fafafa"],
          .chart-container svg g rect[fill="#f0f0f0"],
          .chart-container svg g rect[fill="#e5e5e5"],
          .chart-container svg g rect[fill="#e0e0e0"],
          .chart-container svg g rect[fill="#d3d3d3"],
          .chart-container svg g rect[fill="#c0c0c0"],
          .chart-container svg g rect[fill="#bebebe"] {
            fill: rgba(0, 0, 0, 0.2) !important;
          }
        `
      }} />
      <ResponsiveContainer width="100%" height={180}>
      <BarChart 
        data={data} 
        barCategoryGap="30%" 
        barGap={50}
        style={{ background: 'transparent' }}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <defs>
          <linearGradient id="goodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" stopOpacity={1} />
            <stop offset="20%" stopColor="#4ade80" stopOpacity={1} />
            <stop offset="40%" stopColor="#22c55e" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#16a34a" stopOpacity={0.8} />
            <stop offset="80%" stopColor="#15803d" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#14532d" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="scrapGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity={1} />
            <stop offset="20%" stopColor="#f87171" stopOpacity={1} />
            <stop offset="40%" stopColor="#ef4444" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#dc2626" stopOpacity={0.8} />
            <stop offset="80%" stopColor="#b91c1c" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#991b1b" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 11 }} />
        <YAxis stroke="#999" tick={{ fontSize: 11 }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.85)', 
            border: '1px solid #D4AF37', 
            borderRadius: '0.5rem',
            fontSize: '12px',
            color: '#ededed',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
          itemStyle={{ color: '#ededed' }}
          labelStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar 
          dataKey="good" 
          fill="url(#goodGradient)" 
          name="Good" 
          fillOpacity={0.9}
          stroke="#22c55e"
          strokeWidth={2}
          barSize={105}
          radius={[6, 6, 0, 0]}
          activeBar={{ fill: 'url(#goodGradient)', fillOpacity: 1, stroke: '#86efac', strokeWidth: 3 }}
          background={{ fill: 'rgba(0, 0, 0, 0.2)' }}
        >
          <LabelList 
            dataKey="good" 
            position="top" 
            fill="#86efac"
            fontSize={11}
            fontWeight="bold"
            formatter={(value: number) => value > 0 ? value : ''}
          />
        </Bar>
        <Bar 
          dataKey="scrap" 
          fill="url(#scrapGradient)" 
          name="Scrap" 
          fillOpacity={0.9}
          stroke="#ef4444"
          strokeWidth={2}
          barSize={105}
          radius={[6, 6, 0, 0]}
          activeBar={{ fill: 'url(#scrapGradient)', fillOpacity: 1, stroke: '#fca5a5', strokeWidth: 3 }}
          background={{ fill: 'rgba(0, 0, 0, 0.2)' }}
        >
          <LabelList 
            dataKey="scrap" 
            position="top" 
            fill="#fca5a5"
            fontSize={11}
            fontWeight="bold"
            formatter={(value: number) => value > 0 ? value : ''}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
};

export default DailyProductionChart;
