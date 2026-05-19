"use client";

import React, { useState, useContext, useMemo, useEffect } from "react";
import { GlobalContext } from "../../context/GlobalContext";
import Layout from "../../components/Layout";
import ReactECharts from "echarts-for-react";

// Import all city data
import realtimeData from "../../data/realtime/realtime.json";

export default function RealTimePage() {
  const { darkMode, setDarkMode, mobileDevice, setMobileDevice } =
    useContext(GlobalContext);

  // State for dynamic chart
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayData, setDisplayData] = useState([]);
  const [selectedHour, setSelectedHour] = useState("00"); // Track selected hour
  const [updateSpeed, setUpdateSpeed] = useState(1); // Speed multiplier (1x-5x)
  const [timeWindow, setTimeWindow] = useState(60); // Time window in minutes (5, 10, 20, 40, 60, 120, 240)

  // Process realtime data
  const allDataPoints = useMemo(() => {
    const date = Object.keys(realtimeData)[0];
    const timeData = realtimeData[date];
    return Object.entries(timeData).map(([time, value]) => ({
      time,
      value: parseFloat(value),
    }));
  }, []);

  // Reset function
  const handleReset = () => {
    setIsRunning(false);
    setCurrentIndex(0);
    setDisplayData([]);
  };

  // Start/Stop toggle
  const handleToggle = () => {
    if (currentIndex >= allDataPoints.length) {
      handleReset();
    } else {
      setIsRunning(!isRunning);
    }
  };

  // Update chart every N seconds when running (based on updateSpeed)
  useEffect(() => {
    if (!isRunning) return;

    if (currentIndex >= allDataPoints.length) {
      setIsRunning(false);
      return;
    }

    // Speed multipliers: how many points to add per update
    const pointsPerUpdate = [5, 10, 15, 20, 25]; // 1x, 2x, 3x, 4x, 5x
    const updateInterval = 100; // Fixed 100ms interval for smooth animation
    
    const timer = setTimeout(() => {
      const step = pointsPerUpdate[updateSpeed - 1];
      const nextIndex = Math.min(currentIndex + step, allDataPoints.length);
      const newData = allDataPoints.slice(0, nextIndex);
      setDisplayData(newData);
      setCurrentIndex(nextIndex);
      
      // Update selected hour based on current data point
      if (newData.length > 0) {
        const lastPoint = newData[newData.length - 1];
        const hour = lastPoint.time.substring(0, 2);
        setSelectedHour(hour);
      }
    }, updateInterval);

    return () => clearTimeout(timer);
  }, [isRunning, currentIndex, allDataPoints, updateSpeed]);

  // Update display data when slider is moved
  useEffect(() => {
    if (!isRunning && currentIndex > 0) {
      const newData = allDataPoints.slice(0, currentIndex);
      setDisplayData(newData);
      
      // Auto-update selected hour based on current data point
      if (newData.length > 0) {
        const lastPoint = newData[newData.length - 1];
        const hour = lastPoint.time.substring(0, 2);
        setSelectedHour(hour);
      }
    }
  }, [currentIndex, allDataPoints, isRunning]);

  // Prepare chart options
  const chartOptions = useMemo(() => {
    // Helper function to convert hex to rgba
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // Filter data based on time window (show last N minutes from current position)
    let windowedData = displayData;
    if (displayData.length > 0 && timeWindow > 0) {
      const pointsPerMinute = 12; // 12 points per minute (5-second intervals)
      const pointsInWindow = timeWindow * pointsPerMinute;
      const startIndex = Math.max(0, displayData.length - pointsInWindow);
      windowedData = displayData.slice(startIndex);
    }
    
    const times = windowedData.map((d) => d.time);
    const values = windowedData.map((d) => d.value);

    // Create all hours for legend (00-23)
    const allHours = Array.from({ length: 24 }, (_, i) => 
      i.toString().padStart(2, '0')
    );

    // Color for selected hour
    const colors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
      "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
      "#6366f1", "#84cc16", "#a855f7", "#06b6d4",
      "#22c55e", "#eab308", "#f43f5e", "#8b5cf6",
      "#14b8a6", "#f59e0b", "#3b82f6", "#10b981",
      "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"
    ];

    const selectedColor = colors[parseInt(selectedHour) % colors.length];

    // Create mark lines for every 5 minutes (from windowed data)
    const timeMarkLines = [];
    const fiveMinuteIntervals = windowedData.filter((point, index) => {
      const [h, m, s] = point.time.split(':').map(Number);
      return m % 5 === 0 && s === 0;
    });

    fiveMinuteIntervals.forEach((point) => {
      timeMarkLines.push({
        name: point.time,
        xAxis: point.time,
        lineStyle: {
          color: darkMode ? "#4b5563" : "#cbd5e1",
          width: 1,
          type: "dashed",
        },
        label: {
          show: false,
        },
      });
    });

    return {
      animation: false,
      backgroundColor: darkMode ? "#1f2937" : "#fff",
      title: {
        text: `Real-Time Energy Consumption - Hour ${selectedHour}:00`,
        left: "center",
        textStyle: {
          color: darkMode ? "#f3f4f6" : "#111827",
          fontSize: 20,
          fontWeight: "bold",
        },
      },
      tooltip: {
        trigger: "axis",
        position: (pt) => [pt[0], "10%"],
        backgroundColor: darkMode ? "#374151" : "#fff",
        borderColor: darkMode ? "#4b5563" : "#e5e7eb",
        textStyle: {
          color: darkMode ? "#f3f4f6" : "#111827",
        },
        formatter: function (params) {
          if (params.length > 0) {
            const param = params[0];
            return `<b>Time: ${param.name}</b><br/>${param.marker}Energy: ${param.value} MW`;
          }
          return "";
        },
      },
      toolbox: {
        top: 10,
        right: 10,
        feature: {
          dataZoom: {
            yAxisIndex: "none",
            title: {
              zoom: "Zoom",
              back: "Reset Zoom",
            },
          },
          magicType: {
            type: ["line", "bar"],
            title: {
              line: "Line Chart",
              bar: "Bar Chart",
            },
          },
          saveAsImage: {
            title: "Save as Image",
            name: `realtime_hour_${selectedHour}`,
          },
        },
        iconStyle: {
          borderColor: darkMode ? "#9ca3af" : "#6b7280",
        },
        emphasis: {
          iconStyle: {
            borderColor: darkMode ? "#f3f4f6" : "#111827",
          },
        },
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: 80,
        top: 60,
        containLabel: true,
      },
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
        {
          type: "slider",
          start: 0,
          end: 100,
          startValue: windowedData.length > 0 ? windowedData[0].time : undefined,
          endValue: windowedData.length > 0 ? windowedData[windowedData.length - 1].time : undefined,
          textStyle: { color: darkMode ? "#9ca3af" : "#666" },
          borderColor: darkMode ? "#374151" : "#ccc",
          fillerColor: darkMode ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)",
          backgroundColor: darkMode ? "#1f2937" : "#f8f8f8",
          handleStyle: {
            color: darkMode ? "#3b82f6" : "#3b82f6",
          },
          dataBackground: {
            lineStyle: {
              color: darkMode ? "#4b5563" : "#d1d5db",
            },
            areaStyle: {
              color: darkMode ? "#374151" : "#e5e7eb",
            },
          },
        },
      ],
      xAxis: {
        type: "category",
        data: times,
        boundaryGap: false,
        axisLabel: {
          color: darkMode ? "#9ca3af" : "#6b7280",
          rotate: 45,
          interval: Math.floor(windowedData.length / 8) || 0,
          formatter: "{value}",
        },
        axisLine: {
          lineStyle: {
            color: darkMode ? "#4b5563" : "#e5e7eb",
          },
        },
        name: "Time",
        nameLocation: "middle",
        nameGap: 50,
        nameTextStyle: {
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontSize: 14,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Energy (MW)",
        nameLocation: "middle",
        nameGap: 50,
        nameTextStyle: {
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontSize: 14,
        },
        min: 9,
        boundaryGap: [0, "10%"],
        axisLabel: {
          color: darkMode ? "#9ca3af" : "#6b7280",
          formatter: (val) => val.toFixed(1) + " MW",
        },
        axisLine: {
          lineStyle: {
            color: darkMode ? "#4b5563" : "#e5e7eb",
          },
        },
        splitLine: {
          lineStyle: {
            color: darkMode ? "#374151" : "#f3f4f6",
          },
        },
      },
      series: [
        {
          name: `${selectedHour}:00`,
          type: "line",
          data: values,
          smooth: true,
          symbol: "circle",
          symbolSize: 4,
          lineStyle: {
            color: selectedColor,
            width: 2.5,
          },
          itemStyle: {
            color: selectedColor,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: hexToRgba(selectedColor, 0.3),
                },
                {
                  offset: 1,
                  color: hexToRgba(selectedColor, 0.05),
                },
              ],
            },
          },
          markPoint: {
            data: [
              {
                type: "max",
                name: "Max",
                label: {
                  formatter: (p) => `${p.value.toFixed(1)} MW`,
                  color: darkMode ? "#f3f4f6" : "#111827",
                  fontSize: 10,
                  fontWeight: 600,
                },
                itemStyle: {
                  color: "#ef4444",
                },
              },
              {
                type: "min",
                name: "Min",
                label: {
                  formatter: (p) => `${p.value.toFixed(1)} MW`,
                  color: darkMode ? "#f3f4f6" : "#111827",
                  fontSize: 10,
                  fontWeight: 600,
                },
                itemStyle: {
                  color: "#10b981",
                },
              },
            ],
            symbol: "pin",
            symbolSize: 50,
          },
          markLine: timeMarkLines.length > 0 ? {
            symbol: "none",
            data: timeMarkLines,
            silent: true,
          } : undefined,
        },
      ],
    };
  }, [displayData, darkMode, mobileDevice, selectedHour, timeWindow]);

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
          {/* Control Panel */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
              alignItems: "center",
              flexWrap: "wrap",
              padding: "12px",
              background: darkMode ? "#111827" : "#f9fafb",
              borderRadius: "8px",
              border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
            }}
          >
            <button
              onClick={handleToggle}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: isRunning ? "#ef4444" : "#3b82f6",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
            >
              {currentIndex >= allDataPoints.length
                ? "Restart"
                : isRunning
                ? "⏸ Pause"
                : "▶ Start"}
            </button>

            <button
              onClick={handleReset}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                background: darkMode ? "#374151" : "#fff",
                color: darkMode ? "#f3f4f6" : "#111827",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = darkMode
                  ? "#4b5563"
                  : "#f9fafb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = darkMode
                  ? "#374151"
                  : "#fff";
              }}
            >
              ↺ Reset
            </button>

            {/* Speed Control */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "6px",
                background: darkMode ? "#374151" : "#e5e7eb",
                minWidth: mobileDevice ? "100%" : "200px",
              }}
            >
              <span
                style={{
                  color: darkMode ? "#f3f4f6" : "#111827",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Speed:
              </span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={updateSpeed}
                onChange={(e) => setUpdateSpeed(parseInt(e.target.value))}
                style={{
                  flex: 1,
                  color: "#10b981",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  color: darkMode ? "#f3f4f6" : "#111827",
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: "30px",
                  textAlign: "center",
                }}
              >
                {updateSpeed}x
              </span>
            </div>

            {/* Time Window Control */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "6px",
                background: darkMode ? "#374151" : "#e5e7eb",
                minWidth: mobileDevice ? "100%" : "220px",
              }}
            >
              <span
                style={{
                  color: darkMode ? "#f3f4f6" : "#111827",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Window:
              </span>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={[5, 10, 20, 40, 60, 120, 240].indexOf(timeWindow)}
                onChange={(e) => {
                  const windows = [5, 10, 20, 40, 60, 120, 240];
                  setTimeWindow(windows[parseInt(e.target.value)]);
                }}
                style={{
                  flex: 1,
                  color: "#f59e0b",
                  cursor: "pointer",
                }}
              />
              <span
                style={{
                  color: darkMode ? "#f3f4f6" : "#111827",
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: "35px",
                  textAlign: "center",
                }}
              >
                {timeWindow < 60 ? `${timeWindow}m` : `${timeWindow / 60}h`}
              </span>
            </div>

            {/* Timeline Slider */}
            <div
              style={{
                flex: 1,
                minWidth: mobileDevice ? "100%" : "200px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <input
                type="range"
                min="0"
                max={allDataPoints.length - 1}
                step="720"
                value={currentIndex}
                list="hour-markers"
                onChange={(e) => {
                  const newIndex = parseInt(e.target.value);
                  setCurrentIndex(newIndex);
                  setIsRunning(false);
                }}
                style={{
                  width: "100%",
                  color: "#3b82f6",
                  cursor: "pointer",
                }}
              />
              <datalist id="hour-markers">
                {Array.from({ length: 25 }, (_, i) => (
                  <option key={i} value={i * 720} label={`${i}h`} />
                ))}
              </datalist>
              {/* <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "9px",
                  color: darkMode ? "#6b7280" : "#9ca3af",
                  paddingTop: "2px",
                }}
              >
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>24h</span>
              </div> */}
            </div>

            {/* Current Time Display */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                minWidth: "140px",
              }}
            >
              <div
                style={{
                  color: darkMode ? "#9ca3af" : "#6b7280",
                  ffontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {currentIndex > 0 && allDataPoints[currentIndex - 1]
                  ? allDataPoints[currentIndex - 1].time
                  : "00:00:00"}
              </div>
              <div
                style={{
                  color: darkMode ? "#d1d5db" : "#111827",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {/* {currentIndex} / {allDataPoints.length} */}
                {/* {isRunning && (
                  <span
                    style={{
                      color: "#3b82f6",
                      animation: "pulse 2s infinite",
                    }}
                  >
                    ● Live
                  </span>
                )} */}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {displayData.length > 0 ? (
              <ReactECharts
                option={chartOptions}
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: darkMode ? "#9ca3af" : "#6b7280",
                  fontSize: 18,
                }}
              >
                Click "Start" to begin real-time monitoring
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe animation for pulse effect */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }
        
        input[type="range"]::-webkit-slider-runnable-track {
          background: ${darkMode ? "linear-gradient(to right, #374151 0%, #4b5563 100%)" : "linear-gradient(to right, #e5e7eb 0%, #d1d5db 100%)"};
          height: 6px;
          border-radius: 3px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          margin-top: -5px;
        }
        
        input[type="range"]::-moz-range-track {
          background: ${darkMode ? "linear-gradient(to right, #374151 0%, #4b5563 100%)" : "linear-gradient(to right, #e5e7eb 0%, #d1d5db 100%)"};
          height: 6px;
          border-radius: 3px;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          border: none;
        }
        
        datalist {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        
        datalist option {
          padding: 0;
          font-size: 8px;
        }
      `}</style>
    </Layout>
  );
}
