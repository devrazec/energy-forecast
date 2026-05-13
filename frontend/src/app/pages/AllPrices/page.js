"use client";

import React, { useState, useContext, useMemo, useEffect } from "react";
import { GlobalContext } from "../../context/GlobalContext";
import Layout from "../../components/Layout";
import ReactECharts from "echarts-for-react";
import lisbonData from "../../data/consumption/lisbon.json";
import lisbonForecast from "../../data/forecast/pandas/lisbon.json";

export default function AllPricesPage() {
  const {
    darkMode,
    mobileDevice,
    dbCityPrice,
  } = useContext(GlobalContext);

  // State for dynamic minute display
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentMinute((prev) => {
        if (prev >= 1439) {
          setIsPlaying(false);
          return 1439; // 23:59
        }
        return prev + 1;
      });
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isPlaying]);

  const chartOption = useMemo(() => {
    if (!lisbonData || !lisbonForecast) {
      return {};
    }

    const isMobile = !!mobileDevice;
    
    // Use Lisbon data for both consumption and forecast
    // Get available dates from consumption data
    const consumptionDates = Object.keys(lisbonData.Lisbon).sort();
    
    // Get forecast dates
    const forecastDates = Object.keys(lisbonForecast.Lisbon).sort();
    
    // Get hourly time keys from first consumption data
    const firstConsumptionDate = consumptionDates[0];
    const consumptionHourData = lisbonData.Lisbon[firstConsumptionDate];
    const allHours = Object.keys(consumptionHourData).sort();
    
    // Convert to minutes for dynamic display (each hour = 60 minutes)
    const allMinutes = [];
    allHours.forEach((hour) => {
      const [h, m] = hour.split(':').map(Number);
      for (let min = 0; min < 60; min++) {
        allMinutes.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    });
    
    // Limit data display to current minute for dynamic view
    const displayMinutes = allMinutes.slice(0, currentMinute + 1);

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

    // Create hour markers (every 60 minutes)
    const hourMarkers = [];
    for (let i = 0; i < 24; i++) {
      const timeKey = `${i.toString().padStart(2, '0')}:00`;
      if (displayMinutes.includes(timeKey)) {
        hourMarkers.push({
          name: timeKey,
          xAxis: timeKey,
          lineStyle: {
            color: darkMode ? '#4b5563' : '#cbd5e1',
            width: 1,
            type: 'solid'
          },
          label: {
            show: true,
            formatter: '{b}',
            position: 'insideEndTop',
            color: darkMode ? '#9ca3af' : '#94a3b8',
            fontSize: 10,
            fontWeight: 600
          }
        });
      }
    }

    // Color palette for different days
    const dayColors = [
      { color: '#0ea5e9', rgba: '14, 165, 233' },   // sky blue
      { color: '#8b5cf6', rgba: '139, 92, 246' },   // purple
      { color: '#ec4899', rgba: '236, 72, 153' },   // pink
      { color: '#f59e0b', rgba: '245, 158, 11' },   // amber
      { color: '#06b6d4', rgba: '6, 182, 212' },    // cyan
      { color: '#f97316', rgba: '249, 115, 22' },   // orange
      { color: '#6366f1', rgba: '99, 102, 241' },   // indigo
      { color: '#10b981', rgba: '16, 185, 129' },   // green (for forecast)
    ];

    const series = [];
    const legendData = [];

    // Create series for all consumption dates
    consumptionDates.forEach((date, index) => {
      const hourData = lisbonData.Lisbon[date];
      const data = displayMinutes.map(minute => 
        interpolateMinuteValue(hourData, minute)
      );
      
      const colorInfo = dayColors[index % dayColors.length];
      const seriesName = `Consumption (${date})`;
      legendData.push(seriesName);

      const seriesConfig = {
        name: seriesName,
        type: 'line',
        data: data,
        smooth: true,
        showSymbol: false,
        symbolSize: 4,
        color: colorInfo.color,
        lineStyle: {
          width: 2,
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
              { offset: 0, color: `rgba(${colorInfo.rgba}, 0.15)` },
              { offset: 1, color: `rgba(${colorInfo.rgba}, 0.01)` }
            ]
          }
        },
        connectNulls: true,
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
      };

      // Add hour markers only to the first series
      if (index === 0 && hourMarkers.length > 0) {
        seriesConfig.markLine = {
          symbol: 'none',
          data: hourMarkers
        };
      }

      series.push(seriesConfig);
    });

    // Create series for all forecast dates
    forecastDates.forEach((date, index) => {
      const hourData = lisbonForecast.Lisbon[date];
      const data = displayMinutes.map(minute => 
        interpolateMinuteValue(hourData, minute)
      );
      
      const seriesName = `Forecast (${date})`;
      legendData.push(seriesName);

      series.push({
        name: seriesName,
        type: 'line',
        data: data,
        smooth: true,
        showSymbol: false,
        symbolSize: 4,
        color: '#ef4444',
        lineStyle: {
          width: 2.5,
          type: 'dashed'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.01)' }
            ]
          }
        },
        connectNulls: true,
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
      });
    });

    // Format current time display
    const currentHour = Math.floor(currentMinute / 60);
    const currentMin = currentMinute % 60;
    const timeDisplay = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

    return {
      backgroundColor: 'transparent',
      title: {
        text: `Lisbon Electricity Prices - All Days (${timeDisplay})`,
        subtext: `${consumptionDates.length} consumption days + ${forecastDates.length} forecast day(s)`,
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
          let result = `Time: ${params[0].axisValue}<br/>`;
          params.forEach(param => {
            if (param.value !== null && param.value !== undefined) {
              result += `${param.marker}${param.seriesName}: €${param.value.toFixed(4)}/kWh<br/>`;
            }
          });
          return result;
        },
        backgroundColor: darkMode ? '#1f2937' : '#fff',
        borderColor: darkMode ? '#374151' : '#ccc',
        textStyle: { color: darkMode ? '#d1d5db' : '#333' }
      },
      legend: {
        data: legendData,
        orient: 'vertical',
        top: 'middle',
        right: 0,
        textStyle: { color: darkMode ? '#d1d5db' : '#333' },
        type: 'scroll',
        pageIconSize: 12,
        pageTextStyle: { color: darkMode ? '#9ca3af' : '#666' }
      },
      grid: isMobile
        ? { left: 10, right: 100, bottom: 100, top: 60, containLabel: true }
        : { left: 60, right: 190, bottom: 80, top: 60, containLabel: false },
      toolbox: {
        top: 10,
        feature: {
          dataZoom: { yAxisIndex: 'none' },
          magicType: { type: ['line', 'bar'] },
          saveAsImage: {}
        }
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
        min: 11.0,
        boundaryGap: [0, '20%'],
        axisLabel: {
          formatter: (val) => '€' + val.toFixed(4),
          color: darkMode ? '#9ca3af' : '#666'
        },
        splitLine: { lineStyle: { color: darkMode ? '#374151' : '#f0f0f0' } }
      },
      dataZoom: [
        { 
          type: 'inside', 
          start: Math.max(0, (currentMinute / 1440) * 100 - 100), 
          end: Math.min(100, (currentMinute / 1440) * 100 + 100)
        },
        {
          type: 'slider',
          start: 0,
          end: 70,
          textStyle: { color: darkMode ? '#9ca3af' : '#666' },
          borderColor: darkMode ? '#374151' : '#ccc',
          fillerColor: darkMode ? 'rgba(55,65,81,0.5)' : 'rgba(0,139,193,0.1)',
          backgroundColor: darkMode ? '#1f2937' : '#f8f8f8'
        }
      ],
      series: series
    };
  }, [dbCityPrice, darkMode, mobileDevice, currentMinute]);

  return (
    <Layout>
      <div
        style={{
          padding: "24px 24px 24px 24px",
          overflowY: "auto",
          height: "100%",
          background: darkMode ? "#111827" : undefined,
        }}
      >
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
              max="1439"
              value={currentMinute}
              onChange={(e) => {
                setCurrentMinute(parseInt(e.target.value));
                setIsPlaying(false);
              }}
              style={{
                flex: 1,
                accentColor: "#0ea5e9",
              }}
            />

            <span
              style={{
                color: darkMode ? "#d1d5db" : "#333",
                fontWeight: 600,
                fontSize: "14px",
                minWidth: "100px",
                textAlign: "right",
              }}
            >
              {Math.floor(currentMinute / 60).toString().padStart(2, '0')}:
              {(currentMinute % 60).toString().padStart(2, '0')}
            </span>

            <span
              style={{
                color: darkMode ? "#9ca3af" : "#6b7280",
                fontSize: "12px",
              }}
            >
              ({currentMinute + 1} / 1440 min)
            </span>
          </div>

          {/* Chart */}
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
