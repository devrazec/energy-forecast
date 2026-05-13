"use client";

import React, { useState, useContext, useMemo, useEffect } from "react";
import { GlobalContext } from "../../context/GlobalContext";
import Layout from "../../components/Layout";
import ReactECharts from "echarts-for-react";
import lisbonData from "../../data/consumption/lisbon.json";

export default function DailyPage() {
  const { 
    darkMode, 
    mobileDevice,
  } = useContext(GlobalContext);

  // Get all available days from lisbonData
  const days = Object.keys(lisbonData.Lisbon).sort();
  const totalMinutes = days.length * 1440; // 7 days × 1440 minutes = 10,080 minutes

  // State for dynamic minute display (across all days)
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentMinute((prev) => {
        if (prev >= totalMinutes - 1) {
          setIsPlaying(false);
          return totalMinutes - 1;
        }
        return prev + 1;
      });
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isPlaying, totalMinutes]);

  // Get current day index and minute within that day
  const getCurrentDayAndTime = (totalMinute) => {
    const dayIndex = Math.floor(totalMinute / 1440);
    const minuteInDay = totalMinute % 1440;
    const hour = Math.floor(minuteInDay / 60);
    const min = minuteInDay % 60;
    const timeKey = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    return {
      dayIndex: Math.min(dayIndex, days.length - 1),
      day: days[Math.min(dayIndex, days.length - 1)],
      minuteInDay,
      timeKey
    };
  };

  // Get table data for current day and time
  const getTableData = () => {
    const { day, timeKey } = getCurrentDayAndTime(currentMinute);
    const priceValue = lisbonData.Lisbon[day][timeKey] || lisbonData.Lisbon[day]["00:00"] || "0";
    const price = parseFloat(priceValue);

    return [{
      day,
      price: price.toFixed(4),
      time: timeKey
    }];
  };

  // Day-specific colors with rgba values for gradients
  const dayColors = [
    { day: "2026-05-10", color: '#0ea5e9', rgba: '14, 165, 233' },      // sky blue
    { day: "2026-05-11", color: '#8b5cf6', rgba: '139, 92, 246' },      // purple
    { day: "2026-05-12", color: '#ec4899', rgba: '236, 72, 153' },      // pink
    { day: "2026-05-13", color: '#f59e0b', rgba: '245, 158, 11' },      // amber
    { day: "2026-05-14", color: '#06b6d4', rgba: '6, 182, 212' },       // cyan
    { day: "2026-05-15", color: '#f97316', rgba: '249, 115, 22' },      // orange
    { day: "2026-05-16", color: '#6366f1', rgba: '99, 102, 241' },      // indigo
  ];

  const getDayColor = (day) => {
    const colorInfo = dayColors.find(d => d.day === day);
    return colorInfo || { color: "#10b981", rgba: '16, 185, 129' }; // default green
  };

  // Helper function to interpolate minute values from hourly data
  const interpolateMinuteValue = (hourData, minute) => {
    const [h, m] = minute.split(':').map(Number);
    const currentHourKey = `${h.toString().padStart(2, '0')}:00`;
    const nextHourKey = `${((h + 1) % 24).toString().padStart(2, '0')}:00`;
    
    const currentValue = parseFloat(hourData[currentHourKey] || 0);
    const nextValue = parseFloat(hourData[nextHourKey] || currentValue);
    
    // Linear interpolation
    const fraction = m / 60;
    return currentValue + (nextValue - currentValue) * fraction;
  };

  // Chart option for progressive line chart (one day at a time)
  const chartOption = useMemo(() => {
    const { day, minuteInDay, timeKey } = getCurrentDayAndTime(currentMinute);
    
    // Generate all minutes for a single day (0-1439)
    const allMinutes = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m++) {
        allMinutes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    
    // Limit to current minute within the day for progressive reveal
    const displayMinutes = allMinutes.slice(0, minuteInDay + 1);
    
    // Get data for current day only
    const hourData = lisbonData.Lisbon[day];
    const data = displayMinutes.map(minute => 
      interpolateMinuteValue(hourData, minute)
    );
    
    const colorInfo = getDayColor(day);
    
    const series = [
      {
        name: day,
        type: 'line',
        data: data,
        smooth: true,
        showSymbol: false,
        symbolSize: 4,
        color: colorInfo.color,
        lineStyle: {
          width: 2.5,
          type: 'solid'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `rgba(${colorInfo.rgba}, 0.2)` },
              { offset: 1, color: `rgba(${colorInfo.rgba}, 0.01)` }
            ]
          }
        },
        connectNulls: true,
        ...(isPlaying ? {} : {
          markPoint: {
            data: [
              {
                type: 'max',
                name: 'Max',
                label: { formatter: (p) => '€' + p.value.toFixed(4) }
              },
              {
                type: 'min',
                name: 'Min',
                label: { formatter: (p) => '€' + p.value.toFixed(4) }
              }
            ],
            symbol: 'pin',
            symbolSize: 50,
            label: { fontSize: 8 }
          }
        })
      }
    ];

    const dayIndex = Math.floor(currentMinute / 1440);
    const timeDisplay = timeKey;

    return {
      backgroundColor: 'transparent',
      title: {
        text: `Lisbon Prices - ${day} (${timeDisplay})`,
        subtext: `Day ${dayIndex + 1} of ${days.length}`,
        left: 'center',
        textStyle: {
          color: darkMode ? '#fff' : '#000',
          fontSize: 18,
          fontWeight: 600
        },
        subtextStyle: {
          color: darkMode ? '#9ca3af' : '#666',
          fontSize: 12
        }
      },
      tooltip: {
        trigger: 'axis',
        position: (pt) => [pt[0], '10%'],
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const param = params[0];
          return `Time: ${param.axisValue}<br/>${param.marker}${param.seriesName}: €${param.value.toFixed(4)}/kWh`;
        },
        backgroundColor: darkMode ? '#1f2937' : '#fff',
        borderColor: darkMode ? '#374151' : '#ccc',
        textStyle: { color: darkMode ? '#d1d5db' : '#333' }
      },
      legend: {
        data: [day],
        orient: 'vertical',
        right: 10,
        top: 'middle',
        textStyle: { color: darkMode ? '#d1d5db' : '#333' }
      },
      grid: {
        left: 60,
        right: 160,
        bottom: 60,
        top: 80,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: displayMinutes,
        boundaryGap: false,
        name: 'Time (HH:MM)',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: { color: darkMode ? '#9ca3af' : '#666' },
        axisLabel: {
          formatter: (value) => {
            // Show every 60th minute (hourly)
            const parts = value.split(':');
            const minute = parseInt(parts[1]);
            return minute === 0 ? value : '';
          },
          color: darkMode ? '#9ca3af' : '#666',
          interval: 59
        },
        axisLine: { lineStyle: { color: darkMode ? '#374151' : '#ccc' } },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'Price (EUR/kWh)',
        nameTextStyle: { color: darkMode ? '#9ca3af' : '#666' },
        boundaryGap: [0, '20%'],
        axisLabel: {
          formatter: (val) => '€' + val.toFixed(2),
          color: darkMode ? '#9ca3af' : '#666'
        },
        splitLine: { lineStyle: { color: darkMode ? '#374151' : '#f0f0f0' } }
      },
      series: series
    };
  }, [currentMinute, darkMode, isPlaying]);

  return (
    <Layout>
      <div
        style={{
          padding: "24px",
          overflowY: "auto",
          height: "100%",
          background: darkMode ? "#111827" : "#f9fafb",
        }}
      >
        {/* Single Card Container */}
        <div
          style={{
            background: darkMode ? "#1f2937" : "#fff",
            border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
            borderRadius: 10,
            padding: "16px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Playback Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
              padding: "12px",
              background: darkMode ? "#111827" : "#f9fafb",
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
              flexWrap: mobileDevice ? "wrap" : "nowrap",
            }}
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                padding: "8px 16px",
                background: isPlaying ? "#ef4444" : "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            
            <button
              onClick={() => {
                setCurrentMinute(0);
                setIsPlaying(false);
              }}
              style={{
                padding: "8px 16px",
                background: darkMode ? "#374151" : "#e5e7eb",
                color: darkMode ? "#d1d5db" : "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              ⏮ Reset
            </button>

            <input
              type="range"
              min="0"
              max={totalMinutes - 1}
              value={currentMinute}
              onChange={(e) => {
                setCurrentMinute(parseInt(e.target.value));
                setIsPlaying(false);
              }}
              style={{
                flex: 1,
                accentColor: "#0ea5e9",
                minWidth: mobileDevice ? "100%" : "200px",
              }}
            />

            <span
              style={{
                color: darkMode ? "#d1d5db" : "#333",
                fontWeight: 600,
                fontSize: "14px",
                minWidth: "120px",
                textAlign: "right",
              }}
            >
              {(() => {
                const { day, timeKey } = getCurrentDayAndTime(currentMinute);
                const dayIndex = Math.floor(currentMinute / 1440);
                return `Day ${dayIndex + 1} - ${timeKey}`;
              })()}
            </span>

            <span
              style={{
                color: darkMode ? "#9ca3af" : "#6b7280",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              ({currentMinute + 1} / {totalMinutes})
            </span>
          </div>

          {/* Table Section */}
          <div
            style={{
              marginBottom: "16px",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `2px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: darkMode ? "#f9fafb" : "#111827",
                      fontSize: "14px",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      fontWeight: 600,
                      color: darkMode ? "#f9fafb" : "#111827",
                      fontSize: "14px",
                    }}
                  >
                    Time
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: darkMode ? "#f9fafb" : "#111827",
                      fontSize: "14px",
                    }}
                  >
                    Price (EUR/kWh)
                  </th>
                </tr>
              </thead>
              <tbody>
                {getTableData().map((row) => (
                  <tr
                    key={row.day}
                    style={{
                      borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: 600,
                        color: getDayColor(row.day).color,
                        fontSize: "14px",
                      }}
                    >
                      {row.day}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        color: darkMode ? "#0ea5e9" : "#0284c7",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {row.time}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: darkMode ? "#f9fafb" : "#111827",
                        fontSize: "14px",
                      }}
                    >
                      €{row.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chart Section */}
          <div style={{ touchAction: "none", flex: 1, minHeight: 0 }}>
            <ReactECharts
              option={chartOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
