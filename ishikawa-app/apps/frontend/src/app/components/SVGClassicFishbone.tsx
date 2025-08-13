// filepath: c:\Users\work\project\kla\ishikawa-app\apps\frontend\src\app\components\SVGClassicFishbone.tsx
import React, { JSX } from "react";

interface Bone {
  label: string;
  info?: string;
  metadata?: string;
  children?: Bone[];
  color?: string;
  status?: 'resolved' | 'issue' | 'pending';
}

interface Props {
  width?: number;
  height?: number;
  effectLabel?: string;
  bones: Bone[];
  theme?: 'light' | 'dark';
  onBoneClick?: (bone: Bone, path: string, isExpandClick?: boolean) => void;
  selectedBone?: string;
  expandedBones?: Set<string>;
}

function drawRib(
  x1: number, y1: number,
  angle: number, len: number
): [number, number] {
  const x2 = x1 + Math.cos(angle) * len;
  const y2 = y1 + Math.sin(angle) * len;
  return [x2, y2];
}

function renderBone(
  bone: Bone,
  x: number, y: number,
  angle: number, len: number,
  depth: number,
  path: string,
  theme: string = 'light',
  onBoneClick?: (bone: Bone, path: string, isExpandClick?: boolean) => void,
  selectedBone?: string,
  expandedBones?: Set<string>
): JSX.Element[] {
  const [x2, y2] = drawRib(x, y, angle, len);

  const isSelected = selectedBone === path;

  let fontSize, fontWeight;
  if (depth === 0) {
    fontSize = 16; // Consistent size for main categories like assignment
    fontWeight = '700';
  } else if (depth === 1) {
    fontSize = 14; // Smaller for sub-causes like assignment
    fontWeight = '600';
  } else {
    fontSize = 12; // Even smaller for deep nesting
    fontWeight = '500';
  }

  let labelOffset, labelPosition;
  if (depth === 0) {
    labelOffset = Math.max(20, 15 + bone.label.length * 0.4);
    labelPosition = 'side';
  } else if (depth === 1) {
    labelOffset = Math.max(25, 20 + bone.label.length * 0.5);
    labelPosition = 'side';
  } else {
    labelOffset = 15;
    labelPosition = 'side';
  }

  let labelX, labelY;
  if (labelPosition === 'top') {
    const midX = x + (x2 - x) * 0.5;
    const midY = y + (y2 - y) * 0.5;
    labelX = midX;
    labelY = midY - labelOffset;
  } else {
    labelX = x2 + Math.cos(angle) * labelOffset;
    labelY = y2 + Math.sin(angle) * labelOffset;
  }

  const getStatusColor = (status?: string, depth: number = 0, isDark: boolean = false) => {
    if (status === 'resolved') return {
      primary: '#059669',
      secondary: isDark ? '#064e3b' : '#d1fae5',
      text: isDark ? '#10b981' : '#065f46'
    };
    if (status === 'issue') return {
      primary: '#dc2626',
      secondary: isDark ? '#7f1d1d' : '#fee2e2',
      text: isDark ? '#ef4444' : '#991b1b'
    };
    if (status === 'pending') return {
      primary: '#d97706',
      secondary: isDark ? '#78350f' : '#fef3c7',
      text: isDark ? '#f59e0b' : '#92400e'
    };

    if (isDark) {
      return {
        primary: depth === 0 ? '#e5e7eb' : depth === 1 ? '#d1d5db' : '#9ca3af',
        secondary: '#374151',
        text: depth === 0 ? '#f9fafb' : depth === 1 ? '#e5e7eb' : '#d1d5db'
      };
    } else {
      return {
        primary: depth === 0 ? '#1f2937' : depth === 1 ? '#4b5563' : '#6b7280',
        secondary: '#f9fafb',
        text: depth === 0 ? '#1f2937' : depth === 1 ? '#374151' : '#4b5563'
      };
    }
  };

  const statusColors = getStatusColor(bone.status, depth, theme === 'dark');

  const strokeWidth = depth === 0 ? 4 : depth === 1 ? 3 : 2.5;
  const strokeColor = isSelected ? '#2563eb' : statusColors.primary;

  const textColor = isSelected ? '#2563eb' : statusColors.text;

  const textPadding = depth === 0 ? 20 : 12;
  const estimatedTextWidth = bone.label.length * (fontSize * 0.7);
  const boxWidth = Math.max(estimatedTextWidth + textPadding * 2, depth === 0 ? 140 : 100);
  const boxHeight = fontSize + textPadding;

  let children: JSX.Element[] = [
    <line
      key={`bone-${path}`}
      x1={x}
      y1={y}
      x2={x2}
      y2={y2}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      style={{ cursor: onBoneClick ? 'pointer' : 'default' }}
      onClick={() => onBoneClick?.(bone, path)}
    />,
    <circle
      key={`connection-${path}`}
      cx={x}
      cy={y}
      r={depth === 0 ? 6 : 4}
      fill={strokeColor}
      style={{ cursor: onBoneClick ? 'pointer' : 'default' }}
      onClick={() => onBoneClick?.(bone, path)}
    />
  ];

  if (depth === 0) {
    children.push(
      <rect
        key={`category-box-${path}`}
        x={labelX - boxWidth/2}
        y={labelY - boxHeight/2}
        width={boxWidth}
        height={boxHeight}
        fill={isSelected ? '#dbeafe' : '#f8fafc'}
        stroke={isSelected ? '#2563eb' : '#374151'}
        strokeWidth={2}
        rx={4}
        ry={4}
        style={{
          cursor: onBoneClick ? 'pointer' : 'default',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
        }}
        onClick={() => onBoneClick?.(bone, path)}
      />
    );
  }

  if (depth >= 2 && bone.status && bone.status !== 'pending') {
    const indicatorColor = bone.status === 'resolved' ? '#10b981' : '#ef4444';
    children.push(
      <circle
        key={`status-${path}`}
        cx={labelX + estimatedTextWidth/2 + 8}
        cy={labelY}
        r={4}
        fill={indicatorColor}
        stroke="white"
        strokeWidth={1}
        style={{ opacity: 0.9 }}
      />
    );
  }

  children.push(
    <text
      key={`label-${path}`}
      x={labelX}
      y={labelY}
      fontSize={fontSize}
      fontWeight={fontWeight}
      fill={textColor}
      textAnchor={labelPosition === 'top' ? 'middle' : 'middle'}
      dominantBaseline={labelPosition === 'top' ? 'bottom' : 'middle'}
      style={{
        cursor: onBoneClick ? 'pointer' : 'default',
        userSelect: 'none',
        fontFamily: 'Arial, sans-serif',
        textShadow: labelPosition === 'top' ? '0 0 3px white, 1px 1px 2px rgba(0,0,0,0.5)' : 'none',
        letterSpacing: depth === 0 ? '0.5px' : 'normal'
      }}
      onClick={() => onBoneClick?.(bone, path)}
    >
      {bone.label}
    </text>
  );

  if (bone.children && bone.children.length > 0 && depth <= 1) {
    const numChildren = bone.children.length;
    const isExpanded = expandedBones?.has(path) || false;

    let maxVisibleChildren = isExpanded ? numChildren : Math.min(numChildren, 4);
    const visibleChildren = bone.children.slice(0, maxVisibleChildren);
    const hiddenCount = numChildren - maxVisibleChildren;

    visibleChildren.forEach((child, idx) => {
      const positionRatio = 0.2 + (idx * 0.6) / Math.max(1, visibleChildren.length - 1);
      const mainX = x + (x2 - x) * positionRatio;
      const mainY = y + (y2 - y) * positionRatio;

      const isMainUp = angle < 0;
      const alternateUp = idx % 2 === 0;
      const subBoneIsUp = isMainUp ? alternateUp : !alternateUp;

      const horizontalLength = 70;
      const subBoneEndX = mainX + (subBoneIsUp ? horizontalLength : -horizontalLength);
      const subBoneEndY = mainY;

      children.push(
        <line
          key={`subcause-line-${path}-${idx}`}
          x1={mainX}
          y1={mainY}
          x2={subBoneEndX}
          y2={subBoneEndY}
          stroke={strokeColor}
          strokeWidth={3}
          opacity={1}
          strokeLinecap="round"
        />
      );

      children.push(
        <text
          key={`subcause-text-${path}-${idx}`}
          x={subBoneEndX + (subBoneIsUp ? 10 : -10)}
          y={subBoneEndY}
          fontSize={14}
          fontWeight="600"
          fill={textColor}
          textAnchor={subBoneIsUp ? "start" : "end"}
          dominantBaseline="middle"
          style={{
            cursor: onBoneClick ? 'pointer' : 'default',
            userSelect: 'none',
            fontFamily: 'Arial, sans-serif'
          }}
          onClick={() => onBoneClick?.(child, `${path}-${idx}`)}
        >
          {child.label}
        </text>
      );

      if (child.children && child.children.length > 0) {
        const subChildPath = `${path}-${idx}`;
        const isSubExpanded = expandedBones?.has(subChildPath) || false;

        const maxVisibleSubChildren = isSubExpanded ? child.children.length : Math.min(child.children.length, 3);
        const visibleSubChildren = child.children.slice(0, maxVisibleSubChildren);
        const hiddenSubCount = child.children.length - maxVisibleSubChildren;

        visibleSubChildren.forEach((subChild, subIdx) => {
          const subOffsetY = (subIdx - (visibleSubChildren.length - 1) / 2) * 25;
          const subOffsetX = subBoneIsUp ? 20 : -20;

          const subTextX = subBoneEndX + subOffsetX;
          const subTextY = subBoneEndY + subOffsetY;

          children.push(
            <line
              key={`sub-subcause-line-${path}-${idx}-${subIdx}`}
              x1={subBoneEndX}
              y1={subBoneEndY}
              x2={subTextX - (subBoneIsUp ? 3 : -3)}
              y2={subTextY}
              stroke={strokeColor}
              strokeWidth={2}
              opacity={0.8}
            />
          );

          children.push(
            <text
              key={`sub-subcause-text-${path}-${idx}-${subIdx}`}
              x={subTextX}
              y={subTextY}
              fontSize={11}
              fontWeight="500"
              fill={textColor}
              textAnchor={subBoneIsUp ? "start" : "end"}
              dominantBaseline="middle"
              style={{
                cursor: onBoneClick ? 'pointer' : 'default',
                userSelect: 'none',
                fontFamily: 'Arial, sans-serif',
                opacity: 0.9
              }}
              onClick={() => onBoneClick?.(subChild, `${path}-${idx}-${subIdx}`)}
            >
              {subChild.label}
            </text>
          );
        });

        if (hiddenSubCount > 0) {
          const moreX = subBoneEndX + (subBoneIsUp ? 20 : -20);
          const moreY = subBoneEndY + (visibleSubChildren.length * 12) + 15;

          children.push(
            <circle
              key={`more-sub-indicator-${path}-${idx}`}
              cx={moreX}
              cy={moreY}
              r={10}
              fill={isSubExpanded ? "#ef4444" : "#10b981"}
              stroke="white"
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
              onClick={() => onBoneClick?.(child, subChildPath, true)}
            />,
            <text
              key={`more-sub-text-${path}-${idx}`}
              x={moreX}
              y={moreY + 1}
              fontSize={9}
              fontWeight="bold"
              fill="white"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onBoneClick?.(child, subChildPath, true)}
            >
              {isSubExpanded ? "−" : `+${hiddenSubCount}`}
            </text>
          );
        }
      }
    });

    if (hiddenCount > 0) {
      const indicatorX = x2 + Math.cos(angle) * 30;
      const indicatorY = y2 + Math.sin(angle) * 30;

      children.push(
        <circle
          key={`more-indicator-bg-${path}`}
          cx={indicatorX}
          cy={indicatorY}
          r={12}
          fill="white"
          stroke="#e5e7eb"
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
          onClick={() => onBoneClick?.(bone, path, true)}
        />,
        <circle
          key={`more-indicator-${path}`}
          cx={indicatorX}
          cy={indicatorY}
          r={10}
          fill={isExpanded ? "#ef4444" : "#3b82f6"}
          stroke="white"
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
          onClick={() => onBoneClick?.(bone, path, true)}
        />,
        <text
          key={`more-text-${path}`}
          x={indicatorX}
          y={indicatorY + 1}
          fontSize={11}
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => onBoneClick?.(bone, path, true)}
        >
          {isExpanded ? "−" : `+${hiddenCount}`}
        </text>
      );
    }
  }  return children;
}export default function SVGClassicFishbone({
  width = 1000,
  height = 600,
  effectLabel = "Effect",
  bones,
  theme = 'light',
  onBoneClick,
  selectedBone,
  expandedBones
}: Props) {
  const x0 = 80, y0 = height / 2;
  const x1 = width - 200;
  const y1 = y0;

  const bgColor = theme === 'dark' ? '#111827' : '#ffffff';
  const spineColor = theme === 'dark' ? '#e5e7eb' : '#1e40af';

  return (
    <svg
      width="100%"
      height="100%"
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, ${theme === 'dark' ? '#1f2937' : '#f9fafb'} 100%)`,
        borderRadius: 12,
        border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: `${width}px`,
        maxHeight: `${height}px`
      }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="24"
          markerHeight="16"
          refX="22"
          refY="8"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 24 8, 0 16"
            fill={spineColor}
            stroke={spineColor}
            strokeWidth="1"
            strokeLinejoin="round"
            style={{ opacity: 1 }}
          />
        </marker>

        <filter id="spineDropShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.25"/>
        </filter>

        <filter id="circleDropShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="4" dy="4" stdDeviation="6" floodOpacity="0.2"/>
        </filter>

        <radialGradient id="effectGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>

      <line
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={spineColor}
        strokeWidth={10}
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
        style={{
          filter: "url(#spineDropShadow)",
          opacity: 1
        }}
      />

      <line
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={theme === 'dark' ? '#4b5563' : '#9ca3af'}
        strokeWidth={12}
        strokeLinecap="round"
        style={{
          opacity: 0.3
        }}
      />

      {bones.map((bone, i) => {
        const isUp = i % 2 === 0;
        const angle = isUp ? -Math.PI / 4 : Math.PI / 4;

        const L = Math.min(200, Math.max(160, width * 0.18));

        const spineLength = x1 - x0;
        const totalBones = bones.length;

        let sx;
        if (totalBones === 1) {
          sx = x0 + spineLength * 0.5;
        } else if (totalBones === 2) {
          sx = x0 + spineLength * (i === 0 ? 0.3 : 0.7);
        } else if (totalBones === 3) {
          const positions = [0.25, 0.5, 0.75];
          sx = x0 + spineLength * positions[i];
        } else if (totalBones <= 5) {
          const padding = spineLength * 0.15;
          const usableLength = spineLength * 0.7;
          const spacing = usableLength / Math.max(1, totalBones - 1);
          sx = x0 + padding + (spacing * i);
        } else {
          const padding = spineLength * 0.1;
          const usableLength = spineLength * 0.8;
          const spacing = usableLength / Math.max(1, totalBones - 1);
          sx = x0 + padding + (spacing * i);
        }

        const sy = y0;

        const path = `bone-${i}`;
        return renderBone(bone, sx, sy, angle, L, 0, path, theme, onBoneClick, selectedBone, expandedBones);
      })}

      <circle
        cx={x1 + 90}
        cy={y1}
        r={55}
        fill="url(#effectGradient)"
        stroke="#d97706"
        strokeWidth={4}
        style={{
          filter: "url(#circleDropShadow)"
        }}
      />

      <text
        x={x1 + 90}
        y={y1}
        fontSize={16}
        fontWeight="700"
        fill="#92400e"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          userSelect: 'none',
          letterSpacing: '0.03em',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        {effectLabel}
      </text>
    </svg>
  );
}